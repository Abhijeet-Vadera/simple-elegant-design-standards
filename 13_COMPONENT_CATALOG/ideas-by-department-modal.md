# IdeasByDepartmentModal

## Purpose
A drill-down modal, opened by clicking the (admin-only) "Ideas by department" chart title, that shows a full data-table breakdown per department (name, code, member count, ideas submitted, approved, rejected) — with the Approved/Rejected count cells themselves acting as links that close the modal and navigate to a pre-filtered `/ideas` list. It is the one component in this six-file set that is a table, not a chart, and the one whose data comes from its own independent API call rather than the shared `analyticsData` prop tree.

## File path & path-inconsistency flag
- **File:** `src/components/shared/charts/IdeasByDepartmentModal.tsx` (143 lines)
- **Path-inconsistency flag:** same legacy-shaped path as the rest of this catalog batch — `src/components/shared/charts/`, no `src/shared/charts/` counterpart, nothing duplicates it; canonical as-is. Like `IdeaImpactRankingList`, it is grouped into "charts" by subject (dashboard department analytics) despite containing zero chart/SVG rendering — it delegates its entire visual body to `DataTable` (`src/components/shared/DataTable.tsx`), itself another `src/components/shared/*`-rooted (not `src/shared/*`) file, and to the shared `Modal` primitive from `@/shared/components/ui`.
- **Export:** `export function IdeasByDepartmentModal({ open, onClose }: { open: boolean; onClose: () => void })` — a fully controlled modal (no internal open-state), consistent with the app's `Modal` primitive convention (`src/shared/components/ui/index.tsx:674-684`, `open`/`onClose` controlled props, `width` optional, defaulting to `480`; this call site passes `width={1000}`).

## Exact rendering technique / values
Read verbatim from source:
- **Data source:** its own `useQuery({ queryKey: ["departmentStats"], queryFn: ... , enabled: open })` (lines 30-39) hitting `httpService.get("/departments")` directly — **not** derived from the `analyticsData`/`IAnalytics` object that every other component in this six-file set consumes. `enabled: open` means the query only fires while the modal is open (refetches each time it's reopened per React Query's default `staleTime`, since none is set here). Response shape handling: accepts either a bare array or a `{ data: [...] }` envelope (`Array.isArray(payload) ? payload : (payload.data || [])`, line 36) — defensive against two possible API response shapes.
- **Local type:** `DeptStats { id, name, code, member_count, idea_count, approved_count, rejected_count }` (lines 10-18) — **snake_case** field names, unlike the camelCase `IAnalytics`/`IdeasPerDepartment` etc. used by every sibling chart component; this endpoint's payload shape is a distinct, unrelated API surface from the analytics dashboard endpoint.
- **Columns** (`useMemo`, lines 41-119), built as `ColumnDef<DeptStats>[]` for `@tanstack/react-table` via the shared `DataTable` wrapper:
  1. **Department Name** (`name`) — `text-[13px] text-text capitalize`.
  2. **Code** (`code`) — `text-[13px] text-text`.
  3. **Total Members** (`member_count`) — `text-[13px] text-text`.
  4. **Ideas Submitted** (`idea_count`) — `text-[13px] text-text`.
  5. **Approved Ideas** (`approved_count`) — rendered as a clickable link: `text-[13px] text-[#2563EB] font-medium hover:underline cursor-pointer ... hover:text-[#1D4ED8]`, `onClick` calls `onClose()` then `navigate(`/ideas?status=approved${deptId ? `&department=${deptId}` : ""}`)`. `#2563EB` matches tokenized `info.text`/`stagePill.evaluation.text` (`semantic-colors.json:5,9`); `#1D4ED8` (hover) matches tokenized `info.text` used elsewhere as a link-hover shade too — this is one of the few chart-adjacent color usages in this six-file set that **does** land exactly on existing tokens.
  6. **Rejected Ideas** (`rejected_count`) — same link pattern, `text-[#DC2626]` (= tokenized `errorText`, `colors.json:29`) with hover `text-[#B91C1C]` (= tokenized `danger.text`, `semantic-colors.json:4`), `onClick` navigates to `/ideas?status=rejected...` instead.
- **Navigation mechanism:** `useNavigate()` from `react-router-dom` directly (line 8, 28) — not the app's `useNav()` hook that `IdeaImpactRankingList` uses; both `onClose()` (closing the modal) and `navigate(...)` fire together on cell click, in that order.
- **Modal chrome:** `<Modal open={open} onClose={onClose} width={1000}>` — the widest `width` override of the `Modal` primitive found via this audit (default is `480`), needed to fit the 6-column table. Inner content: `p-6 flex flex-col h-[60vh] min-h-[400px]` — fixed-ratio-of-viewport height with a `min-h` floor, header row `flex justify-between items-center mb-6 shrink-0` with `h2` title (`text-[18px] font-bold text-slate-800`, `t("dashboard.ideasByDepartmentModalTitle", "Ideas by Department")`), then `<div className="flex-1 min-h-0"><DataTable ... fullHeight /></div>` — the `flex-1 min-h-0` + `DataTable`'s `fullHeight` prop combination is what lets the table's own internal scroll region fill the remaining modal height correctly (a common flexbox-overflow gotcha: `min-h-0` overrides the flex item's default `min-height: auto`, which would otherwise prevent it from shrinking below its content size).
- **DataTable props used:** `columns`, `data={departments}`, `isLoading`, `emptyMessage={t("common.noData", "No data available")}`, `fullHeight` — this is a consuming example of `src/components/shared/DataTable.tsx`'s public API, not a hand-rolled table.

## Usage rules
- Only mount/open this modal from a context where `open`/`onClose` are real controlled state — it fetches on `open: true` via `enabled: open`, so toggling `open` is both the visibility control and the data-fetch trigger; there's no separate "preload" path.
- The Approved/Rejected link cells always close the modal before navigating — if a future call site wants "navigate without closing," that requires changing this component, not just the call site, since the `onClose()` call is hard-coded inside each cell's `onClick`.
- Treat the `/departments` endpoint and its snake_case `DeptStats` shape as unrelated to `IAnalytics` — do not assume this modal's data can be derived from the same `analyticsData` object the rest of the dashboard shares; it has its own query and its own loading state.

## Real call-site examples
```
$ grep -n "IdeasByDepartmentModal" -r src/
src/components/shared/charts/VerticalBarChart.tsx:3:import { IdeasByDepartmentModal } from "./IdeasByDepartmentModal";
src/components/shared/charts/VerticalBarChart.tsx:129:        <IdeasByDepartmentModal
```
Full call site, `VerticalBarChart.tsx:128-133`:
```tsx
{role === "admin" && (
  <IdeasByDepartmentModal
    open={showModal}
    onClose={() => setShowModal(false)}
  />
)}
```
`showModal` is `VerticalBarChart`'s own local `useState(false)` (`VerticalBarChart.tsx:16`), flipped to `true` by clicking the chart's title text — but only when `VerticalBarChart` was itself rendered with `role="admin"` (the title gets `underline cursor-pointer` classes and an `onClick` handler only in that case, `VerticalBarChart.tsx:42-48`). Chasing the chain one level further up: `VerticalBarChart` is used three times in `Dashboard.tsx` (lines 125, 146, 151), but only the **first** call — the "Ideas by department" chart (`Dashboard.tsx:125-130`) — passes `role="admin"`; the Savings-by-department and Profit-by-department bar charts (`Dashboard.tsx:146-150`, `151-155`) omit `role`, so this modal is only ever reachable through that one specific chart title in the live app, even though `IdeasByDepartmentModal` itself has no awareness of "role" — the gating happens entirely inside `VerticalBarChart`.

## Anti-patterns
- **Do not** hand-roll a new `<table>` inside this file or a sibling — `DataTable` (`src/components/shared/DataTable.tsx`) is the established shared table primitive; this modal is itself the reference example of consuming it (`columns`/`data`/`isLoading`/`emptyMessage`/`fullHeight`).
- **Do not** wire this modal's open state through a prop from `Dashboard.tsx` "for cleanliness" — the current design deliberately keeps the trigger state (`showModal`) local to `VerticalBarChart`, colocated with the specific chart instance that owns the click target; lifting it up would require threading `role`-awareness through an extra layer for no behavioral gain.
- **Do not** change the Approved/Rejected link colors to a chart-only ad hoc hex — unlike most of this six-file set, these particular colors (`#2563EB`/`#1D4ED8`, `#DC2626`/`#B91C1C`) already land exactly on tokenized `info`/`danger` values; keep them tied to those tokens rather than drifting to a new untokenized pair.
- **Do not** assume `/departments` and the analytics-dashboard endpoint are interchangeable or can be merged into one query without a backend contract change — they are two separate REST resources with two separate response shapes (snake_case `DeptStats` vs. camelCase `IAnalytics`) consumed by two separate `useQuery` calls.
