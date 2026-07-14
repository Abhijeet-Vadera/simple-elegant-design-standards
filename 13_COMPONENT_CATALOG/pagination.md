# Pagination

## Status flag (read first)

`Pagination` is defined in the canonical primitives file but **has zero call sites anywhere in `src/`** as of this audit. Verified by:

```
grep -rn "<Pagination" src --include="*.tsx"          # → no results
grep -rn "import {[^}]*\bPagination\b[^}]*} from \"@/shared/components/ui\"" src --include="*.tsx"   # → no results
```

A byte-identical copy also exists in the superseded legacy file `src/components/ui/index.tsx:509` (documented in `.ai-design-dna/12_DESIGN_TOKENS/components.json` as `legacyDoNotUse`). Both copies are dormant. The actual pagination UI shipped to users lives inline inside `src/components/shared/DataTable.tsx` (its `showPagination` footer, lines ~222–300+) and looks nothing like this component — it has a page-size `Dropdown`, numbered page buttons, and first/prev/next/last icon buttons, not a `Prev`/`Next`-only bar. Treat `Pagination` as a **legacy/unfinished primitive**, not a pattern to imitate for new paginated UI — copy `DataTable`'s footer instead.

## Purpose

A minimal, generic "Prev / Next" pager footer intended to sit under any list or table: shows a compact total-count summary on the left and two `Button`s on the right, disabling each button at the natural boundary (page 1, last page).

## File / exports / prop signature

File: `src/shared/components/ui/index.tsx` (lines ~1639–1684).

```ts
export function Pagination({
  page,
  total,
  perPage,
  onChange,
}: {
  page: number;       // 1-based current page
  total: number;       // total item count across all pages
  perPage: number;     // items per page, used to derive totalPages
  onChange: (p: number) => void;   // called with the target page number
}): JSX.Element
```

`totalPages` is derived internally: `Math.max(1, Math.ceil(total / perPage))` — never rendered as 0, always at least 1.

## Exact styling

```tsx
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 18px",
    borderTop: "1px solid #E5E7EB",   // border.default token, matches DataTable's `border-t border-border`
    background: "#FCFCFB",             // same literal DataTable's footer uses (`bg-[#FCFCFB]`) — a warm off-white,
                                        // NOT one of the named tokens in 02_DESIGN_DNA.json (closest is canvas #F7F7F5)
  }}
>
  <span style={{ fontSize: 12.5, color: "#6B7280" }}>   {/* text.secondary token */}
    {total} total · page {page} of {totalPages}
  </span>
  <div style={{ display: "flex", gap: 8 }}>
    <Button size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Prev</Button>
    <Button size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</Button>
  </div>
</div>
```

Text pattern (exact, not localized — this component has no `t()`/i18n call, unlike `DataTable`'s footer which uses `t("dataTable.showingEntries", ...)`):

```
{total} total · page {page} of {totalPages}
```

Uses a middle-dot separator (`·`, U+00B7), `fontSize: 12.5` (matches `typography.scale.label` size 12.5px but at weight 400, not 500), color `#6B7280`.

Buttons are `Button` primitive at `size="sm"` (32px / `h-8`, per `.ai-design-dna/02_DESIGN_DNA.json` `components.controlHeights.buttonSm`), disabled via the boundary checks rather than hiding the button.

## Usage rules

- Because this component is unused, there is no established call-site precedent for it. If a future task asks to paginate a *simple* list (not a `DataTable`-backed table), `Pagination` is structurally appropriate to reach for — but be aware it is **not localized** (hardcoded English "total"/"page"/"of") while every other list/table surface in the app routes copy through `react-i18next`'s `t()`. Wrap the text in `t()` before shipping a new call site; don't copy the hardcoded string as-is.
- For anything table-shaped (uses `@tanstack/react-table` via `DataTable`), use `DataTable`'s built-in `showPagination`/`manualPagination`/`pageCount`/`totalCount` props instead of bolting `Pagination` onto it — that is the actual, exercised pagination system (`src/features/people/container/InvitesScreen.tsx:370`, `src/features/people/container/EmployeesScreen.tsx:323`, `src/features/rewards/container/RewardsScreen.tsx:446`, `src/features/departments/container/DepartmentsScreen.tsx:656`).
- Do not maintain or extend the legacy duplicate in `src/components/ui/index.tsx:509` — it is flagged codebase-wide as `legacyDoNotUse`.

## Real call-site examples

None exist for the `Pagination` component. The equivalent real, shipped pattern is `DataTable`'s inline footer, `src/components/shared/DataTable.tsx:222-224`:

```tsx
{showPagination && (data.length > 0 || isLoading || total > 0) && (
  <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-[#FCFCFB]">
    ...
    <span>{t("dataTable.showingEntries", "Showing {{start}} to {{end}} of {{total}} entries", { start: startItem, end: endItem, total })}</span>
    ...
```

Consuming screens: `src/features/people/container/InvitesScreen.tsx:370` (`showPagination={true}`, `manualPagination={true}`), `src/features/people/container/EmployeesScreen.tsx:323,326`, `src/features/rewards/container/RewardsScreen.tsx:446-447`, `src/features/departments/container/DepartmentsScreen.tsx:656`.

## Anti-patterns

- Do not treat `border-top #E5E7EB` + `background #FCFCFB` + "N total · page X of Y" as "the" pagination footer pattern to copy without checking — the pattern actually shipped in the app (`DataTable`'s footer) uses a different copy string (`"Showing {{start}} to {{end}} of {{total}} entries"`), a page-size `Dropdown`, and numbered page buttons, not a bare Prev/Next pair. If matching visual consistency with the rest of the app, model new pagination UI on `DataTable`'s footer, not on this component.
- Do not add a third copy of this same "Prev/Next total-count bar" pattern elsewhere in the codebase; there are already two idle copies (`shared` and legacy `components/ui`) plus one divergent, live implementation in `DataTable`. Consolidate rather than triplicate.
- Do not ship this component's hardcoded English text without wrapping it in `t()` — every other list/pagination surface in the app is localized.
