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
 * import { generate, presentation, slide, scene, p, bold, st } from "@pixel/pptx";
 *
 * const pptx = generate(presentation(
 *   { title: "My Presentation" },
 *   slide(
 *     scene.textbox({ x: st.in(1), y: st.in(1), w: st.in(8), h: st.in(1) },
 *       p(bold("Hello"), ", World!"),
 *     ),
 *     scene.shape("rect", { x: st.in(2), y: st.in(3), w: st.in(4), h: st.in(2) }),
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

// Typed value constructors
export { st } from "./src/st.ts";

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

// Branded value types
export type {
  Emu,
  HexColor,
  HundredthPoint,
  Percentage,
  Position,
  Size,
} from "./src/types.ts";
