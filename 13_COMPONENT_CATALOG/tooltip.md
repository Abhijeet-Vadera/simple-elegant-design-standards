# Tooltip

**Category:** Pure-CSS hover label. No JavaScript state, no portal, no Framer Motion.

## Purpose

`Tooltip` shows a small dark label near a wrapped element on hover, using nothing but Tailwind utility classes and the CSS `:hover`/group pattern — there is no `useState`, no mount/unmount, no positioning library. It exists purely to attach a short hint (a full date, a role name, a count description) to an icon or truncated text without JS overhead. It is unrelated to `Menu`/`Dropdown` — it renders no interactive content and cannot be clicked into.

## File & Exports

- File: `src/shared/components/ui/Tooltip.tsx` (full file, 42 lines)
- Export: `Tooltip` (function component), `TooltipProps` interface
- Re-exported from the barrel: `src/shared/components/ui/index.tsx` re-exports `Tooltip` from `./Tooltip` (`02_DESIGN_DNA.json:163`) — import from `@/shared/components/ui`.

## Prop Signature

```ts
export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right"
           | "top-right" | "bottom-right" | "top-left" | "bottom-left";  // default "top"
  className?: string;
  contentClassName?: string;
}
```
(`Tooltip.tsx:3-9`)

If `content` is falsy, `Tooltip` renders only `children` with no wrapper — `if (!content) return <>{children}</>;` (`Tooltip.tsx:18`). This means passing an empty string/`undefined`/`null` as `content` is the sanctioned way to conditionally disable a tooltip without an `if` at the call site.

## Variants (position)

Eight position variants, each a fixed Tailwind class string keyed in `positionClasses` (`Tooltip.tsx:20-29`):

| Position | Classes | Placement |
|---|---|---|
| `top` (default) | `bottom-full left-1/2 -translate-x-1/2 mb-2` | centered above |
| `bottom` | `top-full left-1/2 -translate-x-1/2 mt-2` | centered below |
| `left` | `right-full top-1/2 -translate-y-1/2 mr-2` | centered to the left |
| `right` | `left-full top-1/2 -translate-y-1/2 ml-2` | centered to the right |
| `top-right` | `bottom-full right-0 mb-2` | above, right-aligned |
| `bottom-right` | `top-full right-0 mt-2` | below, right-aligned |
| `top-left` | `bottom-full left-0 mb-2` | above, left-aligned |
| `bottom-left` | `top-full left-0 mt-2` | below, left-aligned |

There is no "auto"/collision-aware placement — the caller must pick the position that won't clip against the viewport (e.g. tooltips near the right edge of a card use `-right`/`bottom-right` variants, as seen in `KanbanScreen` below).

## Exact Styling

Wrapper (`Tooltip.tsx:32`): `relative inline-flex items-center justify-center group/tip` — a **named** Tailwind group (`group/tip`), not the bare `group` class, so nested `Tooltip`s (or other `group-hover` consumers) inside `children` don't cross-trigger each other's hover state.

Bubble (`Tooltip.tsx:34-38`):

| Property | Value |
|---|---|
| position | `absolute`, offset via the position-keyed classes above |
| padding | `px-2.5 py-1` (10px / 4px) |
| background | `bg-[#1A1A1A]` (a dedicated near-black, distinct from the system's `#0A0A0A` ink — closest sibling is `avatarDark.bg: #1A1A1A` in `02_DESIGN_DNA.json:51`) |
| text color | `text-white` |
| border | `border border-white/15` (a translucent white hairline — the only border-on-dark-surface treatment used in this system) |
| shadow | `shadow-xl` (Tailwind's built-in `xl` shadow — notably NOT one of the system's custom `xs/sm/md/lg` ink-tinted shadow tokens; this is a documented exception) |
| font | `text-[11px] font-medium` |
| white-space | `whitespace-nowrap` (bubble never wraps — long content will overflow rather than reflow) |
| border-radius | `rounded` (Tailwind default `4px`) |
| opacity | `opacity-0` idle → `group-hover/tip:opacity-100` on hover |
| transition | `transition-opacity` (Tailwind default duration, ~150ms — no explicit duration class given, so it uses Tailwind's default `150ms`) |
| pointer-events | `pointer-events-none` (the bubble never intercepts mouse events, so hovering the tooltip itself can't retrigger/sustain it — only hovering `children` does) |
| z-index | `z-[100]` (matches `zIndex.modalOverlay`/`drawerOverlay` = `100` in `02_DESIGN_DNA.json:175-176` — high enough to sit above cards/tables, same tier as modal overlays) |

## Motion

**None — by design.** `Tooltip` is explicitly a pure-CSS `group-hover` opacity fade (`opacity-0` → `group-hover/tip:opacity-100` with `transition-opacity`), not a Framer Motion component, and has no JS state (no `useState`, no `useEffect`, no ref) anywhere in the 42-line file. This is a deliberate simplicity choice — every other floating-panel primitive in the system (`Menu`, `Dropdown`'s menu portal, `Modal`) is JS-driven; `Tooltip` is the one exception, appropriate for something this transient and low-stakes. Do not "upgrade" it to Framer Motion/AnimatePresence — that would add mount/unmount cost for a hint label and contradicts the component's whole reason for existing in its current form.

## States

- **Idle** — bubble present in the DOM but `opacity-0` and `pointer-events-none`; effectively invisible and non-interactive.
- **Hover** (`children` hovered) — bubble fades to `opacity-100` via the CSS transition; still `pointer-events-none`.
- **No content** — component short-circuits and renders bare `children`, no wrapper div, no bubble in the DOM at all (`Tooltip.tsx:18`).
- There is no "click to pin open" state, no keyboard-focus-triggered state (no `:focus-within` in the trigger classes), and no delay/debounce on show or hide — it is instant, tied 1:1 to CSS hover.

## Usage Rules

- ALWAYS import `Tooltip` from `@/shared/components/ui`, not by re-implementing hover-label CSS locally — every "info on hover" need in this system should route through this one component for consistent bubble styling (`#1A1A1A` bg, `white/15` border, `shadow-xl`).
- ALWAYS choose the `-right`/`-left` position variant that keeps the bubble inside the viewport/card edge — e.g. `KanbanScreen.tsx` uses `bottom-right` for tooltips anchored to the top-right corner of a card (`KanbanScreen.tsx:201-230`) specifically to avoid clipping.
- Rely on the `!content` short-circuit for conditional tooltips (e.g. only show a role-hover tooltip for certain roles) instead of conditionally rendering `<Tooltip>` at the call site.
- Since content never wraps (`whitespace-nowrap`), keep `content` short (a date, a count sentence, a label) — long paragraphs will overflow, not reflow.

## Anti-Patterns

- **NEVER add JS state to `Tooltip`** (no `useState`/`onMouseEnter` handlers, no portal, no positioning library like Floating UI/Popper) — its entire value proposition is being a zero-JS `group-hover` primitive; if a future need requires click-to-open, focus-trap, or viewport-aware auto-flipping, that is a *different* component (closer to `Menu`'s pattern), not an enhancement to bump into this file.
- NEVER reuse `Menu`'s or `Dropdown`'s Framer Motion variants (`dropdownVariants` etc.) for a tooltip — `Tooltip` intentionally has no Framer dependency at all.
- NEVER give the tooltip bubble one of the system's ink-tinted shadow tokens (`xs/sm/md/lg`) as a "consistency fix" — its `shadow-xl` is a documented, existing exception for this one component, not an oversight to correct.
- NEVER use the bare `group`/`group-hover` Tailwind classes when nesting a new hover-reveal element near an existing `Tooltip` — always use a distinctly named group (following the `group/tip` convention) to avoid cross-triggering unrelated hover states.

## Real Call-Site Examples

- `src/features/ideas/components/StageEvaluationForm.tsx:268,292,305` — icon-button hints ("Edit answer", "Save", "Cancel"), default `position="top"` (implicit on line 268, explicit on 292/305).
- `src/features/ideas/container/KanbanScreen.tsx:201-207` — full-date-on-hover for a relative-date label, `position="bottom-right"`:
  ```tsx
  <Tooltip content={formatDateTime(idea.createdAt)} position="bottom-right">
    <div className="flex items-center gap-[3px] text-[#6B7280] text-[11px] shrink-0 mt-0.5">
      <CalendarIcon width={11} height={11} />
      <span>{formatRelativeDate(idea.createdAt)}</span>
    </div>
  </Tooltip>
  ```
- `src/features/ideas/container/KanbanScreen.tsx:229-233` — attachment-count hint on a paperclip icon, also `position="bottom-right"`.
- `src/features/people/container/InvitesScreen.tsx:150` — role-hover tooltip fed a translation key: `<Tooltip key={r} content={t("people.invitePrimaryRoleHover")}>`.
