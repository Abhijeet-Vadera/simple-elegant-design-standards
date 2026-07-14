# Checkbox

## Purpose

A single small square selection control rendered as a `<button>` (not a native `<input type="checkbox">`), showing a check glyph when selected. Used for form-style multi-select and confirmation rows (e.g. tag pickers, todo item completion) where selection state is boolean and set/cleared explicitly by the user.

## Source

- **File:** `src/shared/components/ui/index.tsx`
- **Lines:** 558–590
- **Export:** `export function Checkbox(...)`
- **Legacy duplicate (do not use):** `src/components/ui/index.tsx:236` onward — superseded copy per `.ai-design-dna/12_DESIGN_TOKENS/components.json` → `legacyDoNotUse`. Import only from `@/shared/components/ui`.

### Prop signature

```ts
function Checkbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}): JSX.Element
```

Controlled component only — no internal state, no `indeterminate` prop, no `size`/`label` prop. Note: unlike `Toggle`, this component's markup does **not** actually wire the `disabled` boolean onto the native `disabled` attribute or an `opacity`/`cursor` style (only the `onClick` guard `!disabled && onChange(!checked)` respects it) — see Anti-patterns.

## Exact dimensions

| Element | Value |
|---|---|
| Button | `18px x 18px` |
| Border-radius | `5px` — matches `.ai-design-dna/12_DESIGN_TOKENS/radius.json` → `componentSpecific.checkbox: "5px"` |
| Border | `1px solid` — `#0A0A0A` when checked, `#D1D5DB` when unchecked |
| Check glyph | `CheckIcon` at `width={12} height={12} strokeWidth={2.5}`, rendered only when `checked` is true |
| Layout | `display: grid; placeItems: center` — glyph is centered in the box, `flexShrink: 0` so it never compresses in a flex row |

Confirmed against `.ai-design-dna/02_DESIGN_DNA.json` → `components.controlHeights.checkbox`: `"18px"`, and `radius.observedRuntimeSteps.controls`: `"checkboxes 5px"`.

## States

- **Unchecked:** `background: #fff`, `border: 1px solid #D1D5DB`, no glyph rendered.
- **Checked:** `background: #0A0A0A` (ink), `border: 1px solid #0A0A0A`, `color: #fff`, `CheckIcon` rendered inside.
- **Disabled:** the `onClick` is guarded so the value cannot change, but **there is no visual treatment** — no `opacity`, no `cursor: not-allowed`, and the native `disabled` attribute is never set on the `<button>`. It looks fully interactive even when it isn't. This is a real gap versus `Toggle` (which does dim + change cursor + set `disabled`) — document it as-is, don't silently "fix" it when writing docs or new call sites; flag it if asked to improve the component.
- **No indeterminate state.** There is no `"mixed"` rendering path, no dash/minus glyph, and no third value the `checked` boolean can take. Any UI that needs a tri-state "some selected" checkbox (e.g. a header checkbox for a partially-selected list) is not served by this component as-is.

## ARIA

```html
<button aria-checked={checked} role="checkbox">
```

- `role="checkbox"` — correct semantic for selection-style controls (vs. `role="switch"` on `Toggle`, used for immediate-effect settings — see `toggle.md`).
- `aria-checked` bound directly to the boolean `checked` — always `"true"`/`"false"`, never `"mixed"`.
- No `disabled`/`aria-disabled` attribute is emitted at all (see States above) — a screen reader has no way to know this control is inert when `disabled` is passed.
- No `aria-label`/`aria-labelledby` from the component itself; callers must supply adjacent visible text or their own label wiring, same as `Toggle`.

## Motion

```css
transition: all 0.18s;
```

- A single `transition: all 0.18s` on the button covers `background`, `border-color`, and `color` together in one declaration — the fastest of the toggle-family transitions (0.18s vs. Toggle's 0.22s/0.26s), appropriate for a smaller, snappier control.
- No transition/animation on the check glyph's appearance — it mounts/unmounts instantly with `{checked && <CheckIcon .../>}`; there is no fade-in or scale-in of the check mark.
- No easing specified — implicit browser `ease`, consistent with `Toggle`'s use of plain CSS transitions rather than Framer Motion.

## Usage rules

1. Always pass a boolean `checked` — controlled only, same discipline as `Toggle`.
2. Use for selection semantics (list item picked, tag selected, todo done) where `role="checkbox"` is the correct AT contract — use `Toggle`/`role="switch"` instead for immediate-effect settings.
3. Since disabled has no visual treatment, if a call site needs a visibly-disabled checkbox, the caller must add its own `opacity`/`cursor` styling around/on top of this component — do not assume the primitive handles it.
4. Pair with visible label text placed by the caller; the component has no label slot.
5. Never re-implement the 18x18/5px-radius/check-glyph look inline — import `Checkbox` from `@/shared/components/ui`. (See Anti-patterns: this rule is currently violated in two places in the codebase — worth flagging, not silently copying, when extending those files.)

## Real call-site examples

**1. Tag selection list — hand-rolled duplicate, NOT the shared component (drift, not a template to copy)**
`src/shared/components/modal/TagManagementModal.tsx:449-462`
```tsx
{/* Checkbox */}
<span
  style={{
    width: 16,
    height: 16,
    borderRadius: 4,
    border: `1.5px solid ${selected ? "#0A0A0A" : "#D1D5DB"}`,
    background: selected ? "#0A0A0A" : "#fff",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    transition: "all 0.15s",
    ...
```
This renders its own 16x16 `<span>` with `4px` radius, `1.5px` border, and `0.15s` transition — all values drift from the canonical `Checkbox` (18x18, `5px`, `1px`, `0.18s`). It is not using `role="checkbox"`/`aria-checked` at all (no ARIA present). Documented here as an existing inconsistency in the codebase, not as a pattern to replicate.

**2. Todo completion control — also hand-rolled, uses Tailwind + emerald color, NOT the shared component**
`src/features/ideas/components/IdeaTodoCard.tsx:251-266`
```tsx
{/* Checkbox */}
<button
  onClick={() => updateMutation.mutate({ id: todo.id, data: { status: done ? "pending" : "completed" } })}
  disabled={isDisabled}
  className={`shrink-0 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
    done ? "bg-emerald-500 border-emerald-500" : "bg-white border-border-strong hover:border-emerald-400"
  } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
>
  {done && <CheckIcon width={12} height={12} strokeWidth={2.5} ... />}
```
`w-4 h-4` = 16x16 (not 18x18), `rounded-[4px]` (not 5px), and `bg-emerald-500` — a stock Tailwind green that is explicitly listed as off-palette territory (`.ai-design-dna/12_DESIGN_TOKENS/colors.json` → `doNotUse.stockPaletteFamilies` calls out non-ink accent families as tech debt). No `role="checkbox"`/`aria-checked` either. Also a drift example, not a template.

**3. Canonical component definition itself (reference, not a downstream call site)**
`src/shared/components/ui/index.tsx:568-590` — this is the source of truth; grep for `<Checkbox` (JSX usage, as opposed to hand-rolled lookalikes) currently returns **no results** in `src/features/**`, meaning every visible "checkbox" in the app today is one of the drifted hand-rolled versions above, not the shared primitive. This is an important finding for anyone extending the design system: the canonical `Checkbox` exists but is effectively unused in favor of ad hoc copies.

## Anti-patterns

- **Do not fake an indeterminate/"mixed" state** with a dash glyph, partial-opacity fill, or `aria-checked="mixed"` — the component and its ARIA wiring are strictly boolean; there is no mixed rendering path in the source.
- **Do not strip `role="checkbox"` / `aria-checked`** by spreading conflicting props or hiding the button from the accessibility tree.
- **Do not assume `disabled` renders a disabled look** — it currently only blocks the `onChange` callback; it neither dims the control nor sets the native `disabled` attribute nor changes the cursor. If a call site needs a visibly-disabled checkbox, style it explicitly rather than trusting the primitive.
- **Do not hand-roll a lookalike `<span>`/`<button>` with different dimensions/radius/colors** instead of importing the shared `Checkbox` — this has already happened twice in the codebase (`TagManagementModal.tsx:449`, `IdeaTodoCard.tsx:251`), both drifting on size (16px vs 18px), radius (4px vs 5px), transition duration, and — in the todo card case — introducing an off-palette `emerald` accent color. New code should use the shared `Checkbox` from `@/shared/components/ui`, not extend this drift.
- **Do not import from the legacy `src/components/ui/index.tsx`** copy — only `src/shared/components/ui/index.tsx` is canonical.
