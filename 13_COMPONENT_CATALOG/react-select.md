# ReactSelect

## Status flag (read first)

`ReactSelect` is defined in the canonical primitives file but **has zero call sites anywhere in `src/`** as of this audit. Verified by:

```
grep -rn "ReactSelect" src --include="*.tsx" --include="*.ts" | grep -v "src/shared/components/ui/index.tsx"
# → only Dropdown.tsx's unrelated `ReactSelectLib` import matches; no <ReactSelect ...> JSX anywhere
grep -rn "import {[^}]*\bReactSelect\b[^}]*} from \"@/shared/components/ui\"" src --include="*.tsx"
# → no results
```

Treat this component as **dormant/legacy-in-place**, superseded in practice by `Dropdown` (`src/shared/components/ui/Dropdown.tsx`), which wraps the same `react-select` library directly and is the component every feature screen actually imports (17 call sites, see Usage Rules below). Do not add new call sites to `ReactSelect` — extend `Dropdown` instead, unless a future task explicitly revives this component.

## Purpose

A single-select wrapper around the `react-select` library (`react-select`'s default export, imported as `ReactSelectLib`), pre-configured with the system's control styling so callers don't have to pass a `customStyles` object every time. It is a narrower, less-configurable sibling of `Dropdown` — no multi-select, no `formatOptionLabel`, no custom `components` override, no `menuPlacement` control.

## File / exports / prop signature

File: `src/shared/components/ui/index.tsx` (lines ~1529–1637).

```ts
export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
}

interface ReactSelectProps<V extends string = string> {
  options: SelectOption<V>[];
  value: V | null | undefined;
  onChange: (value: V | null) => void;
  placeholder?: string;      // default "Select…"
  error?: boolean;
  isDisabled?: boolean;
  isSearchable?: boolean;    // default false
  isClearable?: boolean;     // default false
  isLoading?: boolean;       // default false
  width?: number | string;
}

export function ReactSelect<V extends string = string>(props: ReactSelectProps<V>): JSX.Element
```

Note the `onChange` contract: it receives the bare `value` (`V | null`), not a react-select `Option` object — `ReactSelect` derives `selected` internally via `options.find((o) => o.value === value) ?? null` and unwraps `opt ? opt.value : null` in the `onChange` callback. This is a deliberate ergonomic difference from `Dropdown`, whose `onChange` passes through the raw `OnChangeValue<OptionType, IsMulti>` (the full option object).

Re-exported from the barrel `src/shared/components/ui/index.tsx` (it's defined there directly, not re-exported from a satellite file, unlike `DocumentIcon`/`Tooltip`/`Dropdown`).

## Exact styling — `customStyles` object (react-select `StylesConfig<Opt, false, GroupBase<Opt>>`)

```ts
control: (base, state) => ({
  ...base,
  minHeight: 40,                              // matches shared input height token (surfaces.input = 40px)
  minWidth: width ?? "100%",
  border: error
    ? "1px solid #EF4444"                     // errorTextAlt token
    : state.isFocused
      ? "1px solid #0A0A0A"                   // ink token
      : "1px solid #E5E7EB",                  // border.default token
  borderRadius: 8,                            // radius.sm / componentSpecific.input
  boxShadow: state.isFocused ? "0 0 0 3px rgba(10,10,10,0.06)" : "none",  // shadow.focusRing token
  fontSize: 13.5,                             // typography.scale.body
  cursor: isDisabled ? "not-allowed" : "pointer",
  background: isDisabled ? "#F9FAFB" : "#fff",
  "&:hover": { borderColor: state.isFocused ? "#0A0A0A" : "#D1D5DB" },   // border.strong on hover
}),
option: (base, state) => ({
  ...base,
  fontSize: 13.5,
  background: state.isSelected ? "#0A0A0A" : state.isFocused ? "#F3F4F6" : "#fff",  // ink / hoverSurface
  color: state.isSelected ? "#fff" : "#111827",   // textDarkHeading on unselected rows
  cursor: "pointer",
}),
menu: (base) => ({
  ...base,
  borderRadius: 8,
  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",   // NOTE: pure-black shadow tint, not the ink-tinted rgba(10,10,10,α)
                                              // convention documented in 02_DESIGN_DNA.json shadow.tint — an
                                              // inconsistency, flag but do not silently "fix" when touching this file.
  zIndex: 9999,
}),
menuPortal: (base) => ({ ...base, zIndex: 9999 }),   // == zIndex.reactSelectMenuPortal token
singleValue: (base) => ({ ...base, fontSize: 13.5, color: "#111827" }),
placeholder: (base) => ({
  ...base,
  fontSize: 13.5,
  color: "#9CA3AF",                          // text.tertiary token
  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
}),
indicatorSeparator: () => ({ display: "none" }),
clearIndicator: (base) => ({ ...base, padding: "0 4px", color: "#9CA3AF", "&:hover": { color: "#4B5563" }, "& svg": { width: 13, height: 13 } }),
dropdownIndicator: (base) => ({ ...base, padding: "0 8px", color: "#6B7280", "& svg": { width: 14, height: 14 } }),
```

Rendering:

```tsx
<ReactSelectLib<Opt, false, GroupBase<Opt>>
  options={options}
  value={selected}
  onChange={(opt) => onChange(opt ? opt.value : null)}
  styles={customStyles}
  placeholder={placeholder}
  isDisabled={isDisabled}
  isLoading={isLoading}
  isSearchable={isSearchable}
  isClearable={isClearable}
  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
/>
```

The `menu` is always portaled to `document.body` (guarded with a `typeof document !== "undefined"` SSR check) and both `menu` and `menuPortal` are pinned to `zIndex: 9999` — this is the single highest z-index literal in the codebase (see `.ai-design-dna/12_DESIGN_TOKENS/zindex.json`: `reactSelectMenuPortal: 9999`, above `modalOverlay`/`drawerOverlay` at 100 and `dropdownMenu` at 40), specifically so the floating menu escapes any local stacking context (a modal, a sticky table header, etc.).

`Dropdown` (the component actually used app-wide) replicates this exact same portal-to-`document.body` + `zIndex: 9999` pattern — confirm this when building any new react-select-based control.

## Usage rules — Select (native) vs ReactSelect vs Dropdown

| Component | File | Actual adoption | When it is "correct" to reach for it |
|---|---|---|---|
| `Select` (native `<select>` wrapper) | `src/shared/components/ui/index.tsx:469` | **0 call sites** in feature code — confirmed dormant, same as `ReactSelect` | Would be appropriate for a short, static, non-searchable option list where a native OS picker is acceptable and bundle-size / accessibility of a plain `<select>` is preferred over `react-select`. Not currently exercised anywhere, so there is no in-repo precedent to copy. |
| `ReactSelect` | `src/shared/components/ui/index.tsx:1548` | **0 call sites** | On paper: single-select, no multi-select, simpler API (bare-value `onChange`) than `Dropdown`. In practice, nothing in the app uses it — `Dropdown` won this role. |
| `Dropdown` | `src/shared/components/ui/Dropdown.tsx:170` | **17 call sites** across `MentionInput`, `AssignDropdown`, `DataTable` (page-size picker), `StageEvaluationForm`, `DynamicStageQuestionnaires`, `CreateIdeaScreen`, `KanbanScreen`, `StageFormModal`, `EvaluationFormBuilder`, `EmployeesScreen`, `SessionListPanel` | **This is the component to use for all new select/combobox UI.** Supports `isMulti`, `formatOptionLabel`, `getOptionLabel`/`getOptionValue`, custom `components`, `menuPlacement`/`menuPosition`, and a `selectProps` escape hatch — a strict superset of what `ReactSelect` offers. |

Practical rule for a future AI: when asked to add a select/combobox control, **use `Dropdown`, not `ReactSelect` and not `Select`.** `ReactSelect` should only be touched if explicitly asked to revive/simplify it, and even then, prefer folding its `customStyles` object into `Dropdown`'s default styling rather than growing a second parallel select primitive.

## Real call-site examples

None exist for `ReactSelect` itself. For contrast, a real `Dropdown` call site (the pattern that plays the role `ReactSelect` was presumably designed for):

`src/components/shared/DataTable.tsx:233` (page-size picker in the table footer):
```tsx
<Dropdown<{ label: string; value: string }>
  value={{ label: String(currentPageSize), value: String(currentPageSize) }}
  onChange={(val) => { ... table.setPageSize(newSize) ... }}
  isDisabled={isLoading}
  options={[{ label: "10", value: "10" }, { label: "20", value: "20" }, { label: "30", value: "30" }, { label: "50", value: "50" }]}
  menuPlacement="top"
/>
```

## Anti-patterns

- Do not import `ReactSelect` for new work — it has no live precedent to model against, and any bug in it would go unnoticed by existing tests/usages. Use `Dropdown`.
- Do not hand-roll a third `customStyles` object elsewhere in the app that duplicates this control/option/menu styling; if a new react-select-based control is needed outside `Dropdown`'s prop surface, extend `Dropdown`, don't fork `ReactSelect`'s styles into a new file.
- Do not change the `menu`/`menuPortal` z-index below `9999` or remove the `document.body` portal target — both exist specifically to defeat local stacking contexts (modals, sticky headers); lowering it will cause the menu to render underneath the very modal it's inside.
- The `menu` box-shadow (`0 4px 16px rgba(0,0,0,0.1)`) uses a pure-black tint, inconsistent with the rest of the app's ink-tinted `rgba(10,10,10,α)` shadow convention (see `.ai-design-dna/12_DESIGN_TOKENS/shadows.json`). Don't propagate this exact rgba if writing new shadow rules elsewhere — use the ink-tinted convention instead.
