# Code Audit: Hooks Folder

**Audit Date:** 2026-01-07  
**Auditor:** Systems Engineering Analysis  
**Scope:** `src/hooks/` directory  
**Charter Reference:** `DOCS/SYSTEMS_ENGINEERING_CHARTER.md`

---

## Executive Summary

The `src/hooks/` folder contains **1 core hook** (`useLocalStorage.ts`) that serves as the **primary state persistence layer** for the entire application. This hook manages:
- User profile data (`csc_student_profile_v1`)
- Financial data (`csc_financials_v1`)

**Overall Assessment:**  
✅ **STRONG FOUNDATION** — This is **exceptionally well-engineered** for a frontend-only application.  
⚠️ **CRITICAL GAPS** — Missing quota handling, multi-tab conflict resolution, and corruption recovery.

**Key Finding:**  
The `useLocalStorage` hook demonstrates **strong defensive programming** with Zod validation, error handling, and multi-tab synchronization. However, it **stops working under specific failure conditions** that are not handled.

---

## Detailed Analysis: `useLocalStorage.ts`

### Purpose
Type-safe localStorage wrapper with runtime validation, error handling, and cross-tab synchronization.

### Charter Compliance Review

| Principle | Status | Analysis |
|-----------|--------|----------|
| **Failure-First Reasoning** | ✅ EXCELLENT | Validates all reads, handles parse errors, provides error state |
| **User Feedback** | ⚠️ PARTIAL | Returns error, but consumers don't display it to user |
| **Idempotency** | ⚠️ PARTIAL | `setValue` is idempotent, but lacks deduplication for rapid-fire updates |
| **Rate Limiting** | ❌ MISSING | No throttling for high-frequency writes (quota exhaustion risk) |
| **Observability** | ⚠️ PARTIAL | Logs to console, but no structured logging or metrics |
| **Security** | ✅ GOOD | Validates all inputs with Zod, no script injection vectors |
| **Recovery** | ⚠️ PARTIAL | Falls back to `initialValue` on corruption, but doesn't notify user |

---

## Failure Mode Analysis

### 1. **LocalStorage Quota Exceeded**

**Failure Condition:**  
User stores >5MB of data (typical quota) → `setItem()` throws `QuotaExceededError`

**Current Behavior:**
```typescript
// Line 74: Catches error but does NOT clear space
catch (error) {
    console.error(`LocalStorage Write Error for key "${key}":`, error);
    setError(error instanceof Error ? error : new Error(String(error)));
}
```

**Blast Radius:**
- ❌ Write silently fails
- ✅ Error state is set (but not used by consumers)
- ❌ No recovery mechanism (user data lost)
- ❌ Subsequent writes continue to fail until user manually clears storage

**User Impact:**
- User makes changes → appears to save → refresh → changes gone
- **Silent data loss** (critical)

**When It Fails:**
- User has multiple profiles with large expense lists
- Browser has low remaining quota from other sites
- User never clears browser data

**Recommended Fix:**
```typescript
catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Attempt LRU eviction or notify user
        console.error('LocalStorage quota exceeded. Consider clearing old data.');
        setError(new Error('Storage full. Please clear some data to continue.'));
        
        // Optional: Implement auto-cleanup of oldest entries
        // cleanupOldestEntries(key);
    } else {
        setError(error instanceof Error ? error : new Error(String(error)));
    }
}
```

---

### 2. **Multi-Tab Race Condition**

**Failure Condition:**  
User opens 2 tabs → updates same profile field in both → last write wins, first update lost

**Current Behavior:**
```typescript
// Lines 80-117: Listens to storage events, but doesn't resolve conflicts
const handleStorageChange = (e: Event) => {
    // Unconditionally overwrites local state
    setStoredValue(result.data);
};
```

**Blast Radius:**
- ❌ Non-deterministic state (depends on write order)
- ❌ User expects Tab A changes to persist, but Tab B overwrites them
- ⚠️ No "last write wins" timestamp or conflict detection

**User Impact:**
- Tab A: User updates balance to 5000
- Tab B: User updates name to "John"
- Result: Name changes persist, balance change lost
- **Confusing UX** — users cannot predict which tab's changes survive

**When It Fails:**
- User has multiple tabs open (common scenario)
- User switches between tabs to compare data
- Auto-save triggers simultaneously in both tabs

**Recommended Fix:**
```typescript
// Add version/timestamp to all stored data
export const VersionedDataSchema = z.object({
    version: z.number(),
    timestamp: z.number(),
    data: z.unknown()
});

// In updateState:
const updateState = (rawValue: string) => {
    const parsed = JSON.parse(rawValue);
    const result = schema.safeParse(parsed);
    
    if (result.success) {
        // Only update if incoming version is newer
        if (!storedValue || result.data.timestamp > storedValue.timestamp) {
            setStoredValue(result.data.data);
        } else {
            // Conflict detected - could trigger merge UI
            console.warn('Conflict detected: local version is newer');
        }
    }
};
```

**Alternative: Operational Transform (Complex)**
- Implement CRDT-like merge logic (e.g., array appends always merge)
- Use BroadcastChannel API for immediate same-origin tab sync

---

### 3. **Corrupted JSON Recovery**

**Failure Condition:**  
User manually edits localStorage → invalid JSON → parse fails

**Current Behavior:**
```typescript
// Lines 48-50: Falls back to initialValue
catch (error) {
    console.error(`LocalStorage Read Error for key "${key}":`, error);
    return initialValue;
}
```

**Blast Radius:**
- ✅ App doesn't crash (good!)
- ⚠️ User loses ALL data for that key (severe)
- ❌ No backup or recovery prompt

**User Impact:**
- User has weeks of financial data
- Browser extension corrupts localStorage
- User refreshes → all data gone, no recovery option
- **Catastrophic data loss**

**When It Fails:**
- User installs malicious/buggy browser extension
- Browser bug during write (rare but documented)
- User manually edits storage in DevTools

**Recommended Fix:**
```typescript
// Add backup mechanism
const [storedValue, setStoredValue] = useState<T>(() => {
    try {
        const item = window.localStorage.getItem(key);
        if (!item) return initialValue;
        
        const parsed = JSON.parse(item);
        const result = schema.safeParse(parsed);
        
        if (result.success) {
            return result.data;
        } else {
            // Attempt recovery from backup key
            const backup = window.localStorage.getItem(`${key}_backup`);
            if (backup) {
                const backupParsed = JSON.parse(backup);
                const backupResult = schema.safeParse(backupParsed);
                if (backupResult.success) {
                    console.warn('Restored from backup');
                    return backupResult.data;
                }
            }
            
            // Log corruption for debugging
            console.error('Corruption detected, no backup available');
            return initialValue;
        }
    } catch (error) {
        // Same backup attempt logic
    }
});

// In setValue, write backup
const setValue = useCallback((value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    
    // Write backup BEFORE writing primary (atomic-ish)
    window.localStorage.setItem(`${key}_backup`, window.localStorage.getItem(key) || '');
    window.localStorage.setItem(key, JSON.stringify(valueToStore));
}, [key, storedValue]);
```

---

### 4. **Infinite Re-render Loop**

**Failure Condition:**  
`setValue` depends on `storedValue` → calling `setValue` with function updater re-creates callback → triggers effect

**Current Behavior:**
```typescript
// Line 77: storedValue in dependency array
const setValue = useCallback((value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    // ...
}, [key, storedValue]); // ⚠️ storedValue changes → callback re-created
```

**Blast Radius:**
- ⚠️ `setValue` reference changes on every `storedValue` change
- ❌ If consumer uses `setValue` in `useEffect` dependency array → infinite loop

**User Impact:**
- Component calling `setValue` in effect → browser tab freezes
- **App crash** (high severity)

**When It Fails:**
```typescript
// Consumer code:
useEffect(() => {
    setValue(prev => ({ ...prev, visits: prev.visits + 1 }));
}, [setValue]); // ❌ setValue changes → effect runs → state changes → setValue changes → loop
```

**Recommended Fix:**
```typescript
// Remove storedValue from dependencies, use functional update only
const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue(prev => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        
        // Side effect: save to localStorage
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            window.dispatchEvent(new Event('local-storage'));
        }
        
        return valueToStore;
    });
}, [key]); // ✅ Only depends on key
```

**Rationale:**  
Using `setStoredValue` functional form eliminates need for `storedValue` in dependency array.

---

### 5. **Custom Event Dispatch Timing**

**Failure Condition:**  
`dispatchEvent` fires before `localStorage.setItem` completes → listeners read stale data

**Current Behavior:**
```typescript
// Lines 69-71: No guarantee of write completion
window.localStorage.setItem(key, JSON.stringify(valueToStore));
window.dispatchEvent(new Event('local-storage')); // ⚠️ Fires immediately
```

**Blast Radius:**
- ⚠️ Other components read `localStorage` before write completes (race condition)
- ⚠️ Manifest only in very fast clicks/updates

**User Impact:**
- User clicks "Save" rapidly → some clicks see old data
- **Flicker in UI** (low severity but confusing)

**When It Fails:**
- High-frequency updates (e.g., slider dragging)
- Slow browser on low-end device

**Recommended Fix:**
```typescript
// Use queueMicrotask or setTimeout to ensure write completes
window.localStorage.setItem(key, JSON.stringify(valueToStore));
queueMicrotask(() => {
    window.dispatchEvent(new Event('local-storage'));
});
```

**Alternative:**  
Use `BroadcastChannel` API (better than custom events):
```typescript
const channel = new BroadcastChannel('localStorage-sync');
channel.postMessage({ key, value: valueToStore });
```

---

### 6. **Schema Migration Not Supported**

**Failure Condition:**  
App v2 changes schema → old data in localStorage → validation fails → data lost

**Current Behavior:**
```typescript
// Lines 39-46: Validation fails → falls back to initialValue
if (result.success) {
    return result.data;
} else {
    console.error(`LocalStorage Validation Error for key "${key}":`, result.error);
    return initialValue; // ❌ Old data discarded
}
```

**Blast Radius:**
- ❌ App update → all user data lost
- ❌ No migration path

**User Impact:**
- User upgrades app → all profiles/expenses gone
- **Catastrophic data loss on every schema change**

**When It Fails:**
- Adding new required field to `StudentProfileSchema`
- Renaming field (e.g., `cheapestMealCost` → `avgMealCost`)
- Changing enum values

**Recommended Fix:**
```typescript
// Versioned schema approach
export const StudentProfileSchemaV1 = z.object({ /* old fields */ });
export const StudentProfileSchemaV2 = z.object({ /* new fields */ });

const migrations = {
    1: (data: z.infer<typeof StudentProfileSchemaV1>) => {
        // Transform v1 -> v2
        return { ...data, newField: 'default' };
    }
};

// In useLocalStorage init:
const parsed = JSON.parse(item);
const version = parsed._version || 1;

if (version < CURRENT_VERSION) {
    // Run migrations
    let migrated = parsed;
    for (let v = version; v < CURRENT_VERSION; v++) {
        migrated = migrations[v](migrated);
    }
    // Validate migrated data
    const result = schema.safeParse(migrated);
    if (result.success) {
        setValue({ ...result.data, _version: CURRENT_VERSION });
        return result.data;
    }
}
```

---

## Consumer Analysis: `useStudentProfile` and `useFinancials`

### `useStudentProfile` Hook

**Location:** `src/features/user-profile/hooks.ts`

#### Identified Gaps

1. **Destructive Operation Without Confirmation**
   - Line 47: `resetProfile()` clears all data with no undo
   - **Failure Mode:** User accidentally clicks "Logout" → all data gone
   - **Blast Radius:** Complete profile loss, no recovery
   - **Recommended Fix:** Add confirmation dialog or soft-delete with 30-day retention

2. **Date Serialization Risk**
   - Lines 23-24: `new Date()` stored in localStorage
   - **Failure Mode:** Zod coerces to date, but if JSON.stringify fails, date becomes string
   - **Current Mitigation:** `z.coerce.date()` handles this ✅
   - **Still Risk:** Date timezone issues (stored as ISO string, displayed in different timezone)

3. **UUID Fallback is Weak**
   - Line 22: `crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`
   - **Failure Mode:** Old browser → non-unique ID if created in same millisecond
   - **Recommended Fix:** Use `nanoid` or `uuidv4` polyfill

4. **No Validation on `createProfile` Input**
   - Line 19: Accepts `Omit<StudentProfile, 'id' | 'createdAt' | 'lastUpdated'>`
   - **Failure Mode:** Caller passes invalid data (e.g., negative balance) → stored anyway
   - **Recommended Fix:**
     ```typescript
     const createProfile = (data: Omit<StudentProfile, 'id' | 'createdAt' | 'lastUpdated'>) => {
         // Validate input before creating
         const inputSchema = StudentProfileSchema.omit({ id: true, createdAt: true, lastUpdated: true });
         const validated = inputSchema.parse(data); // Throws if invalid
         // ... rest of logic
     };
     ```

---

### `useFinancials` Hook

**Location:** `src/features/runway-calculator/hooks.ts`

#### Identified Gaps

1. **No Duplicate Detection**
   - Lines 22-26: `addFixedExpense` blindly appends
   - **Failure Mode:** User double-clicks "Add Expense" → duplicate entry
   - **Blast Radius:** Incorrect runway calculation, confusing UI
   - **Recommended Fix:**
     ```typescript
     const addFixedExpense = (expense: FixedExpense) => {
         setData(prev => {
             // Check for duplicate ID
             if (prev.fixedExpenses.some(e => e.id === expense.id)) {
                 console.warn('Duplicate expense ID, skipping');
                 return prev; // Idempotent
             }
             return {
                 ...prev,
                 fixedExpenses: [...prev.fixedExpenses, expense]
             };
         });
     };
     ```

2. **Array Mutation Risk in Runway Calculation**
   - Lines 82-88: Passes `fixedExpenses` and `incomeEvents` arrays directly to `RunwayLogic`
   - **Failure Mode:** If `RunwayLogic.calculateRunway` mutates input arrays → localStorage corrupted
   - **Current Mitigation:** Depends on `RunwayLogic` being pure (not verified)
   - **Recommended Fix:** Deep clone before passing:
     ```typescript
     const result = RunwayLogic.calculateRunway({
         fixedExpenses: structuredClone(fixedExpenses),
         incomeEvents: structuredClone(incomeEvents),
         // ...
     });
     ```

3. **No Bounds Checking**
   - Lines 79-87: `cheapestMealCost * dailyVariableMultiplier` unchecked
   - **Failure Mode:** User enters `cheapestMealCost = 1000000` → calculation overflows/unrealistic
   - **Recommended Fix:** Add sanity checks:
     ```typescript
     const MAX_REALISTIC_DAILY_SPEND = 10000; // Adjust based on use case
     const estimatedDailySpend = Math.min(
         MAX_REALISTIC_DAILY_SPEND,
         Math.ceil(profile.cheapestMealCost * dailyVariableMultiplier)
     );
     ```

---

## Observability Gaps

### Missing Instrumentation

1. **No Write Latency Tracking**
   - Cannot detect slow localStorage writes (indicates quota near-full)
   - **Recommended:** Log `performance.now()` before/after writes

2. **No Corruption Rate Metrics**
   - Cannot quantify how often validation fails
   - **Recommended:** Track `validationFailures / totalReads`

3. **No User-Facing Error Display**
   - Hook returns `error`, but no consumer displays it
   - **Recommended:** Create `<StorageErrorBanner />` component

4. **No Export/Import for Recovery**
   - User cannot backup data or restore from file
   - **Recommended:** Add JSON export/import buttons in settings

---

## Security Assessment

### ✅ Strong Points

1. **Input Validation:** All reads validated with Zod
2. **No Eval:** No dynamic code execution
3. **XSS Prevention:** React escapes all rendered content

### ⚠️ Potential Risks

1. **No Data Encryption**
   - localStorage is plaintext → accessible to all scripts
   - **Impact:** If user stores sensitive notes, any script can read them
   - **Mitigation:** Document that sensitive data should not be stored
   - **Future:** Use Web Crypto API to encrypt before storing

2. **No CSRF Protection**
   - If future feature adds sync to backend, localStorage values could be exfiltrated
   - **Mitigation:** Not applicable (no backend yet)

---

## Prioritized Remediation Roadmap

### Phase 1: Critical (Prevents Data Loss)

1. **Fix Quota Exceeded Handling** — Add graceful degradation  
   **Effort:** 30 min | **Impact:** Prevents silent data loss

2. **Add Backup Key** — Write `{key}_backup` before each update  
   **Effort:** 20 min | **Impact:** Recovery from corruption

3. **Fix `setValue` Infinite Loop** — Remove `storedValue` from dependencies  
   **Effort:** 10 min | **Impact:** Prevents app crashes

4. **Add Export/Import** — JSON download/upload for user backup  
   **Effort:** 1 hour | **Impact:** User can manually backup data

### Phase 2: Important (Improves UX)

5. **Implement Schema Migrations** — Preserve data across app updates  
   **Effort:** 2 hours | **Impact:** No data loss on schema changes

6. **Add Duplicate Detection** — Prevent double-add in `useFinancials`  
   **Effort:** 20 min | **Impact:** Cleaner data, idempotent operations

7. **Display Error State** — Show `<StorageErrorBanner />` to user  
   **Effort:** 45 min | **Impact:** User knows when saves fail

### Phase 3: Enhancement (Edge Cases)

8. **Multi-Tab Conflict Resolution** — Timestamp-based or merge UI  
   **Effort:** 3 hours | **Impact:** Better multi-tab UX

9. **Add Write Throttling** — Debounce high-frequency saves  
   **Effort:** 30 min | **Impact:** Reduces quota churn

10. **Implement Encryption** — Encrypt sensitive fields  
    **Effort:** 4 hours | **Impact:** Improved privacy

---

## Conclusion

The **`useLocalStorage` hook is the most critical piece of infrastructure** in this codebase. It is **well-designed** with strong validation and error handling, but **fails silently under quota exhaustion, corruption, and multi-tab conflicts**.

**Assessment Grade:** **A-**  
**Rationale:** Excellent defensive programming, but missing production-grade failure recovery.

---

## Charter Compliance Summary

- ✅ **Failure modes identified:** Quota, corruption, race conditions, infinite loops
- ✅ **Blast radius analyzed:** Data loss, app crash, silent failures
- ⚠️ **User feedback partial:** Error state exists but not displayed
- ⚠️ **Idempotency partial:** Read operations safe, write operations lack deduplication
- ❌ **Rate limiting missing:** No throttle on high-frequency writes
- ⚠️ **Observability partial:** Console logs only, no metrics
- ✅ **Security good:** Zod validation prevents injection
- ⚠️ **Recoverable partial:** Fallback to `initialValue`, but no backup mechanism

**Next Audit:** `src/features/` folder (business logic layer)
