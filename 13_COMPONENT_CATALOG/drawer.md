# Drawer

## Status: exported but currently UNUSED (zero call sites)

`grep -rn "<Drawer" src/features src/shared` returns **no matches**. `grep -rn "Drawer" src/features src/shared` (excluding the defining `ui/index.tsx` barrel) also returns **no matches** — no feature or shared file imports or renders `<Drawer>` anywhere in the current codebase.

This is explicitly anticipated in `.ai-design-dna/01_DESIGN_CONSTITUTION.md` rule 65:

> "NEVER treat `Drawer` as dead just because no screen currently uses it visibly — verify with a fresh grep before removing it; if truly unused, flag for removal rather than silently deleting (a documentation task must not delete source code regardless)."

Per that rule: this grep confirms `Drawer` is, at present, genuinely unused dead code in the app layer. It is not being deleted here (out of scope for a documentation task and against rule 65's guidance to flag rather than silently delete) — this is a flag for a future product/engineering decision on whether to remove it or find its first real use case.

## Purpose (as designed, even though unused)

Edge-anchored sliding panel (from the right) intended for persistent/peripheral content the user might want alongside the rest of the screen — e.g. an inspector/detail panel that doesn't need to fully center-block interaction the way `Modal` does. No screen currently has this need; every dialog-like requirement in this codebase so far has been satisfied by `Modal`.

## File / Exports / Prop Signature

- **File:** `src/shared/components/ui/index.tsx` (lines ~762–826)
- **Export:** `export function Drawer({ open, onClose, children, width = 400 })`
- **Props:**
  ```ts
  {
    open: boolean;
    onClose?: () => void;
    children: ReactNode;
    width?: number | string; // default 400 — accepts a raw px number OR a CSS width string (e.g. "50%")
  }
  ```
- Note the prop-type difference from `Modal`: `Drawer.width` accepts `number | string` (rendered as `${width}px` if a number, or passed through verbatim if a string, line 811: `width: typeof width === "number" ? \`${width}px\` : width`), whereas `Modal.width` is `number`-only.

## Panel Styling (exact)

From `src/shared/components/ui/index.tsx:801-819`:

| Property | Value |
|---|---|
| Slide direction | From the right (`initial={{ x: "100%" }}`, `animate={{ x: 0 }}`, `exit={{ x: "100%" }}`) |
| Transition | Spring: `{ type: "spring", damping: 30, stiffness: 300 }` — **not** the shared `SPRING` constant (`stiffness 420, damping 32`) from `src/shared/lib/animations.ts`; this is a bespoke inline spring tuple. Cross-referenced in `02_DESIGN_DNA.json` as `motion.spring.drawerSlide` and in `.ai-design-dna/12_DESIGN_TOKENS/motion.json` `springs.drawerSlide` — both confirm `{ stiffness: 300, damping: 30 }` as the canonical/documented value despite it not being a named exported constant in `animations.ts` itself. |
| Position | `absolute; top: 0; right: 0; bottom: 0` (anchored to the overlay's right edge, full height) |
| Width | `typeof width === "number" ? `${width}px` : width` (default `400px`); `maxWidth: "100vw"` caps it on narrow viewports |
| Background | `#fff` (white surface, same as Modal) |
| Box shadow | `-12px 0 36px rgba(10,10,10,0.12)` — the dedicated "drawer panel" shadow (token: `shadow.drawerPanel` in `02_DESIGN_DNA.json`), distinct from the modal's `shadow.lg`. Note this is a left-cast shadow (negative x-offset) since the panel is right-anchored. |
| Layout | `display: flex; flexDirection: column; overflow: hidden` — set up for a header/body/footer flex-column layout inside `children` |
| Border radius | None specified (flush to the viewport edge — unlike Modal's `16px`, a drawer has no rounded corners since it's edge-anchored) |

Unlike `Modal`, `Drawer` renders **no built-in close button** — there is no `onClose &&` conditional close-icon block in its JSX. Any close affordance (X button, footer "Close" action) must be supplied inside `children` by the consumer.

## Overlay Treatment

Lines ~785-800 — identical scrim mechanics to `Modal`:
- `position: fixed; inset: 0; zIndex: 100` (token: `zIndex.drawerOverlay = 100`, same numeric layer as `zIndex.modalOverlay`)
- Background: `rgba(15,15,15,0.48)` (same canonical scrim color, token `color.overlayScrim`)
- **Click-outside-to-close:** identical `onMouseDown` guard on `e.target === e.currentTarget`
- **Escape-key-to-close:** identical `useEffect`+`window` `keydown` listener pattern (lines 773-780), gated on `open`

The only styling difference between `Modal`'s and `Drawer`'s overlay `motion.div` is that `Modal`'s overlay also carries the flex-centering (`display:flex; alignItems:center; justifyContent:center; padding:32px`) needed to center its panel, while `Drawer`'s overlay has no such flex/padding since its panel is absolutely positioned to the edge instead.

## Framer Motion Variants

- **Overlay** — same `overlayVariants` as `Modal` (imported from `src/shared/lib/animations.ts:32-36`), wrapped in the same `<AnimatePresence>` pattern.
- **Panel** — does **NOT** use a shared `Variants` object (no `modalVariants`-equivalent named `drawerVariants` exists in `src/shared/lib/animations.ts`). Instead it uses inline `initial`/`animate`/`exit` props directly (`{ x: "100%" }` → `{ x: 0 }` → `{ x: "100%" }`) with an inline `transition` spring, bypassing the `variants` prop entirely. This is the one asymmetry between the two components worth flagging for any future maintainer: if `Drawer` is ever wired up for real use, consider promoting this inline animation into a named `drawerVariants`/`drawerTransition` export in `src/shared/lib/animations.ts` for consistency with every other animated primitive in the system (Constitution rule 41).

## Usage Rules: Modal vs. Drawer

- **Default to `Modal`.** Every current dialog need in this codebase — forms, confirmations, previews, QR codes — is met by `Modal`, and it is the only one of the two with any live call sites (24, see `modal.md`).
- **Reach for `Drawer`** only when a feature genuinely needs a non-centered, edge-anchored, persistent side panel that visually reads as "alongside the page" rather than "blocking the page" (e.g., a wide record inspector, a multi-step wizard that shouldn't obscure a list behind it). No such screen exists yet in this codebase.
- Before using `Drawer` in new work: (1) confirm `Modal` truly doesn't fit the interaction, since it's the established, battle-tested primitive; (2) if `Drawer` is adopted, add the missing close button inside `children` and consider promoting its inline spring transition to a named variant in `animations.ts`, since it will be the first real consumer setting that precedent.

## Real Call-Site Examples

**None.** Confirmed via:
```
grep -rn "<Drawer" src/features/** src/shared/**   → no matches
grep -rn "Drawer" src/features/** src/shared/**     → only the definition itself in src/shared/components/ui/index.tsx
```
`Drawer` is exported from the `ui` barrel and listed in `.ai-design-dna/02_DESIGN_DNA.json` (`components.primitiveList`) and `.ai-design-dna/12_DESIGN_TOKENS/components.json` (`primitives`) as part of the primitive set, but has no active consumer anywhere in `src/features/**` or `src/shared/**`.

## Anti-Patterns

- **Never build a bespoke right-side sliding panel outside `Drawer`.** If a future screen needs this pattern, use the existing primitive rather than hand-rolling a new `motion.div` with its own spring/overlay — that would create a second, subtly different sliding-panel implementation.
- **Never delete `Drawer` as "dead code" without a deliberate decision.** Per Constitution rule 65, its unused status must be flagged, not silently removed — this doc is that flag. It is retained by explicit instruction, in line with the same rule, that a documentation task must not delete source code.
- **Never build a bespoke overlay outside `Modal`/`Drawer`/`ModalHost`** for anything app-level and dialog-shaped — see `modal.md`'s Anti-Patterns section for the one documented exception (`SubmissionQRModal`'s full-black-overlay takeover), which is not a pattern to extend to a hypothetical `Drawer` use case either.
- If `Drawer` is finally adopted, don't reuse `Modal`'s `modalVariants` for its panel motion — the two panels move on fundamentally different axes (scale/fade vs. x-axis slide); keep using the spring transition (or promote it to a named `drawerVariants`), not the modal's ease-out-expo curve.
