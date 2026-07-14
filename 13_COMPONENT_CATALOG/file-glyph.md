# FileGlyph

## 1. Purpose

A small, square, color-coded badge that identifies a document's file type at a glance (PDF, CSV, XLSX, PPT, PNG, JPG). It renders the file-kind string itself as the glyph content (e.g. literally the text `"PDF"`) rather than an icon — there is no icon-font/SVG lookup table, the "glyph" is typography. Used anywhere a presentation/attachment/document row needs a compact type indicator before its filename.

## 2. File / exports / prop signature

- **File:** `src/shared/components/ui/index.tsx:1171-1209`
- **Duplicated (near-identical) in the legacy barrel:** `src/components/ui/index.tsx:424` — per `.ai-design-dna/12_DESIGN_TOKENS/components.json`'s `legacyDoNotUse`, that file is a superseded subset. Do not add new call sites there.
- **Export:** `export function FileGlyph({ kind, size = 36 }: { kind: string; size?: number })`

```ts
function FileGlyph({
  kind,        // required — a file-kind string, e.g. "PDF" | "CSV" | "XLSX" | "PPT" | "PNG" | "JPG" | anything else
  size = 36,   // optional — width & height in px, square
}: {
  kind: string;
  size?: number;
}): JSX.Element
```

No `className`/`style` passthrough, no `onClick`, no `aria-label` — purely visual, and the rendered text content *is* `kind` verbatim (whatever string is passed, not necessarily one of the known keys).

## 3. Exact color map — `FILE_COLORS` (`src/shared/components/ui/index.tsx:1172-1179`)

| Kind | Color |
|---|---|
| `PDF` | `#DC2626` |
| `CSV` | `#16A34A` |
| `XLSX` | `#2563EB` |
| `PPT` | `#D97706` |
| `PNG` | `#7C3AED` |
| `JPG` | `#7C3AED` |
| *(any other string, incl. `undefined`/lowercase variants)* | fallback `#6B7280` |

Confirmed identical in `.ai-design-dna/02_DESIGN_DNA.json` → `color.fileTypeGlyph` and `.ai-design-dna/12_DESIGN_TOKENS/semantic-colors.json` → `fileTypeAlphaConvention` (this catalog entry is the canonical consumer of both).

**Alpha derivation (line 1187, 1194, 1203) — not a separate token, computed inline per render:**
- `color = FILE_COLORS[kind] || "#6B7280"`
- `background = color + "18"` — hex string concatenation, i.e. `#DC2626` + `"18"` → `#DC262618` (~9% alpha)
- `border = 1px solid ${color}28` — i.e. `#DC262628` (~16% alpha)
- `color` (the CSS text color) is the **solid**, non-alpha hex value.

This is a string-concat convention, not a color-mixing function — `kind` lookup miss silently falls back to gray rather than throwing, so an unrecognized/mistyped kind (e.g. `"docx"` lowercase, or `"DOCX"` unmapped) renders as a plain gray badge with no visual error.

## 4. Exact dimensions

| Property | Value | Source |
|---|---|---|
| Default size (width = height) | `36px` | prop default `size = 36` |
| Border radius | `8px` | fixed, not a `size`-derived scale — matches `radius.componentSpecific.fileGlyph` in `.ai-design-dna/12_DESIGN_TOKENS/radius.json` |
| Border width | `1px` | fixed |
| Font size | `9px` | fixed, does **not** scale with `size` |
| Font weight | `700` | fixed |
| Font family | `"JetBrains Mono, monospace"` | matches project's mono token family |
| Letter spacing | `0.04em` | fixed |
| Layout | `display: grid; placeItems: center` | centers the kind text in the square |
| `flexShrink` | `0` | prevents the glyph from collapsing in flex rows (it is always placed beside a filename) |

Because font-size is fixed at `9px` regardless of the `size` prop, calling with a large `size` (e.g. `72`, see call site below) produces a large colored square with small centered text — it does not scale up like an icon. There is no built-in size-to-fontSize lookup; a future AI adding a new large usage should be aware the glyph text will look small relative to the box unless a size-aware fontSize is added deliberately (not currently present).

## 5. Real call-site examples (grep-verified)

| File:line | Usage |
|---|---|
| `src/features/presentations/container/PresentationScreens.tsx:45` | `<FileGlyph kind={p.kind} size={40} />` — list row, `kind` values from `MOCK_PRESENTATIONS` are `'PPT'`, `'PDF'`, `'XLSX'` (`PresentationScreens.tsx:10-15`) |
| `src/features/presentations/container/PresentationScreens.tsx:96` | `<FileGlyph kind={p.kind} size={72} />` — presentation detail screen, large centered glyph above the title, inside a `480px`-min-height white card |

Import site: `src/features/presentations/container/PresentationScreens.tsx:5` — `import { Avatar, Button, Badge, PageHeader, FileGlyph } from '@/shared/components/ui';` (imports from the canonical `src/shared/components/ui` barrel, not the legacy `src/components/ui`).

No other feature currently renders `FileGlyph` — it is presentations-only at time of writing, though nothing about the component is presentation-specific.

## 6. Usage rules

- Use `FileGlyph` only for **file-type identification** next to an attachment/document name or thumbnail placeholder — it is not a generic icon-badge primitive.
- The text rendered is exactly the `kind` string passed in — callers must pass an already-uppercased, already-abbreviated kind (`"PDF"`, `"XLSX"`, etc.). The component does no case-normalization or truncation; passing a long string (e.g. `"POWERPOINT"`) will overflow/wrap awkwardly in a 36px box since there's no `overflow`/`whiteSpace` guard.
- If a new file type needs support, its color must be added to `FILE_COLORS` (and mirrored into `.ai-design-dna/02_DESIGN_DNA.json` → `color.fileTypeGlyph` and `12_DESIGN_TOKENS/semantic-colors.json`) — see anti-pattern below.

## 7. Anti-patterns

- **Never invent a new file-type color outside `FILE_COLORS`.** If a kind isn't in the map, it silently renders gray (`#6B7280`) — that is the intended "unknown type" fallback, not a bug to patch by hardcoding a one-off color at the call site. Add the kind to the shared map (and the token docs) instead of overriding color via inline `style`/CSS on a per-call basis.
- **Do not hand-roll the alpha suffixes.** The `"18"`/`"28"` hex-alpha-suffix convention is specific to this component (and mirrored by `StagePill`'s hardcoded triads); don't reimplement it with `rgba()` or a different alpha percentage elsewhere for "file-type-flavored" UI — reuse `FileGlyph` itself, or replicate the exact `color + "18"` / `color + "28"` string convention if a genuinely new surface needs it.
- **Do not import from `src/components/ui/index.tsx`** (the legacy duplicate at line 424) for new code — always import `FileGlyph` from `@/shared/components/ui`.
- **Do not expect size-proportional text.** Don't bump `size` expecting the glyph label to scale — font-size is fixed at 9px; for a genuinely bigger label treatment, this component is the wrong tool.
