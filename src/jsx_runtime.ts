/**
 * Automatic JSX runtime implementation for @pixel/pptx.
 */

import type {
  FragmentElement,
  FragmentProps,
  PptxComponent,
  PptxElement,
  PptxElementType,
  PptxIntrinsicElements,
  PptxNode,
} from "./public_types.ts";

export { Fragment } from "./public_types.ts";
export type {
  ChartBarProps,
  ColumnProps,
  ImageProps,
  LayoutDefaults,
  LayoutProps,
  LinkProps,
  ParagraphProps,
  PositionableProps,
  PptxComponent,
  PptxElement,
  PptxIntrinsicElements,
  PresentationProps,
  Push,
  RowProps,
  ShapeProps,
  SlideProps,
  SpanProps,
  StackProps,
  TableProps,
  TdProps,
  TextboxProps,
  TextTagProps,
  TrProps,
} from "./public_types.ts";

type IntrinsicTag = keyof PptxIntrinsicElements;
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

export function jsx<Tag extends IntrinsicTag>(
  type: Tag,
  props: PptxIntrinsicElements[Tag],
  key?: string | number,
): PptxElement<Tag, PptxIntrinsicElements[Tag]>;
export function jsx(
  type: typeof import("./public_types.ts").Fragment,
  props: FragmentProps,
  key?: string | number,
): FragmentElement;
export function jsx<Props extends object, Element extends PptxNode>(
  type: Component<Props, Element>,
  props: Props,
  key?: string | number,
): Element;
export function jsx<Props extends object, Element extends PptxNode>(
  type:
    | IntrinsicTag
    | typeof import("./public_types.ts").Fragment
    | Component<Props, Element>,
  props: PptxIntrinsicElements[IntrinsicTag] | FragmentProps | Props,
  key?: string | number,
): PptxNode {
  if (typeof type === "function") {
    return type(props as Props);
  }
  return createElement(
    type,
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
  export interface IntrinsicElements extends PptxIntrinsicElements {}
}
