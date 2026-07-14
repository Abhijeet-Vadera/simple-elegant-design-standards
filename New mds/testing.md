# Skill: Testing

Read this file before writing or updating any tests.

## Stack
- **Vitest** — test runner
- **React Testing Library (RTL)** — component tests
- **MSW (Mock Service Worker)** — API mocking
- No Enzyme, no shallow rendering

## Where tests live

Co-located with the file they test:

```
src/features/sessions/
├── components/
│   ├── SessionCard.tsx
│   └── SessionCard.test.tsx     ← co-located
├── api/
│   ├── useSessions.ts
│   └── useSessions.test.ts
└── hooks/
    ├── useSessionTimer.ts
    └── useSessionTimer.test.ts
```

## What to test

| Type                        | Test it?  | Notes                                         |
|-----------------------------|-----------|-----------------------------------------------|
| Component rendering         | ✅ Yes    | Key states: loading, error, empty, populated  |
| User interactions           | ✅ Yes    | Clicks, form submission, keyboard nav         |
| Custom hooks                | ✅ Yes    | Use `renderHook`                              |
| Zustand store actions       | ✅ Yes    | Test actions and state transitions            |
| API query hooks             | ✅ Yes    | With MSW handlers                             |
| Utility functions           | ✅ Yes    | Pure unit tests                               |
| Styling / visual regression | ❌ No     | Not in scope for V1                           |
| Implementation details      | ❌ No     | Don't test internal state or private methods  |

## Component test structure

```tsx
// SessionCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SessionCard } from './SessionCard'
import { createTestSession } from '@/test/factories/session'

describe('SessionCard', () => {
  it('renders session time and coach name', () => {
    const session = createTestSession({ startsAt: '2024-08-15T09:00:00Z' })
    render(<SessionCard session={session} onBook={vi.fn()} />)

    expect(screen.getByText('9:00 AM')).toBeInTheDocument()
    expect(screen.getByText(session.coachName)).toBeInTheDocument()
  })

  it('calls onBook with session id when Book button is clicked', async () => {
    const user = userEvent.setup()
    const onBook = vi.fn()
    const session = createTestSession()

    render(<SessionCard session={session} onBook={onBook} />)

    await user.click(screen.getByRole('button', { name: /book/i }))

    expect(onBook).toHaveBeenCalledWith(session.id)
    expect(onBook).toHaveBeenCalledTimes(1)
  })

  it('shows skeleton while loading', () => {
    render(<SessionCard session={undefined} isLoading onBook={vi.fn()} />)
    expect(screen.getByTestId('session-card-skeleton')).toBeInTheDocument()
  })

  it('shows error state when session fails to load', () => {
    render(<SessionCard isError onBook={vi.fn()} />)
    expect(screen.getByText(/could not load session/i)).toBeInTheDocument()
  })
})
```

## RTL query priority

Use queries in this order — most accessible first:

1. `getByRole` — always prefer this
2. `getByLabelText` — for form inputs
3. `getByPlaceholderText` — only if no label
4. `getByText` — for static text
5. `getByTestId` — last resort only; add `data-testid` sparingly

```tsx
// ✅ Role-based — tests like a user
screen.getByRole('button', { name: /book session/i })
screen.getByRole('heading', { name: /upcoming sessions/i })

// ❌ Test ID as first choice — ties tests to implementation
screen.getByTestId('book-button')
```

## API mocking with MSW

Define handlers in `src/test/handlers/`:

```ts
// src/test/handlers/sessions.ts
import { http, HttpResponse } from 'msw'
import { createTestSession } from '../factories/session'

export const sessionHandlers = [
  http.get('/api/sessions', () => {
    return HttpResponse.json([createTestSession(), createTestSession()])
  }),

  http.post('/api/sessions/book', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ success: true, sessionId: body.sessionId })
  }),
]
```

Override handlers per-test for error cases:

```ts
it('shows error when booking fails', async () => {
  server.use(
    http.post('/api/sessions/book', () => {
      return HttpResponse.json({ message: 'Session full' }, { status: 409 })
    })
  )
  // ... test the error state
})
```

## Test factories

Every significant data type should have a factory function in `src/test/factories/`:

```ts
// src/test/factories/session.ts
import { faker } from '@faker-js/faker'
import type { Session } from '@/types/session.types'

export function createTestSession(overrides: Partial<Session> = {}): Session {
  return {
    id: faker.string.uuid(),
    startsAt: faker.date.future().toISOString(),
    coachName: faker.person.fullName(),
    status: 'upcoming',
    capacity: 20,
    attendeeCount: faker.number.int({ min: 0, max: 19 }),
    ...overrides,
  }
}
```

## Zustand store tests

Reset store state between tests:

```ts
import { act, renderHook } from '@testing-library/react'
import { useRoomStore } from './useRoomStore'

beforeEach(() => {
  useRoomStore.setState(useRoomStore.getInitialState())
})

it('starts the timer when startTimer is called', () => {
  const { result } = renderHook(() => useRoomStore())

  act(() => result.current.startTimer())

  expect(result.current.timerRunning).toBe(true)
})
```

## Test quality rules

- Each test has one clear assertion target (it's fine to have multiple `expect` calls, but one *thing* being tested)
- Test names follow: `'[does something] when [condition]'` or `'renders [state]'`
- No `setTimeout` / `sleep` in tests — use `waitFor` or `findBy` queries for async
- No snapshot tests — they break constantly and test nothing meaningful
- Tests must pass in CI — no `it.only` or `it.skip` committed
