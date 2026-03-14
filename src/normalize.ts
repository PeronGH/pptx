/**
 * Normalize JSX runtime nodes into the internal presentation model.
 */

import type { Presentation, Slide } from "./document.ts";
import type { Chart, ChartLegend, ChartSeriesData } from "./chart.ts";
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
  type AnyChartBarElement,
  type AnyChartDonutElement,
  type AnyChartElement,
  type AnyChartLineElement,
  type AnyChartPieElement,
  ChartBarTag,
  ChartDonutTag,
  ChartLineTag,
  ChartPieTag,
  ColumnEndTag,
  ColumnStartTag,
  Fragment,
  type InternalTag,
  type LayoutDefaults,
  type LayoutProps,
  PositionedTag,
  type PptxChild,
  type PptxElement,
  type PptxNonFragmentElement,
  RowEndTag,
  RowStartTag,
} from "./public_types.ts";
import {
  mergeParagraphStyles,
  mergeTextStyles,
  resolveTextContainerStyle,
  resolveTextStyle,
  splitTextContainerStyle,
  type TextStyle,
} from "./style.ts";
import type { Emu } from "./types.ts";

type TaggedElement<Tag extends InternalTag> = Extract<
  PptxNonFragmentElement,
  { readonly type: Tag }
>;

function invalidTree(message: string): never {
  // Runtime validation remains for dynamic or plain-JS callers that can bypass
  // the JSX type graph. Typed TypeScript callers should fail before execution.
  throw new Error(message);
}

function invalidPushContext(tag: string): never {
  invalidTree(
    `<${tag}> no longer accepts push; use <Row.End> or <Column.End> instead`,
  );
}

function invalidPositionedContext(tag: string): never {
  invalidTree(
    `<${tag}> no longer accepts absolute x/y/w/h props; wrap it in <Positioned> instead`,
  );
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

function isChartLineElement(
  element: PptxElement,
): element is AnyChartLineElement {
  return element.type === ChartLineTag;
}

function isChartPieElement(
  element: PptxElement,
): element is AnyChartPieElement {
  return element.type === ChartPieTag;
}

function isChartDonutElement(
  element: PptxElement,
): element is AnyChartDonutElement {
  return element.type === ChartDonutTag;
}

function isChartElement(element: PptxElement): element is AnyChartElement {
  return isChartBarElement(element) || isChartLineElement(element) ||
    isChartPieElement(element) || isChartDonutElement(element);
}

function isPositionedElement(
  element: PptxElement,
): element is TaggedElement<typeof PositionedTag> {
  return element.type === PositionedTag;
}

function isRowStartElement(
  element: PptxElement,
): element is TaggedElement<typeof RowStartTag> {
  return element.type === RowStartTag;
}

function isRowEndElement(
  element: PptxElement,
): element is TaggedElement<typeof RowEndTag> {
  return element.type === RowEndTag;
}

function isColumnStartElement(
  element: PptxElement,
): element is TaggedElement<typeof ColumnStartTag> {
  return element.type === ColumnStartTag;
}

function isColumnEndElement(
  element: PptxElement,
): element is TaggedElement<typeof ColumnEndTag> {
  return element.type === ColumnEndTag;
}

function isTag<Tag extends InternalTag>(
  element: PptxElement,
  tag: Tag,
): element is TaggedElement<Tag> {
  return element.type === tag;
}

function expectTag<Tag extends InternalTag>(
  element: PptxElement,
  tag: Tag,
): TaggedElement<Tag> {
  if (!isTag(element, tag)) {
    invalidTree(`Expected <${String(tag)}>, found <${String(element.type)}>`);
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

function normalizeParagraphElement(
  element: PptxElement,
  inheritedTextStyle?: TextStyle,
): Paragraph {
  const paragraph = expectTag(element, "p");
  const props = paragraph.props;
  const resolved = resolveTextContainerStyle(props.style);
  const { paragraph: paraStyle, text: localTextStyle } =
    splitTextContainerStyle(resolved);
  const effectiveTextStyle = mergeTextStyles(
    inheritedTextStyle,
    localTextStyle,
  );
  return {
    style: paraStyle,
    runs: normalizeInlineChildren(props.children, effectiveTextStyle),
  };
}

function normalizeTextBlocks(
  children: PptxChild,
  parentTag: string,
  gap: Emu | undefined,
  inheritedTextStyle?: TextStyle,
): ReadonlyArray<Paragraph> {
  const paragraphs: Paragraph[] = [];
  let inlineBuffer: PptxChild[] = [];

  const flushInlineBuffer = () => {
    if (inlineBuffer.length === 0) return;
    paragraphs.push({
      runs: normalizeInlineChildren(inlineBuffer, inheritedTextStyle),
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
      paragraphs.push(normalizeParagraphElement(element, inheritedTextStyle));
      continue;
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

function dynamicPushOf(
  element: PptxElement,
): LayoutItemProps["push"] | undefined {
  const props = element.props as Record<PropertyKey, unknown>;
  if (props.push === "start" || props.push === "end") {
    return props.push;
  }
  return undefined;
}

function hasDynamicAbsolutePlacement(element: PptxElement): boolean {
  const props = element.props as Record<PropertyKey, unknown>;
  return typeof props.x === "number" || typeof props.y === "number";
}

function hasFlowLayoutProps(props: LayoutProps): boolean {
  return props.basis !== undefined || props.grow !== undefined ||
    props.w !== undefined || props.h !== undefined ||
    props.alignSelf !== undefined || props.aspectRatio !== undefined;
}

function invalidPositionedChild(tag: string): never {
  invalidTree(
    `<Positioned> child <${tag}> cannot also use basis/grow/w/h/alignSelf/aspectRatio`,
  );
}

function normalizePositionedElement(
  element: TaggedElement<typeof PositionedTag>,
  defaults: LayoutDefaults,
): Positioned {
  const children = nonIgnorableChildren(element.props.children);
  if (children.length !== 1) {
    invalidTree("<Positioned> requires exactly one child");
  }
  const childElement = expectElement(children[0], "Positioned");
  const props = layoutPropsOf(childElement);
  if (hasFlowLayoutProps(props)) {
    invalidPositionedChild(
      isChartElement(childElement)
        ? elementDisplayTag(childElement)
        : String(childElement.type),
    );
  }
  const child = normalizeBaseNode(childElement, defaults);
  return {
    kind: "positioned",
    x: element.props.x,
    y: element.props.y,
    w: element.props.w,
    h: element.props.h,
    child,
  };
}

function isFlowLayoutElement(
  element: PptxElement,
): element is
  | TaggedElement<"row">
  | TaggedElement<"column">
  | TaggedElement<"stack">
  | TaggedElement<"align">
  | TaggedElement<"textbox">
  | TaggedElement<"shape">
  | TaggedElement<"image">
  | TaggedElement<"table">
  | TaggedElement<"p">
  | AnyChartElement {
  if (
    isTag(element, "row") || isTag(element, "column") ||
    isTag(element, "stack") || isTag(element, "align") ||
    isTag(element, "textbox") || isTag(element, "shape") ||
    isTag(element, "image") || isTag(element, "table") ||
    isTag(element, "p") || isChartElement(element)
  ) {
    return true;
  }
  return false;
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

function layoutPropsOf(element: PptxElement): LayoutProps {
  if (
    isTag(element, "row") || isTag(element, "column") ||
    isTag(element, "stack") ||
    isTag(element, "align") || isTag(element, "textbox") ||
    isTag(element, "shape") || isTag(element, "image") ||
    isTag(element, "table") || isTag(element, "p") ||
    isChartElement(element)
  ) {
    return element.props;
  }
  invalidTree(
    `Element <${String(element.type)}> cannot participate in layout`,
  );
}

function normalizeLegend(legend: ChartLegend | undefined) {
  if (legend === undefined || legend === false) {
    return { show: false, position: "right" as const };
  }
  if (legend === true) {
    return { show: true, position: "right" as const };
  }
  return {
    show: true,
    position: legend.position ?? "right",
  };
}

function normalizeHoleSize(holeSize: number | undefined): number {
  const value = holeSize ?? 50;
  if (!Number.isInteger(value) || value < 1 || value > 90) {
    invalidTree(
      `Invalid donut holeSize "${value}": expected an integer from 1 to 90`,
    );
  }
  return value;
}

function requireNonEmptySeries(
  series: ReadonlyArray<ChartSeriesData>,
): readonly [ChartSeriesData, ...ReadonlyArray<ChartSeriesData>] {
  if (series.length === 0) {
    invalidTree("Charts require at least one series");
  }
  return series as readonly [
    ChartSeriesData,
    ...ReadonlyArray<ChartSeriesData>,
  ];
}

function normalizeChartSeries(
  data: ReadonlyArray<object>,
  series: ReadonlyArray<{
    readonly name: string;
    readonly value: string;
    readonly color?: ChartSeriesData["color"];
  }>,
) {
  return requireNonEmptySeries(series.map((entry) => ({
    name: entry.name,
    values: data.map((row) =>
      (row as Record<string, unknown>)[entry.value] as number
    ),
    color: entry.color,
  })));
}

function normalizeChart(element: AnyChartElement): Chart {
  const categories = element.props.data.map((row) =>
    (row as Record<string, unknown>)[element.props.category] as string
  );
  const legend = normalizeLegend(element.props.legend);

  if (isChartBarElement(element)) {
    return {
      kind: "chart",
      chartType: "bar",
      categories,
      series: normalizeChartSeries(element.props.data, element.props.series),
      title: element.props.title,
      labels: element.props.labels ?? false,
      legend,
      direction: element.props.direction ?? "column",
      categoryAxis: element.props.categoryAxis,
      valueAxis: element.props.valueAxis,
    };
  }
  if (isChartLineElement(element)) {
    return {
      kind: "chart",
      chartType: "line",
      categories,
      series: normalizeChartSeries(element.props.data, element.props.series),
      title: element.props.title,
      labels: element.props.labels ?? false,
      legend,
      markers: element.props.markers ?? false,
      categoryAxis: element.props.categoryAxis,
      valueAxis: element.props.valueAxis,
    };
  }
  if (isChartPieElement(element)) {
    const series = normalizeChartSeries(
      element.props.data,
      element.props.series,
    );
    return {
      kind: "chart",
      chartType: "pie",
      categories,
      series: [series[0]!],
      title: element.props.title,
      labels: element.props.labels ?? false,
      legend,
    };
  }
  const series = normalizeChartSeries(element.props.data, element.props.series);
  return {
    kind: "chart",
    chartType: "donut",
    categories,
    series: [series[0]!],
    title: element.props.title,
    labels: element.props.labels ?? false,
    legend,
    holeSize: normalizeHoleSize(element.props.holeSize),
  };
}

function normalizeAxisFlowItem(
  element: PptxElement,
  parentTag: "row" | "col",
  defaults: LayoutDefaults,
): LayoutItem {
  const node = normalizeNode(element, defaults);
  if (node.kind === "positioned") {
    invalidTree(
      `<${parentTag}> flow groups cannot contain <Positioned>; place positioned children directly under <${parentTag}>`,
    );
  }
  return {
    kind: "item",
    child: node,
    ...(flowLayoutProps(layoutPropsOf(element)) ?? {}),
  };
}

function normalizeAxisSlotChildren(
  children: PptxChild,
  parentTag: "row" | "col",
  defaults: LayoutDefaults,
): ReadonlyArray<LayoutItem> {
  return nonIgnorableChildren(children).map((child) => {
    const element = expectElement(child, `${parentTag} slot`);
    if (
      isRowStartElement(element) || isRowEndElement(element) ||
      isColumnStartElement(element) || isColumnEndElement(element)
    ) {
      invalidTree(`<${parentTag}> slots cannot nest other layout slots`);
    }
    return normalizeAxisFlowItem(element, parentTag, defaults);
  });
}

function normalizeTableCell(
  element: PptxElement,
  defaults: LayoutDefaults,
): TableCell {
  const cell = expectTag(element, "td");
  const props = cell.props;
  const resolved = resolveTextContainerStyle(props.style);
  const { box, text: textDefaults } = splitTextContainerStyle(resolved);
  return {
    style: box
      ? {
        fill: box.fill,
        line: box.line,
        padding: box.padding,
        verticalAlign: box.verticalAlign,
      }
      : undefined,
    paragraphs: normalizeTextBlocks(
      props.children,
      "td",
      textGap(props.gap, defaults),
      textDefaults,
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
    const resolved = resolveTextContainerStyle(props.style);
    const { box, text: textDefaults } = splitTextContainerStyle(resolved);
    return {
      kind: "textbox",
      style: box,
      paragraphs: normalizeTextBlocks(
        props.children,
        "textbox",
        textGap(props.gap, defaults),
        textDefaults,
      ),
    } satisfies LeafTextBox;
  }
  if (isTag(element, "shape")) {
    const props = element.props;
    const resolved = resolveTextContainerStyle(props.style);
    const { box, text: textDefaults } = splitTextContainerStyle(resolved);
    return {
      kind: "shape",
      preset: props.preset,
      style: box,
      paragraphs: normalizeTextBlocks(
        props.children,
        "shape",
        textGap(props.gap, defaults),
        textDefaults,
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
  if (isChartElement(element)) {
    return normalizeChart(element) satisfies Chart;
  }
  if (isTag(element, "p")) {
    // Top-level <Text.P> auto-creates an implicit textbox.
    const props = element.props;
    const resolved = resolveTextContainerStyle(props.style);
    const { box, paragraph: paraStyle, text: textStyle } =
      splitTextContainerStyle(resolved);
    return {
      kind: "textbox",
      style: box,
      paragraphs: [{
        style: paraStyle,
        runs: normalizeInlineChildren(props.children, textStyle),
      }],
    } satisfies LeafTextBox;
  }
  invalidTree(`Unexpected element <${String(element.type)}> in slide tree`);
}

function elementDisplayTag(element: PptxElement): string {
  if (isChartBarElement(element)) return "Chart.Bar";
  if (isChartLineElement(element)) return "Chart.Line";
  if (isChartPieElement(element)) return "Chart.Pie";
  if (isChartDonutElement(element)) return "Chart.Donut";
  if (isPositionedElement(element)) return "Positioned";
  if (isRowStartElement(element)) return "Row.Start";
  if (isRowEndElement(element)) return "Row.End";
  if (isColumnStartElement(element)) return "Column.Start";
  if (isColumnEndElement(element)) return "Column.End";
  if (isTag(element, "p")) return "Text.P";
  return String(element.type);
}

function normalizeNode(
  element: PptxElement,
  defaults: LayoutDefaults,
): ResolvableNode {
  if (dynamicPushOf(element) !== undefined) {
    invalidPushContext(elementDisplayTag(element));
  }
  if (isPositionedElement(element)) {
    return normalizePositionedElement(element, defaults);
  }
  if (
    isFlowLayoutElement(element) && !isTag(element, "align") &&
    hasDynamicAbsolutePlacement(element)
  ) {
    invalidPositionedContext(elementDisplayTag(element));
  }
  return normalizeBaseNode(element, defaults);
}

function normalizeAxisChildren(
  children: PptxChild,
  parentTag: "row" | "col",
  defaults: LayoutDefaults,
): ReadonlyArray<LayoutItem | Positioned> {
  const normalized: Array<LayoutItem | Positioned> = [];
  let sawDirectFlow = false;
  let sawSlot = false;
  let sawStart = false;
  let sawEnd = false;

  for (const child of nonIgnorableChildren(children)) {
    const element = expectElement(child, parentTag);
    if (isPositionedElement(element)) {
      normalized.push(normalizePositionedElement(element, defaults));
      continue;
    }

    const isStart = parentTag === "row"
      ? isRowStartElement(element)
      : isColumnStartElement(element);
    const isEnd = parentTag === "row"
      ? isRowEndElement(element)
      : isColumnEndElement(element);

    if (
      isRowStartElement(element) || isRowEndElement(element) ||
      isColumnStartElement(element) || isColumnEndElement(element)
    ) {
      if (!isStart && !isEnd) {
        invalidTree(
          `<${parentTag}> only accepts its own slot components (${
            parentTag === "row"
              ? "<Row.Start>/<Row.End>"
              : "<Column.Start>/<Column.End>"
          })`,
        );
      }
      if (sawDirectFlow) {
        invalidTree(
          `<${parentTag}> cannot mix direct flow children with slot groups`,
        );
      }
      sawSlot = true;
      if (isStart) {
        if (sawStart) {
          invalidTree(
            `<${parentTag}> accepts at most one ${
              parentTag === "row" ? "<Row.Start>" : "<Column.Start>"
            }`,
          );
        }
        sawStart = true;
        normalized.push(...normalizeAxisSlotChildren(
          element.props.children,
          parentTag,
          defaults,
        ));
        continue;
      }
      if (sawEnd) {
        invalidTree(
          `<${parentTag}> accepts at most one ${
            parentTag === "row" ? "<Row.End>" : "<Column.End>"
          }`,
        );
      }
      sawEnd = true;
      const endItems = [...normalizeAxisSlotChildren(
        element.props.children,
        parentTag,
        defaults,
      )];
      if (endItems.length > 0) {
        const first = endItems[0];
        if (first) {
          endItems[0] = { ...first, push: "end" };
        }
      }
      normalized.push(...endItems);
      continue;
    }

    if (sawSlot) {
      invalidTree(
        `<${parentTag}> cannot mix direct flow children with slot groups`,
      );
    }
    sawDirectFlow = true;
    normalized.push(normalizeAxisFlowItem(element, parentTag, defaults));
  }

  return normalized;
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
