# Settings Screens — `/profile` (+ unbuilt `/settings/notifications`)

**Canonical file:** `src/features/settings/container/SettingsScreens.tsx` (769 lines)
**Exports:** `ProfileScreen` (only export). Also contains two unexported helpers: `formatRoleDisplay()` (role-string → display label fallback) and `LanguageToggle()` (pill-shaped EN/DE switch).
**Token cross-refs:** `.ai-design-dna/12_DESIGN_TOKENS/typography.json`, `spacing.json`, `radius.json`, `semantic-colors.json`; component docs `.ai-design-dna/13_COMPONENT_CATALOG/{avatar,button,input,modal,page-header}.md`.

---

## 0. Grounded correction — the "notification-preferences view" does not exist in this file

The route `/settings/notifications` (`src/routes/routes.config.ts:129-134`, `id: "settings-notifications"`, `access: "any"`) is **defined but not wired to any component**. In `src/routes/AppRouter.tsx:54`:

```ts
// "settings-notifications": <NotificationSettingsScreen />,
```

This line is commented out, `NotificationSettingsScreen` is not imported, and a repo-wide search finds **no file anywhere** named `NotificationSettingsScreen`/`NotificationScreen` and no toggle-driven "notification preferences" UI. `SettingsScreens.tsx` — the file this doc is about — contains exactly one screen component, `ProfileScreen`, and nothing else. Visiting `/settings/notifications` today falls through the router's normal unmatched-route handling; it does not render a stub or placeholder screen either.

**Implication for this doc and for any future AI reading it:** everything below describes `ProfileScreen` only. There is no "Toggle usage for notification prefs" to document because that surface has not been built yet. If a future task is "build the notification-preferences view," it is new-screen work, not an edit to an existing sub-view — there is no existing tab/panel to extend inside `SettingsScreens.tsx`. The route ID and nav copy ("Notifications") already exist in `routes.config.ts` and should be reused as-is for consistency once the screen is built.

---

## 1. Purpose & Access — `ProfileScreen` (`/profile`)

- **Purpose:** the signed-in user's own account + workspace hub: view/edit first name, last name, profile photo; view (read-only) email; view current role badge; view/switch **active role** among all roles granted to the account (multi-role support without re-login); view workspace (tenant) name + logo, with logo upload gated to `role === "management"`; switch app language (EN/DE).
- **Access:** route `id: "profile"`, `access: "any"` (`routes.config.ts:123-128`) — every authenticated role can reach it; `RoleGuard` (`RouterComponents.tsx:33-37`) is a no-op for `"any"` (`canAccess` returns `true` immediately, `routes.config.ts:344-348`). This is a personal-account screen, not a role-gated admin surface — the only internal role branch is the org-logo-upload affordance, gated to `management` in-component (not at the route level).
- **Nav:** no `nav` block on this route entry, so it does **not** appear in the sidebar; it's reached only via the user-menu "My profile" item in `Shell.tsx`'s sidebar footer (see `shell.md` §7) or direct navigation.
- **Distinct from a same-named screen elsewhere:** `src/features/people/container/ProfileScreen.tsx` exports `IMProfileScreen` — a *different*, role-gated manager-viewing-a-report screen (route `id: "im-profile"`). Do not conflate the two; this doc is exclusively about `settings/container/SettingsScreens.tsx`'s `ProfileScreen`.

## 2. Layout

**No tabs, no side nav.** The screen is a single scrollable column wrapped in `Shell` with breadcrumbs only (`crumbs={[{label: "Settings"}, {label: "My profile"}]}` — a static two-level trail, not a real nav hierarchy; "Settings" is not a clickable crumb here, just an eyebrow-style first segment) and a right-aligned `actions` slot that swaps between a single "Edit Profile" `secondary` `Button` (view mode) and a Cancel/Save `Button` pair (edit mode).

Structure, top to bottom:

1. **Hand-rolled page header** (icon well + `h1` + one-line description) — *not* the shared `PageHeader` primitive (see §9 Anti-patterns).
2. **Two-column responsive grid**: `grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-8 items-start`. This is an `auto-fit`/`minmax` grid, not fixed `md:`/`lg:` breakpoints — it will naturally collapse to one column if the viewport (or a parent container) narrows below ~640px combined, but there are no explicit Tailwind responsive prefixes anywhere in the file. Consistent with the app's documented "desktop-only, no deliberate mobile behavior" stance (`shell.md` §8), though this particular grid happens to degrade gracefully as a side effect of `auto-fit`, not by design intent.
   - **Left column:** Personal Information card (avatar + name/email + first/last name + email + current-role badge), then a Preferred Language row.
   - **Right column:** Workspace Details row, then "Active Roles in this Workspace" list, then an info banner.
3. **Footer bar**: divider + "Changes are auto-saved" caption + a *disabled, decorative* duplicate "Save Changes" button in view mode, or the real Cancel/Save pair in edit mode.
4. **Confirmation `Modal`** (role-switch confirmation), mounted conditionally at the bottom of the JSX tree, `width={460}` — inside the observed 400-480px cluster documented in `modal.md`.

Content is capped at `max-w-[1100px] mx-auto`, so on wide viewports the whole page is a centered column, not edge-to-edge.

## 3. Hierarchy

1. Breadcrumb (topbar, via `Shell`) — lowest visual weight, provides "where am I" context only.
2. Page header `h1` ("Profile & Workspace", hardcoded English string, not i18n'd — see §9) — highest single-line weight on the page (`text-xl font-bold`, i.e. 20px/700, notably *not* the app's `pageTitle` token of 30px/600 used by `PageHeader` elsewhere).
3. Section headers (`h2`, `text-base font-semibold` = 16px/600): "Personal Information", "Workspace Details", "Active Roles in this Workspace" — second tier, one per card/section.
4. Card/row content: name, avatar, badges — third tier.
5. Field labels (`text-xs font-medium text-gray-500`, 12px/500) sit above their values (`text-sm font-semibold`, 14px/600) inside the Personal Information grid — a label-above-value pattern repeated four times (First Name, Last Name, Email, Current Role).
6. Footnote/caption text ("Changes are auto-saved", info banner body) is the lowest tier, `text-[12.5px]`–`text-[13px]`, `text-gray-400`/`text-blue-700`.

The **primary role card** (in the Active Roles list) gets an extra visual promotion beyond typography: a thicker `border-[1.5px] border-blue-500` + `bg-blue-50` treatment plus a `CheckCircleIcon`, distinguishing "your current active role" from the rest of the list purely through color/border weight, not size.

## 4. Spacing

- Outer content: `pb-10` (40px bottom breathing room before the footer bar's own `mt-10 pt-6`).
- Page header block: `gap-4 mb-8` (16px icon-to-text gap, 32px margin below the whole header — looser than `PageHeader`'s documented `28px` `pageHeaderMarginBottom` token).
- Grid columns: `gap-8` (32px) between the two columns and between stacked items within a column's own `flex flex-col gap-8`.
- Cards: `p-6 md:p-7` (24px, 28px≥`md`) for the Personal Information card — one of the only two responsive Tailwind prefixes in the whole file (the other is the grid's own `sm:grid-cols-2` for the field grid inside that card).
- Avatar-to-name gap inside the card: `gap-4 mb-6` (16px gap, 24px margin below before the divider).
- Field grid inside Personal Information: `grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4` (24px vertical, 16px horizontal) — the field-label-to-value gap is `mb-1.5` (6px), matching `spacing.json`'s `controlGapSmall` bucket.
- Workspace/language rows: `p-4` (16px) cards, `gap-4` (16px) between icon well and text.
- Active-roles list: `flex flex-col gap-2.5` (10px) between role rows; each row is `p-4` (16px) internally, with `gap-4` between icon+text block and the action/badge cluster, and an inner `gap-2` between an icon and text (badge row), `mb-1` under the title+badge line.
- Info banner: `p-3.5 gap-3 mt-3.5` (14px padding, 12px icon gap, 14px top margin).
- Footer bar: `mt-10 pt-6 border-t` (40px margin, 24px padding after the divider), `gap-4` between caption and buttons.

Nothing here uses an off-scale value outside the documented `baseUnit: 4` Tailwind steps except the many `text-[13.5px]`/`text-[12.5px]`/`text-[14.5px]` half-pixel font sizes, which is itself a consistent app-wide micro-typography convention (seen throughout `typography.json`'s `body`/`bodySecondary`/`label` scale), not an outlier.

## 5. Typography

All hardcoded arbitrary Tailwind values (`text-[13.5px]` etc.), not references to the `typography.json` scale tokens by name — this screen predates or bypasses the token file's named scale in several places:

| Element | Class | Effective size/weight |
|---|---|---|
| Page `h1` | `text-xl font-bold tracking-[-0.015em]` | 20px / 700 (does **not** match `pageTitle` token: 30px/600) |
| Page description | `text-[13.5px] text-gray-500` | 13.5px / 400 — matches `typography.json` `body` size |
| Section `h2` | `text-base font-semibold` | 16px / 600 |
| Card person name | `text-base font-semibold` | 16px / 600 |
| Field label | `text-xs font-medium text-gray-500` | 12px / 500 — close to `label` token (12.5px/500) but not exact |
| Field value | `text-sm font-semibold` | 14px / 600 |
| Role-card title | `text-[14.5px] font-semibold` | 14.5px / 600 |
| Role-card description | `text-[12.5px]` | 12.5px / 400 |
| Badges ("Primary", "Active Workspace", role pill) | `text-[11.5px] font-semibold` / `text-xs font-semibold` | 11.5-12px / 600 — close to `badgeText` token (11.5px/500) but bumped to 600 weight here |
| Buttons (inline `style`) | `fontSize: 13` explicit | 13px |
| Footer caption / banner text | `text-[12.5px]`–`text-[13px]` | 12.5-13px / 400 |

No `font-mono` usage anywhere in this screen (unlike `eyebrow`/ID-label conventions elsewhere in the app) — every string here is prose or a UI label, consistent with `typography.json`'s `monoNeverForProse` rule.

## 6. Components used

From `@/shared/components/ui`: `Avatar`, `Button`, `Input`, `Modal`. From `@/shared/components/layout`: `Shell`. Icons from `@/shared/components/ui/Icons`: `ActivityIcon`, `BuildingIcon`, `CheckCircleIcon`, `GlobeIcon`, `InfoCircleIcon`, `ShieldIcon`, `UserIcon`.

Notably **absent**, despite being the documented canonical pattern for their respective jobs:
- **`PageHeader`** — this screen hand-rolls its own icon+title+sub block (`div.flex.items-center.gap-4.mb-8` wrapping a `UserIcon` well + `h1` + `p`) instead of using `PageHeader` (see §9).
- **`Field`** — labels are raw `<span>`s above `Input`/value `<span>`s, not the shared `Field` wrapper that normally pairs a label with an input + hint/error slot (`field.md`).
- **`Toggle`** — not used anywhere in this file. The two "switch"-like controls in this screen (`LanguageToggle`, "Make Primary" buttons) are both hand-built, not `Toggle` instances (see §7).
- **`Badge`** — the "Primary" / "Active Workspace" / role pills are hand-rolled `<span>`s with inline Tailwind color classes, not the shared `Badge` component.

## 7. Interaction

- **Edit mode toggle:** `isEditing` boolean (`useState`) flips the header `actions` slot and several inline field renders between read-only `<span>` and editable `Input`/upload-overlay. There is no per-field edit toggle — the whole card enters/exits edit mode together.
- **Avatar/photo edit:** when `isEditing`, a semi-opaque black overlay (`bg-black/40` → `bg-black/60` on hover) with a camera SVG glyph appears centered over the `Avatar` circle; clicking it triggers a hidden `<input type="file" accept="image/*">` via `ref.current?.click()`. Selected file is client-side size-validated (`> 5MB` → toast + reject) and previewed instantly via `URL.createObjectURL(file)` fed straight into `Avatar`'s `src` prop — no upload happens until "Save Changes" is clicked (`handleSave` builds a `FormData` and calls `updateProfile`). Same exact pattern is reused for the org-logo upload, gated to `isEditing && role === "management"`.
- **No `Toggle` component for anything** — this screen has zero on/off-switch semantics. The closest analog is `LanguageToggle`, a fully custom two-segment pill button group (`role`-less, using `aria-pressed` per button, not `role="switch"`), functionally closer to `Segmented` (`segmented.md`) than to `Toggle`. It changes `i18n.changeLanguage(...)` immediately on click — no confirm, no save step — which is the one truly "immediate effect" control on the page.
- **Role switching ("Make Primary"):** clicking a non-primary role's button sets `confirmRole`, which opens the `Modal` confirmation dialog (not an immediate toggle) — this is a deliberate two-step flow for a state change with real access-permission consequences, contrasting with the zero-step `LanguageToggle`. Confirming calls `changePrimaryRole(...)`, updates the auth store + `localStorage`, and shows a toast; the currently-primary role's own button is `disabled` and rendered in a visually inert "cursor-default" state rather than being hidden.
- **Save flow:** `handleSave` only appends changed fields to `FormData` (diffs against `authUser.firstName`/`lastName`, and only includes `profilePicture`/`orgLogo` if a new file was actually selected) — a partial-PATCH pattern via `FormData`, not a full-object PUT. On success it also proactively busts avatar/logo caches (`bustProfileCache`/`bustLogoCache`, cache-buster query params) and calls `refreshUser()`, in addition to optimistically writing the merged object straight into the Zustand `authStore` + `localStorage` before the refresh resolves.
- **Cancel:** resets `firstName`/`lastName`/`profilePicture`/`orgLogo` local state back to the stored `authUser` values and flips `isEditing` off — no confirmation prompt for discarding unsaved edits.
- **Feedback channel:** every success/error path routes through `useUiStore().showToast(...)` — no inline field-level error text, no `Field`/`error` prop usage anywhere in this screen (contrast with `input.md`'s documented `error` boolean pattern used elsewhere in the app).
- **Footer "Save Changes" button in view mode is permanently `disabled`** — a decorative, non-functional duplicate of the real header action button, existing purely to keep the footer bar visually non-empty when not editing (see §9).

## 8. Accessibility

- `LanguageToggle` buttons use `aria-pressed` correctly to reflect the active language — a real, working ARIA state.
- File-upload overlays are `<div onClick=...>` elements, not `<button>`s or `<label htmlFor>` — they carry no `role="button"`, no `tabIndex`, no keyboard handler, and no accessible name (the camera SVG has no `aria-label`/`<title>`). This is a genuine keyboard/screen-reader gap: the photo-upload affordance is mouse-only as implemented.
- "Make Primary" buttons are real `<button type="button">`s with a native `disabled` attribute for the current-primary state (correct semantics, no ARIA needed beyond that).
- The `Modal` confirmation dialog inherits `Modal`'s built-in Escape-to-close and click-outside-to-close (see `modal.md`), gated appropriately (`!changingRole && setConfirmRole(null)`) so it can't be dismissed mid-request.
- Section headings use real `<h1>`/`<h2>`/`<h3>` tags in a mostly-sound nesting order (`h1` page title → `h2` section titles → `h3` for the person's name inside the card, which technically skips visual hierarchy but not DOM nesting — there's no `h2`-inside-`h3` inversion).
- Status text ("Primary", "Active Workspace", role badges) is color + text together (green/blue/emerald backgrounds *plus* a text label) — consistent with `semantic-colors.json`'s stated rule that "color is never the sole signal."
- No live-region (`aria-live`) on the toast-triggered success/error messages from within this file — toast accessibility, if any, is whatever `useUiStore`'s toast host implements globally, not something this screen adds itself.
- The page's hardcoded `h1` copy ("Profile & Workspace") is **not i18n'd** (see §9) — a real localization gap in an otherwise heavily `t(...)`-wrapped file (nearly every other string on the screen does go through `useTranslation`).

## 9. Data density

Deliberately low-density, form/detail-page style — this is the opposite end of the spectrum from the app's data-table screens (`data-table.md`):
- Exactly one identity (the signed-in user) and one tenant are ever shown.
- The "Active Roles" list is bounded by however many roles (`roleNames`) the account actually has — typically 1-3 in practice, rendered as full-width cards with icon + title + description + action, not a compact table.
- No pagination, filtering, sorting, or search anywhere on this screen — appropriate, since there is nothing to page through.
- The two-column `grid-cols[auto-fit,minmax(320px,1fr)]` layout exists purely to use horizontal space on wide viewports for parallel independent content (personal info + language vs. workspace + roles), not to increase information density per se.

## 10. Anti-patterns actually present in this file (documented, not to be copied forward)

- **Hand-rolled page header instead of `PageHeader`.** `page-header.md`'s own usage rule states a canonical-tree screen should not hand-roll an `<h1>` + description block outside `PageHeader`. This screen does exactly that (icon well + `h1 text-xl font-bold` + `<p>`), and its resulting title size (20px/700) diverges from the token-driven `pageTitle` scale (30px/600) used everywhere `PageHeader` is used. Do not use this screen's header block as a template for a new screen; use `PageHeader`.
- **Decorative disabled duplicate button.** The view-mode footer renders a second, permanently-`disabled` "Save Changes" button purely for visual balance, duplicating the real save action already available in the header `actions` slot. This adds a dead, non-interactive control to the DOM/tab order footprint (though `disabled` does remove it from the tab order) for no functional gain — do not replicate a "decorative disabled twin button" pattern elsewhere.
- **Untranslated `h1` in an otherwise fully-i18n'd file.** `"Profile & Workspace"` is a raw string; nearly every other piece of copy on the page is wrapped in `t(...)` with an English fallback. Treat this as a bug to avoid reproducing, not a pattern.
- **Mouse-only upload affordance.** The avatar/logo upload overlay `<div onClick>` has no keyboard/ARIA path (see §8) — don't copy this shape for a new upload control; wrap the clickable region in a real `<button>`/`<label>` instead.
- **`LanguageToggle` reinvents a segmented control** rather than composing the shared `Segmented` primitive (`segmented.md`) — if a future screen needs a two/three-option inline switch, check whether `Segmented` already covers the need before hand-building another bespoke pill-button pair like this one.

## 11. Reusable ideas worth carrying into future screens (including the eventual notification-preferences screen)

- **Diff-based `FormData` PATCH pattern** (`handleSave`: only append fields that actually changed) is a clean, bandwidth-light approach worth reusing for any other partial-edit form.
- **Instant local preview via `URL.createObjectURL` before upload commits** — good UX for any file-picker-then-save flow; pair it with the existing 5MB client-side size guard shown here.
- **Two-step confirm for access/permission-affecting state changes** (role switch → `Modal` confirmation) vs. **zero-step immediate toggle for low-stakes preferences** (language) is a legitimate, deliberate distinction — this is exactly the split a real notification-preferences screen should make: per-channel/per-event toggles (email/push/in-app on-off) are natural `Toggle` candidates (immediate effect, no confirmation, per `toggle.md`'s stated usage rule #2), while anything with broader consequence should route through `Modal` confirmation the way role-switching does here.
- **Cache-busting pattern** (`profileBuster`/`logoBuster` query-string counters bumped on successful upload) is the established way this codebase forces a fresh image fetch after replacing a photo/logo — reuse this exact mechanism rather than inventing a new one for any future avatar-like upload.
- **When the notification-preferences screen is eventually built:** it should very likely use `Shell` with `crumbs` (matching this screen's breadcrumb pattern: `Settings → Notifications`), `PageHeader` for the actual title block (not a hand-rolled header — learn from this screen's deviation, don't repeat it), and `Toggle` (not a custom switch) for each notification channel/event row, each row following the same "icon well + label/sub-label + control" shape already used here for the Language and Workspace rows (`p-4 bg-[#FCFCFB] border border-gray-200 rounded-2xl` row shell, `w-11 h-11 rounded-lg bg-gray-100 border border-gray-200` icon well) — that row shell is already a de facto reusable pattern inside this same file and should be extracted/matched rather than redesigned.
