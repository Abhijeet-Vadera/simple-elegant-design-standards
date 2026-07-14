# AvatarStack

## 1. Purpose

Compresses a list of people into a single overlapping row of circular avatars with a `+N` overflow chip — the standard way to show "who's involved" (e.g. multiple assignees/reviewers/participants) without consuming a full row per person.

## 2. File & Exports

- **File:** `src/shared/components/ui/index.tsx` (lines 76–122)
- **Export:** `export function AvatarStack(props)`
- A near-duplicate also exists in the superseded legacy file `src/components/ui/index.tsx:27` — not the canonical import.
- Internally composes `Avatar` (same file, lines 21–74) — it is not a standalone visual, it's a layout wrapper around repeated `Avatar`s plus one bespoke overflow node.

### Exact TS prop signature

```ts
function AvatarStack({
  people = [],
  size = 26,
  max = 4,
}: {
  people: Array<{ name: string; initials?: string }>;
  size?: number;
  max?: number;
})
```

`people` is required (no default despite the `= []` destructure default covering the case it's omitted); each entry only carries `name`/`initials` — no `src`/photo support at the stack level, so avatars rendered inside a stack are always initials-based, never photos.

## 3. Variants

No `variant` prop. Two numeric knobs only:

- **`size`** (default `26`) — forwarded as-is to each inner `Avatar`'s `size` prop; also drives the overflow chip's `width`/`height` and its font-size (`Math.round(size * 0.36)`).
- **`max`** (default `4`) — caps how many real avatars are shown (`people.slice(0, max)`); anyone beyond that is folded into the `+N` overflow chip, where `N = people.length - shown.length`.

Overflow chip (`extra > 0`) styling, all inline `style`, not Tailwind classes:

| Property | Value |
|---|---|
| width / height | `size` px (matches avatar size exactly) |
| font-size | `Math.round(size * 0.36)` px |
| border-radius | `50%` |
| background | `#fff` |
| color | `#6B7280` |
| box-shadow | `0 0 0 2px #fff` |
| margin-left | `-8px` |

## 4. Spacing

- Outer wrapper: `display: flex` (no gap — overlap is achieved via negative margin, not gap).
- Each avatar past the first gets `marginLeft: -8` (8px overlap); the first avatar (`i === 0`) gets `marginLeft: 0`.
- Every avatar (and the overflow chip) gets `boxShadow: "0 0 0 2px #fff"` — a hard-coded 2px white "ring" that fakes a separator/border between overlapping circles against a white background. This is a fixed `#fff`, not the app's `canvas` (`#F7F7F5`) token, so on a non-white background the ring will visibly mismatch.
- The overflow chip also gets `marginLeft: -8` for consistent overlap with the last shown avatar.

## 5. States

- **Default:** renders up to `max` avatars left-to-right, overlapping.
- **Overflow:** when `people.length > max`, appends the `+N` chip; when `people.length <= max`, no chip is rendered at all (`extra > 0` guard).
- **Empty:** `people = []` (default) renders an empty flex container — no empty-state text/icon.
- No hover/focus/disabled states — purely presentational, same as `Avatar`.

## 6. Motion

None. No `framer-motion` import or usage in `AvatarStack`; all overlap/render logic is static JSX driven by array slicing. No animation variant from `.ai-design-dna/12_DESIGN_TOKENS/animations.json` applies.

## 7. Usage Rules

- Use for a **compact group** of people (assignees, reviewers, participants) where showing every name would break the layout — the classic case is a card/table row with limited horizontal room.
- Use plain repeated `Avatar` (not `AvatarStack`) when you need photos, `dark` highlighting, or more than initials — `AvatarStack`'s `people` type has no `src`/`dark` fields, so it can only ever render initials-only chips.
- Pick `max` based on available width: default `4` is tuned for a default `size=26`; shrink `max` if using a larger `size` in a tight column.

## 8. Composition Rules — real call sites

No call sites of `AvatarStack` were found anywhere in `src/features` or `src/shared` at the time of this audit (`grep -rn "<AvatarStack" src` returns zero matches; it is also never imported outside its own definition file). It is a fully built, exported primitive that is currently **unused** in the product. Any future usage should follow the prop shape above exactly — do not extrapolate additional props (e.g. `src`, `dark`, `gap`) that don't exist in source.

## 9. Anti-Patterns

- Don't assume `AvatarStack` supports photos — its `people` prop type is `{ name: string; initials?: string }`, no `src`. If photos in a stack are needed, that's new work outside the scope of "extend with fidelity" (would require modifying the component's prop type and inner `Avatar` calls).
- Don't rely on `+N` and shown-avatars adding up visually distinctly on a non-white page background — the `0 0 0 2px #fff` separator ring is hard-coded to pure white, not the `canvas` (`#F7F7F5`) or `card` (`#FFFFFF`) tokens; on canvas backgrounds this can look like a faint mismatched halo.
- Don't reinvent the overlap-stack pattern ad hoc with custom negative margins elsewhere in the app if this component already exists unused — reuse `AvatarStack` for any new "group of people" UI rather than duplicating its `-8px` overlap + `+N` overflow logic.
- Since it has zero current callers, verify this component still behaves as documented (e.g. via a quick manual render) before depending on it in a new feature — it has not been visually exercised in the live product to the extent other primitives have.
