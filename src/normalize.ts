/**
 * Normalize JSX runtime nodes into the internal presentation model.
 */

import type { Presentation, Slide } from "./document.ts";
import type { BarChart, Chart } from "./chart.ts";
import type {
  Align,
  Col,
  LayoutItem,
  LayoutItemProps,
  LayoutNode,
  Positioned,
  ResolvableNode,
  Row,
  SlideChild,
  Spacer,
  Stack,
} from "./layout.ts";
import type {
  Image as LeafImage,
  Shape as LeafShape,
  Table as LeafTable,
  TableCell,
  TableRow,
  TextBox as LeafTextBox,
} from "./nodes.ts";
import type { Paragraph, TextRun } from "./text.ts";
import {
  type AnyChartBarElement,
  ChartBarTag,
  Fragment,
  type LayoutDefaults,
  type LayoutProps,
  type PositionableProps,
  type PptxChild,
  type PptxElement,
  type PptxIntrinsicElements,
} from "./public_types.ts";
import {
  mergeParagraphStyles,
  mergeTextStyles,
  resolveBoxStyle,
  resolveCellStyle,
  resolveParagraphStyle,
  resolveTextStyle,
  type TextStyle,
} from "./style.ts";
import type { Emu } from "./types.ts";

type IntrinsicTag = keyof PptxIntrinsicElements;
type TaggedElement<Tag extends IntrinsicTag> = PptxElement<
  Tag,
  PptxIntrinsicElements[Tag]
>;

function invalidTree(message: string): never {
  // Runtime validation remains for dynamic or plain-JS callers that can bypass
  // the JSX type graph. Typed TypeScript callers should fail before execution.
  throw new Error(message);
}

function isElement(value: unknown): value is PptxElement {
  return typeof value === "object" && value !== null &&
    "type" in value && "props" in value;
}

function isChartBarElement(
  element: PptxElement,
): element is AnyChartBarElement {
  return element.type === ChartBarTag;
}

function isTag<Tag extends IntrinsicTag>(
  element: PptxElement,
  tag: Tag,
): element is TaggedElement<Tag> {
  return element.type === tag;
}

function expectTag<Tag extends IntrinsicTag>(
  element: PptxElement,
  tag: Tag,
): TaggedElement<Tag> {
  if (!isTag(element, tag)) {
    invalidTree(`Expected <${tag}>, found <${String(element.type)}>`);
  }
  return element;
}

function flattenChildren(
  children: PptxChild | undefined,
): ReadonlyArray<unknown> {
  const items: unknown[] = [];
  const visit = (value: PptxChild | undefined): void => {
    if (Array.isArray(value)) {
      for (const entry of value) visit(entry);
      return;
    }
    if (isElement(value) && value.type === Fragment) {
      visit((value.props as { readonly children?: PptxChild }).children);
      return;
    }
    items.push(value);
  };
  visit(children);
  return items;
}

function nonIgnorableChildren(children: PptxChild): ReadonlyArray<unknown> {
  return flattenChildren(children).filter((child) =>
    child !== undefined && child !== null && typeof child !== "boolean"
  );
}

function expectElement(
  child: unknown,
  parentTag: string,
): PptxElement {
  if (!isElement(child)) {
    invalidTree(`<${parentTag}> only accepts JSX element children`);
  }
  return child;
}

function asEmu(value: number): Emu {
  // `Emu` is a branded number, so normalization only needs a single
  // cast at the arithmetic boundary where raw numeric math becomes EMU-typed.
  // PowerPoint expects integer EMUs, so normalize any intermediate math.
  return Math.round(value) as Emu;
}

function addEmu(left: Emu | undefined, right: Emu): Emu {
  return asEmu((left ?? 0) + right);
}

function mergeInsetValue(
  base: Emu | {
    readonly top?: Emu;
    readonly right?: Emu;
    readonly bottom?: Emu;
    readonly left?: Emu;
  } | undefined,
  next: Emu | {
    readonly top?: Emu;
    readonly right?: Emu;
    readonly bottom?: Emu;
    readonly left?: Emu;
  } | undefined,
): Emu | {
  readonly top?: Emu;
  readonly right?: Emu;
  readonly bottom?: Emu;
  readonly left?: Emu;
} | undefined {
  if (next === undefined) {
    if (typeof base === "number" || base === undefined) return base;
    return { ...base };
  }
  if (
    typeof next === "number" || typeof base === "number" || base === undefined
  ) {
    if (typeof next === "number") return next;
    return { ...next };
  }
  return {
    top: next.top ?? base.top,
    right: next.right ?? base.right,
    bottom: next.bottom ?? base.bottom,
    left: next.left ?? base.left,
  };
}

function mergeLayoutDefaults(
  base: LayoutDefaults | undefined,
  next: LayoutDefaults | undefined,
): LayoutDefaults {
  return {
    slidePadding: mergeInsetValue(base?.slidePadding, next?.slidePadding),
    rowGap: next?.rowGap ?? base?.rowGap,
    columnGap: next?.columnGap ?? base?.columnGap,
    stackPadding: mergeInsetValue(base?.stackPadding, next?.stackPadding),
    textGap: next?.textGap ?? base?.textGap,
  };
}

function withSpacingBefore(paragraph: Paragraph, before: Emu): Paragraph {
  const spacing = {
    before: addEmu(paragraph.style?.spacing?.before, before),
  };
  return {
    ...paragraph,
    style: mergeParagraphStyles(paragraph.style, { spacing }),
  };
}

function applyTextGap(
  paragraphs: ReadonlyArray<Paragraph>,
  gap: Emu | undefined,
): ReadonlyArray<Paragraph> {
  if (gap === undefined || paragraphs.length < 2) return paragraphs;
  return paragraphs.map((paragraph, index) => {
    if (index === 0) return paragraph;
    return withSpacingBefore(paragraph, gap);
  });
}

function spacerIsLayoutOnly(parentTag: string): never {
  invalidTree(
    `<spacer> is layout-only and cannot be used inside <${parentTag}>; use the container's gap prop instead`,
  );
}

function textGap(
  localGap: Emu | undefined,
  defaults: LayoutDefaults,
): Emu | undefined {
  return localGap ?? defaults.textGap;
}

function withResolvedSlideProps(
  background: Slide["props"]["background"],
  defaults: LayoutDefaults,
): Slide["props"] {
  return {
    background,
    contentPadding: defaults.slidePadding,
  };
}

function withResolvedContainerGap(
  localGap: Emu | undefined,
  defaults: LayoutDefaults,
  axis: "row" | "column",
): Emu | undefined {
  if (localGap !== undefined) return localGap;
  return axis === "row" ? defaults.rowGap : defaults.columnGap;
}

function withResolvedStackPadding(
  localPadding: Stack["padding"],
  defaults: LayoutDefaults,
): Stack["padding"] {
  return localPadding ?? defaults.stackPadding;
}

function withResolvedTextParagraphs(
  paragraphs: ReadonlyArray<Paragraph>,
  gap: Emu | undefined,
): ReadonlyArray<Paragraph> {
  if (paragraphs.length === 0) {
    return [];
  }
  return applyTextGap(paragraphs, gap);
}

function isInlineTag(tag: unknown): tag is "span" | "a" | "b" | "i" | "u" {
  return tag === "span" || tag === "a" || tag === "b" || tag === "i" ||
    tag === "u";
}

function normalizeInlineChildren(
  children: PptxChild,
  inheritedStyle?: TextStyle,
  inheritedHyperlink?: string,
): ReadonlyArray<TextRun> {
  const runs: TextRun[] = [];

  for (const child of nonIgnorableChildren(children)) {
    if (typeof child === "string" || typeof child === "number") {
      runs.push({
        text: String(child),
        style: inheritedStyle ? { ...inheritedStyle } : undefined,
        hyperlink: inheritedHyperlink,
      });
      continue;
    }

    const element = expectElement(child, "inline");
    if (!isInlineTag(element.type)) {
      invalidTree(
        `Inline content only accepts text and <span>/<a>/<b>/<i>/<u>, found <${
          String(element.type)
        }>`,
      );
    }

    switch (element.type) {
      case "span": {
        const span = expectTag(element, "span");
        runs.push(
          ...normalizeInlineChildren(
            span.props.children,
            mergeTextStyles(
              inheritedStyle,
              resolveTextStyle(span.props.style),
            ),
            inheritedHyperlink,
          ),
        );
        break;
      }
      case "a": {
        const link = expectTag(element, "a");
        runs.push(
          ...normalizeInlineChildren(
            link.props.children,
            mergeTextStyles(
              inheritedStyle,
              resolveTextStyle(link.props.style),
            ),
            link.props.href ?? inheritedHyperlink,
          ),
        );
        break;
      }
      case "b": {
        const bold = expectTag(element, "b");
        runs.push(
          ...normalizeInlineChildren(
            bold.props.children,
            mergeTextStyles(
              mergeTextStyles(
                inheritedStyle,
                resolveTextStyle(bold.props.style),
              ),
              { bold: true },
            ),
            inheritedHyperlink,
          ),
        );
        break;
      }
      case "i": {
        const italic = expectTag(element, "i");
        runs.push(
          ...normalizeInlineChildren(
            italic.props.children,
            mergeTextStyles(
              mergeTextStyles(
                inheritedStyle,
                resolveTextStyle(italic.props.style),
              ),
              { italic: true },
            ),
            inheritedHyperlink,
          ),
        );
        break;
      }
      case "u": {
        const underline = expectTag(element, "u");
        runs.push(
          ...normalizeInlineChildren(
            underline.props.children,
            mergeTextStyles(
              mergeTextStyles(
                inheritedStyle,
                resolveTextStyle(underline.props.style),
              ),
              { underline: true },
            ),
            inheritedHyperlink,
          ),
        );
        break;
      }
    }
  }

  return runs;
}

function normalizeParagraphElement(element: PptxElement): Paragraph {
  const paragraph = expectTag(element, "p");
  const props = paragraph.props;
  return {
    style: resolveParagraphStyle(props.style),
    runs: normalizeInlineChildren(props.children),
  };
}

function normalizeTextBlocks(
  children: PptxChild,
  parentTag: string,
  gap: Emu | undefined,
): ReadonlyArray<Paragraph> {
  const paragraphs: Paragraph[] = [];
  let inlineBuffer: PptxChild[] = [];

  const flushInlineBuffer = () => {
    if (inlineBuffer.length === 0) return;
    paragraphs.push({
      runs: normalizeInlineChildren(inlineBuffer),
    });
    inlineBuffer = [];
  };

  for (const child of nonIgnorableChildren(children)) {
    if (typeof child === "string" || typeof child === "number") {
      inlineBuffer.push(child);
      continue;
    }

    const element = expectElement(child, parentTag);
    if (element.type === "p") {
      flushInlineBuffer();
      paragraphs.push(normalizeParagraphElement(element));
      continue;
    }

    if (element.type === "spacer") {
      spacerIsLayoutOnly(parentTag);
    }

    if (isInlineTag(element.type)) {
      inlineBuffer.push(element as PptxChild);
      continue;
    }

    invalidTree(
      `<${parentTag}> only accepts text, inline tags, and <p>; found <${
        String(element.type)
      }>`,
    );
  }

  flushInlineBuffer();
  return withResolvedTextParagraphs(paragraphs, gap);
}

function isAbsoluteFrame(
  value: PositionableProps,
): value is PositionableProps & {
  readonly x: Emu;
  readonly y: Emu;
  readonly w: Emu;
  readonly h: Emu;
} {
  return value.x !== undefined || value.y !== undefined;
}

function toPositioned(
  tag: string,
  props: PositionableProps,
  child: LayoutNode,
): LayoutNode | Positioned {
  if (!isAbsoluteFrame(props)) return child;
  if (
    props.x === undefined || props.y === undefined ||
    props.w === undefined || props.h === undefined
  ) {
    invalidTree(
      `<${tag}> absolute placement requires x, y, w, and h together`,
    );
  }
  return {
    kind: "positioned",
    x: props.x,
    y: props.y,
    w: props.w,
    h: props.h,
    child,
  };
}

function flowLayoutProps(props: LayoutProps): LayoutItemProps | undefined {
  if (
    props.basis === undefined && props.grow === undefined &&
    props.w === undefined && props.h === undefined &&
    props.alignSelf === undefined && props.aspectRatio === undefined
  ) {
    return undefined;
  }
  return {
    basis: props.basis,
    grow: props.grow,
    w: props.w,
    h: props.h,
    alignSelf: props.alignSelf,
    aspectRatio: props.aspectRatio,
  };
}

function hasAbsoluteFlowConflict(props: LayoutProps): boolean {
  return props.basis !== undefined || props.grow !== undefined ||
    props.alignSelf !== undefined || props.aspectRatio !== undefined;
}

function layoutPropsOf(element: PptxElement): LayoutProps {
  if (
    isTag(element, "row") || isTag(element, "column") ||
    isTag(element, "stack") ||
    isTag(element, "align") || isTag(element, "textbox") ||
    isTag(element, "shape") || isTag(element, "image") ||
    isTag(element, "table") || isChartBarElement(element)
  ) {
    return element.props;
  }
  invalidTree(
    `Element <${String(element.type)}> cannot participate in layout`,
  );
}

function normalizeChart(props: AnyChartBarElement["props"]): BarChart {
  return {
    kind: "chart",
    chartType: "bar",
    points: props.data.map((row) => ({
      category: (row as Record<string, unknown>)[props.category] as string,
      value: (row as Record<string, unknown>)[props.value] as number,
    })),
    title: props.title,
    seriesName: props.seriesName ?? props.value,
    color: props.color,
    labels: props.labels ?? false,
    legend: props.legend ?? false,
    direction: props.direction ?? "column",
    valueAxis: props.valueAxis,
  };
}

function normalizeTableCell(
  element: PptxElement,
  defaults: LayoutDefaults,
): TableCell {
  const cell = expectTag(element, "td");
  const props = cell.props;
  return {
    style: resolveCellStyle(props.style),
    paragraphs: normalizeTextBlocks(
      props.children,
      "td",
      textGap(props.gap, defaults),
    ),
  };
}

function normalizeTableRow(
  element: PptxElement,
  defaults: LayoutDefaults,
): TableRow {
  const row = expectTag(element, "tr");
  const props = row.props;
  const cells = nonIgnorableChildren(props.children).map((child) =>
    normalizeTableCell(expectElement(child, "tr"), defaults)
  );
  return { height: props.height, cells };
}

function normalizeBaseNode(
  element: PptxElement,
  defaults: LayoutDefaults,
): LayoutNode {
  if (isTag(element, "row")) {
    const props = element.props;
    return {
      kind: "row",
      gap: withResolvedContainerGap(props.gap, defaults, "row"),
      padding: props.padding,
      justify: props.justify,
      align: props.align,
      children: normalizeAxisChildren(props.children, "row", defaults),
    } satisfies Row;
  }
  if (isTag(element, "column")) {
    const props = element.props;
    return {
      kind: "col",
      gap: withResolvedContainerGap(props.gap, defaults, "column"),
      padding: props.padding,
      justify: props.justify,
      align: props.align,
      children: normalizeAxisChildren(props.children, "col", defaults),
    } satisfies Col;
  }
  if (isTag(element, "stack")) {
    const props = element.props;
    return {
      kind: "stack",
      padding: withResolvedStackPadding(props.padding, defaults),
      children: normalizeStackChildren(props.children, defaults),
    } satisfies Stack;
  }
  if (isTag(element, "align")) {
    const props = element.props;
    const children = nonIgnorableChildren(props.children);
    if (children.length !== 1) {
      invalidTree("<align> requires exactly one child");
    }
    return {
      kind: "align",
      x: props.x,
      y: props.y,
      padding: props.padding,
      w: props.w,
      h: props.h,
      aspectRatio: props.aspectRatio,
      child: normalizeNode(expectElement(children[0], "align"), defaults),
    } satisfies Align;
  }
  if (isTag(element, "textbox")) {
    const props = element.props;
    return {
      kind: "textbox",
      style: resolveBoxStyle(props.style),
      paragraphs: normalizeTextBlocks(
        props.children,
        "textbox",
        textGap(props.gap, defaults),
      ),
    } satisfies LeafTextBox;
  }
  if (isTag(element, "shape")) {
    const props = element.props;
    return {
      kind: "shape",
      preset: props.preset,
      style: resolveBoxStyle(props.style),
      paragraphs: normalizeTextBlocks(
        props.children,
        "shape",
        textGap(props.gap, defaults),
      ),
    } satisfies LeafShape;
  }
  if (isTag(element, "image")) {
    const props = element.props;
    return {
      kind: "image",
      data: props.data,
      contentType: props.contentType,
      description: props.description,
      fit: props.fit,
      crop: props.crop,
      alpha: props.alpha,
    } satisfies LeafImage;
  }
  if (isTag(element, "table")) {
    const props = element.props;
    const rows = nonIgnorableChildren(props.children).map((child) =>
      normalizeTableRow(expectElement(child, "table"), defaults)
    );
    return {
      kind: "table",
      cols: props.cols,
      rows,
    } satisfies LeafTable;
  }
  if (isChartBarElement(element)) {
    return normalizeChart(element.props) satisfies Chart;
  }
  invalidTree(`Unexpected element <${String(element.type)}> in slide tree`);
}

function normalizeNode(
  element: PptxElement,
  defaults: LayoutDefaults,
): ResolvableNode {
  if (isTag(element, "align")) {
    return normalizeBaseNode(element, defaults);
  }
  const base = normalizeBaseNode(element, defaults);
  if (isTag(element, "row")) return toPositioned("row", element.props, base);
  if (isTag(element, "column")) {
    return toPositioned("column", element.props, base);
  }
  if (isTag(element, "stack")) {
    return toPositioned("stack", element.props, base);
  }
  if (isTag(element, "textbox")) {
    return toPositioned("textbox", element.props, base);
  }
  if (isTag(element, "shape")) {
    return toPositioned("shape", element.props, base);
  }
  if (isTag(element, "image")) {
    return toPositioned("image", element.props, base);
  }
  if (isTag(element, "table")) {
    return toPositioned("table", element.props, base);
  }
  if (isChartBarElement(element)) {
    return toPositioned("ChartBar", element.props, base);
  }
  return base;
}

function normalizeAxisChildren(
  children: PptxChild,
  parentTag: "row" | "col",
  defaults: LayoutDefaults,
): ReadonlyArray<LayoutItem | Positioned | Spacer> {
  return nonIgnorableChildren(children).map((child) => {
    const element = expectElement(child, parentTag);
    if (isTag(element, "spacer")) {
      return {
        kind: "spacer",
        grow: element.props.grow ?? 1,
        min: element.props.min,
        max: element.props.max,
      };
    }
    const node = normalizeNode(element, defaults);
    const props = layoutPropsOf(element);
    if (node.kind === "positioned") {
      if (hasAbsoluteFlowConflict(props)) {
        invalidTree(
          `Absolute children in <${parentTag}> cannot also use basis/grow/alignSelf/aspectRatio`,
        );
      }
      return node;
    }
    return {
      kind: "item",
      child: node,
      ...(flowLayoutProps(props) ?? {}),
    } satisfies LayoutItem;
  });
}

function normalizeStackChildren(
  children: PptxChild,
  defaults: LayoutDefaults,
): ReadonlyArray<ResolvableNode> {
  return nonIgnorableChildren(children).map((child) =>
    normalizeNode(expectElement(child, "stack"), defaults)
  );
}

function normalizeSlideChildren(
  children: PptxChild,
  defaults: LayoutDefaults,
): ReadonlyArray<SlideChild> {
  return nonIgnorableChildren(children).map((child) =>
    normalizeNode(expectElement(child, "slide"), defaults)
  );
}

function normalizeSlide(
  element: PptxElement,
  inheritedDefaults: LayoutDefaults,
): Slide {
  const slide = expectTag(element, "slide");
  const props = slide.props;
  const defaults = mergeLayoutDefaults(inheritedDefaults, props.layout);
  return {
    props: withResolvedSlideProps(props.background, defaults),
    children: normalizeSlideChildren(props.children, defaults),
  };
}

/** Normalize a JSX-authored presentation into the internal presentation model. */
export function normalizePresentation(root: PptxElement): Presentation {
  if (!isElement(root) || !isTag(root, "presentation")) {
    invalidTree("generate() expects a <presentation> root element");
  }

  const props = root.props;
  const defaults = mergeLayoutDefaults(undefined, props.layout);
  const slides = nonIgnorableChildren(props.children).map((child) =>
    normalizeSlide(expectElement(child, "presentation"), defaults)
  );

  return {
    options: {
      title: props.title,
      creator: props.creator,
      slideWidth: props.slideWidth,
      slideHeight: props.slideHeight,
    },
    slides,
  };
}
