/**
 * Public generation pipeline: presentation -> layout -> scene -> OOXML package.
 */

import { u } from "./st.ts";
import type { Chart } from "./chart.ts";
import type { Emu, Percentage } from "./types.ts";
import type {
  Alignment,
  Fill,
  Insets,
  LineStyle,
  Shadow,
  TextFit,
  VerticalAlignment,
} from "./style.ts";
import type { Paragraph, TextRun } from "./text.ts";
import type {
  Background,
  BackgroundImageProps,
  Presentation,
} from "./document.ts";
import { inspectImage, resolveImageFit } from "./image.ts";
import { resolveSlideChildren } from "./layout.ts";
import { normalizePresentation } from "./normalize.ts";
import type { PptxElement } from "./public_types.ts";
import type { Frame, SceneNode } from "./scene.ts";
import type { TableCell, TableRow } from "./nodes.ts";
import type {
  ChartResource,
  HyperlinkResource,
  ImageResource,
} from "./packaging.ts";
import { generatePptx } from "./packaging.ts";
import { RelationshipIdGenerator } from "./ooxml/relationships.ts";
import type { ChartDefinition } from "./ooxml/chart.ts";
import type {
  ChartShape,
  Fill as InternalFill,
  Insets as InternalInsets,
  LineProperties as InternalLine,
  PictureShape,
  Shadow as InternalShadow,
  SlideBackground,
  SlideShape,
  TableCell as InternalTableCell,
  TableRow as InternalTableRow,
  TableShape as InternalTableShape,
  TextFit as InternalTextFit,
  TextParagraph as InternalParagraph,
  TextRun as InternalRun,
  VerticalAlignment as InternalVAlign,
} from "./ooxml/slide.ts";

const ALIGNMENT_MAP: Record<Alignment, "l" | "ctr" | "r" | "just"> = {
  left: "l",
  center: "ctr",
  right: "r",
  justify: "just",
};

const VALIGN_MAP: Record<VerticalAlignment, InternalVAlign> = {
  top: "t",
  middle: "ctr",
  bottom: "b",
};

function asEmu(value: number): Emu {
  // `Emu` is a branded number, so generator math converts numeric frame
  // calculations back into the branded type at this single boundary.
  // OOXML coordinate/extents are integer-valued and PowerPoint is strict here.
  return Math.round(value) as Emu;
}

/** Context for assembling a slide's resources and relationships. */
interface SlideContext {
  readonly relGen: RelationshipIdGenerator;
  readonly layoutRelId: string;
  readonly images: Map<string, ImageResource>;
  readonly charts: Map<string, ChartResource>;
  readonly hyperlinks: Map<string, HyperlinkResource>;
}

function createSlideContext(): SlideContext {
  const relGen = new RelationshipIdGenerator();
  return {
    relGen,
    layoutRelId: relGen.next(),
    images: new Map(),
    charts: new Map(),
    hyperlinks: new Map(),
  };
}

function toInternalFill(fill: Fill): InternalFill {
  switch (fill.kind) {
    case "solid":
      return { kind: "solid", color: fill.color, alpha: fill.alpha };
    case "linear-gradient":
      return {
        kind: "linear-gradient",
        angle: fill.angle,
        stops: fill.stops,
      };
    case "none":
      return { kind: "none" };
  }
}

function toInternalLine(line: LineStyle): InternalLine {
  return {
    width: line.width,
    fill: line.fill ? toInternalFill(line.fill) : undefined,
    dash: line.dash,
  };
}

function toInternalInsets(
  padding: Emu | Insets | undefined,
): InternalInsets | undefined {
  if (padding === undefined) return undefined;
  if (typeof padding === "number") {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  return {
    top: padding.top,
    right: padding.right,
    bottom: padding.bottom,
    left: padding.left,
  };
}

function insetFrame(frame: Frame, padding: Emu | Insets | undefined): Frame {
  const insets = toInternalInsets(padding);
  if (!insets) return frame;
  return {
    x: asEmu(frame.x + (insets.left ?? 0)),
    y: asEmu(frame.y + (insets.top ?? 0)),
    w: asEmu(Math.max(
      0,
      frame.w - (insets.left ?? 0) - (insets.right ?? 0),
    )),
    h: asEmu(Math.max(
      0,
      frame.h - (insets.top ?? 0) - (insets.bottom ?? 0),
    )),
  };
}

function toInternalShadow(
  shadow: Shadow | undefined,
): InternalShadow | undefined {
  if (!shadow) return undefined;
  return {
    color: shadow.color,
    blur: shadow.blur,
    distance: shadow.distance,
    angle: shadow.angle,
    alpha: shadow.alpha,
  };
}

function toInternalTextFit(
  fit: TextFit | undefined,
): InternalTextFit | undefined {
  return fit;
}

function toInternalChartDefinition(chart: Chart): ChartDefinition {
  switch (chart.chartType) {
    case "bar":
      return {
        type: "bar",
        title: chart.title,
        categories: chart.categories,
        series: chart.series,
        labels: chart.labels,
        legend: chart.legend,
        direction: chart.direction,
        categoryAxis: chart.categoryAxis,
        valueAxis: chart.valueAxis,
      };
    case "line":
      return {
        type: "line",
        title: chart.title,
        categories: chart.categories,
        series: chart.series,
        labels: chart.labels,
        legend: chart.legend,
        markers: chart.markers,
        categoryAxis: chart.categoryAxis,
        valueAxis: chart.valueAxis,
      };
    case "pie":
      return {
        type: "pie",
        title: chart.title,
        categories: chart.categories,
        series: chart.series,
        labels: chart.labels,
        legend: chart.legend,
      };
    case "donut":
      return {
        type: "donut",
        title: chart.title,
        categories: chart.categories,
        series: chart.series,
        labels: chart.labels,
        legend: chart.legend,
        holeSize: chart.holeSize,
      };
  }
}

function toInternalRun(run: TextRun, ctx: SlideContext): InternalRun {
  let hyperlinkInfo: { rId: string } | undefined;
  if (run.hyperlink) {
    const rId = ctx.relGen.next();
    ctx.hyperlinks.set(rId, { url: run.hyperlink });
    hyperlinkInfo = { rId };
  }

  return {
    text: run.text,
    bold: run.style?.bold,
    italic: run.style?.italic,
    underline: run.style?.underline,
    fontSize: run.style?.fontSize,
    fontColor: run.style?.fontColor,
    fontFamily: run.style?.fontFamily,
    hyperlink: hyperlinkInfo,
  };
}

function toInternalParagraph(
  paragraph: Paragraph,
  ctx: SlideContext,
): InternalParagraph {
  return {
    runs: paragraph.runs.map((run) => toInternalRun(run, ctx)),
    level: paragraph.style?.level,
    alignment: paragraph.style?.align
      ? ALIGNMENT_MAP[paragraph.style.align]
      : undefined,
    bullet: paragraph.style?.bullet,
    spacing: paragraph.style?.spacing,
  };
}

function toInternalCell(
  cell: TableCell,
  ctx: SlideContext,
): InternalTableCell {
  return {
    paragraphs: cell.paragraphs.map((paragraph) =>
      toInternalParagraph(paragraph, ctx)
    ),
    fill: cell.style?.fill ? toInternalFill(cell.style.fill) : undefined,
    line: cell.style?.line ? toInternalLine(cell.style.line) : undefined,
    padding: toInternalInsets(cell.style?.padding),
    verticalAlignment: cell.style?.verticalAlign
      ? VALIGN_MAP[cell.style.verticalAlign]
      : undefined,
  };
}

function toInternalTableRow(
  row: TableRow,
  ctx: SlideContext,
): InternalTableRow {
  return {
    height: row.height,
    cells: row.cells.map((cell) => toInternalCell(cell, ctx)),
  };
}

function fitTableColumns(
  tableWidth: Emu,
  columns: ReadonlyArray<Emu>,
): ReadonlyArray<Emu> {
  if (columns.length === 0) return columns;

  const total = columns.reduce((sum, width) => sum + width, 0);
  if (total === tableWidth) return columns;

  if (total <= 0) {
    const equal = Math.floor(tableWidth / columns.length);
    const fitted = columns.map(() => equal);
    const remainder = tableWidth - equal * columns.length;
    fitted[fitted.length - 1] = equal + remainder;
    return fitted.map((width) => width as Emu);
  }

  const scale = tableWidth / total;
  const fitted = columns.map((width) => Math.round(width * scale));
  const diff = tableWidth - fitted.reduce((sum, width) => sum + width, 0);
  fitted[fitted.length - 1] = (fitted[fitted.length - 1] ?? 0) + diff;
  return fitted.map((width) => width as Emu);
}

function toInternalShape(
  node: SceneNode,
  ctx: SlideContext,
): SlideShape {
  switch (node.kind) {
    case "textbox":
      return {
        kind: "textbox",
        x: node.x,
        y: node.y,
        cx: node.w,
        cy: node.h,
        paragraphs: node.paragraphs.map((paragraph) =>
          toInternalParagraph(paragraph, ctx)
        ),
        fill: node.style?.fill ? toInternalFill(node.style.fill) : undefined,
        line: node.style?.line ? toInternalLine(node.style.line) : undefined,
        verticalAlignment: node.style?.verticalAlign
          ? VALIGN_MAP[node.style.verticalAlign]
          : undefined,
        padding: toInternalInsets(node.style?.padding),
        fit: toInternalTextFit(node.style?.fit),
        shadow: toInternalShadow(node.style?.shadow),
      };
    case "shape":
      return {
        kind: "preset",
        x: node.x,
        y: node.y,
        cx: node.w,
        cy: node.h,
        preset: node.preset,
        paragraphs: node.paragraphs.map((paragraph) =>
          toInternalParagraph(paragraph, ctx)
        ),
        fill: node.style?.fill ? toInternalFill(node.style.fill) : undefined,
        line: node.style?.line ? toInternalLine(node.style.line) : undefined,
        verticalAlignment: node.style?.verticalAlign
          ? VALIGN_MAP[node.style.verticalAlign]
          : undefined,
        padding: toInternalInsets(node.style?.padding),
        fit: toInternalTextFit(node.style?.fit),
        shadow: toInternalShadow(node.style?.shadow),
      };
    case "image": {
      const image = inspectImage(node.data);
      const rId = ctx.relGen.next();
      ctx.images.set(rId, { ...image, data: node.data });
      const resolved = resolveImageFit(
        { x: node.x, y: node.y, w: node.w, h: node.h },
        image.size,
        node.fit,
        node.crop,
      );
      return {
        kind: "picture",
        x: resolved.frame.x,
        y: resolved.frame.y,
        cx: resolved.frame.w,
        cy: resolved.frame.h,
        rId,
        description: node.description,
        crop: resolved.crop,
        alpha: node.alpha,
      } satisfies PictureShape;
    }
    case "table":
      return {
        kind: "table",
        x: node.x,
        y: node.y,
        cx: node.w,
        cy: node.h,
        columns: fitTableColumns(node.w, node.cols),
        rows: node.rows.map((row) => toInternalTableRow(row, ctx)),
      } satisfies InternalTableShape;
    case "chart": {
      const rId = ctx.relGen.next();
      ctx.charts.set(rId, {
        definition: toInternalChartDefinition(node),
      });
      return {
        kind: "chart",
        x: node.x,
        y: node.y,
        cx: node.w,
        cy: node.h,
        rId,
      } satisfies ChartShape;
    }
  }
}

function isBackgroundImage(
  bg: Background,
): bg is BackgroundImageProps {
  return typeof bg === "object" && "data" in bg;
}

function relativeInset(offset: number, extent: number): Percentage {
  return Math.round(offset / extent * 100000) as Percentage;
}

function toSlideBackground(
  background: Background | undefined,
  slideFrame: Frame,
  ctx: SlideContext,
): SlideBackground | undefined {
  if (background === undefined) return undefined;
  if (typeof background === "string") {
    return { fill: { kind: "solid", color: background } };
  }
  if (!isBackgroundImage(background)) {
    return { fill: toInternalFill(background) };
  }

  const image = inspectImage(background.data);
  const rId = ctx.relGen.next();
  ctx.images.set(rId, { ...image, data: background.data });
  const { frame, crop } = resolveImageFit(
    slideFrame,
    image.size,
    background.fit,
    background.crop,
  );
  // A background fill always spans the slide, so `contain` letterboxing is
  // expressed as `a:fillRect` insets relative to the slide.
  return {
    image: {
      rId,
      crop,
      inset: {
        left: relativeInset(frame.x - slideFrame.x, slideFrame.w),
        top: relativeInset(frame.y - slideFrame.y, slideFrame.h),
        right: relativeInset(
          slideFrame.x + slideFrame.w - frame.x - frame.w,
          slideFrame.w,
        ),
        bottom: relativeInset(
          slideFrame.y + slideFrame.h - frame.y - frame.h,
          slideFrame.h,
        ),
      },
      alpha: background.alpha,
    },
  };
}

/** Generate a PPTX file from a JSX-authored presentation. */
export function generate(root: PptxElement): Uint8Array {
  const presentation: Presentation = normalizePresentation(root);
  const slideWidth = presentation.options.slideWidth ?? u.in(10);
  const slideHeight = presentation.options.slideHeight ?? u.in(7.5);
  const slideFrame = {
    x: 0 as Emu,
    y: 0 as Emu,
    w: slideWidth,
    h: slideHeight,
  };

  const slides = presentation.slides.map((slide) => {
    const contentFrame = insetFrame(slideFrame, slide.props.contentPadding);
    const sceneNodes = resolveSlideChildren(slide.children, contentFrame);
    const ctx = createSlideContext();
    const background = toSlideBackground(
      slide.props.background,
      slideFrame,
      ctx,
    );
    return {
      layoutRelId: ctx.layoutRelId,
      shapes: sceneNodes.map((node) => toInternalShape(node, ctx)),
      background,
      images: ctx.images.size > 0 ? ctx.images : undefined,
      charts: ctx.charts.size > 0 ? ctx.charts : undefined,
      hyperlinks: ctx.hyperlinks.size > 0 ? ctx.hyperlinks : undefined,
    };
  });

  return generatePptx({
    title: presentation.options.title,
    creator: presentation.options.creator,
    slideWidth,
    slideHeight,
    slides,
  });
}
