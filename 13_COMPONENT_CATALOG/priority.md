# Priority

## 1. Purpose

A compact, non-interactive indicator that shows a High/Medium/Low priority level as a 3-bar ascending "signal strength" glyph (like a signal/battery meter) next to the text label — a denser, more scannable alternative to a plain text word or a colored badge for priority specifically.

## 2. File & Exports

- **File:** `src/shared/components/ui/index.tsx` (lines 247–275)
- **Export:** `export function Priority(props)`
- A near-identical duplicate exists in the superseded legacy file `src/components/ui/index.tsx:122` — not the canonical import.
- Not to be confused with the **`TodoPriority` type** (`@/shared/types`) and `TODO_PRIORITY_CONFIG` (`src/constants/constants.ts`) used for to-do priority badges in `IdeaTodoCard.tsx` — that is a completely separate, bespoke rendering path (colored badge with border, not this bar-meter), even though both represent "priority" conceptually (see §8/§9).

### Exact TS prop signature

```ts
function Priority({ level }: { level: "High" | "Medium" | "Low" })
```

Single required prop, a closed string-literal union — unlike `Badge`'s loose `string` variant, `level` is strictly typed to exactly these three values.

## 3. Variants

No `variant`/`size` props — one fixed rendering, driven entirely by `level`:

- `level` maps to a numeric intensity `n`: `"High"` → `3`, `"Medium"` → `2`, `"Low"` → `1` (line 249).
- Renders exactly **3 bars** (`[1, 2, 3].map(...)`), each:
  - `width: 3px`
  - `height: 3 + b * 2.5` px — i.e. bar 1 = `5.5px`, bar 2 = `8px`, bar 3 = `10.5px` (ascending "staircase" heights, always rendered regardless of `level`).
  - `border-radius: 1px`
  - `background: b <= n ? "#0A0A0A" : "#E0E0DC"` — bars up through the current intensity are filled ink-black; remaining bars are a light gray (`#E0E0DC`, the same token used elsewhere as `scrollbarThumb` in the DNA color set).
- Bars are wrapped in a `flex items-end gap-[3px]` container with fixed `height: 11px`, so all bars align to a shared baseline regardless of individual height.
- Label text (`level` itself, e.g. "High") is rendered after the bar cluster, styled: `fontSize: 11.5px`, `color: #6B7280`, `fontFamily: "JetBrains Mono, monospace"` — this is the JetBrains Mono usage the DNA's typography notes describe for "priority meter" (`typography.families.mono.role`).

## 4. Spacing

- Outer wrapper: `flex items-center gap-1.5` (`6px` gap between the bar cluster and the text label).
- Bar cluster: `flex items-end`, internal `gap: 3px` between the 3 bars, fixed cluster height `11px`.
- No padding, no margin — `Priority` is an inline content group, not a padded chip/pill like `Badge`/`Tag`.

## 5. States

None — no hover, focus, active, disabled, or error states. It is a static, non-interactive `<span>` rendering derived from the `level` prop only; there is no click handling and no way to change priority from within the component itself.

## 6. Motion

None. No `framer-motion` import/usage. Bars render at their fixed height immediately; no grow-in/stagger animation on mount. No entry corresponds to it in `.ai-design-dna/12_DESIGN_TOKENS/animations.json`.

## 7. Usage Rules

- Use `Priority` specifically for a **High/Medium/Low idea/task priority** display where the bar-meter's at-a-glance intensity reading is wanted alongside the text label — it is purpose-built for exactly that 3-level enum (`level` is typed to it, nothing else fits).
- Do not repurpose it for any other 3-tier scale by passing arbitrary strings — TypeScript will reject anything outside `"High" | "Medium" | "Low"`, and the bar-fill logic (`n` derivation) is hardcoded to those exact three words.
- If a colored/badge-style priority indicator is wanted instead of a bar meter (e.g. to match a `Badge`'s pill look), use `Badge` with a manually chosen `variant`, not `Priority` — `Priority` never changes color per level (always ink-black-vs-gray bars, `#6B7280` label), it only changes bar *fill count*, not hue.

## 8. Composition Rules — real call sites

No JSX call sites of `Priority` (`<Priority level=...>`) were found anywhere in `src/features` or `src/shared` at the time of this audit (`grep -rn "<Priority " src` returns zero matches). The component is fully built and exported but currently **unused**.

For contrast, the one place in the product that visibly shows "priority" — to-do priority on idea cards — bypasses `Priority` entirely and uses a different, bespoke mechanism:

- `src/features/ideas/components/IdeaTodoCard.tsx:178-192` — a row of selectable priority pills built from `TODO_PRIORITY_CONFIG[p]`, each rendered as its own colored badge-like button (`cfg.badgeClass`/`cfg.selectedClass`), not `Priority`'s bar meter.
- `src/features/ideas/components/IdeaTodoCard.tsx:307-311` — the read-only display of a to-do's priority also uses `TODO_PRIORITY_CONFIG` directly (`className={... ${priorityCfg.badgeClass}}`), again never importing `Priority`.

## 9. Anti-Patterns

- Don't assume any "priority" UI already visible in the product (e.g. to-do priority chips in `IdeaTodoCard.tsx`) is powered by this `Priority` component — it isn't; that screen uses its own `TODO_PRIORITY_CONFIG`-driven colored badges. Check the actual import before assuming reuse.
- Don't pass a `level` value outside the literal union (`"High" | "Medium" | "Low"`) — there is no default/fallback branch beyond the ternary `level === "High" ? 3 : level === "Medium" ? 2 : 1`, so any other string (if TypeScript were bypassed) would silently render as `n = 1` (Low-looking bars) with the wrong label text.
- Don't expect the bars to recolor per level (e.g. red for High, green for Low) — they are always the same two colors (`#0A0A0A` filled / `#E0E0DC` unfilled) at every level; only the *count* of filled bars changes. If a color-coded priority is the goal, that's a different component to build, not a prop to add casually to this one.
- Since it has zero current callers, verify it renders as expected in context before wiring it into a new feature — it has not been visually exercised in the live product.
- Don't import `Priority` from the legacy `src/components/ui/index.tsx` — always use `src/shared/components/ui/index.tsx` (or the `@/shared/components/ui` barrel).
