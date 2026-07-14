# Textarea

## 1. Purpose

`Textarea` is the multi-line text-entry primitive, used for longer free-text fields (descriptions, notes, comments). Like `Input`, it is a thin wrapper around the native element built on the same shared `inputBase` style object, but it is a plain function component (not `forwardRef`) and overrides several `inputBase` values to fit multi-line content.

## 2. File & exports, exact TS prop signature

- **File**: `src/shared/components/ui/index.tsx` (lines 443–467)
- **Export**: `export function Textarea(...)`
- **Barrel**: re-exported from `@/shared/components/ui`

```ts
function Textarea({
  error,
  style,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }): JSX.Element
```

`Textarea` extends all native `<textarea>` attributes (`value`, `onChange`, `placeholder`, `rows`, `disabled`, `className`, `style`, etc.) plus a single addition:

| Prop | Type | Behavior |
|---|---|---|
| `error` | `boolean` (optional) | Forces `borderColor: "#0A0A0A"` regardless of focus, identical mechanism to `Input`. |

No `icon` prop (unlike `Input`) and no `ref` forwarding (unlike `Input` — `Textarea` is a plain function component, not wrapped in `forwardRef`).

## 3. Variants

`Textarea` has no variant prop and no icon-prefixed variant. The only conditional styling is the `error` boolean branch (see States). Height is not fixed like `Input`'s `40px` — it is `height: "auto"` with a `minHeight: 96` floor, and `resize: "vertical"` is always on, so every instance is user-resizable vertically by default (browser-native resize handle). Callers observed overriding the floor via `style={{ minHeight: 72 }}` (`StageFormModal.tsx:236`) when a shorter default is wanted.

## 4. Spacing

Built from `inputBase` with the following overrides layered on top:

| Property | `inputBase` value | `Textarea` override |
|---|---|---|
| `height` | `40px` | `"auto"` |
| `minHeight` | (none) | `96px` |
| `padding` | `0 13px` | `"11px 13px"` |
| `lineHeight` | (none) | `1.55` |
| `resize` | (none) | `"vertical"` |
| `border-radius` | `8px` | unchanged (`8px`) |
| `font-size` | `13.5px` | unchanged (`13.5px`) |
| `width` | `100%` | unchanged (`100%`) |
| `color` | `#0A0A0A` | unchanged |

These match `.ai-design-dna/12_DESIGN_TOKENS/components.json` → `controlHeights.textarea_minHeight: 96`.

## 5. States

Identical mechanism to `Input`, driven by local `focus` state (`useState(false)`, toggled by plain `onFocus={() => setFocus(true)}` / `onBlur={() => setFocus(false)}` — note: unlike `Input`, `Textarea`'s internal handlers do **not** chain-call any caller-supplied `onFocus`/`onBlur` passed via `rest`; if a caller passes their own `onFocus`/`onBlur`, the internal `onFocus`/`onBlur` JSX attributes are defined literally in the component and will be overridden by whichever comes later in the props spread — check `{...rest}` placement: in the source, `{...rest}` is spread **after** the `onFocus`/`onBlur` JSX attributes, meaning a caller-supplied `onFocus`/`onBlur` in `rest` **replaces** the internal focus-tracking handler entirely, silently breaking the focus ring for that instance):

```ts
borderColor: error ? "#0A0A0A" : focus ? "#0A0A0A" : "#E5E7EB",
boxShadow: focus ? "0 0 0 3px rgba(10,10,10,0.06)" : "none",
```

| State | `border-color` | `box-shadow` |
|---|---|---|
| Default | `#E5E7EB` | `none` |
| Focus | `#0A0A0A` | `0 0 0 3px rgba(10,10,10,0.06)` |
| Error | `#0A0A0A` | `none` (unless also focused) |

Same grounded callout as `Input`: error border is ink (`#0A0A0A`), not red.

**Disabled**: no bespoke styling — `disabled` passes straight through via `{...rest}` to the native `<textarea>`, browser-default appearance applies.

## 6. Motion

`transition: "border-color 0.18s, box-shadow 0.18s"` — same as `Input`/`Select`, inherited unchanged from `inputBase`. No easing curve specified; no `framer-motion` involvement.

## 7. Usage rules

- Always wrap in `Field` for labeled multi-line fields — every observed usage in `src/features/**` does this.
- Use `style={{ minHeight: N }}` to shrink the default `96px` floor for compact contexts (e.g. a short description field in a modal) rather than fighting `resize`/`rows`.
- Pass `error={!!errors.<field>}` in lockstep with the wrapping `Field`'s `error` message string, same pattern as `Input`.
- Because internal `onFocus`/`onBlur` can be silently overridden by caller-supplied ones spread via `rest` (see States), avoid passing custom `onFocus`/`onBlur` to `Textarea` unless you also intend to lose the focus ring — none of the observed usages in `src/features/**` pass their own `onFocus`/`onBlur`, which is the safe, established pattern.

## 8. Composition rules (real usage)

`src/features/ideas/container/CreateIdeaScreen.tsx:500` and `:514` — two `Textarea`s in the create-idea form (problem statement / proposed solution), each inside its own `Field`.

`src/features/workflow/components/StageFormModal.tsx:230-237`:
```tsx
<Field label={t("workflow.descriptionLabel", "Description")}>
  <Textarea
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    placeholder={t("workflow.descriptionPlaceholder", "Describe the purpose of this stage…")}
    style={{ minHeight: 72 }}
  />
</Field>
```
Shows the `minHeight` override pattern for a shorter-than-default textarea.

`src/features/people/components/RecordModal.tsx:168` and `src/features/rewards/modal/RecordTransactionModal.tsx:230` and `src/features/pitch-session/components/CreateSessionModal.tsx:105` and `src/features/departments/container/DepartmentsScreen.tsx:154` — each a single `Textarea` for a notes/description field inside its respective modal form, all following the `Field > Textarea` composition with no `error` in some cases (optional fields) and `error={!!errors.x}` in others.

## 9. Anti-patterns

- Never pass a custom `onFocus`/`onBlur` to `Textarea` without also re-implementing the focus-ring toggle — doing so silently disables the focus ring for that instance because the internal handler is what drives the `focus` state that computes `borderColor`/`boxShadow`.
- Never fix the resize behavior with CSS overrides in a calling screen — `resize: "vertical"` is the deliberate, universal default; if a screen genuinely needs a fixed-height, non-resizable textarea, override via `style={{ resize: "none" }}` rather than a global CSS rule targeting `textarea`.
- Never introduce a red error border — same rule as `Input`: error state is ink (`#0A0A0A`), not `#DC2626`/`#EF4444`.
- Never duplicate the `11px 13px` / `96px` / `1.55` values as magic numbers in a new bespoke textarea — these all derive from `inputBase` plus `Textarea`'s override block; any new multi-line control should reuse `Textarea` rather than hand-rolling a `<textarea>` with copied styles.
