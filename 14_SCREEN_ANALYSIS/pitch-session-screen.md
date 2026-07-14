# Screen Analysis — Pitch Session Screen

Source of truth: `src/features/pitch-session/container/PitchSessionScreen.tsx`, `src/features/pitch-session/components/{PitchPoolPanel,SessionListPanel,PitchIdeaCard,PitchCardSkeleton,CreateSessionModal}.tsx`, `src/features/pitch-session/types/index.ts`, `src/routes/routes.config.ts:135-144`. Tokens cited from `.ai-design-dna/12_DESIGN_TOKENS/*` and personality claims from `.ai-design-dna/00_PROJECT_IDENTITY.md`.

## Purpose & access

Route `/pitch-sessions` (route id `pitch-sessions`), gated to `access: ["admin", "management", "manager"] as Role[]` — regular employees never see it. Route metadata description (verbatim, `routes.config.ts:141`): **"Create and manage pitch sessions with ideas and documents."**

Functionally: a scheduling/triage workspace. It holds a **pool of ideas that have graduated to "pitch-ready" status** on one side, and a **calendar of pitch sessions** (upcoming/past, each with a date, optional title, and an assigned set of ideas) on the other. The job of the screen is to move ideas out of the pool and into a specific session before that session's date arrives.

Only the `manager` role can create sessions (`topbarActions` and the empty-state "create session" button both check `role === "manager"`) and only `manager` can drag/assign ideas (`dragEnabled` excludes `admin` and `management`). `admin` and `management` land on this screen in a **read-only capacity** — they can browse pool/sessions but cannot drag, and see no "Create Session" button. This matches the product-wide privacy/oversight posture described for the `management` role in `00_PROJECT_IDENTITY.md` (oversight role, restricted write access) and extends the same restriction to `admin` on this specific screen.

## Layout

Single `Shell` page, `contentClass="page-wide"` (max-width removed, flex column, no search bar — `showSearch={false}`), with one primary action slot in the topbar (`Create Session` button, manager-only).

Below the topbar, the entire page body is **one bordered rounded container** (`border border-[#E5E7EB] rounded-xl`, matches the DNA's hairline-border-over-shadow convention) split into a **two-panel responsive grid**, mobile-first:

- Mobile (`<md`): stacked flex-column — pool panel on top (capped `max-h-[360px]`, its own internal scroll), session panel below filling the rest.
- `md` and up: CSS grid, columns widening the session (right) panel as viewport grows:
  - `md`: `38% / 62%`
  - `lg`: `32% / 68%`
  - `xl`: `28% / 72%`
  - `2xl`: `25% / 75%`

This progressive column skew (pool shrinks, session detail grows) signals that the **session/assignment panel is the primary work surface**, and the pool is a supporting reference list, not a co-equal panel — a "task queue + workbench" layout rather than a split-view.

Panel boundary: `border-r` on the pool panel (desktop) / `border-b` (mobile) — a single hairline divider, no shadow between panels, consistent with the DNA's "hairline borders instead of heavy shadows" default.

The whole page is wrapped in a single `<DndContext>` spanning both panels plus a `<DragOverlay>` root, plus the `CreateSessionModal` mounted at screen level (not nested inside either panel) so it can be opened from either the topbar action or the session panel's empty-state CTA.

### Pool panel (`PitchPoolPanel`, left/top)

- Own header row, `h-[56px]`, white background (contrasts with the panel's own `#F9F9F8` warm-gray body), left-aligned title + a rounded pill idea-count badge (`bg-[#F3F4F6]`, `rounded-full`, only rendered when count > 0).
- Body is a `useDroppable` drop target (`id: "pitch-pool"` — the "return to pool" zone for removing an idea from a session via drag).
- Single persistent scroll container regardless of loading state (explicit code comment: avoids the scrollbar/gutter toggling between skeleton and loaded states — `[scrollbar-gutter:stable]` reserved permanently).
- States: skeleton (3 stacked `PitchCardSkeleton`), empty (centered icon + two-line message: "No ideas ready" / "Move ideas to pitch stage"), loaded (vertical stack of `PitchIdeaCard`, `gap-3`, `p-4`), and a drag-over overlay (dashed blue border card, "Drop to return to pool" / "Release to confirm", underlying cards dimmed to `opacity-30`).

### Session panel (`SessionListPanel`, right/bottom — the actual "detail" surface, not a list)

Despite the name, this is a **combined session-picker + session-detail panel**, not a list of session cards:

- Header (`h-[56px]`, white): a compact two-`Dropdown` picker on the left — category select (`Upcoming` / `Past Sessions`, `w-[140px]`) and, dependent on category, a session-date select (`w-[160px]`, options formatted via `formatDate`, disabled + placeholder text when the category has zero sessions) — plus the active session's title right-aligned (`ml-auto`, truncated).
- Body is the second `useDroppable` target (`id: "session-detail-drop-zone"` — where pool ideas land when dragged in), background `#F9FAFB` (slightly different off-white than the pool's `#F9F9F8`, a subtle panel-identity cue).
- States: loading skeleton header bar + `PitchCardSkeleton` grid; no-active-session empty state (centered message + manager-only "Create Session" button); loaded — a **card grid** of assigned ideas (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`, `gap-4`), sorted by `orderIndex`; zero-ideas-in-session sub-state is a dashed-border placeholder box (message differs by role: "Drag ideas from the left panel" for managers vs. "No ideas assigned" for read-only roles).
- The same drag-over dashed-blue-card overlay pattern as the pool panel appears here too ("Drop to add to session").

Session selection defaults to **the nearest upcoming session** (`sessionDate >= today`, earliest first) unless the user has explicitly picked one; switching category (Upcoming/Past) auto-selects that category's first session. A `isPastSession` check disables drag entirely once the active session's date is in the past — past sessions are frozen/historical, not editable.

## Hierarchy

1. Page title in Topbar ("Pitch Sessions" via `t("pitchSession.screenTitle")") + one primary CTA button (`Create Session`, manager-only, `PlusIcon`).
2. Panel headers (14px semibold, `tracking-[-0.01em]`) — pool count badge is the only secondary hierarchy element in that row.
3. Session picker dropdowns sit at the same header height as the pool title, establishing them as the peer-level navigation control for the right panel.
4. Card grid/stack content is the densest layer — each `PitchIdeaCard` internally layers idea number chip > submitter name > relative date > title > description snippet > tag swatches/file count > manager name, i.e. identifier-first, narrative-last ordering typical of the product's "quiet precision" personality.
5. Empty/loading states are deliberately quiet (muted gray text, no color), never competing with real content.

## Spacing

- Panel headers fixed at `h-[56px]` in both panels (consistent handshake row height across the split).
- Panel content padding: pool `p-4`, session grid `p-5` — the busier/primary panel gets slightly more breathing room.
- Card stack gap `gap-3` (pool, single column); card grid gap `gap-4` (session, multi-column).
- Card internal padding `px-3 py-[11px]` with `space-y-3` between internal blocks (`PitchIdeaCard`), footer separated by `border-t border-[#F3F4F6] pt-3` — matches the DNA's compact card padding step, denser than the `IdeaRow` list-row padding (`13px 18px`) documented in the component catalog, appropriate since these are draggable cards, not flat rows.
- Outer page container uses a single `rounded-xl` border with zero gap between panels — the hairline `border-r`/`border-b` divider is the entire separation mechanism, no gutter.

## Typography

- Panel titles: 14px / semibold / `tracking-[-0.01em]`, ink (`#0A0A0A]`) — same "eyebrow-adjacent" weight used for section headers elsewhere in the product.
- Active session title (right-aligned in session header): same 14px/semibold treatment, truncated.
- Idea-count pill: 11px medium, `#6B7280` on `#F3F4F6]` — smallest text on the page other than tooltips.
- Card idea-number chip: 10px bold mono-adjacent chip (`bg-[#F3F4F6]`) — the identifier token, though rendered in the default sans stack here rather than JetBrains Mono (a deviation from the DNA's stated "mono for machine-ish data" rule — worth flagging for any future rework, not a bug to silently "fix").
- Card submitter name: 12px, weight 450 (the product's characteristic "in-between" weight step, also seen in `IdeaRow`).
- Card title: 13.5px semibold, 2-line clamp.
- Card description: 12px, 2-line clamp, slightly lighter ink (`#35383e`).
- Empty-state heading: 13px semibold; empty-state body: 12px, `#9CA3AF`, `leading-relaxed`.
- Modal title (`CreateSessionModal`): 17px semibold, `tracking-[-0.012em]` — the largest type on this whole screen, reserved for the modal's own heading, reinforcing that session *creation* is treated as a bigger moment than anything in the persistent layout.

## Components used

- `Shell` (page chrome/topbar host, `contentClass="page-wide"`)
- `Button` (topbar "Create Session" CTA, modal Cancel/Submit)
- `PlusIcon` (topbar CTA icon)
- `PitchPoolPanel` (left/top panel, wraps `PitchIdeaCard` + `PitchCardSkeleton`, owns the "pitch-pool" droppable zone)
- `SessionListPanel` (right/bottom panel; wraps `Dropdown` ×2, `PitchIdeaCard`, `PitchCardSkeleton`; owns the "session-detail-drop-zone" droppable zone)
- `PitchIdeaCard` (draggable idea card, shared by both panels and the `DragOverlay`; internally uses `Avatar`, `CalendarIcon`, `PaperclipIcon`, tag color swatches)
- `PitchCardSkeleton` (loading placeholder, stack or grid mode via `grid` prop)
- `CreateSessionModal` (screen-level modal; wraps `Modal`, `Field`, `Input`, `Textarea`, `DatePicker`, `Button`)
- `Dropdown` (session category + session date pickers, from `@/shared/components/ui/Dropdown`, backed by `react-select`)
- `DndContext` / `DragOverlay` / `useDraggable` / `useDroppable` (`@dnd-kit/core`) — the cross-panel drag machinery
- Not used by this screen despite living in the same feature folder: `SessionCard`, `AssignedIdeaCard`, `SessionDetailPanel`, `BulkActionBar` — grep across `src/` confirms these four components have **no import references anywhere in the app**; they are dead/superseded code (likely an earlier layout iteration where sessions were a separate list + detail pair and bulk multi-select assignment existed) and should not be treated as part of the live pattern for this screen.

## Interaction

- **Creating a session**: `CreateSessionModal`, opened via the topbar `Create Session` button (managers only) or the session panel's empty-state CTA (also manager-gated). Form fields: optional title (`Input`), required date (`DatePicker`, inline error "Pitch date is required" if submitted empty), optional notes (`Textarea`). Submit button label is state-dependent: "Creating…" while pending, "Create Session" normally — the "Create Session and Add Ideas" / `selectedCount` copy path exists in the modal's props/i18n but the screen always calls it with `ideaIds: []`, so in current usage the "adding N ideas at creation time" flow is wired in the component but not exercised from this screen (bulk pre-selection appears to be more dead/partial code, consistent with the unused `BulkActionBar`). On success: toast, cache invalidation for both `pitch-sessions` and `pitch-pool` queries, modal closes.
- **Assigning ideas to a session — drag only, no click-to-assign path exists.** `PitchIdeaCard` is clickable, but its `onClick` navigates to `/ideas/:id` (the idea detail screen), not to assignment — assignment is exclusively achieved by dragging a card from the pool onto the session panel's drop zone, or dragging a card out of the session grid back onto the pool. There is no button, checkbox, or menu action anywhere in this screen's live code path for assigning/unassigning an idea; the only affordance is the drag gesture itself (cards have `touch-none select-none` and switch cursor to `cursor-grabbing` while dragging).
- Drag activation requires an 8px pointer movement (`PointerSensor` `activationConstraint: { distance: 8 }`) — guards against accidental drags from a simple click-to-navigate tap.
- Drag feedback: the dragged-from card fades to `opacity-0` in place; a floating `DragOverlay` clone (fixed `w-[280px]`, heavier shadow `0 8px 24px rgba(0,0,0,0.12)`, `cursor-grabbing`) follows the pointer; the receiving drop zone highlights (`bg-blue-50` panel tint) and shows a dashed-blue-border confirmation card ("Drop to add to session" / "Drop to return to pool", "Release to confirm") while non-target cards in that zone dim to `opacity-30`.
- Drag is fully disabled (`dragEnabled = false`) when: no active session is selected, the active session is in the past, or the current role is `admin`/`management`. Disabling `dragEnabled` also disables the pointer-grab cursor and drop-zone registration — it degrades cleanly to a read-only browsing experience rather than showing disabled drag handles.
- Both add-to-session and remove-from-session mutations are **optimistic**: pool/session query caches are patched immediately in `onMutate`, rolled back in `onError` with a toast ("Failed to add idea, reverted" / "Failed to remove idea"), and reconciled via `invalidateQueries` in `onSettled` regardless of outcome.
- Switching the category dropdown (Upcoming/Past) auto-jumps to that category's first session if the current selection isn't already in it; switching the session dropdown directly calls `onSelectSession`.

## Accessibility

- No visible keyboard-operable alternative to drag-and-drop assignment was found in this screen's code — `useDraggable`/`useDroppable` from `@dnd-kit/core` support keyboard sensors in general, but this screen only wires up `PointerSensor`, so keyboard users cannot reassign ideas at all through this UI (can only navigate into an idea via click/Enter on a card, since the card is a plain `div` with an `onClick`, not a `<button>` — no explicit `role`/`tabIndex`/`onKeyDown` were found on `PitchIdeaCard`, so it is likely not keyboard-focusable either).
- Drop-zone confirmation copy ("Release to confirm") is purely visual (colored dashed box), with no `aria-live` region observed announcing drag state changes to assistive tech.
- Disabled dropdown states (`isDisabled` on `Dropdown` when a category has zero sessions) rely on the underlying `react-select` component's native disabled semantics.
- Empty/loading states use plain text with sufficient contrast (`#9CA3AF`/`#6B7280` on white/off-white), consistent with the rest of the product's muted-gray convention, but no explicit `aria-busy`/`aria-live` wiring was found around the loading-skeleton swap.
- This matches the product's overall posture noted in `00_PROJECT_IDENTITY.md`: desktop-first, information-forward, with accessibility conventions inherited from shared primitives (`Button`, `Modal`, `Dropdown`) rather than screen-specific ARIA authored here.

## Data density

High. Every `PitchIdeaCard` packs: idea number, submitter (with hover tooltip revealing avatar + email), relative + absolute (tooltip) creation date, 2-line title, 2-line description, an arbitrary number of tag color swatches (each with its own name tooltip), file-attachment count, and manager name — eight-plus data points in a single ~280px-wide card with `px-3 py-[11px]` padding. Combined with a dense 3-column grid on the session side and a scroll-heavy single column on the pool side, this is squarely in the product's documented "dense, desktop-first, information-forward" register (`00_PROJECT_IDENTITY.md`), tuned for someone triaging many ideas across many sessions, not a glanceable summary view.

## Reusable ideas

- The "single persistent scroll container, only inner content swaps on loading" pattern (explicit inline comments in both `PitchPoolPanel` and `SessionListPanel`) is a deliberate anti-jank technique worth generalizing: keep `overflow-y-auto` + `[scrollbar-gutter:stable]` mounted permanently and swap only the children (skeleton vs. empty vs. loaded), rather than conditionally mounting/unmounting the scroll container itself.
- The drag-over confirmation card (dashed blue border, white fill, two-line message stack, centered over a dimmed `opacity-30` backdrop of existing content) is a self-contained, reusable "drop target confirmation" visual — same shape used identically in both panels, differing only in copy.
- The responsive column-ratio escalation (`38/62 → 32/68 → 28/72 → 25/75` across `md/lg/xl/2xl`) is a reusable technique for a "reference list + primary workbench" two-panel layout: rather than a fixed split or a max-width cap, the secondary panel keeps a comfortable minimum while the primary panel claims all additional breakpoint-gained width.
- Role-based capability gating is centralized into a single derived boolean (`dragEnabled`) computed once from `role`/`activeSession`/`isPastSession`, then threaded as a prop into both panels and the card component — a clean single-source-of-truth pattern for "this whole interaction mode is off" rather than scattering `role === X` checks through each interactive element.
- Caution flag for future screens copying this one: the unused `SessionCard`, `AssignedIdeaCard`, `SessionDetailPanel`, `BulkActionBar` components sitting alongside the live ones in the same folder are a trap for a future AI or developer skimming the directory — do not assume every component file in `src/features/pitch-session/components/` reflects the current live pattern; cross-check against actual import usage (as this document does) before treating any of them as canonical.
