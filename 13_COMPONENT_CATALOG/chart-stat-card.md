# StatCard (chart variant) — NAME COLLISION with ui-kit `StatCard`

## Naming collision flag (read first)

**There are two components named `StatCard` in this codebase, and they are not interchangeable:**

1. **`src/shared/components/ui/index.tsx:1486`** — the canonical ui-kit `StatCard` (`primitiveList` entry in `.ai-design-dna/02_DESIGN_DNA.json` → `components.primitiveList`, and in `.ai-design-dna/12_DESIGN_TOKENS/components.json`). Prop shape: `{ label, value: number | string, icon?, iconBg?, iconBorder?, iconColor?, valueColor?, sub? }`. It renders the *value as given* — no internal number formatting/animation.
2. **`src/components/shared/charts/StatCard.tsx:4`** — the chart-package `StatCard` documented here. Prop shape: `{ title, value: number, sub?, icon?, accent, isCurrency? }`. It renders `value` through `@number-flow/react`'s `<NumberFlow>` for an animated digit roll, and does its own EUR currency formatting internally when `isCurrency` is true.

The prop names don't even overlap cleanly (`label` vs `title`, `value: string` accepted vs `value: number` required, `iconBg`/`iconBorder`/`iconColor` vs a single `accent` hex), so these are not drop-in substitutes for one another — an import-path typo (`@/shared/components/ui` vs `@/components/shared/charts/StatCard`) will not type-check cleanly in most call shapes, but a future AI could still confuse "the StatCard" as one concept. Treat them as two unrelated components that happen to share a name.

**This file documents only the chart variant** (`src/components/shared/charts/StatCard.tsx`). See `.ai-design-dna/13_COMPONENT_CATALOG/` for the ui-kit variant's own entry (it is documented under the ui-kit primitives set, not here).

## Purpose

A dashboard KPI tile: icon well + eyebrow label + large animated numeric value + optional sub-caption, intended for headline metrics (e.g. total economic impact, savings, profit). Functionally the same *idea* as the ui-kit `StatCard` but built independently with its own number-formatting and animation behavior via `NumberFlow`.

## File path & path-inconsistency flag

- **File:** `src/components/shared/charts/StatCard.tsx` (48 lines).
- **Path-inconsistency flag:** lives under `src/components/shared/charts/` — a legacy-shaped path (`src/components/...`) alongside the canonical modern tree at `src/shared/components/ui/index.tsx` (`.ai-design-dna/02_DESIGN_DNA.json` → `source.canonicalRuntimeSource`). There is **no** `src/shared/*/charts/` counterpart, and nothing else in the codebase duplicates this exact file, so per this audit's convention it is treated as canonical-for-its-own-tree despite the path. Do not "fix" this by relocating it without a deliberate refactor ticket — see also the dead-code finding below, which may make relocation moot.
- **Export:** `export function StatCard({ title, value, sub, icon, accent, isCurrency = false }: {...})` (lines 4–18).

## Exact rendering technique

Plain JSX/Tailwind — no SVG, no canvas, no chart-math. The only "computed" visual is the icon-well tint:

```tsx
style={{ backgroundColor: `${accent}15`, color: accent }}   // line 29
```

`accent` is a caller-supplied hex string; appending the literal characters `"15"` produces an 8-digit hex color (2-digit alpha suffix `0x15` ≈ 8% opacity) — the same "`color + alphaSuffix`" convention documented for `fileTypeGlyph.rule` in `.ai-design-dna/02_DESIGN_DNA.json` (`background = color + '18'`), but this component uses a different suffix (`15` ≈ 8% vs the glyph convention's `18` ≈ 9%) — a small, likely-accidental divergence from that established convention rather than a deliberate second constant.

The numeric value itself is not manually formatted/animated — it is delegated entirely to the `@number-flow/react` library (`import NumberFlow from "@number-flow/react"`, line 2; `package.json:16` pins `"@number-flow/react": "^0.6.0"`):

```tsx
{isCurrency ? (
  <NumberFlow value={value} format={EUR_FORMAT} />   // line 39
) : (
  <NumberFlow value={value} />                         // line 41
)}
```

`EUR_FORMAT` (lines 19–23) is a local `Intl.NumberFormat` options object: `{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }` — i.e. whole-euro amounts, no cents. This is a second, independent EUR formatter from the one in `src/components/shared/Dashboard.tsx:10-15` (`formatEur`, `Intl.NumberFormat("de-DE", {...})`) — that sibling formatter locks the `de-DE` locale explicitly; this component's `NumberFlow format` prop does not specify a locale at all (relies on `NumberFlow`'s/browser default locale resolution). If both are ever active on the same screen, currency amounts could render with different digit-grouping/decimal conventions depending on the visitor's locale — worth reconciling if this component is ever revived.

## Colors, spacing, radius

All hardcoded Tailwind utility classes, not tokens from `.ai-design-dna/12_DESIGN_TOKENS/*.json`:

| Element | Class / value | Token comparison |
|---|---|---|
| Card shell | `bg-white border border-slate-100 rounded-2xl shadow-sm p-6` | `border-slate-100` = `#F1F5F9`, **not** `color.border.default` `#E5E7EB` (`colors.json:15`) — a different, lighter/bluer gray. `rounded-2xl` is **not** one of the project's overridden radius keys (`sm`/`DEFAULT`/`lg`/`xl`/`pill` in `tailwind.config.js:27-33`), so it falls through to Tailwind's *stock* `2xl` = `16px` — it coincidentally equals the project's own `radius.lg` (`16px`, `radius.json:5`) but arrives there via an unrelated utility key, not by deliberately using the token. `shadow-sm` **is** the project's tokenized `shadow.sm` (`0 1px 3px rgba(10,10,10,0.05), 0 1px 2px rgba(10,10,10,0.03)`, `shadows.json:6`), since `boxShadow.sm` is overridden in `tailwind.config.js`. `p-6` = `24px`, a real tokenized spacing step (`spacing.json` → `mostFrequentSteps` token `"6"`). |
| Icon well | `w-12 h-12 rounded-xl` (line 28) | `48px` box, `rounded-xl` = the project's **overridden** `xl` key = `20px` (`radius.json:6`, `tailwind.config.js:31`) — this one *is* a genuine token hit, in the `largeSurfaces` (14–20px) tier. |
| Eyebrow label | `text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-1.5` (line 34) | Near-miss of the tokenized `eyebrow` scale (`typography.json` → `scale.eyebrow`: `11px`, weight `450`, tracking `0.14em`, color `#9CA3AF`, `family: mono`) — here it's `10px` (not 11), `font-bold`=700 (not 450), `tracking-[0.15em]` (not 0.14em), and `text-slate-400` = `#94A3B8` (not the tokenized tertiary text `#9CA3AF`). Close enough to be clearly *intended* as an eyebrow label, but every number has drifted slightly from the documented token. |
| Value | `text-[32px] font-bold text-slate-800 leading-none mb-1 tracking-tight` (line 37) | Compares to the tokenized `statCardValue` scale (`typography.json`: `28px`, weight `600`, `tracking -0.03em`) — this is **larger** (32px vs 28px), **bolder** (700 vs 600), uses generic `tracking-tight` (Tailwind's `-0.025em`) instead of the exact `-0.03em`, and `text-slate-800` = `#1E293B` instead of the app's near-black ink (`#0A0A0A`/`#111827`). The ui-kit `StatCard` (`src/shared/components/ui/index.tsx:1519-1523`) hits the tokenized `28px`/`600`/`tracking-[-0.03em]` combination exactly — underscoring that these two same-named components aren't just API-incompatible, they don't even render the "same" value visually at the same size/weight. |
| Sub caption | `text-[12px] text-slate-400 mt-1` (line 44) | `12px` matches the tokenized `caption` size (`typography.json` → `caption.size: 12`), but weight/color again use stock `slate-400` rather than a tokenized tertiary color. |

This whole file sits inside the documented gap flagged in `.ai-design-dna/02_DESIGN_DNA.json` → `color.inconsistencyFlags[0]`: *"chart components use raw stock Tailwind palette classes... that fall outside this token set."*

## Spacing/layout

- Outer card: `flex items-start gap-4 p-6` — `gap-4` = `16px` (tokenized spacing step `"4"`), icon-to-text gap.
- Icon well is `shrink-0` so it never compresses when the label/value text wraps.
- No responsive variants — fixed padding/sizes regardless of viewport (consistent with the app's documented desktop-only posture, `.ai-design-dna/02_DESIGN_DNA.json` → `layout.responsiveBreakpoints`).

## Animation

- **No CSS `transition`/`duration`/`animate-*` classes anywhere in this file** (`grep -n "transition\|duration\|animate" StatCard.tsx` → no matches).
- The only motion is whatever `@number-flow/react`'s `<NumberFlow>` does internally when its `value` prop changes (digit-roll/count-up transition) — that library's own default timing, not something authored in this file, and not documented in `.ai-design-dna/12_DESIGN_TOKENS/motion.json` (which only covers `framer-motion` and raw CSS transitions). If a future AI needs to tune this animation's speed/easing, it must go into the `NumberFlow` component's own props/CSS custom properties, not this file's Tailwind classes.
- This contrasts with the sibling `VerticalBarChart` (`.ai-design-dna/13_COMPONENT_CATALOG/vertical-bar-chart.md`), which does have an explicit `duration-500` CSS transition on its bars — so "hand-rolled charts in this folder animate on a 500-700ms budget" is true for bar-fill growth, but this particular component's only animation is a third-party number-ticker, outside that budget entirely.

## Usage rules

- **This component is currently dead code.** A repo-wide search finds no import and no JSX usage anywhere:
  ```
  $ grep -rn "charts/StatCard" src/
  (no matches — only self-reference at its own definition, src/components/shared/charts/StatCard.tsx:4)
  ```
  The live Dashboard screen uses the **ui-kit** `StatCard` instead — `src/components/shared/Dashboard.tsx:5` imports `{ StatCard } from "@/shared/components/ui"` and renders it three times at lines 97, 105, 113 for "Total Economic Impact" / "Total Savings" / "Additional Profit". This chart-package `StatCard` has no live call site at all.
- If reviving this component: do not wire it in alongside the ui-kit `StatCard` under the same import alias — pick one name space consciously, or rename one of the two to remove the collision (e.g. `AnimatedStatCard`) before adding a second live call site, so future greps for "StatCard" don't silently match the wrong component.
- If a future stat tile genuinely needs count-up/NumberFlow animation, prefer extending the ui-kit `StatCard` (canonical, actively used in 4 screens per `.ai-design-dna/12_DESIGN_TOKENS/components.json` cross-reference) with an opt-in animated-value prop, rather than resurrecting this parallel implementation with its own drifted type scale and untokenized colors.

## Real call-site examples

**None.** Confirmed via:
```
$ grep -rn "StatCard" src --include="*.tsx"
src/components/shared/charts/StatCard.tsx:4:export function StatCard({     <- definition only
src/components/shared/Dashboard.tsx:5:import { StatCard } from "@/shared/components/ui";   <- the OTHER StatCard
src/components/shared/Dashboard.tsx:97,105,113:  <StatCard ... />          <- the OTHER StatCard
src/features/dashboard/container/DashboardScreen.tsx:14,183:  StatCard ... <- the OTHER StatCard
src/features/departments/container/DepartmentsScreen.tsx:26,596,611,626:   <- the OTHER StatCard
src/features/people/container/InvitesScreen.tsx:11,305,313,321:            <- the OTHER StatCard
src/features/people/container/ProfileScreen.tsx:13,115:                    <- the OTHER StatCard
```
Every real call site in the app resolves to `src/shared/components/ui/index.tsx:1486`'s `StatCard`, never to this file.

## Anti-patterns

- **Do not** introduce a chart library (Recharts, Chart.js, victory, etc.) — even though this specific component has no bars/axes, it lives in the `src/components/shared/charts/` folder whose sibling files establish a hand-rolled-SVG-only convention (`department-bar-chart.md`, `vertical-bar-chart.md`); a future numeric tile added to this folder should stay plain-JSX/Tailwind like this one, not reach for a dashboard-widget library.
- **Do not** assume "StatCard" uniquely identifies one component in this codebase — always check the import path before editing; `@/shared/components/ui` vs `@/components/shared/charts/StatCard` are unrelated implementations with incompatible prop shapes.
- **Do not** silently delete this file as "obviously dead code" without flagging it — it is unused today, but removing files outside this audit's explicit scope (`.ai-design-dna/`) was not requested; documenting the dead-code status here is the correct action, not deleting source.
- **Do not** copy this component's untokenized `slate-*` colors or its 32px/700-weight value styling into a new component — match the tokenized `28px`/`600`/`-0.03em` `statCardValue` scale (`typography.json`) that the *live* ui-kit `StatCard` already implements correctly.
