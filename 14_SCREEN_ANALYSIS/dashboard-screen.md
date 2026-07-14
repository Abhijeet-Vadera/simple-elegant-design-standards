# Dashboard Screen

`src/features/dashboard/container/DashboardScreen.tsx`, route `/dashboard`, route id `dashboard`.

## Purpose & access

- `access: "any"` in `routes.config.ts` — every authenticated role can reach `/dashboard` (it is the default landing route, `nav.group: null`, icon `HomeIcon`).
- Route meta description: **"Manage innovation topics and track performance"**.
- The screen is a single `<Shell>` wrapper whose body is swapped entirely by role — it is really three different dashboards sharing one shell, not one dashboard with role-based widgets bolted on:
  - `manager` → `ManagerDashboard` (operational/task-focused: assigned ideas, mentions, todos).
  - `admin` → `AdminDashboard` → shared `<Dashboard analyticsData=…/>` (organization-wide analytics/KPIs).
  - `management` → `ManagementDashboard` → the *same* `<Dashboard>` component as admin (identical analytics view, no role-specific gating inside it).
  - Any other role (`employee`, etc.) → `dashboardContent[role] ?? null` → renders nothing but the Shell header/chrome. There is no default/fallback dashboard for unlisted roles.
- `Shell` title = "Dashboard", subtitle = "Executive summary of platform innovation and engagement." — note this subtitle is shown even for the manager's task-list view, so copy is written for the analytics case, not the operational one.
- Data fetching: `useQuery(["analytics-dashboard"])` hits `/analytics/analysis-dashboard`, `enabled` only when `role` is `admin`/`management` (`needsAnalytics`). Manager-only queries (`ideas-assigned-my`, `manager-metrics`, `my-tasks`, `ideas-mentions-my`) are separate, independent `useQuery` calls fired unconditionally when `authUser` exists but gated per-query — all four must resolve before the manager view renders (whole-screen `DataLoader`, no per-section skeletons).

## Layout — Admin/Management ("analytics") variant

This is the dense variant and the one the catalog components above document. Structure (`src/components/shared/Dashboard.tsx`):

- Outer wrapper: `flex flex-col gap-5 mb-6` — three stacked rows, each an independent CSS grid, 20px (`gap-5`) between rows and between cards in a row.
- **Row 1 — KPI strip**: `grid grid-cols-1 md:grid-cols-3 gap-5`, exactly **3 StatCards**: Total Economic Impact (purple icon), Total Savings (green), Additional Profit (blue). All values are EUR-formatted (`Intl.NumberFormat("de-DE", currency: "EUR")`) with no decimals. Referenced in catalog as **total-economic-impact-card** / **chart-stat-card** pattern.
- **Row 2**: `grid grid-cols-1 lg:grid-cols-3 gap-5`, 3 equal-width cards:
  1. **Vertical bar chart** "Ideas by department" — grouped bars (accepted vs rejected), the *only* chart wired with `role="admin"`, making its title clickable (drill-down, see Interaction below). Catalog: **vertical-bar-chart** (this is the same generic `VerticalBarChart` component reused for two other charts below with different colors/single series — not a distinct "department-bar-chart" component, despite that catalog file name existing).
  2. **contributions-card** — work-safety / workplace-improvement yes/no contribution breakdown.
  3. **category-distribution-donut-card** — category distribution donut.
- **Row 3**: `grid grid-cols-1 lg:grid-cols-3 gap-5`, 3 more equal-width cards:
  1. **idea-impact-ranking-list** — ranked list of highest-impact ideas against a grand total.
  2. **vertical-bar-chart** again, single-series green, "Savings by department" (no drill-down — `role` prop omitted).
  3. **vertical-bar-chart** again, single-series blue, "Additional profit by department" (no drill-down).
- Total: **3 KPI stat cards + 6 chart/list cards = 9 data widgets** on one screen, all above the fold on a typical desktop viewport only in the loosest sense — this is a scroll-heavy screen.
- Responsive collapse: every grid drops to `grid-cols-1` below `md`/`lg`, stacking all 9 widgets vertically — but the screen is documented desktop-only, so this is a defensive fallback rather than a designed breakpoint.
- Empty state: if `analyticsData` is falsy, the whole `<Dashboard>` renders one centered empty-state block (`rounded-2xl border border-slate-100 shadow-sm`, 40px padding, icon tile + title + body) instead of the 3-row grid — an all-or-nothing state, not per-widget.

## Layout — Manager ("operational") variant

- **Row 1 — KPI strip**: `grid grid-cols-4 gap-5`, exactly **4 StatCards** (fixed 4-column, no responsive collapse unlike the analytics variant): Total Ideas (blue), In Review (amber), Approved (green), Rejected (red).
- **Row 2**: `grid grid-cols-2 gap-5`, two columns:
  - Left column (`flex flex-col gap-6`): stacked **SectionCard** "My assigned ideas" (up to 5 `IdeaRow`s, "Board" ghost-button action linking to kanban) then SectionCard "Mentioned in" (custom mention rows with `@[id:name]` markup rendered as bold blue spans via `renderMentions`).
  - Right column: single SectionCard "My tasks" — todo rows with a 3px left color bar keyed to priority (red/amber/green), strikethrough+dim for completed, relative due-date with calendar icon.
- No charts at all in the manager view — it is list/row-based, contrasting sharply with the analytics variant's chart density.

## Hierarchy

- Shell page title/subtitle (largest text) → row of KPI StatCards (large `28px` numeric values, uppercase `12px` tracked labels) → card-level titles (`14px` bold, e.g. chart titles; SectionCard titles use the `sectionCardTitle` token ~13.5px/600) → row content (bars, list rows, table-like rows) → row metadata (percentages, counts, dates in 10.5–11px).
- Icons act as a secondary category cue on every StatCard (colored icon chip, top-right of card) and on manager list rows (calendar, check-circle, chevron).
- In the analytics variant, hierarchy is flat across the 6 chart/list cards — no card is visually emphasized over another (same border, shadow, radius, padding for all); differentiation is by content only.

## Spacing

- Page-level row gap: `gap-5` (20px) between the 3 grid rows, `mb-6` (24px) after the whole block.
- Grid cell gap: `gap-5` (20px) consistently, both rows and columns, in both dashboard variants.
- Manager left column stacks its two SectionCards with `gap-6` (24px), slightly looser than the 20px grid gap elsewhere.
- Card internal padding: chart cards `p-6` (24px all sides); StatCard `18px/20px` (matches `cardBodyPaddingLoose` token); SectionCard rows use `13px 18px` list-row padding (matches `listRowPadding` token) with `border-b` dividers between rows rather than gaps.
- Manager todo rows add a 3px left priority border inside the same row padding, so priority color-coding doesn't consume extra spacing.

## Typography

- Chart card titles: `14px` bold (`text-[14px] font-bold text-slate-800`) — slightly heavier/larger than the `sectionCardTitle` token (13.5px/600) used by SectionCard, so the two card families (charts vs. list sections) are typographically distinct even though visually similar (white rounded card, border, shadow).
- StatCard label: `12px` uppercase, `0.08em` tracking, using `text.text` color — close to but not identical to the documented `label` token (12.5px/500); value: `28px/600`, `-0.03em` tracking — matches `statCardValue` token exactly.
- Chart legends and axis numbers: `11px` medium, slate-400/500 — same register as `caption`/`badgeText` tokens.
- Manager mention/task rows: `13px` body text, `10.5–11px` mono-ish badges for idea refs and priority pills — consistent with `ideaRef`/`badgeTextMono` tokens elsewhere in the app.
- No page `pageTitle` (30px) is rendered inside the dashboard content itself — that lives in the `Shell` header, outside this component.

## Components used

From the parallel-built catalog (`.ai-design-dna/13_COMPONENT_CATALOG/`), named only:
- **chart-stat-card** / StatCard — used 3× (analytics variant) or 4× (manager variant) in the top KPI row. Two separate StatCard implementations exist in the codebase (`src/shared/components/ui` and `src/components/shared/charts/StatCard.tsx`); the Dashboard screen uses the `shared/components/ui` one for both the manager metrics and the analytics KPI row.
- **total-economic-impact-card** — the "Total Economic Impact" StatCard specifically (EUR-formatted grand total).
- **vertical-bar-chart** — reused 3× with different data/color props (department accepted-vs-rejected grouped bars; savings single-series; profit single-series). Only the first instance is given `role="admin"`, which is what makes it interactive.
- **department-bar-chart** / **ideas-per-department-chart** — separate source files (`DepartmentBarChart.tsx`, `IdeasPerDepartmentChart.tsx`) exist in `src/components/shared/charts/` but are **not** imported by this screen; the department visualization actually shown here is the generic `VerticalBarChart`, not those named components. Worth flagging so the catalog doesn't imply they're what renders on this screen.
- **contributions-card** — work-safety / workplace-improvement yes/no breakdown, row 2.
- **category-distribution-donut-card** — category donut, row 2.
- **idea-impact-ranking-list** — ranked-impact list, row 3.
- From the generic catalog: **modal.md** (used indirectly — see Interaction), **idea-row.md** (manager's "My assigned ideas" section), and the app's `SectionCard`/`Button`/`EmptyState`/`DataLoader` primitives (not yet separately catalogued as of this writing) for the manager variant.

## Interaction

- **Drill-down modal**: the "Ideas by department" chart title (row 2, first card, analytics variant only) is underlined and clickable specifically because it receives `role="admin"` — clicking opens `IdeasByDepartmentModal` (`src/components/shared/charts/IdeasByDepartmentModal.tsx`), a 1000px-wide `Modal` (per `modal.md`) containing a `DataTable` of departments (name, code, member count, ideas submitted, approved count, rejected count). The approved/rejected count cells are themselves clickable links (blue/red, underline-on-hover) that close the modal and navigate to `/ideas?status=approved&department={id}` or `/ideas?status=rejected&department={id}` — a two-level drill-down: chart → department table → filtered idea list.
- The two other `VerticalBarChart` instances (savings/profit by department) do **not** pass `role`, so their titles render without underline/cursor-pointer and have no click handler — a deliberate (if easy-to-miss) asymmetry: only one of three structurally-identical bar charts is interactive.
- Bar segments show their numeric value on hover (`opacity-0 group-hover:opacity-100`) rather than a true tooltip component — a lightweight, CSS-only hover reveal, transition 500ms on height, no delay/library tooltip.
- Manager rows are fully clickable (`onClick` on the row div, not just a button) navigating to idea detail (`go("idea", { ideaId })`) or the kanban board via the "Board" ghost button on the assigned-ideas SectionCard.
- No filters, date-range pickers, or sort controls exist anywhere on this screen — all data is server-computed for a fixed (implicit, unstated) period; the only user-driven scoping is the department drill-down modal's navigation into the pre-filtered Ideas list.
- No polling/auto-refresh; all queries use `staleTime: 0` (always considered stale, refetched on refocus/remount) but no `refetchInterval`.

## Accessibility

- No explicit ARIA roles/labels on chart SVGs, bars, or the donut/ranking widgets in the source read — bars are plain `<div>`s with inline `style.backgroundColor`/`height`, not `<svg>` with `role="img"` or text alternatives; screen-reader users get no equivalent to the visual bar comparison beyond the numeric hover label (which itself is mouse-hover-only, not focusable/keyboard-reachable).
- The drill-down affordance on the "Ideas by department" title is a `<span onClick>` with `cursor-pointer`/`underline` styling, not a `<button>` — no keyboard activation (no `tabIndex`, no `onKeyDown`/`Enter` handler), so the modal is mouse-only to open.
- Manager list rows (`div onClick`) are likewise not native interactive elements — same keyboard-access gap as the chart title.
- Color is load-bearing without redundant encoding in a few places: accepted/rejected legend swatches (green/red) and priority left-borders (red/amber/green) carry meaning by hue alone, though priority also has a text label chip and accepted/rejected also has a text legend, which partly mitigates it.
- Given the app is documented as desktop-only internal admin tooling, WCAG/keyboard rigor appears intentionally deprioritized in favor of shipping velocity — consistent across this screen's interactive elements.

## Data density

- This screen is the densest in the app: up to 9 independent data widgets (3 KPIs + 6 charts/lists) fetched from a single `/analytics/analysis-dashboard` payload (`IAnalytics`), each rendering a different visualization shape (currency stat, grouped bars, single-series bars ×2, donut, ranked list, yes/no contribution breakdown).
- Density is managed primarily through **uniform card chrome**: every widget shares the same white background, `rounded-2xl`, `border-slate-100`, `shadow-sm` container regardless of content type, so the eye isn't fighting inconsistent framing while parsing 9 different chart types at once.
- **Progressive disclosure via modal**: rather than surfacing per-department line items inline, the department chart only shows aggregate accepted/rejected bars; the full tabular breakdown (with per-department drill-through to filtered idea lists) is deferred to the `IdeasByDepartmentModal`, keeping the base grid from becoming a data table.
- **Row-based visual grouping**: three fixed 3-column rows (`grid-cols-3` at `lg`) impose a strict rhythm rather than a variable-span dashboard grid — no widget spans multiple columns/rows, which trades flexibility for predictability at this density.
- **Reuse of one chart primitive for three datasets** (`VerticalBarChart` for department/savings/profit) reduces the number of distinct visual grammars a user must learn, even though the underlying numbers differ by an order of magnitude (counts vs. EUR amounts) and the Y-axis simply rescales per chart.
- The manager variant, by contrast, deliberately avoids this density — 4 KPIs + 3 short lists (capped at 5 items for assigned ideas) — suggesting density scales with role: admin/management get an aggregate command-center, managers get a bounded personal worklist.
- Single global loading gate (whole-screen `DataLoader`) rather than per-widget skeletons means, on a slow analytics query, the user waits for the entire 9-widget payload before seeing anything — a density/perceived-performance tradeoff worth flagging for future work.

## Reusable ideas

- The **admin/management dashboard body is a single shared component** (`Dashboard.tsx`) rendered identically for two different roles — a clean pattern for "same view, different access gate" that could be extended to other screens where role only affects *access*, not *content*.
- The **conditional-`role` prop trick** on `VerticalBarChart` (passing `role="admin"` to toggle a click-to-drill-down affordance on an otherwise-identical component) is a lightweight way to reuse one chart component across interactive and non-interactive contexts — but it overloads a prop named `role` for what is really an `interactive`/`onTitleClick` concern, and only checks for the literal string `"admin"`, so `management` users looking at the same `<Dashboard>` do not get the drill-down even though they see the same chart. Worth renaming/generalizing if reused elsewhere.
- The **three-row, fixed-3-column grid** with a consistent `gap-5` and uniform card chrome is a solid template for future dense-analytics screens — it scales to "n widgets in groups of 3" cleanly and keeps a data-heavy screen visually calm.
- The **modal-as-drill-down-table** pattern (chart → `IdeasByDepartmentModal` → filtered navigation into `/ideas`) is reusable for any other aggregate chart that needs a "see the underlying rows" escape hatch without cluttering the base card.
- The **whole-screen role switch with graceful `null` fallback** (`dashboardContent[role] ?? null`) is simple but silently renders an empty page body for any role not in the map — a future role addition without a matching dashboard case will fail invisibly (just header/subtitle, no content, no error) rather than falling back to a default view.
