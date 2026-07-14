# 01 — Design Constitution

Immutable laws for anyone (human or AI) touching this design system. Every rule below is derived from an observed, repeated pattern in `src/shared/*` — none are invented. Rules are grounded, not padded to hit an arbitrary count: this file plus [[09_DESIGN_REVIEW_CHECKLIST]] together contain every distinct rule the codebase actually supports.

Cite `02_DESIGN_DNA.json` for exact values referenced below.

## Color

1. NEVER introduce a new hex color without checking it against `02_DESIGN_DNA.json` first — nearly every color need is already covered by ink `#0A0A0A`, canvas `#F7F7F5`, surface `#FFFFFF`, or the stock gray ramp (`#E5E7EB`/`#D1D5DB`/`#9CA3AF`/`#6B7280`/`#374151`/`#111827`).
2. ALWAYS use `#0A0A0A` for primary text and primary action surfaces — never pure `#000000`.
3. ALWAYS use `#F7F7F5` for the app canvas — never pure `#FFFFFF` or `#F9FAFB` for the page background (reserve pure white for cards/surfaces sitting ON the canvas).
4. NEVER invent a new semantic status color. Success/warning/danger/info are fixed triads (border/bg/text) — see `color.semantic` in `02_DESIGN_DNA.json`. Reuse them verbatim in any new Badge/StagePill-like component.
5. ALWAYS use the softer badge red (`#B91C1C` text on `#FEE2E2`) for status/label danger, and the harsher `#DC2626`/`#EF4444` only for actionable error text (form validation, danger button text) — the two reds are not interchangeable.
6. NEVER use fully saturated primary colors (bright blue, bright red, bright green) as button or surface fills — this system is monochrome-first with pastel-only semantic accents.
7. ALWAYS tint shadows with the ink color (`rgba(10,10,10, α)`), never pure black (`rgba(0,0,0, α)`), to stay consistent with the rest of the system — the one documented outlier (`SubmissionQRModal`'s `rgba(0,0,0,0.6)`) is a flagged exception, not a pattern to repeat.
8. ALWAYS use `#F3F4F6` for hover-state fills on ghost/secondary surfaces (menu items, ghost buttons, segmented control track).
9. NEVER add `dark:` Tailwind variants or a theme toggle — dark mode does not exist in this product and must not be silently introduced.
10. ALWAYS treat the sidebar's dark surface (`#0A0A0A`/`#161616`/`#1C1C1C`) as a fixed structural color, not a dark-mode preview — it applies only to the sidebar, never to the main canvas.
11. NEVER use stock Tailwind palette classes (`indigo-600`, `purple-600`, `slate-100`, etc.) in new components — several legacy/secondary screens do this and it is documented tech debt, not a convention to extend.
12. ALWAYS derive file-type glyph colors via the fixed `FILE_COLORS` map (`PDF #DC2626`, `CSV #16A34A`, `XLSX #2563EB`, `PPT #D97706`, `PNG/JPG #7C3AED`, fallback `#6B7280`) with background = `color + "18"` and border = `color + "28"` hex-alpha suffixes — never a different alpha convention.
13. NEVER apply color as the sole means of conveying state (stage, priority, error) — every colored indicator in this system is paired with text or an icon (StagePill always renders a label, Priority always renders the word "High/Medium/Low").
14. ALWAYS use `#9CA3AF` for placeholder/tertiary/disabled-adjacent text, `#6B7280` for secondary text, `#0A0A0A` for primary — never invent a fourth gray step for text.
15. ALWAYS use `rgba(10,10,10,0.06)` for the 3px focus ring shadow on form controls — never a colored (blue) focus ring.

## Typography

16. NEVER introduce a third font family. Inter (UI/language) and JetBrains Mono (data/labels) are the complete set.
17. ALWAYS use JetBrains Mono exclusively for non-prose tokens: idea reference codes, counts, timestamps, "eyebrow" section labels, priority meters. NEVER use it for sentences, descriptions, or body copy.
18. ALWAYS render "eyebrow" labels as uppercase JetBrains Mono, `11px`, `letter-spacing: 0.14em`, color `#9CA3AF` — reuse the `.text-eyebrow` utility class or its exact inline equivalent, never a new eyebrow style.
19. NEVER use a font-weight outside the loaded set (Inter 400/450/500/600/700, JetBrains Mono 400/500). Weight 450 is reserved for eyebrow/mono-custom text and menu items — don't reassign it elsewhere without reason.
20. ALWAYS set page titles (`PageHeader` h1) at `30px / weight 600 / letter-spacing -0.02em / line-height 1.12` — never a different page-title treatment on a new screen.
21. ALWAYS use negative letter-spacing on headings/large numerals (titles ~-0.02em, stat values ~-0.03em, card titles ~-0.008em) and neutral-to-positive tracking only on uppercase mono labels (+0.14em) — never negative-tracked mono labels or positive-tracked headings.
22. NEVER let body/UI text drop below ~11px or exceed ~30px anywhere outside a stat/hero numeral — the working range is 10.5–17px for standard UI text.
23. ALWAYS apply `font-feature-settings: "cv11","ss01"` at the document root (already set globally) — never override it per-component.
24. ALWAYS load fonts via the existing Google Fonts `@import` in `src/index.css` — never add a second font-loading mechanism (no `next/font`, no self-hosted `@font-face` — this is a Vite SPA, not Next.js).

## Spacing & Layout

25. NEVER invent a spacing value outside the Tailwind default 4px-based scale — this project has no custom spacing scale, and inline pixel values in `style={}` objects still land on 4px multiples (or half-steps like 6/10/14/18/22/28).
26. ALWAYS use `13px 18px` padding for compact list-row components (matching `IdeaRow`), and `18px 20px` for card body padding (matching `StatCard`) — don't invent a third card-padding convention.
27. ALWAYS give `PageHeader` a `28px` bottom margin before page content begins — this is the fixed rhythm between header and body across all screens.
28. ALWAYS keep the sidebar at a fixed `248px` width — never make it responsive/collapsible without an explicit product decision, since no collapse logic exists anywhere in the codebase.
29. ALWAYS keep the topbar at `64px` (`h-16`) — a new layout region must not introduce a second header height.
30. NEVER design a new page assuming a mobile/tablet breakpoint collapses the sidebar — this is a desktop-only admin dashboard; no responsive nav pattern exists to reuse.
31. ALWAYS pad modal overlays with `32px` from the viewport edge and empty states with `56px 24px` — reuse these exact values rather than approximating.

## Radius

32. NEVER pick a border-radius outside the established scale: `6-8px` (controls/checkboxes), `8-12px` (cards/inputs/dropdown panels), `14-20px` (modals/large surfaces/empty-state icon wells), `999px`/`50%` (pills/avatars/dots).
33. ALWAYS use `8px` for buttons, inputs, and badges' smaller kin (checkboxes use `5px` specifically) — never round a button more than its established `8px`.
34. ALWAYS use `999px` (or `50%` for perfect circles) for anything pill-shaped or circular — Badge, StagePill, Toggle track, avatars, dots, segmented-control corners' inner buttons use `7px`, not pill, so don't over-round segmented items either.
35. ALWAYS use `16px` for modal panels specifically (not the generic `12px` card radius) — modals are visually distinct from cards by radius alone.

## Shadow / Elevation

36. NEVER use a shadow outside the 4-step scale (`xs/sm/md/lg` in `02_DESIGN_DNA.json`) plus the two named exceptions (dropdown panel, drawer panel) — don't invent a 5th elevation step.
37. ALWAYS reuse `0 4px 16px rgba(10,10,10,0.06)` for floating dropdown/menu panels and `0 24px 60px rgba(10,10,10,0.14), 0 8px 24px rgba(10,10,10,0.08)` for modals — these are the two most load-bearing shadow values in the system.
38. NEVER add a colored glow shadow (brand-colored blur) — every shadow in this system is neutral ink-tinted, there is no glow/aura decorative pattern.
39. ALWAYS treat `rgba(0,0,0,0.6)` (used once, for the full-screen QR modal) as a documented exception for a genuinely full-viewport takeover, not a default to copy for ordinary modals.

## Motion

40. ALWAYS use the shared ease-out-expo curve `cubic-bezier(0.16, 1, 0.3, 1)` for entrance/settle animations — this is the signature curve of the entire product; a new animated component using a different easing will visually clash.
41. NEVER hand-write a new Framer Motion `Variants` object without first checking `src/shared/lib/animations.ts` for an existing one that fits (screenVariants, fadeUp, staggerContainer/Item, overlayVariants, modalVariants, dropdownVariants/Container/Item, toastVariants, slideInRight, fadeVariants, progressBarVariants).
42. ALWAYS keep new UI-feedback animations (modals, dropdowns, toasts, page transitions) between `0.15s` and `0.6s` — nothing in this system animates slower than 0.6s or faster than 0.12s (the fastest is dropdown-item exit at 0.12s).
43. ALWAYS import shared motion constants from `src/shared/lib/animations.ts` (the canonical file), never from the legacy `src/lib/animations.ts` — the two have already drifted (modal duration 0.42s legacy vs 0.28s canonical) and importing the wrong one reintroduces inconsistency.
44. ALWAYS respect `prefers-reduced-motion` — new CSS transitions/animations are automatically covered by the global media query in `src/index.css`, but new Framer Motion usage should still branch on `useReducedMotion()` since Framer variants are not auto-disabled by the CSS rule (documented gap).
45. ALWAYS use a spring (`stiffness 420, damping 32` default) for anything that should feel physically "settled" (org-card entrances) and the ease-out-expo curve for anything that should feel "revealed" (dropdowns, modals, page content) — don't mix the two roles.
46. NEVER add `animation-duration` values that don't map to an existing named constant (`EASE_OUT` 0.5s, `EASE_FAST` 0.32s, or one of the per-component durations in `02_DESIGN_DNA.json`).

## Icons

47. NEVER import a third-party icon library (Lucide, Heroicons, Feather) for new icons — build any missing icon in the same hand-drawn convention as `src/shared/components/ui/Icons.tsx` (24×24 viewBox, `strokeWidth: 1.5`, `stroke="currentColor"`, round caps/joins, default size 16).
48. ALWAYS check `src/shared/components/ui/Icons.tsx` for an existing icon before drawing a new one — ~40 icons already exist covering common domain needs (nav, actions, files, arrows, status).
49. NEVER use `@phosphor-icons/react` in new code even though it's an installed dependency — it is used in exactly one legacy file and is not the icon convention to extend.
50. ALWAYS render icons at 12–16px in dense UI contexts (rows, badges, buttons) — the system's default is 16px but most rendered instances are actually 12-14px; don't default new icon usage to 20px+ without a specific reason (e.g., EmptyState's 22px icon, which is the deliberate large exception).

## Components

51. NEVER build a new Button, Badge, Input, Modal, Menu, or Tabs from scratch — import and compose the existing primitive from `src/shared/components/ui/index.tsx`.
52. ALWAYS import UI primitives from `@/shared/components/ui`, never from the legacy `@/components/ui` — the legacy barrel is a superseded duplicate with fewer components and drifted styling.
53. NEVER add a new Button variant without first checking the existing five (`primary`/`secondary`/`outline`/`ghost`/`danger`) — note `secondary` and `outline` currently render identically; do not "fix" this without a product decision, and do not add a sixth variant that only cosmetically differs from an existing one.
54. ALWAYS use `Field` to wrap any labeled form control (label + hint + error) rather than hand-rolling label/error markup per screen.
55. ALWAYS drive validation errors through the `error` boolean/string prop already supported by `Input`/`Textarea`/`Select`/`ReactSelect`/`Field` — never invent a parallel error-styling mechanism.
56. NEVER add a client-side form-validation library (react-hook-form, zod, formik) to match "modern" convention — this codebase deliberately hand-rolls `validate()` functions per screen; introducing a library would fragment the pattern without a product decision to standardize.
57. ALWAYS route all app-level modals through `ModalHost` + the `useUiStore.openModal(type, payload)` pattern — never mount a bespoke modal outside this system for anything that behaves like a global dialog.
58. ALWAYS use the `Toast` system (`useUiStore.showToast()`) for transient success/error feedback — never a one-off inline banner for the same purpose.
59. NEVER build a second global dropdown/menu implementation — `Menu` (action lists) and `Dropdown`/`ReactSelect` (form select) already cover the two distinct dropdown use cases; pick the one matching the use case rather than inventing a third pattern.
60. ALWAYS use `StagePill` for workflow-stage state and `Badge` for everything else state-like (counts, categories, generic status) — don't use `Badge` to represent a workflow stage id, since `StagePill` already encodes the stage color map.
61. ALWAYS use `Priority` for High/Medium/Low priority display (3-bar meter + label) rather than a Badge variant — Priority is a distinct, already-solved pattern.
62. NEVER hand-roll a loading spinner — use `Spinner` (Framer Motion, 0.7s linear) for inline loading and `DataLoader` for full-section loading states.
63. ALWAYS use `EmptyState` for "nothing here yet" states (icon well 52px/radius 14px, title 17px/600, body 13px gray, optional action) rather than a bespoke empty message.
64. ALWAYS use `Pagination` for paginated lists — it already renders the "`{total} total · page {page} of {totalPages}`" pattern and Prev/Next buttons; don't reformat this string per screen.
65. NEVER treat `Drawer` as dead just because no screen currently uses it visibly — verify with a fresh grep before removing it; if truly unused, flag for removal rather than silently deleting (a documentation task must not delete source code regardless).
66. ALWAYS use `AvatarStack` (not manually offset `Avatar`s) when rendering 2+ overlapping avatars — it already encodes the `-8px` overlap and `+N` overflow badge.
67. ALWAYS pass an `icon` component reference (not a rendered `<Icon/>` element) into `Button`/`IconButton`/`Input` — these primitives render the icon themselves at a fixed size keyed to the control size.
68. NEVER give `Toggle` or `Checkbox` a third visual state beyond checked/unchecked/disabled — no indeterminate state exists in this system; if one is needed, extend deliberately rather than approximating with opacity tricks.

## React / Architecture

69. NEVER import from `src/components/*`, `src/store/*`, `src/lib/*`, `src/types/*`, `src/data/*`, `src/config/*` in new code — these are legacy, pending-deletion duplicates of `src/shared/*`. Always import the `src/shared/*` equivalent.
70. ALWAYS place new domain code under `src/features/<feature>/{container,components,services,hooks,types}` — screens go in `container/`, feature-local reusable pieces in `components/`.
71. ALWAYS suffix screen components `...Screen.tsx` (or the established `...Page.tsx` exception for `IdeasPage.tsx`) — don't introduce a third naming suffix.
72. ALWAYS register new routes in `src/routes/routes.config.ts` (the single source of truth for path/access/nav) and add the lazy import to `src/routes/lazyScreens.ts` — never hand-wire a `<Route>` directly in `AppRouter.tsx`.
73. ALWAYS express role gating through the route's `access` field (`'public' | 'any' | Role[]`) and cross-check `src/shared/lib/rbac.ts` permissions for in-page action gating — don't invent a third authorization mechanism.
74. NEVER surface an idea's submitter identity to the `management` role — this is a hard, explicitly documented privacy rule (`hideSubmitter = role === 'management'`), not a styling preference.
75. ALWAYS use the `@/` path alias (mapped to `src/`) for new imports — configured identically in `vite.config.ts` and `tsconfig.app.json`; never use deep relative imports (`../../../`) across feature boundaries.
76. ALWAYS use TanStack Query (`useQuery`/`useMutation`) via the existing hook folders (`src/hooks/{get,post,put,patch,delete}`) for server state — never call `HttpService`/axios directly from a component.
77. ALWAYS use Zustand for cross-component client state (modals, toasts, layout header, session) by extending one of `src/shared/store/{uiStore,authStore,layoutStore,todoStore}.ts` — don't add a second state-management library.
78. NEVER add Redux, MobX, Recoil, or Context-based global state as an alternative to the existing Zustand stores.
79. ALWAYS keep chart/visualization components hand-rolled SVG (matching `src/components/shared/charts/*`) unless the team explicitly adopts a charting library — introducing recharts/d3/visx for one new chart would fragment the visual language (hand-tuned donut/bar math vs. library defaults look different).
80. NEVER add Storybook or `.stories.*` files as a side effect of a feature task — this repo has deliberately not adopted Storybook; component documentation lives in this `.ai-design-dna/` pack and inline TS types instead.
81. ALWAYS keep `react-refresh`-incompatible exports (non-component values) out of files that also export components — this is why `lazyScreens.ts` is split from `AppRouter.tsx`; follow the same split for any new large route/component map.
82. NEVER use `class-variance-authority` (cva) — variant props in this system are plain TS unions resolved through `Record<Variant, string>` lookup objects (see `btnVariants`, `STAGE_STYLE`, `FILE_COLORS`); stay consistent with that pattern rather than introducing cva for a new component.

## i18n / Content

83. ALWAYS route user-facing strings through `i18next`/`react-i18next` (`src/i18n/locales/{en,de}.json`) rather than hardcoding English strings in new components — this app supports en/de throughout.
84. ALWAYS pass the current i18n locale into `DatePicker` (it already switches react-datepicker's locale) rather than assuming a fixed date format.

## Accessibility

85. ALWAYS keep `role="switch"`/`aria-checked` on `Toggle` and `role="checkbox"`/`aria-checked` on `Checkbox` when extending these — don't strip ARIA attributes for a visual-only variant.
86. ALWAYS close `Modal`/`Drawer` on `Escape` (already wired via a `keydown` listener) — any new full-screen overlay must replicate this behavior, not just a click-outside-to-close.
87. NEVER rely on color alone to signal focus — the `0 0 0 3px rgba(10,10,10,0.06)` focus ring plus a border-color change is the paired signal; a new control must implement both, not just a border tint.
