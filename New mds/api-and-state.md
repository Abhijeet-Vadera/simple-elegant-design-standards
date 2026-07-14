# Skill: API Integration & State Management

Read this file before writing any data fetching, API integration, or state management code.

---

## Part 1 — TanStack Query (server state)

### The golden rule
**All server data lives in TanStack Query. Never in Zustand.**

Zustand is for client-only state (UI state, user preferences, in-session data). If it comes from an API, it belongs in a Query.

### Query key convention

Query keys are arrays and must be structured hierarchically:

```ts
// Convention: ['resource', scope?, filters?]
['sessions']                                    // all sessions
['sessions', { status: 'upcoming' }]            // filtered
['sessions', sessionId]                         // single item
['sessions', sessionId, 'tasks']                // nested resource
['member', memberId]
['member', memberId, 'stats']
```

Define all query keys in a central file to avoid duplication:

```ts
// src/lib/api/queryKeys.ts
export const queryKeys = {
  sessions: {
    all: () => ['sessions'] as const,
    filtered: (filters: SessionFilters) => ['sessions', filters] as const,
    detail: (id: string) => ['sessions', id] as const,
    tasks: (id: string) => ['sessions', id, 'tasks'] as const,
  },
  member: {
    detail: (id: string) => ['member', id] as const,
    stats: (id: string) => ['member', id, 'stats'] as const,
  },
}
```

### Writing query hooks

Every API endpoint gets its own custom hook in `src/features/[feature]/api/` or `src/lib/api/`:

```ts
// src/features/sessions/api/useSessions.ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/queryKeys'
import { apiClient } from '@/lib/api/client'
import type { Session } from '@/types/session.types'

export function useSessions(filters?: SessionFilters) {
  return useQuery({
    queryKey: queryKeys.sessions.filtered(filters ?? {}),
    queryFn: () => apiClient.get<Session[]>('/sessions', { params: filters }),
    staleTime: 1000 * 60 * 2, // 2 minutes — sessions change infrequently
  })
}
```

### Writing mutation hooks

```ts
// src/features/sessions/api/useBookSession.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/queryKeys'
import { apiClient } from '@/lib/api/client'
import type { BookSessionPayload } from '@/types/session.types'

export function useBookSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BookSessionPayload) =>
      apiClient.post('/sessions/book', payload),

    onSuccess: () => {
      // Invalidate affected queries so UI reflects the change
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all() })
    },

    onError: (error) => {
      // Error toast is handled here, not in the component
      console.error('Booking failed:', error)
    },
  })
}
```

### staleTime guide

| Data type                 | staleTime          |
|---------------------------|--------------------|
| Session schedule          | 2 minutes          |
| Member profile / stats    | 5 minutes          |
| Gamification (points etc) | 1 minute           |
| Live room state           | 0 (always fresh)   |
| Static config / levels    | 30 minutes         |

### Optimistic updates

Use optimistic updates for fast-feeling UI on mutations the user triggers directly:

```ts
useMutation({
  mutationFn: tickOffTask,
  onMutate: async (taskId) => {
    // Cancel any in-flight refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.sessions.tasks(sessionId) })

    // Snapshot previous value
    const previous = queryClient.getQueryData(queryKeys.sessions.tasks(sessionId))

    // Optimistically update
    queryClient.setQueryData(queryKeys.sessions.tasks(sessionId), (old: Task[]) =>
      old.map(t => t.id === taskId ? { ...t, completed: true } : t)
    )

    return { previous }
  },
  onError: (_err, _taskId, context) => {
    // Roll back on error
    queryClient.setQueryData(queryKeys.sessions.tasks(sessionId), context?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions.tasks(sessionId) })
  },
})
```

### API client setup

```ts
// src/lib/api/client.ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach auth token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global error handling
apiClient.interceptors.response.use(
  (response) => response.data, // unwrap data by default
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
    }
    return Promise.reject(error)
  }
)
```

---

## Part 2 — Zustand (client state)

### What belongs in Zustand

| ✅ Zustand                          | ❌ Not Zustand (use Query)       |
|-------------------------------------|----------------------------------|
| Auth token + user session           | Session schedule data            |
| Live room UI state (timer, mute)    | Member stats                     |
| Task list (in-session, transient)   | Booking history                  |
| Notification preferences (local)    | Any data that lives on the server|
| Theme / display preferences         |                                  |

### Store structure

One file per slice. Keep slices small and focused:

```ts
// src/features/room/store/useRoomStore.ts
import { create } from 'zustand'

interface RoomState {
  // State
  timerRunning: boolean
  isMuted: boolean
  currentSegment: 'intro' | 'focus' | 'celebration'

  // Actions — always defined in the same interface
  startTimer: () => void
  stopTimer: () => void
  setSegment: (segment: RoomState['currentSegment']) => void
}

export const useRoomStore = create<RoomState>((set) => ({
  // Initial state
  timerRunning: false,
  isMuted: true,
  currentSegment: 'intro',

  // Actions
  startTimer: () => set({ timerRunning: true }),
  stopTimer: () => set({ timerRunning: false }),
  setSegment: (segment) => set({ currentSegment: segment }),
}))
```

### Zustand rules
- State and actions live in the same `create()` call — no separate action files
- Actions are named as verbs: `startTimer`, `setSegment`, `clearAuth` (not `timer`, `segment`)
- Never mutate state directly — always use `set()`
- For complex updates, use `set((state) => ({ ... }))` with the function form
- Use `useShallow` when selecting multiple fields to avoid unnecessary re-renders:

```ts
// ✅ No re-render if unrelated state changes
const { timerRunning, currentSegment } = useRoomStore(
  useShallow((state) => ({ timerRunning: state.timerRunning, currentSegment: state.currentSegment }))
)

// ❌ Re-renders whenever anything in the store changes
const store = useRoomStore()
```

### Persisted state (auth token)

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  setToken: (token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearAuth: () => set({ token: null }),
    }),
    { name: 'auth-storage' }
  )
)
```

Only persist what truly needs to survive a page reload. Never persist sensitive data beyond the token.
