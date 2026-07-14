# Focus Revolution — Frontend

## Stack
- React 19 + TypeScript
- Tailwind CSS v4
- Shadcn/ui (component library)
- TanStack Query v5 (server state)
- Zustand (client state)
- React Router v7
- Vite (bundler)

## Project structure
```
src/
├── app/                  # Router setup, providers, global layout
├── components/           # Shared/reusable UI components
│   └── ui/               # Shadcn primitives (do not edit manually)
├── features/             # Feature-scoped modules
│   └── [feature]/
│       ├── components/   # Feature-specific components
│       ├── hooks/        # Feature-specific hooks
│       ├── store/        # Zustand slices for this feature
│       └── api/          # TanStack Query hooks for this feature
├── hooks/                # Shared custom hooks
├── lib/                  # Utilities, helpers, constants
│   ├── api/              # Axios instance, interceptors, types
│   └── utils.ts          # cn() and other shared utilities
├── store/                # Global Zustand stores
├── types/                # Global TypeScript types and interfaces
└── styles/               # Global CSS, Tailwind config
```

## Design system

Design tokens live in the codebase — not in any skill file. Before writing any styles, read:

```
src/styles/globals.css       — colours, gradients, shadows, radii, keyframes
src/lib/design-tokens.ts     — same tokens as TypeScript constants
```

When the design evolves, update those two files first. Never hardcode a colour, shadow, or radius that isn't already defined there — add it to the token files, then use it.

## Mandatory reading before tasks
Load the relevant skill file before starting any task:

| Task type                          | Skill file to load                          |
|------------------------------------|---------------------------------------------|
| Writing any component              | `.claude/skills/components.md`              |
| API integration / data fetching    | `.claude/skills/api-and-state.md`           |
| Global or feature state (Zustand)  | `.claude/skills/api-and-state.md`           |
| Styling / Tailwind / Shadcn        | `.claude/skills/styling.md`                 |
| Writing or updating tests          | `.claude/skills/testing.md`                 |
| Code review / refactoring          | `.claude/skills/code-review.md`             |

Always read the skill file FIRST — before writing any code.

## Non-negotiable rules (apply to every task)

### TypeScript
- `strict: true` is always on — no `any`, no `@ts-ignore` without a comment explaining why
- All props, API responses, and store slices must be explicitly typed
- Prefer `interface` for object shapes, `type` for unions/intersections
- Never use `as unknown as X` to force types — fix the upstream type instead

### React
- **React 19 only** — use `use()` hook for promise/context, `useFormStatus`, `useOptimistic` where appropriate
- Functional components only — no class components
- Keep components small; if a component exceeds ~150 lines, split it
- Co-locate state as close to where it's used as possible
- No `useEffect` for data fetching — that's what TanStack Query is for
- No `useEffect` for derived state — compute it inline or use `useMemo`
- `key` props must be stable IDs — never array indexes in dynamic lists

### File and naming conventions
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities / helpers: `camelCase.ts`
- Types files: `camelCase.types.ts` or co-located in the file they describe
- One component per file (except tiny sub-components that are never used elsewhere)
- All exports are named exports — no default exports except for route-level page components

### Imports
- Absolute imports via `@/` alias (e.g. `import { Button } from '@/components/ui/button'`)
- Never use relative `../../..` paths that go up more than one level
- Group imports: external libs → internal @/ → relative — separated by blank lines

### No-shame / accessibility (reflects the product's values)
- All interactive elements must be keyboard accessible
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, `<section>`, etc.)
- All images need `alt` text; decorative images use `alt=""`
- Never rely on colour alone to convey meaning
- `aria-label` on icon-only buttons

## Environment variables
- All env vars are prefixed `VITE_`
- Never hardcode URLs, keys, or environment-specific values
- Access via `import.meta.env.VITE_*` — never `process.env`
- Document every new env var in `.env.example`

## Error handling
- API errors are handled at the Query layer — not scattered in components
- User-facing errors show a clear, actionable message (never "Something went wrong")
- Use error boundaries at route level to catch unexpected crashes
- Log errors to console in dev; send to monitoring service in prod

## Git hygiene (when committing)
- Commit messages: `type(scope): description` — e.g. `feat(booking): add recurring slot UI`
- Types: `feat` `fix` `chore` `refactor` `test` `docs`
- Never commit `.env` files, `node_modules`, or build artefacts

## What NOT to do
- Do not install new packages without asking first
- Do not modify files inside `src/components/ui/` (Shadcn-managed)
- Do not use inline styles (`style={{}}`) — use Tailwind classes
- Do not create barrel `index.ts` files unless explicitly asked
- Do not add console.log statements to committed code
- Do not skip writing types to "save time"
