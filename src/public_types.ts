/**
 * Public JSX runtime node and component prop types.
 */

import type { Background } from "./document.ts";
import type { AlignAxis } from "./layout.ts";
import type { Emu, HexColor } from "./types.ts";
import type {
  CropRect,
  CrossAlignment,
  Fill,
  ImageFit,
  Insets,
  LineStyle,
  MainAlignment,
  Shadow,
  Style,
  StyleInput,
  TextFit,
  TextStyle,
  TextStyleInput,
  VerticalAlignment,
} from "./style.ts";
import type {
  ChartAxis,
  ChartBarDirection,
  ChartLegend,
  ChartSeries,
  ChartValueAxis,
} from "./chart.ts";

export const Fragment = Symbol.for("@pixel/pptx.fragment");
export const ChartBarTag = Symbol.for("@pixel/pptx.chart.bar");
export const ChartLineTag = Symbol.for("@pixel/pptx.chart.line");
export const ChartPieTag = Symbol.for("@pixel/pptx.chart.pie");
export const ChartDonutTag = Symbol.for("@pixel/pptx.chart.donut");
export const PositionedTag = Symbol.for("@pixel/pptx.positioned");
export const RowStartTag = Symbol.for("@pixel/pptx.row.start");
export const RowEndTag = Symbol.for("@pixel/pptx.row.end");
export const ColumnStartTag = Symbol.for("@pixel/pptx.column.start");
export const ColumnEndTag = Symbol.for("@pixel/pptx.column.end");

type KeysOfType<T, Value> = Extract<
  {
    [K in keyof T]-?: T[K] extends Value ? K : never;
  }[keyof T],
  string
>;

interface ChildArray<Child> extends ReadonlyArray<Child> {}

export type PptxElementType = string | symbol;

export interface PptxElement<
  Type extends PptxElementType = PptxElementType,
  Props extends object = object,
> {
  readonly type: Type;
  readonly props: Props;
  readonly key?: string | number | null;
}

/** Inherited layout defaults for JSX authoring. */
export interface LayoutDefaults {
  readonly slidePadding?: Emu | Insets;
  readonly rowGap?: Emu;
  readonly columnGap?: Emu;
  readonly stackPadding?: Emu | Insets;
  readonly textGap?: Emu;
}

/** Shared row/column child sizing props. */
export interface LayoutProps {
  readonly basis?: Emu;
  readonly grow?: number;
  readonly alignSelf?: CrossAlignment;
  readonly aspectRatio?: number;
  readonly w?: Emu;
  readonly h?: Emu;
}

export interface SlotProps {
  readonly children?: PptxChild;
}

export interface PositionedProps {
  readonly x: Emu;
  readonly y: Emu;
  readonly w: Emu;
  readonly h: Emu;
  readonly children: PptxChild;
}

export interface PresentationProps {
  readonly title?: string;
  readonly creator?: string;
  readonly slideWidth?: Emu;
  readonly slideHeight?: Emu;
  readonly layout?: LayoutDefaults;
  readonly children?: PptxChild;
}

export interface SlideProps {
  readonly background?: Background;
  readonly layout?: LayoutDefaults;
  readonly children?: PptxChild;
}

export type RowProps = LayoutProps & {
  readonly gap?: Emu;
  readonly padding?: Emu | Insets;
  readonly justify?: MainAlignment;
  readonly align?: CrossAlignment;
  readonly children?: PptxChild;
};

export type ColumnProps = LayoutProps & {
  readonly gap?: Emu;
  readonly padding?: Emu | Insets;
  readonly justify?: MainAlignment;
  readonly align?: CrossAlignment;
  readonly children?: PptxChild;
};

export type StackProps = LayoutProps & {
  readonly padding?: Emu | Insets;
  readonly children?: PptxChild;
};

export type AlignProps = LayoutProps & {
  readonly x: AlignAxis;
  readonly y: AlignAxis;
  readonly padding?: Emu | Insets;
  readonly children: PptxChild;
};

export type TextProps = LayoutProps & {
  readonly style?: StyleInput<Style>;
  readonly gap?: Emu;
  readonly children?: PptxChild;
};

export type ShapeProps = LayoutProps & {
  readonly preset: string;
  readonly style?: StyleInput<Style>;
  readonly gap?: Emu;
  readonly children?: PptxChild;
};

export type ImageProps = LayoutProps & {
  readonly data: Uint8Array;
  readonly contentType: string;
  readonly description?: string;
  readonly fit?: ImageFit;
  readonly crop?: CropRect;
  readonly alpha?: number;
  readonly children?: never;
};

export type TableProps = LayoutProps & {
  readonly cols: ReadonlyArray<Emu>;
  readonly children?: PptxChild;
};

export interface TableRowProps {
  readonly height: Emu;
  readonly children?: PptxChild;
}

export interface TableCellProps {
  readonly style?: StyleInput<Style>;
  readonly gap?: Emu;
  readonly children?: PptxChild;
}

export type ParagraphProps = LayoutProps & {
  readonly style?: StyleInput<Style>;
  readonly children?: PptxChild;
};

export interface SpanProps {
  readonly style?: TextStyleInput;
  readonly children?: PptxChild;
}

export interface LinkProps {
  readonly href: string;
  readonly style?: TextStyleInput;
  readonly children?: PptxChild;
}

export interface TextTagProps {
  readonly style?: TextStyleInput;
  readonly children?: PptxChild;
}

type ChartSharedProps = {
  readonly title?: string;
  readonly labels?: boolean;
  readonly legend?: ChartLegend;
  readonly children?: never;
};

type CategoryChartBaseProps = LayoutProps & ChartSharedProps & {
  readonly data: ReadonlyArray<object>;
  readonly category: string;
};

type ChartSeriesBase = {
  readonly name: string;
  readonly value: string;
  readonly color?: HexColor;
};

type MultiSeriesChartBaseProps = CategoryChartBaseProps & {
  readonly series: ReadonlyArray<ChartSeriesBase>;
};

type ChartBarBaseProps = MultiSeriesChartBaseProps & {
  readonly direction?: ChartBarDirection;
  readonly categoryAxis?: ChartAxis;
  readonly valueAxis?: ChartValueAxis;
};

export type ChartBarProps<
  Row extends object,
  CategoryKey extends KeysOfType<Row, string>,
> = LayoutProps & ChartSharedProps & {
  readonly data: ReadonlyArray<Row>;
  readonly category: CategoryKey;
  readonly series: readonly [
    ChartSeries<Row>,
    ...ReadonlyArray<ChartSeries<Row>>,
  ];
  readonly direction?: ChartBarDirection;
  readonly categoryAxis?: ChartAxis;
  readonly valueAxis?: ChartValueAxis;
};

type ChartLineBaseProps = MultiSeriesChartBaseProps & {
  readonly markers?: boolean;
  readonly categoryAxis?: ChartAxis;
  readonly valueAxis?: ChartValueAxis;
};

export type ChartLineProps<
  Row extends object,
  CategoryKey extends KeysOfType<Row, string>,
> = LayoutProps & ChartSharedProps & {
  readonly data: ReadonlyArray<Row>;
  readonly category: CategoryKey;
  readonly series: readonly [
    ChartSeries<Row>,
    ...ReadonlyArray<ChartSeries<Row>>,
  ];
  readonly markers?: boolean;
  readonly categoryAxis?: ChartAxis;
  readonly valueAxis?: ChartValueAxis;
};

type PieLikeChartBaseProps = CategoryChartBaseProps & {
  readonly series: readonly [ChartSeriesBase];
};

export type ChartPieProps<
  Row extends object,
  CategoryKey extends KeysOfType<Row, string>,
> = LayoutProps & ChartSharedProps & {
  readonly data: ReadonlyArray<Row>;
  readonly category: CategoryKey;
  readonly series: readonly [ChartSeries<Row>];
};

type ChartDonutBaseProps = PieLikeChartBaseProps & {
  readonly holeSize?: number;
};

export type ChartDonutProps<
  Row extends object,
  CategoryKey extends KeysOfType<Row, string>,
> = LayoutProps & ChartSharedProps & {
  readonly data: ReadonlyArray<Row>;
  readonly category: CategoryKey;
  readonly series: readonly [ChartSeries<Row>];
  readonly holeSize?: number;
};

export interface FragmentProps<Child = PptxChild> {
  readonly children?: Child;
}

interface InternalElementProps {
  readonly presentation: PresentationProps;
  readonly slide: SlideProps;
  readonly row: RowProps;
  readonly column: ColumnProps;
  readonly stack: StackProps;
  readonly align: AlignProps;
  readonly textbox: TextProps;
  readonly shape: ShapeProps;
  readonly image: ImageProps;
  readonly table: TableProps;
  readonly tr: TableRowProps;
  readonly td: TableCellProps;
  readonly p: ParagraphProps;
  readonly span: SpanProps;
  readonly a: LinkProps;
  readonly b: TextTagProps;
  readonly i: TextTagProps;
  readonly u: TextTagProps;
  readonly [ChartBarTag]: ChartBarBaseProps;
  readonly [ChartLineTag]: ChartLineBaseProps;
  readonly [ChartPieTag]: PieLikeChartBaseProps;
  readonly [ChartDonutTag]: ChartDonutBaseProps;
  readonly [PositionedTag]: PositionedProps;
  readonly [RowStartTag]: SlotProps;
  readonly [RowEndTag]: SlotProps;
  readonly [ColumnStartTag]: SlotProps;
  readonly [ColumnEndTag]: SlotProps;
}

export type InternalTag = keyof InternalElementProps;

export interface FragmentElement<Child = PptxChild>
  extends PptxElement<typeof Fragment, FragmentProps<Child>> {}

export type PresentationElement = PptxElement<
  "presentation",
  PresentationProps
>;
export type SlideElement = PptxElement<"slide", SlideProps>;
export type RowElement = PptxElement<"row", RowProps>;
export type ColumnElement = PptxElement<"column", ColumnProps>;
export type StackElement = PptxElement<"stack", StackProps>;
export type AlignElement = PptxElement<"align", AlignProps>;
export type PositionedElement = PptxElement<
  typeof PositionedTag,
  PositionedProps
>;
export type RowStartElement = PptxElement<typeof RowStartTag, SlotProps>;
export type RowEndElement = PptxElement<typeof RowEndTag, SlotProps>;
export type ColumnStartElement = PptxElement<typeof ColumnStartTag, SlotProps>;
export type ColumnEndElement = PptxElement<typeof ColumnEndTag, SlotProps>;
export type TextElement = PptxElement<"textbox", TextProps>;
export type ShapeElement = PptxElement<"shape", ShapeProps>;
export type ImageElement = PptxElement<"image", ImageProps>;
export type TableElement = PptxElement<"table", TableProps>;
export type TableRowElement = PptxElement<"tr", TableRowProps>;
export type TableCellElement = PptxElement<"td", TableCellProps>;
export type ParagraphElement = PptxElement<"p", ParagraphProps>;
export type SpanElement = PptxElement<"span", SpanProps>;
export type LinkElement = PptxElement<"a", LinkProps>;
export type BoldElement = PptxElement<"b", TextTagProps>;
export type ItalicElement = PptxElement<"i", TextTagProps>;
export type UnderlineElement = PptxElement<"u", TextTagProps>;
export type ChartBarElement<
  Row extends object,
  CategoryKey extends KeysOfType<Row, string>,
> = PptxElement<typeof ChartBarTag, ChartBarProps<Row, CategoryKey>>;
export type AnyChartBarElement = PptxElement<
  typeof ChartBarTag,
  ChartBarBaseProps
>;
export type ChartLineElement<
  Row extends object,
  CategoryKey extends KeysOfType<Row, string>,
> = PptxElement<typeof ChartLineTag, ChartLineProps<Row, CategoryKey>>;
export type AnyChartLineElement = PptxElement<
  typeof ChartLineTag,
  ChartLineBaseProps
>;
export type ChartPieElement<
  Row extends object,
  CategoryKey extends KeysOfType<Row, string>,
> = PptxElement<typeof ChartPieTag, ChartPieProps<Row, CategoryKey>>;
export type AnyChartPieElement = PptxElement<
  typeof ChartPieTag,
  PieLikeChartBaseProps
>;
export type ChartDonutElement<
  Row extends object,
  CategoryKey extends KeysOfType<Row, string>,
> = PptxElement<typeof ChartDonutTag, ChartDonutProps<Row, CategoryKey>>;
export type AnyChartDonutElement = PptxElement<
  typeof ChartDonutTag,
  ChartDonutBaseProps
>;
export type AnyChartElement =
  | AnyChartBarElement
  | AnyChartLineElement
  | AnyChartPieElement
  | AnyChartDonutElement;

export type PptxNonFragmentElement =
  | PresentationElement
  | SlideElement
  | RowElement
  | ColumnElement
  | StackElement
  | AlignElement
  | PositionedElement
  | RowStartElement
  | RowEndElement
  | ColumnStartElement
  | ColumnEndElement
  | TextElement
  | ShapeElement
  | ImageElement
  | TableElement
  | TableRowElement
  | TableCellElement
  | ParagraphElement
  | SpanElement
  | LinkElement
  | BoldElement
  | ItalicElement
  | UnderlineElement
  | AnyChartElement;

export type PptxNode = PptxNonFragmentElement | FragmentElement<PptxChild>;

export type PptxChild =
  | PptxNode
  | string
  | number
  | boolean
  | null
  | undefined
  | ChildArray<PptxChild>;

export type PptxComponent<
  Props extends object = object,
  Element extends PptxNode = PptxNode,
> = (props: Props) => Element;

export type {
  AlignAxis,
  Background,
  ChartAxis,
  ChartBarDirection,
  ChartLegend,
  ChartSeries,
  ChartValueAxis,
  CropRect,
  CrossAlignment,
  Fill,
  ImageFit,
  Insets,
  LineStyle,
  MainAlignment,
  Shadow,
  Style,
  StyleInput,
  TextFit,
  TextStyle,
  TextStyleInput,
  VerticalAlignment,
};
