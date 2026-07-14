# Skill: Writing Components

Read this file before writing any React component.

## Component anatomy

Every component follows this structure — in this order:

```tsx
// 1. Imports (external → internal @/ → relative)
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { SomeChildComponent } from './SomeChildComponent'

// 2. Types (props interface directly above the component that uses it)
interface MyComponentProps {
  title: string
  onConfirm: () => void
  className?: string
}

// 3. Component (named export, not default)
export function MyComponent({ title, onConfirm, className }: MyComponentProps) {
  // 3a. Hooks first (state, queries, derived values)
  const [isOpen, setIsOpen] = useState(false)

  // 3b. Derived / computed values (no useEffect for this)
  const displayTitle = title.trim() || 'Untitled'

  // 3c. Handlers
  function handleConfirm() {
    onConfirm()
    setIsOpen(false)
  }

  // 3d. Early returns (loading, error, empty states)
  if (!title) return null

  // 3e. Render
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <h2>{displayTitle}</h2>
      <Button onClick={handleConfirm}>Confirm</Button>
    </div>
  )
}
```

## Tailwind + cn()

Always use `cn()` from `@/lib/utils` when merging conditional classes:

```tsx
// ✅ correct
<div className={cn('base-class', isActive && 'text-primary', className)} />

// ❌ wrong — string concatenation breaks Tailwind's purge
<div className={`base-class ${isActive ? 'text-primary' : ''}`} />
```

Never use `style={{}}` inline styles. If something can't be done in Tailwind, add it to a CSS file and document why.

## Shadcn/ui usage

Use Shadcn components as the base for all UI elements. Do not rebuild buttons, inputs, dialogs, etc. from scratch.

```tsx
// ✅ Use Shadcn primitives
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// ❌ Don't reinvent
<button className="px-4 py-2 bg-primary rounded">...</button>
```

Extend Shadcn components using the `className` prop and `cn()` — never edit files in `src/components/ui/` directly.

## Component size rules

| Lines   | Action                                          |
|---------|-------------------------------------------------|
| < 150   | Fine as-is                                      |
| 150–250 | Look for a sub-component to extract             |
| > 250   | Must split — no exceptions                      |

Good split signals: repeated JSX patterns, a logical sub-section with its own state, a chunk that could be reused elsewhere.

## Props discipline

```tsx
// ✅ Explicit, typed, documented with JSDoc if non-obvious
interface SessionCardProps {
  sessionId: string
  /** ISO timestamp of when the session starts */
  startsAt: string
  isBooked?: boolean
  onBook: (sessionId: string) => void
}

// ❌ Loose — hard to use, hard to refactor
interface SessionCardProps {
  data: any
  callback: Function
}
```

- No optional prop should be required to make the component work
- Boolean props default to `false` — never require explicit `false`
- Avoid prop-drilling more than 2 levels — use context or Zustand instead

## Render patterns

### Loading states
```tsx
if (isLoading) return <SessionCardSkeleton />
```
Always use a skeleton, not a spinner, for content that has a known shape.

### Error states
```tsx
if (isError) return <ErrorMessage message="Could not load session. Try again." />
```
Never expose raw error messages to the user.

### Empty states
```tsx
if (sessions.length === 0) return <EmptyState message="No sessions booked yet." cta="Book your first session" onCta={handleBook} />
```
Empty states should always include a call to action where relevant.

### Lists
```tsx
// ✅ Stable key — always use a real ID
{sessions.map((session) => (
  <SessionCard key={session.id} {...session} />
))}

// ❌ Index as key — breaks on reorder/add/remove
{sessions.map((session, index) => (
  <SessionCard key={index} {...session} />
))}
```

## React 19 patterns to use

```tsx
// use() for async data in Server Components or Suspense boundaries
const data = use(fetchSomething())

// useOptimistic for instant UI feedback on mutations
const [optimisticState, addOptimistic] = useOptimistic(tasks, (state, newTask) => [...state, newTask])

// useFormStatus inside a form component to get pending state
const { pending } = useFormStatus()
```

## Accessibility checklist (before marking a component done)
- [ ] All interactive elements reachable by keyboard (Tab, Enter, Space, Escape)
- [ ] `aria-label` on icon-only buttons
- [ ] Form inputs have associated `<label>` elements
- [ ] Focus is managed correctly in modals (trapped inside, returned on close)
- [ ] Colour is not the only indicator of state (add icon or text label)
