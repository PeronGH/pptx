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
 * import {
 *   backgroundFill,
 *   bold,
 *   generate,
 *   linearGradient,
 *   gradientStop,
 *   p,
 *   presentation,
 *   scene,
 *   slide,
 *   st,
 * } from "@pixel/pptx";
 *
 * const pptx = generate(presentation(
 *   { title: "My Presentation" },
 *   slide(
 *     {
 *       background: backgroundFill(
 *         linearGradient(
 *           90,
 *           gradientStop(st.pct(0), st.hex("FFFFFF")),
 *           gradientStop(st.pct(100), st.hex("EAF2FF")),
 *         ),
 *       ),
 *     },
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
  align,
  backgroundFill,
  backgroundImage,
  bold,
  boldItalic,
  boxStyle,
  bulletAutoNum,
  bulletChar,
  bulletNone,
  cellStyle,
  col,
  generate,
  gradientStop,
  image,
  italic,
  item,
  linearGradient,
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
  shadow,
  shape,
  slide,
  solidFill,
  stack,
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
  Align,
  AlignAxis,
  Alignment,
  Background,
  BackgroundImageProps,
  BoxStyle,
  Bullet,
  CellStyle,
  Col,
  ContainerProps,
  CropRect,
  CrossAlignment,
  Fill,
  Frame,
  GradientStop,
  Image,
  ImageFit,
  ImageProps,
  Insets,
  LayoutItem,
  LayoutItemProps,
  LayoutNode,
  LeafNode,
  LineDash,
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
  Shadow,
  Shape,
  Slide,
  SlideChild,
  SlideProps,
  Spacing,
  Stack,
  StackProps,
  Table,
  TableCell,
  TableProps,
  TableRow,
  TextBox,
  TextContent,
  TextFit,
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
