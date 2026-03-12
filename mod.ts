/**
 * @module pptx
 *
 * A correct, well-typed Deno library for generating PPTX files.
 *
 * Describe a presentation declaratively, then generate a valid
 * Office Open XML package. Output opens in LibreOffice Impress
 * and round-trips through python-pptx.
 *
 * @example
 * ```ts
 * import { generatePresentation, inches, fontSize, hexColor } from "@pixel/pptx";
 *
 * const pptx = generatePresentation({
 *   title: "My Presentation",
 *   slides: [
 *     {
 *       elements: [
 *         {
 *           kind: "textbox",
 *           x: inches(1),
 *           y: inches(1),
 *           cx: inches(8),
 *           cy: inches(1),
 *           paragraphs: [
 *             { text: "Hello, World!" },
 *           ],
 *         },
 *       ],
 *     },
 *   ],
 * });
 *
 * Deno.writeFileSync("output.pptx", pptx);
 * ```
 */

export { generatePresentation } from "./src/api.ts";
export type {
  PParagraph,
  PPresentation,
  PShape,
  PSlide,
  PSlideElement,
  PTextBox,
  PTextRun,
} from "./src/api.ts";
export {
  cm,
  emu,
  fontSize,
  hexColor,
  inches,
  percentage,
  pt,
} from "./src/types.ts";
export type {
  Emu,
  HexColor,
  HundredthPoint,
  Percentage,
  Position,
  Size,
} from "./src/types.ts";
