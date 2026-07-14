# Select

## 1. Purpose

`Select` is the native-`<select>`-backed dropdown primitive — a wrapper around a real `<select>` element styled to match `inputBase` (same height/border/radius/font as `Input`/`Textarea`), with `appearance: none` and a custom `ChevronDownIcon` positioned on the right to replace the browser's default select arrow.

**Grounded finding — this component is not used anywhere in `src/features/**` at the time of this audit.** A repo-wide grep for `<Select` (JSX usage) and for `Select` imported from `@/shared/components/ui` in `src/features/**` returns zero matches, and there are zero raw `<select>` tags anywhere under `src/features/**` either. Every dropdown-style control observed in `src/features/**` instead uses the separate `Dropdown` component (`src/shared/components/ui/Dropdown.tsx`, re-exported from the same `@/shared/components/ui` barrel), which wraps `react-select` (`ReactSelectLib`), not the native `<select>`. Document `Select` faithfully as it exists in code, but flag to any future AI: **the de facto, currently-adopted dropdown pattern in this codebase's screens is `Dropdown`, not `Select`.**

## 2. File & exports, exact TS prop signature

- **File**: `src/shared/components/ui/index.tsx` (lines 469–508)
- **Export**: `export function Select(...)`
- **Barrel**: re-exported from `@/shared/components/ui`

```ts
function Select({
  children,
  error,
  style,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }): JSX.Element
```

`Select` extends all native `<select>` attributes (`value`, `onChange`, `disabled`, `multiple`, `className`, `style`, etc., all passed through via `{...rest}`) plus:

| Prop | Type | Behavior |
|---|---|---|
| `children` | `ReactNode` | Rendered verbatim inside the native `<select>` — caller supplies raw `<option>` elements. |
| `error` | `boolean` (optional) | Forces `borderColor: "#0A0A0A"`, same mechanism as `Input`/`Textarea`. |

No `ref` forwarding (plain function component). No built-in option-rendering helper — `Select` does not accept an `options` array prop (contrast with `ReactSelect`/`Dropdown`, both of which take a typed `options: {value, label}[]` array).

## 3. Variants

No icon-prefixed variant (a leading icon inside a native `<select>` is not supported — only the trailing chevron). No size variant — fixed at `height: 40` via `inputBase`. The only conditional style branch is the `error` boolean (see States). `children` is unconstrained `ReactNode`, so any valid `<select>` child content (including `<optgroup>`) is technically possible, though no such usage was found anywhere in the codebase to cite.

## 4. Spacing

Built from `inputBase` with one override:

| Property | `inputBase` value | `Select` override |
|---|---|---|
| `height` | `40px` | unchanged |
| `padding` | `0 13px` | `paddingRight: 36` added (left/vertical unchanged) |
| `border-radius` | `8px` | unchanged |
| `font-size` | `13.5px` | unchanged |
| `appearance` | (none) | `"none"` (removes native browser arrow) |
| `cursor` | (none) | `"pointer"` |

Chevron icon: `ChevronDownIcon`, `16×16`, positioned `absolute`, `right: 12px`, vertically centered (`top: "50%", transform: "translateY(-50%)"`), color `#9CA3AF`, `pointerEvents: "none"`. The `paddingRight: 36` on the `<select>` reserves room for this icon (`12px` offset + `16px` icon + margin ≈ `36px`).

Wrapper: `<div style={{ position: "relative" }}>` — no width/height of its own; sizing comes entirely from the inner `<select>`.

## 5. States

Identical mechanism to `Input`/`Textarea`:

```ts
borderColor: error ? "#0A0A0A" : focus ? "#0A0A0A" : "#E5E7EB",
boxShadow: focus ? "0 0 0 3px rgba(10,10,10,0.06)" : "none",
```

| State | `border-color` | `box-shadow` |
|---|---|---|
| Default | `#E5E7EB` | `none` |
| Focus | `#0A0A0A` | `0 0 0 3px rgba(10,10,10,0.06)` |
| Error | `#0A0A0A` | `none` (unless also focused) |

Same as `Textarea`, the internal `onFocus={() => setFocus(true)}` / `onBlur={() => setFocus(false)}` JSX attributes are placed **before** `{...rest}` in the spread order, so a caller-supplied `onFocus`/`onBlur` in `rest` will silently override (not chain with) the internal handler and disable the focus ring for that instance. No usages were found to confirm whether this has been hit in practice (the component itself is unused in `src/features/**`), but the risk is identical to `Textarea`'s.

**Disabled**: no bespoke styling — passes straight through via `{...rest}`; browser-default disabled appearance applies (no dimmed/opacity override, unlike `Dropdown`, which explicitly sets `opacity: state.isDisabled ? 0.5 : 1` in its `react-select` control style).

## 6. Motion

`transition: "border-color 0.18s, box-shadow 0.18s"` from `inputBase`, unchanged. Compare `Dropdown` (the component actually used), whose `react-select` control style instead uses `transition: "border-color 0.15s"` (note the different duration — `0.15s` vs `0.18s`; `Dropdown` is not built on `inputBase` and has drifted slightly).

## 7. Usage rules — native `Select` vs `ReactSelect` vs `Dropdown`

Three separate select-like primitives exist in this codebase; a future AI must pick the right one:

1. **`Select`** (this component, `index.tsx:469-508`) — native `<select>`. Zero usages found in `src/features/**`. Would be the right choice only for a very simple, short, non-searchable option list where a fully native/OS-rendered dropdown is acceptable and no custom option rendering (icons, colors, multi-select) is needed.
2. **`ReactSelect`** (`index.tsx:1548-1637`, generic `<V extends string>`, props `options/value/onChange/placeholder/error/isDisabled/isSearchable/isClearable/isLoading/width`) — a `react-select`-backed single-select wrapper defined in the same barrel file. Also has **zero usages** found anywhere in `src/features/**` (only self-referenced inside `index.tsx`).
3. **`Dropdown`** (`src/shared/components/ui/Dropdown.tsx`, re-exported from the same `@/shared/components/ui` barrel) — also `react-select`-backed, supports a `size: "sm" | "md"` prop (`34px`/`40px` heights), single or multi select, and is the component actually imported and rendered across `src/features/**` (13 files reference it, e.g. `src/features/ideas/container/CreateIdeaScreen.tsx:413`, `src/features/ideas/container/KanbanScreen.tsx:437/465/482/500`, `src/features/workflow/components/StageFormModal.tsx:184`, `src/features/workflow/components/EvaluationFormBuilder.tsx:456`).

**Rule for extending the UI**: for any new select/dropdown UI in a `src/features/**` screen, follow the established pattern and use **`Dropdown`**, not `Select` or `ReactSelect` — despite `Select` and `ReactSelect` being fully built and exported, they are dormant/superseded in practice. Only reach for native `Select` if there is a specific reason to avoid `react-select` (e.g. an extremely simple, accessibility-critical, no-JS-dependent picker), and call that reasoning out explicitly since it deviates from the codebase norm.

## 8. Composition rules

No real `<Select>` usage exists in `src/features/**` to cite (confirmed via repo-wide grep — see Purpose). For comparison, the equivalent, actually-used composition with `Dropdown` looks like (`src/features/ideas/container/CreateIdeaScreen.tsx:408-426`, inside a `<Field>` wrapper the same way `Input`/`Textarea` are used):
```tsx
<Field label={t("idea.selectEmployee", "Select Employee")} required error={errors.employee}>
  <Dropdown
    value={employeeOptions.find((o) => o.value === selectedEmployeeEmail) ?? null}
    onChange={(opt) => handleEmployeeChange(opt?.value ?? "")}
    options={employeeOptions}
    error={!!errors.employee}
    isDisabled={loadingEmployees}
    isLoading={loadingEmployees}
    isSearchable
    isClearable
    placeholder={
      loadingEmployees
        ? t("idea.loadingEmployees", "Loading employees…")
        : t("idea.selectEmployeePlaceholder", "Select employee…")
    }
  />
</Field>
```
This is the same `Field.error` (string) / control `error` (boolean) split documented for `Input` in `input.md`, applied to `Dropdown` instead of `Select`.

Two further `Dropdown` call sites for additional reference: `src/features/ideas/container/KanbanScreen.tsx:437,465,482,500` (four filter dropdowns, `size="sm"` usage) and `src/features/workflow/components/EvaluationFormBuilder.tsx:456`.

## 9. Anti-patterns

- Do not introduce new native `Select` usages as the default choice for a dropdown in a `src/features/**` screen — the codebase has already standardized on `Dropdown` (react-select-backed) for every real dropdown; adding a native `<select>`-based `Select` alongside it would create a third, inconsistent interaction/visual pattern (native OS dropdown vs custom `react-select` menu with custom option styling, search, clear, etc.).
- Do not add an `options` array prop to `Select` to "match" `Dropdown`/`ReactSelect`'s API — if array-driven options with typed `value`/`label` are needed, that need is already met by `Dropdown`; keep `Select` as the plain, `children`-driven native wrapper it is.
- Do not give `Select` a red error border to "align" with `ReactSelect`'s `#EF4444` error border or `Dropdown`'s `#EF4444` error border — `Select` itself, as written, uses `#0A0A0A` for error (identical to `Input`/`Textarea`). If a future AI unifies these components, that is a deliberate design decision to flag, not a silent fix — as-is, `Select`'s ink-error and `ReactSelect`/`Dropdown`'s red-error are a real, existing inconsistency in this codebase (see `.ai-design-dna/02_DESIGN_DNA.json` → `color.semantic.errorTextAlt`, documented as `"react-select error border"`, `#EF4444`).
- Do not pass a custom `onFocus`/`onBlur` to `Select` without accounting for the override risk described in States.
