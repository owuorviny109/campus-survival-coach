# Engineering Standards & "Outsmarting" Strategies
> High-performance engineering rules to ensure Campus Survival Coach dominates the Build4Students hackathon.

To outcompete standard hackathon projects, we will adopt enterprise-grade practices that prioritize **reliability, speed, and user experience**. While others build fragile prototypes, we will build a production-grade Product.

## 1. Architecture: Feature-Sliced Design
Don't organize by technical layer (e.g., all components in one massive folder). Organize by **Business Domain**. This shows judges you understand scalable architecture.

**Structure:**
```
src/
  features/
    runway-calculator/  # Everything related to the calculator
      components/
      hooks/
      utils/
      types.ts
    survival-tips/      # Everything related to AI tips
  components/           # Only TRULY shared UI (Buttons, Cards)
  lib/                  # Third-party wrappers (ensures we can swap tools later)
  hooks/                # Global hooks (e.g., useLocalStorage)
```

## 2. Strong Typing & Runtime Safety (The "No-Crash" Rule)
Hackathon demos fail because of unexpected data. We will prevent this.
*   **Rule:** Strict TypeScript. `noImplicitAny` is ON.
*   **Rule:** **Zod** for everything. Never trust data from LocalStorage or the AI API. Validate it at the boundary.
    *   *Why?* If LocalStorage is corrupted, the app resets gracefully instead of crashing with a white screen.

## 3. "Premium" UX Patterns
Judges vote with their eyes. The app must feel "alive."
*   **Optimistic UI:** When a user updates a cost, update the UI *instantly*. Never wait for a calculation if you can estimate it.
*   **Layout Animations:** Use `framer-motion` `layout` prop. When a list item is deleted, the list shouldn't "snap"; it should slide to fill the gap.
*   **Micro-interactions:** Buttons should scale down slightly on press. Hover states should be smooth (`transition-all duration-200`).

## 4. The "Offline-First" Mental Model
Most web apps break without internet. Ours will thrive.
*   **Strategy:** The app determines the user's state *entirely* from LocalStorage on load.
*   **Strategy:** AI features are "Enhancements." If offline, the app still calculates runway and shows cached tips strictly. It never shows a generic "No Connection" error screen; it shows "Offline Mode" with full functionality.

## 5. Defensive State Management
Prevent "Impossible States."
*   **Anti-Pattern:** `isLoading` (bool) and `error` (string).
    *   *Problem:* You can accidentally have `isLoading: true` AND `error: "Failed"`.
*   **Pro-Pattern:** Status Unions. `status: 'idle' | 'loading' | 'success' | 'error'`.
    *   *Benefit:* The compiler ensures you never render the wrong UI state.

## 6. Code Quality & Commits
*   **Conventional Commits:** `feat:`, `fix:`, `chore:`. This shows professionalism in the repo history.
*   **Testing:** We test the *logic*, not the React component implementation details.
    *   *Test:* "Does the calculator handle a 0 balance?" (Yes)
    *   *Don't Test:* "Is said button blue?" (Waste of time)

## 7. The "Wow" Factor Checklist
Before marking a feature "Done", it must pass:
1.  **The "Jank" Test:** Does it stutter? (Fix: Optimization)
2.  **The "Stranger" Test:** Would a drunk student understand what to do in 3 seconds? (Fix: Better copy/UI)
3.  **The "Refresh" Test:** If I reload the page, is my data still there? (Fix: Persistence)
