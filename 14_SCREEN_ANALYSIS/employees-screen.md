# Employees Screen

`src/features/people/container/EmployeesScreen.tsx` — route `/employees`.

## Purpose & access

The organisation member directory: a paginated, searchable, department-
filterable roster of every employee, with per-row shortcuts to view an
employee's idea/reward detail page, change their department inline, or
delete them. This is the "Manage organisation members" list screen —
admin and manager roles get the full action set (view detail, change
department, delete); other authenticated roles (if they can reach the
route at all) see the table without the view/detail affordance since
`onRowClick` and the view (`EyeIcon`) button are both gated on
`role === "admin" || role === "manager"`.

No route-level guard is visible in this file itself (gating happens at
row-action level, presumably backed by a router-level role guard
elsewhere) — this file trusts `useAuthStore().role` for per-action
visibility only.

## Layout

Standard `Shell`-framed list page:

- `Shell` renders the page chrome: `title`/`subTitle` from i18n
  (`people.employeesTitle` / `people.employeesSubTitle`), `showSearch={false}`
  (the generic Shell header search is suppressed in favor of a local
  search bar), `contentClass="page-wide"` (wider content-area cap than the
  default `page` class — see `Shell` in
  `.ai-design-dna/13_COMPONENT_CATALOG/shell.md`), and an `actions` slot in
  the header holding the screen's own toolbar.
- **Header toolbar** (`actions` prop): a 300px-wide `SearchBar` followed by
  a 200px-wide department-filter `Dropdown` (clearable, "All departments"
  as the empty option), laid out left-to-right by `Shell`'s own header
  flex row.
- **Body**: a single `DataTable` (named component; see
  `.ai-design-dna/13_COMPONENT_CATALOG/data-table.md`) inside a
  `flex-1 min-h-0` wrapper so the table fills remaining vertical space
  under the header — the `fullHeight` table pattern (sticky header,
  internal scroll, server-driven pagination footer).
- **Floating department picker**: a `createPortal`-rendered dropdown menu
  (portaled to `document.body`, `position: fixed`, `zIndex: 99999`)
  anchored to the clicked row's inline edit button via a manually computed
  `{ top, left }` rect. This is a bespoke lightweight menu, not the shared
  `Menu`/`Dropdown` component — closes on outside click (manual
  `mousedown` listener) or on successful department assignment.

No tabs, no secondary panel — this is a flat, single-table list screen.

## Hierarchy

1. Shell title/subtitle (page identity) — top-left.
2. Header toolbar (search, then department filter) — top-right, same row
   as title via `Shell`'s header layout.
3. Table column order establishes reading priority: Employee (avatar +
   name) → Email → Department (+ inline edit affordance) → Idea count →
   Points balance → Actions (view, delete).
4. Row-level actions are the lowest-priority, right-aligned, and mostly
   hidden until hover/interaction (department edit pencil is
   opacity-0 → opacity-100 on `group/dept` hover; view/delete buttons are
   always visible but small, `w-8 h-8`).

## Spacing

- Table wrapper: `flex-1 min-h-0` (no extra margin — `DataTable`'s own
  container supplies border/radius/background per its catalog entry).
- Row cell content: `gap-3` between avatar and name in the Employee
  column, `gap-1.5` between department label and its edit-pencil button.
- Action cell buttons: `gap-1.5` between the view and delete buttons, each
  a fixed `w-8 h-8` square hit target.
- Header toolbar: `SearchBar` fixed at `w-[300px]`, department `Dropdown`
  wrapped in a `w-[200px]` div — both fixed-width, not flex-grown, so the
  toolbar doesn't stretch to fill the header.
- Floating dept-picker menu items: `px-3 py-[9px]` per row, `py-1` on the
  outer menu container, `minWidth: 200` inline.

## Typography

- Employee name cell: `font-medium text-[13.5px] text-text` (matches the
  `body`-scale weight bump used for primary row text elsewhere in the
  app).
- Email / department / idea-count / points cells: `text-[12px] text-text`
  — a size step below the name, used for all "secondary fact" columns.
  Department value additionally gets `capitalize`.
- Dept-picker menu item text: `text-[13px] text-text`; the "no departments
  available" empty line is `text-[13px] text-[#374151]` (a literal gray
  value rather than a text-color token — worth normalizing later).
- Header title/subtitle typography is owned by `Shell`, not this file.

## Components used

- `Shell` (page chrome, header, title/subtitle/actions slot)
- `DataTable` (the table itself — manual/server pagination mode)
- `SearchBar` (local header search input)
- `Dropdown` (department filter; also reused as the page-size control
  inside `DataTable` itself)
- `Avatar` (32px, employee row identity)
- Icon set: `EditIcon` (dept change trigger), `EyeIcon` (view detail),
  `TrashIcon` (delete), `CheckIcon` (selected-department checkmark in the
  floating menu)
- A bespoke, file-local floating menu (via `createPortal`) for the
  department picker — not a shared `Menu`/`Dropdown` instance.

## Interaction

- **Search**: local `localQ` state updates the input immediately
  (controlled), but the actual query param (`searchQ`) is debounced 400ms
  via a `setTimeout` ref before triggering a refetch — avoids a
  network request per keystroke. Search also resets `currentPage` to 1
  immediately (not debounced) so pagination doesn't strand the user on a
  stale page.
- **Department filter**: `Dropdown` selection also resets `currentPage`
  to 1. Options are built from a separate `/departments` query
  (`staleTime: 5 * 60_000`, cached 5 minutes) with an "All departments"
  synthetic option prepended.
- **Server-side pagination**: `useQuery` keyed on
  `["employees", currentPage, pageSize, searchQ, selectedDept]`, using
  TanStack Query's `placeholderData: keepPreviousData` so the table shows
  the previous page's rows (with an overlay spinner via `DataTable`'s
  `isLoading` prop) rather than flashing empty during a page/filter
  change. `staleTime: 0` — always refetches on key change, no caching
  window.
- **Inline department reassignment**: clicking the pencil icon next to a
  department value opens the bespoke floating menu anchored to that
  button's screen position (`getBoundingClientRect`); selecting a
  department calls a `PATCH /employees/:id/assign-department` mutation
  and, on success, invalidates the `employees` query and closes the menu.
  A checkmark (`CheckIcon`) marks the employee's current department in
  the list. The menu is disabled (all buttons) while the mutation is
  pending, and closes on outside click.
- **Row click → detail navigation**: `onRowClick` on `DataTable` is only
  wired for `admin`/`manager` roles, navigating to `/employees/:id` (also
  passing the row's data via router `state` as a hydration shortcut,
  presumably to avoid a loading flash on the detail screen).
- **View action button**: functionally identical to row-click
  navigation (`navigate(/employees/:id)`) but without the `state` payload
  — a redundant but explicit affordance, also gated to admin/manager, and
  stops propagation so it doesn't double-fire the row click.
- **Delete action**: does not do the delete inline — calls
  `openModal("delete-employee", { employee: row.original })`, deferring
  to the app's global modal-registry pattern (`useUiStore`) rather than a
  local confirmation dialog owned by this screen.
- No bulk/multi-select actions, no column sorting, no export.

## Accessibility

- Row-action buttons use `title` attributes for tooltips (view: "tooltip
  ViewIdeas", delete: "tooltipDeleteEmployee", dept-edit: "tooltip
  ChangeDepartment") — the only accessible-name mechanism for these
  icon-only buttons; no `aria-label` duplicate, so screen-reader support
  relies entirely on `title`, which is a weaker affordance (no reliable
  SR announcement, hover-only visual tooltip).
- The department-edit pencil is `opacity-0` by default and only reachable
  via `group-hover/dept:opacity-100` — a hover-only reveal with no
  keyboard-focus equivalent (`focus-within`/`:focus-visible` variant is
  absent), meaning keyboard-only users cannot see the affordance appear
  even though the underlying `<button>` remains in the tab order and
  clickable.
- Floating department-picker menu is a plain `<div>`/`<button>` stack, not
  built on the shared `Menu` primitive — no `role="menu"`, no arrow-key
  navigation, no focus trap; closes only on outside `mousedown` (no Escape
  handler observed).
- Delete/view buttons meet a reasonable `32px` (`w-8 h-8`) touch target.
- No explicit `aria-live` region for search-result count changes; the
  count is only visible via `DataTable`'s own "Showing X to Y of Z"
  pagination text.

## Data density

Six columns (Employee, Email, Department, Idea count, Balance, Actions)
in a `fullHeight`, server-paginated table — a dense, scan-oriented list
view consistent with the app's other `DataTable` screens (Rewards,
Departments, Invites). Row content is deliberately terse: single-line
name, single-line email/department/counts, no secondary metadata row,
no avatars beyond the 32px identity avatar. This is the densest of the
two People screens — the detail screen trades density for a dashboard
layout.

## Reusable ideas

- The **debounced-search-but-instant-page-reset** pattern (local state
  updates the input synchronously; a ref-held timeout updates the actual
  query param; page index resets synchronously alongside the input, not
  the debounced value) is a clean, reusable shape for any other
  server-paginated search+filter screen.
- **`keepPreviousData` + `DataTable`'s own `isLoading` overlay** together
  give a stale-while-revalidate page transition without a full-screen
  loading state — worth carrying to any future manual-pagination table.
- The **anchored floating-menu-via-portal** pattern (compute
  `getBoundingClientRect()` on click, portal a fixed-position menu to
  `document.body`) is reusable for any "inline reassign from a table row"
  interaction, though it should ideally be promoted to a shared primitive
  rather than re-implemented per screen (compare to the shared `Menu`
  component in the catalog, which this screen does not use).

## Legacy import paths flagged

- `import { SearchBar } from "@/components/modal/SearchBar";` — path
  under legacy `src/components/*` rather than `src/shared/*`. Note: there
  is no duplicate `SearchBar` under `src/shared/components/modal/`, and
  even the canonical `Shell` component itself imports `SearchBar` from
  this same `@/components/modal/SearchBar` path — so this is a
  **misplaced-canonical** situation (the file's location just hasn't been
  migrated under `src/shared/`), not a case of an actively-superseded
  duplicate. Treat as a location smell, not a "stop using this" flag.
- `import { DataTable } from "@/components/shared/DataTable";` — same
  misplaced-canonical situation, already documented in
  `.ai-design-dna/13_COMPONENT_CATALOG/data-table.md` ("File path & path
  inconsistency" section): `DataTable` is the single canonical table
  component for the whole app; only its file location under
  `src/components/shared/` is inconsistent with the `src/shared/*`
  convention used everywhere else. Do not confuse with genuinely
  superseded legacy files like `src/components/ui/index.tsx`.
- All other imports in this file (`Dropdown`, `Avatar`, icon set,
  `authStore`, `uiStore`, `httpService`, `constants`) already resolve to
  canonical `@/shared/*` or app-level paths — no genuinely-superseded
  duplicate import was found in `EmployeesScreen.tsx`.
