/**
 * Public API exports for the DSL and scene layers.
 */

import { chart } from "./chart.ts";
export type {
  BarChart,
  BarChartOptions,
  Chart,
  ChartBarDirection,
  ChartPoint,
  ChartValueAxis,
} from "./chart.ts";
export { ChartBar } from "./chart_component.ts";
export type { ChartBarProps } from "./public_types.ts";

import { bold, boldItalic, italic, link, p, text, underline } from "./text.ts";
export type {
  Paragraph,
  ParagraphContent,
  ParagraphOptions,
  TextContent,
  TextRun,
  TextRunOptions,
} from "./text.ts";

import {
  boxStyle,
  bulletAutoNum,
  bulletChar,
  bulletNone,
  cellStyle,
  create,
  gradientStop,
  linearGradient,
  lineStyle,
  noFill,
  paragraphStyle,
  shadow,
  solidFill,
  textStyle,
} from "./style.ts";
export type {
  Alignment,
  BoxStyle,
  BoxStyleFragment,
  BoxStyleInput,
  BoxStyleSource,
  BoxStyleValue,
  Bullet,
  CellStyle,
  CellStyleFragment,
  CellStyleInput,
  CellStyleSource,
  CellStyleValue,
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
  ParagraphStyleFragment,
  ParagraphStyleInput,
  ParagraphStyleSource,
  ParagraphStyleValue,
  Shadow,
  Spacing,
  TextFit,
  TextStyle,
  TextStyleFragment,
  TextStyleInput,
  TextStyleSource,
  TextStyleValue,
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
  TableCellOptions,
  TableProps,
  TableRow,
  TextBox,
  TextBoxOptions,
} from "./nodes.ts";

export { chart };

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
  SceneShapeProps,
  SceneTable,
  SceneTableProps,
  SceneTextBox,
  SceneTextBoxProps,
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
  create,
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
} as const;
