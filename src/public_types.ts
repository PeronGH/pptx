/**
 * Public JSX runtime node and component prop types.
 */

import type { Background } from "./document.ts";
import type { AlignAxis } from "./layout.ts";
import type { Emu, HexColor } from "./types.ts";
import type {
  BoxStyleInput,
  CellStyleInput,
  CropRect,
  CrossAlignment,
  Fill,
  ImageFit,
  Insets,
  LineStyle,
  MainAlignment,
  ParagraphStyleInput,
  Shadow,
  StyleInput,
  TextFit,
  TextStyle,
  TextStyleInput,
  VerticalAlignment,
} from "./style.ts";
import type { ChartBarDirection, ChartValueAxis } from "./chart.ts";

export const Fragment = Symbol.for("@pixel/pptx.fragment");
export const ChartBarTag = Symbol.for("@pixel/pptx.chart.bar");
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

export type TextBoxProps = LayoutProps & {
  readonly style?: BoxStyleInput;
  readonly gap?: Emu;
  readonly children?: PptxChild;
};

export type ShapeProps = LayoutProps & {
  readonly preset: string;
  readonly style?: BoxStyleInput;
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
  readonly style?: CellStyleInput;
  readonly gap?: Emu;
  readonly children?: PptxChild;
}

export interface ParagraphProps {
  readonly style?: ParagraphStyleInput;
  readonly children?: PptxChild;
}

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

type ChartBarSharedProps = {
  readonly title?: string;
  readonly seriesName?: string;
  readonly color?: HexColor;
  readonly labels?: boolean;
  readonly legend?: boolean;
  readonly direction?: ChartBarDirection;
  readonly valueAxis?: ChartValueAxis;
  readonly children?: never;
};

type ChartBarBaseProps = LayoutProps & ChartBarSharedProps & {
  readonly data: ReadonlyArray<object>;
  readonly category: string;
  readonly value: string;
};

export type ChartBarProps<
  Row extends object,
  CategoryKey extends KeysOfType<Row, string>,
  ValueKey extends KeysOfType<Row, number>,
> = LayoutProps & ChartBarSharedProps & {
  readonly data: ReadonlyArray<Row>;
  readonly category: CategoryKey;
  readonly value: ValueKey;
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
  readonly textbox: TextBoxProps;
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
export type TextBoxElement = PptxElement<"textbox", TextBoxProps>;
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
  ValueKey extends KeysOfType<Row, number>,
> = PptxElement<typeof ChartBarTag, ChartBarProps<Row, CategoryKey, ValueKey>>;
export type AnyChartBarElement = PptxElement<
  typeof ChartBarTag,
  ChartBarBaseProps
>;

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
  | TextBoxElement
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
  | AnyChartBarElement;

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
  BoxStyleInput,
  CellStyleInput,
  ChartBarDirection,
  ChartValueAxis,
  CropRect,
  CrossAlignment,
  Fill,
  ImageFit,
  Insets,
  LineStyle,
  MainAlignment,
  ParagraphStyleInput,
  Shadow,
  StyleInput,
  TextFit,
  TextStyle,
  TextStyleInput,
  VerticalAlignment,
};
