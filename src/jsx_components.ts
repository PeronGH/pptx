/**
 * Public JSX component surface.
 */

import {
  type AlignElement,
  type AlignProps,
  type AnyChartBarElement,
  type AnyChartDonutElement,
  type AnyChartLineElement,
  type AnyChartPieElement,
  type BoldElement,
  type ChartBarProps,
  ChartBarTag,
  type ChartDonutProps,
  ChartDonutTag,
  type ChartLineProps,
  ChartLineTag,
  type ChartPieProps,
  ChartPieTag,
  type ColumnElement,
  type ColumnEndElement,
  ColumnEndTag,
  type ColumnProps,
  type ColumnStartElement,
  ColumnStartTag,
  type ImageElement,
  type ImageProps,
  type ItalicElement,
  type LinkElement,
  type LinkProps,
  type ParagraphElement,
  type ParagraphProps,
  type PositionedElement,
  type PositionedProps,
  PositionedTag,
  type PptxElement,
  type PptxElementType,
  type PresentationElement,
  type PresentationProps,
  type RowElement,
  type RowEndElement,
  RowEndTag,
  type RowProps,
  type RowStartElement,
  RowStartTag,
  type ShapeElement,
  type ShapeProps,
  type SlideElement,
  type SlideProps,
  type SlotProps,
  type SpanElement,
  type SpanProps,
  type StackElement,
  type StackProps,
  type TableCellElement,
  type TableCellProps,
  type TableElement,
  type TableProps,
  type TableRowElement,
  type TableRowProps,
  type TextBoxElement,
  type TextBoxProps,
  type TextTagProps,
  type UnderlineElement,
} from "./public_types.ts";

type KeysOfType<T, Value> = Extract<
  {
    [K in keyof T]-?: T[K] extends Value ? K : never;
  }[keyof T],
  string
>;

function node<Type extends PptxElementType, Props extends object>(
  type: Type,
  props: Props,
): PptxElement<Type, Props> {
  return {
    type,
    props,
    key: null,
  };
}

type RowComponent = ((props: RowProps) => RowElement) & {
  readonly Start: (props: SlotProps) => RowStartElement;
  readonly End: (props: SlotProps) => RowEndElement;
};

type ColumnComponent = ((props: ColumnProps) => ColumnElement) & {
  readonly Start: (props: SlotProps) => ColumnStartElement;
  readonly End: (props: SlotProps) => ColumnEndElement;
};

type TableComponent = ((props: TableProps) => TableElement) & {
  readonly Row: (props: TableRowProps) => TableRowElement;
  readonly Cell: (props: TableCellProps) => TableCellElement;
};

type TextComponentFamily = {
  readonly P: (props: ParagraphProps) => ParagraphElement;
  readonly Span: (props: SpanProps) => SpanElement;
  readonly Link: (props: LinkProps) => LinkElement;
  readonly Bold: (props: TextTagProps) => BoldElement;
  readonly Italic: (props: TextTagProps) => ItalicElement;
  readonly Underline: (props: TextTagProps) => UnderlineElement;
};

type ChartComponentFamily = {
  readonly Bar: <
    Row extends object,
    CategoryKey extends KeysOfType<Row, string>,
  >(
    props: ChartBarProps<Row, CategoryKey>,
  ) => AnyChartBarElement;
  readonly Line: <
    Row extends object,
    CategoryKey extends KeysOfType<Row, string>,
  >(
    props: ChartLineProps<Row, CategoryKey>,
  ) => AnyChartLineElement;
  readonly Pie: <
    Row extends object,
    CategoryKey extends KeysOfType<Row, string>,
  >(
    props: ChartPieProps<Row, CategoryKey>,
  ) => AnyChartPieElement;
  readonly Donut: <
    Row extends object,
    CategoryKey extends KeysOfType<Row, string>,
  >(
    props: ChartDonutProps<Row, CategoryKey>,
  ) => AnyChartDonutElement;
};

export function Presentation(props: PresentationProps): PresentationElement {
  return node("presentation", props);
}

export function Slide(props: SlideProps): SlideElement {
  return node("slide", props);
}

function RowStart(props: SlotProps): RowStartElement {
  return node(RowStartTag, props);
}

function RowEnd(props: SlotProps): RowEndElement {
  return node(RowEndTag, props);
}

function RowBase(props: RowProps): RowElement {
  return node("row", props);
}

export const Row: RowComponent = Object.assign(RowBase, {
  Start: RowStart,
  End: RowEnd,
});

function ColumnStart(props: SlotProps): ColumnStartElement {
  return node(ColumnStartTag, props);
}

function ColumnEnd(props: SlotProps): ColumnEndElement {
  return node(ColumnEndTag, props);
}

function ColumnBase(props: ColumnProps): ColumnElement {
  return node("column", props);
}

export const Column: ColumnComponent = Object.assign(ColumnBase, {
  Start: ColumnStart,
  End: ColumnEnd,
});

export function Stack(props: StackProps): StackElement {
  return node("stack", props);
}

export function Align(props: AlignProps): AlignElement {
  return node("align", props);
}

export function Positioned(props: PositionedProps): PositionedElement {
  return node(PositionedTag, props);
}

export function TextBox(props: TextBoxProps): TextBoxElement {
  return node("textbox", props);
}

export function Shape(props: ShapeProps): ShapeElement {
  return node("shape", props);
}

export function Image(props: ImageProps): ImageElement {
  return node("image", props);
}

function TableRow(props: TableRowProps): TableRowElement {
  return node("tr", props);
}

function TableCell(props: TableCellProps): TableCellElement {
  return node("td", props);
}

function TableBase(props: TableProps): TableElement {
  return node("table", props);
}

export const Table: TableComponent = Object.assign(TableBase, {
  Row: TableRow,
  Cell: TableCell,
});

function TextP(props: ParagraphProps): ParagraphElement {
  return node("p", props);
}

function TextSpan(props: SpanProps): SpanElement {
  return node("span", props);
}

function TextLink(props: LinkProps): LinkElement {
  return node("a", props);
}

function TextBold(props: TextTagProps): BoldElement {
  return node("b", props);
}

function TextItalic(props: TextTagProps): ItalicElement {
  return node("i", props);
}

function TextUnderline(props: TextTagProps): UnderlineElement {
  return node("u", props);
}

export const Text: TextComponentFamily = {
  P: TextP,
  Span: TextSpan,
  Link: TextLink,
  Bold: TextBold,
  Italic: TextItalic,
  Underline: TextUnderline,
} as const;

function ChartBar<
  Row extends object,
  CategoryKey extends KeysOfType<Row, string>,
>(
  props: ChartBarProps<Row, CategoryKey>,
): AnyChartBarElement {
  return node(ChartBarTag, props);
}

function ChartLine<
  Row extends object,
  CategoryKey extends KeysOfType<Row, string>,
>(
  props: ChartLineProps<Row, CategoryKey>,
): AnyChartLineElement {
  return node(ChartLineTag, props);
}

function ChartPie<
  Row extends object,
  CategoryKey extends KeysOfType<Row, string>,
>(
  props: ChartPieProps<Row, CategoryKey>,
): AnyChartPieElement {
  return node(ChartPieTag, props);
}

function ChartDonut<
  Row extends object,
  CategoryKey extends KeysOfType<Row, string>,
>(
  props: ChartDonutProps<Row, CategoryKey>,
): AnyChartDonutElement {
  return node(ChartDonutTag, props);
}

export const Chart: ChartComponentFamily = {
  Bar: ChartBar,
  Line: ChartLine,
  Pie: ChartPie,
  Donut: ChartDonut,
} as const;
