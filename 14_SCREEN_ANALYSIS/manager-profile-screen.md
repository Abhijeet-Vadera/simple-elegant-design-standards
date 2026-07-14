# Manager Profile Screen (`IMProfileScreen`)

**Route:** `/employees/managers/:mgrName` · route id `im-profile`
**Source:** `src/features/people/container/ProfileScreen.tsx` — a single internal `ProfileScreen({ isManager })` function drives two exports: `EmployeeDetailScreen` (`isManager={false}`, route `employee-detail`, `/employees/:employeeId`) and `IMProfileScreen` (`isManager={true}`, route `im-profile`, `/employees/managers/:mgrName`). This doc covers the `isManager={true}` branch only; the two share ~95% of markup and differ only in copy/stat keys and two conditionals (`isManager && (...)`).
**Token cross-refs:** `.ai-design-dna/12_DESIGN_TOKENS/typography.json`, `spacing.json`; `.ai-design-dna/13_COMPONENT_CATALOG/{shell,page-header}.md` (Shell used here is the breadcrumb variant, not `PageHeader`).

## Purpose & access

Read-only dossier for a single innovation manager: identity header, four KPI tiles, a list of ideas they're reviewing/assigned, and a recent-activity feed. It is a drill-down destination, not a list screen — there is no edit/delete affordance anywhere on the page (see Interaction).

- **Access:** `["manager", "organizer", "admin", "management"] as Role[]` (`routes.config.ts:170`) — broader than the `employees` list route it nests under (`["manager", "admin"]`, `routes.config.ts:149`). This means `organizer` and `management` roles can land on a manager's profile (e.g. via a deep link or another screen's link) even though they cannot see the "Employee & Rewards" nav item or the `/employees` list itself. There is no route-level guard visible in this file reconciling that gap — worth flagging if a future task tightens role gating, since today it's a silent asymmetry rather than a deliberate progressive-disclosure pattern.
- `parentNav: "im-profile"` is not set; the route's `parentNav: "employees"` (`routes.config.ts:172`) means the sidebar highlights "Employee & Rewards" as active while viewing a manager's profile, even for roles that can't otherwise reach that nav item.
- **Data source is mock, not the resolved user:** the person shown is looked up by exact `name` string match against the hardcoded `MANAGERS` array (`src/shared/data/index.ts` — also duplicated verbatim at `src/data/index.ts`, a second copy worth reconciling separately), decoded from the `:mgrName` URL segment (`decodeURIComponent(mgrName || "")`), falling back to `MANAGERS[0]` (Elena Marchetti) if no match. Only the "their ideas" list (`theirIdeas`) is live data, filtered client-side out of `useIdeas()` by `i.reviewer.name === person.name`. **Implication for future work:** this screen cannot currently resolve a real manager by ID — it is wired to the same three-person mock roster used across People screens, so treat the identity/stat block as illustrative scaffolding, not production-ready.

## Layout

Single-column `Shell` page (default `contentClass="page"`, padded), three stacked regions:

1. **Identity banner** — full-width white card, `bg-white border border-border rounded p-[28px_30px] mb-6`, wrapped in a `framer-motion` `fadeUp` entrance (`initial="hidden" animate="show"`, from `@/shared/lib/animations`). Internally a `flex justify-between items-start` row: left side is `Avatar` (64px, `dark={isManager}` → dark/black avatar variant for managers vs. light for employees) + name/role/contact stack; right side is action buttons.
2. **Stats strip** — `grid grid-cols-4 gap-4 mb-6`, four `StatCard`s, always exactly 4 (no icons passed, so `StatCard` renders its plain label+value form, no icon chip).
3. **Two-column body** — `grid grid-cols-[1.5fr_1fr] gap-6 items-start`: left column is the wider `SectionCard` (assigned ideas), right column the narrower `SectionCard` (recent activity). `items-start` means the two cards are NOT height-matched — the shorter one (activity, fixed 4 items) does not stretch to match the taller ideas list.

No tabs, no filters, no search on this screen — it is pure display, one path through the content, top to bottom.

## Hierarchy

- **Primary:** person's name (`text-2xl font-semibold tracking-tight`, 24px) — the only `<h1>`-weight element on the page (rendered as an `<h1>` tag but at 24px, notably smaller than the DNA's documented 30px `pageTitle` scale used by `PageHeader` elsewhere — this screen does not use `PageHeader` at all, it hand-rolls the identity block instead).
- **Secondary:** role badge (manager screens only) sitting inline next to the name — `Badge variant="solid"` (black pill, white text), text conditionally `"Admin"`-style vs `"Manager"`-style label depending on whether `person.role.includes("Senior")` — a crude client-side heuristic, not a real role field, to distinguish "Senior Innovation Manager" (badged as admin-tier) from plain "Innovation Manager".
- **Tertiary:** role/dept line (`text-[13px] text-text-2`) directly under the name, then a row of two meta chips (email icon+email, calendar icon+static "joined" copy) at `text-[12.5px] text-text-2`.
- **Quaternary:** the four stat tiles and the two section-card bodies, all rendered at smaller/denser type than the header (see Typography).
- Within `SectionCard`s, each row's own hierarchy is title (bold-ish, 13.5px) over a lighter timestamp/meta line (12px / 10.5px) — a repeating title-over-meta pattern also used in the activity feed (bold actor name + regular action text + bold target, over a lighter timestamp).

## Spacing

- Banner card padding is asymmetric and hand-tuned: `p-[28px_30px]` (28px vertical, 30px horizontal) — not a standard Tailwind step, a one-off value specific to this identity block.
- `mb-6` (24px) separates all three major regions (banner → stats → body grid) — consistent single rhythm value used three times.
- Avatar-to-text gap: `gap-4` (16px). Name-to-badge gap: `gap-2.5` (10px). Contact-chip row: `gap-3.5` (14px) between chips, `gap-1.5` (6px) between an icon and its text within a chip — this nested-gap pattern (looser between groups, tighter within a group) recurs across the file.
- Stat grid: `gap-4` (16px) between tiles, matching `StatCard`'s own documented padding (`p-[18px_20px]`, per the shared component, not redefined here).
- Body grid: `gap-6` (24px) between the two `SectionCard` columns — looser than the intra-card `gap-4`/`gap-6` used elsewhere, consistent with "24px = macro region gap" as the page's dominant separator.
- Idea list rows: `px-[18px] py-[13px]` — this exact value matches the DNA's documented `spacing.componentSpecific.listRowPadding: "13px 18px"` token verbatim.
- Activity feed items: `pb-3.5 mb-3.5` (14px) between entries, with a `border-b` on all but the last (`i < 3` guard on a 4-item slice) — a manual "no border on last item" pattern done via index comparison rather than a `:last-child` utility.

## Typography

- Name: 24px/600, `tracking-tight`.
- Role badge text: inherits `Badge`'s fixed 11.5px/500 (`badgeText` token).
- Role · dept subline: 13px, `text-text-2`.
- Contact chips: 12.5px, `text-text-2`.
- Stat tiles: `StatCard`'s fixed scale — 12px uppercase label (`tracking-[0.08em]`), 28px/600 value (`statCardValue` token, `tracking-[-0.03em]`).
- `SectionCard` header title: fixed 13.5px/600 (`sectionCardTitle` token) — not overridden per instance.
- Idea row title: 13.5px/medium, truncated (`truncate`) — the only place on this screen truncation is applied, since idea titles can run long and the row is a fixed-height flex row.
- Idea row meta / activity timestamps: 12px and 10.5px respectively (`caption`-adjacent sizes, smaller than the DNA's documented 12px `caption` floor — 10.5px here is a screen-local extra-small step used only for the activity feed's relative-time stamps).
- Activity line: 12.5px, mixed weights inline — actor name `font-semibold`, action verb regular `text-text-2`, target `font-medium` — three weight/color changes inside a single 12.5px line, a denser inline-emphasis pattern than most other screens use.

## Components used

- `Shell` (breadcrumb mode: `crumbs={[{label: "Employees", go: () => go("employees")}, {label: person.name}]}` — no title/subTitle/actions props, so the topbar shows only the two-level breadcrumb trail, no search bar, no header actions).
- `Avatar` (64px, `dark={isManager}`).
- `Badge` (`variant="solid"`, manager-only).
- `Button` (`variant="secondary"` message button always; `variant="primary"` "Manage Access" button, manager-only, `icon={SlidersIcon}`).
- `StatCard` ×4 (plain label/value form, no icon/sub props used).
- `SectionCard` ×2 — left one uses all four props (`title`, `count`, `action` = a `size="sm" variant="ghost"` Button linking to the kanban board), right one uses only `title` (no count, no action) and hand-rolls its own `<div className="p-5">` body instead of relying on any body-padding default from `SectionCard` (the ideas list column instead uses per-row padding with no card-level body padding, since rows go edge-to-edge under the header).
- Icons: `MailIcon`, `CalendarIcon`, `SlidersIcon` (all 14×14 in the contact chips/buttons).

## Interaction

- **Idea rows are clickable** (`onClick={() => go("idea", { ideaId: i.id })}`, `cursor-pointer`, `hover:bg-[#FAFAF9]`) — navigates to the idea detail screen. This `#FAFAF9` hover tint is the same "warm off-white" family flagged elsewhere in the catalog as a component-local one-off (distinct from `#F5F5F3` in `DataTable`, `#F3F4F6` hoverSurface token) — another instance of that ad hoc hover-tint pattern rather than a single shared token.
- **Activity feed rows are NOT interactive** — no `onClick`, no hover state, purely display.
- **"Board" button** on the ideas `SectionCard` (`go("kanban")`) is the only header-level action; it is a `size="sm" variant="ghost"` Button, i.e. visually the lightest button weight on the page, appropriate for a secondary "see more" link sitting inside a card header rather than being a primary page action.
- **"Message" and "Manage Access" buttons in the banner do nothing** — no `onClick` handler at all on either `Button`. This is the screen's most notable interaction gap: two prominent, primary-styled buttons in the most visually prominent position on the page are non-functional placeholders. Treat this screen as having an unfinished action layer, not a deliberately read-only design — the presence of `icon={MailIcon}` / `icon={SlidersIcon}` and primary styling signals intended future wiring.
- No loading/error/empty states are handled locally beyond `sample.length ? theirIdeas : ideas.slice(0, 3)` — if a manager genuinely has zero reviewed ideas, the screen silently substitutes the first three ideas from the entire (unfiltered) `ideas` list rather than showing an empty state. This is a content-substitution fallback, not a true empty state — worth knowing if a future task needs an honest "no ideas yet" treatment here.
- `useIdeas()` has no `enabled`/auth gating visible in this file (unlike `InvitesScreen`'s `enabled: isAuthenticated`) — it's assumed to always be safe to fetch once mounted.

## Accessibility

- Name is a true `<h1>`, but at 24px it visually undersells its semantic weight relative to `PageHeader`'s 30px `<h1>` convention used elsewhere — a screen reader gets correct heading structure, but sighted users get a smaller "page title" than the rest of the app's canonical pattern.
- `SectionCard` titles are plain `<span>`s, not heading elements (confirmed by the shared component's markup) — so the document's heading outline skips from the page `<h1>` straight past the two card "sections" with no `<h2>`/`<h3>` landmarks; a screen-reader user navigating by headings will not find "Assigned Ideas" or "Recent Activity" as headings.
- Icon-only meta chips (mail/calendar icons) always ship with adjacent visible text, so there's no icon-only-button labeling gap here.
- The two banner buttons being non-functional is itself an accessibility concern in effect (interactive-looking, keyboard-focusable elements with no operable behavior) — not a markup defect, but a "looks actionable, isn't" trap for keyboard/AT users.
- Idea rows use a bare `<div onClick>` rather than a `<button>`/link semantic element or `role="button"`/`tabIndex` — they are mouse-clickable but not confirmed keyboard-operable from this file alone (no `tabIndex`, `onKeyDown`, or `role` attributes present), which is a real gap for keyboard-only navigation to idea detail from this screen.

## Data density

Deliberately sparse and skimmable: one banner, exactly 4 stat tiles, one list capped implicitly to whatever `theirIdeas`/fallback returns (no pagination, no "load more"), and a hard-capped 4-item activity feed (`ACTIVITY.slice(0, 4)`). There is no table, no filters, no search on this screen — it's the lowest-density screen among the three analyzed here, appropriate for a single-entity "profile" destination rather than a list/management surface.

## Reusable ideas

- The **title-over-meta list row** pattern (bold/medium title line + lighter secondary line beneath, `13.5px` over `12px`) recurs identically in the ideas list and could be extracted as a shared "simple list row" primitive if more profile-style screens are added.
- The **nested-gap convention** (loose `gap-3.5`/`gap-4` between sibling groups, tight `gap-1.5`/`gap-2.5` within a group) is a clean, consistent micro-pattern worth naming explicitly in a future spacing token doc rather than leaving implicit.
- The **"fallback to first N items when the filtered set is empty"** trick (`sample = theirIdeas.length ? theirIdeas : ideas.slice(0, 3)`) is a pragmatic demo-data pattern but should NOT be copied into production-data screens — it silently shows unrelated data under a person-specific heading, which would be misleading once real user-scoped data exists.
- Before extending this screen, resolve the two open gaps noted above (non-functional banner buttons; mock-roster-only person lookup) rather than building further on top of them.
