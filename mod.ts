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
 *   bg,
 *   clr,
 *   fill,
 *   generate,
 *   p,
 *   presentation,
 *   scene,
 *   slide,
 *   sty,
 *   tx,
 *   u,
 * } from "@pixel/pptx";
 *
 * const styles = sty.create({
 *   heroBar: sty.box({ fill: fill.solid(clr.hex("17324D")) }),
 *   title: sty.text({
 *     fontSize: u.font(22),
 *     fontColor: clr.hex("FFFFFF"),
 *     bold: true,
 *   }),
 * });
 *
 * const pptx = generate(presentation(
 *   { title: "My Presentation" },
 *   slide(
 *     {
 *       background: bg.fill(
 *         fill.grad(
 *           90,
 *           fill.stop(u.pct(0), clr.hex("FFFFFF")),
 *           fill.stop(u.pct(100), clr.hex("EAF2FF")),
 *         ),
 *       ),
 *     },
 *     scene.shape("rect", {
 *       x: u.in(0.75),
 *       y: u.in(0.75),
 *       w: u.in(8.5),
 *       h: u.in(1),
 *       style: styles.heroBar,
 *     }),
 *     scene.textbox({ x: u.in(1), y: u.in(1), w: u.in(8), h: u.in(1) },
 *       p(tx.bold("Hello", { style: styles.title }), ", World!"),
 *     ),
 *   ),
 * ));
 *
 * Deno.writeFileSync("output.pptx", pptx);
 * ```
 */

export {
  align,
  bg,
  clr,
  col,
  fill,
  generate,
  image,
  item,
  p,
  presentation,
  row,
  scene,
  shape,
  slide,
  stack,
  sty,
  table,
  td,
  textbox,
  tr,
  tx,
  u,
} from "./src/api.ts";

// Types
export type {
  Align,
  AlignAxis,
  Alignment,
  Background,
  BackgroundImageProps,
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
  ParagraphOptions,
  ParagraphStyle,
  ParagraphStyleFragment,
  ParagraphStyleInput,
  ParagraphStyleSource,
  ParagraphStyleValue,
  Presentation,
  PresentationOptions,
  Row,
  SceneImage,
  SceneImageProps,
  SceneNode,
  SceneShape,
  SceneShapeProps,
  SceneTable,
  SceneTableProps,
  SceneTextBox,
  SceneTextBoxProps,
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
  TableCellOptions,
  TableProps,
  TableRow,
  TextBox,
  TextBoxOptions,
  TextContent,
  TextFit,
  TextRun,
  TextRunOptions,
  TextStyle,
  TextStyleFragment,
  TextStyleInput,
  TextStyleSource,
  TextStyleValue,
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
