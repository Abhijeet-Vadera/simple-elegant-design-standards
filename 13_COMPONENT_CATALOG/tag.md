# Tag

## 1. Purpose

A minimal neutral pill for wrapping a short piece of static text (a filter chip, category label, or similar) in a rounded, bordered, low-emphasis outline — visually the plainest of the pill-shaped primitives in this codebase (compare `Badge`, `StagePill`).

## 2. File & Exports

- **File:** `src/shared/components/ui/index.tsx` (lines 277–298)
- **Export:** `export function Tag(props)`
- A near-identical duplicate exists in the superseded legacy file `src/components/ui/index.tsx:137` — not the canonical import.
- Not to be confused with the **`Tag` TypeScript type** imported from `@/shared/types` in several feature files (e.g. `src/features/ideas/container/KanbanScreen.tsx:19`, `src/shared/components/modal/TagManagementModal.tsx`) — that `Tag` is a data model (`{ id, name, color, ... }` for idea tags/labels) and is unrelated to this UI component; they merely share a name.

### Exact TS prop signature

```ts
function Tag({ children }: { children: ReactNode })
```

Only prop is `children` — no `variant`, `size`, `color`, `onClick`, or `className` passthrough. Every visual property is fixed.

## 3. Variants

No variant system at all — one fixed appearance, entirely inline `style` (not Tailwind classes):

| Property | Value |
|---|---|
| display | `inline-flex`, `alignItems: center` |
| height | `20px` |
| padding | `0 8px` |
| border-radius | `999px` (pill) |
| font-size | `11px` |
| font-weight | `500` |
| border | `1px solid #E5E7EB` |
| color | `#6B7280` |
| background | `#fff` |
| white-space | `nowrap` |

This exact height (`20px`) matches `controlHeights.tag` recorded in `.ai-design-dna/02_DESIGN_DNA.json` (`components.controlHeights.tag: "20px"`) and `.ai-design-dna/12_DESIGN_TOKENS/components.json`.

## 4. Spacing

- Fixed height `20px`, horizontal padding `8px` each side, no vertical padding (vertical centering via flex).
- No `gap` — `children` is rendered directly with no icon slot or dot, unlike `Badge` (which has an optional `dot` and `gap-1.5`).
- No margin of its own; spacing between multiple `Tag`s is the caller's responsibility (no built-in stack/wrap layout).

## 5. States

None implemented — no hover, focus, active, disabled, or error styling. It is a static, non-interactive `<span>`. Any interactive tag/chip behavior seen in the product (e.g. the "manage tags" trigger button in `IdeaDetailScreen.tsx`) is built from scratch with its own markup, not by wrapping `Tag` (see §8/§9).

## 6. Motion

None. Plain `<span>`, no `framer-motion` import. No entry/exit animation from `.ai-design-dna/12_DESIGN_TOKENS/animations.json` applies.

## 7. Usage Rules

- Use `Tag` for a **static**, single-tone neutral label chip where no semantic color or dot indicator is needed — its only distinguishing trait vs. `Badge`'s default (`variant=""`) styling is font-size (`11px` vs `11.5px`) and height (`20px` vs `22px`); functionally they render nearly identically for the neutral case.
- Prefer `Badge` over `Tag` when you need: a semantic color (`success`/`warning`/`danger`/`blue`), a leading status dot (`dot` prop), a `solid`/`soft` fill, or monospace numeric styling (`mono` prop) — `Tag` has none of these.
- Prefer `StagePill` (not `Tag`) for idea/workflow stage labels (submitted/screening/evaluation/pilot/scaled) — that component owns its own per-stage color lookup (`STAGE_STYLE`) and a `showDot` toggle; `Tag` has no color-mapping concept at all.
- Do not use `Tag` for the idea **data-model tags** (colored labels a user attaches to an idea) — see §9; those are rendered by a bespoke inline-styled `<span>` using each tag's own `color` field, not by this component.

## 8. Composition Rules — real call sites

No JSX call sites of the `Tag` **component** (`<Tag>...</Tag>`) were found anywhere in `src/features` or `src/shared` at the time of this audit (`grep -rn "<Tag>" src` returns zero matches). Every `Tag` reference found in the codebase resolves to the unrelated `Tag` **TypeScript type** from `@/shared/types`, e.g.:

- `src/features/ideas/container/KanbanScreen.tsx:19,122` — `import type { ..., Tag } from "@/shared/types"` and `const cardTags = (idea.tags ?? []) as unknown as Tag[]`.
- `src/features/ideas/container/IdeaDetailScreen.tsx:591-601` — idea tags are rendered with a **hand-rolled** `<span>`, not `Tag`:
  ```tsx
  {ideaTags.map((tag) => (
    <span key={tag.id} style={{ background: tag.color, color: tagTextColor(tag.color) }}
      className="text-[11.5px] font-semibold px-2.5 py-[3px] rounded-pill">
      {tag.name}
    </span>
  ))}
  ```
- `src/shared/components/modal/TagManagementModal.tsx` — manages the same data-model `Tag[]` (create/edit/delete idea tags), also without ever importing the UI `Tag` component.

The `Tag` UI primitive itself is a fully built, exported component with zero observed real-world usage in this product.

## 9. Anti-Patterns

- Don't assume idea/category "tags" visible in the product UI (colored chips on ideas, e.g. `IdeaDetailScreen.tsx:591-601`) are built with the `Tag` component — they are not; they're custom `<span>`s driven by each tag's own dynamic `color`/`tagTextColor()` values, because `Tag` has no color prop to support that.
- Don't import the `Tag` **type** and the `Tag` **component** into the same file without an alias — they share a name and importing both from `@/shared/types` and `@/shared/components/ui` in one file will collide.
- Don't extend `Tag` with an ad hoc `color`/`variant` prop inline at a call site to reproduce colored idea-tag chips — that duplicates `Badge`'s semantic-variant system; if a colored static pill is needed, reach for `Badge`, not a patched `Tag`.
- Don't import `Tag` from the legacy `src/components/ui/index.tsx` — use only `src/shared/components/ui/index.tsx` (or its `@/shared/components/ui` barrel).
