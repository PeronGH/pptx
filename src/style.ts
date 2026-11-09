/**
 * Public style types and merge helpers for the JSX API.
 *
 * Plain data types shared with the OOXML writer (fills, lines, shadows, ...)
 * are defined once in `ooxml/slide.ts` and re-exported here.
 */

import type { Emu } from "./types.ts";
import type { TextLevel } from "./ooxml/enums.ts";
import type {
  Bullet,
  CropRect,
  Fill,
  GradientStop,
  Insets,
  LineDash,
  LineProperties,
  LineSpacing,
  ParagraphSpacing,
  Shadow,
  TextFit,
  TextRunStyle,
} from "./ooxml/slide.ts";

export type {
  Bullet,
  CropRect,
  Fill,
  GradientStop,
  Insets,
  LineDash,
  LineSpacing,
  Shadow,
  TextFit,
};

/** Line (outline) properties for shapes and table cells. */
export type LineStyle = LineProperties;

/** Paragraph spacing in EMUs. */
export type Spacing = ParagraphSpacing;

/** Alignment options for paragraphs. */
export type Alignment = "left" | "center" | "right" | "justify";

/** Main-axis alignment for layout containers. */
export type MainAlignment = "start" | "center" | "end" | "space-between";

/** Cross-axis alignment for layout containers. */
export type CrossAlignment = "start" | "center" | "end" | "stretch";

/** Vertical alignment for text within a text body. */
export type VerticalAlignment = "top" | "middle" | "bottom";

/** Image fit behavior within an allocated frame. */
export type ImageFit = "contain" | "cover" | "stretch";

/** Inline text styling. */
export type TextStyle = TextRunStyle;

/** Paragraph styling. */
export interface ParagraphStyle {
  readonly level?: TextLevel;
  readonly align?: Alignment;
  readonly bullet?: Bullet;
  readonly spacing?: Spacing;
  readonly lineSpacing?: LineSpacing;
}

/** Shape-backed text box styling. */
export interface BoxStyle {
  readonly fill?: Fill;
  readonly line?: LineStyle;
  readonly verticalAlign?: VerticalAlignment;
  readonly padding?: Emu | Insets;
  readonly fit?: TextFit;
  readonly shadow?: Shadow;
}

/** Table cell styling. */
export interface CellStyle {
  readonly fill?: Fill;
  readonly line?: LineStyle;
  readonly padding?: Emu | Insets;
  readonly verticalAlign?: VerticalAlignment;
}

/** Unified styling for content containers: box, paragraph, and text-run fields. */
export interface Style extends BoxStyle, ParagraphStyle, TextStyle {}

type StyleEntry<T> = T | false | null | undefined;

/** One style object or an array merged left to right; falsy entries are skipped. */
export type StyleInput<T> = StyleEntry<T> | ReadonlyArray<StyleEntry<T>>;

/** Style input restricted to text-run fields. */
export type TextStyleInput = StyleInput<TextStyle>;

function styleEntries<T>(input?: StyleInput<T>): ReadonlyArray<T> {
  if (input === undefined || input === false || input === null) return [];
  if (Array.isArray(input)) {
    return input.filter((entry): entry is T =>
      entry !== undefined && entry !== false && entry !== null
    );
  }
  return [input as T];
}

/** Merge two optional objects field by field, later defined values winning. */
function mergeFields<T extends object>(
  base: T | undefined,
  next: T | undefined,
): T | undefined {
  if (!base) return next;
  if (!next) return base;
  const merged = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(next)) {
    if (value !== undefined) merged[key] = value;
  }
  return merged as T;
}

/** Merge padding values; per-side objects merge, scalars replace. */
export function mergeInsets(
  base: Emu | Insets | undefined,
  next: Emu | Insets | undefined,
): Emu | Insets | undefined {
  if (next === undefined) return base;
  if (typeof next === "number" || typeof base !== "object") return next;
  return mergeFields(base, next);
}

/** Merge text styles, later defined fields winning. */
export function mergeTextStyles(
  base: TextStyle | undefined,
  next: TextStyle | undefined,
): TextStyle | undefined {
  return mergeFields(base, next);
}

/** Merge paragraph styles, later defined fields winning. */
export function mergeParagraphStyles(
  base: ParagraphStyle | undefined,
  next: ParagraphStyle | undefined,
): ParagraphStyle | undefined {
  if (!base || !next) return next ?? base;
  return {
    ...mergeFields(base, next),
    spacing: mergeFields(base.spacing, next.spacing),
  };
}

/** Resolve text style input into a concrete style object. */
export function resolveTextStyle(
  style?: TextStyleInput,
): TextStyle | undefined {
  return styleEntries(style).reduce<TextStyle | undefined>(
    mergeTextStyles,
    undefined,
  );
}

/**
 * Resolve a unified style input. Fills replace; lines, shadows, spacing, and
 * per-side padding merge field by field.
 */
export function resolveStyle(
  style?: StyleInput<Style>,
): Style | undefined {
  return styleEntries(style).reduce<Style | undefined>((merged, entry) => {
    if (!merged) return entry;
    return {
      ...mergeFields(merged, entry),
      line: mergeFields(merged.line, entry.line),
      shadow: mergeFields(merged.shadow, entry.shadow),
      spacing: mergeFields(merged.spacing, entry.spacing),
      padding: mergeInsets(merged.padding, entry.padding),
    };
  }, undefined);
}

/** Split result for a unified style. */
interface SplitStyle {
  readonly box: BoxStyle | undefined;
  readonly paragraph: ParagraphStyle | undefined;
  readonly text: TextStyle | undefined;
}

function pick<T extends object>(
  style: Style,
  keys: ReadonlyArray<keyof T & keyof Style>,
): T | undefined {
  const picked: Record<string, unknown> = {};
  for (const key of keys) {
    if (style[key] !== undefined) picked[key] = style[key];
  }
  return Object.keys(picked).length > 0 ? picked as T : undefined;
}

/** Decompose a unified style into box, paragraph, and text parts. */
export function splitStyle(style: Style | undefined): SplitStyle {
  if (!style) return { box: undefined, paragraph: undefined, text: undefined };
  return {
    box: pick<BoxStyle>(style, [
      "fill",
      "line",
      "verticalAlign",
      "padding",
      "fit",
      "shadow",
    ]),
    paragraph: pick<ParagraphStyle>(style, [
      "level",
      "align",
      "bullet",
      "spacing",
      "lineSpacing",
    ]),
    text: pick<TextStyle>(style, [
      "bold",
      "italic",
      "underline",
      "strike",
      "baseline",
      "highlight",
      "characterSpacing",
      "caps",
      "fontSize",
      "fontColor",
      "fontFamily",
    ]),
  };
}
