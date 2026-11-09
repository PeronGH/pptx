/**
 * Positionless content leaves produced by normalization.
 */

import type { Emu, Percentage } from "./types.ts";
import type { PresetGeometry } from "./ooxml/enums.ts";
import type { Chart } from "./chart.ts";
import type { BoxStyle, CellStyle, CropRect, ImageFit } from "./style.ts";
import type { Paragraph } from "./text.ts";
import type { ShapeTransform } from "./ooxml/slide.ts";

/** A positionless text box leaf. */
export interface TextBox extends ShapeTransform {
  readonly kind: "textbox";
  readonly name?: string;
  /** Written as the slide's title placeholder (`<Title>`). */
  readonly placeholder?: "title";
  readonly style?: BoxStyle;
  readonly paragraphs: ReadonlyArray<Paragraph>;
}

/** A positionless preset shape leaf. */
export interface Shape extends ShapeTransform {
  readonly kind: "shape";
  readonly name?: string;
  readonly preset: PresetGeometry;
  readonly style?: BoxStyle;
  readonly paragraphs: ReadonlyArray<Paragraph>;
}

/** A positionless image leaf. */
export interface Image extends ShapeTransform {
  readonly kind: "image";
  readonly name?: string;
  readonly data: Uint8Array;
  readonly description?: string;
  readonly fit?: ImageFit;
  readonly crop?: CropRect;
  readonly alpha?: Percentage;
}

/** A table cell. */
export interface TableCell {
  readonly colSpan?: number;
  readonly rowSpan?: number;
  readonly style?: CellStyle;
  readonly paragraphs: ReadonlyArray<Paragraph>;
}

/** A table row. */
export interface TableRow {
  readonly height: Emu;
  readonly cells: ReadonlyArray<TableCell>;
}

/** A positionless table leaf. */
export interface Table {
  readonly kind: "table";
  readonly name?: string;
  readonly cols: readonly [Emu, ...Emu[]];
  readonly rows: ReadonlyArray<TableRow>;
}

/** Union of all positionless content leaves. */
export type LeafNode = TextBox | Shape | Image | Table | Chart;
