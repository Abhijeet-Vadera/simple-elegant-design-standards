# Dropdown

**Category:** Form combobox (react-select wrapper) for choosing a value. NOT an action menu.

## Purpose

`Dropdown` is the system's single-select/multi-select **form control** — a themed wrapper around the `react-select` library used everywhere a user picks a value (or values) from a list of options: filter bars, table page-size pickers, assignee pickers, form questionnaire "select" questions, category/session pickers. It is the `Select`-family control, conceptually a sibling of `Input`/`Textarea`/`Toggle`, not of `Menu`. See "Dropdown vs. Menu" in [`menu.md`](./menu.md) — never conflate the two.

## File & Exports

- File: `src/shared/components/ui/Dropdown.tsx` (full file, 251 lines)
- Exports: `Dropdown` (generic function component), `DropdownOption<V>` interface, `DropdownProps<OptionType, IsMulti>` interface
- Re-exported from the barrel: `src/shared/components/ui/index.tsx` re-exports `Dropdown` from `./Dropdown` (per `02_DESIGN_DNA.json:163`, `components.reExports`) — import it from `@/shared/components/ui`, the concrete implementation file is an internal detail.
- Underlying library: `react-select` (`ReactSelectLib` import, `Dropdown.tsx:2`) — this is a themed/styled pass-through, not a from-scratch combobox.
- Sibling primitive: `ReactSelect` also appears in the barrel's `primitiveList` (`02_DESIGN_DNA.json:162`) — `Dropdown` is the canonical styled wrapper; treat `ReactSelect` references as the same underlying pattern, don't invent a third wrapper.

## Prop Signature

```ts
export interface DropdownProps<
  OptionType extends { value: unknown; label: string },
  IsMulti extends boolean = false,
> {
  value: OptionType | OptionType[] | null | undefined;
  onChange: (value: OnChangeValue<OptionType, IsMulti>) => void;
  options: OptionType[];
  isMulti?: IsMulti;
  placeholder?: ReactNode;
  isDisabled?: boolean;
  isSearchable?: boolean;      // default false
  isClearable?: boolean;
  isLoading?: boolean;
  error?: boolean;
  size?: "sm" | "md";          // default "sm"
  formatOptionLabel?: ...;
  getOptionLabel?: ...;
  getOptionValue?: ...;
  components?: ...;             // react-select component overrides (e.g. custom Option)
  styles?: StylesConfig<...>;   // merged on top of the base styles, not replacing them
  menuPortalTarget?: HTMLElement | null;  // default document.body
  menuPosition?: MenuPosition;  // default "fixed"
  menuPlacement?: MenuPlacement;
  className?: string;
  id?: string;
  name?: string;
  autoFocus?: boolean;
  required?: boolean;
  selectProps?: Record<string, unknown>;  // escape hatch, spread directly onto react-select
}
```
(`Dropdown.tsx:138-168`)

Notable defaults: `isSearchable = false` and `size = "sm"` (`Dropdown.tsx:180,184`) — a plain `<Dropdown>` with no props renders as a non-searchable, small, single-select combobox.

## Variants

### Size: `sm` | `md` (`Dropdown.tsx:19-24`)

| Size | Control height | Font size |
|---|---|---|
| `sm` (default) | `34px` | `13px` |
| `md` | `40px` | `13.5px` |

`md`'s height (`40px`) matches the system-wide generic input height (`surfaces.input.height` / `controlHeights.input` = `40px` in `02_DESIGN_DNA.json:183`/`165`), so use `size="md"` when the dropdown sits inline with `40px`-tall `Input`s in the same form row; `sm` (`34px`) is the default used in filter bars/table toolbars where a slightly denser control reads better.

### Error state: `error?: boolean`

Boolean flag, not a separate visual "variant" family, but changes border color throughout (see Styling below) — border becomes `#EF4444` (the react-select-specific error red, `color.semantic.errorTextAlt` in `02_DESIGN_DNA.json:37`, distinct from the badge-danger red `#B91C1C`).

### Multi vs. single: `isMulti?: boolean`

Changes the rendered value shape (chips via `multiValue`/`multiValueLabel` styles, `Dropdown.tsx:107-117`) and the `value`/`onChange` typing (`OptionType[]` vs `OptionType`), but is not a distinct "look" beyond the chip styling.

## Exact Styling

All styling lives in `createDropdownStyles()` (`Dropdown.tsx:26-119`), a `react-select` `StylesConfig` factory, merged with any caller-supplied `styles` override via `mergeStyles()` (`Dropdown.tsx:121-136`, which composes each style function rather than replacing it — caller overrides layer on top of, not instead of, the base).

**Control (closed field)** (`Dropdown.tsx:32-47`):

| Property | Value |
|---|---|
| height / min-height | size-driven: `34px` (sm) / `40px` (md) |
| font-size | size-driven: `13px` (sm) / `13.5px` (md) |
| font-weight | `500` |
| border-radius | `8px` (matches system's control radius, `02_DESIGN_DNA.json:112` `controls: 6-8px`) |
| border | `1.5px solid` → `#EF4444` if `error`, else `#0A0A0A` if focused, else `#E5E7EB` |
| border on hover | `#D1D5DB` if not error, else stays `#EF4444` |
| box-shadow | `none` (no focus ring glow — border color alone signals focus, unlike `Input`'s `rgba(10,10,10,0.06)` ring) |
| background | `#F9FAFB` when focused, else `#fff` |
| cursor | `not-allowed` when disabled, else `pointer` |
| opacity | `0.5` when disabled |
| transition | `border-color 0.15s` |
| padding | `0 4px` |

**Dropdown menu panel** (`Dropdown.tsx:67-75`):

| Property | Value |
|---|---|
| border-radius | `10px` |
| border | `1px solid #E5E7EB` |
| box-shadow | `0 8px 24px rgba(10,10,10,0.10), 0 2px 6px rgba(10,10,10,0.06)` |
| overflow | `hidden` |
| z-index | `9999` (menu) / `99999` (menuPortal, `Dropdown.tsx:66`) |
| min-width | `150px` |
| menuList padding | `4px` |

Note: this shadow value is **distinct** from `Menu`'s panel shadow (`0 4px 16px rgba(10,10,10,0.06)`) — both are "floating white panel" but `Dropdown`'s menu shadow is heavier/two-layer. Do not treat them as interchangeable when documenting or replicating either.

**Option row** (`Dropdown.tsx:77-93`):

| State | Background | Text color | Font weight |
|---|---|---|---|
| default | `transparent` | `#0A0A0A` | `400` |
| focused (keyboard/hover) | `#F3F4F6` | `#0A0A0A` | `400` |
| selected | `#0A0A0A` | `#fff` | `600` |
| active/mousedown, selected | `#0A0A0A` (unchanged) | — | — |
| active/mousedown, not selected | `#E5E7EB` | — | — |

Option row: `border-radius: 6px`, `padding: 7px 10px`, `cursor: pointer`.

**Other sub-parts:**
- `dropdownIndicator` (chevron): color `#9CA3AF`, `14×14` svg, rotates `180deg` when `menuIsOpen`, `transition: transform 0.15s` (`Dropdown.tsx:51-58`).
- `clearIndicator`: color `#9CA3AF`, hover `#4B5563`, `14×14` svg (`Dropdown.tsx:59-65`).
- `placeholder`: `#6B7280`, `font-weight: 500` (`Dropdown.tsx:94-100`).
- `singleValue`: `#0A0A0A`, `font-weight: 500` (`Dropdown.tsx:101-106`).
- `multiValue` chip: `background: #F3F4F6`, `border-radius: 6px` (`Dropdown.tsx:107-111`).
- `indicatorSeparator`: removed entirely (`display: none`, `Dropdown.tsx:50`).

**Theme colors** passed to `react-select`'s internal theme (`Dropdown.tsx:224-233`): `primary: #0A0A0A`, `primary75: #0A0A0A`, `primary50: #E5E7EB`, `primary25: #F3F4F6` — these back-fill any react-select internals not covered by the explicit `styles` overrides above.

## Motion

`Dropdown` itself defines **no Framer Motion** and no CSS transition beyond the two listed above (`border-color 0.15s` on control, `transform 0.15s` on the chevron, plus `transition: transform 0.15s` for the indicator rotation). `react-select`'s own menu open/close is its native (non-Framer) transition. Contrast with `Menu`, which uses the shared `dropdownVariants`/`dropdownContainer`/`dropdownItem` Framer variants — do not port those into `Dropdown`; the two components intentionally use different animation systems because one is hand-rolled (`Menu`) and one is a third-party library (`Dropdown`/react-select). One production call site (`src/components/shared/AssignDropdown.tsx:210`) layers on a manual `@keyframes rsDropIn` CSS animation for its custom `Option`/`SingleValue` renderers — this is scoped to that file, not part of the canonical `Dropdown` styling.

## States

- **Idle** — `#E5E7EB` border, `#fff` background.
- **Focused** — `#0A0A0A` border, `#F9FAFB` background (no box-shadow ring, unlike text `Input`).
- **Hover (not focused)** — border brightens to `#D1D5DB`.
- **Error** (`error=true`) — border forced to `#EF4444` in all of idle/focused/hover states.
- **Disabled** — `opacity: 0.5`, `cursor: not-allowed`.
- **Loading** (`isLoading=true`) — react-select's built-in loading indicator (spinner) replaces/joins the dropdown indicator; no custom override in this file.
- **Menu open** — chevron rotates 180deg; menu panel renders per the styling above via a portal to `document.body` by default (`menuPortalTarget`, `Dropdown.tsx:190`) at `zIndex: 99999`, so it always paints above app content including modals unless a caller overrides the target.
- **Selected option (in menu)** — inverted colors (`#0A0A0A` bg / `#fff` text), the strongest visual state in the option list, distinguishing it clearly from mere hover (`#F3F4F6`).

## Usage Rules

- ALWAYS import `Dropdown` from `@/shared/components/ui` (the barrel), not directly from `./Dropdown` — keeps the re-export indirection intact for future swaps.
- ALWAYS pass a typed generic (`<Dropdown<FilterOpt>>`, `<Dropdown<MgrOpt>>`) rather than leaving `OptionType` to infer as `{value: string; label: string}` when the option carries extra fields (color, manager object, etc.) — every production call site does this.
- Use `size="md"` (`40px`) only when visually aligning with `40px` `Input` fields in the same row; default to `sm` (`34px`) for compact filter-bar/table-toolbar contexts.
- Use the `styles` override prop (merged, not replacing) for one-off tweaks rather than forking `createDropdownStyles` — `mergeStyles` exists specifically so callers compose on top of the base rather than duplicating it.
- Use `formatOptionLabel`/`components.Option` for custom row rendering (colored tag dots, avatar + name) rather than reaching into react-select internals directly — see the `KanbanScreen` tag-color example and `AssignDropdown`'s `MgrOptionItem` below.

## Anti-Patterns

- **NEVER use `Menu` where a form `Select`/`Dropdown` is needed**, and the reverse: never reach for `Dropdown` to build a click-to-open action list — `Dropdown` has no `onClick`-per-item concept and forcing options to double as actions abuses `onChange` semantics and drags in unwanted react-select behaviors (keyboard nav, clearable, searchable) that don't belong on an action menu.
- NEVER copy `Menu`'s panel shadow (`0 4px 16px rgba(10,10,10,0.06)`) onto a `Dropdown` menu override, or vice versa — they are deliberately different shadow specs (see Styling above); if a caller's override makes them look identical, that is drift, not consolidation.
- NEVER build a raw `<select>` or a second react-select wrapper for a new form field — extend `Dropdown`'s `styles`/`components` props instead of forking the styling function.
- NEVER set `menuPortalTarget={null}` casually to "fix" a z-index/overflow clipping issue without checking `zIndex.reactSelectMenuPortal: 9999` in `02_DESIGN_DNA.json:178` first — the portal-to-`body` + `99999` z-index default already exists specifically to dodge ancestor `overflow: hidden`/stacking-context problems.

## Real Call-Site Examples

- Table page-size picker, `src/components/shared/DataTable.tsx:233-247`: `<Dropdown<{ label: string; value: string }>>` with `menuPlacement="top"`.
- Kanban filter bar, `src/features/ideas/container/KanbanScreen.tsx:437-500`: four adjacent `<Dropdown<FilterOpt>>` filters (tag, department, assigned-to, mentioned), one using `formatOptionLabel` to render a colored tag dot + label (`KanbanScreen.tsx:445-457`), two using `isSearchable` for longer people lists.
- Assignee picker with custom option/value renderers, `src/components/shared/AssignDropdown.tsx:213-230`, pairing `Dropdown` with `components={{ Option: MgrOptionItem, ... }}` for avatar-rich rows.
- Questionnaire "select" question type, `src/features/ideas/components/StageEvaluationForm.tsx:93-99`: plain single-select built from dynamic `question.options`.
- Category/session filters, `src/features/pitch-session/components/SessionListPanel.tsx:124,131`.
- Form-builder and stage-form fields: `src/features/workflow/components/EvaluationFormBuilder.tsx:456`, `src/features/workflow/components/StageFormModal.tsx:184`, `src/features/ideas/container/CreateIdeaScreen.tsx:413,469`, `src/features/ideas/components/DynamicStageQuestionnaires.tsx:342`, `src/features/people/container/EmployeesScreen.tsx:297`.
