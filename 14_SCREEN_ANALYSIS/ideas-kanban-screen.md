# Screen Analysis — Ideas Board (Kanban / List)

Source of truth: `src/features/ideas/container/IdeasPage.tsx`, `src/features/ideas/container/KanbanScreen.tsx`, `src/features/ideas/components/StatusChips.tsx`, `src/features/ideas/components/IdeaListView.tsx`, `src/features/ideas/components/IdeaListSkeleton.tsx`, `src/features/ideas/components/KanbanSkeleton.tsx`, `src/shared/components/modal/StageMovementModal.tsx`, `src/components/shared/AssignDropdown.tsx`, `src/routes/routes.config.ts:86-94`. Cross-referenced against `.ai-design-dna/00_PROJECT_IDENTITY.md`, `.ai-design-dna/13_COMPONENT_CATALOG/segmented.md`, `.ai-design-dna/12_DESIGN_TOKENS/spacing.json`.

Route: `/ideas` (id `ideas`, nav label "Idea Board", icon `KanbanIcon`). Rendered by `IdeasPage` (`src/features/ideas/container/IdeasPage.tsx:9-44`), which wraps `KanbanScreen` in `Shell`.

## Purpose & access

- **Purpose:** the operational hub for the idea pipeline — every submitted idea lives here as a card, moving left-to-right through admin-configured stages (`submitted → screening → evaluation → pilot → scaled` by convention, but stages are dynamic per tenant via `useStages()`). Shell subtitle, verbatim from the component: *"Track and evaluate innovation submissions"* (`IdeasPage.tsx:34`).
- **Access:** `routes.config.ts:88` sets `access: "any"` for the `ideas` route — every authenticated role (employee, manager, admin, management/organizer) can view the board. This confirms the task brief's "any authenticated role."
- **Role-conditional differences within the same screen** (no separate screen per role):
  - The topbar "New idea" button only renders `role === "manager"` (`IdeasPage.tsx:14-27`) — despite `create-idea` route access being `["manager", "admin", "management"]` (`routes.config.ts:105`). This is a **discrepancy**: admin/management can navigate to `/ideas/new` directly (e.g. via URL or another entry point) but get no button here.
  - `role === "management"` sets `hideSubmitter = true` (`KanbanScreen.tsx:923`), which suppresses the submitter name/avatar block and the `AssignDropdown` on every `KanbanCard` (both in Kanban and List view) — this is the "management must never see who submitted an idea" privacy rule from `00_PROJECT_IDENTITY.md`.
  - `FilterToolbar` receives `isManager={role !== "manager"}` (`KanbanScreen.tsx:954`) but the prop is declared in the type and never read inside `FilterToolbar`'s body (`KanbanScreen.tsx:382-411`) — a dead prop, not a rendering branch.

## Layout

- `Shell` is invoked with `contentClass="page-wide"` (`IdeasPage.tsx:38`), which per `Shell.tsx:571-576` yields `max-w-full flex-1 min-h-0 flex flex-col` instead of the default padded `page` class — this is the "full-bleed, fills remaining viewport height" variant used for screens that need internal scroll regions (the horizontally-scrolling Kanban strip) rather than one long page scroll.
- `KanbanScreen`'s root is `flex-1 flex flex-col min-h-0 overflow-hidden` (`KanbanScreen.tsx:937`) — it owns 100% of the vertical space below the topbar; there is no page-level scrollbar, only the Kanban strip's own horizontal scroll and each column's own vertical scroll.
- **Toolbar row** (`KanbanScreen.tsx:938-960`): `flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4` — stacks vertically below `xl` breakpoint, but this is a desktop-only internal tool (per `00_PROJECT_IDENTITY.md` "Density"), so in practice it is almost always the row layout: `FilterToolbar` (4 dropdowns: Tag, Department, Assigned To, Mentioned) on the left, `StatusChips` (All / Approved / Rejected pill toggle) on the right.
- **Board body** — two mutually exclusive render paths keyed off `activeStatusFilter` (a `status` URL param), see Interaction below:
  1. **Kanban** (`status` unset): `DndContext` wraps a horizontally-scrolling flex row of `KanbanColumn`s (`className="flex-1 min-h-0 h-full flex gap-[14px] overflow-x-auto overflow-y-hidden pb-2"`, `KanbanScreen.tsx:989-993`), one per stage, in stage order as returned by `useStages()`. Each column is a fixed `w-[320px] shrink-0 flex flex-col h-full` (`KanbanScreen.tsx:314`).
  2. **List** (`status === "approved" | "rejected"`): `IdeaListView` renders a responsive CSS grid (`grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4`, `IdeaListView.tsx:33`) of the *same* `KanbanCard` component, non-draggable, click-only.
- **Column anatomy** (`KanbanColumn`, `KanbanScreen.tsx:291-373`): a 3px colored top bar (`rounded-tl/tr-[6px]`) sitting flush above a bordered body (`border border-t-0 border-[#E5E7EB] rounded-b-[12px]`), giving the illusion of one continuous rounded card with a colored "cap." Inside: a header row (color dot + uppercase stage name + count pill) and a scrollable card stack (`overflow-y-auto overflow-x-hidden px-2 pb-2 flex-1`).
- **Drag handle:** there is no separate handle affordance — `useDraggable`'s `listeners`/`attributes` are spread across the *entire* card `<div>` (`KanbanCard`, `KanbanScreen.tsx:134-136`), so the whole card is grabbable; `cursor-pointer` (idle) vs `cursor-grabbing` (overlay clone) is the only visual cue distinguishing "clickable" from "draggable" — they are the same gesture surface with a `PointerSensor` `distance: 3` activation constraint (`KanbanScreen.tsx:680-682`) disambiguating a click (opens idea detail) from a drag (moves stage).

## Hierarchy

1. Shell topbar: page title "Ideas" / subtitle "Track and evaluate innovation submissions" (left), global search + "New idea" button (manager only) + notification bell (right, topbar-owned).
2. Toolbar row: filter dropdowns (secondary controls, labeled) vs. status chips (primary view-state switch, visually heavier — black pill on active).
3. Column header: stage identity (color dot + name) is the loudest element in the row via uppercase + letterspacing + `font-semibold`; the count badge is a secondary, bordered pill.
4. Card internals, top-to-bottom weight: idea ref code (mono-weight badge) + relative date > title (`13.5px/600`, the single boldest text on the card) > description snippet (muted, 2-line clamp) > footer (tag color swatches + assign control, lowest visual weight, separated by a hairline `border-t`).
5. Drag overlay clone is deliberately promoted above all else during a drag: 2px blue border, larger shadow, slight rotate/scale, `z-50`, `pointer-events-none`.

## Spacing

- Column gap: `14px` (`gap-[14px]`, `KanbanScreen.tsx:992`) — not a stock Tailwind step, a screen-specific value.
- Column width: fixed `320px`, not responsive/fluid.
- Card padding: `px-3 py-[11px]` (12px horizontal / 11px vertical) with internal `space-y-3` (12px) between blocks and `mt-1` between stacked cards.
- Column header padding: `px-3 py-[10px]`.
- Toolbar-to-board margin: `mb-4` (16px).
- Card footer separator: `border-t border-[#F3F4F6] pt-2` (8px).
- List-view grid gap: `gap-4` (16px), matching `IdeaListSkeleton`'s skeleton grid exactly.
- None of these are drawn from `12_DESIGN_TOKENS/spacing.json`'s named `componentSpecific` steps (e.g. `cardBodyPaddingLoose: "18px 20px"`) — the Kanban card uses its own tighter, bespoke density scale (`px-3 py-[11px]`) distinct from the catalog's generic card padding, consistent with this being the densest screen in the app.

## Typography

- Stage name: `text-[11.5px] font-semibold tracking-[0.05em] uppercase text-[#374151]` — the "eyebrow" mono-adjacent treatment described in `00_PROJECT_IDENTITY.md`, though this one uses the default Inter family (not JetBrains Mono) despite the uppercase-tracked convention normally being reserved for mono/data labels.
- Idea ref code: `text-[11px] font-semibold` on a `bg-gray-100` chip (`KanbanScreen.tsx:151-153`) — no explicit `font-mono` class, which is a **deviation** from the documented convention (`IdeaRow`'s `idea.ref` in the catalog is `JetBrains Mono, 10.5px, #9CA3AF`); here the ref code is bolder, ink-colored, and set in the default UI font.
- Card title: `text-[13.5px] font-semibold leading-[1.4] line-clamp-2 text-[#0A0A0A]`.
- Description snippet: `text-[12px] text-[#35383e] leading-[1.45] line-clamp-2`.
- Submitter line: `text-[11px] text-[#4B5563] font-[450]` — the app's characteristic "in-between" 450 weight for secondary metadata.
- Relative date: `text-[11px] text-[#6B7280]` next to an 11×11px `CalendarIcon`.
- "No title" warning chip: `text-[10.5px] text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A]` — the one spot on this screen using a saturated semantic (amber/warning) color instead of ink-on-gray.
- "REJECTED" badge: `text-[10px] text-[#B91C1C] bg-[#FEF2F2]` — the other saturated-color exception (danger/red), both consistent with `00_PROJECT_IDENTITY.md`'s "color reserved for semantic status" rule.
- Empty-column state: `text-[12.5px] text-[#9CA3AF]` ("No ideas") switching to the stage's own accent color + `font-semibold` + `animate-pulse` when a drag is hovering over it ("Drop here").

## Components used

- `Shell` (`@/shared/components/layout/Shell`) — page chrome, topbar, search, page-wide content region.
- `Button` + `PlusIcon` — "New idea" topbar action (manager only).
- `Dropdown` (`@/shared/components/ui/Dropdown`, a react-select wrapper) — all four `FilterToolbar` filters (Tag, Department, Assigned To, Mentioned); Tag's dropdown uses a custom `formatOptionLabel` to prefix a color dot per tag.
- `AssignDropdown` — imported from **`@/components/shared/AssignDropdown`** (the legacy-path tree per `00_PROJECT_IDENTITY.md`'s stated convention), not `@/shared/components/AssignDropdown`. See Reusable ideas below — this is a significant, confirmed drift worth flagging.
- `Avatar`, `Tooltip` — submitter hover-card and date/attachment tooltips.
- `CalendarIcon`, `PaperclipIcon` — inline metadata icons.
- `StatusChips` (screen-local, `src/features/ideas/components/StatusChips.tsx`) — the All/Approved/Rejected pill row. **Not** the cataloged `Segmented` component (`.ai-design-dna/13_COMPONENT_CATALOG/segmented.md`) despite functioning as one; it is a bespoke `<button>` row with its own active-state styling (`bg-[#0A0A0A] text-white` active vs. `bg-white border` inactive) plus a "Reset" text link that only the catalog's `Segmented` doesn't support.
- `StageMovementModal` (`@/shared/components/modal/StageMovementModal`) — the note-required confirmation dialog gating every stage move, itself built from `Modal`, `Field`, `Textarea`, `Spinner`, `Button` primitives.
- `KanbanSkeleton` / `IdeaListSkeleton` — loading placeholders (see Data density).
- `@dnd-kit/core`: `DndContext`, `DragOverlay`, `PointerSensor`, `useDraggable`, `useDroppable`, `useSensor`, `useSensors`, `closestCorners`, `pointerWithin`, `defaultDropAnimationSideEffects`.

## Interaction

**Drag-and-drop mechanics (`@dnd-kit/core`):**
- **Sensors:** only `PointerSensor` is configured, with `activationConstraint: { distance: 3 }` (`KanbanScreen.tsx:680-682`) — a 3px pointer-move threshold before a drag starts, which is what lets a plain click (idea detail) coexist with a drag on the same card surface. **No `KeyboardSensor` is imported or wired up** — see Accessibility.
- **Collision detection:** a custom `kanbanCollisionDetection` (`KanbanScreen.tsx:527-533`) tries `pointerWithin` first (precise, "is the pointer actually over this droppable") and falls back to `closestCorners` only if nothing is directly under the pointer — this avoids the classic dnd-kit issue where `closestCorners` alone can pick a column that visually isn't under the cursor when columns are adjacent and narrow.
- **Droppables:** one `useDroppable({ id: stage.id })` per `KanbanColumn` (`KanbanScreen.tsx:310`). While `isOver`, the column body tints toward the stage's accent color (`backgroundColor: ${color}0D`, i.e. ~5% opacity) and an empty column's placeholder switches from "No ideas" (muted) to a pulsing, accent-colored "Drop here" state.
- **Drag overlay:** `DragOverlay` renders a second, non-interactive clone of `KanbanCard` (`overlay` prop) with its own visual treatment — 2px solid `#3B82F6` border, heavier shadow (`0 20px 48px rgba(0,0,0,0.22)`), `rotate-[1.5deg] scale-[1.03]`, `pointer-events-none`. The original card, while its own clone is being dragged, drops to `opacity-35` with a dashed gray border and flattened background — a classic "ghost placeholder" look.
- **Drop animation:** custom `dropAnimationConfig` (`KanbanScreen.tsx:515-525`) — 200ms, ease `cubic-bezier(0.2, 0, 0, 1)`, plus a `defaultDropAnimationSideEffects` override that fades the *active* (dropped) element to `opacity: 0.5` mid-animation rather than the dnd-kit default.
- **Drag lifecycle / business rules** (`handleDragStart`/`handleDragEnd`/`handleDragCancel`, `KanbanScreen.tsx:817-867`):
  - On drop, if `over` is missing, or the target isn't a real stage, or target === origin stage → no-op.
  - Rejected ideas cannot be moved at all → toast "Cannot move a rejected idea."
  - Stages cannot be skipped forward (`targetStage.order > currentStage.order + 1`) → toast "Cannot skip stages forward." (Backward moves and same-adjacent moves are allowed — the guard only blocks *forward* skips.)
  - A legal move does **not** apply immediately — it opens `StageMovementModal` (`pendingMove` state) requiring a mandatory note (`StageMovementModal.tsx:39-46`, "Note is required" validation) before `handleConfirmMove` fires. The move is applied optimistically via `queryClient.setQueriesData` the instant the modal is confirmed, then rolled back with a toast if the API call fails.
- **List/Kanban toggle:** there is no dedicated view-mode switch — the toggle is a side effect of `StatusChips`' status filter, which is itself a `status` URL search param (`activeStatusFilter`). Selecting "Approved" or "Rejected" swaps the entire board for `IdeaListView` (drag disabled entirely, cards become plain `onClick`-only); selecting "All" (or the inline "Reset" link that appears once a status filter is active) restores the Kanban/`DndContext` tree. This means the "view toggle" the task brief expected as a Segmented control is actually overloaded onto a status filter — worth noting for any future AI reading this: **there is no independent Kanban⇄List toggle**, view mode is entirely derived from the Approved/Rejected filter state.
- **Filters:** Tag (client-side only, filtered in the `filtered` memo, never triggers a refetch — `updateFilterParam` explicitly skips cache invalidation for `"tag"`, `KanbanScreen.tsx:568-579`), Department / Assigned To / Mentioned (server-side query params via TanStack Query, each change invalidates the `["ideas"]` query with `refetchType: "none"` so only the next active filter combination refetches). All four persist to the URL via `useSearchParams`, so filter state survives reload/back-nav.
- **Search:** the Shell topbar's global search box (`showSearch` + `searchPlaceholder="Search ideas"`, `IdeasPage.tsx:36-37`) is wired to `useLayoutStore`'s `searchQuery`, filtered client-side against title/submitter name/id (`KanbanScreen.tsx:764-773`).
- **Debounced loading flash:** a 250ms `isFiltering` timer (`KanbanScreen.tsx:582-586`) fires on every search/tag change specifically to show the skeleton state briefly rather than a jarring instant re-layout, even though the underlying filter itself is synchronous/client-side.
- **Scroll position memory:** the Kanban strip's horizontal scroll offset is persisted to `sessionStorage` (`kanban-scroll-position`) and restored on remount (`KanbanScreen.tsx:624-655`), but only when no status filter is active — a nicety for returning from an idea detail page back to the board.

## Accessibility

- **Keyboard drag-and-drop is not supported.** `sensors` is built with `useSensors(useSensor(PointerSensor, ...))` only (`KanbanScreen.tsx:680-682`) — `KeyboardSensor` from `@dnd-kit/core` is never imported. dnd-kit's `useDraggable` still attaches `tabIndex`/`role`/ARIA attributes automatically via `attributes` (spread at `KanbanScreen.tsx:136`), so cards are focusable, but there is no keyboard interaction wired to actually pick up/move/drop a card — a keyboard-only user can tab to a card and "activate" it (which triggers the `onClick` navigate-to-detail handler, since click and drag share the same element) but cannot move it between stages without a mouse/touch pointer. This is a confirmed, real gap, not a false negative.
- **No visible focus-ring styling** is defined on `KanbanCard` itself beyond the browser default — consistent with the rest of the app's documented "no visible focus ring" gaps noted elsewhere in the catalog (e.g. `Segmented`'s "falls back to browser default" note).
- **Hover-only tooltips:** the submitter mini-profile card and per-tag color-swatch tooltip both use `opacity-0 group-hover:opacity-100` (`KanbanScreen.tsx:172`, `261`) with no `:focus-within` equivalent — keyboard focus alone will not reveal these tooltips.
- **Color is not the sole signal** for rejected/no-title states — both pair a background-tinted badge with explicit text ("REJECTED", "⚠ No title"), which is good practice even though the app's near-monochrome palette otherwise avoids relying on saturated color.
- Drop-target feedback ("Drop here" / column tint) is visual-only and tied to pointer-driven `isOver` state from `useDroppable` — since keyboard dragging isn't wired up, this feedback is unreachable via keyboard regardless.

## Data density

- This is one of the densest screens in the app by the product's own admission (`00_PROJECT_IDENTITY.md` "Density" section calls out Kanban explicitly). A single card packs: ref code, submitter identity (conditionally hidden), relative + absolute (tooltip) timestamp, rejected flag, title (2-line clamp), attachment count, description snippet (2-line clamp), up to N tag color swatches, and an inline manager-assignment control — 6+ distinct data facets in a ~320px-wide, auto-height card.
- Column header keeps a live count badge (`ideas.length`) so cardinality per stage is always visible without scrolling/counting.
- Loading states preserve the exact layout shape at low fidelity: `KanbanSkeleton` (`columns` = live stage count or 6 default) draws per-column skeleton cards alternating 4/3 count by column index purely for visual variety, matching the real card's internal block structure (top row / body / footer) so the loading state doesn't "pop" when real content arrives. `IdeaListSkeleton` (`count=12`) mirrors the List view's `md:grid-cols-3 xl:grid-cols-4` grid exactly. Both skeletons are shown for `isIdeasLoading || isIdeasFetching || isFiltering` — i.e. even filter-driven refetches (not just first paint) get the skeleton treatment.
- `memo()` is used on both `KanbanCard` and `KanbanColumn` (`KanbanScreen.tsx:86`, `291`) — a density/perf-driven choice given how many cards can be re-rendered on every drag-frame or filter change.

## Reusable ideas

- **One card, two contexts.** `KanbanCard` is authored once and reused verbatim by `IdeaListView` for the List view — draggability (`useDraggable` + spread listeners) is only wired when `overlay` is false, and the click handler falls back between an internal `onClick` (list mode) and `onCardClick` (kanban mode) prop. Any future dual kanban/list screen should follow this exact "one presentational card, context decides drag-vs-click" pattern rather than forking the card.
- **`pointerWithin` → `closestCorners` fallback collision strategy** (`kanbanCollisionDetection`, `KanbanScreen.tsx:527-533`) is a solid, reusable dnd-kit pattern for any future narrow-multi-column board — worth promoting into a shared util if a second Kanban screen is ever built (e.g. pitch-session stages).
- **Gate-then-confirm stage transition pattern**: optimistic drag → business-rule validation in `onDragEnd` (reject/skip guards) → mandatory-note confirmation modal → optimistic apply with toast-driven rollback on failure. This whole flow (`handleDragStart` → `handleDragEnd` → `StageMovementModal` → `handleConfirmMove`) is a strong template for any other "drag implies a consequential state change" screen in the product.
- **Confirmed component drift to flag for cleanup:** `KanbanScreen.tsx:2` imports `AssignDropdown` from `@/components/shared/AssignDropdown` (the legacy-path tree, per `00_PROJECT_IDENTITY.md`'s "components/*, store/*, lib/*... are legacy duplicates" rule), **not** the seemingly-canonical `@/shared/components/AssignDropdown`. Diffing the two shows they are completely different implementations, not just formatting drift: the legacy-path one (actually live in production) wraps the shared `Dropdown`/react-select primitive, is i18n'd, supports `menuPortalTarget`/`disabled`, and is controlled (`value`/`onChange`); the `shared/components` one is a hand-rolled div-based dropdown with hardcoded English strings, manages its own `assignIdea` call and optimistic cache update internally, and takes a completely different prop shape (`ideaId`/`currentManagerId` instead of `value`/`onChange`). **Any future work should keep using the `@/components/shared/AssignDropdown` version** (it's the one actually wired into both Kanban and List views) and treat `@/shared/components/AssignDropdown` as dead/unreferenced code — the inverse of the usual "shared/* is canonical" assumption for this one component.
- **`StatusChips` duplicates `Segmented`'s job with different capabilities** (adds a "Reset" affordance `Segmented` has no slot for) — if another screen needs a segmented-plus-reset pattern, consider extending the cataloged `Segmented` component rather than hand-rolling a third variant.
- **Debounced-skeleton-on-client-filter** (`isFiltering` 250ms timer, `KanbanScreen.tsx:582-586`) is a small but reusable UX trick: even instantaneous client-side filtering benefits from a brief, deliberate loading flash so the layout doesn't visibly "snap" — a pattern worth reusing on other client-filtered dense grids/boards in the app.
