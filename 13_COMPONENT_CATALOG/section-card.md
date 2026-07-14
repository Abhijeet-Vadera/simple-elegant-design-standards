# SectionCard

## 1. Purpose

The standard white-card container for a titled block of content within a screen — a card header (title + optional count chip + optional secondary text + optional right-aligned action) sitting above arbitrary `children`. It is the default way dashboards, profile screens, and detail screens group a list/table/widget under a labeled heading, distinct from a raw unstyled `<div>` card and from `Modal`/`Drawer` (which are overlay surfaces, not in-page ones).

## 2. File / exports / prop signature

- **File:** `src/shared/components/ui/index.tsx:1279-1335`
- **Duplicated (near-identical) in the legacy barrel:** `src/components/ui/index.tsx:454` — flagged `legacyDoNotUse` in `.ai-design-dna/12_DESIGN_TOKENS/components.json`.
- **Export:** `export function SectionCard({ title, sub, count, action, children }: {...})`

```ts
function SectionCard({
  title,       // required — card header title text
  sub,          // optional — secondary text shown after the (optional) count chip
  count,        // optional — number rendered in a pill chip beside the title; check is `count != null` so 0 IS rendered
  action,       // optional — ReactNode pinned to the far right of the header (e.g. a Button)
  children,     // optional — card body, rendered below the header with no default padding wrapper
}: {
  title: string;
  sub?: string;
  count?: number;
  action?: ReactNode;
  children?: ReactNode;
}): JSX.Element
```

Note: `count` uses `count != null` (loose equality) as its render guard (`src/shared/components/ui/index.tsx:1316`), so `count={0}` **does** render a visible `0` chip — only `undefined`/`null` suppress it. There is no `className`/`style` passthrough on the outer card; visual customization is entirely through the fixed props above plus whatever the caller puts in `children`.

**Important naming collision — not the same component:** `src/features/workspace-settings/container/WorkspaceSettings.tsx:175-209` defines its own **local, unexported** `function SectionCard({ title, description, icon, children })` with a different prop shape (`description`/`icon` instead of `sub`/`count`/`action`) and different styling (`px-7 py-5` header, `rounded-xl`, icon well). `WorkspaceSettings.tsx` does not import `SectionCard` from `@/shared/components/ui` at all (its import list at line 5 is `Button, Toggle, Badge, PageHeader` only) — every `<SectionCard>` in that file (lines 611, 651, 723) resolves to this local shadow, not the canonical shared component. Treat these as two unrelated components that happen to share a name; do not conflate their prop signatures.

## 3. Exact dimensions & styling (`src/shared/components/ui/index.tsx:1293-1334`)

**Outer card:**

| Property | Value |
|---|---|
| Background | `#FFFFFF` |
| Border | `1px solid #E5E7EB` |
| Border radius | `12px` (matches `radius.componentSpecific.card` / `radius.DEFAULT` in `.ai-design-dna/12_DESIGN_TOKENS/radius.json`) |
| Overflow | `hidden` (clips children to the rounded corners) |

**Header row:**

| Property | Value |
|---|---|
| Layout | `display: flex; alignItems: center; gap: 10px` |
| Padding | `14px 18px 12px` (matches `spacing.commonInlinePx.cardHeaderPadding` in `.ai-design-dna/02_DESIGN_DNA.json`) |
| Bottom border | `1px solid #E5E7EB` |
| Title font | `13.5px`, weight `600`, `letterSpacing: -0.008em` (matches `typography.scale.sectionCardTitle` in `.ai-design-dna/02_DESIGN_DNA.json`) |
| Count chip font | `12px`, color `#374151`, `border: 1px solid #E5E7EB`, `borderRadius: 999px`, `padding: 1px 7px` |
| `sub` text | `12px`, color `#9CA3AF` |
| `action` slot | wrapped in `<div style={{ marginLeft: "auto" }}>` — always pushed to the far right regardless of whether `sub`/`count` are present |

**Body:** `children` render directly below the header with **no padding wrapper of their own** — any internal padding (row padding, table cell padding, etc.) must come from the child content itself. This is why every real call site's children (rows, tables, empty states) carry their own padding rather than relying on `SectionCard` to provide it.

## 4. Real call-site examples (grep-verified, canonical `@/shared/components/ui` import only)

| File:line | Usage |
|---|---|
| `src/features/dashboard/container/DashboardScreen.tsx:198-230` | `<SectionCard title={...} count={assignedIdeas.length} action={<Button size="sm" variant="ghost" iconRight={ChevronRightIcon} onClick={...}>Board</Button>}>` — full prop set: title + count + action, `IdeaRow` list or `EmptyState` as children |
| `src/features/dashboard/container/DashboardScreen.tsx:233` | `<SectionCard title={t("dashboard.mentionedInTitle", "Mentioned in")} count={mentions.length}>` — title + count only |
| `src/features/dashboard/container/DashboardScreen.tsx:260` | `<SectionCard title={t("dashboard.myTasksTitle", "My tasks")} count={apiTodos.length}>` |
| `src/features/people/container/ProfileScreen.tsx:120-127` | `<SectionCard title={...} count={sample.length} action={<Button size="sm" variant="ghost" onClick={...}>Board</Button>}>` |
| `src/features/people/container/ProfileScreen.tsx:143` | `<SectionCard title={t("people.profileRecentActivity")}>` — title only, no count/sub/action |
| `src/features/people/container/EmployeeDetailScreen.tsx:346` | `<SectionCard title={t("people.rewardLedger")} count={transactions.length}>` — wraps a `DataTable`/`DataLoader` |
| `src/features/people/container/EmployeeDetailScreen.tsx:360-362` | `<SectionCard title={t("people.submittedIdeas")} count={ideas.length}>` |

**`sub` prop appears unused in every current call site.** A repo-wide check of real `<SectionCard>` usages found none passing `sub={...}` — every live card relies on `title` + `count`/`action` only. `sub` is implemented and styled but effectively dormant; a future AI adding subtitle text to a section header should know this prop already exists and is the correct one to reach for, rather than adding an ad hoc `<span>` next to the title.

## 5. Usage rules

- Use `SectionCard` for any in-page (non-overlay) titled content block — lists, tables, small widgets — that needs a consistent white-card-with-header treatment matching dashboards/profile/detail screens.
- Put counts in the `count` prop (not baked into `title` as a string) so the pill-chip styling and the `count != null` (renders `0`) semantics stay consistent across the app.
- Put header-level actions (e.g. a "Board" link/button) in `action` — it is always right-aligned via `marginLeft: auto`; don't try to right-align a header button manually inside `children`, since `children` render *below* the header entirely, outside the flex row that `action` occupies.
- Remember there is **zero body padding** by default — children are responsible for their own padding (as every real call site's rows/tables/empty-states already do).

## 6. Anti-patterns

- **Do not assume every `<SectionCard>` you see in the codebase is this component.** `WorkspaceSettings.tsx` defines and uses its own same-named local component with `description`/`icon` props instead of `sub`/`count`/`action` — check the file's import list before assuming shared prop semantics apply.
- **Do not pass a subtitle as part of `title`** (e.g. `title="My tasks — 4 pending"`) — use `sub` (dormant but functional) or `count` instead of concatenating strings, to keep the title font/weight consistent with `typography.scale.sectionCardTitle`.
- **Do not add internal padding to the outer card expecting it to wrap `children`** — there is none; wrapping content that needs padding must add its own (see how `IdeaRow` and `DataTable` handle their own row/cell padding).
- **Do not import from the legacy `src/components/ui/index.tsx:454` duplicate** for new code — import `SectionCard` from `@/shared/components/ui`.
- **Do not reuse the `SectionCard` name for a new local component shape** the way `WorkspaceSettings.tsx` does — it creates exactly the ambiguity documented in §2; give a differently-shaped local header-card component its own distinct name instead.
