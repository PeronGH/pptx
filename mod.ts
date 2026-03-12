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
 *   tx,
 *   u,
 * } from "@pixel/pptx";
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
 *     scene.textbox({ x: u.in(1), y: u.in(1), w: u.in(8), h: u.in(1) },
 *       p(tx.bold("Hello"), ", World!"),
 *     ),
 *     scene.shape("rect", { x: u.in(2), y: u.in(3), w: u.in(4), h: u.in(2) }),
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
