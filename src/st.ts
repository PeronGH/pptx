/**
 * Typed OOXML simple-type constructor helpers.
 */

import type { Emu, HexColor, HundredthPoint, Percentage } from "./types.ts";

const EMU_PER_INCH = 914400;
const EMU_PER_CM = 360000;
const EMU_PER_PT = 12700;

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
    throw new Error(
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

/**
 * Canonical typed helper namespace.
 *
 * `in` is namespace-only because it cannot be imported as a bare binding.
 */
export const st = {
  in: inch,
  cm,
  pt,
  emu,
  hex,
  font,
  pct,
} as const;
