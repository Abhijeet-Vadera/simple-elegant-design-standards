# DataTable

## Purpose

The single, canonical data-grid component for the application. Wraps
`@tanstack/react-table` (`useReactTable`) to render a styled `<table>` with
optional client-side or server-side ("manual") pagination, a loading
skeleton, an empty state, and a page-size dropdown. Every list/table screen
in the app (People, Rewards, Departments, and chart drill-down modals) is
built on this one component — there is no second table implementation.

## File path & path inconsistency (flag)

- **Actual path:** `src/components/shared/DataTable.tsx`
- **Expected canonical path (per project convention):** `src/shared/components/...`

This is the only shared, cross-feature UI building block in the codebase
that lives under `src/components/shared/` instead of `src/shared/`. Every
other canonical primitive lives under `src/shared/components/ui/*`
(Button, Badge, Dropdown, Modal, etc. — see
`.ai-design-dna/02_DESIGN_DNA.json → components.canonicalFile`). `DataTable`
is the sole exception to that layout rule.

**This is a location smell worth fixing (move to
`src/shared/components/DataTable.tsx` in a future cleanup), but it is NOT a
"legacy, avoid" component.** It is actively maintained, imported by every
list screen below, and is the correct component to reach for today when a
new tabular screen is needed. Do not confuse this path with
`src/components/ui/index.tsx`, which genuinely IS flagged elsewhere in the
token set as `legacyDoNotUse` (a superseded 521-line subset of
`src/shared/components/ui/index.tsx`) — `DataTable.tsx` is a different case:
misplaced, not superseded.

## Exports & prop signature

Single named export, generic over the row type:

```ts
export function DataTable<TData>(props: DataTableProps<TData>): JSX.Element

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;                          // default: "No data found."
  showPagination?: boolean;                        // default: false
  pageSize?: number;                                // default: 10
  fullHeight?: boolean;                             // default: false
  footerSlot?: ReactNode;
  manualPagination?: boolean;                       // default: false — server-side pagination switch
  pageIndex?: number;                               // 0-based; required when manualPagination
  pageCount?: number;                               // total pages from server; required when manualPagination
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  totalCount?: number;                              // total item count across all pages (manual mode "Showing X to Y of Z")
  isLoading?: boolean;                              // default: false
}
```

Internal dependencies: `Dropdown` from `@/shared/components/ui/Dropdown`
(page-size selector) and `react-i18next` `useTranslation` (all in-component
copy is translated via `t("dataTable.*", "<fallback>")` keys).

## Columns & pagination — client vs. manual

- **Columns**: consumer passes a `ColumnDef<TData, unknown>[]` straight
  through to `useReactTable`; `DataTable` does no column transformation.
  Header/cell rendering uses `flexRender` from tanstack, so columns can
  supply React nodes for `header`/`cell`.
- **Client-side pagination** (default when `showPagination` is true and
  `manualPagination` is false/omitted): `getPaginationRowModel()` is passed
  to `useReactTable`, and `initialState.pagination.pageSize` seeds the page
  size. Tanstack owns `pageIndex`/`pageSize` state internally. Used by
  DepartmentsScreen and IdeasByDepartmentModal (see call sites below).
- **Manual (server-side) pagination** (`manualPagination={true}`): the
  table is told `manualPagination: true`, `pageCount: pageCount ?? -1`, and
  its `state.pagination` is driven externally via the `pageIndex`/`pageSize`
  props — `getPaginationRowModel` is NOT attached in this mode
  (`showPagination && !manualPagination` gate). `onPaginationChange` calls
  back to the consumer's `onPageChange` with the new 0-based index; the
  consumer owns the actual page-index/page-size state and refetches data.
  `totalCount` must be supplied for an accurate "Showing X to Y of Z"
  string. `autoResetPageIndex: false` is set globally so refetches/data
  updates don't silently reset the page back to 0.

## Loading skeleton & empty state

- **Loading with existing rows** (`isLoading && data.length > 0`): an
  absolute-positioned overlay (`inset-0 top-[40px] z-20`,
  `bg-white/50 backdrop-blur-[1px]`) sits over the table body showing a
  small spinner pill (`w-4 h-4 border-2 border-gray-200 border-t-gray-800
  rounded-full animate-spin`) plus the `dataTable.loading` / "Loading..."
  string, so the previous page's rows stay visible underneath while a new
  page loads.
- **Loading with no rows yet** (`isLoading && rows.length === 0`): renders
  `Math.min(pageSize, 5)` skeleton `<tr>`s, each cell a pulsing gray bar
  (`h-[18px] bg-gray-100 rounded animate-pulse`), width varied by column
  position — first column `w-3/4`, last column `w-8`, all others `w-1/2` —
  to approximate real column width distribution.
- **Empty state** (no rows, not loading): a single centered cell,
  `colSpan={columns.length}`, `text-center py-12 text-[13px] text-text-3
  h-[200px]`, showing `emptyMessage` (default `"No data found."`, but every
  call site overrides it with a translated, context-specific message).

## Page-size selector (Dropdown usage)

The "Show N entries" control is a `Dropdown<{ label: string; value: string
}>` (the shared `Dropdown` component), not a native `<select>`:

- Fixed options: `[{10},{20},{30},{50}]` (label/value both the stringified
  number) — this is the only page-size list in the app; it is not
  configurable per call site.
- `value` is derived from `table.getState().pagination.pageSize`.
- `onChange` calls `table.setPageSize(newSize)` directly and, if provided,
  the consumer's `onPageSizeChange(newSize)` — so in manual-pagination mode
  the consumer must reset its own page index (every real call site below
  does `setCurrentPage(1)` / `setPage(1)` in that callback).
- `isDisabled={isLoading}` — disabled while a fetch is in flight.
- `menuPlacement="top"` — the dropdown opens upward since it sits in the
  table's footer bar at the bottom of the viewport.
- Wrapped in a fixed `w-[60px]` container.

## `footerSlot` prop

Optional `ReactNode` rendered in its own `border-t border-border` wrapper
directly beneath the `<table>` and above the pagination bar. Lets a
consumer inject custom footer content (e.g. bulk-action bar, totals row)
without forking the component. None of the four in-repo call sites
currently use it, but it is part of the public contract.

## Styling (exact values from source)

- **Outer container**: `bg-white border border-border rounded overflow-hidden
  relative`; with `fullHeight`, adds `flex flex-col h-full` and the inner
  scroll wrapper gets `overflow-auto flex-1 min-h-0
  [scrollbar-gutter:stable]`.
- **Table**: `w-full border-collapse` (no per-cell border-spacing; all row
  separation is via `border-b`).
- **Header row (`<th>`)**: `text-left text-[11px] tracking-[0.1em] uppercase
  text-text font-semibold border-b border-border px-4 py-3 whitespace-nowrap
  bg-[#F9FAFB]`; with `fullHeight` also gets `sticky top-0 z-10`. The
  `#F9FAFB` header background is a one-off value not present in the shared
  color tokens (`.ai-design-dna/12_DESIGN_TOKENS/colors.json` /
  `semantic-colors.json`) — closest documented neighbor is `hoverSurface
  #F3F4F6`; treat `#F9FAFB` as this component's own header tint, not a
  cross-component token.
- **Column width**: only applied via inline `style.width` when
  `header.column.getSize() !== 150` (150 is tanstack's default column
  size) — i.e. width is only set when a column explicitly overrides the
  default size; unset columns flow naturally.
- **Body row (`<tr>`)**: `border-b border-border last:border-b-0
  transition-colors`; when `onRowClick` is supplied, adds `cursor-pointer
  hover:bg-[#F5F5F3]` (a warm off-white hover tint, distinct from the
  `rowHoverTint #FAFAF9` token documented for `IdeaRow` in
  `02_DESIGN_DNA.json` — another small ad hoc value worth normalizing
  later).
- **Body cell (`<td>`)**: `px-4 py-3` (skeleton cells use `px-4 py-4`,
  slightly taller than real rows).
- **Row height**: not fixed by an explicit height utility — it's the
  product of `py-3` (12px) cell padding plus content line-height, so actual
  row height depends on cell content/font (13.5px `body` scale per
  `02_DESIGN_DNA.json → typography.scale.body`).
- **Empty/loading text color**: `text-text-3` (`#9CA3AF` per
  `colors.json`/`semantic-colors.json` `textTertiary`).
- **Pagination bar**: `flex items-center justify-between px-6 py-3.5
  border-t border-border bg-[#FCFCFB]` — yet another distinct near-white
  tint (not `card #FFFFFF`, not `canvas #F7F7F5`, not header `#F9FAFB`).
  Left cluster text: `text-[12.5px] text-text-2 font-medium` (matches the
  `label` scale's 12.5px size but uses `text-2` gray rather than the
  label token's implied weight/color — component-local choice). A `w-[1px]
  h-3.5 bg-border` vertical divider separates the "Showing…" string from
  the "Show N entries" control.
- **Pagination buttons**: `w-8 h-8 rounded-[6px] border border-border
  text-text-2 bg-white hover:bg-gray-50 disabled:opacity-40
  disabled:cursor-not-allowed transition-colors` for nav arrows; the
  active page number button is inverted: `bg-[#111827] text-white
  border border-[#111827]` (stock gray-900, matching the
  `textDarkHeading #111827` token documented for "dense tables" in
  `02_DESIGN_DNA.json`), inactive page numbers use the same border/bg-white
  treatment as the arrow buttons. Up to 5 page numbers are shown at a time
  (`getPageNumbers`, `maxPages = 5`), windowed around the current page.
- **Icons**: nav chevrons are inline one-off SVGs local to this file
  (`ChevronLeft/Right`, `DoubleChevronLeft/Right`, 14×14 viewBox, `stroke
  strokeWidth="1.5"`) rather than pulled from the canonical icon set at
  `src/shared/components/ui/Icons.tsx` — worth reconciling with the
  documented icon system (`.ai-design-dna/12_DESIGN_TOKENS/icons.json`)
  eventually, but not a blocker for using this component.
- **Loading spinner** (overlay variant): CSS `animate-spin` (Tailwind
  default 1s), matching the documented
  `motion.spinner.cssAnimateSpin` convention ("used for skeleton/table
  loading") in `02_DESIGN_DNA.json`.

## Usage rules

1. **This is the one canonical table component.** If a screen
   needs tabular data with sorting-free columns, pagination, row click,
   loading, and empty states, use `DataTable` — do not hand-roll a second
   `<table>` or wrap `useReactTable` again elsewhere.
2. Pick pagination mode deliberately: use `manualPagination` whenever the
   list is server-paginated (the common case for anything backed by a
   paged API — People, Rewards, Invites all do this); omit it (client-side)
   only for small, fully-loaded datasets (Departments, the
   IdeasByDepartmentModal drill-down).
3. When using `manualPagination` with `onPageSizeChange`, always reset the
   external page index to 1/0 in that callback — every real call site does
   this; skipping it can leave the UI requesting an out-of-range page.
4. Always pass a translated, context-specific `emptyMessage` — do not rely
   on the generic `"No data found."` default in production screens.
5. Use `fullHeight` for any table that should fill its scroll container
   (sticky header, internal scroll) — this is the pattern used by every
   full-page list screen (People, Rewards, Departments); omit it for
   in-modal tables that should size to content (`IdeasByDepartmentModal`).
6. Column sizing should only be set on `ColumnDef.size` when a column
   genuinely needs a fixed width — the component only honors sizes that
   differ from tanstack's 150px default, so setting `size: 150` explicitly
   is a no-op and misleading.

## Real call sites

- `src/features/people/container/EmployeesScreen.tsx:313` — manual
  pagination, `pageIndex={currentPage - 1}`, `pageCount={totalPages}`,
  `totalCount`, `onPageChange`/`onPageSizeChange` both wired,
  role-conditional `onRowClick` (only admin/manager rows navigate to
  `/employees/:id`), `fullHeight`.
- `src/features/people/container/InvitesScreen.tsx:365` — manual
  pagination with local `pageSize`/`page` state, `onPageSizeChange` resets
  `setPage(1)`, `fullHeight`; only rendered in the non-empty branch (a
  separate `EmptyState` component handles the zero-invites case upstream of
  `DataTable`, rather than relying on `DataTable`'s own empty state).
- `src/features/rewards/container/RewardsScreen.tsx:441` — manual
  pagination, `pageCount={Math.ceil(total / PAGE_SIZE)}` computed inline
  rather than coming straight from an API response field, `fullHeight`, no
  `onPageSizeChange` (page size fixed at `PAGE_SIZE`).
- `src/features/departments/container/DepartmentsScreen.tsx:651` —
  client-side pagination (`showPagination` only, no `manualPagination`),
  fixed `pageSize={10}`, `fullHeight`, data pre-filtered client-side
  (`data={filtered}`).
- `src/components/shared/charts/IdeasByDepartmentModal.tsx:131` — used
  inside a `Modal`, no pagination at all (`showPagination` omitted/false),
  just `fullHeight` for the scrollable modal body — the minimal-config
  end of the spectrum.
- Also imported by `src/features/people/container/EmployeeDetailScreen.tsx:350`.

Note: no usage was found under `src/features/ideas/**` — the Ideas list
screens in this codebase use the `IdeaRow` primitive (see
`02_DESIGN_DNA.json → components.primitiveList`) rather than `DataTable`,
so "Ideas" is not a `DataTable` call site in the current code.

## Anti-patterns

- Do not build a second table/grid component (e.g. a bespoke `<table>` in
  a feature folder, or a second `useReactTable` wrapper) — extend
  `DataTable`'s props if a screen needs something it doesn't support yet.
- Do not treat `src/components/shared/DataTable.tsx`'s path as a sign it's
  deprecated — it is not the same situation as
  `src/components/ui/index.tsx` (which IS documented as
  `legacyDoNotUse`). Only the location is inconsistent, not the code.
- Do not set `manualPagination={true}` without also supplying `pageIndex`,
  `pageCount`, and `onPageChange` — the table has no internal fallback
  state for these in manual mode.
- Do not forget to reset the external page index inside
  `onPageSizeChange` when paired with `manualPagination` — the component
  itself only updates its internal tanstack pagination size, not the
  caller's page-index state.
- Do not reach for `#F9FAFB` / `#FCFCFB` / `hover:bg-[#F5F5F3]` as general
  "off-white surface" tokens elsewhere in the app — they are one-off values
  local to this component's header/footer/row-hover treatment, not part of
  the documented surface or color token set
  (`.ai-design-dna/12_DESIGN_TOKENS/surfaces.json`,
  `.ai-design-dna/12_DESIGN_TOKENS/colors.json`).
