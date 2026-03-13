/**
 * Automatic JSX runtime implementation for @pixel/pptx.
 */

import type {
  FragmentProps,
  PptxComponent,
  PptxElement,
  PptxElementType,
  PptxNode,
} from "./public_types.ts";

export { Fragment } from "./public_types.ts";
export type {
  AlignProps,
  ChartBarProps,
  ColumnProps,
  ImageProps,
  LayoutDefaults,
  LayoutProps,
  LinkProps,
  ParagraphProps,
  PositionedProps,
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
  TextBoxProps,
  TextTagProps,
} from "./public_types.ts";

type Component<Props extends object, Element extends PptxNode> = PptxComponent<
  Props,
  Element
>;

function createElement<Type extends PptxElementType, Props extends object>(
  type: Type,
  props: Props | null | undefined,
  key?: string | number | null,
): PptxElement<Type, Props> {
  return {
    type,
    props: (props ?? {}) as Props,
    key,
  };
}

export function jsx(
  type:
    | PptxElementType
    | typeof import("./public_types.ts").Fragment
    | Component<object, PptxNode>,
  props: FragmentProps | Record<PropertyKey, unknown>,
  key?: string | number,
): PptxNode {
  if (typeof type === "function") {
    return type(props);
  }
  return createElement(
    type as PptxElementType,
    props as Record<PropertyKey, unknown>,
    key ?? null,
  ) as PptxNode;
}

export const jsxs = jsx;
export const jsxDEV = jsx;

// deno-lint-ignore no-namespace -- TypeScript automatic JSX runtimes require an exported JSX namespace.
export namespace JSX {
  export type Element = PptxNode;
  export interface ElementChildrenAttribute {
    children: Record<PropertyKey, never>;
  }
  export interface IntrinsicAttributes {
    key?: string | number;
  }
  export interface IntrinsicElements {
    readonly [tagName: string]: never;
  }
}
