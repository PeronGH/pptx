/**
 * Core types for OOXML presentation generation.
 *
 * Units follow ECMA-376 Part 1 §20.1.10.16 (ST_Coordinate) and §20.1.10.41 (ST_PositiveCoordinate).
 * EMU (English Metric Unit) is the base unit: 914400 EMUs per inch, 360000 per cm, 12700 per point.
 */

/** Branded type for English Metric Units (EMUs). ECMA-376 §20.1.10.16. */
export type Emu = number & { readonly __brand: "Emu" };

/** Branded type for hex color strings (6 hex digits, no #). ECMA-376 §20.1.2.3.19 (ST_HexColorRGB). */
export type HexColor = string & { readonly __brand: "HexColor" };

/** Branded type for percentage values in 1/1000th of a percent. ECMA-376 §20.1.10.40. */
export type Percentage = number & { readonly __brand: "Percentage" };

const EMU_PER_INCH = 914400;
const EMU_PER_CM = 360000;
const EMU_PER_PT = 12700;

/** Convert inches to EMUs. */
export function inches(value: number): Emu {
  return (Math.round(value * EMU_PER_INCH)) as Emu;
}

/** Convert centimeters to EMUs. */
export function cm(value: number): Emu {
  return (Math.round(value * EMU_PER_CM)) as Emu;
}

/** Convert points to EMUs. */
export function pt(value: number): Emu {
  return (Math.round(value * EMU_PER_PT)) as Emu;
}

/** Create an EMU value directly. */
export function emu(value: number): Emu {
  return value as Emu;
}

/** Create a validated hex color. Accepts "RRGGBB" format. */
export function hexColor(value: string): HexColor {
  if (!/^[0-9A-Fa-f]{6}$/.test(value)) {
    throw new Error(
      `Invalid hex color "${value}": expected 6 hex digits (e.g. "FF0000")`,
    );
  }
  return value.toUpperCase() as HexColor;
}

/** Create a percentage value in 1/1000th of a percent. 100% = 100000. */
export function percentage(value: number): Percentage {
  return (value * 1000) as Percentage;
}

/**
 * Half-points for font sizes. ECMA-376 §17.18.2 (ST_HpsMeasure).
 * PowerPoint uses hundredths of a point for font sizes in DrawingML.
 */
export type HundredthPoint = number & { readonly __brand: "HundredthPoint" };

/** Convert points to hundredths of a point (for DrawingML font sizes). */
export function fontSize(points: number): HundredthPoint {
  return (points * 100) as HundredthPoint;
}

/** Position defined by x and y coordinates in EMUs. */
export interface Position {
  readonly x: Emu;
  readonly y: Emu;
}

/** Size defined by width and height in EMUs. */
export interface Size {
  readonly cx: Emu;
  readonly cy: Emu;
}
