# ContributionsCard

## Purpose
A card summarizing "accepted ideas" contributions across two fixed categories — Work Safety and Workplace — each rendered as its own small two-segment (yes/no) donut with a yes/no/placeholder count row beneath. Two independent `Donut` sub-renders side by side in a 2-column grid.

## File path & path-inconsistency flag
- **File:** `src/components/shared/charts/ContributionsCard.tsx` (102 lines)
- **Path-inconsistency flag:** same legacy-shaped path as the rest of this catalog batch — `src/components/shared/charts/`, no `src/shared/charts/` counterpart, nothing duplicates it; canonical as-is.
- **Exports:** `export function ContributionsCard({ workSafetyYes, workSafetyNo, workplaceYes, workplaceNo }: { ...all four: number })`. Internally defines a **non-exported** helper `function Donut({ yes, no }: { yes: number; no: number })` (lines 3-64) — the donut-rendering unit is private to this file, called twice (once per category), not shared with `CategoryDistributionDonutCard`'s own separate donut implementation (i.e. two independent, near-identical hand-rolled donut implementations exist in this codebase — see Anti-patterns).

## Exact rendering technique / colors / values
Read verbatim from source:
- **Donut geometry:** `r = 44`, `circ = 2 * Math.PI * r` (≈276.5), `viewBox="0 0 120 120"`, `width={120} height={120}`, center `(60, 60)`, wrapped in `transform -rotate-90 drop-shadow-sm mb-6 mt-2` — identical rotation trick as `CategoryDistributionDonutCard`, smaller radius (44 vs. 54) and stroke width (18 vs. 22).
- **Track ring:** `<circle r={44} fill="none" stroke="#F8FAFC" strokeWidth={18} />` — same untokenized near-white slate as `CategoryDistributionDonutCard`'s track.
- **Two fixed segments, not a loop** (unlike `CategoryDistributionDonutCard`, which loops over an arbitrary `items[]`, this `Donut` hard-codes exactly two arcs):
  - **Yes segment:** `stroke="#22C55E"` (green), `strokeWidth={18}`, `strokeDasharray={`${yesDash} ${circ}`}`, `strokeDashoffset={0}` (starts at the rotated 12 o'clock origin), `strokeLinecap="butt"`.
  - **No segment:** `stroke="#EF4444"` (red), `strokeWidth={18}`, `strokeDasharray={`${noDash} ${circ}`}`, `strokeDashoffset={-yesDash}` (picks up immediately where the yes segment ends — offset by the yes segment's own dash length, not an accumulator variable like the donut card, since there are only ever exactly two segments).
  - `yesDash = yesPct * circ`, `noDash = noPct * circ`, `yesPct = total > 0 ? yes/total : 0`, `noPct = total > 0 ? no/total : 0`, `total = yes + no`.
  - `#22C55E` and `#EF4444` are **not** the tokenized semantic triad colors — `.ai-design-dna/02_DESIGN_DNA.json:60` explicitly flags `#22C55E` as one of the documented ad hoc greens/reds appearing "outside Badge/StagePill in a few dashboard/kanban files instead of the canonical semantic triads" (the tokenized equivalents would be `success.text` `#15803D`/`danger.text` `#B91C1C` per `semantic-colors.json:2,4`). `#EF4444` does match `color.errorTextAlt` (`colors.json:30`, `02_DESIGN_DNA.json:37` — "react-select error border"), a coincidental overlap with a different semantic role, not evidence of deliberate reuse.
  - Both segments share `className="transition-all duration-700 ease-out"` — same 700ms CSS transition convention as `CategoryDistributionDonutCard`.
- **Below-donut stat row:** `flex gap-6 text-center`, three columns:
  1. Yes count: `text-[18px] font-bold text-[#22C55E]` + caption `{t("dashboard.donutYesLabel","Yes")} {Math.round(yesPct*100)}%` in `text-[10px] text-slate-400`.
  2. No count: `text-[18px] font-bold text-[#EF4444]` + caption `{t("dashboard.donutNoLabel","No")} {Math.round(noPct*100)}%`.
  3. A **static placeholder third column**, always `0` / `— 0%`, in dimmed `text-slate-300`/`text-slate-300` — literal hard-coded `0` and `"— 0%"` text, not derived from any prop (lines 57-60). This looks like a stubbed-out third category (e.g. "N/A"/"pending") that was never wired to real data — flagged as dead/vestigial UI, not a bug to silently remove.
- **Card-level layout:** `ContributionsCard` itself renders the outer card shell (`bg-white border border-slate-100 rounded-2xl shadow-sm p-6 h-full flex flex-col` — identical shell classes to `CategoryDistributionDonutCard`), a header icon+title row (checkmark-circle stroke icon + `t("dashboard.contributionsCardTitle", "Contributions (accepted ideas)")`), then a `grid grid-cols-2 gap-4 flex-1` with a `border-r border-slate-50` divider on the first (Work Safety) column only. Each column has its own bold `text-[13px]` sub-label (`Work safety` / `Workplace`) self-aligned to the start, then centers its `Donut` vertically via `mt-auto mb-auto`.

## Usage rules
- All four numeric props (`workSafetyYes/No`, `workplaceYes/No`) are required — there's no partial/optional rendering; pass `0` explicitly for missing counts (the component already guards `total > 0` for percentage math).
- This component is purpose-built for exactly the Work Safety / Workplace two-category shape baked into its props signature — it is not a generic "N-category yes/no donut grid." Do not try to reuse it for a third contribution category without changing the prop signature and grid.
- The unlabeled third "0 / — 0%" stat column renders unconditionally inside every `Donut` — be aware it will appear in any new call site too, not just the current dashboard one.

## Real call-site examples
```
$ grep -n "ContributionsCard" -r src/
src/components/shared/Dashboard.tsx:2:import { ContributionsCard } from "@/components/shared/charts/ContributionsCard";
src/components/shared/Dashboard.tsx:131:        <ContributionsCard
```
Full call site, `Dashboard.tsx:131-136`:
```tsx
<ContributionsCard
  workSafetyYes={analyticsData.workSafetyYes ?? 0}
  workSafetyNo={analyticsData.workSafetyNo ?? 0}
  workplaceYes={analyticsData.workplaceImprovementYes ?? 0}
  workplaceNo={analyticsData.workplaceImprovementNo ?? 0}
/>
```
Positioned as the third card of the "SECOND ROW" 3-up grid (`Dashboard.tsx:124-138`), between `VerticalBarChart` ("Ideas by department") and `CategoryDistributionDonutCard`. Reached from `DashboardScreen` via `AdminDashboard`/`ManagementDashboard` (`src/features/dashboard/container/DashboardScreen.tsx:331,342`) — note the API field names (`workplaceImprovementYes/No`) differ from the prop names (`workplaceYes/No`), a mapping done at the call site, not inside the component.

## Anti-patterns
- **Do not** introduce a chart library for this two-segment donut — reuse the exact `strokeDasharray`/`strokeDashoffset`-on-rotated-circle technique already established by this file and `CategoryDistributionDonutCard`.
- **Do not** silently delete the hard-coded "0 / — 0%" third column as unused UI without confirming with product whether a third contribution category is planned — it may be an intentional placeholder for future data rather than a leftover mistake.
- **Do not** consolidate this file's private `Donut` helper with `CategoryDistributionDonutCard`'s inline donut markup as a "cleanup" refactor without being asked — they are two independently evolved, structurally similar but not identical implementations (fixed 2-segment vs. arbitrary N-segment loop, different radii/stroke widths); this doc records that duplication as the real current state, not a target to fix silently.
- **Do not** swap `#22C55E`/`#EF4444` for the tokenized `success.text`/`danger.text` triad colors as a drive-by "consistency fix" — that is a legitimate improvement to propose, but it is a visual change outside the scope of documentation, and must be applied consistently everywhere this ad hoc green/red pairing appears (also in `VerticalBarChart`'s default accepted/rejected legend colors), not just here.
