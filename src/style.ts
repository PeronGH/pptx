/**
 * Public style types and helpers for the DSL.
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

/** Composable text styling fragment. */
export interface TextStyle {
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly fontSize?: HundredthPoint;
  readonly fontColor?: HexColor;
  readonly fontFamily?: string;
  readonly hyperlink?: string;
}

/** Composable paragraph styling fragment. */
export interface ParagraphStyle {
  readonly level?: number;
  readonly align?: Alignment;
  readonly bullet?: Bullet;
  readonly spacing?: Spacing;
}

/** Composable box styling fragment. */
export interface BoxStyle {
  readonly fill?: Fill;
  readonly line?: LineStyle;
  readonly verticalAlign?: VerticalAlignment;
  readonly inset?: Emu | Insets;
  readonly fit?: TextFit;
  readonly shadow?: Shadow;
}

/** Composable cell styling fragment. */
export interface CellStyle {
  readonly fill?: Fill;
  readonly line?: LineStyle;
  readonly padding?: Emu | Insets;
  readonly verticalAlign?: VerticalAlignment;
}

/** Padding or inset values in EMUs. */
export interface Insets {
  readonly top?: Emu;
  readonly right?: Emu;
  readonly bottom?: Emu;
  readonly left?: Emu;
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

/** Create a text style fragment. */
export function textStyle(options: TextStyle): TextStyle {
  return options;
}

/** Create a paragraph style fragment. */
export function paragraphStyle(options: ParagraphStyle): ParagraphStyle {
  return options;
}

/** Create a box style fragment. */
export function boxStyle(options: BoxStyle): BoxStyle {
  return options;
}

/** Create a cell style fragment. */
export function cellStyle(options: CellStyle): CellStyle {
  return options;
}

/** Create a bullet character specification. */
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

function mergeStyle<T extends object>(
  styles: ReadonlyArray<T | undefined>,
): T {
  const merged: Record<string, unknown> = {};
  for (const style of styles) {
    if (style) Object.assign(merged, style);
  }
  return merged as T;
}

/** Merge box style fragments using last-wins semantics. */
export function mergeBoxStyles(
  ...styles: ReadonlyArray<BoxStyle | undefined>
): BoxStyle {
  return mergeStyle<BoxStyle>(styles);
}

/** Merge text style fragments using last-wins semantics. */
export function mergeTextStyles(
  ...styles: ReadonlyArray<TextStyle | undefined>
): TextStyle {
  return mergeStyle<TextStyle>(styles);
}

/** Merge paragraph style fragments using last-wins semantics. */
export function mergeParagraphStyles(
  ...styles: ReadonlyArray<ParagraphStyle | undefined>
): ParagraphStyle {
  return mergeStyle<ParagraphStyle>(styles);
}

/** Merge cell style fragments using last-wins semantics. */
export function mergeCellStyles(
  ...styles: ReadonlyArray<CellStyle | undefined>
): CellStyle {
  return mergeStyle<CellStyle>(styles);
}
