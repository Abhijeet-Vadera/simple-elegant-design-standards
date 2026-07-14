# Input

## 1. Purpose

`Input` is the single-line text-entry primitive for the whole app — every hand-rolled form (there is no form library) composes it inside `Field`. It is a thin, ref-forwarding wrapper around the native `<input>` that adds the shared `inputBase` styling, a focus/blur-tracked border-and-glow state, a boolean `error` flag, and an optional leading icon.

## 2. File & exports, exact TS prop signature

- **File**: `src/shared/components/ui/index.tsx` (lines 363–441)
- **Export**: `export const Input = forwardRef<HTMLInputElement, ...>(...)`; `Input.displayName = "Input"`
- **Barrel**: re-exported from `@/shared/components/ui`

```ts
const inputBase: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 13px",
  background: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  fontSize: 13.5,
  color: "#0A0A0A",
  outline: "none",
  transition: "border-color 0.18s, box-shadow 0.18s",
};

const Input: React.ForwardRefExoticComponent<
  InputHTMLAttributes<HTMLInputElement> & {
    error?: boolean;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  } & React.RefAttributes<HTMLInputElement>
>
```

`Input` extends **all** native `<input>` HTML attributes (`type`, `value`, `onChange`, `placeholder`, `min`, `disabled`, `className`, `style`, etc. all pass through via `{...rest}`) plus:

| Prop | Type | Behavior |
|---|---|---|
| `error` | `boolean` (optional) | Forces `borderColor: "#0A0A0A"` regardless of focus. |
| `icon` | `React.ComponentType<React.SVGProps<SVGSVGElement>>` (optional) | Renders a 16×16 leading icon at `left: 13px`, and switches to a second render branch that wraps the `<input>` in a `position: relative` div and sets `paddingLeft: 38`. |
| `ref` | forwarded | `forwardRef<HTMLInputElement, ...>` — the component forwards the ref straight to the native `<input>`. |

`style` passed by the caller is spread **last** (`...style` after `...inputBase` and the computed border/shadow), so caller `style` overrides win over every token default, including `borderColor`/`boxShadow` — be aware of this when composing error/focus states with a custom `style`.

## 3. Variants

- **Plain** (no `icon`): renders a single `<input>` with `inputBase` spread directly, `paddingLeft` stays the default `13px` (from `padding: "0 13px"`).
- **Icon-prefixed** (`icon` set): renders `<div style={{ position: "relative" }}>` containing an absolutely-positioned `<span>` (icon, color `#9CA3AF`, `left: 13, top: "50%", transform: translateY(-50%)`, `pointerEvents: "none"`) followed by the `<input>` with `paddingLeft: 38` overriding the base `padding`.
- **Error variant**: controlled purely by the `error: boolean` prop — no separate component, just a style branch (see States).
- No `size` prop exists — `Input` is single-sized (`height: 40`) everywhere in the codebase. Any visual size change is done ad hoc via `style`/`className` overrides (e.g. `className="rounded-sm pl-[26px]"` in `FinancialImpactCard.tsx:97` to make room for a custom leading currency glyph instead of using the built-in `icon` prop).

## 4. Spacing

From the shared `inputBase` object (also consumed by `Textarea` and `Select` — this is the single source of truth for all three):

| Property | Value |
|---|---|
| `height` | `40px` |
| `padding` | `0 13px` (icon variant overrides to `paddingLeft: 38`) |
| `border-radius` | `8px` |
| `font-size` | `13.5px` |
| `width` | `100%` |
| `color` | `#0A0A0A` |

These match `.ai-design-dna/02_DESIGN_DNA.json` → `surfaces.input` (`"#FFFFFF border #E5E7EB radius 8px height 40px"`) and `components.controlHeights.input: 40`, and `.ai-design-dna/12_DESIGN_TOKENS/components.json` → `controlHeights.input: 40`.

Icon layout: icon size `16×16`, icon left offset `13px` (same as the base horizontal padding), input `paddingLeft` becomes `38px` when an icon is present.

## 5. States

All three border/shadow states are computed in the same ternary on every render, driven by local `focus` state (`useState(false)` toggled on native `onFocus`/`onBlur`, which also still calls through to any caller-supplied `onFocus`/`onBlur`) and the `error` prop:

```ts
borderColor: error ? "#0A0A0A" : focus ? "#0A0A0A" : "#E5E7EB",
boxShadow: focus ? "0 0 0 3px rgba(10,10,10,0.06)" : "none",
```

| State | `border-color` | `box-shadow` |
|---|---|---|
| Default | `#E5E7EB` | `none` |
| Focus | `#0A0A0A` | `0 0 0 3px rgba(10,10,10,0.06)` |
| Error | `#0A0A0A` | `none` (unless also focused, in which case both apply — error only changes the border, focus is what drives the ring) |
| Error + Focus | `#0A0A0A` | `0 0 0 3px rgba(10,10,10,0.06)` |

**Grounded callout**: `error` renders the exact same `borderColor` (`#0A0A0A`, ink) as a plain focus state — there is no distinct red/error border anywhere in `Input`. This is a deliberate, documented deviation from the "red border = error" convention common elsewhere; it matches `Field`'s ink-colored error text (see `field.md`). Do not introduce a red border for `Input` errors — the actual color value used is `#0A0A0A`.

**Disabled**: `Input` renders no explicit disabled styling — it passes `disabled` straight through to the native `<input>` via `{...rest}`, so disabled appearance is whatever the browser/global CSS applies (no bespoke disabled background/opacity token exists on this component, unlike `Toggle`, which does define `opacity: disabled ? 0.5 : 1`).

## 6. Motion

`transition: "border-color 0.18s, box-shadow 0.18s"` — part of `inputBase`, applies identically to `Input`, `Textarea`, and `Select`. No easing curve is specified (defaults to the browser's `ease`), and there is no `framer-motion` involvement — this is a plain CSS transition on a native element. `0.18s` does not match any named duration in `.ai-design-dna/02_DESIGN_DNA.json` → `motion.durations` (closest documented bucket is `genericCssTransition: "150-200ms"`, which `0.18s` (180ms) falls inside).

## 7. Usage rules

- Always render `Input` inside `Field` for any input that carries a label/hint/error (see `field.md`); the only observed exceptions are ad hoc unlabeled inputs paired with a raw `<p>` label (an inconsistency, not a pattern — see Anti-patterns).
- Use the built-in `icon` prop for a leading glyph rather than manually positioning a `<span>` next to a plain `Input` — `FinancialImpactCard.tsx` does the latter (positioning a currency symbol) only because it needs a text glyph, not an SVG icon component, which the `icon` prop doesn't support (it types `icon` as `React.ComponentType<SVGProps<SVGSVGElement>>`, i.e. an SVG icon, not arbitrary text/ReactNode).
- Pass `error` as `!!errors.<field>` from the caller's hand-rolled `validate()` result (boolean), in lockstep with the string version passed to the wrapping `Field`'s `error` prop.
- `ref` forwarding exists for imperative access (`.focus()`, integrating with libraries) — use it rather than wrapping `Input` in another forwardRef layer.

## 8. Composition rules (real usage)

`src/features/ideas/container/CreateIdeaScreen.tsx:440-445`:
```tsx
<Input
  value={identity.name}
  onChange={(e) => setId("name", e.target.value)}
  placeholder={t("idea.fullNamePlaceholder", "e.g. Aisha Patel")}
  error={!!errors.name}
/>
```

`src/features/workflow/components/StageFormModal.tsx:115` and `:167` and `:246` — three separate `Input`s inside one modal form, each wrapped in its own `Field`, showing the repeat-per-field pattern within a single screen.

`src/features/ideas/components/FinancialImpactCard.tsx:93-99` (icon-less, currency-prefixed via manual `<span>`, NOT the `icon` prop, and NOT wrapped in `Field`):
```tsx
<Input
  type="number"
  min={0}
  value={savings}
  onChange={(e) => setSavings(e.target.value)}
  placeholder="0"
  className="rounded-sm pl-[26px]"
/>
```
Note `className="rounded-sm pl-[26px]"` here is layered on top of, not instead of, `inputBase`'s inline `padding: "0 13px"`. `Input` does not destructure `className` specially — it flows through `{...rest}` onto the native `<input>` alongside the inline `style` object. Inline styles win over class-based declarations for the same CSS property, so this `pl-[26px]` utility is overridden by the inline `padding-left: 13px` coming from `inputBase` and has no visual effect; the currency glyph's actual clearance (if any) comes from the glyph being small enough to sit inside the existing `13px` padding, not from the Tailwind class. This is flagged here as a real, code-grounded inconsistency in the codebase, not a pattern to copy — use the `icon` prop or an explicit inline `style.paddingLeft` override instead of a Tailwind padding utility if a control needs extra left clearance.

`src/features/workflow/components/SectionFormModal.tsx:86-91` — plain `Input`, no `error`, no `icon`, wrapped in `Field`.

## 9. Anti-patterns

- Never re-implement the focus ring / border transition with a new CSS class or Tailwind `focus:` utility — always drive it through the `error`/native focus mechanism already built into `Input`, since the ring uses a hard-coded token (`rgba(10,10,10,0.06)`) that must stay consistent with `Textarea`/`Select`/`ReactSelect`'s identical rings.
- Never invent a red border for error state — the codebase's `Input` error state is ink (`#0A0A0A`), the same as focus. Adding red (`#DC2626`/`#EF4444`) to `Input`'s own border would contradict the actual, shipped visual language (contrast with `ReactSelect`, which genuinely does use `#EF4444` for its error border — that is a documented one-off, not the norm — see `select.md`).
- Never bypass the `icon` prop by manually absolutely-positioning an SVG icon component inside a wrapping div when an SVG icon (not a text glyph) is needed — use `icon` so the `paddingLeft: 38` and icon color/position stay token-driven.
- Never pass `style` expecting it to be merged conservatively — it is spread last and will silently clobber `borderColor`/`boxShadow` computed for focus/error if the caller's `style` object also sets those keys.
