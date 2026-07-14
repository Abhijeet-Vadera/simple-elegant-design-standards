# Badge

## 1. Purpose

The general-purpose small status/label pill used across tables, cards, and detail panels to communicate a categorical or semantic state (type, status, default/active flag) — the app's single "colored chip" primitive, with a default neutral look plus solid/soft/semantic color variants and an optional leading status dot.

## 2. File & Exports

- **File:** `src/shared/components/ui/index.tsx` (lines 203–245)
- **Export:** `export function Badge(props)`
- A near-identical duplicate exists in the superseded legacy file `src/components/ui/index.tsx:100` — not the canonical import.

### Exact TS prop signature

```ts
function Badge({
  children,
  variant = "",
  mono = false,
  dot = false,
  className = "",
}: {
  children: ReactNode;
  variant?: string;
  mono?: boolean;
  dot?: boolean;
  className?: string;
})
```

`variant` is typed as a loose `string` (not a union of literals) — any string is accepted at the type level; only the 7 keys below actually resolve to real styling, and anything else silently falls back to the default (`""`) look via `variants[variant] || variants[""]`.

## 3. Variants

Base classes shared by every variant (`base`, line 216–217):

```
inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-[11.5px] font-medium border whitespace-nowrap
```

i.e. height `22px`, horizontal padding `10px` (`px-2.5`), pill radius (`rounded-full` = `999px`/`50%`), font-size `11.5px`, font-weight `500`, always bordered.

`variants: Record<string, string>` (lines 218–226):

| Variant key | border | background | text |
|---|---|---|---|
| `""` (default) | `#E5E7EB` | `#FFFFFF` (white) | `#6B7280` |
| `solid` | `#0A0A0A` | `#0A0A0A` | `#FFFFFF` (white) |
| `soft` | transparent | `#F3F4F6` | `#0A0A0A` |
| `success` | `#BBF7D0` | `#DCFCE7` | `#15803D` |
| `warning` | `#FDE68A` | `#FEF3C7` | `#D97706` |
| `danger` | `#FECACA` | `#FEE2E2` | `#B91C1C` |
| `blue` | `#BFDBFE` | `#EFF6FF` | `#1D4ED8` |

`success`/`warning`/`danger` are exactly the semantic triads recorded in `.ai-design-dna/02_DESIGN_DNA.json` (`color.semantic.success/warning/danger`). `blue` corresponds to the same triad as `color.semantic.info` in the DNA file (border/bg/text values match) even though the prop key here is literally `"blue"`, not `"info"` — cite it as `blue` when documenting this component, since that's the real accepted string.

- **`mono` prop:** when `true`, overrides font-size down to `10.5px` (`text-[10.5px]`) — intended for numeric/count content inside a badge (matches DNA's `typography.scale.badgeTextMono`). Does not change font family to the mono typeface despite the name — it only shrinks size; no `font-mono`/`fontFamily` class is applied.
- **`dot` prop:** when `true`, prepends a `6px × 6px` circular dot (`borderRadius: "50%"`, `background: "currentColor"`, `flexShrink: 0`) before `children`, so the dot always matches the badge's own text color.
- **`className`:** appended verbatim at the end of the class string, so callers can override/extend (e.g. `DepartmentsScreen.tsx:316` adds `"capitalize shrink-0"`).

## 4. Spacing

- Fixed height `22px` (`h-[22px]`), matches `controlHeights.badge: "22px"` in the DNA JSON.
- Horizontal padding `10px` each side (`px-2.5`).
- Internal `gap-1.5` (`6px`) between the optional dot and the text content.
- No vertical padding — centering is via `items-center` against the fixed height.

## 5. States

No interactive states are implemented — `Badge` renders a plain `<span>`, not a button. There is no hover/focus/active/disabled styling anywhere in its definition; it is purely a display primitive for status, not an actionable control.

## 6. Motion

None. No `framer-motion` import/usage in `Badge`. Any animated appearance of a badge in a screen (e.g. fading in with a list) comes from a Framer Motion wrapper at the call site (e.g. `staggerItem`/`fadeUp` on a parent row), never from `Badge` itself. Cross-referencing `.ai-design-dna/12_DESIGN_TOKENS/animations.json`, no variant is tied to this component.

## 7. Usage Rules

- Use `Badge` for **semantic/categorical status** (type labels, active/default flags, pass/fail-like states) where a specific color communicates meaning — that's what the `success`/`warning`/`danger`/`blue` variants exist for.
- Use the default (`variant=""`) or `soft` variant for neutral, non-semantic categorical labels (e.g. a role/type chip) when no color meaning is needed.
- Use `solid` for a single, high-emphasis flag that should visually pop as strongly as a `primary` `Button` (ink-black fill) — observed usage: `ProfileScreen.tsx:80` uses `variant="solid"` for a manager/role indicator.
- Use `dot` to add a leading status indicator (e.g. active/inactive) without introducing a second color — observed usage: `InvitesScreen.tsx:216` combines a dynamic `variant` with `dot`.
- Reach for `StagePill` instead of `Badge` specifically for the idea workflow-stage label (submitted/screening/evaluation/pilot/scaled) — `StagePill` owns a dedicated per-stage color lookup (`STAGE_STYLE`) so stage colors stay centralized in one place rather than duplicated as ad hoc `Badge` variant-mapping functions at each call site (though in practice several screens do map their own status → `Badge` variant, e.g. `getTypeBadge()` helpers — see §8).
- Use `Tag` instead of `Badge` only for a fully neutral, non-semantic, static pill with no color/dot/solid option (see `tag.md`) — in practice `Badge`'s default variant covers the same visual need and is used far more often in this codebase.
- `mono` is a size tweak, not a font-family change — don't reach for it expecting JetBrains Mono; if a monospace badge is genuinely needed, add `className="font-mono"` explicitly via the `className` prop.

## 8. Composition Rules — real call sites

- `src/features/workspace-settings/container/WorkspaceSettings.tsx:266` — `<Badge variant="success">{t("workspaceSettings.providerDefault", "Default")}</Badge>`.
- `src/features/people/container/ProfileScreen.tsx:80` — `<Badge variant="solid">...</Badge>` for a high-emphasis role flag.
- `src/features/people/container/InvitesScreen.tsx:216` — `<Badge variant={variant} dot>` combining a dynamically computed variant with the leading status dot.
- `src/features/pitch-session/components/SessionDetailPanel.tsx:20-22` — status-derived variant selection: `danger` for "past", `blue` for "active", default (`""`) for "upcoming".
- `src/features/presentations/container/PresentationScreens.tsx:56,90` — ternary variant selection tied to data state: `variant={p.status === 'Reviewed' ? 'success' : 'warning'}`.
- `src/features/departments/container/DepartmentsScreen.tsx:316` — `<Badge variant="blue" className="capitalize shrink-0">`, demonstrating the `className` escape hatch for text-transform.

## 9. Anti-Patterns

- Don't invent a new `variant` string beyond the 7 defined keys (`""`, `solid`, `soft`, `success`, `warning`, `danger`, `blue`) expecting new styling — any unrecognized string silently renders the default neutral look (`variants[variant] || variants[""]`), which will look like a bug, not a new feature.
- Don't use raw stock Tailwind color utilities (e.g. `bg-emerald-500`, `bg-indigo-600`) via `className` to fabricate an 8th semantic color — the DNA's `inconsistencyFlags` explicitly calls out this exact anti-pattern already occurring in some newer screens and says not to extend it; stick to the 7 canonical variants.
- Don't use `Badge` as a clickable filter/toggle control — it has no `onClick`/button semantics; wrap it in a real button element if it needs to be interactive.
- Don't rely on `mono` to switch typefaces — it only shrinks font-size to `10.5px`; pair it with an explicit mono `className` if the JetBrains Mono family is actually required.
- Don't import `Badge` from the legacy `src/components/ui/index.tsx` — always use `src/shared/components/ui/index.tsx` (or the `@/shared/components/ui` barrel).
