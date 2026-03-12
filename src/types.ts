/**
 * Core branded value types for OOXML presentation generation.
 *
 * Constructor helpers live in the `u.*` and `clr.*` namespaces.
 */

/** Branded type for English Metric Units (EMUs). ECMA-376 §20.1.10.16. */
export type Emu = number & { readonly __brand: "Emu" };

/** Branded type for hex color strings (6 hex digits, no #). ECMA-376 §22.9.2.5. */
export type HexColor = string & { readonly __brand: "HexColor" };

/** Branded type for percentage values in 1/1000th of a percent. ECMA-376 §20.1.10.40. */
export type Percentage = number & { readonly __brand: "Percentage" };

/**
 * Hundredths of a point for DrawingML font sizes.
 * ECMA-376 §21.1.2.3.9 (`a:rPr`) and §20.1.10.68 (`ST_TextFontSize`).
 */
export type HundredthPoint = number & { readonly __brand: "HundredthPoint" };

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
