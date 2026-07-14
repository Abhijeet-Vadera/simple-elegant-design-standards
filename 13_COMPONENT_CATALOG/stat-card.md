# StatCard (ui-kit)

Source of truth: `src/shared/components/ui/index.tsx:1486-1527`. Tokens cited from `.ai-design-dna/02_DESIGN_DNA.json` (`color.border`, `color.textPrimary`, `radius.DEFAULT`, `typography.scale.statCardValue`, `surfaces.card`) and `12_DESIGN_TOKENS/colors.json` / `radius.json` / `typography.json`.

> **Naming collision — read before using.** There are two unrelated components named `StatCard` in this codebase:
> 1. **This one** — `src/shared/components/ui/index.tsx:1486`, the canonical ui-kit primitive, documented below. Import path: `@/shared/components/ui`.
> 2. A **different, unrelated implementation** at `src/components/shared/charts/StatCard.tsx` — a chart-folder variant used only by `src/components/shared/Dashboard.tsx`'s analytics widgets, with its own distinct props (`title` instead of `label`, `accent` instead of `iconBg`/`iconBorder`/`iconColor`, `isCurrency`, `NumberFlow`-animated value, `rounded-2xl`/`shadow-sm`/`p-6` card chrome, `32px` bold value). It is documented separately in `chart-stat-card.md` and must **not** be confused with, merged with, or treated as an alternate skin of this one — they share only a name and a rough purpose. Do not import `StatCard` from `@/components/shared/charts/StatCard` expecting ui-kit styling, and do not port props/behavior between the two.

## Purpose

A compact metric tile: an uppercase label, a large numeric/string value, and an optional small icon "well" in the top-right corner, plus an optional free-form `sub` slot underneath. Used in KPI/metrics strips at the top of dashboard-style screens (3-4 tiles in a grid row).

## File, export, prop signature

- File: `src/shared/components/ui/index.tsx:1486`
- Export: `export function StatCard({ label, value, icon, iconBg, iconBorder, iconColor, valueColor, sub }: {...})`
- Props:
  ```ts
  label: string;
  value: number | string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconBg?: string;       // Tailwind bg-* class, default "bg-gray-50"
  iconBorder?: string;   // Tailwind border-* class, default "border-gray-200"
  iconColor?: string;    // Tailwind text-* class, default "text-gray-600"
  valueColor?: string;   // Tailwind text-* class, default "text-[#0A0A0A]"
  sub?: ReactNode;       // arbitrary node rendered below the value
  ```
- Unlike `IdeaRow`/`PageHeader`, this component is styled with Tailwind utility classes (`className`), not inline `style` objects — it is one of the components in `src/shared/components/ui/index.tsx` that mixes both authoring styles (per `02_DESIGN_DNA.json`'s `source.note` that inline literals and Tailwind utilities are treated as one token set).
- The icon/color props take raw Tailwind class strings, not semantic tokens — callers are responsible for picking classes that resolve to on-brand colors; nothing in the component itself constrains them to the DNA palette (see Anti-patterns).

## Exact styling

- Card shell: `className="bg-white border border-[#E5E7EB] rounded-xl p-[18px_20px]"` — white surface, `#E5E7EB` border (DNA `color.border`), `rounded-xl` = 12px radius (DNA `radius.DEFAULT`; note the Tailwind *utility name* is `xl` but its configured pixel value is the DNA's `DEFAULT` 12px step — an intentional but non-obvious naming mismatch between the Tailwind scale name and the DNA's semantic scale name), padding `18px 20px`. This matches `surfaces.card` (`#FFFFFF border #E5E7EB radius 12px`) and the DNA's documented `cardBodyPaddingLoose: "18px 20px"` spacing step exactly.
- Header row: `flex items-center justify-between mb-3.5` (14px bottom margin) containing the label and the optional icon well.
- Label: `text-[12px] text-text uppercase tracking-[0.08em]`. `text-text` resolves to the Tailwind `colors.text.DEFAULT` = `#0A0A0A` (ink) per `tailwind.config.js` — **note this is a deliberate departure from the app's usual "uppercase label = muted gray" convention** (compare `PageHeader`'s eyebrow at `#9CA3AF`, or `color.textTertiary`/`color.textSecondary` used for other uppercase caption text elsewhere in the DNA). The StatCard label is uppercase-tracked like an eyebrow but rendered in full ink black, not gray — a distinctive, intentional-looking choice worth preserving rather than "fixing" toward gray.
- Icon well (rendered only if `icon` is passed): `w-8 h-8 rounded-lg border grid place-items-center shrink-0`, i.e. 32x32px, `rounded-lg` = 8px radius (DNA `radius.sm`), composed with the caller-supplied `iconBg`/`iconBorder`/`iconColor` classes. The icon itself renders at `width={15} height={15}` — smaller than the DNA's most common icon render sizes (16/13/14/12/18 per `icons.mostCommonRenderSizes`), a slightly bespoke size specific to this well.
- Value: `text-[28px] font-semibold tracking-[-0.03em] leading-none`, plus the caller's `valueColor` class (default `text-[#0A0A0A]`). This is the DNA's `typography.scale.statCardValue` token verbatim (`28px / 600 / -0.03em / lineHeight 1`).
- Optional `sub`: wrapped in a plain `mt-2` div with no imposed typography — the caller fully controls its look (see the badge-pill `sub` usage in the DepartmentsScreen example below).

## Usage rules

- Always import from `@/shared/components/ui` (the canonical `src/shared/*` tree) — never from `@/components/shared/charts/StatCard`, which is the differently-shaped, unrelated component described above.
- Reserve the `icon` prop for a single small glyph; the well is a fixed 32x32px square and is not designed to hold multi-glyph compositions or badges — put badge-like content in `sub` instead.
- `value` accepts `number | string` — pass a pre-formatted string (e.g. `"—"` for a loading placeholder, or a currency-formatted string) when the raw number needs formatting; the component does no number formatting itself (contrast with the chart-folder `StatCard`, which formats via `NumberFlow`/`Intl` internally).
- When composing a KPI strip, keep icon color triads (`iconBg`/`iconBorder`/`iconColor`) as a matched set (e.g. `bg-green-50` + `border-green-200` + `text-green-600`) rather than mixing shades across the three props, to preserve the soft-pastel-well look the default gray triad establishes.

## Real call-site examples

- `src/features/dashboard/container/DashboardScreen.tsx:183-192` — mapped over a metrics array, no `sub`:
  ```tsx
  <StatCard
    key={c.label}
    label={c.label}
    value={c.value}
    icon={c.icon}
    iconColor={c.iconColor}
    iconBg={c.iconBg}
    iconBorder={c.iconBorder}
  />
  ```
- `src/features/people/container/ProfileScreen.tsx:115` — minimal usage, label/value only, no icon:
  ```tsx
  <StatCard key={i} label={l.toString()} value={v} />
  ```
- `src/features/people/container/InvitesScreen.tsx:305-311` — matched gray icon triad:
  ```tsx
  <StatCard label={t("people.statTotalCodes")} value={total} icon={TicketIcon} iconBg="bg-gray-50" iconBorder="border-gray-200" iconColor="text-gray-500" />
  ```
- `src/features/departments/container/DepartmentsScreen.tsx:596-609` — `sub` used for a small pill badge underneath the value:
  ```tsx
  <StatCard
    label={t("departments.statTotalLabel", "Total Departments")}
    value={isLoading ? "—" : stats.totalDepts}
    icon={BuildingIcon}
    iconBg="bg-indigo-50"
    iconBorder="border-indigo-200"
    iconColor="text-indigo-600"
    sub={!isLoading && (
      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
        {t("departments.statTotalBadge", "Active")}
      </span>
    )}
  />
  ```

## Anti-patterns

- **Off-token icon colors observed in production**: `src/components/shared/Dashboard.tsx:97-119` uses `bg-purple-50`/`border-purple-200`/`text-purple-600`, `bg-green-50`/`text-green-600`, `bg-blue-50`/`text-blue-600`; `DepartmentsScreen.tsx` uses `bg-indigo-50`/`text-indigo-600` and `bg-amber-50`/`text-amber-600`. None of these (purple, indigo, plain "blue"/"green" stock shades) appear in the DNA's canonical semantic triads (`color.semantic.success/warning/danger/info`) or `stagePillColors`. This is exactly the drift `02_DESIGN_DNA.json`'s `color.inconsistencyFlags` calls out for "DepartmentsScreen, chart components." Do not copy these call sites as a model for new `StatCard` icon coloring — pick from the documented semantic triads instead.
- Do not use raw Tailwind slate/gray shades in `sub` badges (as seen in `DepartmentsScreen.tsx`'s `bg-slate-100`/`text-slate-500`/`text-slate-600`) — the DNA's actual gray ramp is `#E5E7EB`/`#D1D5DB`/`#9CA3AF`/`#6B7280`/`#374151`/`#111827` (Tailwind `gray-*`, not `slate-*`); mixing in `slate-*` introduces a second, visually near-identical but technically different gray ramp.
- Do not confuse this component with, or copy styling from, `src/components/shared/charts/StatCard.tsx` (see naming-collision note above) — that component's `rounded-2xl`, `shadow-sm`, `p-6`, 32px bold value, and `slate-400`/`slate-800` text colors are a different, self-contained visual language and are not part of this ui-kit's token set.
- Do not rely on `label`'s ink-black color (`text-text`) being "just a bug to fix toward gray" — treat it as the documented, intentional styling for this specific component; changing it would be an undocumented visual regression, not a fix.
