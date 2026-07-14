# Skill: Code Review & Refactoring

Read this file before reviewing or refactoring any code.

## Review philosophy

A good review improves the code without rewriting it for style preference. Focus on:
1. **Correctness** — does it do what it's supposed to?
2. **Safety** — type errors, edge cases, error handling gaps
3. **Consistency** — follows the patterns in `CLAUDE.md` and the skill files
4. **Maintainability** — will the next person understand this?

Not the focus: code style that `eslint`/`prettier` already enforces, naming micro-preferences, personal taste.

## Review checklist

Run through this checklist for every review:

### TypeScript
- [ ] No `any` types — every value is typed
- [ ] No `as X` type assertions without a comment explaining why it's safe
- [ ] No `!` non-null assertions without a guard or comment
- [ ] API response types match the actual API contract
- [ ] Generic types used where appropriate (not repeated near-identical types)

### React
- [ ] No `useEffect` used for data fetching (should be TanStack Query)
- [ ] No `useEffect` used for derived state (compute inline or `useMemo`)
- [ ] No `useEffect` with missing or incorrect dependencies
- [ ] No `key={index}` in dynamic lists
- [ ] Loading, error, and empty states are all handled
- [ ] No prop drilling beyond 2 levels (use context or Zustand)
- [ ] Component is under 150 lines

### State management
- [ ] Server data is in TanStack Query (not Zustand)
- [ ] UI/client state is in Zustand (not an ad-hoc prop chain)
- [ ] Query keys use the `queryKeys` factory (no inline string arrays)
- [ ] Mutations invalidate the right query keys on success
- [ ] Zustand selectors use `useShallow` for multi-field selections

### API layer
- [ ] All requests go through `apiClient` (no raw `fetch` or `axios` calls)
- [ ] Error handling is at the query/mutation layer, not the component
- [ ] No API URLs hardcoded — use `import.meta.env.VITE_*`
- [ ] Sensitive data (tokens) not logged

### Styling
- [ ] No inline `style={}` — Tailwind only
- [ ] `cn()` used for conditional classes
- [ ] No raw hex colours — design tokens only
- [ ] No files in `src/components/ui/` were modified
- [ ] Dark mode works (semantic tokens used, not hardcoded colours)

### Accessibility
- [ ] Icon-only buttons have `aria-label`
- [ ] Form inputs have associated labels
- [ ] Interactive elements are keyboard accessible
- [ ] `role` attributes used correctly (no `role="button"` on a `<div>` — use `<button>`)

### Tests
- [ ] New logic has tests
- [ ] Tests use role-based RTL queries (`getByRole` first)
- [ ] No snapshot tests added
- [ ] No `it.only` or `it.skip` left in

---

## Refactoring patterns

### Extract a custom hook when

A component has more than 2–3 related `useState` / `useEffect` calls that belong together:

```tsx
// ❌ Before — logic tangled in component
function SessionTimer({ sessionId }) {
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  // ... JSX
}

// ✅ After — hook extracted
function useSessionTimer() {
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  return { elapsed, isRunning, start: () => setIsRunning(true), stop: () => setIsRunning(false) }
}

function SessionTimer({ sessionId }) {
  const { elapsed, isRunning, start, stop } = useSessionTimer()
  // ... JSX only
}
```

### Split a component when

It has clearly distinct sections with their own concerns:

```tsx
// ❌ Before — one big component
function SessionPage() {
  // 50 lines of booking logic
  // 40 lines of participant list logic
  // 60 lines of task panel logic
  // 80 lines of JSX mixing all three
}

// ✅ After — clear responsibilities
function SessionPage() {
  return (
    <div className="flex gap-6">
      <SessionBookingPanel />
      <ParticipantList />
      <TaskPanel />
    </div>
  )
}
```

### Replace repeated JSX with a component when

The same structure appears 3+ times with varying data.

### Replace magic values with constants when

```tsx
// ❌
if (streak > 7) { ... }
setTimeout(handleTimeout, 30000)

// ✅
const STREAK_MILESTONE_DAYS = 7
const SESSION_TIMEOUT_MS = 30_000

if (streak > STREAK_MILESTONE_DAYS) { ... }
setTimeout(handleTimeout, SESSION_TIMEOUT_MS)
```

## What NOT to refactor

- Don't refactor just to match a different stylistic preference that isn't in the coding standards
- Don't extract a component for code that appears only once and is unlikely to be reused
- Don't change working, tested code unless there's a clear correctness or maintainability gain
- Don't rewrite a feature during a bug fix — fix the bug, log the refactor as a separate task
