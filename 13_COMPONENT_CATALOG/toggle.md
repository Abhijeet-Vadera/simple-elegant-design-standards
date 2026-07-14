# Toggle

## Purpose

A binary on/off switch styled as a pill-shaped track with a sliding thumb. Used for enabling/disabling settings (e.g. auth provider enablement, "lifetime validity" flags) where the action takes effect immediately on click — not a deferred/submit-style control.

## Source

- **File:** `src/shared/components/ui/index.tsx`
- **Lines:** 510–556
- **Export:** `export function Toggle(...)`
- **Legacy duplicate (do not use):** `src/components/ui/index.tsx:225-236` — superseded copy, identical visual spec (`.ai-design-dna/12_DESIGN_TOKENS/components.json` → `legacyDoNotUse`). Always import `Toggle` from `@/shared/components/ui`, never from `@/components/ui`.

### Prop signature

```ts
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}): JSX.Element
```

No `size`, `label`, or `indeterminate` prop exists. It is a controlled component only — there is no internal state; the caller owns `checked`.

## Exact dimensions

| Element | Value |
|---|---|
| Track (button) | `width: 40px`, `height: 24px` |
| Track border-radius | `999px` (pill — token `radius.pill`) |
| Track border | `1px solid` — `#0A0A0A` when checked, `#D1D5DB` when unchecked (`colors.border.strong`) |
| Thumb (span) | `18px x 18px`, `border-radius: 999px` |
| Thumb offset | `top: 2px`; `left: 2px` (unchecked) → `left: 18px` (checked) — i.e. 2px inset on each side, 16px of travel |
| Thumb fill | `#fff`, with `1px solid #E5E7EB` border when unchecked (no border when checked) |
| Thumb shadow | `0 1px 2px rgba(0,0,0,0.2)` — matches `.ai-design-dna/12_DESIGN_TOKENS/shadows.json` → `toggleThumb` |
| `controlHeights.toggleTrack` | `{ width: 40, height: 24 }` per `components.json` |

Confirmed against `.ai-design-dna/02_DESIGN_DNA.json` → `components.controlHeights.toggle`: `"24px x 40px track"`.

## States

- **Unchecked:** track `background: #fff`, border `#D1D5DB`, thumb at `left: 2px` with a hairline `1px solid #E5E7EB` border.
- **Checked:** track `background: #0A0A0A` (ink), border `#0A0A0A`, thumb at `left: 18px`, thumb border removed.
- **Disabled:** `opacity: 0.5`, `cursor: not-allowed`; click handler is guarded (`!disabled && onChange(...)`) so it is inert even if `onClick` fires. Disabled state is a pure opacity dim — it renders whatever checked/unchecked look the prop dictates, just faded.
- **Focus:** no explicit `:focus` / focus-ring style is defined in the component. It relies entirely on the native `<button>` focus outline (browser default) since no `outline: none` or custom `boxShadow` focus ring is applied here — unlike `Input`/`Select` in the same file, which do add a `0 0 0 3px rgba(10,10,10,0.06)` focus ring. This is a documented gap, not a deliberate omission of ring.
- **No indeterminate state.** There is no third visual state and no `aria-checked="mixed"` path. `checked` is a strict boolean; do not attempt to represent a "partial/mixed" concept with this component.

## ARIA

```html
<button role="switch" aria-checked={checked} disabled={disabled}>
```

- `role="switch"` — correct semantic for an immediate-effect on/off control (as opposed to `role="checkbox"`, used for `Checkbox`/form-style selection — see `checkbox.md`).
- `aria-checked` is bound directly to the boolean `checked` prop — always `"true"` or `"false"`, never `"mixed"`.
- Native `disabled` attribute is passed through, which also gives correct `aria-disabled`-equivalent semantics for free and removes it from the tab order per browser default handling.
- No `aria-label`/`aria-labelledby` is set by the component itself — callers are responsible for adjacent visible text or wrapping in a labelled row (see usage examples below); the component has no `label` prop to do this internally.

## Motion

```css
transition: background 0.22s, border-color 0.22s;   /* on the track */
transition: left 0.26s;                              /* on the thumb */
```

- Track background/border-color: **0.22s** (within the documented 0.18–0.26s family used across `Toggle`/`Checkbox`).
- Thumb slide (`left`): **0.26s** — the slowest of the two, so the thumb's physical slide slightly outlasts the color flip, giving a soft "catch-up" feel rather than a hard snap.
- No easing function specified — defaults to the browser's implicit `ease`. This diverges from the app's Framer Motion signature easing (`cubic-bezier(0.16, 1, 0.3, 1)` per `.ai-design-dna/12_DESIGN_TOKENS/animations.json`), because this is a plain CSS transition on a raw DOM `<button>`, not a Framer Motion element.
- No animation runs when `disabled` toggles — only `opacity` changes, and that has no transition either (it snaps).

## Usage rules

1. Always pass a boolean `checked` — never `undefined` (there is no defaultProps/fallback in the destructure, so `checked === undefined` would render as unchecked but `aria-checked="undefined"`... i.e. always control it explicitly).
2. Use for settings/flags with **immediate effect on click** (enable a provider, flip a preference). Use `Checkbox` instead for form-style multi-select or "I agree" patterns where `role="checkbox"` semantics are expected.
3. Pair with visible label text placed by the caller (Toggle has no built-in label slot) — put the label in a flex row and, ideally, wire a `<label>`/`aria-label` yourself since the component doesn't.
4. If the click target needs to be larger than 40x24, wrap it in a bigger clickable row and use `stopPropagation` on the Toggle itself when the row is also clickable (see `CreateInviteModal` example) rather than resizing the Toggle's own hit area — the component has no size variant.
5. Never re-implement the switch visuals inline with a `<span>`/`<div>` when this component is available — import `Toggle` from `@/shared/components/ui`.

## Real call-site examples

**1. Simple controlled toggle, no wrapping row**
`src/features/people/components/CreateInviteModal.tsx:275`
```tsx
<Toggle checked={lifetimeValidity} onChange={setLifetimeValidity} />
```
Context (lines 264–275): the outer `div` toggles on click and the `Toggle` itself has its own click handler, so the surrounding code stops propagation to avoid a double-toggle — a real gotcha worth repeating for any future "row is also clickable" pattern.

**2. Toggle driving an async mutation with derived label text**
`src/features/workspace-settings/container/WorkspaceSettings.tsx:293-296`
```tsx
<Toggle
  checked={isEnabled}
  onChange={(v) => onToggle(provider.providerId, v, provider.name)}
/>
```
`onToggle` is `handleToggleProvider` (line 461), which performs the actual enable/disable network call — the Toggle itself is purely presentational/controlled, confirming rule 1 (always controlled) and rule 2 (immediate-effect settings).

**3. Import path (canonical, not legacy)**
`src/features/workspace-settings/container/WorkspaceSettings.tsx:5`
```tsx
import { Button, Toggle, Badge, PageHeader } from "@/shared/components/ui";
```

## Anti-patterns

- **Do not fake a third/indeterminate state** by rendering the thumb at a mid-track position with reduced opacity or a partial `left` value — the component's model is strictly boolean; there is no `"mixed"` visual and no consumer in the codebase does this. If a tri-state control is genuinely needed, build a distinct component rather than contorting `Toggle`.
- **Do not strip or override `role="switch"` / `aria-checked`** by spreading extra props that collide with them, or by wrapping the button in a way that hides it from the accessibility tree (e.g. `aria-hidden` on an ancestor while still relying on it for input).
- **Do not import from `src/components/ui/index.tsx`** — that copy (lines 225–236) is the legacy/superseded file called out in `components.json.legacyDoNotUse`; only `src/shared/components/ui/index.tsx` is canonical.
- **Do not resize the track/thumb via inline `style` overrides** (there is no `style` prop accepted, and the component doesn't spread `...rest` onto the `<button>`) — if a different size is truly needed, that is a signal a new variant/prop should be added to the source, not patched from a call site.
- **Do not rely on it for a focus ring** — since none is implemented, don't assume keyboard-focus visibility matches the polish of `Input`/`Select` in this same file; flag this gap rather than silently duplicating the missing ring elsewhere.
