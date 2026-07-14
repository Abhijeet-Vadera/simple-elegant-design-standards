# Shell — App Frame (Sidebar / Topbar / Shell / AppShellLayout)

**Canonical file:** `src/shared/components/layout/Shell.tsx` (612 lines, single file — exports `Shell`, `AppShellLayout`, re-exports `BellIcon`, `Button`)
**Token cross-refs:** `.ai-design-dna/02_DESIGN_DNA.json` → `layout`, `color.sidebar*`, `surfaces.sidebar`; `.ai-design-dna/12_DESIGN_TOKENS/layout.json`

This file contains four distinct constructs that are easy to conflate. Read them as: two dumb visual regions (`Sidebar`, `Topbar`), one state publisher (`Shell`), and one persistent frame that wires them together (`AppShellLayout`).

---

## 1. `Sidebar()` — internal, not exported

Dark, fixed-width vertical nav rendered once inside `AppShellLayout`. Not configurable by callers — it derives everything itself from global stores and route config.

- **Container:** `<aside>` — `bg-[#0A0A0A] text-white flex flex-col pb-3.5 w-[248px] h-screen shrink-0`
- **Org brand header:** tenant logo (or initials fallback) over a gradient fade (`gradients.sidebarFade` in DESIGN_DNA: `linear-gradient(to top, #0A0A0A, #0A0A0A, transparent)`) with the logo bled in at 15% opacity as a background watermark; org name at 13.5px/600.
- **Nav body:** `flex-1 overflow-y-auto` — the only internally-scrolling region of the sidebar. Built dynamically (see §5).
- **QR "submit idea" widget:** see §6.
- **Footer:** divider (`h-[1px] bg-[#1E1E1E]`) + user menu (see §7).
- **Active item indicator:** left rail tick — `absolute -left-3.5 ... w-[3px] h-[17px] bg-white rounded-r-[3px]`.
- **Colors used (all inline, not Tailwind theme colors):** `#0A0A0A` (bg), `#161616` (active row bg), `#1C1C1C` (hover row bg, non-active), `#8A8A8A` (inactive text), `#5A5A5A` (group headers, meta text), `#1E1E1E` (footer divider). These map to DESIGN_DNA `color.sidebar` / `sidebar2` / `sidebarHover`.
- **Row transition:** `framer-motion` `animate`/`whileHover` on `background`/`color`, `duration: 0.15`.

## 2. `Topbar()` — internal, not exported

Stateless presentational header. Receives all its content as props from `AppShellLayout`, which in turn reads them from `useLayoutStore`. Topbar itself does not know about `Shell`.

- **Container:** `<header>` — `h-16 p-4 shrink-0 flex items-center gap-4 border-b border-[#E5E7EB] bg-white relative z-50` → exactly **64px** tall (`h-16`), matches `layout.json.topbarHeight`.
- **Left slot — mutually exclusive:** breadcrumbs (`crumbs` prop, chevron-separated, last crumb bold `#0A0A0A`, earlier ones `#9CA3AF`) **or** title/subtitle block. If `crumbs.length > 0`, breadcrumbs win outright — title/subTitle are not rendered alongside crumbs.
- **Right slot:** `ml-auto` group — optional `SearchBar` (only if `showSearch`), then arbitrary `actions` ReactNode, then a permanently-mounted `NotificationBell`.
- **Own local state:** none besides subscribing to `searchQuery`/`setSearchQuery` from `useLayoutStore` for the search box.

## 3. `Shell` — exported, but it is a STATE PUBLISHER, not a visual wrapper

```ts
export function Shell({ title, subTitle, crumbs, actions, showSearch, searchPlaceholder, contentClass, children }: ShellProps)
```

This is the component individual screens import and wrap their content in. It renders **no** chrome of its own — no sidebar, no topbar, no `<aside>`/`<header>`. What it actually does:

1. On mount/update, a `useLayoutEffect` calls `useLayoutStore().setHeader({ title, subTitle, crumbs, showSearch, searchPlaceholder, actions })` — pushing this screen's header intent up into the shared `layoutStore` (`src/shared/store/layoutStore.ts`), which `AppShellLayout`'s `Topbar` instance then reads and renders.
2. A second `useLayoutEffect` returns a cleanup that calls `clearHeader()` on unmount, resetting title/crumbs/actions/search back to blank so the next screen starts clean.
3. It renders `children` inside a `motion.div` using `screenVariants` (`initial="hidden" animate="show"`, keyed by `contentClass` so a class change forces the exit/enter transition) — this is the page-transition wrapper every screen's content sits inside.
4. Padding logic: default class is `"page"` with `p-4` (note `p-4` is duplicated unconditionally in the joined class list, and additionally added again for the non-`"page-wide"` branch — a redundant-but-harmless quirk, not a design signal to imitate). `contentClass === "page-wide"` instead gets `max-w-full flex-1 min-h-0 flex flex-col` (no padding, expected to self-manage, e.g. flex/scroll containers).

**Practical implication:** `Shell` is a per-screen "header + transition" declaration, effectively a `<Helmet>`-style side-channel publisher for the topbar, wrapped around a motion container. It must be rendered by every route's screen component (inside the `<Outlet />`), but it never wraps or gates the sidebar/topbar — those live one level up, in `AppShellLayout`, and are unaffected by how many times `Shell` itself mounts/unmounts as routes change.

## 4. `AppShellLayout()` — exported, the actual persistent frame

```tsx
<LayoutGroup>
  <div className="grid grid-cols-[248px_1fr] min-h-screen h-screen overflow-hidden">
    <Sidebar />
    <div className="flex flex-col overflow-hidden h-screen bg-[#F7F7F5]">
      <Topbar {...fromLayoutStore} />
      <div className="scroll-area flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col [scrollbar-gutter:stable]">
        <Outlet />
      </div>
    </div>
  </div>
  <ModalHost />
</LayoutGroup>
```

- **Grid:** `grid-cols-[248px_1fr] min-h-screen h-screen overflow-hidden` — an explicit two-column CSS grid, first column pinned at exactly `248px`, second column `1fr`. This is the one and only place the shell's macro-layout is defined. Matches `.ai-design-dna/12_DESIGN_TOKENS/layout.json` (`sidebarWidth: "248px"`, `gridTemplate`).
- **Right column:** `flex flex-col overflow-hidden h-screen bg-[#F7F7F5]` (`#F7F7F5` = DESIGN_DNA `color.canvas`) containing `Topbar` on top and a single scrollable content region below it (`scroll-area flex-1 min-h-0 overflow-y-auto overflow-x-hidden ... [scrollbar-gutter:stable]`). The `<Outlet />` — i.e. the active route's screen, which itself renders a `Shell` — mounts inside that scroll region.
- **`LayoutGroup`** (framer-motion): wraps the whole tree so shared-layout animations (e.g. the active-nav-item indicator, if it were to use `layoutId`) can coordinate across the sidebar and content siblings.
- **`ModalHost`** is mounted once here, as a sibling of the grid, inside `LayoutGroup` but outside the scrollable content area — i.e. at shell root, not per-screen. All app modals/drawers render through this single host regardless of which screen opened them.
- **Data flow:** `AppShellLayout` is the *sole reader* of `useLayoutStore` for header display (`title, subTitle, crumbs, actions, showSearch, searchPlaceholder`) and passes them straight into `Topbar`. It does not read or write anything else from the store.

## 5. Nav groups — built dynamically from `routes.config.ts`, filtered by role

Source: `src/routes/routes.config.ts`.

- Each `RouteConfig` may carry an optional `nav: { label, icon, group }`. Only routes with a `nav` block appear in the sidebar at all.
- `getNavRoutes(role)` (`routes.config.ts`) filters `ROUTES` down to: has `nav`, `access !== "public"`, and (`access === "any"` OR `access.includes(role)`). This is the single source of truth for "which nav items does this role see" — Shell.tsx does no role logic of its own beyond calling this.
- `Sidebar()` then buckets the filtered routes into groups by `nav.group` (`string | null`), preserving the `group: null` (ungrouped/top-level) bucket first, then each named group (e.g. `"Configuration"`) in insertion order. Group headers render only for non-null groups, as small mono uppercase labels (`font-mono text-[10px] tracking-[0.16em] uppercase text-[#5A5A5A]`), i18n-resolved via `nav.group.<camelCase>`.
- `icon` is a **string key** that must exist in the local `ICON_MAP` in Shell.tsx (a `Record<string, IconComponent>` built by hand from `@/shared/components/ui/Icons`) — routes.config.ts and Shell.tsx must be kept in sync manually; there is no compile-time check tying the two together.
- Active-item highlighting: `deriveRouteId(pathname)` matches the current path against `ROUTES` (static paths first, then a hardcoded list of `matchPath` patterns for dynamic routes like `/workflow/:stageId/edit`, `/ideas/:ideaId`, etc., falling back to `"dashboard"`). The resolved route's `parentNav` (if set) becomes the highlighted nav id, so detail/sub-pages (e.g. `idea-detail`) light up their parent list item (`ideas`) rather than showing no active state.
- Labels are resolved through `NAV_LABEL_KEYS` (a hardcoded English-label → i18n-key map) with a camelCase-derived fallback key (`nav.<camelLabel>`) if not explicitly listed.

## 6. QR "submit idea" widget

- Lives directly beneath the nav list, above the footer divider, and is entirely omitted for `role === "management"` (`{role !== "management" && (...)}`)  — the only role-conditional visual element in the sidebar besides nav filtering itself.
- Built from `qrcode.react`'s `QRCodeSVG`. Two instances exist:
  - A visually hidden (`className="hidden"`) high-res (512×512) `QRCodeSVG` used purely as a source for SVG-to-Blob download (`downloadQR`), attached via `svgRef`.
  - A visible 168×168 `QRCodeSVG` (`level="H"`) that only renders once the widget is expanded.
- Encoded value is `submissionUrl`, derived as `${window.location.origin}/submit/${tenant.slug}` (falls back to bare origin if no slug) — i.e. it points at the public, unauthenticated submission route (`ROUTES` id `"submit"`, path `/submit/:slug`).
- Interaction: clicking the row toggles `isQrExpanded` (local `useState`), animated via `framer-motion` `AnimatePresence`/height-auto (`duration: 0.22, ease: [0.22,1,0.36,1]`) to reveal the large QR + caption. Two icon-buttons (download, copy-link) sit to the right and call `e.stopPropagation()` so they don't also toggle the expand state; copy uses `navigator.clipboard.writeText` and both actions fire a toast via `useUiStore().showToast`.

## 7. User menu (sidebar footer)

- Rendered via the shared `Menu` primitive (`@/shared/components/ui`), `align="left" drop="up"` (menu opens upward, anchored left, appropriate for a footer-pinned trigger).
- Trigger: `Avatar` (dark variant, 30px, tenant/user profile picture with a cache-busting `?t=${profileBuster}` query param) + name + role label (i18n `roles.<role>`, falling back to `ROLE_LABELS[role]`) + `ChevronDownIcon`.
- Menu items, built conditionally:
  1. **Switch role** — only if `authUser.roleNames.length > 1` — opens `switch-role` modal via `useUiStore().openModal`.
  2. **My profile** — navigates to `/profile`.
  3. divider
  4. **Sign out** — opens `logout` modal.
- All destructive/multi-step actions (role switch, sign-out) go through `openModal(...)`, which is rendered by the single root-mounted `ModalHost` in `AppShellLayout`, not by any modal owned by Shell.tsx itself.

## 8. No responsive/mobile behavior — explicit callout

There is **no mobile or tablet responsive logic anywhere in this file.** Confirmed by inspection:
- Zero Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, etc.) anywhere in Shell.tsx.
- The grid is a hardcoded `grid-cols-[248px_1fr]` — no alternate single-column stack, no `md:hidden`/`md:block` toggling.
- No hamburger/menu-toggle button, no drawer-ified sidebar, no `useState` for "sidebar open/collapsed", no viewport/media-query hook (`useMediaQuery`, `window.matchMedia`, etc.).
- `Sidebar` is `shrink-0` at a fixed `w-[248px]` and `Topbar`/content simply fill whatever space remains (`1fr`) — on a narrow viewport this will overflow/clip, not collapse.

This matches `.ai-design-dna/02_DESIGN_DNA.json` → `layout.responsiveBreakpoints: "none custom — desktop-only admin dashboard, no tablet/mobile collapse logic found"` and `.ai-design-dna/12_DESIGN_TOKENS/layout.json` → `"responsive": "none — fixed pixel dimensions, no breakpoint-driven collapse"`. Treat the application as desktop-only unless a future task explicitly asks to build responsive behavior from scratch — none of it pre-exists to extend.

## 9. Usage rules

- **`AppShellLayout` (via `AuthenticatedAppLayout()` in `src/routes/RouterComponents.tsx`) is mounted exactly ONCE**, as a layout route sitting behind `AuthenticatedSessionGuard`, with all authenticated screens rendered through its `<Outlet />`. Sidebar/Topbar/ModalHost persist across every route change — they never remount when navigating between screens.
- Every screen component rendered through that `<Outlet />` is expected to wrap its own content in `Shell` (passing `title`/`crumbs`/`actions`/etc.) so the persistent `Topbar` picks up the right header for the current screen. A screen that forgets to render `Shell` (or forgets the cleanup effect fires correctly) leaves stale header state from the previous screen — but `Shell`'s unmount `clearHeader()` effect is what actually prevents this in practice.
- `Shell`'s `contentClass="page-wide"` opt-out (`flex-1 min-h-0 flex flex-col`, no padding) exists for screens that need to manage their own full-height flex/scroll layout (e.g. kanban boards); default `"page"` is the padded (`p-4`) normal case.
- `ModalHost` is global and singular — screens open modals via `useUiStore().openModal(id, props)`; they must never render their own competing modal root.

## 10. Anti-patterns

- **Never add a second app shell / second `<aside>`+`<header>` grid.** There is exactly one shell (`AppShellLayout`), mounted once at the router layout level. Do not re-wrap a screen or a feature area in its own sidebar/topbar structure, and do not instantiate `AppShellLayout` or `Sidebar`/`Topbar` per-route — they are not designed to be remounted per-screen and doing so will re-trigger their internal effects/animations and duplicate `ModalHost`/`LayoutGroup`.
- **Never assume responsive breakpoints work here.** There is no collapse/drawer/hamburger behavior implemented — `w-[248px]` and `grid-cols-[248px_1fr]` are hardcoded. If a task requires tablet/mobile support, it must be designed and built from scratch (breakpoint strategy, collapse state, drawer overlay, touch targets) — do not assume any latent responsive scaffolding exists to "turn on."
- **Do not confuse `Shell` with the visual shell.** `Shell` (the exported per-screen component) only publishes header state + wraps children in a transition `motion.div`; it renders no sidebar/topbar pixels. The actual chrome is `AppShellLayout`. Adding sidebar/topbar-like markup inside a screen's `Shell` usage duplicates what `AppShellLayout` already renders.
- **Keep `routes.config.ts` nav icons and `ICON_MAP` in Shell.tsx in sync manually** — adding a new `nav.icon` string in routes.config.ts without adding the matching entry to `ICON_MAP` silently renders no icon (the `IconComponent && (...)` guard swallows the miss rather than erroring).
- **Do not open modals ad hoc outside `useUiStore().openModal` + `ModalHost`.** Any new modal/dialog should be registered wherever `ModalHost` resolves modal ids, not mounted independently inside a screen.
