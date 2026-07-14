# ModalHost (global modal-via-store pattern)

## 1. Purpose

`ModalHost` is a single, always-mounted render switch that owns every **app-level dialog** in the system. Instead of each screen keeping its own `const [showX, setShowX] = useState(false)` and rendering its own `<Modal>` JSX inline, a screen calls `openModal(type, payload)` from `useUiStore` and `ModalHost` — mounted once, high in the tree — decides which concrete modal component to render based on `modal.type`.

Why this pattern exists, as observed from the source:

- **One mount point, one z-index, one `AnimatePresence` lifecycle.** `ModalHost` wraps its whole switch in a single `<AnimatePresence mode="wait">` (`src/shared/components/modal/Modals.tsx:774`), so enter/exit animation sequencing for *any* app-level dialog is handled in exactly one place rather than duplicated per screen.
- **State lives above the screen, so any component can trigger any dialog.** Because `modal: ModalState | null` is global Zustand state (`src/shared/store/uiStore.ts`), a button in the sidebar (`logout`, `switch-role` — `src/shared/components/layout/Shell.tsx:416,429`), a row action in a table (`delete-employee` — `EmployeesScreen.tsx:261`), and a detail-page action bar (`reassign`, `tag-management`, `reject-idea`, `approve-idea`, `change-submitter` — `IdeaDetailScreen.tsx`) can all open the same dialog family without prop-drilling an `onOpenX` callback down through the tree or lifting local state up.
- **Payload carries context, not the caller's local state.** Concrete modals read whatever they need (`idea`, `employee`, `submissionUrl`, …) off `modal.payload` and fetch/mutate independently (React Query), so the triggering component doesn't need to hold the modal's working state at all — it only needs to know the `type` and pass the minimal identifying payload.
- **No competing local modal state to keep in sync.** Because there is exactly one `modal` slot in the store, only one app-level dialog can ever be open at a time by construction — there's no risk of two independently-mounted local modals stacking or fighting over the same overlay z-index.

## 2. The `uiStore` API that drives it

Source: `src/shared/store/uiStore.ts` (Zustand store, no persistence/middleware).

```ts
interface UiState {
  modal: ModalState | null;
  search: string;
  toast: string | null;
  openModal: (type: ModalType, payload: Record<string, unknown>) => void;
  closeModal: () => void;
  setSearch: (s: string) => void;
  showToast: (msg: string) => void;
  _clearToast: () => void;
}
```

- `openModal: (type, payload) => set({ modal: { type, payload } })` — replaces the entire `modal` slot; there is no queue/stack, so calling `openModal` again while a modal is open just swaps it out (no dialog-over-dialog stacking is possible via this API).
- `closeModal: () => set({ modal: null })` — the only way modals close is by nulling the slot; every concrete modal's `<Modal onClose={closeModal}>` and Cancel button call this directly.
- `modal.payload` is typed loosely as `Record<string, unknown>` — each concrete modal is responsible for casting it to its own expected shape, e.g. `ReassignModal` does `const { idea } = (modal?.payload || {}) as { idea: Idea }` (`Modals.tsx:43`).
- `ModalType` (`src/shared/types/index.ts:390-406`) is the exhaustive string-union of every valid `type` value: `"reassign" | "stage" | "reject" | "qr" | "add-stage" | "qr-sidebar" | "reject-idea" | "delete-idea" | "delete-employee" | "tag-management" | "change-submitter" | "logout" | "delete-document" | "delete-todo" | "approve-idea" | "switch-role"`.
- **Observed inconsistency, documented as-is:** the `ModalType` union includes `"qr-sidebar"`, but `ModalHost`'s switch (§3) has no branch for it — only `"qr"` is handled. Likewise `"stage"` and `"add-stage"` are valid `ModalType` values with fully-built `StageModal`/`AddStageModal` components in `Modals.tsx`, and `"reject"` has a fully-built `RejectModal`, but no `openModal("stage"|"add-stage"|"reject", …)` call site exists anywhere in `src/features` at the time of this audit (the live idea-workflow reject/advance flows instead go through `"reject-idea"` → `RejectIdeaModal` and `"approve-idea"` → `ConfirmationModal`). Treat `StageModal`, `AddStageModal`, and `RejectModal` as built-but-currently-dormant members of the catalog — do not delete them, but do not assume they are reachable from the live UI without adding a call site.
- `toast`/`showToast`/`_clearToast` live in the same store but are a separate concern (a single auto-dismissing toast string, 2600ms timeout) — unrelated to the modal switch itself, included here only because they're colocated in `uiStore.ts`.

## 3. How `ModalHost` switches on `modal.type`

Source: `src/shared/components/modal/Modals.tsx:770-803`.

```tsx
export function ModalHost() {
  const { modal } = useUiStore();
  return (
    <AnimatePresence mode="wait">
      {modal?.type === "reassign" && <ReassignModal key="reassign" />}
      {modal?.type === "stage" && <StageModal key="stage" />}
      {modal?.type === "reject" && <RejectModal key="reject" />}
      {modal?.type === "qr" &&
        (modal.payload?.submissionUrl ? (
          <SubmissionQRModal key="qr-submission" />
        ) : (
          <InviteQRModal key="qr-invite" />
        ))}
      {modal?.type === "add-stage" && <AddStageModal key="add-stage" />}
      {modal?.type === "reject-idea" && <RejectIdeaModal key="reject-idea" />}
      {(modal?.type === "delete-idea" ||
        modal?.type === "delete-employee" ||
        modal?.type === "delete-document" ||
        modal?.type === "delete-todo" ||
        modal?.type === "approve-idea") && (
          <ConfirmationModal key={modal.type} />
        )}
      {modal?.type === "tag-management" && <TagManagementModal key="tag-management" />}
      {modal?.type === "change-submitter" && <ChangeSubmitterModal key="change-submitter" />}
      {modal?.type === "logout" && <LogoutModal key="logout" />}
      {modal?.type === "switch-role" && <SwitchRoleModal key="switch-role" />}
    </AnimatePresence>
  );
}
```

Two switching mechanics worth noting for anyone adding a new type:

1. **Plain conditional JSX, not a literal `switch`.** It's a chain of `modal?.type === "x" && <Component />` expressions inside one `<AnimatePresence>` — despite the "switch-statement-style" framing, there's no `switch`/`case` keyword; it's idiomatic React conditional rendering. Exactly one branch (or zero, if `modal` is `null`) can be truthy at a time because `type` is a single string field.
2. **A single type can fan out to more than one component.** `"qr"` branches further on `modal.payload?.submissionUrl` to pick `SubmissionQRModal` vs `InviteQRModal`, and five distinct `delete-*`/`approve-idea` types collapse onto one shared `ConfirmationModal` (keyed by `modal.type` so `AnimatePresence` treats each as a distinct instance for exit animations). This is the established way to avoid a 1:1 type-to-component mapping when several dialogs share generic confirm/cancel chrome.
3. Every branch supplies a `key` prop so `AnimatePresence mode="wait"` can correctly sequence exit-then-enter animations when the modal type changes without an intermediate `null` state.

## 4. The concrete modals (all built on the shared `Modal` primitive)

Every modal below wraps its content in `<Modal open onClose={closeModal} width={…}>` from `src/shared/components/ui/index.tsx:674` — the shared primitive that renders the `rgba(15,15,15,0.48)` overlay (`z-index: 100`, per `.ai-design-dna/12_DESIGN_TOKENS/zindex.json`'s `modalOverlay: 100`), the `16px`-radius white card (`border: 1px solid #E5E7EB`, `box-shadow: 0 24px 60px rgba(10,10,10,0.14)`), the Escape-key handler, and click-outside-to-close. None of the modals documented here render their own overlay or card chrome — they only supply header/body/footer content and pick a `width`.

- **`ReassignModal`** (`Modals.tsx:38-185`, type `"reassign"`, width `460`) — assign/re-assign the innovation manager who owns an idea. Reads `{ idea: Idea }` from payload, fetches `/employees/innovation-managers` via React Query (`enabled: isAuthenticated`), filters out the submitter and the idea's current assignee from the pickable list, `PATCH /ideas/:id/assign` on confirm, invalidates `["idea", id]` and `["ideas"]` query keys, toasts, then `closeModal()`.
- **`StageModal`** (`Modals.tsx:187-438`, type `"stage"`, width `480`) — moves an idea to the immediately-next Kanban stage (fetched/sorted from `/stages` by `order`), shows a From→To `StagePill` pair with an `ArrowRightIcon`, takes an optional note, `POST /ideas/:id/move-stage`. Per §2, no live call site currently opens type `"stage"`; the reachable stage-advance path in the app is `"approve-idea"` → `ConfirmationModal`.
- **`RejectModal`** (`Modals.tsx:441-587`, type `"reject"`, width `460`) — reject-with-reason picker (5 canned radio-style reasons) + optional message textarea; confirm is currently a `setTimeout`-simulated save (no real HTTP call), then toasts and closes. Per §2, no live call site opens type `"reject"` — the reachable reject path in the app is `"reject-idea"` → `RejectIdeaModal` (a separate file, not covered by this doc).
- **`AddStageModal`** (`Modals.tsx:591-700`, type `"add-stage"`, width `440`) — create a custom Kanban stage (name + description). Confirm is a `setTimeout`-simulated save that pushes a locally-fabricated `KanbanStage` (`id: "custom-" + Date.now()`, `order: 999`) directly into the `["stages"]` React Query cache via `setQueryData` — no real HTTP call. Per §2, no live call site opens type `"add-stage"`.
- **`LogoutModal`** (`Modals.tsx:704-766`, type `"logout"`, width `400`) — plain Sign-out confirmation, two full-width (`block`) buttons (`secondary` Cancel / `primary` Sign out). Confirm calls `closeModal()` then `logout()` from `useAuthActions`. Opened from the sidebar user menu (`Shell.tsx:429`).

(`ChangeSubmitterModal`, `ConfirmationModal`, `InviteQRModal`, `RejectIdeaModal`, `SubmissionQRModal`, `SwitchRoleModal`, `TagManagementModal` are the other `ModalHost`-routed dialogs imported into `Modals.tsx` from sibling files in `src/shared/components/modal/` — each is its own file and out of scope for this catalog entry, which focuses on `ModalHost` itself plus the five modals defined directly inside `Modals.tsx`.)

## 5. Where `ModalHost` is mounted

Confirmed via `grep -rn "ModalHost" src`: the only render site is `src/shared/components/layout/Shell.tsx:609`, inside `AppShellLayout` (`Shell.tsx:587-612`):

```tsx
export function AppShellLayout() {
  const { title, subTitle, crumbs, actions, showSearch, searchPlaceholder } = useLayoutStore();
  return (
    <LayoutGroup>
      <div className="grid grid-cols-[248px_1fr] min-h-screen h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col overflow-hidden h-screen bg-[#F7F7F5]">
          <Topbar ... />
          <div className="scroll-area flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col [scrollbar-gutter:stable]">
            <Outlet />
          </div>
        </div>
      </div>
      <ModalHost />
    </LayoutGroup>
  );
}
```

`AppShellLayout` is the persistent authenticated-session layout — comment in source: "Persistent layout wrapper mounted once per authenticated session. Sidebar and Topbar remain mounted across route transitions." `ModalHost` sits as a sibling of the `Sidebar`/`Topbar`/`Outlet` grid, outside the scrollable route-content area, so it renders once for the whole session and is unaffected by route changes inside `<Outlet />`. This is exactly what makes the pattern global: any route rendered through `AppShellLayout` shares the same single `ModalHost` instance and the same `modal` store slot.

## 6. Usage rules

- **ALWAYS** route a new app-level/cross-cutting dialog through this system: add the value to `ModalType` (`src/shared/types/index.ts`), build (or reuse) a concrete modal component that reads its context from `modal.payload`, add a branch to `ModalHost`'s switch in `Modals.tsx`, and trigger it from anywhere with `openModal('yourType', payload)`.
- **NEVER** mount a bespoke `<Modal open={...} onClose={...}>` locally inside a screen for something that behaves like a global dialog — i.e. a confirmation, an assignment/reassignment picker, a stage transition, a sign-out prompt, or any dialog that (a) needs to be triggerable from more than one place, or (b) only needs a small identifying payload (an id, a record reference) rather than rich local form state. That local-`useState`-plus-inline-`<Modal>` pattern is exactly what `ModalHost` replaces; re-introducing it per screen brings back the duplicated open/close state and overlay-stacking risk described in §1.
- **Local vs. global — the actual dividing line observed in this codebase:** `CreateInviteModal` (`src/features/people/components/CreateInviteModal.tsx`) and `UploadDocumentModal` (`src/features/ideas/components/UploadDocumentModal.tsx`) are *not* wired through `ModalHost`/`uiStore.modal`. Both still build on the shared `Modal` primitive, but each takes its own `open`/`onClose`/`onSuccess` props and is rendered directly in its single owning screen's JSX (`InvitesScreen.tsx:387`, `IdeaDetailScreen.tsx:501`) with `useState` owned by that screen. The pattern that distinguishes them from `ReassignModal`/`LogoutModal`/etc.:
  - They are **only ever opened from one call site** (one "Create invite" button, one "Upload document" button) — there's no cross-screen trigger requirement that a global store would solve.
  - They own **substantial, form-specific local state** (staged file lists with previews, multi-field invite form with role/date/toggle state) that is naturally scoped to the screen already holding related state, not a generic `Record<string, unknown>` payload.
  - Closing them needs to feed results back into screen-local logic (`onSuccess` callback, staged-files array) rather than just firing a toast and invalidating a query key.
  - **Rule of thumb:** if a dialog is triggered from exactly one screen and carries meaningful multi-field local state that screen already manages, keep it local (props-driven `Modal`, own `useState`). If it can be triggered from multiple places, or only needs a thin identifying payload plus a server call, route it through `ModalHost`.

## 7. Anti-patterns

- Do not add a new `ModalType` string and forget the matching `ModalHost` branch (or vice versa) — the codebase already has three live examples of this drift (`"qr-sidebar"` with no branch; `"stage"`/`"add-stage"`/`"reject"` with branches but no call sites). Don't add a fourth; when adding a type, add the call site and the branch in the same change.
- Do not give a concrete modal a strongly-typed payload interface and then skip the `if (!x) return null` guard — every modal in `Modals.tsx` (`ReassignModal`, `StageModal`, `RejectModal`, `AddStageModal`) guards on its required payload field before rendering, since `modal.payload` is only `Record<string, unknown>` at the type level and nothing enforces the shape at `openModal()` call sites.
- Do not call `openModal()` a second time expecting a modal stack/queue — the store holds one `modal` slot; a second call replaces the first modal outright rather than opening "on top of" it.
- Do not reach for `uiStore`/`openModal` for a single-call-site dialog with rich local form state (see §6) just because "that's how modals work here" — that migrates screen-owned state into a global untyped payload for no benefit and loses the `onSuccess`-style callback wiring `CreateInviteModal`/`UploadDocumentModal` rely on.
- Do not render a concrete modal (e.g. `<ReassignModal />`) directly inside a feature screen "to skip the switch" — every concrete modal in this file reads `closeModal`/`modal.payload` from `useUiStore` internally and assumes it is being mounted by `ModalHost`; rendering it elsewhere still works mechanically (it's just a component) but defeats the single-mount-point/single-`AnimatePresence` guarantee this pattern exists to provide.
