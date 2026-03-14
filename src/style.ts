/**
 * Public style types and merge helpers for the JSX API.
 */

import type { Emu, HexColor, HundredthPoint, Percentage } from "./types.ts";

/** Alignment options for paragraphs. */
export type Alignment = "left" | "center" | "right" | "justify";

/** Main-axis alignment for layout containers. */
export type MainAlignment = "start" | "center" | "end" | "space-between";

/** Cross-axis alignment for layout containers. */
export type CrossAlignment = "start" | "center" | "end" | "stretch";

/** Vertical alignment for text within a text body. */
export type VerticalAlignment = "top" | "middle" | "bottom";

/** Bullet specification for a paragraph. */
export type Bullet =
  | { readonly kind: "char"; readonly char: string }
  | { readonly kind: "autonum"; readonly type: string }
  | { readonly kind: "none" };

/** Paragraph spacing in EMUs. */
export interface Spacing {
  readonly before?: Emu;
  readonly after?: Emu;
}

/** A gradient stop position and color. */
export interface GradientStop {
  readonly pos: Percentage;
  readonly color: HexColor;
  readonly alpha?: number;
}

/** Fill specification for shapes and cells. */
export type Fill =
  | {
    readonly kind: "solid";
    readonly color: HexColor;
    readonly alpha?: number;
  }
  | {
    readonly kind: "linear-gradient";
    readonly angle: number;
    readonly stops: ReadonlyArray<GradientStop>;
  }
  | { readonly kind: "none" };

/** Preset dash styles for lines. */
export type LineDash = "solid" | "dash" | "dot" | "dash-dot";

/** Line (outline) properties for shapes. */
export interface LineStyle {
  readonly width?: Emu;
  readonly fill?: Fill;
  readonly dash?: LineDash;
}

/** Text fit behavior within a text body. */
export type TextFit = "none" | "shrink-text" | "resize-shape";

/** A simple outer shadow. */
export interface Shadow {
  readonly color: HexColor;
  readonly blur: Emu;
  readonly distance: Emu;
  readonly angle: number;
  readonly alpha?: number;
}

/** Crop percentages relative to the image source. */
export interface CropRect {
  readonly top?: Percentage;
  readonly right?: Percentage;
  readonly bottom?: Percentage;
  readonly left?: Percentage;
}

/** Image fit behavior within an allocated frame. */
export type ImageFit = "contain" | "cover" | "stretch";

/** Padding or inset values in EMUs. */
export interface Insets {
  readonly top?: Emu;
  readonly right?: Emu;
  readonly bottom?: Emu;
  readonly left?: Emu;
}

/** Inline text styling. */
export interface TextStyle {
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly fontSize?: HundredthPoint;
  readonly fontColor?: HexColor;
  readonly fontFamily?: string;
}

/** Paragraph styling. */
export interface ParagraphStyle {
  readonly level?: number;
  readonly align?: Alignment;
  readonly bullet?: Bullet;
  readonly spacing?: Spacing;
}

/** Shape-backed text box styling. */
export interface BoxStyle {
  readonly fill?: Fill;
  readonly line?: LineStyle;
  readonly verticalAlign?: VerticalAlignment;
  readonly inset?: Emu | Insets;
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

/** Unified styling for text containers: box, paragraph, and text-run fields. */
export interface TextContainerStyle
  extends BoxStyle, ParagraphStyle, TextStyle {}

export type StyleEntry<T> = T | false | null | undefined;
export type StyleInput<T> = StyleEntry<T> | ReadonlyArray<StyleEntry<T>>;

export type BoxStyleInput = StyleInput<BoxStyle>;
export type TextStyleInput = StyleInput<TextStyle>;
export type ParagraphStyleInput = StyleInput<ParagraphStyle>;
export type CellStyleInput = StyleInput<CellStyle>;
export type TextContainerStyleInput = StyleInput<TextContainerStyle>;

function isStyleValue<T>(entry: StyleEntry<T>): entry is T {
  return entry !== undefined && entry !== false && entry !== null;
}

function isSingleStyleValue<T>(input: StyleInput<T> | undefined): input is T {
  return !Array.isArray(input) && input !== undefined && input !== false &&
    input !== null;
}

function styleEntries<T>(input?: StyleInput<T>): ReadonlyArray<T> {
  if (input === undefined || input === false || input === null) return [];
  if (Array.isArray(input)) {
    return input.filter(isStyleValue);
  }
  if (isSingleStyleValue(input)) {
    return [input];
  }
  return [];
}

function cloneFill(fill: Fill | undefined): Fill | undefined {
  if (!fill) return undefined;
  if (fill.kind !== "linear-gradient") return { ...fill };
  return {
    kind: "linear-gradient",
    angle: fill.angle,
    stops: fill.stops.map((stop) => ({ ...stop })),
  };
}

function mergeFill(
  base: Fill | undefined,
  next: Fill | undefined,
): Fill | undefined {
  return next === undefined ? cloneFill(base) : cloneFill(next);
}

function mergeLineStyle(
  base: LineStyle | undefined,
  next: LineStyle | undefined,
): LineStyle | undefined {
  if (!base && !next) return undefined;
  if (!base) {
    return {
      width: next?.width,
      fill: cloneFill(next?.fill),
      dash: next?.dash,
    };
  }
  if (!next) {
    return {
      width: base.width,
      fill: cloneFill(base.fill),
      dash: base.dash,
    };
  }
  return {
    width: next.width ?? base.width,
    fill: mergeFill(base.fill, next.fill),
    dash: next.dash ?? base.dash,
  };
}

function mergeShadow(
  base: Shadow | undefined,
  next: Shadow | undefined,
): Shadow | undefined {
  if (!base && !next) return undefined;
  if (!base) return next ? { ...next } : undefined;
  if (!next) return { ...base };
  return {
    color: next.color ?? base.color,
    blur: next.blur ?? base.blur,
    distance: next.distance ?? base.distance,
    angle: next.angle ?? base.angle,
    alpha: next.alpha ?? base.alpha,
  };
}

function mergeSpacing(
  base: Spacing | undefined,
  next: Spacing | undefined,
): Spacing | undefined {
  if (!base && !next) return undefined;
  if (!base) return next ? { ...next } : undefined;
  if (!next) return { ...base };
  return {
    before: next.before ?? base.before,
    after: next.after ?? base.after,
  };
}

function mergeInsets(
  base: Emu | Insets | undefined,
  next: Emu | Insets | undefined,
): Emu | Insets | undefined {
  if (next === undefined) {
    if (typeof base === "number" || base === undefined) return base;
    return { ...base };
  }
  if (
    typeof next === "number" || typeof base === "number" || base === undefined
  ) {
    if (typeof next === "number") return next;
    return { ...next };
  }
  return {
    top: next.top ?? base.top,
    right: next.right ?? base.right,
    bottom: next.bottom ?? base.bottom,
    left: next.left ?? base.left,
  };
}

function mergeBoxDefinitions(
  definitions: ReadonlyArray<BoxStyle>,
): BoxStyle | undefined {
  if (definitions.length === 0) return undefined;
  let merged: BoxStyle = {};
  for (const definition of definitions) {
    merged = {
      fill: mergeFill(merged.fill, definition.fill),
      line: mergeLineStyle(merged.line, definition.line),
      verticalAlign: definition.verticalAlign ?? merged.verticalAlign,
      inset: mergeInsets(merged.inset, definition.inset),
      fit: definition.fit ?? merged.fit,
      shadow: mergeShadow(merged.shadow, definition.shadow),
    };
  }
  return merged;
}

export function mergeTextStyles(
  base: TextStyle | undefined,
  next: TextStyle | undefined,
): TextStyle | undefined {
  if (!base && !next) return undefined;
  if (!base) return next ? { ...next } : undefined;
  if (!next) return { ...base };
  return {
    bold: next.bold ?? base.bold,
    italic: next.italic ?? base.italic,
    underline: next.underline ?? base.underline,
    fontSize: next.fontSize ?? base.fontSize,
    fontColor: next.fontColor ?? base.fontColor,
    fontFamily: next.fontFamily ?? base.fontFamily,
  };
}

function mergeTextDefinitions(
  definitions: ReadonlyArray<TextStyle>,
): TextStyle | undefined {
  if (definitions.length === 0) return undefined;
  let merged: TextStyle = {};
  for (const definition of definitions) {
    merged = mergeTextStyles(merged, definition) ?? {};
  }
  return merged;
}

export function mergeParagraphStyles(
  base: ParagraphStyle | undefined,
  next: ParagraphStyle | undefined,
): ParagraphStyle | undefined {
  if (!base && !next) return undefined;
  if (!base) return next ? { ...next } : undefined;
  if (!next) return { ...base };
  return {
    level: next.level ?? base.level,
    align: next.align ?? base.align,
    bullet: next.bullet ?? base.bullet,
    spacing: mergeSpacing(base.spacing, next.spacing),
  };
}

function mergeParagraphDefinitions(
  definitions: ReadonlyArray<ParagraphStyle>,
): ParagraphStyle | undefined {
  if (definitions.length === 0) return undefined;
  let merged: ParagraphStyle = {};
  for (const definition of definitions) {
    merged = mergeParagraphStyles(merged, definition) ?? {};
  }
  return merged;
}

function mergeCellDefinitions(
  definitions: ReadonlyArray<CellStyle>,
): CellStyle | undefined {
  if (definitions.length === 0) return undefined;
  let merged: CellStyle = {};
  for (const definition of definitions) {
    merged = {
      fill: mergeFill(merged.fill, definition.fill),
      line: mergeLineStyle(merged.line, definition.line),
      padding: mergeInsets(merged.padding, definition.padding),
      verticalAlign: definition.verticalAlign ?? merged.verticalAlign,
    };
  }
  return merged;
}

/** Resolve box style input into a concrete style object. */
export function resolveBoxStyle(style?: BoxStyleInput): BoxStyle | undefined {
  return mergeBoxDefinitions(styleEntries(style));
}

/** Resolve text style input into a concrete style object. */
export function resolveTextStyle(
  style?: TextStyleInput,
): TextStyle | undefined {
  return mergeTextDefinitions(styleEntries(style));
}

/** Resolve paragraph style input into a concrete style object. */
export function resolveParagraphStyle(
  style?: ParagraphStyleInput,
): ParagraphStyle | undefined {
  return mergeParagraphDefinitions(styleEntries(style));
}

/** Resolve cell style input into a concrete style object. */
export function resolveCellStyle(
  style?: CellStyleInput,
): CellStyle | undefined {
  return mergeCellDefinitions(styleEntries(style));
}

/** Resolve unified text-container style input into a concrete style object. */
export function resolveTextContainerStyle(
  style?: TextContainerStyleInput,
): TextContainerStyle | undefined {
  const entries = styleEntries(style);
  if (entries.length === 0) return undefined;
  let merged: TextContainerStyle = {};
  for (const entry of entries) {
    merged = {
      fill: mergeFill(merged.fill, entry.fill),
      line: mergeLineStyle(merged.line, entry.line),
      verticalAlign: entry.verticalAlign ?? merged.verticalAlign,
      inset: mergeInsets(merged.inset, entry.inset),
      fit: entry.fit ?? merged.fit,
      shadow: mergeShadow(merged.shadow, entry.shadow),
      level: entry.level ?? merged.level,
      align: entry.align ?? merged.align,
      bullet: entry.bullet ?? merged.bullet,
      spacing: mergeSpacing(merged.spacing, entry.spacing),
      bold: entry.bold ?? merged.bold,
      italic: entry.italic ?? merged.italic,
      underline: entry.underline ?? merged.underline,
      fontSize: entry.fontSize ?? merged.fontSize,
      fontColor: entry.fontColor ?? merged.fontColor,
      fontFamily: entry.fontFamily ?? merged.fontFamily,
    };
  }
  return merged;
}

/** Split result for a unified text-container style. */
export interface SplitTextContainerStyle {
  readonly box: BoxStyle | undefined;
  readonly paragraph: ParagraphStyle | undefined;
  readonly text: TextStyle | undefined;
}

/** Decompose a unified text-container style into box, paragraph, and text parts. */
export function splitTextContainerStyle(
  style: TextContainerStyle | undefined,
): SplitTextContainerStyle {
  if (!style) return { box: undefined, paragraph: undefined, text: undefined };

  const hasBox = style.fill !== undefined || style.line !== undefined ||
    style.verticalAlign !== undefined || style.inset !== undefined ||
    style.fit !== undefined || style.shadow !== undefined;
  const hasParagraph = style.level !== undefined ||
    style.align !== undefined || style.bullet !== undefined ||
    style.spacing !== undefined;
  const hasText = style.bold !== undefined || style.italic !== undefined ||
    style.underline !== undefined || style.fontSize !== undefined ||
    style.fontColor !== undefined || style.fontFamily !== undefined;

  return {
    box: hasBox
      ? {
        fill: style.fill,
        line: style.line,
        verticalAlign: style.verticalAlign,
        inset: style.inset,
        fit: style.fit,
        shadow: style.shadow,
      }
      : undefined,
    paragraph: hasParagraph
      ? {
        level: style.level,
        align: style.align,
        bullet: style.bullet,
        spacing: style.spacing,
      }
      : undefined,
    text: hasText
      ? {
        bold: style.bold,
        italic: style.italic,
        underline: style.underline,
        fontSize: style.fontSize,
        fontColor: style.fontColor,
        fontFamily: style.fontFamily,
      }
      : undefined,
  };
}

/** Create a solid color fill. */
export function solidFill(color: HexColor, alpha?: number): Fill {
  return { kind: "solid", color, alpha };
}

/** Create a gradient stop. */
export function gradientStop(
  pos: Percentage,
  color: HexColor,
  alpha?: number,
): GradientStop {
  return { pos, color, alpha };
}

/** Create a linear gradient fill. */
export function linearGradient(
  angle: number,
  ...stops: ReadonlyArray<GradientStop>
): Fill {
  return { kind: "linear-gradient", angle, stops };
}

/** Create a "no fill" specification. */
export function noFill(): Fill {
  return { kind: "none" };
}

/** Create line style properties. */
export function lineStyle(options: LineStyle): LineStyle {
  return options;
}

/** Create a simple outer shadow. */
export function shadow(options: Shadow): Shadow {
  return options;
}

/** Create a paragraph bullet character. */
export function bulletChar(char: string): Bullet {
  return { kind: "char", char };
}

/** Create an auto-numbered bullet specification. */
export function bulletAutoNum(type: string): Bullet {
  return { kind: "autonum", type };
}

/** Create a "no bullet" specification. */
export function bulletNone(): Bullet {
  return { kind: "none" };
}
