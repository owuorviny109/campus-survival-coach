# Code Audit: Features Folder

**Audit Date:** 2026-01-07  
**Auditor:** Systems Engineering Analysis  
**Scope:** `src/features/` directory (runway-calculator, user-profile, campus-context)  
**Charter Reference:** `DOCS/SYSTEMS_ENGINEERING_CHARTER.md`

---

## Executive Summary

The `src/features/` folder contains **3 feature modules** implementing the core business logic:
1. **runway-calculator** — Financial runway projection engine
2. **user-profile** — Onboarding flow and profile management
3. **campus-context** — Context data types (no implementation yet)

**Overall Assessment:**  
⚠️ **MODERATE RISK** — Strong computational logic, but **critical gaps in failure handling, input validation, and user feedback**.

**Key Finding:**  
The **RunwayLogic calculation engine is robust**, but **form submissions lack idempotency guards, validation, and error handling**. The **OnboardingFlow has a documented state transition bug** (from conversation history: profile created but UI doesn't update).

---

## Feature 1: Runway Calculator

### Architecture Overview

**Purpose:** Calculate financial "runway" (days until broke) based on balance, expenses, and income.

**Components:**
- `logic.ts` — Pure calculation engine (127 lines)
- `hooks.ts` — State management layer
- `RunwayDashboard.tsx` — Read-only display
- `FinancialManager.tsx` — CRUD for expenses/income

---

### `RunwayLogic.calculateRunway()` Analysis

**Location:** `src/features/runway-calculator/logic.ts`

#### Charter Compliance Review

| Principle | Status | Analysis |
|-----------|--------|----------|
| **Failure-First Reasoning** | ✅ EXCELLENT | Handles negative balance, caps projection at 365 days |
| **User Feedback** | ✅ GOOD | Returns status ('good', 'warning', 'critical') |
| **Idempotency** | ✅ PASS | Pure function, no side effects |
| **Input Validation** | ❌ MISSING | No bounds checking on inputs |
| **Observability** | ⚠️ PARTIAL | No logging or instrumentation |
| **Security** | ✅ PASS | Pure math, no injection vectors |

---

#### Identified Gaps

### Gap 1: **Unchecked Inputs → Garbage Output**

**Failure Mode:** User enters absurd values → calculation produces meaningless results

**Current Behavior:**
```typescript
// Lines 15-26: No validation of inputs
static calculateRunway(params: {
    currentBalance: number;  // Could be NaN, Infinity, -1000000
    dailyVariableSpend: number;  // Could be negative or zero
    fixedExpenses: FixedExpense[];  // Could have invalid dueDay values
```

**Attack Scenarios:**
1. **NaN Injection:**
   ```typescript
   currentBalance: parseInt("abc") // NaN
   // Result: balance -= NaN → balance becomes NaN → infinite loop
   ```

2. **Negative Daily Spend:**
   ```typescript
   dailyVariableSpend: -100 // User gaining money per day?
   // Result: Runway = infinite days (balance increases daily)
   ```

3. **Invalid DueDay:**
   ```typescript
   fixedExpenses: [{ dueDay: 55, amount: 1000 }] // No month has day 55
   // Result: Expense never triggers, calculation wrong
   ```

4. **Infinity:**
   ```typescript
   currentBalance: Number.MAX_VALUE
   // Result: Calculation hangs for 365 days
   ```

**Blast Radius:**
- ❌ Wrong runway displayed to user → poor financial decisions
- ⚠️ Potential infinite loop if `balance` becomes `NaN` (though `maxDays` cap prevents this)
- ❌ User loses trust in application accuracy

**When It Fails:**
- User manually edits localStorage JSON
- Browser extension injects bad data
- Race condition during form submission creates partial state

**Recommended Fix:**
```typescript
static calculateRunway(params: {
    currentBalance: number;
    startDate: Date;
    fixedExpenses: FixedExpense[];
    incomeEvents: IncomeEvent[];
    dailyVariableSpend: number;
}): RunwayResult {
    // Input validation
    if (!Number.isFinite(params.currentBalance)) {
        throw new Error('Invalid balance: must be a finite number');
    }
    if (params.currentBalance < -1000000 || params.currentBalance > 100000000) {
        throw new Error('Balance out of realistic range');
    }
    if (!Number.isFinite(params.dailyVariableSpend) || params.dailyVariableSpend < 0) {
        throw new Error('Daily spend must be a non-negative finite number');
    }
    if (params.dailyVariableSpend > 100000) {
        throw new Error('Daily spend unrealistically high');
    }
    
    // Validate fixed expenses
    for (const expense of params.fixedExpenses) {
        if (expense.dueDay < 1 || expense.dueDay > 31 || !Number.isInteger(expense.dueDay)) {
            throw new Error(`Invalid dueDay for expense "${expense.name}": ${expense.dueDay}`);
        }
        if (!Number.isFinite(expense.amount) || expense.amount <= 0) {
            throw new Error(`Invalid amount for expense "${expense.name}"`);
        }
    }
    
    // Validate income events
    for (const income of params.incomeEvents) {
        if (!(income.date instanceof Date) || isNaN(income.date.getTime())) {
            throw new Error(`Invalid date for income "${income.source}"`);
        }
        if (!Number.isFinite(income.amount) || income.amount <= 0) {
            throw new Error(`Invalid amount for income "${income.source}"`);
        }
    }
    
    // Rest of calculation...
}
```

**Rationale:**
- Fail fast with clear error messages
- Prevent garbage-in-garbage-out
- Bounds checking prevents absurd scenarios (e.g., $100M balance)

---

### Gap 2: **Date Edge Cases**

**Failure Mode:** Calculation incorrect for months with <31 days

**Current Behavior:**
```typescript
// Line 46: Matches expenses by day-of-month only
.filter(e => e.dueDay === currentDayOfMonth)
```

**Problem:**
- Expense with `dueDay: 31` never triggers in February (28/29 days)
- Rent due on 31st would be skipped in 7 out of 12 months
- Calculation underestimates expenses

**Blast Radius:**
- ❌ User expects rent to be included → sees inflated runway → runs out of money early
- ⚠️ Severity depends on expense amounts (rent is typically largest expense)

**When It Fails:**
- User sets rent due date to 30th or 31st
- Current date is in a short month (Feb, Apr, Jun, Sep, Nov)

**Recommended Fix:**
```typescript
// Clamp dueDay to last day of month
const lastDayOfMonth = getDate(endOfMonth(currentDate));
const effectiveDueDay = Math.min(e.dueDay, lastDayOfMonth);
const todaysFixedExpenses = fixedExpenses
    .filter(e => effectiveDueDay === currentDayOfMonth)
    .reduce((sum, e) => sum + e.amount, 0);
```

**Alternative:**
- UI constraint: Only allow dueDay 1-28 (safe for all months)
- Add validation in `FixedExpenseSchema`: `dueDay: z.number().min(1).max(28)`

---

### Gap 3: **Projection Array Memory Leak**

**Failure Mode:** User has 365-day runway → `projection` array has 365 objects → 15KB+ stored in RAM

**Current Behavior:**
```typescript
// Lines 54-58: Unconditionally pushes to array
projection.push({
    date: currentDate.toISOString(),  // 24 bytes per string
    balance: Math.floor(balance)      // 8 bytes
});
```

**Blast Radius:**
- ⚠️ For 1 user with 365-day runway: ~15KB RAM
- ❌ For 100 users (multi-tab scenario): 1.5MB RAM
- ❌ If projection is stored in localStorage: quota waste

**When It Fails:**
- User has high balance and low expenses → 365-day projection
- Multiple tabs open → each calculates full projection
- Low-end device with limited RAM

**Recommended Fix:**
```typescript
// Only store projection for first 90 days or every 7th day for longer runways
if (daysResult <= 90 || daysResult % 7 === 0) {
    projection.push({
        date: currentDate.toISOString(),
        balance: Math.floor(balance)
    });
}
```

**Alternative:**
- Lazy-load projection on demand (only calculate when user clicks "View Chart")
- Store aggregate stats instead of daily data

---

### Gap 4: **No Observability**

**Failure Mode:** User reports "calculation wrong" → no way to debug

**Current Behavior:**
- No logging of inputs, outputs, or intermediate states
- Cannot replay calculation to verify correctness
- Cannot detect performance degradation

**Recommended Fix:**
```typescript
// Add structured logging
static calculateRunway(params: RunwayParams): RunwayResult {
    const startTime = performance.now();
    
    // Log inputs (redact sensitive data)
    console.log('[RunwayLogic] Calculation started', {
        balance: params.currentBalance,
        expenseCount: params.fixedExpenses.length,
        incomeCount: params.incomeEvents.length,
        dailySpend: params.dailyVariableSpend
    });
    
    // ... calculation logic ...
    
    const duration = performance.now() - startTime;
    console.log('[RunwayLogic] Calculation complete', {
        daysRemaining: result.daysRemaining,
        status: result.status,
        durationMs: duration.toFixed(2)
    });
    
    // Alert if calculation took too long
    if (duration > 100) {
        console.warn('[RunwayLogic] Slow calculation detected', { duration });
    }
    
    return result;
}
```

---

## Feature 2: User Profile (Onboarding Flow)

### `OnboardingFlow.tsx` Analysis

**Location:** `src/features/user-profile/components/OnboardingFlow.tsx`

#### Charter Compliance Review

| Principle | Status | Analysis |
|-----------|--------|----------|
| **Failure-First Reasoning** | ⚠️ PARTIAL | Has try-catch, but insufficient |
| **User Feedback** | ⚠️ PARTIAL | Alert on error (poor UX), no loading state |
| **Idempotency** | ❌ MISSING | No double-submit prevention |
| **Input Validation** | ❌ MISSING | Relies on fallbacks, not validation |
| **State Transitions** | ❌ BROKEN | Profile created but UI doesn't update (documented bug) |
| **Observability** | ⚠️ PARTIAL | Console.log only (not production-grade) |

---

### Gap 1: **State Transition Bug** (CRITICAL)

**Reported Issue:** User completes onboarding → profile created in localStorage → `OnboardingFlow` still shows (doesn't navigate to dashboard)

**Root Cause Analysis:**

**Current Flow:**
```typescript
// OnboardingFlow.tsx, Line 49
createProfile(profileData);  // Writes to localStorage
// Line 52: Comment says "Should trigger App re-render automatically"
```

**Expected:** `createProfile()` → localStorage write → `storage` event → `useLocalStorage` hook updates → `useStudentProfile().profile` changes → `App.tsx` re-renders → `hasProfile = true` → shows `RunwayDashboard`

**Actual Failure:**
```typescript
// App.tsx, Line 6
const { hasProfile } = useStudentProfile();  // This is evaluated ONCE on mount
```

**Why It Fails:**
1. `useStudentProfile()` is called in `App.tsx` and `OnboardingFlow.tsx` (two separate hook instances)
2. `OnboardingFlow` instance writes to localStorage
3. `App` instance's hook **should** receive `storage` event and update
4. **BUT:** React is in StrictMode (main.tsx, Line 7) which can cause double-mount effects
5. **OR:** The `storage` event listener in `useLocalStorage` (Line 111) only fires for **other tabs**, not same-tab writes
6. The custom `local-storage` event (Line 71) is dispatched but **React batching may delay the state update**

**Smoking Gun:**
```typescript
// useLocalStorage.ts, Line 65-72
setStoredValue(valueToStore);  // Updates local state
if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(valueToStore));
    window.dispatchEvent(new Event('local-storage'));  // Fires AFTER setState
}
```

**Race Condition:**
- `OnboardingFlow` calls `createProfile()`
- `setProfile()` is called, which calls `setStoredValue()`
- `setStoredValue()` updates state and dispatches event
- `App` component's `useStudentProfile()` hook **may not have received the event yet**
- By the time event is processed, React has already rendered the old state

**Blast Radius:**
- ❌ **100% of new users cannot access app** (fatal UX bug)
- ❌ User clicks "Finish Setup" → nothing happens → assumes app is broken
- ❌ No error message, no recovery path

**When It Fails:**
- **Always** on first profile creation
- More likely in production (React.StrictMode makes it worse in dev)

**Recommended Fix (Immediate):**
```typescript
// OnboardingFlow.tsx
const handleSubmit = () => {
    try {
        createProfile(profileData);
        
        // Force immediate navigation instead of waiting for hook re-render
        // This is a workaround for the state propagation delay
        window.location.reload();  // Nuclear option but guarantees fresh state
    } catch (e) {
        console.error("Error creating profile:", e);
        alert("Error creating profile. Please check console.");
    }
};
```

**Recommended Fix (Proper):**
```typescript
// Create a centralized ProfileContext provider to ensure single source of truth

// ProfileContext.tsx
import { createContext, useContext } from 'react';
import { useStudentProfile } from './hooks';

const ProfileContext = createContext<ReturnType<typeof useStudentProfile> | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const profile = useStudentProfile();
    return <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (!context) throw new Error('useProfile must be used within ProfileProvider');
    return context;
}

// main.tsx
<ProfileProvider>
    <App />
</ProfileProvider>

// App.tsx - use context instead of hook
const { hasProfile } = useProfile();

// OnboardingFlow.tsx - use context instead of hook
const { createProfile } = useProfile();
```

**Rationale:**
- Single hook instance → no state sync issues
- React Context propagates state immediately to all consumers
- Proper separation of concerns (state management vs presentation)

---

### Gap 2: **No Input Validation**

**Failure Mode:** User enters invalid data → stored in localStorage → calculation fails

**Current Behavior:**
```typescript
// Lines 39-46: Fallbacks, not validation
const profileData = {
    name: name || 'Student',  // Empty name allowed
    campusType,  // No validation (could be manipulated)
    currentBalance: Number(currentBalance) || 0,  // NaN → 0 (silent failure)
    cheapestMealCost: Number(cheapestMeal) || 50  // Same issue
};
```

**Attack Scenarios:**
1. **Empty String Cast:**
   ```typescript
   currentBalance: Number("") // Becomes 0, not NaN
   // User meant to enter value, accidentally left empty → calculation uses 0
   ```

2. **Invalid Number:**
   ```typescript
   currentBalance: Number("10k") // Becomes NaN → fallback to 0
   // User typed "10k" thinking it means 10000 → silently becomes 0
   ```

3. **Negative Values:**
   ```typescript
   cheapestMealCost: -50 // No validation → daily spend becomes negative → infinite runway
   ```

**Blast Radius:**
- ❌ User sees "0 days" runway → panics (when they actually have money)
- ❌ User sees "365 days" runway → overspends (when cheapestMeal was negative)
- ⚠️ Data quality issues accumulate over time

**When It Fails:**
- User makes typo in input field
- User leaves field empty
- Browser autocomplete fills wrong value

**Recommended Fix:**
```typescript
const handleSubmit = () => {
    try {
        // Validate before submitting
        if (!name || name.trim() === '') {
            alert('Please enter your name');
            return;
        }
        
        const balance = Number(currentBalance);
        if (!Number.isFinite(balance) || balance < 0) {
            alert('Please enter a valid balance (0 or greater)');
            return;
        }
        
        const mealCost = Number(cheapestMeal);
        if (!Number.isFinite(mealCost) || mealCost <= 0) {
            alert('Please enter a valid meal cost (greater than 0)');
            return;
        }
        
        if (mealCost > 5000) {
            if (!confirm('Meal cost seems very high (>5000 KSh). Continue?')) {
                return;
            }
        }
        
        // All validation passed, create profile
        createProfile({
            name: name.trim(),
            campusType,
            livingArrangement,
            foodHabits,
            transportPattern,
            currentBalance: balance,
            cheapestMealCost: mealCost
        });
        
        window.location.reload(); // Temp fix for state propagation
    } catch (e) {
        console.error("Error creating profile:", e);
        alert("Error creating profile. Please check console.");
    }
};
```

---

### Gap 3: **No Loading State**

**Failure Mode:** User clicks "Finish Setup" → nothing happens → clicks again → double-submit

**Current Behavior:**
```typescript
// Lines 199-201: Button has no disabled state
<Button onClick={handleNext}>
    {step === totalSteps ? 'Finish Setup' : 'Next'}
</Button>
```

**Blast Radius:**
- ⚠️ If profile creation were async (e.g., future API call), user could create duplicate profiles
- ⚠️ User clicks rapidly → multiple `createProfile()` calls → last one wins
- ❌ Poor UX (no feedback that submission is processing)

**Recommended Fix:**
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
    if (isSubmitting) return; // Idempotency guard
    setIsSubmitting(true);
    
    try {
        // ... validation and profile creation ...
        window.location.reload();
    } catch (e) {
        console.error("Error:", e);
        alert("Error creating profile.");
    } finally {
        setIsSubmitting(false);
    }
};

// In JSX
<Button onClick={handleNext} disabled={isSubmitting}>
    {isSubmitting ? 'Creating Profile...' : (step === totalSteps ? 'Finish Setup' : 'Next')}
</Button>
```

---

### Gap 4: **No Back Navigation Guard**

**Failure Mode:** User completes step 4 → clicks "Finish Setup" → error occurs → clicks "Back" → loses entered data

**Current Behavior:**
```typescript
// Lines 30-32: Back button just decrements step
const handleBack = () => {
    if (step > 1) setStep(step - 1);
};
```

**Blast Radius:**
- ⚠️ If error occurs on submit, user must re-enter all data
- ⚠️ No warning when navigating away with unsaved changes

**Recommended Fix:**
```typescript
// Add dirty state tracking
const [isDirty, setIsDirty] = useState(false);

// Warn before page close
useEffect(() => {
    if (!isDirty) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires this
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);

// Mark as dirty on any input change
<Input 
    value={name} 
    onChange={(e) => {
        setName(e.target.value);
        setIsDirty(true);
    }} 
/>
```

---

## Feature 3: Financial Manager

### `FinancialManager.tsx` Analysis

**Location:** `src/features/runway-calculator/components/FinancialManager.tsx`

---

### Gap 1: **No Duplicate Prevention**

**Failure Mode:** User double-clicks "Add Expense" → duplicate entry created

**Current Behavior:**
```typescript
// Lines 64-79: No debouncing or duplicate detection
const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    
    onAdd({
        id: crypto.randomUUID(),  // Always creates new ID
        name,
        amount: Number(amount),
        dueDay: Number(dueDay),
        category: 'other'
    });
    
    setName('');  // Clears form - but too late if double-clicked
    setAmount('');
};
```

**Blast Radius:**
- ❌ User sees "Rent" expense twice → calculation doubles rent → runway halved
- ⚠️ User must manually delete duplicate

**When It Fails:**
- User double-clicks submit (common on slow devices)
- Form submission handler called twice due to event bubbling

**Recommended Fix:**
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || isSubmitting) return;  // Idempotency guard
    
    setIsSubmitting(true);
    
    onAdd({
        id: crypto.randomUUID(),
        name,
        amount: Number(amount),
        dueDay: Number(dueDay),
        category: 'other'
    });
    
    setName('');
    setAmount('');
    setDueDay('1');
    
    // Reset after short delay to prevent rapid-fire
    setTimeout(() => setIsSubmitting(false), 300);
};

// In JSX
<Button type="submit" disabled={isSubmitting}>
    <Plus size={16} /> Add Expense
</Button>
```

---

### Gap 2: **No Deletion Confirmation**

**Failure Mode:** User accidentally clicks trash icon → expense deleted → cannot undo

**Current Behavior:**
```typescript
// Line 117: Direct deletion, no confirmation
onClick={() => onDelete(item.id)}
```

**Blast Radius:**
- ❌ User accidentally deletes rent (largest expense) → runway calculation wildly wrong
- ❌ No undo mechanism → must re-enter all expense details

**Recommended Fix:**
```typescript
const handleDelete = (item: FixedExpense) => {
    if (confirm(`Delete "${item.name}" (${item.amount} KSh)?`)) {
        onDelete(item.id);
    }
};

// In JSX
<Button onClick={() => handleDelete(item)}>
    <Trash2 size={16} />
</Button>
```

**Better Fix (Undo Toast):**
```typescript
// Implement soft-delete with 5-second undo window
const [deletedItems, setDeletedItems] = useState<Map<string, FixedExpense>>(new Map());

const handleDelete = (item: FixedExpense) => {
    // Mark as deleted (hide from UI)
    setDeletedItems(prev => new Map(prev).set(item.id, item));
    
    // Show toast: "Rent deleted. Undo?"
    // If no undo within 5 seconds, actually delete
    setTimeout(() => {
        setDeletedItems(prev => {
            const next = new Map(prev);
            if (next.has(item.id)) {
                onDelete(item.id);  // Permanent delete
                next.delete(item.id);
            }
            return next;
        });
    }, 5000);
};
```

---

### Gap 3: **No Input Sanitization**

**Failure Mode:** User enters HTML/script in expense name → XSS risk

**Current Behavior:**
```typescript
// Line 87: Direct rendering of user input
<Input value={name} onChange={e => setName(e.target.value)} />

// Later rendered as:
<p className="font-medium">{item.name}</p>  // React escapes this ✅
```

**Assessment:**
- ✅ **No XSS vulnerability** (React escapes by default)
- ⚠️ **But:** User could enter malicious-looking content (e.g., `<script>alert(1)</script>` as expense name)
- ⚠️ If later exported to CSV/PDF without sanitization → potential issue

**Recommended Enhancement:**
```typescript
// Sanitize on input
const sanitizeName = (input: string): string => {
    return input
        .replace(/[<>]/g, '')  // Remove < and >
        .trim()
        .slice(0, 50);  // Max length
};

<Input 
    value={name} 
    onChange={e => setName(sanitizeName(e.target.value))} 
/>
```

---

### Gap 4: **No Amount Bounds Checking**

**Failure Mode:** User enters 10000000 KSh rent → calculation shows -365 days runway

**Current Behavior:**
```typescript
// Line 71: No validation
amount: Number(amount),  // Could be 0, negative, NaN, Infinity
```

**Recommended Fix:**
```typescript
const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    
    const parsedAmount = Number(amount);
    
    // Validation
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        alert('Amount must be a positive number');
        return;
    }
    
    if (parsedAmount > 1000000) {
        if (!confirm('Amount is very high (>1M KSh). Continue?')) {
            return;
        }
    }
    
    // ... rest of logic
};
```

---

## Cross-Feature Analysis

### Issue 1: **No Global Error Boundary**

**Current State:**
- `main.tsx` renders `<App />` directly
- If any component throws → entire app crashes → white screen

**Recommended:**
```typescript
// main.tsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: any) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
            <div className="max-w-md p-6 bg-white rounded-lg shadow">
                <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
                <pre className="mt-4 text-sm text-slate-600">{error.message}</pre>
                <button 
                    onClick={resetErrorBoundary}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                >
                    Reload App
                </button>
            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);
```

---

### Issue 2: **No Structured Logging**

**Current State:**
- `console.log()` scattered across codebase
- No log levels, no structure, no remote logging

**Recommended:**
```typescript
// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
    log(level: LogLevel, message: string, context?: Record<string, any>) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...context
        };
        
        console[level](message, context);
        
        // In production, send to remote logging service
        if (import.meta.env.PROD && level === 'error') {
            // fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) });
        }
    }
    
    debug(msg: string, ctx?: Record<string, any>) { this.log('debug', msg, ctx); }
    info(msg: string, ctx?: Record<string, any>) { this.log('info', msg, ctx); }
    warn(msg: string, ctx?: Record<string, any>) { this.log('warn', msg, ctx); }
    error(msg: string, ctx?: Record<string, any>) { this.log('error', msg, ctx); }
}

export const logger = new Logger();
```

---

## Prioritized Remediation Roadmap

### Phase 1: Critical (Blocking User Flow)

1. **Fix OnboardingFlow State Transition** — Use Context API or `window.location.reload()`  
   **Effort:** 30 min | **Impact:** Unblocks all new users (P0)

2. **Add Input Validation to OnboardingFlow** — Prevent bad data entry  
   **Effort:** 45 min | **Impact:** Prevents calculation errors

3. **Add Bounds Checking to RunwayLogic** — Prevent NaN/Infinity  
   **Effort:** 1 hour | **Impact:** Prevents garbage output

### Phase 2: Important (Prevents Data Loss)

4. **Add Deletion Confirmation** — Prevent accidental deletes  
   **Effort:** 15 min | **Impact:** Reduces user frustration

5. **Add Double-Submit Prevention** — Idempotency guards on forms  
   **Effort:** 30 min | **Impact:** Prevents duplicate entries

6. **Add Global Error Boundary** — Prevent white screen crashes  
   **Effort:** 20 min | **Impact:** Graceful failure handling

### Phase 3: Enhancement (UX Polish)

7. **Fix Date Edge Cases** — Handle 30/31 day months  
   **Effort:** 30 min | **Impact:** More accurate calculations

8. **Optimize Projection Array** — Reduce memory usage  
   **Effort:** 45 min | **Impact:** Better performance for long runways

9. **Add Structured Logging** — Enable debugging  
   **Effort:** 1.5 hours | **Impact:** Faster issue resolution

---

## Conclusion

The **features folder demonstrates strong computational logic** (RunwayLogic) but **fails at the UI/form layer**. The most critical issue is the **OnboardingFlow state transition bug** which blocks all new users.

**Assessment Grade:** **C+**  
**Rationale:** Core logic is solid (A-), but form handling and state management have critical gaps (D).

---

## Charter Compliance Summary

- ✅ **Failure modes identified:** Input validation, state sync, double-submit, deletion
- ✅ **Blast radius analyzed:** Wrong calculations, data loss, app crashes
- ⚠️ **User feedback incomplete:** Alert() instead of proper error UI
- ❌ **Idempotency not enforced:** Forms allow double-submit
- ❌ **Rate limiting missing:** No debouncing on form submissions
- ⚠️ **Observability partial:** Console.log only, no metrics
- ⚠️ **Security partial:** React escapes HTML, but no input sanitization
- ❌ **Recoverable limited:** No undo, no error recovery paths

**Critical Action:** Fix OnboardingFlow state bug immediately. This is a **P0 blocker**.

---

**Next Steps:**
1. Implement Phase 1 fixes (OnboardingFlow, validation, bounds checking)
2. Add unit tests for RunwayLogic edge cases
3. Audit `src/lib/` and `src/App.tsx` for remaining gaps
4. Create integration test for full user flow (onboarding → add expense → view runway)
