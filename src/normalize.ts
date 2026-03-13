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
  type ChartProps,
  Fragment,
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

type TextBlock =
  | { readonly kind: "paragraph"; readonly paragraph: Paragraph }
  | { readonly kind: "spacer"; readonly size: Emu };

type IntrinsicTag = keyof PptxIntrinsicElements;
type TaggedElement<Tag extends IntrinsicTag> = PptxElement<
  Tag,
  PptxIntrinsicElements[Tag]
>;

function isElement(value: unknown): value is PptxElement {
  return typeof value === "object" && value !== null &&
    "type" in value && "props" in value;
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
    throw new Error(`Expected <${tag}>, found <${String(element.type)}>`);
  }
  return element;
}

function flattenChildren(children: PptxChild): ReadonlyArray<unknown> {
  const items: unknown[] = [];
  const visit = (value: PptxChild): void => {
    if (Array.isArray(value)) {
      for (const entry of value) visit(entry);
      return;
    }
    if (isElement(value) && value.type === Fragment) {
      visit(value.props.children);
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
    throw new Error(`<${parentTag}> only accepts JSX element children`);
  }
  return child;
}

function asEmu(value: number): Emu {
  // `Emu` is a branded number, so normalization only needs a single
  // cast at the arithmetic boundary where raw numeric math becomes EMU-typed.
  return value as Emu;
}

function addEmu(left: Emu | undefined, right: Emu): Emu {
  return asEmu((left ?? 0) + right);
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

function withSpacingAfter(paragraph: Paragraph, after: Emu): Paragraph {
  const spacing = {
    after: addEmu(paragraph.style?.spacing?.after, after),
  };
  return {
    ...paragraph,
    style: mergeParagraphStyles(paragraph.style, { spacing }),
  };
}

function applySpacers(
  blocks: ReadonlyArray<TextBlock>,
): ReadonlyArray<Paragraph> {
  const paragraphs: Paragraph[] = [];
  let pendingBefore: Emu | undefined;

  for (const block of blocks) {
    if (block.kind === "spacer") {
      pendingBefore = addEmu(pendingBefore, block.size);
      continue;
    }

    let paragraph = block.paragraph;
    if (pendingBefore !== undefined) {
      paragraph = withSpacingBefore(paragraph, pendingBefore);
      pendingBefore = undefined;
    }
    paragraphs.push(paragraph);
  }

  if (pendingBefore !== undefined) {
    if (paragraphs.length === 0) {
      paragraphs.push({
        runs: [],
        style: { spacing: { before: pendingBefore } },
      });
    } else {
      const last = paragraphs[paragraphs.length - 1]!;
      paragraphs[paragraphs.length - 1] = withSpacingAfter(last, pendingBefore);
    }
  }

  return paragraphs;
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
      throw new Error(
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
): ReadonlyArray<Paragraph> {
  const blocks: TextBlock[] = [];
  let inlineBuffer: PptxChild[] = [];

  const flushInlineBuffer = () => {
    if (inlineBuffer.length === 0) return;
    blocks.push({
      kind: "paragraph",
      paragraph: {
        runs: normalizeInlineChildren(inlineBuffer),
      },
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
      blocks.push({
        kind: "paragraph",
        paragraph: normalizeParagraphElement(element),
      });
      continue;
    }

    if (element.type === "spacer") {
      flushInlineBuffer();
      blocks.push({
        kind: "spacer",
        size: expectTag(element, "spacer").props.size,
      });
      continue;
    }

    if (isInlineTag(element.type)) {
      inlineBuffer.push(element);
      continue;
    }

    throw new Error(
      `<${parentTag}> only accepts text, inline tags, <p>, and <spacer>; found <${
        String(element.type)
      }>`,
    );
  }

  flushInlineBuffer();
  return applySpacers(blocks);
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
    throw new Error(
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
    isTag(element, "table") || isTag(element, "chart")
  ) {
    return element.props;
  }
  throw new Error(
    `Element <${String(element.type)}> cannot participate in layout`,
  );
}

function normalizeChart(props: ChartProps): BarChart {
  if (props.kind !== "bar") {
    throw new Error(`<chart> kind "${props.kind}" is not supported`);
  }

  return {
    kind: "chart",
    chartType: "bar",
    points: props.data.map((row, index) => {
      const category = row[props.category];
      const value = row[props.value];
      if (typeof category !== "string") {
        throw new Error(
          `<chart> data row ${index} has non-string category "${props.category}"`,
        );
      }
      if (typeof value !== "number") {
        throw new Error(
          `<chart> data row ${index} has non-number value "${props.value}"`,
        );
      }
      return { category, value };
    }),
    title: props.title,
    seriesName: props.seriesName ?? props.value,
    color: props.color,
    labels: props.labels ?? false,
    legend: props.legend ?? false,
    direction: props.direction ?? "column",
    valueAxis: props.valueAxis,
  };
}

function normalizeTableCell(element: PptxElement): TableCell {
  const cell = expectTag(element, "td");
  const props = cell.props;
  return {
    style: resolveCellStyle(props.style),
    paragraphs: normalizeTextBlocks(props.children, "td"),
  };
}

function normalizeTableRow(element: PptxElement): TableRow {
  const row = expectTag(element, "tr");
  const props = row.props;
  const cells = nonIgnorableChildren(props.children).map((child) =>
    normalizeTableCell(expectElement(child, "tr"))
  );
  return { height: props.height, cells };
}

function normalizeBaseNode(element: PptxElement): LayoutNode {
  if (isTag(element, "row")) {
    const props = element.props;
    return {
      kind: "row",
      gap: props.gap,
      padding: props.padding,
      justify: props.justify,
      align: props.align,
      children: normalizeAxisChildren(props.children, "row"),
    } satisfies Row;
  }
  if (isTag(element, "column")) {
    const props = element.props;
    return {
      kind: "col",
      gap: props.gap,
      padding: props.padding,
      justify: props.justify,
      align: props.align,
      children: normalizeAxisChildren(props.children, "col"),
    } satisfies Col;
  }
  if (isTag(element, "stack")) {
    const props = element.props;
    return {
      kind: "stack",
      padding: props.padding,
      children: normalizeStackChildren(props.children),
    } satisfies Stack;
  }
  if (isTag(element, "align")) {
    const props = element.props;
    const children = nonIgnorableChildren(props.children);
    if (children.length !== 1) {
      throw new Error("<align> requires exactly one child");
    }
    return {
      kind: "align",
      x: props.x,
      y: props.y,
      padding: props.padding,
      w: props.w,
      h: props.h,
      aspectRatio: props.aspectRatio,
      child: normalizeNode(expectElement(children[0], "align")),
    } satisfies Align;
  }
  if (isTag(element, "textbox")) {
    const props = element.props;
    return {
      kind: "textbox",
      style: resolveBoxStyle(props.style),
      paragraphs: normalizeTextBlocks(props.children, "textbox"),
    } satisfies LeafTextBox;
  }
  if (isTag(element, "shape")) {
    const props = element.props;
    return {
      kind: "shape",
      preset: props.preset,
      style: resolveBoxStyle(props.style),
      paragraphs: normalizeTextBlocks(props.children, "shape"),
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
      normalizeTableRow(expectElement(child, "table"))
    );
    return {
      kind: "table",
      cols: props.cols,
      rows,
    } satisfies LeafTable;
  }
  if (isTag(element, "chart")) {
    return normalizeChart(element.props) satisfies Chart;
  }
  throw new Error(`Unexpected element <${String(element.type)}> in slide tree`);
}

function normalizeNode(element: PptxElement): ResolvableNode {
  if (isTag(element, "align")) {
    return normalizeBaseNode(element);
  }
  const base = normalizeBaseNode(element);
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
  if (isTag(element, "chart")) {
    return toPositioned("chart", element.props, base);
  }
  return base;
}

function normalizeAxisChildren(
  children: PptxChild,
  parentTag: "row" | "col",
): ReadonlyArray<LayoutItem | Positioned> {
  return nonIgnorableChildren(children).map((child) => {
    const element = expectElement(child, parentTag);
    const node = normalizeNode(element);
    const props = layoutPropsOf(element);
    if (node.kind === "positioned") {
      if (hasAbsoluteFlowConflict(props)) {
        throw new Error(
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
): ReadonlyArray<ResolvableNode> {
  return nonIgnorableChildren(children).map((child) =>
    normalizeNode(expectElement(child, "stack"))
  );
}

function normalizeSlideChildren(
  children: PptxChild,
): ReadonlyArray<SlideChild> {
  return nonIgnorableChildren(children).map((child) =>
    normalizeNode(expectElement(child, "slide"))
  );
}

function normalizeSlide(element: PptxElement): Slide {
  const slide = expectTag(element, "slide");
  const props = slide.props;
  return {
    props: { background: props.background },
    children: normalizeSlideChildren(props.children),
  };
}

/** Normalize a JSX-authored presentation into the internal presentation model. */
export function normalizePresentation(root: unknown): Presentation {
  if (!isElement(root) || !isTag(root, "presentation")) {
    throw new Error("generate() expects a <presentation> root element");
  }

  const props = root.props;
  const slides = nonIgnorableChildren(props.children).map((child) =>
    normalizeSlide(expectElement(child, "presentation"))
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
