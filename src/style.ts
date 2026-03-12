/**
 * Public style types and helpers for the DSL.
 */

import type { Emu, HexColor, HundredthPoint } from "./types.ts";

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

/** Fill specification for shapes and cells. */
export type Fill =
  | {
    readonly kind: "solid";
    readonly color: HexColor;
    readonly alpha?: number;
  }
  | { readonly kind: "none" };

/** Line (outline) properties for shapes. */
export interface LineStyle {
  readonly width?: Emu;
  readonly fill?: Fill;
}

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
}

/** Composable cell styling fragment. */
export interface CellStyle {
  readonly fill?: Fill;
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

/** Create a "no fill" specification. */
export function noFill(): Fill {
  return { kind: "none" };
}

/** Create line style properties. */
export function lineStyle(options: LineStyle): LineStyle {
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
