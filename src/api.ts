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
  lineStyle,
  mergeBoxStyles,
  mergeCellStyles,
  mergeParagraphStyles,
  mergeTextStyles,
  noFill,
  paragraphStyle,
  solidFill,
  textStyle,
} from "./style.ts";
export type {
  Alignment,
  BoxStyle,
  Bullet,
  CellStyle,
  CrossAlignment,
  Fill,
  Insets,
  LineStyle,
  MainAlignment,
  ParagraphStyle,
  Spacing,
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

export { col, item, resolveSlideChildren, row } from "./layout.ts";
export type {
  Col,
  ContainerProps,
  LayoutItem,
  LayoutItemProps,
  LayoutNode,
  Row,
  SlideChild,
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

export { presentation, slide } from "./document.ts";
export type { Presentation, PresentationOptions, Slide } from "./document.ts";

export { generate } from "./generate.ts";
