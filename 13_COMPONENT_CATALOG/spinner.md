# Spinner

## Purpose
The single canonical loading indicator primitive in the design system: a rotating ring built from a bordered circle, animated with Framer Motion. Used inline — inside buttons (replacing label text while a mutation is pending), inside compact panel regions (notification bell), and as the visual core of `DataLoader` for full-section loading.

## File / Exports / Prop Signature
- **File:** `src/shared/components/ui/index.tsx`
- **Export:** `export function Spinner(...)`, lines 1124–1145
- **Props:**
  ```ts
  {
    light?: boolean; // default false
    size?: number;   // default 16
  }
  ```
- Built on `motion.span` from `framer-motion` (`import { motion, AnimatePresence } from "framer-motion";` at line 11 of the same file).

## Exact Styling
Source: `src/shared/components/ui/index.tsx:1132-1143`.

**Animation (Framer Motion):**
```ts
animate={{ rotate: 360 }}
transition={{ duration: 0.7, ease: "linear", repeat: Infinity }}
```
- Full 360° rotation, `0.7s` per cycle, linear easing, infinite repeat. This is a bespoke animation value — it does **not** reuse any named constant from `.ai-design-dna/12_DESIGN_TOKENS/motion.json` (no `EASE_OUT`/`EASE_FAST`, no spring). Treat `0.7s linear infinite` as the dedicated spinner-only timing, separate from the rest of the motion system's signature easing (`cubic-bezier(0.16, 1, 0.3, 1)`).

**Static styling:**
| Property | Value |
|---|---|
| `display` | `inline-block` |
| `width` / `height` | `size`px / `size`px (default `16`) |
| `border-radius` | `50%` (token: `radius.circle`) |
| `border` | `2px solid` — color depends on `light` |
| `border-top-color` | overridden to create the "gap" that reads as motion — color depends on `light` |

**Color variants:**
| Variant | `border` color | `border-top-color` |
|---|---|---|
| `light={false}` (default, "dark-on-light" use) | `#D1D5DB` (token: `border.strong`) | `#0A0A0A` (token: `ink`) |
| `light={true}` (for use on dark backgrounds, e.g. inside a black primary button) | `rgba(255,255,255,0.3)` | `#fff` |

## States
`Spinner` has no internal state — it is purely a presentational, always-animating primitive. The only variance is the `light`/`size` prop combination chosen by the caller to match the surrounding surface.

## Usage Rules
- `light={false}` (default) on light surfaces (white cards, gray tracks); `light` on dark surfaces (black primary buttons, dark modals) — always match the boolean to the background it sits on, per the existing call sites.
- Size conventions observed across the codebase: `12` for tiny inline text-button spinners, `14` inside compact modal-submit buttons, `16` default/inline row spinners, `20` for slightly larger inline loaders, `24` for standalone centered loaders in auth screens.
- Never used with a label rendered simultaneously in place of text — the common pattern is a ternary: `{isLoading ? <Spinner light /> : "Submit"}`, i.e. the spinner *replaces* the label rather than sitting beside it.

## Real Call-Site Examples
- `src/components/modal/StageMovementModal.tsx:196` — `{isLoading ? <Spinner light /> : t("modal.stageMoveConfirmButton", "Confirm move")}` inside a dark primary button.
- `src/features/ideas/container/CreateIdeaScreen.tsx:543` — same replace-label-with-spinner pattern on submit.
- `src/features/notifications/components/NotificationBell.tsx:353` and `:366` — `<Spinner size={12} />` replacing "Mark all read"/"Clear all" text buttons.
- `src/features/notifications/components/NotificationBell.tsx:382` — `<Spinner size={20} />` centered in a `flex items-center justify-center py-8 px-4` wrapper for the panel's initial load.
- `src/features/notifications/components/NotificationBell.tsx:447` — `<Spinner size={16} />` for infinite-scroll pagination loading.
- `src/features/public/container/PublicBalanceScreen.tsx:525` — `<Spinner /> {t("public.sendingCodeButton", "Sending code…")}` — one of the few sites where the spinner sits *beside* text rather than replacing it.

## Anti-Patterns
- **Never hand-roll a spinner.** Three real violations exist in the codebase today and should not be used as precedent for new code:
  - `src/components/shared/DataTable.tsx:146` — `<span className="w-4 h-4 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />`, a Tailwind `animate-spin` re-implementation using off-token grays (`gray-200`/`gray-800` instead of `#D1D5DB`/`#0A0A0A`).
  - `src/features/ideas/components/UploadDocumentModal.tsx:312` — another `animate-spin`-based spinner.
  - `src/features/ideas/components/StageEvaluationForm.tsx:299` — `<span className="... border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />`, which additionally violates the palette rule in `.ai-design-dna/12_DESIGN_TOKENS/colors.json` (`doNotUse.stockPaletteFamilies` explicitly lists `"indigo"` as tech debt, not canonical).
  - Any new loading affordance should import `Spinner` from `@/shared/components/ui` instead of adding another CSS `animate-spin` div.
- Do not invent new duration/easing values for spinner rotation — `0.7s linear infinite` is the one canonical timing; do not "improve" it per screen.
- Do not use `Spinner` for progress that has a known percentage/determinate value — that calls for a progress bar, not an indeterminate ring.
