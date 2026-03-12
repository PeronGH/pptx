/**
 * Positionless content nodes for the public DSL.
 */

import type { Emu } from "./types.ts";
import type { Chart } from "./chart.ts";
import type {
  BoxStyle,
  BoxStyleInput,
  CellStyle,
  CellStyleInput,
  CropRect,
  ImageFit,
} from "./style.ts";
import { resolveBoxStyle, resolveCellStyle } from "./style.ts";
import type { Paragraph, ParagraphContent } from "./text.ts";
import { toParagraph } from "./text.ts";

/** Options for a positionless text box. */
export interface TextBoxOptions {
  readonly style?: BoxStyleInput;
}

function isTextBoxOptions(
  value: TextBoxOptions | ParagraphContent,
): value is TextBoxOptions {
  return typeof value !== "string" && !("runs" in value);
}

/** A positionless text box leaf. */
export interface TextBox {
  readonly kind: "textbox";
  readonly style?: BoxStyle;
  readonly paragraphs: ReadonlyArray<Paragraph>;
}

/** A positionless preset shape leaf. */
export interface Shape {
  readonly kind: "shape";
  readonly preset: string;
  readonly style?: BoxStyle;
  readonly paragraphs: ReadonlyArray<Paragraph>;
}

/** Props for an image leaf. */
export interface ImageProps {
  readonly data: Uint8Array;
  readonly contentType: string;
  readonly description?: string;
  readonly fit?: ImageFit;
  readonly crop?: CropRect;
  readonly alpha?: number;
}

/** A positionless image leaf. */
export interface Image extends ImageProps {
  readonly kind: "image";
}

/** Options for a table cell. */
export interface TableCellOptions {
  readonly style?: CellStyleInput;
}

function isTableCellOptions(
  value: TableCellOptions | ParagraphContent,
): value is TableCellOptions {
  return typeof value !== "string" && !("runs" in value);
}

/** A table cell. */
export interface TableCell {
  readonly style?: CellStyle;
  readonly paragraphs: ReadonlyArray<Paragraph>;
}

/** A table row. */
export interface TableRow {
  readonly height: Emu;
  readonly cells: ReadonlyArray<TableCell>;
}

/** Props for a table leaf. */
export interface TableProps {
  readonly cols: ReadonlyArray<Emu>;
}

/** A positionless table leaf. */
export interface Table {
  readonly kind: "table";
  readonly cols: ReadonlyArray<Emu>;
  readonly rows: ReadonlyArray<TableRow>;
}

/** Union of all positionless content leaves. */
export type LeafNode = TextBox | Shape | Image | Table | Chart;

/** Create a positionless text box. */
export function textbox(
  first?: TextBoxOptions | ParagraphContent,
  ...rest: ReadonlyArray<ParagraphContent>
): TextBox {
  if (first === undefined) return { kind: "textbox", paragraphs: [] };
  if (isTextBoxOptions(first)) {
    return {
      kind: "textbox",
      style: resolveBoxStyle(first.style),
      paragraphs: rest.map(toParagraph),
    };
  }
  return {
    kind: "textbox",
    paragraphs: [toParagraph(first), ...rest.map(toParagraph)],
  };
}

/** Create a positionless preset shape. */
export function shape(
  preset: string,
  first?: TextBoxOptions | ParagraphContent,
  ...rest: ReadonlyArray<ParagraphContent>
): Shape {
  if (first === undefined) return { kind: "shape", preset, paragraphs: [] };
  if (isTextBoxOptions(first)) {
    return {
      kind: "shape",
      preset,
      style: resolveBoxStyle(first.style),
      paragraphs: rest.map(toParagraph),
    };
  }
  return {
    kind: "shape",
    preset,
    paragraphs: [toParagraph(first), ...rest.map(toParagraph)],
  };
}

/** Create a positionless image. */
export function image(props: ImageProps): Image {
  return { kind: "image", ...props };
}

/** Create a table cell. */
export function td(
  first?: TableCellOptions | ParagraphContent,
  ...rest: ReadonlyArray<ParagraphContent>
): TableCell {
  if (first === undefined) return { paragraphs: [{ runs: [] }] };
  if (isTableCellOptions(first)) {
    return {
      style: resolveCellStyle(first.style),
      paragraphs: rest.length === 0 ? [{ runs: [] }] : rest.map(toParagraph),
    };
  }
  return {
    paragraphs: [toParagraph(first), ...rest.map(toParagraph)],
  };
}

/** Create a table row. */
export function tr(
  height: Emu,
  ...cells: ReadonlyArray<TableCell>
): TableRow {
  return { height, cells };
}

/** Create a positionless table. */
export function table(
  props: TableProps,
  ...rows: ReadonlyArray<TableRow>
): Table {
  return { kind: "table", cols: props.cols, rows };
}
