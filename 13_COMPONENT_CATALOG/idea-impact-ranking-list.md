# IdeaImpactRankingList

## Purpose
A scrollable, clickable ranked list of ideas by total economic impact — not an SVG chart at all, but the "list" counterpart to the SVG charts in this same directory: a header (icon + title + grand-total figure) over a `max-h-[300px]` overflow list of row cards, each navigating to the idea detail screen on click.

## File path & path-inconsistency flag
- **File:** `src/components/shared/charts/IdeaImpactRankingList.tsx` (73 lines)
- **Path-inconsistency flag:** same legacy-shaped path as the rest of this catalog batch — `src/components/shared/charts/`, no `src/shared/charts/` counterpart, nothing duplicates it; canonical as-is. Slightly more notable here than for the pure-SVG siblings, since this component contains **no chart geometry at all** (no `<svg>`, no `strokeDasharray`, no bar math) — it is grouped into the "charts" folder purely by dashboard-analytics subject matter, not by rendering technique. A future AI should not assume every file in this directory is SVG-based.
- **Export:** `export function IdeaImpactRankingList({ items, grandTotal }: { items: IdeaImpactRanking[]; grandTotal: number })`. `IdeaImpactRanking = { ideaNumber?: string; title?: string; id: string; totalImpact: number }` (`src/types/index.ts:385-390`).

## Exact rendering technique / values
Read verbatim from source:
- **Currency formatting:** local `fmt()` (lines 6-12), identical shape to the one in `TotalEconomicImpactCard`: `Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })` — the same currency-format snippet is copy-pasted (not shared via a util) across at least these two chart files.
- **Navigation:** uses `useNav()` (`@/hooks/helper`) to get `go`, and each row's `onClick` calls `go("idea", { ideaId: item.id })` (line 47) — this is the only component in the six-file set with real navigation/interactivity beyond hover styling (compare: `IdeasByDepartmentModal` also navigates, via `react-router`'s `useNavigate` directly rather than `useNav`).
- **Header:** `flex items-center justify-between mb-8` — left side is `TrendIcon` (16px, `text-slate-400`) + bold `14px` title (`t("dashboard.totalImpactRankingTitle", "Total Impact Ranking")`); right side is the formatted `grandTotal` in `font-semibold text-[14px] text-text` (note: `text-text`, the tokenized ink color, not a `slate-*` class — a small inconsistency against the otherwise `slate-800`-titled header text right next to it).
- **List container:** `flex flex-col gap-2 flex-1 max-h-[300px] overflow-y-auto pr-1` — a fixed 300px max-height scroll area, `gap-2` (8px) between rows, `pr-1` (4px) reserved so the scrollbar doesn't overlap row content.
- **Empty state:** `items.length === 0` → centered `"No data"` (`text-[12.5px] text-text-3 text-center py-6`), same empty-state copy/classes as `IdeasPerDepartmentChart`'s empty state.
- **Row card:** `flex items-center gap-3 px-4 py-2.5 border border-slate-100 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors shadow-sm`, keyed by `item.id`. Inside:
  - Idea number/ID: `text-[13px] font-medium text-text truncate` — falls back to `t("dashboard.unknownIdea", "Unknown Idea")` if `item.ideaNumber` is falsy.
  - Idea title (only rendered `if (item.title)`): `text-[12px] max-w-[300px] text-text font-medium truncate` — conditionally present, sits inline next to the idea number in the same flex row (both wrapped in one `flex-1 min-w-0 flex items-center gap-2` container), so a missing title simply omits that span rather than leaving a gap.
  - Impact value: `fmt(item.totalImpact)` in `font-semibold text-[13px] text-text shrink-0`.
  - Trailing `ChevronRightIcon` (16px) in `text-text-3`, `shrink-0` — the row's only affordance signaling it's clickable (no visible button chrome).
- **Card shell:** `bg-white border border-slate-200 rounded-xl shadow-sm px-[22px] py-[18px] h-full flex flex-col` — identical shell to `TotalEconomicImpactCard`'s (`slate-200`/`rounded-xl`), not `CategoryDistributionDonutCard`/`ContributionsCard`'s (`slate-100`/`rounded-2xl`) — confirming the shell-styling split runs along "has an SVG chart body" (rounded-2xl/slate-100 family: donut/contribution cards) vs. "has a bar-chart or list body" (rounded-xl/slate-200 family: this file, `TotalEconomicImpactCard`) rather than being random.

## Usage rules
- `items` should already be pre-ranked/sorted by the caller (or by the API) — unlike `IdeasPerDepartmentChart`, this component does **not** sort its input; it renders `items` in the order given.
- `grandTotal` is rendered once, in the header, and is independent of summing `items` client-side — pass the authoritative total from the API, not a client-computed sum, to avoid drift if `items` is a truncated/paginated subset.
- The `max-h-[300px]` scroll area means this component is safe to feed an arbitrarily long `items` array without breaking the dashboard grid's row height — no pagination is implemented; it's pure CSS scroll.

## Real call-site examples
```
$ grep -n "IdeaImpactRankingList" -r src/
src/components/shared/Dashboard.tsx:3:import { IdeaImpactRankingList } from "@/components/shared/charts/IdeaImpactRankingList";
src/components/shared/Dashboard.tsx:142:        <IdeaImpactRankingList
```
Full call site, `Dashboard.tsx:142-145`:
```tsx
<IdeaImpactRankingList
  items={rankings}
  grandTotal={analyticsData.totalImpactGrandTotal ?? 0}
/>
```
(`rankings = analyticsData.ideaImpactRanking ?? []`, `Dashboard.tsx:61`). Positioned as the first card of the "THIRD ROW" 3-up grid (`Dashboard.tsx:141-156`), beside two `VerticalBarChart` instances (Savings/Profit by department). Reached from `DashboardScreen` via `AdminDashboard`/`ManagementDashboard` (`src/features/dashboard/container/DashboardScreen.tsx:331,342`).

## Anti-patterns
- **Do not** treat this file as an SVG-chart reference when building a new chart — it has no chart geometry; for hand-rolled SVG conventions, look at `IdeasPerDepartmentChart.tsx`, `CategoryDistributionDonutCard.tsx`, `ContributionsCard.tsx`, or `TotalEconomicImpactCard.tsx` instead.
- **Do not** add pagination controls or infinite-scroll logic inline in this component as a "fix" for large lists — the existing `max-h-[300px] overflow-y-auto` pattern is the established convention for bounded-height scrollable dashboard lists; if true pagination is needed, that's a deliberate feature change, not a drive-by pattern change.
- **Do not** copy-paste the local `fmt()` currency formatter into yet another new file — it is already duplicated between this file and `TotalEconomicImpactCard.tsx`; if you need EUR formatting in a third chart file, that's a signal to extract a shared util rather than pasting a fifth copy.
- **Do not** swap `useNav()`'s `go("idea", { ideaId })` navigation pattern for `useNavigate()`/raw path strings (as `IdeasByDepartmentModal` does) without a reason — within this six-file set there are two different navigation idioms in use; match whichever idiom the surrounding feature already uses rather than introducing a third.
