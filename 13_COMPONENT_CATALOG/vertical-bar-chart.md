# VerticalBarChart

## Purpose

A grouped vertical bar chart card: one column-group per label (e.g. per department), with 1–2 bars per group (e.g. accepted vs. rejected, or a single savings/profit series), a Y-axis of three computed tick labels, horizontal grid lines, a hover tooltip-style value readout above each bar, and an optional click-through into a detail modal for admins. This is the **only one of the three components in this catalog batch that is actually live** in the running app — it is the real "by department" chart on the main dashboard.

## File path & path-inconsistency flag

- **File:** `src/components/shared/charts/VerticalBarChart.tsx` (136 lines).
- **Path-inconsistency flag:** lives under `src/components/shared/charts/` — a legacy-shaped path (`src/components/...`) alongside the canonical modern tree rooted at `src/shared/components/ui/index.tsx` (`.ai-design-dna/02_DESIGN_DNA.json` → `source.canonicalRuntimeSource`). There is **no** `src/shared/*/charts/` counterpart, and — unlike its two dead siblings documented alongside this file — this component is genuinely the sole, actively-used implementation of this chart shape, so it is unambiguously canonical-by-usage despite the inconsistent path. Do not relocate without a deliberate refactor ticket; do not treat its path as evidence it's legacy/deprecated — it isn't.
- **Export:** `export function VerticalBarChart({ title, data, colors, role }: { title: string; data: { label: string; values: number[] }[]; colors: string[]; role?: string })` (lines 5–15).
- **Composes** `IdeasByDepartmentModal` (`./IdeasByDepartmentModal`, line 3) — conditionally rendered when `role === "admin"`, for a click-through drill-down on the chart title.

## Exact rendering technique

Hybrid HTML/CSS layout (no SVG at all, unlike its two catalog siblings) — bars are plain `<div>`s with a computed inline `height: {pct}%` and a flex-based axis:

- **Domain:** `maxVal = Math.max(...data.flatMap(d => d.values), 2)` (line 18) — the trailing `, 2` is the divide-by-zero/degenerate-scale guard (ensures the axis never collapses to `0`/`0` when all values are `0` or `1`).
- **Y-axis ticks:** `steps = [maxVal, Math.ceil(maxVal / 2), 0]` (line 19) — always exactly **3** computed labels (max / half-max-rounded-up / zero), rendered top-to-bottom via `flex-col justify-between` (lines 78–82). This is not a "nice round number" axis algorithm (no `d3.ticks`-style rounding to 10/20/50) — it's a literal max/half/zero split, so an odd `maxVal` like `37` produces ticks `37, 19, 0`.
- **Bar height (the core "no library" math):**
  ```tsx
  const pct = (v / maxVal) * 100;                                    // line 100
  <div style={{ height: `${pct}%`, backgroundColor: colors[j] }} />  // lines 102-106
  ```
  Each bar's height is a straight percentage of the tallest value across the *entire dataset* (not per-group), applied as an inline `height` percentage inside a `h-full` flex parent — CSS does the actual pixel math at layout time, this component only computes the percentage.
- **Grouping:** `data.map((d, i) => ...)` outer loop renders one flex column per label; `d.values.map((v, j) => ...)` inner loop renders one bar per series value within that group, laid out via `flex items-end gap-1` (lines 93–118) so multiple bars in a group sit side-by-side, bottom-aligned, with a `1` (4px) gap between them.
- **Bar width:** `w-full max-w-[32px]` (line 104) — each bar fills its flex-share of the group but is capped at a **32px** hard maximum, so groups with very few labels don't produce oversized fat bars.
- **Grid lines:** a separate absolutely-positioned overlay (lines 87–91) — 3 flex-spaced horizontal rules (`border-t border-slate-100` ×2, `border-t border-transparent` for the baseline slot) drawn independently of the bars/axis-labels, purely decorative background structure aligned to the same 3-step spacing as the Y-axis.
- **Hover value readout:** each bar has a child `<div>` (lines 107–114) that is `opacity-0 group-hover:opacity-100`, positioned via `-mt-5` (negative margin lifts it above the bar top) and rendered `only if v > 0` — a hand-rolled "tooltip" with no positioning library, just a fixed offset that assumes the bar container has enough headroom.
- **Click-through:** the title span is conditionally `underline cursor-pointer` and wired to `onClick={() => setShowModal(true)}` **only when `role === "admin"`** (lines 42–48); non-admin callers get a static, non-interactive title. The `IdeasByDepartmentModal` itself only mounts (lines 128–133) when `role === "admin"` — for non-admin usage the modal component isn't even in the tree, not just hidden.
- **Legend:** a static two-swatch legend (lines 52–73) hardcoded to the labels "Accepted"/"Rejected" (`dashboard.legendAccepted`/`dashboard.metricRejected` i18n keys) — the second swatch/label only renders `if (colors.length > 1)` (line 62), so single-series usages (see Real call-site examples) correctly suppress the "Rejected" legend entry, but the **label text itself is not parameterized** — if this component is ever reused for a non-accepted/rejected two-series comparison, the legend text would need a prop, not just a color-array-length check.
- **Icon:** the small bar-chart glyph next to the title (lines 26–41) is a one-off inline `<svg>` with `viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"` — matches the app's general hand-drawn-stroke-icon convention (`.ai-design-dna/02_DESIGN_DNA.json` → `icons.style`: `viewBox 0 0 24 24, stroke currentColor, strokeWidth 1.5`) except this glyph uses `strokeWidth="2"` instead of the documented canonical `1.5` — a small deviation from the icon-system convention, and it's a bespoke one-off SVG rather than reusing a definition from the canonical `src/shared/components/ui/Icons.tsx`.

## Colors, spacing, radius

| Element | Value | Token comparison |
|---|---|---|
| Card shell | `bg-white border border-slate-100 rounded-2xl shadow-sm p-6 h-full flex flex-col` (line 23) | `border-slate-100` = `#F1F5F9`, not the tokenized `color.border.default` `#E5E7EB` (`colors.json:15`) — same stock-`slate`-vs-token-`gray` drift documented in `.ai-design-dna/02_DESIGN_DNA.json` → `color.inconsistencyFlags[0]`. `rounded-2xl` is **not** one of the project's overridden radius keys (`sm`/`DEFAULT`/`lg`/`xl`/`pill`), so it resolves to Tailwind's stock `2xl` = `16px` — numerically equal to the project's own `radius.lg` (`16px`) but via an unrelated utility key. `shadow-sm` **is** the tokenized `shadow.sm` value (`shadows.json:6`). `p-6` = `24px`, a real tokenized spacing step. |
| Title | `text-[14px] font-bold text-slate-800` (line 43) | `14px`/bold doesn't match any documented type-scale step exactly (closest is `sectionCardTitle` at `13.5px`/weight `600`); `text-slate-800` = `#1E293B`, not the app's near-black ink. |
| Legend labels | `text-[11px] font-medium text-slate-500` (lines 58, 68) | `11px` is close to `caption`/`eyebrow`-sized steps but doesn't match any exactly; `text-slate-500` = `#64748B`, not the tokenized `color.text.secondary` `#6B7280` (`colors.json:9`) — visually near-identical but a different literal value. |
| Legend swatches | `w-3 h-3 rounded-sm` with `backgroundColor: colors[0]`/`colors[1]` (lines 54-57, 64-67) | `12px` square, caller-supplied colors — see per-call-site colors below, none of which are in the token set. |
| Y-axis labels | `text-[11px] font-medium text-slate-400` (line 78) | `text-slate-400` = `#94A3B8`, not the tokenized `color.text.tertiary` `#9CA3AF` (`colors.json:12`) — again a near-miss, different stock palette family. |
| Grid lines | `border-t border-slate-100` (lines 88-89) | `#F1F5F9`, not tokenized. |
| X-axis baseline | `border-b border-slate-200` (line 85) | `#E2E8F0`, not the tokenized border default `#E5E7EB`. |
| Bar fill | `backgroundColor: colors[j]` — fully caller-supplied, no default | See per-call-site table below — every color passed in from `Dashboard.tsx` is an untokenized ad hoc hex. |
| Hover value text | `text-[11px] font-bold`, `color: colors[j]` (lines 108-111) | Reuses the bar's own color for its floating value label — internally consistent even though the color itself is untokenized. |
| Bar radius | `rounded-t-md` (line 104) | Tailwind stock `md` = `6px`, top corners only (flat bottom, sitting on the baseline) — not one of the project's overridden radius keys, and `6px` isn't in the documented `radius.json` scale at all (closest documented step is `checkbox: 5px` or the `controls: 6-8px` tier band, which this technically falls within even though it isn't a named token). |

## Animation

- **This is the one component in the batch with real, explicit CSS animation:**
  ```tsx
  className="w-full max-w-[32px] rounded-t-md transition-all duration-500 hover:opacity-80"   // line 104
  ```
  `transition-all duration-500` = a **500ms** transition on *all* animatable CSS properties of the bar `<div>` — in practice this means the `height` (and `background-color`, if `colors` ever changes) animates smoothly whenever the underlying data changes (e.g. on a data refetch/re-render with new `values`), not just on mount. `hover:opacity-80` additionally fades the bar to 80% opacity on pointer hover (also animated by the same `transition-all duration-500`, since `opacity` is included in "all").
  - This **matches** the prior research finding of "500-700ms chart animations" in this app — `duration-500` sits at the low end of that documented band, and is also within the app-wide documented `motion.durationRange` (`min 0.12, max 0.6` seconds, `.ai-design-dna/12_DESIGN_TOKENS/motion.json`) — though note this is a raw Tailwind CSS transition class, not one of the `framer-motion` named constants/springs cataloged in that file (`EASE_OUT`, `EASE_FAST`, the spring configs) — this chart's animation system is entirely independent of the app's `framer-motion` motion layer.
  - There is a second, unrelated transition on the hover value label: `transition-opacity` (line 109, no explicit `duration-*` class) — this falls back to Tailwind's **default transition duration, 150ms** (Tailwind's default `transition` timing when no `duration-*` utility is specified), noticeably faster than the bar's own 500ms grow/shrink. The tooltip-style value fades in over 150ms while the bar height animates over 500ms — two different speeds for what visually reads as one interaction.
- No `framer-motion` usage anywhere in this file (`grep` for `motion\.` finds nothing) — purely Tailwind's `transition-*`/`duration-*` utility classes, consistent with the app's documented `reducedMotion` note that plain CSS transitions (unlike Framer variants) *are* auto-disabled by the global `prefers-reduced-motion` media query in `src/index.css` (`.ai-design-dna/12_DESIGN_TOKENS/motion.json` → `reducedMotion`) — so this chart's bar-grow animation correctly respects reduced-motion preferences "for free," without any extra code.

## Usage rules

- **Live and in active use** on the main analytics dashboard. Rendered three times from `src/components/shared/Dashboard.tsx`, which is itself rendered by the dashboard route container `src/features/dashboard/container/DashboardScreen.tsx:331` and `:342`.
- `data` must be pre-merged/pre-shaped by the caller into `{ label: string; values: number[] }[]` **before** passing it in — unlike `DepartmentBarChart`, this component does no accessor-based extraction and does no sorting (bars render in the exact order of the `data` array, not sorted by value) — see `Dashboard.tsx:67-79` for the merge logic that unions two separate department-keyed arrays (accepted + rejected) into one label-aligned array before passing to this chart.
- `colors` array length determines both the number of bars per group **and** whether the "Rejected" legend entry shows (`colors.length > 1`) — always pass exactly as many colors as `values` entries per data row, in the same order, or bars will render with `undefined` `backgroundColor` for any `values[j]` beyond `colors.length`.
- Only pass `role="admin"` when the surrounding screen is genuinely admin-gated and the caller wants the title to be clickable and open `IdeasByDepartmentModal` — passing it in a non-admin context would expose a drill-down modal that may leak data the viewer shouldn't see (the component itself does no permission check beyond the string comparison; the caller owns access control).

## Real call-site examples

Three live call sites, all in `src/components/shared/Dashboard.tsx`:

```
src/components/shared/Dashboard.tsx:125  <VerticalBarChart
src/components/shared/Dashboard.tsx:126     title={t("dashboard.chartIdeasByDepartment", "Ideas by department")}
src/components/shared/Dashboard.tsx:127     data={mergedDeptData}
src/components/shared/Dashboard.tsx:128     colors={["#22C55E", "#EF4444"]}   // Green for accepted, Red for rejected
src/components/shared/Dashboard.tsx:129     role="admin"
src/components/shared/Dashboard.tsx:130  />

src/components/shared/Dashboard.tsx:146  <VerticalBarChart
src/components/shared/Dashboard.tsx:147     title={t("dashboard.chartSavingsByDepartment", "Savings by department")}
src/components/shared/Dashboard.tsx:148     data={mergedSavingsData}
src/components/shared/Dashboard.tsx:149     colors={["#10B981"]}
src/components/shared/Dashboard.tsx:150  />   // no role prop -> title not clickable, legend shows only "Accepted" swatch

src/components/shared/Dashboard.tsx:151  <VerticalBarChart
src/components/shared/Dashboard.tsx:152     title={t("dashboard.chartAdditionalProfitByDepartment", "Additional profit by department")}
src/components/shared/Dashboard.tsx:153     data={mergedProfitData}
src/components/shared/Dashboard.tsx:154     colors={["#3B82F6"]}
src/components/shared/Dashboard.tsx:155  />   // no role prop
```

`Dashboard` itself is rendered from the dashboard feature container:
```
src/features/dashboard/container/DashboardScreen.tsx:331:      <Dashboard analyticsData={analyticsData} />
src/features/dashboard/container/DashboardScreen.tsx:342:  return <Dashboard analyticsData={analyticsData} />;
```

**Color audit of the three call sites** — none of `#22C55E` (green), `#EF4444` (red), `#10B981` (green), `#3B82F6` (blue) appear in `.ai-design-dna/12_DESIGN_TOKENS/*.json` or `02_DESIGN_DNA.json`. This is explicitly called out as a known gap: `02_DESIGN_DNA.json` → `color.inconsistencyFlags[1]`: *"Ad hoc success/warning/error greens and reds (#10B981, #16A34A, #22C55E, #F59E0B) appear outside Badge/StagePill in a few dashboard/kanban files instead of the canonical semantic triads above."* Notably, two different ad hoc greens are used across these three calls (`#22C55E` and `#10B981`) for what is conceptually the same "positive" concept (accepted ideas vs. savings) — not even internally consistent with itself, let alone with the tokenized `semantic.success.text` `#15803D` (`02_DESIGN_DNA.json` → `color.semantic.success`).

## Anti-patterns

- **Do not** introduce a chart library (Recharts, Chart.js, visx, d3, react-chartjs-2, etc.) to reimplement or extend this component — bar heights are computed by hand (`(v / maxVal) * 100`, line 100) and rendered as plain `<div style={{ height: '${pct}%' }}>`; this is the established, working, currently-shipping pattern for grouped vertical bars in this codebase and should be matched, not replaced.
- **Do not** pick a new ad hoc hex for a fourth call site "because the other three are already ad hoc anyway" — this compounds the documented `color.inconsistencyFlags[1]` gap. If adding a new department-comparison chart, either reuse one of the three existing hexes for the matching semantic (accepted=green, rejected=red, savings=green, profit=blue) or raise tokenizing the chart palette as its own change — don't add a fifth untokenized green/blue.
- **Do not** change the bar animation duration without checking both this file's `duration-500` (line 104) and the app-wide `motion.durationRange` (`0.12s–0.6s`, `.ai-design-dna/12_DESIGN_TOKENS/motion.json`) — 500ms is already at the upper-middle of that range; going higher would be the slowest transition in the documented system.
- **Do not** assume the 3-tick Y-axis (`[maxVal, ceil(maxVal/2), 0]`, line 19) is a general-purpose "nice axis" algorithm suitable for copying into a taller/denser chart — it only produces exactly 3 ticks and does not round to human-friendly numbers; a chart needing more ticks or rounder numbers needs new math, not a tweak to this constant.
- **Do not** hardcode "Accepted"/"Rejected" as generic legend text if reusing this component for an unrelated two-series comparison — the legend strings are not parameterized (only the swatch *presence*, via `colors.length > 1`, is data-driven); passing e.g. savings/profit colors through the existing legend would mislabel them as "Accepted"/"Rejected" (this is why the second and third call sites correctly pass only a single-element `colors` array to suppress the legend's second entry rather than mislabeling it).
