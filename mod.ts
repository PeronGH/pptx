/**
 * @module pptx
 *
 * A correct, well-typed Deno library for generating PPTX files.
 *
 * Describe a presentation declaratively using composable functions,
 * then generate a valid Office Open XML package. Output opens in
 * LibreOffice Impress and round-trips through python-pptx.
 *
 * @example
 * ```ts
 * import { generate, presentation, slide, scene, p, bold, inches } from "@pixel/pptx";
 *
 * const pptx = generate(presentation(
 *   { title: "My Presentation" },
 *   slide(
 *     scene.textbox({ x: inches(1), y: inches(1), w: inches(8), h: inches(1) },
 *       p(bold("Hello"), ", World!"),
 *     ),
 *     scene.shape("rect", { x: inches(2), y: inches(3), w: inches(4), h: inches(2) }),
 *   ),
 * ));
 *
 * Deno.writeFileSync("output.pptx", pptx);
 * ```
 */

// Builder functions
export {
  bold,
  boldItalic,
  boxStyle,
  bulletAutoNum,
  bulletChar,
  bulletNone,
  cellStyle,
  col,
  generate,
  image,
  italic,
  item,
  lineStyle,
  link,
  mergeBoxStyles,
  mergeCellStyles,
  mergeParagraphStyles,
  mergeTextStyles,
  noFill,
  p,
  paragraphStyle,
  presentation,
  resolveSlideChildren,
  row,
  scene,
  sceneImage,
  sceneShape,
  sceneTable,
  sceneTextbox,
  shape,
  slide,
  solidFill,
  table,
  td,
  text,
  textbox,
  textStyle,
  tr,
  underline,
} from "./src/api.ts";

// Types
export type {
  Alignment,
  BoxStyle,
  Bullet,
  CellStyle,
  Col,
  ContainerProps,
  CrossAlignment,
  Fill,
  Frame,
  Image,
  ImageProps,
  Insets,
  LayoutItem,
  LayoutItemProps,
  LayoutNode,
  LeafNode,
  LineStyle,
  MainAlignment,
  Paragraph,
  ParagraphContent,
  ParagraphStyle,
  Presentation,
  PresentationOptions,
  Row,
  SceneImage,
  SceneImageProps,
  SceneNode,
  SceneShape,
  SceneTable,
  SceneTableProps,
  SceneTextBox,
  Shape,
  Slide,
  SlideChild,
  Spacing,
  Table,
  TableCell,
  TableProps,
  TableRow,
  TextBox,
  TextContent,
  TextRun,
  TextStyle,
  VerticalAlignment,
} from "./src/api.ts";

// Unit helpers
export {
  cm,
  emu,
  fontSize,
  hexColor,
  inches,
  percentage,
  pt,
} from "./src/types.ts";

// Unit types
export type {
  Emu,
  HexColor,
  HundredthPoint,
  Percentage,
  Position,
  Size,
} from "./src/types.ts";
