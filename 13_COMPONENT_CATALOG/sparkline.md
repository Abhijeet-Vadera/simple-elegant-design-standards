# Sparkline

## Purpose
A minimal inline trend indicator: a single unlabeled line (+ optional area fill + terminal dot) rendered at text-adjacent scale. It answers "is this going up or down" at a glance, with no axes, ticks, gridlines, tooltips, or legend. It is a data-viz *primitive*, not a chart — it belongs next to a number (e.g. inside a stat tile), not as a standalone visualization.

## File / exports / prop signature
- **File:** `src/shared/components/ui/index.tsx:592-638`
- **Duplicated verbatim (whitespace-only diff) in the legacy barrel:** `src/components/ui/index.tsx:246-260` (per `.ai-design-dna/12_DESIGN_TOKENS/components.json`, that legacy file is a superseded subset — do not add new call sites there)
- **Export:** `export function Sparkline({ data, w, h, fill }: Props)`

```ts
{
  data: number[];   // required, no default — series values, index = x position
  w?: number;        // default 120 (px)
  h?: number;         // default 34 (px)
  fill?: boolean;     // default true — render the area fill under the line
}
```

Not forwarded/available: `stroke` color, `className`/`style` passthrough, `onClick`/interactivity, `aria-*` labeling. The component is visual-only.

## Exact math / rendering approach
Read verbatim from `src/shared/components/ui/index.tsx:604-637`:

1. **Guard:** `if (data.length < 2) return null;` — needs at least 2 points to draw a line; renders nothing (not a placeholder/empty state) below that.
2. **Domain:** `min = Math.min(...data)`, `max = Math.max(...data)`, `rng = max - min || 1` (the `|| 1` guards a flat series — all-equal values — from producing a divide-by-zero; a flat series renders as a straight line at mid-height rather than `NaN`).
3. **Point mapping** — manual linear scale, no d3/chart-lib scale functions:
   - `x_i = (i / (data.length - 1)) * w` — evenly spaces `data.length` points across the full width `w`, first point at `x=0`, last at `x=w`.
   - `y_i = h - ((v - min) / rng) * (h - 6) - 3` — normalizes value to `[0,1]`, maps into a `(h - 6)` px vertical range, then insets by a **3px top/bottom margin** (so the line/dot never touches the SVG edge) and flips (SVG y grows downward, so higher value → smaller y).
4. **Path string** — built manually, not via a path-generator library: `"M x0 y0" then "L xi yi"` for each subsequent point, coordinates rounded with `.toFixed(1)`.
5. **Area path** (only when `fill` is true): the line path string with `L w h L 0 h Z` appended — closes the shape down to the bottom-right corner, across to bottom-left, and back to start, i.e. the classic "area under curve" close.
6. **Render order:** `<svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>` containing:
   - area `<path>` (conditional on `fill`), `fill="rgba(10,10,10,0.05)"`, no stroke.
   - line `<path>`, `fill="none"`, `stroke="#0A0A0A"`, `strokeWidth="1.5"`, `strokeLinecap="round"`, `strokeLinejoin="round"`.
   - terminal `<circle>` at the **last** point only, `r="2.4"`, `fill="#0A0A0A"` — marks "now"/most-recent value, no dot on any other point.

All colors are literal hex/rgba, not sourced from a token variable at call time — but they match the canonical ink token exactly: `#0A0A0A` = `color.ink` in `.ai-design-dna/02_DESIGN_DNA.json:10`, and `rgba(10,10,10,0.05)` is the ink color at 5% alpha (one step lighter than `color.focusRing`'s 6% alpha in the same file, line 29). No token file defines a dedicated "sparkline" or "chart" color — this component uses the ink primitive directly, consistent with the rest of the monochrome UI.

## Default dimensions
- `w = 120px`, `h = 34px` — sized for a stat-card/table-cell footprint, not a section-level chart.
- Effective plotted vertical range is `h - 6 = 28px` (3px inset top and bottom).
- SVG has `overflow: visible` — the terminal circle (`r=2.4`, so up to 2.4px beyond the last point's x/y) and any anti-aliased stroke edges are permitted to bleed past the nominal `w × h` box; layout code embedding a Sparkline should not clip it tightly.

## States / transitions
None. Sparkline is **fully static** per render — no hover, no animation, no transition on the path or fill (contrast with Meter's `transition: width 0.6s`, below). Re-rendering with new `data` snaps the path to the new shape instantly; there is no interpolation/morph between old and new paths. If animated appearance is desired, it must be added by the caller (e.g. wrapping in a `framer-motion` fade, per `src/shared/lib/animations.ts` conventions) — nothing in the primitive itself supports it.

## Usage rules — Sparkline vs. the larger chart components
Use **Sparkline** when:
- The context is a single inline trend cue inside another component (stat card, table cell, list row) — decoration/glance-value, not the primary content of the view.
- No axis labels, no legend, no tooltip, no category breakdown, no user interaction are needed.
- The series is a simple 1-D numeric array already in hand (no data transform/aggregation needed at render time).

Use the larger chart components in `src/components/shared/charts/*` (`VerticalBarChart.tsx`, `DepartmentBarChart.tsx`, `IdeasPerDepartmentChart.tsx`, `CategoryDistributionDonutCard.tsx`, `TotalEconomicImpactCard.tsx`, `IdeaImpactRankingList.tsx`, `ContributionsCard.tsx`, `IdeasByDepartmentModal.tsx`) when:
- The chart is the primary content of a card/section (dashboard analytics), not an accessory to other content.
- You need category labels, hover states, click-through to a modal (see `IdeasByDepartmentModal.tsx`), multi-series comparison, or a legend — these components carry their own `useState` for hover/modal interactivity (e.g. `VerticalBarChart.tsx` and `IdeasByDepartmentModal.tsx` both use `useState`), which Sparkline deliberately has none of.
- The visualization needs 48-164 lines worth of layout (per current file sizes) — i.e. it's a real chart, not a glance indicator.

## Real call-site examples
**None found.** `Sparkline` is exported from both `src/shared/components/ui/index.tsx:593` and the legacy `src/components/ui/index.tsx:247`, but a repo-wide search for `<Sparkline` and any import of `Sparkline` outside those two definition files returns **zero matches**. It is currently dead/unused code — defined as an available primitive but not wired into any screen. Any future AI adding trend indicators to stat cards (e.g. `StatCard` at `src/shared/components/ui/index.tsx:1486` or `src/components/shared/charts/StatCard.tsx`) should treat this as the correct primitive to reach for, rather than hand-rolling a new inline-trend SVG.

## Anti-patterns
- **Do not** add a new bespoke inline-trend SVG inside a card/table component when `Sparkline` already exists and is unused — that would create a second, divergent implementation of the same idea. Import and use this one.
- **Do not** feed it a single-element or empty array expecting a fallback dot/placeholder — it silently renders `null` per the `data.length < 2` guard; render your own empty-state around it if zero-state UI is needed.
- **Do not** treat the `|| 1` flat-series guard as "auto-scaling" — a flat series still draws a perfectly flat mid-height line; it is not detecting "no data," it is preventing a NaN division.
- **Do not** pass a non-monotonic or unsorted-by-index series expecting time-axis semantics — there is no x-axis scale, just even index-spacing; if the data has gaps or uneven time intervals, the sparkline will visually misrepresent them.
- **Do not** reach for this when the design calls for axis labels, a legend, or a tooltip — that need belongs to `src/components/shared/charts/*`, not this primitive.
- **Do not** override the stroke/fill colors via wrapper CSS overrides/`filter` hacks to theme it — the component has no color props; if a non-ink sparkline is genuinely needed, that is a prop-signature change to make deliberately, not a CSS workaround.
