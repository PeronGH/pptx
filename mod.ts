/**
 * @module pptx
 *
 * A JSX-first Deno library for generating PPTX files.
 *
 * Author slides with JSX components, then generate an Office Open XML
 * (ECMA-376) presentation package. A JSX-free imperative builder is available
 * from `@pixel/pptx/imperative`.
 *
 * @example
 * ```tsx
 * /** @jsxImportSource @pixel/pptx *\/
 * import { Align, Presentation, Shape, Slide, Text, clr, generate, u } from "@pixel/pptx";
 *
 * const pptx = generate(
 *   <Presentation title="My Presentation">
 *     <Slide background={{ kind: "solid", color: clr.hex("F7F4EE") }}>
 *       <Align x="center" y="center" w={u.in(8)} h={u.in(1.2)}>
 *         <Shape
 *           preset="roundRect"
 *           style={{
 *             fill: { kind: "solid", color: clr.hex("17324D") },
 *             verticalAlign: "middle",
 *             fontSize: u.font(22),
 *             fontColor: clr.hex("FFFFFF"),
 *             bold: true,
 *           }}
 *         >
 *           <Text.P style={{ align: "center" }}>Hello, World!</Text.P>
 *         </Shape>
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
  Bullet,
  CropRect,
  CrossAlignment,
  Fill,
  GradientStop,
  ImageFit,
  Insets,
  LineDash,
  LineStyle,
  MainAlignment,
  Shadow,
  Spacing,
  Style,
  StyleInput,
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
  AutoNumberScheme,
  PresetGeometry,
  TextLevel,
} from "./src/ooxml/enums.ts";

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
