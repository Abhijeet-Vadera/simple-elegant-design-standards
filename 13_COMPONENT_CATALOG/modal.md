# Modal

## Purpose

Centered, overlay-backed dialog for focused single-task interactions: forms (create/edit records, invites, sections, stages), confirmations, previews (document/file), and QR/record display. It is the default "app-level dialog" primitive — the vast majority of dialogs in this codebase are a `Modal`, not a `Drawer`.

## File / Exports / Prop Signature

- **File:** `src/shared/components/ui/index.tsx` (lines ~673–759)
- **Export:** `export function Modal({ open, onClose, children, width = 480 })`
- **Props:**
  ```ts
  {
    open: boolean;
    onClose?: () => void;
    children: ReactNode;
    width?: number; // default 480 — sets maxWidth in px
  }
  ```
- Notes:
  - `onClose` is optional. If omitted, the close ("X") button in the top-right is not rendered at all (see line ~730: `{onClose && <motion.button ...>}`), and click-outside/Escape become no-ops (`onClose?.()`). Several call sites exploit this to build a "can't dismiss while saving" state, e.g. `src/shared/components/modal/ConfirmationModal.tsx:207` passes `onClose={saving ? undefined : closeModal}`.
  - `width` is a plain number (px), not a size-token enum (`sm`/`md`/`lg`) — every call site picks an exact pixel value (see Real Call-Site Examples below).

## Panel Styling (exact)

From `src/shared/components/ui/index.tsx:717-729`:

| Property | Value |
|---|---|
| Background | `#fff` (white surface) |
| Border | `1px solid #E5E7EB` (token: `color.border`) |
| Border radius | `16px` (token: `radius.lg` — modals are deliberately NOT the generic `12px` card radius) |
| Box shadow | `0 24px 60px rgba(10,10,10,0.14)` (token: `shadow.lg`, ink-tinted, never pure black) |
| Width | `100%` up to `maxWidth: width` prop (default `480px`) |
| Overflow | `hidden` |
| Position | `relative` (so the close button can be absolutely positioned inside it) |

Close button (rendered only if `onClose` is passed), lines ~730-751:
- `30px × 30px`, `border-radius: 7px`, positioned `top: 18px; right: 18px`
- Transparent background, hover fill `#F3F4F6` (token: `color.hoverSurface`) via `whileHover`, `duration: 0.15` (documented as `motion.durations.modalCloseButtonHover` in `02_DESIGN_DNA.json`)
- Icon: `XIcon` at `16×16`, color `#9CA3AF` (token: `color.textTertiary`)

## Overlay Treatment

Lines ~697-716:
- Full-viewport fixed scrim: `position: fixed; inset: 0; zIndex: 100` (token: `zIndex.modalOverlay = 100`)
- Background: `rgba(15,15,15,0.48)` — the canonical scrim color (token `color.overlayScrim` in `02_DESIGN_DNA.json`), used identically by `Drawer`
- Flex-centers the panel: `display: flex; alignItems: center; justifyContent: center; padding: 32px` (token: `spacing.commonInlinePx.modalOverlayPadding`)
- **Click-outside-to-close:** `onMouseDown` checks `e.target === e.currentTarget` (i.e. the scrim itself, not a bubbled child click) and calls `onClose?.()`
- **Escape-key-to-close:** a `useEffect` (lines 685-692) attaches a `window` `keydown` listener only while `open` is true, calling `onClose?.()` on `e.key === "Escape"`, and cleans up on unmount/close

## Framer Motion Variants

Both imported from the canonical `src/shared/lib/animations.ts` — **never** from the legacy, drifted `src/lib/animations.ts` (which has modal duration `0.42s` vs. the canonical `0.28s`).

- **Overlay** — `overlayVariants` (`src/shared/lib/animations.ts:32-36`):
  ```ts
  hidden: { opacity: 0 }
  show:   { opacity: 1, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }  // secondaryEasing
  exit:   { opacity: 0, transition: { duration: 0.18 } }
  ```
- **Panel** — `modalVariants` (`src/shared/lib/animations.ts:38-42`):
  ```ts
  hidden: { opacity: 0, y: 10, scale: 0.984 }
  show:   { opacity: 1, y: 0, scale: 1, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.28 } }  // signature ease-out-expo
  exit:   { opacity: 0, y: 6, scale: 0.99, transition: { duration: 0.2 } }
  ```
- Both wrapped in a single `<AnimatePresence>` so overlay and panel mount/unmount together; the panel `motion.div` does not repeat `initial`/`animate`/`exit` props — it inherits them from the parent `AnimatePresence` context via the `variants` prop and the parent's `initial="hidden" animate="show" exit="exit"`.
- Confirmed identical values in `.ai-design-dna/02_DESIGN_DNA.json` (`motion.signatureEasing`/`secondaryEasing`/`durations.modalShow`/`modalExit`) and `.ai-design-dna/12_DESIGN_TOKENS/animations.json` / `motion.json`.

## Usage Rules: Modal vs. Drawer

- **Use `Modal`** for anything that behaves like a discrete, centered task: create/edit forms, confirmations, previews, QR/record display, migration/deletion dialogs. This is the default and near-universal choice in this codebase (24 active call sites vs. 0 for `Drawer` — see `drawer.md`).
- **Use `Drawer`** only for a persistent, edge-anchored panel that the user might want alongside other on-screen content (e.g. a side inspector that doesn't fully block interaction with the rest of the page) — this pattern is currently unused; if you reach for it, first confirm no `Modal` composition already solves the need, per Constitution rule 65.
- **For any app-level/global dialog** (i.e. one triggered from anywhere via shared state rather than local component state), route it through `ModalHost` (`src/shared/components/modal/Modals.tsx:770`, mounted once in `src/shared/components/layout/Shell.tsx:609`) + `useUiStore().openModal(type, payload)` / `closeModal()`. Feature-local modals (e.g. a modal scoped to one screen's local `useState`) may render `<Modal>` directly without going through `ModalHost`.

## Real Call-Site Examples

24 active `<Modal` usages found via `grep -rn "<Modal" src/features src/shared`:

| File:line | width |
|---|---|
| `src/features/ideas/components/DocumentPreviewModal.tsx:31` | `1024` |
| `src/features/ideas/components/UploadDocumentModal.tsx:182` | `540` |
| `src/features/settings/container/SettingsScreens.tsx:710` | (multiline) |
| `src/features/ideas/components/FileAnswerDisplay.tsx:72` | `860` |
| `src/features/ideas/container/IdeaDetailScreen.tsx:783` | (multiline) |
| `src/features/workflow/components/MigrationModal.tsx:32` | `460` |
| `src/features/workflow/components/SectionFormModal.tsx:64` | `460` |
| `src/features/workflow/components/StageFormModal.tsx:92` | `960` |
| `src/features/people/components/CreateInviteModal.tsx:126` | (multiline) |
| `src/features/workflow/components/SectionsManagementModal.tsx:123` | `520` |
| `src/features/workflow/components/SectionsManagementModal.tsx:236` | `420` |
| `src/features/workflow/components/DeleteModal.tsx:22` | `420` |
| `src/features/people/components/RecordModal.tsx:127` | `440` |
| `src/features/rewards/modal/RecordTransactionModal.tsx:101` | `440` |
| `src/features/pitch-session/components/AssignedIdeaCard.tsx:376` | (multiline) |
| `src/features/pitch-session/components/CreateSessionModal.tsx:55` | (multiline) |
| `src/features/departments/container/DepartmentsScreen.tsx:96` | `450` |
| `src/features/departments/container/DepartmentsScreen.tsx:201` | `420` |
| `src/features/departments/container/DepartmentsScreen.tsx:272` | `520` |
| `src/shared/components/modal/ChangeSubmitterModal.tsx:85` | `460` |
| `src/shared/components/modal/SwitchRoleModal.tsx:102` | `460` |
| `src/shared/components/modal/Modals.tsx:92,266,472,625,710` | `460`/`480`/`460`/`440`/`400` (5 `ModalHost`-routed dialogs in one file) |
| `src/shared/components/modal/StageMovementModal.tsx:49` | `480` |
| `src/shared/components/modal/RejectIdeaModal.tsx:50` | `460` |
| `src/shared/components/modal/ConfirmationModal.tsx:207` | `440` |

Observed `width` values cluster tightly around `400-480px` (the vast majority), with a few deliberate wide outliers for content-heavy modals: `540` (document upload), `860`/`1024` (file/document preview), `960` (stage form builder). Default (`480`) is used implicitly by the ~5 `ModalHost`-routed dialogs in `Modals.tsx` and explicitly at `StageMovementModal.tsx:49`.

## Anti-Patterns

- **Never build a bespoke fixed-overlay dialog outside `Modal`/`ModalHost` for anything that behaves like an app-level dialog.** The one documented exception in this codebase is `src/shared/components/modal/SubmissionQRModal.tsx` — it hand-rolls its own `motion.div` overlay with `boxShadow: "0 32px 80px rgba(0,0,0,0.6)"` (pure black, not ink-tinted) for a genuinely full-viewport takeover. This is flagged in `02_DESIGN_DNA.json` (`shadow.outlierFullScreenModal`) and `01_DESIGN_CONSTITUTION.md` rule 39 as a documented one-off, **not** a pattern to copy.
- Never import `modalVariants`/`overlayVariants` from the legacy `src/lib/animations.ts` — durations have drifted (0.42s vs. canonical 0.28s).
- Never hand-roll a new close-button, Escape-listener, or click-outside handler — `Modal` already implements all three; compose it instead of reimplementing.
- Never pick a `width` value that isn't a plain, reasoned pixel number close to the observed cluster (~400-480px default, wider only for genuinely content-heavy panels like document previews or the 960px stage-form builder).
- Never round a modal panel to the generic `12px` card radius — `16px` is specifically reserved for modal panels to visually distinguish them from cards (Constitution rule 35).
