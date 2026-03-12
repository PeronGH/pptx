/**
 * Public API exports for the DSL and scene layers.
 */

export {
  bold,
  boldItalic,
  italic,
  link,
  p,
  text,
  toParagraph,
  underline,
} from "./text.ts";
export type {
  Paragraph,
  ParagraphContent,
  TextContent,
  TextRun,
} from "./text.ts";

export {
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

export {
  align,
  col,
  item,
  resolveSlideChildren,
  row,
  stack,
} from "./layout.ts";
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

export {
  isSceneNode,
  scene,
  sceneImage,
  sceneShape,
  sceneTable,
  sceneTextbox,
} from "./scene.ts";
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

export {
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
