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
 * import { generate, presentation, slide, textbox, shape, p, bold, inches } from "@pixel/pptx";
 *
 * const pptx = generate(presentation(
 *   { title: "My Presentation" },
 *   slide(
 *     textbox({ x: inches(1), y: inches(1), w: inches(8), h: inches(1) },
 *       p(bold("Hello"), ", World!"),
 *     ),
 *     shape("rect", { x: inches(2), y: inches(3), w: inches(4), h: inches(2) }),
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
  bulletAutoNum,
  bulletChar,
  bulletNone,
  generate,
  image,
  italic,
  lineStyle,
  link,
  noFill,
  p,
  presentation,
  shape,
  slide,
  solidFill,
  table,
  td,
  text,
  textbox,
  tr,
  underline,
} from "./src/api.ts";

// Types
export type {
  Alignment,
  Bullet,
  CellProps,
  Fill,
  Image,
  ImageProps,
  LineStyle,
  Paragraph,
  ParagraphProps,
  Presentation,
  PresentationOptions,
  Shape,
  ShapeProps,
  Slide,
  SlideElement,
  Spacing,
  Table,
  TableCell,
  TableProps,
  TableRow,
  TextBox,
  TextBoxProps,
  TextRun,
  TextRunStyle,
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
