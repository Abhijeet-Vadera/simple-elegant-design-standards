# DatePicker

## Purpose

A styled wrapper around `react-datepicker` (`ReactDatePickerLib`) that normalizes the system's date/time editing into one component with three modes (date-only, time-only, date+time), two density sizes, string-in/string-out value semantics (no `Date` objects cross the component boundary), and i18n locale switching (English default, German via `date-fns/locale`'s `de`). It is listed in `02_DESIGN_DNA.json` `components.adjacentPrimitives` — i.e. it lives next to, but is not re-exported from, the main `index.tsx` barrel; it's imported directly from its own file.

## File / exports / prop signature

Files: `src/shared/components/ui/DatePicker.tsx` (full file, 150 lines) + co-located `src/shared/components/ui/DatePicker.css` (115 lines, overrides for `react-datepicker`'s own stylesheet).

```ts
export interface DatePickerProps {
  value: string | undefined;          // ISO date "YYYY-MM-DD", or "" / undefined for empty
  onChange: (value: string) => void;  // receives formatted string per mode, or "" when cleared
  min?: string;                        // ISO date "YYYY-MM-DD" — mirrors native `min`
  max?: string;                        // ISO date "YYYY-MM-DD" — mirrors native `max`
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
  size?: "sm" | "md";                  // default "md" — mirrors Button's size pattern
  className?: string;                  // escape hatch for call-site overrides
  id?: string;
  name?: string;
  required?: boolean;
  autoFocus?: boolean;
  showTimeSelect?: boolean;            // adds inline time list to a date picker → datetime mode
  showTimeSelectOnly?: boolean;        // time-only mode; hides the calendar grid entirely
  timeIntervals?: number;              // default 15 (minutes)
  timeCaption?: string;                // default "Time"
  dateFormat?: string;                 // override; otherwise auto-derived (see Modes below)
}

export function DatePicker(props: DatePickerProps): JSX.Element
```

Not re-exported from `src/shared/components/ui/index.tsx` — every call site imports it directly:
```ts
import { DatePicker } from "@/shared/components/ui/DatePicker";
```

## Modes: date-only / time-only / datetime

Mode is selected by two booleans, `showTimeSelect` and `showTimeSelectOnly`, which also drive format strings and the `onChange` payload shape:

| Mode | Flags | `dateFormat` (auto, if not overridden) | `onChange` payload format | Icon shown |
|---|---|---|---|---|
| date-only (default) | neither set | `"MMM d, yyyy"` | `format(date, "yyyy-MM-dd")` | `CalendarIcon` |
| datetime | `showTimeSelect` only | `"MMM d, yyyy h:mm aa"` | `format(date, "yyyy-MM-dd HH:mm")` | `CalendarIcon` |
| time-only | `showTimeSelect` **and** `showTimeSelectOnly` | `"h:mm aa"` | `format(date, "h:mm aa")` | `ClockIcon` |

```ts
const resolvedDateFormat =
  dateFormat ||
  (showTimeSelectOnly ? "h:mm aa" : showTimeSelect ? "MMM d, yyyy h:mm aa" : "MMM d, yyyy");

const IconToRender = showTimeSelectOnly ? ClockIcon : CalendarIcon;
```

Parsing on the way in (`parseDateOrTime`) is mode-aware too: in time-only mode it tries `["h:mm aa", "hh:mm aa", "H:mm", "HH:mm"]` via `date-fns`'s `parse()` before falling back to `parseISO`; in date/datetime mode it goes straight to `parseISO`. `min`/`max` are only wired to `minDate`/`maxDate` when **not** `showTimeSelectOnly` (a bare time picker has no min/max date concept):
```tsx
minDate={min && !showTimeSelectOnly ? parseISO(min) : undefined}
maxDate={max && !showTimeSelectOnly ? parseISO(max) : undefined}
```

`handleDateChange` always calls `onChange("")` when the picker is cleared or the parsed date is invalid — callers never receive `null`/`undefined`, only `string` (including empty string).

## Size: sm / md

```ts
const dpSizes: Record<"sm" | "md", string> = {
  sm: "h-8 px-2.5 text-[12.5px]",   // 32px tall, matches Button/IconButton "sm" height token (32px)
  md: "h-10 px-[13px] text-[13.5px]", // 40px tall, matches surfaces.input height token (40px)
};
```
plus a size-dependent trailing icon size: `size === "sm" ? 14 : 16`. There is no `"lg"` size (unlike `Button`, which has `sm`/`md`/`lg`) — `DatePicker` only mirrors the bottom two rungs of that pattern.

## Exact styling

Input classes (`inputClassName`, applied to the underlying `react-datepicker` `<input>` via its `className` prop):
```ts
[
  "w-full border rounded-sm outline-none bg-card text-text transition-colors",
  dpSizes[size],
  error ? "border-red-400 focus:border-red-500" : "border-border focus:border-text",
  disabled ? "opacity-50 cursor-not-allowed bg-hover" : "",
  className,
].filter(Boolean).join(" ")
```
Notes:
- `border-border` / `focus:border-text` resolve to the Tailwind theme tokens `#E5E7EB` (border.default) and `#0A0A0A` (text/ink) respectively — consistent with every other input's focus-border convention in the app.
- The error state uses stock Tailwind `border-red-400`/`border-red-500`, **not** the app's semantic danger token (`#EF4444`/`#DC2626` per `02_DESIGN_DNA.json` `color.semantic.errorTextAlt`/`errorText`) — a small inconsistency versus `ReactSelect`'s error border, which does use the canonical `#EF4444`.
- `rounded-sm` here is Tailwind's *stock* small radius utility (0.125rem / 2px in default Tailwind), not this project's redefined `radius.sm` token (8px) — because this is a plain Tailwind utility class, not an inline style/literal. Worth flagging: visually this makes `DatePicker`'s input corners noticeably sharper than `Input`'s 8px-radius box unless Tailwind's `sm` key has been remapped in `tailwind.config.js`. Verify against `tailwind.config.js` before assuming parity with other inputs.
- Wrapper is `<div className="relative w-full">`, with the mode-dependent icon absolutely positioned `right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-3` (i.e. non-interactive, purely decorative, tinted with the `text.tertiary` token `#9CA3AF`).

Popper/calendar panel styling (`DatePicker.css`, overriding `react-datepicker`'s own CSS using CSS variables with hardcoded fallbacks that match the app's tokens):
```css
.react-datepicker-popper { z-index: 9999 !important; }   /* same escape-hatch z-index as ReactSelect's menuPortal */

.react-datepicker {
  background-color: var(--card, #ffffff) !important;
  border: 1px solid var(--border, #e5e7eb) !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1) !important;   /* pure-black tint, same inconsistency as ReactSelect's menu shadow */
  color: var(--text, #0a0a0a) !important;
}
.react-datepicker__header { background-color: var(--hover, #f9fafb) !important; border-bottom: 1px solid var(--border, #e5e7eb) !important; border-top-left-radius: 8px !important; border-top-right-radius: 8px !important; }
.react-datepicker__day--selected,
.react-datepicker__day--in-selecting-range,
.react-datepicker__day--in-range { background-color: var(--text, #0a0a0a) !important; color: #ffffff !important; }
.react-datepicker__day--keyboard-selected { background-color: rgba(10,10,10,0.1) !important; color: var(--text, #0a0a0a) !important; }
```
The whole file leans on CSS variables (`--card`, `--border`, `--text`, `--hover`) with literal fallbacks — meaning if those CSS custom properties are ever removed/renamed at the root, the fallback hex values (`#ffffff`, `#e5e7eb`, `#0a0a0a`, `#f9fafb`/`#f3f4f6`) are what's actually rendered, and those fallbacks do match the canonical tokens (`surface`/`border.default`/`ink`/`hoverSurface`).

Popper portaled via `portalId="datepicker-portal"` (react-datepicker creates/reuses a div with that id under `document.body`), same escape-the-stacking-context strategy as `ReactSelect`'s `menuPortalTarget={document.body}`, both landing at `z-index: 9999`.

## i18n locale switching (en / de)

```ts
import { de } from "date-fns/locale";
registerLocale("de", de);   // module-level, runs once on import

const { i18n } = useTranslation();
const lang = i18n.resolvedLanguage || i18n.language || "en";
const locale = lang.startsWith("de") ? "de" : undefined;
...
<ReactDatePickerLib locale={locale} ... />
```
Only German has an explicitly registered `react-datepicker` locale; every other `i18next` language falls through to `locale={undefined}`, which makes `react-datepicker` use its own default (English) locale regardless of what other language the app UI is in. If the app ever adds a third locale (e.g. French), a new `registerLocale("fr", fr)` call plus a branch in the `lang.startsWith(...)` chain would be needed — the current code only branches on `"de"`.

Note this is the *calendar chrome* locale (month/day names, week start day) — the `timeCaption`, `placeholder`, and any surrounding `<Field label>` text are separately localized by the call site via `t()`; `DatePicker` itself does not translate its own defaults (`timeCaption || "Time"` falls back to a hardcoded English string if the caller doesn't pass a translated one).

## Usage rules

- Always wrap in the shared `Field` component for label/required/error-message chrome (every real call site does this) — `DatePicker` itself renders no label.
- Use `size="sm"` inside dense inline contexts (e.g. a to-do card's due-date row); default `size="md"` (40px) for standalone modal form fields, matching the general 40px input height convention.
- For a pure time picker (e.g. "expiry time"), pass **both** `showTimeSelect` and `showTimeSelectOnly` together — passing only `showTimeSelectOnly` without `showTimeSelect` is not a documented/tested combination in this codebase; every real call site that wants time-only sets both.
- `min`/`max` only affect date/datetime mode; don't expect them to bound a time-only picker.
- Pass `error` (boolean) to drive the red border; the component does not render its own error text — pair with `Field`'s error-message slot.

## Real call-site examples

Date-only, dense/sm, with a `min` floor of today, in a card (not a modal):
`src/features/ideas/components/IdeaTodoCard.tsx:166`
```tsx
<DatePicker
  value={dueDate}
  onChange={setDueDate}
  min={format(new Date(), "yyyy-MM-dd")}
  size="sm"
  className="bg-white text-text-2"
/>
```

Date-only + time-only pair side by side (two separate `DatePicker`s, one per mode, not one datetime picker) inside `Field`s:
`src/features/people/components/CreateInviteModal.tsx:303` and `:310`
```tsx
<Field label={t("people.inviteFieldExpiryDate")} required>
  <DatePicker value={expiryDate} onChange={setExpiryDate} min={todayStr} />
</Field>
<Field label={t("people.inviteFieldExpiryTime")}>
  <DatePicker
    value={expiryTime}
    onChange={setExpiryTime}
    showTimeSelect
    showTimeSelectOnly
    timeIntervals={15}
    timeCaption={t("people.inviteFieldExpiryTime")}
  />
</Field>
```

Date-only with validation error wiring, default `md` size, inside a modal `Field`:
`src/features/pitch-session/components/CreateSessionModal.tsx:93`
```tsx
<Field label={t("pitchSession.createModal.pitchDateLabel")} required error={dateError}>
  <DatePicker
    value={date}
    onChange={(value) => { setDate(value); setDateError(""); }}
    error={!!dateError}
    disabled={isPending}
  />
</Field>
```

Only 3 files use `DatePicker` app-wide (`IdeaTodoCard`, `CreateInviteModal` ×2, `CreateSessionModal`) — this is a lightly-adopted but real (unlike `ReactSelect`/`Pagination`) primitive.

## Anti-patterns

- Don't request "date and time in one field" by only setting `showTimeSelect` — that's exactly the datetime mode (calendar + inline time list in the same popper); reserve `showTimeSelect + showTimeSelectOnly` together for a *time-only* field. The naming is easy to misread: `showTimeSelectOnly` does not mean "only show time select UI within the datetime picker," it means "hide the calendar and be a time-only picker."
- Don't pass `Date` objects to `value`/expect them from `onChange` — the public contract is strings only (`"YYYY-MM-DD"`, `"YYYY-MM-DD HH:mm"`, or `"h:mm aa"` depending on mode). Internal `Date` conversion is private to the component.
- Don't assume `min`/`max` work in time-only mode; they're intentionally suppressed there.
- Don't add a new locale by hardcoding another `lang.startsWith("xx")` branch without also calling `registerLocale("xx", xxLocale)` from `date-fns/locale` — both halves are required, and only "de" currently has both.
- Don't rely on `rounded-sm` here matching this project's `radius.sm` token (8px) — Tailwind's stock `rounded-sm` (2px in default Tailwind) is a different value; verify `tailwind.config.js` before treating `DatePicker`'s corner radius as visually identical to `Input`'s.
