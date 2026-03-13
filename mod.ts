/**
 * @module pptx
 *
 * A JSX-first Deno library for generating PPTX files.
 *
 * Author slides with intrinsic JSX tags, then generate a valid
 * Office Open XML package. Output opens in LibreOffice Impress
 * and round-trips through python-pptx.
 *
 * @example
 * ```tsx
 * /** @jsxImportSource @pixel/pptx *\/
 * import { clr, generate, u } from "@pixel/pptx";
 *
 * const pptx = generate(
 *   <presentation title="My Presentation">
 *     <slide
 *       background={{
 *         kind: "fill",
 *         fill: { kind: "solid", color: clr.hex("F7F4EE") },
 *       }}
 *     >
 *       <shape
 *         preset="roundRect"
 *         x={u.in(0.75)}
 *         y={u.in(0.75)}
 *         w={u.in(8.5)}
 *         h={u.in(1)}
 *         style={{ fill: { kind: "solid", color: clr.hex("17324D") } }}
 *       />
 *       <textbox
 *         x={u.in(1)}
 *         y={u.in(1)}
 *         w={u.in(8)}
 *         h={u.in(1)}
 *       >
 *         <span
 *           style={{
 *             bold: true,
 *             fontSize: u.font(22),
 *             fontColor: clr.hex("FFFFFF"),
 *           }}
 *         >
 *           Hello
 *         </span>
 *         , World!
 *       </textbox>
 *     </slide>
 *   </presentation>,
 * );
 *
 * Deno.writeFileSync("output.pptx", pptx);
 * ```
 */

export { generate } from "./src/generate.ts";
export { clr, u } from "./src/st.ts";

export type { Background, BackgroundImageProps } from "./src/document.ts";

export type { AlignAxis } from "./src/layout.ts";

export type {
  Alignment,
  BoxStyle,
  BoxStyleInput,
  Bullet,
  CellStyle,
  CellStyleInput,
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
  ParagraphStyleInput,
  Shadow,
  Spacing,
  StyleInput,
  TextFit,
  TextStyle,
  TextStyleInput,
  VerticalAlignment,
} from "./src/style.ts";

export type {
  BarChart,
  Chart,
  ChartBarDirection,
  ChartPoint,
  ChartValueAxis,
} from "./src/chart.ts";

export type { Paragraph, TextRun } from "./src/text.ts";

export type {
  AlignProps,
  ChartProps,
  ColumnProps,
  ImageProps,
  LayoutProps,
  LinkProps,
  ParagraphProps,
  PositionableProps,
  PptxChild,
  PptxElement,
  PptxIntrinsicElements,
  PresentationProps,
  RowProps,
  ShapeProps,
  SlideProps,
  SpacerProps,
  SpanProps,
  StackProps,
  TableProps,
  TdProps,
  TextboxProps,
  TextTagProps,
  TrProps,
} from "./src/public_types.ts";

export type {
  Emu,
  HexColor,
  HundredthPoint,
  Percentage,
  Position,
  Size,
} from "./src/types.ts";
