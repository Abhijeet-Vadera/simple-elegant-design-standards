# IdeasPerDepartmentChart

## Purpose
A horizontal ranked bar list (one row per department, sorted descending by idea count) that answers "which departments submit the most ideas." It is a self-contained hand-rolled SVG chart — label column + track/fill bar pair + trailing count — not a wrapper over any charting library.

## File path & path-inconsistency flag
- **File:** `src/components/shared/charts/IdeasPerDepartmentChart.tsx` (100 lines)
- **Path-inconsistency flag:** this lives under `src/components/shared/charts/` — a "legacy-looking" path shape (`src/components/...`) that sits alongside the modern primitive barrel at `src/shared/components/ui/index.tsx` (see `.ai-design-dna/12_DESIGN_TOKENS/components.json:2`, whose `canonicalFile` is the `src/shared/...` tree). There is **no** `src/shared/charts/` counterpart and nothing duplicates this file, so per this audit's convention it is treated as canonical despite the inconsistent path — do not "fix" the path by moving it without a deliberate refactor ticket.
- **Export:** `export function IdeasPerDepartmentChart({ items }: { items: IdeasPerDepartment[] })`, `IdeasPerDepartment = { department: string; count: number }` (`src/types/index.ts:370-373`).

## Exact rendering technique / colors / values
Read verbatim from source:
- **Layout constants** (lines 4-11): `W = 320` (viewBox width), `ROW_H = 28`, `PAD_TOP = 4`, `PAD_BOTTOM = 4`, `PAD_LEFT = 112` (label column), `PAD_RIGHT = 44` (count column), `BAR_AREA = W - PAD_LEFT - PAD_RIGHT = 164`, `BAR_H = 16`.
- **Sort:** `[...items].sort((a, b) => b.count - a.count)` — descending, non-mutating copy (line 19).
- **Scale:** `maxCount = Math.max(...sorted.map(s => s.count), 1)` — the `, 1` guards divide-by-zero when all counts are 0 (line 20).
- **SVG height:** dynamic, `H = PAD_TOP + sorted.length * ROW_H + PAD_BOTTOM` — grows with row count, no fixed/scrolling viewport (line 21).
- **Bar width:** `item.count > 0 ? Math.max(Math.round((item.count / maxCount) * BAR_AREA), 3) : 0` — linear scale to `BAR_AREA` px, floored at a **3px minimum visible sliver** for any nonzero count so a small value is never invisible; exactly `0` renders no fill rect at all (lines 40-43, 71).
- **Track (background) bar:** always rendered full-width, `fill="#F3F4F6"`, `rx={3}` (lines 62-69). `#F3F4F6` matches `color.hoverSurface` in `.ai-design-dna/02_DESIGN_DNA.json:24` / `colors.json:20`.
- **Fill bar:** `fill="#006AB3"`, `fillOpacity={0.85}`, `rx={3}` (lines 72-80). **`#006AB3` is not present anywhere in `.ai-design-dna/12_DESIGN_TOKENS/*.json` or `02_DESIGN_DNA.json`** — it is an ad hoc chart-only blue, distinct from the tokenized `info`/stagePill blue `#2563EB` (`semantic-colors.json:5,9`). This matches the documented gap in `02_DESIGN_DNA.json:59-60` ("chart components use raw... classes that fall outside this token set").
- **Row/count text:** `fontSize={10}`, dim rows (`item.count === 0`) get `fill="#9CA3AF"` (= `color.text.tertiary`, `colors.json:12`), non-dim rows get `fill="#374151"` (= `color.text.body700`, `colors.json:14`). Count text is `fontWeight={dim ? 400 : 600}` (lines 50-60, 83-92).
- **Label truncation:** department names > 15 chars are sliced to 14 chars + `"…"` (lines 57-59) — a manual truncation, not CSS `text-overflow` (SVG `<text>` doesn't support that).
- **Card shell:** `bg-card border border-border rounded px-[22px] py-[18px] h-full` — uses the tokenized `bg-card`/`border-border` Tailwind classes (unlike the sibling chart cards below, which hardcode `bg-white border-slate-*`), plus a mono uppercase eyebrow title `font-mono text-[11px] tracking-[0.14em] uppercase text-text-2` matching the `eyebrow` type scale in `02_DESIGN_DNA.json:82`.
- **Empty state:** `items.length === 0` renders `"No data"` (`common.noData`) in `text-[12.5px] text-text-3 text-center py-6`, no SVG at all.
- **Responsiveness:** `<svg width="100%" height={H} viewBox={"0 0 " + W + " " + H} preserveAspectRatio="xMidYMid meet">` — width stretches to container, height is fixed pixels driven by row count (not responsive to container height).

## Usage rules
- Feed it the full `IdeasPerDepartment[]` array as-is — the component owns sorting; do not pre-sort or pre-slice the caller's data (it will re-sort anyway, but pre-sorting is redundant work).
- Because height grows with `items.length * 28px`, only place it where the parent grid cell can accommodate a variable-height card, or wrap it in a fixed-height scroll container if the department count is large and unbounded.
- Match the `#006AB3` fill exactly if extending this component (e.g. adding a second series) rather than picking a nearby blue from the tokenized palette — the existing bar color is the establishe, if untokenized, convention for this specific chart.

## Real call-site examples
**None found.** A repo-wide search for `IdeasPerDepartmentChart` returns only its own definition (`src/components/shared/charts/IdeasPerDepartmentChart.tsx:13`) — no import, no JSX usage anywhere in `src/`:
```
$ grep -rn "IdeasPerDepartmentChart" src/
src/components/shared/charts/IdeasPerDepartmentChart.tsx:13:export function IdeasPerDepartmentChart({
```
It is dead/unused code. The live dashboard (`src/components/shared/Dashboard.tsx:125-130`) instead renders the equivalent "ideas by department" comparison via `<VerticalBarChart title="Ideas by department" data={mergedDeptData} colors={["#22C55E", "#EF4444"]} role="admin" />`, a **grouped vertical bar** component (accepted vs. rejected, click-through to `IdeasByDepartmentModal`) — a different visual form for overlapping data. Any future AI reviving this component should confirm with the team whether it is meant to replace or coexist with `VerticalBarChart`'s dashboard slot, not silently wire it in as a duplicate.

## Anti-patterns
- **Do not** introduce a chart library (Recharts, Chart.js, visx, d3-shape, etc.) to reimplement this bar list — the entire convention in `src/components/shared/charts/*` is hand-rolled `<svg>`/`<rect>`/`<text>` with manually computed geometry; this file is the reference pattern for horizontal-bar layout math (`PAD_LEFT`/`PAD_RIGHT`/`BAR_AREA` scaling).
- **Do not** invent a new bar color when reusing this pattern elsewhere — reuse `#006AB3` for this exact "ideas per department" semantic, or pull from the existing category-color map (`CategoryDistributionDonutCard`'s `CATEGORY_COLORS`) if the new chart is category-scoped; do not add a fresh ad hoc hex.
- **Do not** wire this component back into the dashboard without checking whether it should replace `VerticalBarChart`'s "Ideas by department" card — both currently claim the same conceptual slot with different visuals, and both existing today (one live, one dead) should not become two live, redundant renderings of the same data.
