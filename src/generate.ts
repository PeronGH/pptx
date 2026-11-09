/**
 * Public generation pipeline: presentation -> layout -> scene -> OOXML package.
 */

import { emu, u } from "./st.ts";
import type { Emu, Percentage } from "./types.ts";
import type { BoxStyle, CellStyle, VerticalAlignment } from "./style.ts";
import type { Paragraph, TextRun } from "./text.ts";
import type { Background, BackgroundImageProps } from "./document.ts";
import { inspectImage, resolveImageFit } from "./image.ts";
import { insetFrame, resolveSlideChildren } from "./layout.ts";
import { placeTableCells } from "./table_grid.ts";
import { normalizePresentation } from "./normalize.ts";
import type { PptxElement, SlideSize } from "./public_types.ts";
import type { Frame, SceneNode } from "./scene.ts";
import type { TableCell } from "./nodes.ts";
import type {
  ChartResource,
  HyperlinkResource,
  ImageResource,
  PackageSlide,
} from "./packaging.ts";
import { generatePptx } from "./packaging.ts";
import { RelationshipIdGenerator } from "./ooxml/relationships.ts";
import type {
  Insets,
  SlideBackground,
  SlideShape,
  TableCell as OoxmlTableCell,
  TextParagraph,
  TextRun as OoxmlTextRun,
  VerticalAlignment as OoxmlVerticalAlignment,
} from "./ooxml/slide.ts";

const ALIGNMENT = {
  left: "l",
  center: "ctr",
  right: "r",
  justify: "just",
} as const;

const VERTICAL_ALIGNMENT: Record<VerticalAlignment, OoxmlVerticalAlignment> = {
  top: "t",
  middle: "ctr",
  bottom: "b",
};

/** Relationship IDs and resources collected while writing one slide. */
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

function toInsets(padding: Emu | Insets | undefined): Insets | undefined {
  if (typeof padding !== "number") return padding;
  return { top: padding, right: padding, bottom: padding, left: padding };
}

function toTextRun(run: TextRun, ctx: SlideContext): OoxmlTextRun {
  let hyperlink: OoxmlTextRun["hyperlink"];
  if (run.hyperlink) {
    const rId = ctx.relGen.next();
    // Relationship targets are xsd:anyURI (ECMA-376 Part 2 §6.5.3.4). Parsing
    // rejects non-URLs and the serialized form percent-encodes spaces and
    // non-ASCII characters.
    ctx.hyperlinks.set(rId, { url: new URL(run.hyperlink).href });
    hyperlink = { rId };
  }
  return { ...run.style, text: run.text, hyperlink };
}

function toTextParagraph(
  paragraph: Paragraph,
  ctx: SlideContext,
): TextParagraph {
  const style = paragraph.style;
  return {
    runs: paragraph.runs.map((run) => toTextRun(run, ctx)),
    level: style?.level,
    alignment: style?.align && ALIGNMENT[style.align],
    bullet: style?.bullet,
    spacing: style?.spacing,
  };
}

function boxProperties(style: BoxStyle | CellStyle | undefined) {
  return {
    fill: style?.fill,
    line: style?.line,
    padding: toInsets(style?.padding),
    verticalAlignment: style?.verticalAlign &&
      VERTICAL_ALIGNMENT[style.verticalAlign],
  };
}

function toTableCell(cell: TableCell, ctx: SlideContext): OoxmlTableCell {
  return {
    ...boxProperties(cell.style),
    paragraphs: cell.paragraphs.map((paragraph) =>
      toTextParagraph(paragraph, ctx)
    ),
  };
}

/** Scale column widths so the grid spans the table frame exactly. */
function fitTableColumns(
  tableWidth: Emu,
  columns: ReadonlyArray<Emu>,
): ReadonlyArray<Emu> {
  const total = columns.reduce((sum, width) => sum + width, 0);
  if (total === tableWidth) return columns;
  const fitted = columns.map((width) =>
    total > 0
      ? emu(width * tableWidth / total)
      : emu(Math.floor(tableWidth / columns.length))
  );
  const diff = tableWidth - fitted.reduce((sum, width) => sum + width, 0);
  fitted[fitted.length - 1] = emu(fitted[fitted.length - 1]! + diff);
  return fitted;
}

function toSlideShape(node: SceneNode, ctx: SlideContext): SlideShape {
  const placement = {
    name: node.name,
    x: node.x,
    y: node.y,
    cx: node.w,
    cy: node.h,
  };
  switch (node.kind) {
    case "textbox":
    case "shape": {
      const text = {
        ...placement,
        ...boxProperties(node.style),
        paragraphs: node.paragraphs.map((paragraph) =>
          toTextParagraph(paragraph, ctx)
        ),
        fit: node.style?.fit,
        shadow: node.style?.shadow,
      };
      return node.kind === "textbox"
        ? { ...text, kind: "textbox", placeholder: node.placeholder }
        : { ...text, kind: "preset", preset: node.preset };
    }
    case "image": {
      const image = inspectImage(node.data);
      const rId = ctx.relGen.next();
      ctx.images.set(rId, { ...image, data: node.data });
      const { frame, crop } = resolveImageFit(
        node,
        image.size,
        node.fit,
        node.crop,
      );
      return {
        kind: "picture",
        name: node.name,
        x: frame.x,
        y: frame.y,
        cx: frame.w,
        cy: frame.h,
        rId,
        description: node.description,
        crop,
        alpha: node.alpha,
      };
    }
    case "table":
      return {
        ...placement,
        kind: "table",
        columns: fitTableColumns(node.w, node.cols),
        rows: placeTableCells(
          node.rows.map((row) => row.cells),
          node.cols.length,
        ).map((slots, index) => ({
          height: node.rows[index]!.height,
          cells: slots.map((slot): OoxmlTableCell =>
            slot.kind === "anchor"
              ? {
                ...toTableCell(slot.cell, ctx),
                gridSpan: slot.colSpan,
                rowSpan: slot.rowSpan,
              }
              // Covered slots repeat the anchor's fill and borders so the
              // merged area draws consistently in every consumer.
              : {
                ...boxProperties(slot.anchor.style),
                paragraphs: [],
                hMerge: slot.hMerge,
                vMerge: slot.vMerge,
                gridSpan: slot.colSpan,
              }
          ),
        })),
      };
    case "chart": {
      const rId = ctx.relGen.next();
      ctx.charts.set(rId, { definition: node });
      return { ...placement, kind: "chart", rId };
    }
  }
}

function isBackgroundImage(bg: Background): bg is BackgroundImageProps {
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
  if (!isBackgroundImage(background)) return { fill: background };

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

function resolveSlideSize(size: SlideSize = "16:9"): {
  readonly width: Emu;
  readonly height: Emu;
} {
  switch (size) {
    case "16:9":
      return { width: emu(12192000), height: emu(6858000) };
    case "4:3":
      return { width: u.in(10), height: u.in(7.5) };
    default:
      return size;
  }
}

/** Generate a PPTX file from a JSX-authored presentation. */
export function generate(root: PptxElement): Uint8Array {
  const presentation = normalizePresentation(root);
  const { width: slideWidth, height: slideHeight } = resolveSlideSize(
    presentation.options.size,
  );
  const slideFrame: Frame = {
    x: emu(0),
    y: emu(0),
    w: slideWidth,
    h: slideHeight,
  };

  const slides = presentation.slides.map((slide): PackageSlide => {
    const contentFrame = insetFrame(slideFrame, slide.props.contentPadding);
    const sceneNodes = resolveSlideChildren(slide.children, contentFrame);
    const titles = sceneNodes.filter((node) =>
      node.kind === "textbox" && node.placeholder === "title"
    );
    if (titles.length > 1) {
      // Titles can sit anywhere in the layout tree, so only the resolved
      // slide can be counted. A slide has a single title placeholder.
      throw new Error(
        `A slide can have at most one <Title>, found ${titles.length}`,
      );
    }
    const ctx = createSlideContext();
    const background = toSlideBackground(
      slide.props.background,
      slideFrame,
      ctx,
    );
    return {
      layoutRelId: ctx.layoutRelId,
      shapes: sceneNodes.map((node) => toSlideShape(node, ctx)),
      background,
      images: ctx.images,
      charts: ctx.charts,
      hyperlinks: ctx.hyperlinks,
      notes: slide.props.notes === undefined
        ? undefined
        : { relId: ctx.relGen.next(), text: slide.props.notes },
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
