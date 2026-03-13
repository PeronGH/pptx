/**
 * Typed absolute-position escape hatch.
 */

import type { Emu } from "./types.ts";
import type { Chart } from "./chart.ts";
import type { BoxStyle, BoxStyleInput } from "./style.ts";
import { resolveBoxStyle } from "./style.ts";
import type { ParagraphContent } from "./text.ts";
import { toParagraph } from "./text.ts";
import type {
  Image,
  ImageProps,
  Shape,
  Table,
  TableProps,
  TableRow,
  TextBox,
} from "./nodes.ts";
import { image as leafImage } from "./nodes.ts";

/** Absolute frame in slide coordinates. */
export interface Frame {
  readonly x: Emu;
  readonly y: Emu;
  readonly w: Emu;
  readonly h: Emu;
}

/** Props for a positioned text box scene node. */
export interface SceneTextBoxProps extends Frame {
  readonly style?: BoxStyleInput;
}

/** A positioned text box scene node. */
export interface SceneTextBox extends Frame {
  readonly kind: "textbox";
  readonly style?: BoxStyle;
  readonly paragraphs: ReadonlyArray<ReturnType<typeof toParagraph>>;
}

/** Props for a positioned shape scene node. */
export interface SceneShapeProps extends Frame {
  readonly style?: BoxStyleInput;
}

/** A positioned shape scene node. */
export interface SceneShape extends Frame {
  readonly kind: "shape";
  readonly preset: string;
  readonly style?: BoxStyle;
  readonly paragraphs: ReadonlyArray<ReturnType<typeof toParagraph>>;
}

/** Positioned image props. */
export interface SceneImageProps extends Frame, ImageProps {}

/** A positioned image scene node. */
export interface SceneImage extends Frame, Image {
  readonly kind: "image";
}

/** Positioned table props. */
export interface SceneTableProps extends Frame, TableProps {}

/** A positioned table scene node. */
export interface SceneTable extends Frame, Table {
  readonly kind: "table";
}

/** A positioned chart scene node. */
export type SceneChart = Frame & Chart;

/** Union of all scene nodes. */
export type SceneNode =
  | SceneTextBox
  | SceneShape
  | SceneImage
  | SceneTable
  | SceneChart;

/** Create a positioned text box scene node. */
export function sceneTextbox(
  props: SceneTextBoxProps,
  ...children: ReadonlyArray<ParagraphContent>
): SceneTextBox {
  return {
    kind: "textbox",
    x: props.x,
    y: props.y,
    w: props.w,
    h: props.h,
    style: resolveBoxStyle(props.style),
    paragraphs: children.map(toParagraph),
  };
}

/** Create a positioned shape scene node. */
export function sceneShape(
  preset: string,
  props: SceneShapeProps,
  ...children: ReadonlyArray<ParagraphContent>
): SceneShape {
  return {
    kind: "shape",
    preset,
    x: props.x,
    y: props.y,
    w: props.w,
    h: props.h,
    style: resolveBoxStyle(props.style),
    paragraphs: children.map(toParagraph),
  };
}

/** Create a positioned image scene node. */
export function sceneImage(props: SceneImageProps): SceneImage {
  return {
    x: props.x,
    y: props.y,
    w: props.w,
    h: props.h,
    ...leafImage(props),
  };
}

/** Create a positioned table scene node. */
export function sceneTable(
  props: SceneTableProps,
  ...rows: ReadonlyArray<TableRow>
): SceneTable {
  return {
    kind: "table",
    x: props.x,
    y: props.y,
    w: props.w,
    h: props.h,
    cols: props.cols,
    rows,
  };
}

/** Public scene namespace. */
export const scene = {
  textbox: sceneTextbox,
  shape: sceneShape,
  image: sceneImage,
  table: sceneTable,
} as const;

/** Narrow a value to a scene node. */
export function isSceneNode(value: unknown): value is SceneNode {
  if (typeof value !== "object" || value === null) return false;
  if (!("kind" in value) || !("x" in value) || !("y" in value)) return false;
  const kind = value.kind;
  return kind === "textbox" || kind === "shape" || kind === "image" ||
    kind === "table" || kind === "chart";
}

/** Convert a positioned frame and a leaf node into a scene node. */
export function placeLeaf(
  frame: Frame,
  leaf: TextBox | Shape | Image | Table | Chart,
): SceneNode {
  switch (leaf.kind) {
    case "textbox":
      return {
        kind: "textbox",
        x: frame.x,
        y: frame.y,
        w: frame.w,
        h: frame.h,
        style: leaf.style,
        paragraphs: leaf.paragraphs,
      };
    case "shape":
      return {
        kind: "shape",
        x: frame.x,
        y: frame.y,
        w: frame.w,
        h: frame.h,
        preset: leaf.preset,
        style: leaf.style,
        paragraphs: leaf.paragraphs,
      };
    case "image":
      return {
        kind: "image",
        x: frame.x,
        y: frame.y,
        w: frame.w,
        h: frame.h,
        data: leaf.data,
        contentType: leaf.contentType,
        description: leaf.description,
        fit: leaf.fit,
        crop: leaf.crop,
        alpha: leaf.alpha,
      };
    case "table":
      return {
        kind: "table",
        x: frame.x,
        y: frame.y,
        w: frame.w,
        h: frame.h,
        cols: leaf.cols,
        rows: leaf.rows,
      };
    case "chart":
      return {
        x: frame.x,
        y: frame.y,
        w: frame.w,
        h: frame.h,
        ...leaf,
      };
  }
}
