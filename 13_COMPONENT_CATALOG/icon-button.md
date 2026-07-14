# IconButton

## 1. Purpose

A square, icon-only pressable control — the icon-glyph counterpart to `Button` for cases where no text label is desired (e.g. a bare close/kebab/action glyph in a toolbar). It is hard-wired to the `ghost` visual treatment; there is no variant prop.

## 2. File & Exports

- **File:** `src/shared/components/ui/index.tsx` (lines 180–200), directly below `Button` in the same `/* ── Button ── */` block.
- **Export:** `export function IconButton(props)`

### Exact TS prop signature

```ts
function IconButton({
  icon: Icon,
  size = "md",
  className = "",
  ...rest
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  size?: BtnSize;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>)
```

Note the differences from `Button`:
- `icon` is **required** (no default, no optional `?`), unlike `Button.icon` which is optional.
- `size` is typed as the full `BtnSize` (`"sm" | "md" | "lg"`) inherited from the `Button` block above, but the implementation (`const s = size === "sm" ? "w-8 h-8" : "w-9 h-9"`) only branches on `"sm"` vs. everything else — passing `size="lg"` produces the exact same `w-9 h-9` box as `size="md"`, since there is no `lg`-specific case in the ternary.
- No `variant`, no `iconRight`, no `children`, no `block` — those `Button`-only props do not exist on `IconButton`.
- Renders a plain `<button>`, same as `Button` (no Framer Motion wrapper).

## 3. Variants & Sizes (exact values)

`IconButton` always applies `btnVariants.ghost` — there is no variant switch:

```
ghost: bg-transparent text-[#6B7280] border-transparent hover:bg-[#F3F4F6] hover:text-[#0A0A0A]
```
i.e. transparent background, `#6B7280` icon color at rest, transparent border, hover fill `#F3F4F6` with icon color transitioning to `#0A0A0A`.

Sizes (`s` local variable, line 190 — only two effective buckets despite the 3-value `BtnSize` type):

| `size` prop | box | icon glyph size |
|---|---|---|
| `"sm"` | `32px × 32px` (`w-8 h-8`) | `14px` |
| `"md"` (default) | `36px × 36px` (`w-9 h-9`) | `15px` |
| `"lg"` | `36px × 36px` (`w-9 h-9`) — **same box as `md`**, no distinct large size exists | `15px` |

Radius: fixed `8px` (`rounded-[8px]`, line 194) for every size — same radius token as `Button`.

Padding is explicitly zeroed: `p-0` — the icon is centered purely by the `btnBase` flex centering (`inline-flex items-center justify-center`) inside the fixed square box, not by padding.

## 4. Spacing

- Box: `32×32px` (`sm`) or `36×36px` (`md`/`lg`, identical) — see table above.
- No internal padding (`p-0`); no gap needed since there is exactly one child (the icon), though `btnBase`'s `gap-2` class is still present in the class string (harmless no-op with a single child).
- Icon glyph itself: `14px` (`sm`) or `15px` (`md`/`lg`), matching `Button`'s icon-size derivation exactly (`size === "sm" ? 14 : 15`).

## 5. States

Identical mechanics to `Button` since both share `btnBase`:
- **Default:** transparent bg, `#6B7280` icon color, transparent border.
- **Hover:** bg → `#F3F4F6`, icon color → `#0A0A0A` (ghost variant hover rule).
- **Active/press:** `active:scale-[0.985]` (same 1.5% shrink as `Button`).
- **Disabled:** `disabled:opacity-40 disabled:cursor-not-allowed` (same flat 40% opacity dim).
- **Focus:** no explicit focus/focus-visible styling defined — same observed gap as `Button`, relies on native browser focus ring.

## 6. Motion

Shares `btnBase` verbatim with `Button`: `transition-all duration-200 active:scale-[0.985] disabled:opacity-40 disabled:cursor-not-allowed`. Same 200ms CSS transition, same `active:scale-[0.985]` press feedback, no Framer Motion involvement, no signature ease-out-expo curve — plain CSS `ease` timing function by Tailwind default.

## 7. Usage Rules

- Use for a single icon-only affordance where a text label would be redundant or space is tight (icon-only toolbar buttons, compact kebab/close/action glyphs).
- Only one visual treatment exists (ghost) — there is no way to render a solid/primary `IconButton`; if a filled icon-only control is needed, compose `Button` with `icon` and no `children` instead (see Anti-Patterns), or use the bespoke inline-styled icon buttons seen elsewhere (e.g. `Modal`'s close button, which is a separate hand-rolled `motion.button`, not `IconButton`).
- Prefer `size="sm"` (32px) in dense toolbars/table rows; `size="md"` (36px) as the general default. Do not reach for `size="lg"` expecting a bigger box — it is a no-op alias of `md` in the current implementation.
- Always pass an accessible label via `aria-label` (passed through `...rest`) since there is no visible text — the component itself does not enforce or default this.

## 8. Composition Rules — real call sites

No usages of `<IconButton` were found anywhere under `src/features/**` (repo-wide `grep -rl "IconButton"` only matches `src/shared/components/ui/index.tsx` itself and the separate legacy `src/components/ui/index.tsx` definition — not any feature call site). This means:

- `IconButton` is a defined, exported primitive that is **currently unused** by any screen/feature in this codebase at the time of this audit.
- Real icon-only buttons observed in `src/features` are instead built either as plain `<Button icon={SomeIcon}>` with no `children` text, or as bespoke inline-styled `<button>`/`motion.button` elements (e.g. the `Modal` close button at `src/shared/components/ui/index.tsx:731-751`, which duplicates similar sizing/hover intent with its own inline styles rather than consuming `IconButton`).
- **Implication for extending the UI:** `IconButton` is the documented/available primitive for new icon-only controls, but there is no existing real-world example to pattern-match against in `src/features`. When adding one, follow the ghost-variant, `w-8 h-8`/`w-9 h-9`, `p-0`, `rounded-[8px]` contract described above exactly, and remember to supply `aria-label` yourself.

## 9. Anti-Patterns

- Do not expect `size="lg"` to produce a bigger box than `size="md"` — verify against the ternary (`size === "sm" ? "w-8 h-8" : "w-9 h-9"`) before assuming a third size tier exists; only two effective sizes are implemented.
- Do not pass `variant` — the prop does not exist on `IconButton`'s type; the ghost look is hard-coded. If a solid-fill icon-only button is needed, use `Button` with `icon` and empty `children`, not `IconButton`.
- Do not copy the legacy `src/components/ui/index.tsx` `IconButton` definition or import from that file — it is the superseded 521-line legacy subset; always import from `src/shared/components/ui/index.tsx`.
- Do not skip `aria-label` — since `IconButton` renders no visible text and the component does not supply a fallback label, omitting it produces an unlabeled control for assistive tech.
- Do not add a new variant-like prop to make `IconButton` "primary-colored" by passing conflicting `className` overrides at random call sites — if a filled icon button is genuinely needed as a recurring pattern, that is a source-level component change (out of scope here), not something to patch per-usage with one-off classes.
