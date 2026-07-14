# DocumentIcon

## Purpose

Maps a file's MIME `type` and/or filename `name` to one monochrome outline glyph representing its file category (image / video / audio / pdf / word / excel / powerpoint / zip / other). It is a thin dispatcher over the shared `Icons.tsx` icon set — it renders exactly one of six icon components, selected by `getFileCategory()`, and does not draw anything itself.

This is the "file-type-as-outline-icon" visual system. It is a **separate system** from `FileGlyph` (`src/shared/components/ui/index.tsx:1180`), which renders a colored square badge with the file extension as text (e.g. a red "PDF" chip using `background: color + "18"`, `border: color + "28"`). Both exist in the app for different contexts — see Anti-patterns.

## File / exports / prop signature

File: `src/shared/components/ui/DocumentIcon.tsx` (full file, 57 lines). Re-exported from the barrel via `export * from "./DocumentIcon";` in `src/shared/components/ui/index.tsx:1685`.

```ts
interface DocumentIconProps {
  type: string;         // MIME type string, e.g. "application/pdf", "image/png"
  name?: string;        // filename, used for extension-based fallback matching; default ""
  size?: number;        // icon width/height in px; default 18
  className?: string;   // default ""
}

export function DocumentIcon({ type, name = "", size = 18, className = "" }: DocumentIconProps): JSX.Element
```

Depends on `getFileCategory(type, name)` from `src/features/ideas/utils/documentUtils.ts` — note this import crosses a layer boundary: a `shared/components/ui` primitive imports a feature-level util (`@/features/ideas/utils/documentUtils`), which is the one architectural wart in this otherwise "shared has no feature deps" component. `getFileCategory` classifies by MIME prefix first (`image/`, `video/`, `audio/`), then falls back to filename extension matching (`png`, `jpg`, `mp4`, `mp3`, `pdf`, `doc`/`docx`, `xls`/`xlsx`/`csv`, `ppt`/`pptx`, `zip`/`rar`/`7z`/`gz`/`tar`), defaulting to `"other"`.

## Rendering / styling (full switch)

```tsx
switch (cat) {
  case "image":      return <ImageIcon size={size} className={`text-gray-700 ${className}`} />;
  case "video":       return <VideoIcon size={size} className={`text-gray-700 ${className}`} />;
  case "audio":       return <MusicIcon size={size} className={`text-gray-700 ${className}`} />;
  case "pdf":         return <FileIcon size={size} className={`text-gray-700 ${className}`} />;
  case "word":        return <FileTextIcon size={size} className={`text-gray-700 ${className}`} />;
  case "excel":       return <FileTextIcon size={size} className={`text-gray-700 ${className}`} />;
  case "powerpoint":  return <FileTextIcon size={size} className={`text-gray-700 ${className}`} />;
  case "zip":         return <ArchiveIcon size={size} className={`text-gray-700 ${className}`} />;
  default:            return <FileIcon size={size} className={`text-gray-700 ${className}`} />;
}
```

Every branch applies the **same** base class, `text-gray-700` (a stock Tailwind gray, not one of the named tokens like `text.secondary #6B7280` or `text.darkHeading900 #111827` — flagged in `02_DESIGN_DNA.json`'s `color.inconsistencyFlags` as a stock-palette leak pattern seen elsewhere too). Word/Excel/PowerPoint all render the identical `FileTextIcon` glyph — there is no visual distinction between Office document types beyond "generic text-file page" — and PDF and "other/unknown" both render `FileIcon`, so PDFs and unrecognized files are visually indistinguishable via `DocumentIcon` alone.

Icons come from `src/shared/components/ui/Icons.tsx`, following the house Feather/Lucide-style convention (`viewBox 0 0 24 24`, `stroke: currentColor`, `strokeWidth: 1.5`, round caps/joins — per `02_DESIGN_DNA.json` `icons.style`). `color: currentColor` means `DocumentIcon`'s visible color is entirely controlled by the `text-gray-700` class (or an overriding class passed via `className`), not by any prop.

Default `size` is 18px; observed call-site overrides are 16 and 20 (both within the app's `mostCommonRenderSizes` icon range per token file).

## Usage rules

- Use `DocumentIcon` for small inline file-type indicators (chat attachments, upload lists, document chips) where a monochrome glyph matching the surrounding icon language is wanted.
- Use `FileGlyph` instead when a colored, extension-labeled badge is the goal (e.g. a larger file-preview tile where the extension text itself — "PDF", "XLSX" — needs to be legible and color-coded per `fileTypeGlyph` tokens).
- Always pass both `type` and `name` when both are available — `name`'s extension is the fallback path when `type` is empty/generic (e.g. a blob with `type: ""`), so omitting `name` degrades classification for that case.
- Wrap in your own sized/colored container for background treatment (all three real call sites wrap `DocumentIcon` in a `div`/`span` with `w-*/h-*` and a background) — the component itself has no box, background, or padding.

## Real call-site examples

`src/features/ideas/components/UploadDocumentModal.tsx:63`:
```tsx
<div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">
  <DocumentIcon type={doc.type} name={doc.name} size={20} className="text-gray-400" />
</div>
```
(overrides the default `text-gray-700` to a lighter `text-gray-400`, since this is a thumbnail-fallback slot rather than a primary glyph)

`src/features/ideas/components/FileAnswerDisplay.tsx:102`:
```tsx
<a href={url} target="_blank" rel="noopener noreferrer"
   className="inline-flex items-center gap-2 px-3 py-2 rounded-[8px] border border-border bg-bg hover:bg-gray-50 hover:border-gray-300 transition-colors max-w-full">
  <DocumentIcon type={ext} name={filename} size={16} />
  <span className="text-[12.5px] font-medium text-text truncate">{filename}</span>
  <ArrowRightIcon width={12} height={12} className="text-text-3 shrink-0 -rotate-45" />
</a>
```

`src/features/ideas/container/IdeaDetailScreen.tsx:445`:
```tsx
<span className="shrink-0 flex items-center justify-center w-5 h-5">
  <DocumentIcon type={doc.type} name={doc.name} size={16} />
</span>
```

Three call sites total, all in the `ideas` feature; `DocumentIcon` has no call sites outside `features/ideas` at present.

## Anti-patterns

- Do not pass a `size` outside the app's observed icon sizes (10–18px most common) without reason — 16/18/20 are what's actually used; a much larger `DocumentIcon` would look out of place next to the hand-drawn icon set's usual scale.
- Do not rely on `DocumentIcon` to visually distinguish Word vs Excel vs PowerPoint — all three collapse to the same `FileTextIcon`. If that distinction matters, use `FileGlyph`'s colored-extension-badge system instead (tokens: `fileTypeGlyph.XLSX #2563EB`, `fileTypeGlyph.PPT #D97706`, etc. — Word has no dedicated color token, only PDF/CSV/XLSX/PPT/PNG/JPG plus a gray fallback).
- Don't introduce a new stock-Tailwind gray (`text-gray-*`) elsewhere in new file-icon code by copying this component's pattern; it's a known, flagged inconsistency (see `02_DESIGN_DNA.json` → `color.inconsistencyFlags`), not a convention to extend.
- The `shared/components/ui` → `features/ideas/utils` import direction (feature util imported by a shared primitive) is backwards from the codebase's normal layering; do not add more shared-component imports of feature-level utilities — if `getFileCategory` needs to be reused broadly, it belongs in `shared/lib`, not `features/ideas/utils`.
