# 15 — AI Constitution (READ FIRST)

This is the highest-priority document in `.ai-design-dna/`. **Any AI agent must read this file completely before writing, editing, or reviewing a single line of UI code in this project.** If a generated screen or component violates a law below, it is not "done" — it must be revised until compliant before being presented to the user.

This file is the gate. [[10_AI_SKILL]] is the map of everything else. [[01_DESIGN_CONSTITUTION]] and [[09_DESIGN_REVIEW_CHECKLIST]] are the detailed rulebooks this file summarizes and enforces.

## Law 0 — What this project is

This system is a role-gated, desktop-only, internal innovation-management SPA (Vite + React 19 + TypeScript). It is not a marketing site, not a mobile app, not a consumer product. Every design decision below exists to serve a dense, operator-facing back-office tool. See [[00_PROJECT_IDENTITY]].

## Law 1 — There is exactly one canonical component/token system

`src/shared/*` is canonical. `src/components/*`, `src/store/*`, `src/lib/*`, `src/types/*`, `src/data/*`, `src/config/*` are legacy, drifted, pending-deletion duplicates.

- An AI **must never** import from a legacy path in new code.
- An AI **must never** copy a pattern it finds in a legacy path just because it compiles and is imported somewhere — check `src/shared/*` first.
- If genuinely unsure which tree is canonical for something not listed above, grep import counts (`shared/*` will dominate) before deciding.

## Law 2 — Never invent a token

Every color, spacing value, radius, shadow, font, motion curve/duration, and icon style this product needs already exists in [[02_DESIGN_DNA.json]] and `tailwind.config.js`. An AI generating new UI:

- **Must** look up the nearest existing token before writing a literal value.
- **Must not** introduce a new hex color, a new border-radius step, a new shadow, or a new easing curve without an explicit user instruction to extend the system.
- **Must** default to the ink-on-off-white monochrome palette (`#0A0A0A` / `#F7F7F5` / `#FFFFFF` / stock Tailwind gray ramp) plus the four semantic triads (success/warning/danger/info) — this is a near-monochrome system, not a colorful one.

## Law 3 — Compose, don't recreate

Buttons, badges, inputs, modals, menus, tabs, empty states, spinners, pagination, avatars, and stage/priority indicators already exist in `src/shared/components/ui/index.tsx`. An AI **must** compose from these primitives (see [[04_COMPONENT_LIBRARY]] and [[13_COMPONENT_CATALOG]]) rather than writing new markup that reimplements the same concept with different styling.

## Law 4 — Motion has one signature curve

The ease-out-expo curve `cubic-bezier(0.16, 1, 0.3, 1)`, defined once in `src/shared/lib/animations.ts`, drives nearly every entrance/settle animation in the product. An AI adding a new animated interaction **must** reuse an existing `Variants` constant or the shared easing/duration constants — never hand-roll a new curve or a duration outside the observed 0.12s–0.6s range. Import only from `src/shared/lib/animations.ts`, never the legacy `src/lib/animations.ts`.

## Law 5 — Typography carries hierarchy, not color

Inter is for language, JetBrains Mono is exclusively for IDs/counts/timestamps/eyebrow labels — never mixed. Hierarchy is built from size + weight + letter-spacing, not from introducing new colors for emphasis. An AI must not reach for a colored heading when a weight/size change is what the system actually does elsewhere.

## Law 6 — Icons are hand-drawn, not imported

New icons must match `src/shared/components/ui/Icons.tsx`'s convention exactly: 24×24 viewBox, `stroke="currentColor"`, `strokeWidth: 1.5`, round caps/joins, default 16px. An AI must not pull in Lucide/Heroicons/Feather/Phosphor for a new icon, even though `@phosphor-icons/react` is an installed (legacy, near-unused) dependency.

## Law 7 — This is a desktop-first, non-responsive shell

The sidebar is a fixed 248px, the topbar a fixed 64px, and there is no mobile/tablet collapse logic anywhere in `Shell.tsx`. An AI must not assume responsive breakpoints exist for the app shell unless building genuinely new responsive behavior on explicit request — see [[06_LAYOUT_SYSTEM]].

## Law 8 — Respect the architecture, not just the pixels

- New screens live in `src/features/<feature>/container/`, are registered in `src/routes/routes.config.ts`, and lazy-imported via `src/routes/lazyScreens.ts`.
- Server state goes through TanStack Query hooks in `src/hooks/{get,post,put,patch,delete}`, never direct axios/`HttpService` calls from a component.
- Client/global state goes through the existing Zustand stores in `src/shared/store/`, never a new state library.
- Role/permission gating goes through `routes.config.ts` `access` + `src/shared/lib/rbac.ts`, never a bespoke check.
- The `management` role must never see idea-submitter identity — this is a hard product privacy rule, not a UI nicety.

See [[08_REACT_PATTERNS]] for the full pattern set.

## Law 9 — No silent scope creep

- Do not add dark mode, a new state-management library, a form-validation library, a chart library, Storybook, or `cva` "to modernize" the codebase — none of these exist here by deliberate choice (or documented debt, not an invitation to fix opportunistically). Any of these would require an explicit user decision.
- Do not "clean up" the legacy `src/components/*`/`src/store/*`/etc. trees as a side effect of an unrelated task — flag the debt, don't silently refactor it away.

## Law 10 — When in doubt, match the nearest sibling

If a pattern is not explicitly documented in this pack, find the most similar existing screen/component under `src/shared/*` or `src/features/*` and match its spacing, color, motion, and structure exactly rather than improvising a "reasonable-looking" alternative. Consistency with a real sibling beats a plausible invention every time.

## Compliance check before finishing any UI task

Run the relevant sections of [[09_DESIGN_REVIEW_CHECKLIST]] against the generated output. If any law above is violated, revise before presenting the work as complete.
