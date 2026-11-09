/**
 * Serializers for ECMA-376 simple types whose constraints the TypeScript types
 * cannot enforce at runtime. Every numeric or enumerated attribute the writer
 * emits goes through one of these, so invalid values never reach the XML.
 */

import type { Emu, HundredthPoint, Percentage } from "../types.ts";

function outOfRange(message: string): never {
  // Branded numbers carry a unit but not a range, and the valid range depends
  // on the attribute a value ends up in. Enumerations and element counts are
  // typed, but plain-JavaScript callers bypass the types. This is the last
  // point where an invalid value can be caught before it produces a
  // non-conforming part.
  throw new RangeError(message);
}

function integerIn(
  value: number,
  min: number,
  max: number,
  what: string,
): string {
  if (!Number.isInteger(value) || value < min || value > max) {
    outOfRange(`${what} must be an integer in [${min}, ${max}], got ${value}`);
  }
  return String(value);
}

/** `ST_Coordinate` (§20.1.10.16): shape offsets. */
export function coordinate(value: Emu, what = "coordinate"): string {
  return integerIn(value, -27273042329600, 27273042316900, what);
}

/** `ST_PositiveCoordinate` (§20.1.10.42): extents, shadow blur/distance. */
export function positiveCoordinate(value: Emu, what = "size"): string {
  return integerIn(value, 0, 27273042316900, what);
}

/** `ST_LineWidth` (§20.1.10.35): 0 to 1584pt. */
export function lineWidth(value: Emu): string {
  return integerIn(value, 0, 20116800, "line width (EMU)");
}

/** `ST_TextMargin` (§20.1.10.72): text body and cell insets. */
export function textMargin(value: Emu): string {
  return integerIn(value, 0, 51206400, "text inset (EMU)");
}

/** `ST_TextIndent` (§20.1.10.70): paragraph indent. */
export function textIndent(value: Emu): string {
  return integerIn(value, -51206400, 51206400, "text indent (EMU)");
}

/** `ST_SlideSizeCoordinate` (§19.7.17): 1in to 56in. */
export function slideSizeCoordinate(value: Emu, what: string): string {
  return integerIn(value, 914400, 51206400, what);
}

/** `ST_TextFontSize` (§20.1.10.68): 1pt to 4000pt in hundredths. */
export function textFontSize(value: HundredthPoint): string {
  return integerIn(value, 100, 400000, "font size (1/100 pt)");
}

/** `ST_TextSpacingPoint` (§20.1.10.78): EMU converted to 1/100 pt, max 1584pt. */
export function textSpacingPoint(value: Emu): string {
  return integerIn(Math.round(value / 127), 0, 158400, "paragraph spacing");
}

/** `ST_PositiveFixedPercentage` (§20.1.10.45): 0% to 100%. */
export function positiveFixedPercentage(
  value: Percentage,
  what: string,
): string {
  return integerIn(value, 0, 100000, `${what} (1/1000 %)`);
}

/**
 * `ST_PositiveFixedAngle` (§20.1.10.44): degrees normalized into [0, 360)
 * and converted to 60000ths of a degree.
 */
export function positiveFixedAngle(degrees: number): string {
  if (!Number.isFinite(degrees)) outOfRange(`angle must be finite`);
  const angle = Math.round((((degrees % 360) + 360) % 360) * 60000);
  return String(angle === 21600000 ? 0 : angle);
}

/** `ST_Percentage` (§20.1.10.40): signed, e.g. crop insets. */
export function percentage(value: Percentage, what: string): string {
  return integerIn(value, -2147483648, 2147483647, `${what} (1/1000 %)`);
}

/** `ST_TextIndentLevelType` (§20.1.10.71): paragraph level 0 to 8. */
export function textIndentLevel(value: number): string {
  return integerIn(value, 0, 8, "paragraph level");
}

/** A value from a schema enumeration (see `enums.ts`). */
export function enumeration<T extends string>(
  value: T,
  allowed: ReadonlyArray<T>,
  what: string,
): T {
  if (!allowed.includes(value)) outOfRange(`Unknown ${what} "${value}"`);
  return value;
}

/** A schema `minOccurs` lower bound on repeated child elements. */
export function minOccurs<T>(
  items: ReadonlyArray<T>,
  min: number,
  what: string,
): ReadonlyArray<T> {
  if (items.length < min) {
    outOfRange(`${what} needs at least ${min} entries, got ${items.length}`);
  }
  return items;
}

/** `ST_TextPoint` (§20.1.10.74): EMU converted to 1/100 pt, within ±4000pt. */
export function textPoint(value: Emu): string {
  return integerIn(
    Math.round(value / 127),
    -400000,
    400000,
    "character spacing",
  );
}

/**
 * `ST_TextSpacingPercent` (§20.1.10.77): a line-height multiple (1.5 = 150%)
 * in 1/1000 %, up to 13200%.
 */
export function textSpacingPercent(multiple: number): string {
  return integerIn(Math.round(multiple * 100000), 0, 13200000, "line spacing");
}
