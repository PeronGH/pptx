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
 * import { Align, Presentation, Shape, Slide, Text, clr, generate, u } from "@pixel/pptx";
 *
 * const pptx = generate(
 *   <Presentation title="My Presentation">
 *     <Slide
 *       background={{
 *         kind: "fill",
 *         fill: { kind: "solid", color: clr.hex("F7F4EE") },
 *       }}
 *     >
 *       <Shape
 *         preset="roundRect"
 *         w={u.in(8.5)}
 *         h={u.in(1)}
 *         style={{ fill: { kind: "solid", color: clr.hex("17324D") } }}
 *       />
 *       <Align x="center" y="center" w={u.in(8)} h={u.in(1)}>
 *         <Text.P style={{ bold: true, fontSize: u.font(22), fontColor: clr.hex("FFFFFF") }}>
 *           Hello, World!
 *         </Text.P>
 *       </Align>
 *     </Slide>
 *   </Presentation>,
 * );
 *
 * Deno.writeFileSync("output.pptx", pptx);
 * ```
 */

export {
  Align,
  Chart,
  Column,
  Image,
  Positioned,
  Presentation,
  Row,
  Shape,
  Slide,
  Stack,
  Table,
  Text,
} from "./src/jsx_components.ts";
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
  TextContainerStyle,
  TextContainerStyleInput,
  TextFit,
  TextStyle,
  TextStyleInput,
  VerticalAlignment,
} from "./src/style.ts";

export type {
  BarChart,
  Chart as ChartNode,
  ChartAxis,
  ChartBarDirection,
  ChartLegend,
  ChartSeries,
  ChartSeriesData,
  ChartValueAxis,
  DonutChart,
  LineChart,
  PieChart,
} from "./src/chart.ts";

export type { Paragraph, TextRun } from "./src/text.ts";

export type {
  AlignProps,
  ChartBarProps,
  ChartDonutProps,
  ChartLineProps,
  ChartPieProps,
  ColumnProps,
  ImageProps,
  LayoutDefaults,
  LayoutProps,
  LinkProps,
  ParagraphProps,
  PositionedProps,
  PptxChild,
  PptxComponent,
  PptxElement,
  PresentationProps,
  RowProps,
  ShapeProps,
  SlideProps,
  SlotProps,
  SpanProps,
  StackProps,
  TableCellProps,
  TableProps,
  TableRowProps,
  TextProps,
  TextTagProps,
} from "./src/public_types.ts";

export type {
  Emu,
  HexColor,
  HundredthPoint,
  Percentage,
  Position,
  Size,
} from "./src/types.ts";
