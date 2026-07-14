# TotalEconomicImpactCard

## Purpose
A stat-card-plus-mini-bar-chart hybrid: a large animated currency headline (`grandTotal`, via `NumberFlow`) above a two-bar SVG comparison of Total Savings vs. Additional Profit, each bar labeled with its formatted EUR value and share-of-total percentage.

## File path & path-inconsistency flag
- **File:** `src/components/shared/charts/TotalEconomicImpactCard.tsx` (165 lines)
- **Path-inconsistency flag:** same legacy-shaped path as the rest of this catalog batch — `src/components/shared/charts/`, no `src/shared/charts/` counterpart, nothing duplicates it; canonical as-is.
- **Export:** `export function TotalEconomicImpactCard({ totalSavings, totalProfit, grandTotal }: { totalSavings: number; totalProfit: number; grandTotal: number })`.
- **Notable dependency:** imports `NumberFlow` from `@number-flow/react` (line 1) for the animated headline number — the only component in this six-file set that reaches for an external animation library rather than plain CSS transitions.

## Exact rendering technique / colors / values
Read verbatim from source:
- **Layout constants** (lines 10-16): `W = 320, H = 154`; `PAD = { l: 20, r: 20, t: 18, b: 38 }`; `chartH = H - PAD.t - PAD.b = 98`; `barW = 80`; fixed bar x-positions `bar1X = 50` (Savings), `bar2X = 190` (Profit) — unlike the other charts in this batch, bar positions are **hard literals**, not computed from an items array (this chart is permanently exactly-two-bars).
- **Currency formatting:** a local `fmt()` (lines 18-24) using `Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })` for the in-SVG bar-value labels — German locale grouping (period thousands separator, comma decimal, though `maximumFractionDigits: 0` means no decimals shown), plus a separate `EUR_FORMAT` const object (lines 4-8, same currency/format shape but consumed by `NumberFlow`'s `format` prop for the animated headline, not `Intl.NumberFormat` directly). Two independently defined but shape-identical currency-format objects for the same visual output.
- **Bar height scale:** `maxVal = Math.max(totalSavings, totalProfit, 1)` (the trailing `, 1` guards divide-by-zero); `sh = Math.round((totalSavings / maxVal) * chartH)`, `ph = Math.round((totalProfit / maxVal) * chartH)` — each bar's height is relative to whichever of the two values is larger (not relative to `grandTotal`), so the taller of the two bars always fills the full `chartH`.
- **Percent labels:** `savingsPct = grandTotal > 0 ? Math.round((totalSavings/grandTotal)*100) : 0`, `profitPct` symmetrically — these ARE relative to `grandTotal`, distinct from the height scale's relative-to-max basis; the two percentages and the two bar heights are computed on different denominators by design.
- **Baseline line:** `<line>` at `y = PAD.t + chartH`, full chart width, `stroke="#E5E7EB"` (= tokenized `border.default`, `colors.json:17`), `strokeWidth={1}`.
- **Mid gridline:** `<line>` at `y = PAD.t + chartH/2`, `stroke="#F3F4F6"` (= tokenized `hoverSurface`, `colors.json:20`), `strokeDasharray="4 3"` — the only dashed (non-solid) gridline in this component set.
- **Savings bar:** `fill="#1B6B3A"`, `fillOpacity={0.85}`, `rx={4}`. `#1B6B3A` (a dark forest green) is **not present anywhere** in `.ai-design-dna/12_DESIGN_TOKENS/*.json` — a third distinct ad hoc "success-adjacent" green in this codebase, alongside `#16A34A` (Quick Win category, tokenized as `pilot`/`CSV`) and `#22C55E` (`ContributionsCard`'s yes-donut, explicitly flagged ad hoc in `02_DESIGN_DNA.json:60`). Its value label text reuses the same `#1B6B3A`, `fontSize={9.5}`, `fontWeight={700}`.
- **Profit bar:** `fill="#006AB3"`, `fillOpacity={0.85}`, `rx={4}` — the **same** `#006AB3` blue used by `IdeasPerDepartmentChart`'s fill bar; also absent from the token set. Value label text reuses `#006AB3` at the same size/weight as the savings label.
- **Axis category labels** ("Total Savings" / "Additional Profit"): `fontSize={9.5}`, `fill="#6B7280"` (= tokenized `text.secondary`, `colors.json:11`).
- **Percentage sub-labels** (`{savingsPct}%` / `{profitPct}%`): `fontSize={9}`, `fill="#9CA3AF"` (= tokenized `text.tertiary`, `colors.json:12`).
- **Headline block above the chart:** eyebrow-style card title `text-[13px] font-semibold text-slate-800 tracking-tight`, then the animated total `text-[32px] font-semibold tracking-[-0.032em] leading-none text-text` wrapping `<NumberFlow value={grandTotal} format={EUR_FORMAT} />` (auto-animates on `grandTotal` changes — the only true value-transition animation, as opposed to CSS `transition-all`, in this component set), then a static caption `t("dashboard.savingsPlusProfit", "Savings + additional profit")` in `text-[12px] text-text-3`.
- **Card shell:** `bg-white border border-slate-200 rounded-xl shadow-sm px-[22px] py-[18px] h-full` — note this uses `slate-200` (not `slate-100` like `CategoryDistributionDonutCard`/`ContributionsCard`) and `rounded-xl` (not `rounded-2xl`) — a small but real shell-styling divergence between this chart-card family's members, cited as-is.
- **Responsiveness:** `<svg width="100%" height={H} viewBox="0 0 320 154" preserveAspectRatio="xMidYMid meet">` — same width-flex/fixed-height pattern as `IdeasPerDepartmentChart`, but here `H` is a true constant (not row-count-dependent).

## Usage rules
- All three numeric props are required and independent — `grandTotal` is **not** derived internally from `totalSavings + totalProfit`; the caller must supply a consistent `grandTotal` (the live call site falls back to `savings + profit` at the call site itself, not inside this component — see below).
- Because bar height is scaled against `Math.max(totalSavings, totalProfit, 1)` rather than their sum, the two bars are a "which is bigger" visual, not a stacked/proportional-to-total one — do not expect the two bar heights to sum to a full-height bar the way a stacked chart would.

## Real call-site examples
**None found.** A repo-wide search for `TotalEconomicImpactCard` returns only its own definition:
```
$ grep -rn "TotalEconomicImpactCard" src/
src/components/shared/charts/TotalEconomicImpactCard.tsx:26:export function TotalEconomicImpactCard({
```
It is dead/unused code, exactly like `IdeasPerDepartmentChart`. The live dashboard (`src/components/shared/Dashboard.tsx:97-104`) instead renders the "Total Economic Impact" figure via the generic `StatCard` primitive from `src/shared/components/ui`:
```tsx
<StatCard
  label={t("dashboard.statTotalEconomicImpact", "Total Economic Impact")}
  value={formatEur(grand)}
  icon={BulbIcon}
  iconBg="bg-purple-50"
  iconBorder="border-purple-200"
  iconColor="text-purple-600"
/>
```
(`grand = Number(analyticsData.grandTotal) || savings + profit`, `Dashboard.tsx:54-56`) — a plain number tile, no bar breakdown, no `NumberFlow` animation. `Dashboard.tsx` separately renders Savings/Profit as two more flat `StatCard`s (lines 105-120), meaning the "compare Savings vs. Profit visually" idea this component encodes is currently not surfaced anywhere in the live UI at all.

## Anti-patterns
- **Do not** introduce a chart library to reimplement this two-bar comparison — reuse the same manual `rect`/scale-to-`chartH` math already established here and in `IdeasPerDepartmentChart`.
- **Do not** invent a new green/blue for a revived version of this card — if reactivating it, keep `#1B6B3A` (savings) and `#006AB3` (profit) exactly as-is for continuity with `IdeasPerDepartmentChart`'s existing `#006AB3` profit-adjacent blue, rather than picking new hexes or "fixing" them to a tokenized color without a design decision to do so.
- **Do not** wire this back into `Dashboard.tsx` as a second, competing rendering of the grand-total figure alongside the existing `StatCard` trio without removing/replacing one of them — having both would show the same `grandTotal` value twice in different visual forms on one screen.
- **Do not** assume `NumberFlow` is a house convention to reuse elsewhere without checking — it is not imported by any other file in `src/components/shared/charts/` or the wider `src/shared/components/ui` primitive set; verify it's still a desired dependency before propagating its use.
