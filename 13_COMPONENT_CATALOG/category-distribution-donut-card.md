# CategoryDistributionDonutCard

## Purpose
A card showing the idea submission breakdown by category ("Idea", "Quick Win", "Referral") as a single hand-rolled SVG donut (ring chart) plus a color-swatch legend with count + percentage per row. It is the canonical example in this catalog of the "donut via `strokeDasharray`/`strokeDashoffset` on a rotated circle" technique used across the dashboard's ring charts.

## File path & path-inconsistency flag
- **File:** `src/components/shared/charts/CategoryDistributionDonutCard.tsx` (89 lines)
- **Path-inconsistency flag:** same as all six components in this catalog batch — lives under the legacy-shaped `src/components/shared/charts/` path with no `src/shared/charts/` counterpart. Nothing duplicates it, so it is canonical as-is; flagged, not corrected.
- **Export:** `export function CategoryDistributionDonutCard({ items }: { items: { category: string; count: number; percentage: number }[] })` — the inline prop type is structurally identical to `CategoryDistribution` (`src/types/index.ts:364-368`) but is **not imported from `@/types`**; it's a locally re-declared inline object type (a minor type-duplication worth noting, not fixing).

## Exact rendering technique / colors / values
Read verbatim from source:
- **Hard-coded category color map** (lines 3-7):
  ```ts
  const CATEGORY_COLORS: Record<string, string> = {
    Idea: "#2563EB",
    "Quick Win": "#16A34A",
    Referral: "#8B5CF6",
  };
  ```
  Fallback for any category not in this map: `"#94A3B8"` (line 39, 61 — a stock Tailwind `slate-400`, matching the card's overall un-tokenized slate palette). `#2563EB` matches the tokenized `info.text`/`stagePill.evaluation.text` (`semantic-colors.json:5,9`); `#16A34A` matches `stagePill.pilot.text`/`fileTypeGlyph.CSV` (`semantic-colors.json:10`, `colors.json:34`) — both happen to line up with existing semantic tokens. `#8B5CF6` (Referral, violet) has **no match anywhere** in `.ai-design-dna/12_DESIGN_TOKENS/*.json` — it is a chart-only ad hoc color with no tokenized twin.
- **Donut geometry:** `r = 54`, `circ = 2 * Math.PI * r` (≈339.3), drawn inside a `viewBox="0 0 140 140"` circle centered at `(70, 70)`, rendered at a fixed `width={160} height={160}` box, wrapped in `className="transform -rotate-90 drop-shadow-sm"` — the `-90deg` rotation is what turns the default "3 o'clock start" of `strokeDasharray` arcs into a "12 o'clock start."
- **Track ring:** one background `<circle>` with `fill="none" stroke="#F8FAFC" strokeWidth={22}` (a near-white slate tint, not in the token set).
- **Segment loop** (lines 34-55): a running `offset` accumulator, one `<circle>` per category:
  - `pct = total > 0 ? item.count / total : 0`
  - `dash = pct * circ` (this segment's arc length)
  - `currentOffset = offset` captured **before** mutating `offset += dash` (classic accumulator-then-advance pattern for stacking arcs around the ring)
  - `strokeDasharray={`${dash} ${circ}`}` — draw `dash` px, gap `circ` px (i.e. "one dash, then blank for the rest of the circumference," relying on the next segment's dashoffset to visually pick up where this one ends)
  - `strokeDashoffset={-currentOffset}` — **negative** offset shifts the dash start clockwise by the accumulated prior-segment length
  - `strokeLinecap="butt"` — flat segment ends, no rounded caps between categories
  - `strokeWidth={22}` (same as the track, so the color ring exactly covers the gray track)
  - `className="transition-all duration-700 ease-out"` — the only "animation" is a 700ms CSS transition on style-relevant SVG attributes, triggered when `dash`/`strokeDashoffset` change between renders (e.g. new data), not a mount-in draw animation.
- **Legend rows:** one per `items` entry, `w-3 h-3 rounded-sm` swatch using the same `CATEGORY_COLORS` lookup (`backgroundColor: col` inline style, not a Tailwind bg class, since colors are dynamic), category label translated via `t("idea.categoryIdea"|"categoryQuickWin"|"categoryReferral")` with the raw `item.category` string as ultimate fallback, then `item.count` (`text-[14px] font-bold text-slate-800`) and `item.percentage + "%"` (`text-[12px] text-slate-400 w-8 text-right` — percentage is **read directly from the API-provided `percentage` field**, not recomputed from `count/total` client-side, so it can theoretically drift from the donut's own `pct` if the backend rounds differently).
- **Card shell:** `bg-white border border-slate-100 rounded-2xl shadow-sm p-6 h-full flex flex-col` — stock Tailwind `slate` palette classes, **not** the tokenized `bg-card`/`border-border` used by e.g. `IdeasPerDepartmentChart`'s shell — this is the specific inconsistency flagged in `02_DESIGN_DNA.json:59` ("chart components use raw stock Tailwind palette classes... Do not extend this pattern").
- **Header:** a generic compass/circle-graph-style stroke icon (`viewBox 0 0 24 24`, `stroke="currentColor" strokeWidth="2"`, `text-slate-400`) + `text-[14px] font-bold text-slate-800` title — same header pattern reused verbatim across `ContributionsCard`, `VerticalBarChart`.
- **Empty state:** `items.length === 0` → centered `"No data"` in `text-[13px] text-slate-400`, no donut rendered.

## Usage rules
- Pass `items` already carrying a server-computed `percentage` per entry — this component does not recompute percentages for its own count/percentage text, only for the donut arc geometry (`pct = item.count / total`, computed locally). Do not assume these two derivations always agree to the decimal.
- Only the three literal category strings `"Idea"`, `"Quick Win"`, `"Referral"` get a mapped color; any other category string silently falls back to slate `#94A3B8` with an untranslated raw label — if a new category is introduced upstream, `CATEGORY_COLORS` (and the three `t(...)` ternary branches) must be extended here, or it will render in the "unknown" gray.
- The `-rotate-90` + `strokeLinecap="butt"` combination is required together — swapping to `"round"` caps without adjusting the accumulator math would visually overlap/gap the segment joins.

## Real call-site examples
```
$ grep -n "CategoryDistributionDonutCard" -r src/
src/components/shared/Dashboard.tsx:1:import { CategoryDistributionDonutCard } from "@/components/shared/charts/CategoryDistributionDonutCard";
src/components/shared/Dashboard.tsx:137:        <CategoryDistributionDonutCard items={catItems} />
```
Used from `Dashboard.tsx` (imported into `DashboardScreen` via `AdminDashboard`/`ManagementDashboard` at `src/features/dashboard/container/DashboardScreen.tsx:331,342`), inside the "SECOND ROW" 3-up grid (`Dashboard.tsx:124-138`) alongside `VerticalBarChart` and `ContributionsCard`. `catItems` is `analyticsData.categoryDistribution` guarded to `[]` if not an array (`Dashboard.tsx:58-60`).

## Anti-patterns
- **Do not** introduce a chart library (e.g. Recharts `<PieChart>`) to replace this donut — the `strokeDasharray`/`strokeDashoffset`-on-a-rotated-circle technique is the established hand-rolled convention for every ring chart in this codebase (see also `ContributionsCard`'s two-segment donut using the identical technique).
- **Do not** invent a new category color outside `CATEGORY_COLORS` — if a 4th category appears, add it to this exact map (and its `t()` label branch) rather than letting it fall through to the `#94A3B8` gray fallback, and do not reach for an arbitrary new hex without checking whether the token set (`semantic-colors.json`) already has an appropriate triad color.
- **Do not** "fix" the `bg-white border-slate-100` shell to the tokenized `bg-card`/`border-border` classes as a drive-by refactor — that shell style is shared verbatim across `ContributionsCard`, `IdeaImpactRankingList`, `TotalEconomicImpactCard`, and `VerticalBarChart`; changing one without the others creates a visual seam in the dashboard grid.
