# DepartmentBarChart

## Purpose

A generic, reusable horizontal ranked-bar-list chart: one row per data item, sorted descending by value, with a label column on the left, a track/fill bar pair in the middle, and a formatted value on the right. It is a hand-rolled SVG chart — no chart library — and is generic over the item type `T` via `getValue`/`getLabel`/`formatValue` accessor props, so any array of typed records can be plugged in without the component knowing the underlying shape.

## File path & path-inconsistency flag

- **File:** `src/components/shared/charts/DepartmentBarChart.tsx` (108 lines).
- **Path-inconsistency flag:** lives under `src/components/shared/charts/` — a legacy-shaped path (`src/components/...`) that sits alongside the canonical modern component tree rooted at `src/shared/components/ui/index.tsx` (`.ai-design-dna/02_DESIGN_DNA.json` → `source.canonicalRuntimeSource`). There is **no** `src/shared/*/charts/` counterpart and nothing duplicates this exact file (it is a near-duplicate *pattern*, not a literal duplicate, of its sibling `IdeasPerDepartmentChart.tsx` — see below), so per this audit's convention it is treated as canonical despite the path. Do not relocate it without a deliberate refactor ticket.
- **Export:** `export function DepartmentBarChart<T>({ title, items, getValue, getLabel, formatValue, color = "#006AB3" }: {...})` (lines 12–26) — a TypeScript generic component, the only one of the three files covered in this catalog batch that is generic rather than shape-specific.

**Near-duplicate note:** this component is structurally a genericized copy of its sibling `src/components/shared/charts/IdeasPerDepartmentChart.tsx` (documented separately at `.ai-design-dna/13_COMPONENT_CATALOG/ideas-per-department-chart.md`) — same layout constants family (`W=320`, `ROW_H=28`, `PAD_TOP=4`, `PAD_BOTTOM=4`, `PAD_LEFT=112`, `BAR_H=16`; only `PAD_RIGHT` differs: `65` here vs `44` there), same sort-descending-then-scale-to-`BAR_AREA` math, same `3px` minimum-visible-sliver rule, same default fill color `#006AB3`. The only functional difference is that `DepartmentBarChart` takes accessor props (`getValue`/`getLabel`/`formatValue`) to work with any item shape and an overridable `color` prop, while `IdeasPerDepartmentChart` is hardcoded to the `IdeasPerDepartment` type. **Both are currently dead code** (see Real call-site examples) — this looks like an abandoned "let's genericize this chart" refactor that was never wired back into the app in place of the original.

## Exact rendering technique

Read verbatim from source — pure SVG geometry, no library math:

- **Layout constants** (lines 3–10): `W = 320` (viewBox width), `ROW_H = 28`, `PAD_TOP = 4`, `PAD_BOTTOM = 4`, `PAD_LEFT = 112` (reserved for the label column), `PAD_RIGHT = 65` (reserved for the value column), `BAR_AREA = W - PAD_LEFT - PAD_RIGHT = 143`, `BAR_H = 16`.
- **Sort:** `[...items].sort((a, b) => getValue(b) - getValue(a))` (line 28) — descending, non-mutating copy via caller-supplied accessor, not a hardcoded field name.
- **Scale guard:** `maxCount = Math.max(...sorted.map(getValue), 1)` (line 29) — the trailing `, 1` prevents a divide-by-zero when every value is `0`.
- **SVG height:** dynamic — `H = PAD_TOP + sorted.length * ROW_H + PAD_BOTTOM` (line 30) — grows linearly with row count; there is no fixed viewport or internal scroll, so a very long `items` array produces a very tall SVG.
- **Bar width (the core "no library" math):**
  ```tsx
  const barW = val > 0
    ? Math.max(Math.round((val / maxCount) * BAR_AREA), 3)   // lines 51-54
    : 0;
  ```
  Linear scale of `val` into the `BAR_AREA` pixel budget, rounded to a whole pixel, floored at a **3px minimum visible sliver** for any nonzero value (so a tiny real value is never rendered invisible) — but an exact `0` value renders **no** fill `<rect>` at all (the `barW > 0 &&` guard at line 80).
- **Row vertical placement:** `y = PAD_TOP + i * ROW_H` (line 55), bar vertically centered in its row via `barY = y + (ROW_H - BAR_H) / 2` (line 56) → `(28-16)/2 = 6px` inset top/bottom per row.
- **Dim state:** `const dim = val === 0` (line 57) — a boolean used purely to swap text color/weight for zero-value rows (no bar-track dimming).
- **Label column:** `<text x={PAD_LEFT - 8} y={y + ROW_H/2 + 4} textAnchor="end" fontSize={10} fill={dim ? "#9CA3AF" : "#374151"}>` (lines 61–67) — manually truncates: `label.length > 15 ? label.slice(0, 14) + "…" : label` (lines 68–70), because SVG `<text>` has no CSS `text-overflow: ellipsis` equivalent.
- **Track (background) bar:** always rendered at full `BAR_AREA` width regardless of value, `fill="#F3F4F6"`, `rx={3}` (lines 72–79).
- **Fill bar:** only rendered `if (barW > 0)`, `width={barW}`, same `x`/`y`/`rx={3}` as the track, `fill={color}` (the caller-supplied or default `"#006AB3"`), `fillOpacity={0.85}` (lines 80–90).
- **Value column:** `<text x={PAD_LEFT + BAR_AREA + 8} ...>{formatValue(val)}</text>` (lines 91–100), `fontSize={10}`, `fill` same dim/non-dim swap, `fontWeight={dim ? 400 : 600}` — the caller controls the actual string formatting (currency, plain number, percentage, etc.) via the `formatValue` prop, the component itself has no formatting logic.
- **Empty state:** `sorted.length === 0` renders localized `"No data"` (`t("common.noData", "No data")`) in `text-[12.5px] text-text-3 text-center py-6` — no SVG rendered at all in this case (lines 37–40).
- **Responsiveness:** `<svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">` (lines 42–47) — width stretches to fill its container via the `100%`/`viewBox` combo; height is fixed pixels driven by row count, not responsive to container height.
- **`useTranslation`** is imported and used only for the empty-state string (line 1, 27, 39) — no other localization inside the SVG itself (labels/values are caller-supplied already-formatted strings).

## Colors, spacing, radius

| Element | Value | Token comparison |
|---|---|---|
| Card shell | `bg-white border border-slate-200 rounded-xl shadow-sm px-[22px] py-[18px] h-full` (line 33) | `border-slate-200` = `#E2E8F0` — visually close to but **not** the tokenized `color.border.default` `#E5E7EB` (`colors.json:15`); a different stock Tailwind gray family (`slate` vs the app's `gray`-based token), matching the documented gap in `.ai-design-dna/02_DESIGN_DNA.json` → `color.inconsistencyFlags[0]`. `rounded-xl` **is** the project's overridden `xl` radius key = `20px` (`tailwind.config.js:31`, `radius.json:6`) — a genuine token hit, in the `largeSurfaces` (14–20px) tier. `shadow-sm` **is** the tokenized `shadow.sm` value (`shadows.json:6`). `px-[22px] py-[18px]` matches the documented `cardBodyPaddingLoose`-adjacent inline convention (`spacing.json` → `componentSpecific.cardBodyPaddingLoose: "18px 20px"` is close but not identical — this uses `22px`/`18px`, a one-off variant rather than the exact documented pair). |
| Title | `text-[13px] font-semibold text-slate-800 mb-4 tracking-tight` (line 34) | `13px`/`semibold` is close to the tokenized `sectionCardTitle` (`13.5px`, weight `600`, `typography.json`) but not exact (`13px` not `13.5px`, generic `tracking-tight` not the documented `-0.008em`). `text-slate-800` = `#1E293B`, not the app's near-black ink tokens. |
| Track bar | `fill="#F3F4F6"` | **Matches** `color.hoverSurface` exactly (`.ai-design-dna/02_DESIGN_DNA.json:24`, `colors.json:20`) — one of the few values in this file that lines up with the token set. |
| Fill bar | `fill={color}` defaulting to `"#006AB3"`, `fillOpacity={0.85}` | `#006AB3` is **not present anywhere** in `.ai-design-dna/12_DESIGN_TOKENS/*.json` or `02_DESIGN_DNA.json` — an ad hoc chart-only blue, distinct from the tokenized `semantic.info.text` `#1D4ED8` / stage-pill evaluation blue `#2563EB` (`02_DESIGN_DNA.json` → `color.semantic.info`, `color.stagePillColors.evaluation`). Identical to the ad hoc blue used by the sibling `IdeasPerDepartmentChart` (see near-duplicate note above) — confirming it's a copy-pasted convention, not two independent ad hoc choices. |
| Row/value text | `fill="#9CA3AF"` (dim) / `"#374151"` (normal) | `#9CA3AF` **matches** `color.text.tertiary` exactly (`colors.json:12`). `#374151` **matches** `color.text.body700` exactly (`colors.json:14`). Both are genuine token hits — this component tokenizes its *text* colors correctly even while its *chrome* (border, fill bar) does not. |
| Rect corner radius | `rx={3}` on both track and fill rects | `3px` is **below every documented radius step** in `.ai-design-dna/12_DESIGN_TOKENS/radius.json` (smallest is `componentSpecific.checkbox: "5px"`) — an SVG-attribute radius with no token equivalent at all, a genuine gap rather than a mismatch against an existing token. |
| Font sizes | `fontSize={10}` for both label and value text | Below the smallest tokenized type-scale step (`typography.json` → smallest is `badgeTextMono: 10.5px`) — again slightly under every documented step rather than matching one. |

## Animation

- **None.** `grep -n "transition\|duration\|animate" DepartmentBarChart.tsx` returns no matches — this is a fully static SVG render; bars appear at final width immediately on mount/update, with no grow-in transition.
- This is a notable **inconsistency with its sibling `VerticalBarChart`** (`.ai-design-dna/13_COMPONENT_CATALOG/vertical-bar-chart.md`), which explicitly animates bar-height changes over `duration-500` (500ms). Two chart components in the same folder, both bar charts, disagree on whether bars should animate — if this component is ever revived/wired in, consider whether it should adopt the same `transition-all duration-500`-equivalent behavior for consistency (note: SVG `<rect width>` changes are not CSS-transitionable via Tailwind classes the way a `<div>`'s `height` is; achieving parity here would require either switching to CSS custom properties / `<animate>` SVG elements, or restructuring the bar as an HTML `<div>` like `VerticalBarChart` does).

## Usage rules

- **This component is currently dead code.** No import, no JSX usage anywhere in `src/`:
  ```
  $ grep -rn "DepartmentBarChart" src --include="*.tsx"
  src/components/shared/charts/DepartmentBarChart.tsx:12:export function DepartmentBarChart<T>({
  ```
  Only its own definition — zero call sites. The live Dashboard screen's equivalent "by department" comparisons are rendered by `VerticalBarChart` instead (a **grouped vertical** bar chart, a different visual form) — see `src/components/shared/Dashboard.tsx:125-155`.
- If reviving this component: because it's generic over `T`, prefer it over `IdeasPerDepartmentChart` for any *new* horizontal ranked-bar use case (it avoids that sibling's hardcoded type), but first decide whether the fill color should stay the ad hoc `#006AB3` (matching the existing dead sibling's established, if untokenized, convention) or move to a tokenized blue if this is meant to ship as a first tokenized hand-rolled chart.
- Because SVG height grows with `items.length * 28px` with no cap, only place this in a layout slot that tolerates variable height, or wrap it in a fixed-height scrollable container if the item count is unbounded.
- The generic accessor props (`getValue`, `getLabel`, `formatValue`) mean the component does no data validation — passing an item array where `getValue` can return `NaN`/`Infinity` will break the `Math.max`/`Math.round` scale math silently (no guard beyond the `, 1` divide-by-zero fallback).

## Real call-site examples

**None.** Confirmed via:
```
$ grep -rn "DepartmentBarChart" src/
src/components/shared/charts/DepartmentBarChart.tsx:12:export function DepartmentBarChart<T>({
```
No file imports it. The conceptually equivalent live UI is `VerticalBarChart` inside `src/components/shared/Dashboard.tsx`, rendered from `src/features/dashboard/container/DashboardScreen.tsx:331,342` — see `.ai-design-dna/13_COMPONENT_CATALOG/vertical-bar-chart.md` for that component's real call sites.

## Anti-patterns

- **Do not** introduce a chart library (Recharts, Chart.js, visx, d3-shape, etc.) to reimplement or replace this component — the entire `src/components/shared/charts/*` folder convention is hand-rolled `<svg>`/`<rect>`/`<text>` with manually computed geometry (`PAD_LEFT`/`PAD_RIGHT`/`BAR_AREA` scaling); this file (and its sibling `IdeasPerDepartmentChart`) is the reference pattern for horizontal-bar layout math.
- **Do not** create a third near-duplicate of this "ranked horizontal bar list" pattern — this file and `IdeasPerDepartmentChart.tsx` are already a duplicated pair (one generic, one type-hardcoded, both dead). Consolidate into one before adding a third variant.
- **Do not** invent a new ad hoc bar color when reviving this pattern — reuse `#006AB3` (the established, if untokenized, convention shared with `IdeasPerDepartmentChart`) unless deliberately tokenizing the chart palette for the first time as its own tracked change.
- **Do not** silently wire this component into the dashboard as a "fix" for `VerticalBarChart`'s dead-simple horizontal layout without checking with the team first — both this component and `VerticalBarChart` currently occupy overlapping conceptual territory ("show me values by department"); adding this one live without removing/consolidating the other creates two live renderings of similar data with different visuals.
