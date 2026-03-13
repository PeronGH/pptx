/**
 * Public JSX runtime node and intrinsic prop types.
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

export type PptxElementType = string | typeof Fragment;

export interface PptxElement<
  Type extends PptxElementType = PptxElementType,
  Props extends object = object,
> {
  readonly type: Type;
  readonly props: Props & { readonly children?: PptxChild };
  readonly key?: string | number | null;
}

export type PptxChild =
  | PptxElement
  | string
  | number
  | boolean
  | null
  | undefined
  | ReadonlyArray<PptxChild>;

/** Shared row/col child sizing props. */
export interface LayoutProps {
  readonly basis?: Emu;
  readonly grow?: number;
  readonly alignSelf?: CrossAlignment;
  readonly aspectRatio?: number;
  readonly w?: Emu;
  readonly h?: Emu;
}

/** Absolute placement props for non-align nodes. */
export interface AbsoluteFrameProps {
  readonly x?: Emu;
  readonly y?: Emu;
  readonly w?: Emu;
  readonly h?: Emu;
}

export interface PositionableProps extends LayoutProps, AbsoluteFrameProps {}

export interface PresentationProps {
  readonly title?: string;
  readonly creator?: string;
  readonly slideWidth?: Emu;
  readonly slideHeight?: Emu;
  readonly children?: PptxChild;
}

export interface SlideProps {
  readonly background?: Background;
  readonly children?: PptxChild;
}

export interface RowProps extends PositionableProps {
  readonly gap?: Emu;
  readonly padding?: Emu | Insets;
  readonly justify?: MainAlignment;
  readonly align?: CrossAlignment;
  readonly children?: PptxChild;
}

export interface ColumnProps extends PositionableProps {
  readonly gap?: Emu;
  readonly padding?: Emu | Insets;
  readonly justify?: MainAlignment;
  readonly align?: CrossAlignment;
  readonly children?: PptxChild;
}

export interface StackProps extends PositionableProps {
  readonly padding?: Emu | Insets;
  readonly children?: PptxChild;
}

export interface AlignProps extends LayoutProps {
  readonly x: AlignAxis;
  readonly y: AlignAxis;
  readonly padding?: Emu | Insets;
  readonly children?: PptxChild;
}

export interface TextboxProps extends PositionableProps {
  readonly style?: BoxStyleInput;
  readonly children?: PptxChild;
}

export interface ShapeProps extends PositionableProps {
  readonly preset: string;
  readonly style?: BoxStyleInput;
  readonly children?: PptxChild;
}

export interface ImageProps extends PositionableProps {
  readonly data: Uint8Array;
  readonly contentType: string;
  readonly description?: string;
  readonly fit?: ImageFit;
  readonly crop?: CropRect;
  readonly alpha?: number;
  readonly children?: never;
}

export interface TableProps extends PositionableProps {
  readonly cols: ReadonlyArray<Emu>;
  readonly children?: PptxChild;
}

export interface TrProps {
  readonly height: Emu;
  readonly children?: PptxChild;
}

export interface TdProps {
  readonly style?: CellStyleInput;
  readonly children?: PptxChild;
}

export interface ChartProps extends PositionableProps {
  readonly kind: "bar";
  readonly data: ReadonlyArray<Record<string, string | number>>;
  readonly category: string;
  readonly value: string;
  readonly title?: string;
  readonly seriesName?: string;
  readonly color?: HexColor;
  readonly labels?: boolean;
  readonly legend?: boolean;
  readonly direction?: ChartBarDirection;
  readonly valueAxis?: ChartValueAxis;
  readonly children?: never;
}

export interface ParagraphProps {
  readonly style?: ParagraphStyleInput;
  readonly children?: PptxChild;
}

export interface SpacerProps {
  readonly size: Emu;
  readonly children?: never;
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

export interface PptxIntrinsicElements {
  readonly presentation: PresentationProps;
  readonly slide: SlideProps;
  readonly row: RowProps;
  readonly column: ColumnProps;
  readonly stack: StackProps;
  readonly align: AlignProps;
  readonly textbox: TextboxProps;
  readonly shape: ShapeProps;
  readonly image: ImageProps;
  readonly table: TableProps;
  readonly tr: TrProps;
  readonly td: TdProps;
  readonly chart: ChartProps;
  readonly p: ParagraphProps;
  readonly spacer: SpacerProps;
  readonly span: SpanProps;
  readonly a: LinkProps;
  readonly b: TextTagProps;
  readonly i: TextTagProps;
  readonly u: TextTagProps;
}

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
