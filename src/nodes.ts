/**
 * Positionless content nodes for the public DSL.
 */

import type { Emu } from "./types.ts";
import type { BoxStyle, CellStyle, CropRect, ImageFit } from "./style.ts";
import type { Paragraph, ParagraphContent } from "./text.ts";
import { toParagraph } from "./text.ts";

function isBoxStyle(
  value: BoxStyle | ParagraphContent,
): value is BoxStyle {
  return typeof value !== "string" && !("runs" in value);
}

function isCellStyle(
  value: CellStyle | ParagraphContent,
): value is CellStyle {
  return typeof value !== "string" && !("runs" in value);
}

/** A positionless text box leaf. */
export interface TextBox extends BoxStyle {
  readonly kind: "textbox";
  readonly paragraphs: ReadonlyArray<Paragraph>;
}

/** A positionless preset shape leaf. */
export interface Shape extends BoxStyle {
  readonly kind: "shape";
  readonly preset: string;
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

/** A table cell. */
export interface TableCell extends CellStyle {
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
export interface Table extends TableProps {
  readonly kind: "table";
  readonly rows: ReadonlyArray<TableRow>;
}

/** Union of all positionless content leaves. */
export type LeafNode = TextBox | Shape | Image | Table;

/** Create a positionless text box. */
export function textbox(
  first?: BoxStyle | ParagraphContent,
  ...rest: ReadonlyArray<ParagraphContent>
): TextBox {
  if (first === undefined) return { kind: "textbox", paragraphs: [] };
  if (isBoxStyle(first)) {
    return {
      kind: "textbox",
      paragraphs: rest.map(toParagraph),
      ...first,
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
  first?: BoxStyle | ParagraphContent,
  ...rest: ReadonlyArray<ParagraphContent>
): Shape {
  if (first === undefined) return { kind: "shape", preset, paragraphs: [] };
  if (isBoxStyle(first)) {
    return {
      kind: "shape",
      preset,
      paragraphs: rest.map(toParagraph),
      ...first,
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
  first?: CellStyle | ParagraphContent,
  ...rest: ReadonlyArray<ParagraphContent>
): TableCell {
  if (first === undefined) return { paragraphs: [{ runs: [] }] };
  if (isCellStyle(first)) {
    return {
      paragraphs: rest.length === 0 ? [{ runs: [] }] : rest.map(toParagraph),
      ...first,
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
