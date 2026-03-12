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
 * import { generate, presentation, slide, textbox, shape, paragraph, bold, text, bounds, inches } from "@pixel/pptx";
 *
 * const pptx = generate(presentation(
 *   { title: "My Presentation" },
 *   slide(
 *     textbox(bounds(inches(1), inches(1), inches(8), inches(1)), [
 *       paragraph([bold("Hello"), text(", World!")]),
 *     ]),
 *     shape("rect", bounds(inches(2), inches(3), inches(4), inches(2))),
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
  bounds,
  generate,
  italic,
  paragraph,
  presentation,
  shape,
  slide,
  text,
  textbox,
} from "./src/api.ts";

// Types
export type {
  Alignment,
  Bounds,
  Paragraph,
  ParagraphOptions,
  Presentation,
  PresentationOptions,
  Shape,
  Slide,
  SlideElement,
  TextBox,
  TextRun,
  TextRunStyle,
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
