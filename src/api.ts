/**
 * Public API exports for the DSL and scene layers.
 */

import { bold, boldItalic, italic, link, p, text, underline } from "./text.ts";
export type {
  Paragraph,
  ParagraphContent,
  TextContent,
  TextRun,
} from "./text.ts";

import {
  boxStyle,
  bulletAutoNum,
  bulletChar,
  bulletNone,
  cellStyle,
  gradientStop,
  linearGradient,
  lineStyle,
  mergeBoxStyles,
  mergeCellStyles,
  mergeParagraphStyles,
  mergeTextStyles,
  noFill,
  paragraphStyle,
  shadow,
  solidFill,
  textStyle,
} from "./style.ts";
export type {
  Alignment,
  BoxStyle,
  Bullet,
  CellStyle,
  CropRect,
  CrossAlignment,
  Fill,
  GradientStop,
  ImageFit,
  Insets,
  LineDash,
  LineStyle,
  MainAlignment,
  ParagraphStyle,
  Shadow,
  Spacing,
  TextFit,
  TextStyle,
  VerticalAlignment,
} from "./style.ts";

export { image, shape, table, td, textbox, tr } from "./nodes.ts";
export type {
  Image,
  ImageProps,
  LeafNode,
  Shape,
  Table,
  TableCell,
  TableProps,
  TableRow,
  TextBox,
} from "./nodes.ts";

export { align, col, item, row, stack } from "./layout.ts";
export type {
  Align,
  AlignAxis,
  Col,
  ContainerProps,
  LayoutItem,
  LayoutItemProps,
  LayoutNode,
  Row,
  SlideChild,
  Stack,
  StackProps,
} from "./layout.ts";

export { scene } from "./scene.ts";
export type {
  Frame,
  SceneImage,
  SceneImageProps,
  SceneNode,
  SceneShape,
  SceneTable,
  SceneTableProps,
  SceneTextBox,
} from "./scene.ts";

import {
  backgroundFill,
  backgroundImage,
  presentation,
  slide,
} from "./document.ts";
export type {
  Background,
  BackgroundImageProps,
  Presentation,
  PresentationOptions,
  Slide,
  SlideProps,
} from "./document.ts";

export { generate } from "./generate.ts";

export { p };
export { presentation, slide };

import { clr, u } from "./st.ts";
export { clr, u };

/** Background helpers. */
export const bg = {
  fill: backgroundFill,
  image: backgroundImage,
} as const;

/** Fill helpers. */
export const fill = {
  solid: solidFill,
  grad: linearGradient,
  stop: gradientStop,
  none: noFill,
} as const;

/** Text-run helpers. */
export const tx = {
  run: text,
  bold,
  italic,
  bi: boldItalic,
  underline,
  link,
} as const;

/** Style fragment helpers. */
export const sty = {
  box: boxStyle,
  text: textStyle,
  para: paragraphStyle,
  cell: cellStyle,
  line: lineStyle,
  shadow,
  bullet: {
    char: bulletChar,
    num: bulletAutoNum,
    none: bulletNone,
  },
  merge: {
    box: mergeBoxStyles,
    text: mergeTextStyles,
    para: mergeParagraphStyles,
    cell: mergeCellStyles,
  },
} as const;
