/**
 * Typed OOXML simple-type constructor helpers.
 */

import type { Emu, HexColor, HundredthPoint, Percentage } from "./types.ts";

const EMU_PER_INCH = 914400;
const EMU_PER_CM = 360000;
const EMU_PER_PT = 12700;

function invalidSimpleType(message: string): never {
  // Arbitrary runtime strings can bypass any literal-level typing, so simple
  // OOXML scalar constructors still validate their external string boundary.
  throw new Error(message);
}

/** Convert inches to EMUs. */
export function inch(value: number): Emu {
  return Math.round(value * EMU_PER_INCH) as Emu;
}

/** Convert centimeters to EMUs. */
export function cm(value: number): Emu {
  return Math.round(value * EMU_PER_CM) as Emu;
}

/** Convert points to EMUs. */
export function pt(value: number): Emu {
  return Math.round(value * EMU_PER_PT) as Emu;
}

/** Create an EMU value directly. */
export function emu(value: number): Emu {
  return value as Emu;
}

/** Create a validated OOXML hex color. */
export function hex(value: string): HexColor {
  if (!/^[0-9A-Fa-f]{6}$/.test(value)) {
    invalidSimpleType(
      `Invalid hex color "${value}": expected 6 hex digits (e.g. "FF0000")`,
    );
  }
  return value.toUpperCase() as HexColor;
}

/** Convert points to hundredths of a point for DrawingML font sizes. */
export function font(points: number): HundredthPoint {
  return (points * 100) as HundredthPoint;
}

/** Create a percentage value in 1/1000th of a percent. */
export function pct(value: number): Percentage {
  return (value * 1000) as Percentage;
}

/** Unit and numeric constructor helpers. */
export const u = {
  in: inch,
  cm,
  pt,
  emu,
  font,
  pct,
} as const;

/** Color constructor helpers. */
export const clr = {
  hex,
} as const;
