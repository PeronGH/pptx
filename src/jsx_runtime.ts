/**
 * Automatic JSX runtime implementation for @pixel/pptx.
 */

import type {
  PptxChild,
  PptxElement,
  PptxElementType,
  PptxIntrinsicElements,
} from "./public_types.ts";

export { Fragment } from "./public_types.ts";
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
} from "./public_types.ts";

type JsxProps = object & { readonly children?: PptxChild };

function createElement(
  type: PptxElementType,
  props: JsxProps | null | undefined,
  key?: string | number | null,
): PptxElement {
  return {
    type,
    props: props ?? {},
    key,
  };
}

export function jsx(
  type: PptxElementType,
  props: JsxProps,
  key?: string | number,
): PptxElement {
  return createElement(type, props, key ?? null);
}

export const jsxs = jsx;

export function jsxDEV(
  type: PptxElementType,
  props: JsxProps,
  key?: string | number,
): PptxElement {
  return createElement(type, props, key ?? null);
}

// deno-lint-ignore no-namespace -- TypeScript automatic JSX runtimes require an exported JSX namespace.
export namespace JSX {
  export type Element = PptxElement;
  export interface ElementChildrenAttribute {
    children: Record<PropertyKey, never>;
  }
  export interface IntrinsicAttributes {
    key?: string | number;
  }
  export interface IntrinsicElements extends PptxIntrinsicElements {}
}
