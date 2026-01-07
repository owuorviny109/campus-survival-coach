# Code Audit: Infrastructure & Configuration

**Audit Date:** 2026-01-07  
**Auditor:** Systems Engineering Analysis  
**Scope:** `src/lib/`, `src/App.tsx`, `src/test/`, build config, project structure  
**Charter Reference:** `DOCS/SYSTEMS_ENGINEERING_CHARTER.md`

---

## Executive Summary

This audit covers the **infrastructure layer** of the Campus Survival Coach application:
- **Utility functions** (`src/lib/`)
- **Root component** (`src/App.tsx`)
- **Test infrastructure** (`src/test/`)
- **Build configuration** (Vite, TypeScript, package.json)
- **Project documentation** (README, requirements)

**Overall Assessment:**  
✅ **STRONG FOUNDATION** — Clean architecture, professional tooling, excellent TypeScript configuration.  
⚠️ **CRITICAL GAPS** — Missing error boundaries, logging infrastructure, and environment variable handling for AI integration.

**Key Finding:**  
The project has **excellent structural foundations** (TypeScript strict mode, property-based testing, professional conventions) but **lacks production-ready operational infrastructure** (error handling, observability, deployment config).

---

## Part 1: Utility Layer (`src/lib/`)

### `utils.ts` Analysis

**Location:** `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
```

#### Charter Compliance Review

| Principle | Status | Analysis |
|-----------|--------|----------|
| **Failure-First Reasoning** | ✅ PASS | Cannot fail (pure function, no IO) |
| **Security** | ✅ PASS | No injection vectors |
| **Observability** | ✅ N/A | Utility function, no logging needed |

#### Assessment

**No gaps identified.**  
This is a **standard Tailwind utility** for conditional class merging. Pure function with no failure modes.

---

### Missing Utilities

**Gap: No Centralized Logging**

**Current State:** Scattered `console.log()` across codebase

**Recommended Addition:**
```typescript
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    userId?: string;
}

class Logger {
    private isDev = import.meta.env.DEV;
    
    private log(level: LogLevel, message: string, context?: Record<string, any>) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context
        };
        
        // Console logging (all environments)
        const consoleMethod = level === 'error' ? console.error : 
                             level === 'warn' ? console.warn : console.log;
        consoleMethod(`[${level.toUpperCase()}] ${message}`, context || '');
        
        // Production: Send critical logs to remote service
        if (!this.isDev && (level === 'error' || level === 'warn')) {
            this.sendToRemote(entry);
        }
    }
    
    private sendToRemote(entry: LogEntry) {
        // Future: Send to Sentry, LogRocket, or custom endpoint
        // For now, store in localStorage for debugging
        try {
            const logs = JSON.parse(localStorage.getItem('app_error_logs') || '[]');
            logs.push(entry);
            // Keep only last 100 errors
            if (logs.length > 100) logs.shift();
            localStorage.setItem('app_error_logs', JSON.stringify(logs));
        } catch {
            // Silent fail - don't break app if logging fails
        }
    }
    
    debug(message: string, context?: Record<string, any>) {
        if (this.isDev) this.log('debug', message, context);
    }
    
    info(message: string, context?: Record<string, any>) {
        this.log('info', message, context);
    }
    
    warn(message: string, context?: Record<string, any>) {
        this.log('warn', message, context);
    }
    
    error(message: string, context?: Record<string, any>) {
        this.log('error', message, context);
    }
}

export const logger = new Logger();
```

**Rationale:**
- Structured logging for debugging
- Production error persistence
- Foundation for future remote logging (Sentry, LogRocket)

---

**Gap: No Environment Variable Validation**

**Current State:** No `.env` file or env validation

**Recommended Addition:**
```typescript
// src/lib/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
    VITE_GEMINI_API_KEY: z.string().optional(), // Optional until AI implemented
    VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

type Env = z.infer<typeof EnvSchema>;

function validateEnv(): Env {
    try {
        return EnvSchema.parse({
            VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
            VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
            VITE_LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL
        });
    } catch (error) {
        console.error('Environment validation failed:', error);
        throw new Error('Invalid environment configuration');
    }
}

export const env = validateEnv();
```

**Rationale:**
- Type-safe environment variables
- Fail-fast on misconfiguration
- Single source of truth for config

---

## Part 2: Root Component (`src/App.tsx`)

### Analysis

**Location:** `src/App.tsx`

```typescript
function App() {
    const { hasProfile } = useStudentProfile();  // ⚠️ Two instances issue
    
    if (!hasProfile) {
        return <OnboardingFlow />;
    }
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
            {/* Dashboard */}
        </div>
    );
}
```

#### Charter Compliance Review

| Principle | Status | Analysis |
|-----------|--------|----------|
| **Failure-First Reasoning** | ❌ MISSING | No error boundary wrapper |
| **User Feedback** | ❌ MISSING | No loading state during profile check |
| **State Management** | ❌ BROKEN | Multiple `useStudentProfile()` instances (covered in Features audit) |
| **Observability** | ❌ MISSING | No logging of navigation decisions |

---

### Gap 1: **No Error Boundary** (CRITICAL)

**Failure Mode:** Any component throws → entire app crashes → white screen of death

**Current Behavior:**
- No error boundary wrapping `<App />`
- Uncaught errors propagate to `main.tsx`
- User sees blank white screen with no recovery

**Blast Radius:**
- ❌ **Total app failure** (no fallback UI)
- ❌ User has no idea what went wrong
- ❌ No way to recover without hard refresh
- ❌ No error reporting for debugging

**When It Fails:**
- RunwayLogic throws on NaN input
- Component unmounts during async operation
- Third-party library error (framer-motion, date-fns)
- localStorage read/write fails

**Recommended Fix:**

**Create `src/components/ErrorBoundary.tsx`:**
```typescript
import { Component, ReactNode } from 'react';
import { logger } from '../lib/logger';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: any;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    
    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }
    
    componentDidCatch(error: Error, errorInfo: any) {
        logger.error('React Error Boundary caught error', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack
        });
        
        this.setState({ errorInfo });
    }
    
    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };
    
    handleClearData = () => {
        if (confirm('This will clear all your data. Continue?')) {
            localStorage.clear();
            window.location.reload();
        }
    };
    
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                    <Card className="max-w-lg w-full">
                        <CardHeader>
                            <CardTitle className="text-red-600">
                                Something Went Wrong
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-slate-600">
                                The app encountered an unexpected error. This might be due to corrupted data or a bug.
                            </p>
                            
                            {import.meta.env.DEV && this.state.error && (
                                <details className="text-xs bg-slate-100 p-3 rounded overflow-auto">
                                    <summary className="cursor-pointer font-medium">Error Details</summary>
                                    <pre className="mt-2 whitespace-pre-wrap">
                                        {this.state.error.toString()}
                                        {this.state.error.stack}
                                    </pre>
                                </details>
                            )}
                            
                            <div className="flex gap-2">
                                <Button onClick={this.handleReset} className="flex-1">
                                    Reload App
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    onClick={this.handleClearData}
                                    className="flex-1"
                                >
                                    Clear All Data
                                </Button>
                            </div>
                            
                            <p className="text-xs text-slate-500">
                                If this persists, contact support with the error details above.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            );
        }
        
        return this.props.children;
    }
}
```

**Update `main.tsx`:**
```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);
```

**Rationale:**
- Prevents white screen of death
- Provides clear error message to user
- Offers recovery options (reload, clear data)
- Logs errors for debugging
- Shows stack trace in development mode

---

### Gap 2: **No Loading State**

**Failure Mode:** Initial `useStudentProfile()` hook execution → brief render with `hasProfile = undefined` → flicker

**Current Behavior:**
```typescript
const { hasProfile } = useStudentProfile();  // Could be undefined initially
if (!hasProfile) {  // Treats undefined as false
    return <OnboardingFlow />;
}
```

**Blast Radius:**
- ⚠️ Brief flicker when loading profile from localStorage
- ⚠️ User sees onboarding screen for <100ms even if they have profile

**Recommended Fix:**
```typescript
function App() {
    const { hasProfile, isLoading } = useStudentProfile();
    
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading...</p>
                </div>
            </div>
        );
    }
    
    if (!hasProfile) {
        return <OnboardingFlow />;
    }
    
    return <RunwayDashboard />;
}
```

**Note:** Currently `isLoading` is hardcoded to `false` in `useStudentProfile` (Line 53). This is acceptable for synchronous localStorage but should be updated if profile loading becomes async.

---

### Gap 3: **No Navigation Logging**

**Failure Mode:** Cannot debug state transition issues (e.g., why user stuck on onboarding)

**Recommended Fix:**
```typescript
import { useEffect } from 'react';
import { logger } from './lib/logger';

function App() {
    const { hasProfile } = useStudentProfile();
    
    useEffect(() => {
        logger.info('App rendered', { hasProfile });
    }, [hasProfile]);
    
    // ... rest of component
}
```

---

## Part 3: Test Infrastructure

### `src/test/setup.ts` Analysis

**Current State:**
```typescript
import '@testing-library/jest-dom'
```

#### Assessment

**Minimal but functional.** Sets up `jest-dom` matchers for Vitest.

---

### `logic.test.ts` Analysis (Property-Based Testing)

**Location:** `src/features/runway-calculator/logic.test.ts`

#### Charter Compliance Review

| Principle | Status | Analysis |
|-----------|--------|----------|
| **Failure-First Reasoning** | ✅ EXCELLENT | Property tests explore failure modes |
| **Input Validation Testing** | ⚠️ PARTIAL | Tests valid ranges, missing NaN/Infinity tests |
| **Edge Cases** | ❌ MISSING | No tests for 30/31 day months |

---

### Gap 1: **Missing Edge Case Tests**

**Identified Missing Tests:**

1. **NaN/Infinity Input:**
   ```typescript
   it('Handles NaN balance gracefully', () => {
       expect(() => {
           RunwayLogic.calculateRunway({
               currentBalance: NaN,
               startDate: new Date(),
               fixedExpenses: [],
               incomeEvents: [],
               dailyVariableSpend: 100
           });
       }).toThrow('Invalid balance');
   });
   ```

2. **Date Edge Case (31st day):**
   ```typescript
   it('Handles expenses due on 31st in February', () => {
       const feb1 = new Date(2024, 1, 1); // Feb 1, 2024
       const result = RunwayLogic.calculateRunway({
           currentBalance: 10000,
           startDate: feb1,
           fixedExpenses: [{
               id: crypto.randomUUID(),
               name: 'Rent',
               amount: 8000,
               dueDay: 31, // No Feb 31st
               category: 'housing'
           }],
           incomeEvents: [],
           dailyVariableSpend: 100
       });
       
       // Rent should still be charged (on last day of Feb)
       expect(result.projectedBalance.some(day => 
           day.balance < (10000 - 8000)
       )).toBe(true);
   });
   ```

3. **Zero Daily Spend:**
   ```typescript
   it('Handles zero daily spend', () => {
       const result = RunwayLogic.calculateRunway({
           currentBalance: 1000,
           startDate: new Date(),
           fixedExpenses: [],
           incomeEvents: [],
           dailyVariableSpend: 0
       });
       
       expect(result.daysRemaining).toBe(365); // Capped at max
   });
   ```

---

### Gap 2: **No Integration Tests**

**Current State:** Only unit tests for `RunwayLogic`

**Missing Tests:**
- E2E test for full onboarding → dashboard flow
- Integration test for localStorage persistence
- Test for multi-tab state synchronization
- Test for form submission idempotency

**Recommended Addition:**
```typescript
// src/test/integration/onboarding.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../../App';

describe('Onboarding Flow Integration', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    it('Completes full onboarding flow', async () => {
        render(<App />);
        
        // Should show onboarding
        expect(screen.getByText(/Setup Your Profile/i)).toBeInTheDocument();
        
        // Fill step 1
        fireEvent.change(screen.getByPlaceholderText(/Alex/i), {
            target: { value: 'Test User' }
        });
        fireEvent.click(screen.getByText(/Next/i));
        
        // Fill step 2
        fireEvent.click(screen.getByText(/On Campus/i));
        fireEvent.click(screen.getByText(/Next/i));
        
        // Fill step 3
        fireEvent.click(screen.getByText(/Next/i));
        
        // Fill step 4
        fireEvent.change(screen.getByLabelText(/Balance/i), {
            target: { value: '5000' }
        });
        fireEvent.change(screen.getByLabelText(/meal/i), {
            target: { value: '100' }
        });
        
        // Submit
        fireEvent.click(screen.getByText(/Finish Setup/i));
        
        // Should navigate to dashboard
        await waitFor(() => {
            expect(screen.getByText(/Survival Runway/i)).toBeInTheDocument();
        });
        
        // Data should persist
        const profile = JSON.parse(localStorage.getItem('csc_student_profile_v1')!);
        expect(profile.name).toBe('Test User');
        expect(profile.currentBalance).toBe(5000);
    });
});
```

---

## Part 4: Build Configuration

### `vite.config.ts` Analysis

```typescript
export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
    },
})
```

#### Gaps Identified

**Gap 1: No Build Optimizations**

**Missing:**
- Code splitting
- Asset optimization
- Bundle size limits

**Recommended Additions:**
```typescript
export default defineConfig({
    plugins: [react()],
    
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    ui: ['framer-motion', 'lucide-react'],
                    utils: ['date-fns', 'zod']
                }
            }
        },
        chunkSizeWarningLimit: 600, // Warn if chunk > 600KB
    },
    
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'src/test/']
        }
    },
})
```

---

**Gap 2: No Environment-Specific Config**

**Recommended:**
```typescript
export default defineConfig(({ mode }) => {
    const isDev = mode === 'development';
    
    return {
        plugins: [react()],
        
        define: {
            __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
            __BUILD_TIME__: JSON.stringify(new Date().toISOString())
        },
        
        server: {
            port: 3000,
            open: true
        },
        
        build: {
            sourcemap: isDev,
            minify: !isDev
        }
    };
});
```

---

### `package.json` Analysis

#### Identified Gaps

**Gap 1: No Pre-commit Hooks**

**Recommended Addition:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "type-check": "tsc --noEmit",
    "prepare": "husky install",
    "pre-commit": "npm run type-check && npm run lint && npm test -- --run"
  },
  "devDependencies": {
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run"
    ]
  }
}
```

---

**Gap 2: Missing Dependencies for Production**

**Future Additions (when AI implemented):**
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.1.0",  // Gemini SDK
    "react-error-boundary": "^4.0.0",    // Better error boundaries
    "sentry-react": "^7.0.0"             // Error tracking
  }
}
```

---

### `tsconfig.json` Analysis

**Current State:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

#### Assessment

✅ **EXCELLENT** — Strict mode enabled, comprehensive type safety.

**No changes needed.** This is best-practice TypeScript configuration.

---

## Part 5: Documentation

### README.md Analysis

**Overall:** Well-structured, clear problem statement, professional presentation.

#### Gaps Identified

**Gap 1: Outdated Status**

**Line 92:** "Core Financial Calculator (In Progress)"  
**Reality:** Calculator is complete, OnboardingFlow has state bug

**Recommended Update:**
```markdown
- [x] Requirements & Design Documentation
- [x] Project Setup & Architecture
- [x] Core Financial Calculator ✅ COMPLETE
- [x] Runway Logic & Types ✅ COMPLETE
- [x] User Profile Management ⚠️ STATE BUG
- [ ] AI Integration System (Not Started)
- [ ] UI Polish & Accessibility
- [ ] Testing & Quality Assurance
- [ ] Deployment & Documentation
```

---

**Gap 2: Missing Deployment Instructions**

**Current:** Placeholder text  
**Needed:** Actual deployment steps

**Recommended Addition:**
```markdown
## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add VITE_GEMINI_API_KEY production
```

### Manual Deployment

```bash
# Build
npm run build

# Output in dist/ directory, deploy to any static host
```
```

---

**Gap 3: No Contributing Guidelines**

**Recommended Addition:**
```markdown
## Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/name`
2. Make changes, follow commit conventions (see DOCS/COMMIT_CONVENTIONS.md)
3. Run tests: `npm test`
4. Type check: `npm run type-check`
5. Submit PR with clear description

### Code Quality Standards

- All code must pass TypeScript strict mode
- Test coverage should not decrease
- Follow Systems Engineering Charter principles
- Use conventional commits
```

---

## Cross-Cutting Infrastructure Gaps

### 1. **No CI/CD Pipeline**

**Recommended:** GitHub Actions workflow

**Create `.github/workflows/ci.yml`:**
```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Test
        run: npm test -- --run --coverage
      
      - name: Build
        run: npm run build
```

---

### 2. **No Performance Budgets**

**Recommended:** Add Lighthouse CI

**Create `lighthouserc.json`:**
```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

---

### 3. **No Error Tracking**

**Recommended:** Sentry integration

**Create `src/lib/sentry.ts`:**
```typescript
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.VITE_APP_ENV,
        tracesSampleRate: 0.1,
        integrations: [
            new Sentry.BrowserTracing(),
            new Sentry.Replay()
        ]
    });
}
```

---

## Prioritized Remediation Roadmap

### Phase 1: Critical (Prevent Production Failures)

1. **Add Error Boundary** (30 min)  
   **Impact:** Prevents white screen of death

2. **Add Logger Infrastructure** (1 hour)  
   **Impact:** Enables debugging in production

3. **Add Environment Variable Validation** (30 min)  
   **Impact:** Fail-fast on misconfiguration

4. **Update README Status** (15 min)  
   **Impact:** Accurate project state

---

### Phase 2: Important (Production Readiness)

5. **Add Integration Tests** (2 hours)  
   **Impact:** Catches state synchronization bugs

6. **Add CI/CD Pipeline** (1 hour)  
   **Impact:** Automated quality checks

7. **Add Build Optimizations** (45 min)  
   **Impact:** Faster load times

8. **Add Missing Edge Case Tests** (1.5 hours)  
   **Impact:** Better test coverage

---

### Phase 3: Enhancement (Operational Excellence)

9. **Add Error Tracking (Sentry)** (1 hour)  
   **Impact:** Production error monitoring

10. **Add Performance Budgets** (1 hour)  
    **Impact:** Ensure fast UX

11. **Add Pre-commit Hooks** (30 min)  
    **Impact:** Prevent bad commits

12. **Add Contributing Guidelines** (30 min)  
    **Impact:** Easier collaboration

---

## Conclusion

The **infrastructure and configuration layer is professionally structured** with excellent TypeScript configuration and modern tooling. However, it **lacks operational maturity** for production deployment.

**Assessment Grade:** **B+**  
**Rationale:** Strong foundations (A-), but missing production safeguards (C).

---

## Charter Compliance Summary

- ✅ **Failure modes identified:** Error boundaries, logging, env validation
- ✅ **Blast radius analyzed:** White screen, silent failures, misconfig
- ⚠️ **User feedback partial:** Error boundary to be added
- ❌ **Observability missing:** No logging infrastructure yet
- ⚠️ **Security partial:** No env validation, API keys not handled
- ✅ **Strong testing foundation:** Property-based tests, strict TypeScript

**Critical Actions:**
1. Add ErrorBoundary immediately (prevents catastrophic UX failures)
2. Add logger before next development session (enables debugging)
3. Add env validation when AI integration begins

---

**Final Project Assessment:**

| Layer | Grade | Status |
|-------|-------|--------|
| Components | B- | Missing orchestration |
| Hooks | A- | Excellent, missing recovery |
| Features | C+ | Critical state bug |
| Infrastructure | B+ | Strong base, missing ops |

**Overall:** **B-** (3.0/4.0)  
**Blockers:** OnboardingFlow state bug, missing ErrorBoundary  
**Strengths:** TypeScript strictness, property testing, clean architecture
