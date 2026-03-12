/**
 * Public generation pipeline: presentation -> layout -> scene -> OOXML package.
 */

import { st } from "./st.ts";
import type { Emu } from "./types.ts";
import type { Alignment, Fill, LineStyle, VerticalAlignment } from "./style.ts";
import type { Paragraph, TextRun } from "./text.ts";
import type { Presentation } from "./document.ts";
import { resolveSlideChildren } from "./layout.ts";
import type { SceneNode } from "./scene.ts";
import type { TableCell, TableRow } from "./nodes.ts";
import type { HyperlinkResource, ImageResource } from "./packaging.ts";
import { generatePptx } from "./packaging.ts";
import { RelationshipIdGenerator } from "./ooxml/relationships.ts";
import type {
  Fill as InternalFill,
  LineProperties as InternalLine,
  PictureShape,
  SlideShape,
  TableCell as InternalTableCell,
  TableRow as InternalTableRow,
  TableShape as InternalTableShape,
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

/** Context for assembling a slide's resources and relationships. */
interface SlideContext {
  readonly relGen: RelationshipIdGenerator;
  readonly images: Map<string, ImageResource>;
  readonly hyperlinks: Map<string, HyperlinkResource>;
}

function createSlideContext(): SlideContext {
  return {
    relGen: new RelationshipIdGenerator(2),
    images: new Map(),
    hyperlinks: new Map(),
  };
}

function toInternalFill(fill: Fill): InternalFill {
  switch (fill.kind) {
    case "solid":
      return { kind: "solid", color: fill.color, alpha: fill.alpha };
    case "none":
      return { kind: "none" };
  }
}

function toInternalLine(line: LineStyle): InternalLine {
  return {
    width: line.width,
    fill: line.fill ? toInternalFill(line.fill) : undefined,
  };
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
    bold: run.bold,
    italic: run.italic,
    underline: run.underline,
    fontSize: run.fontSize,
    fontColor: run.fontColor,
    fontFamily: run.fontFamily,
    hyperlink: hyperlinkInfo,
  };
}

function toInternalParagraph(
  paragraph: Paragraph,
  ctx: SlideContext,
): InternalParagraph {
  return {
    runs: paragraph.runs.map((run) => toInternalRun(run, ctx)),
    level: paragraph.level,
    alignment: paragraph.align ? ALIGNMENT_MAP[paragraph.align] : undefined,
    bullet: paragraph.bullet,
    spacing: paragraph.spacing,
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
    fill: cell.fill ? toInternalFill(cell.fill) : undefined,
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
        fill: node.fill ? toInternalFill(node.fill) : undefined,
        line: node.line ? toInternalLine(node.line) : undefined,
        verticalAlignment: node.verticalAlign
          ? VALIGN_MAP[node.verticalAlign]
          : undefined,
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
        fill: node.fill ? toInternalFill(node.fill) : undefined,
        line: node.line ? toInternalLine(node.line) : undefined,
        verticalAlignment: node.verticalAlign
          ? VALIGN_MAP[node.verticalAlign]
          : undefined,
      };
    case "image": {
      const rId = ctx.relGen.next();
      ctx.images.set(rId, {
        data: node.data,
        extension: mimeToExtension(node.contentType),
        contentType: node.contentType,
      });
      return {
        kind: "picture",
        x: node.x,
        y: node.y,
        cx: node.w,
        cy: node.h,
        rId,
        description: node.description,
      } satisfies PictureShape;
    }
    case "table":
      return {
        kind: "table",
        x: node.x,
        y: node.y,
        cx: node.w,
        cy: node.h,
        columns: node.cols,
        rows: node.rows.map((row) => toInternalTableRow(row, ctx)),
      } satisfies InternalTableShape;
  }
}

function mimeToExtension(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpeg";
    case "image/gif":
      return "gif";
    case "image/bmp":
      return "bmp";
    case "image/tiff":
      return "tiff";
    case "image/svg+xml":
      return "svg";
    default:
      return mime.split("/")[1] ?? "bin";
  }
}

/** Generate a PPTX file from the public presentation model. */
export function generate(presentation: Presentation): Uint8Array {
  const slideWidth = presentation.options.slideWidth ?? st.in(10);
  const slideHeight = presentation.options.slideHeight ?? st.in(7.5);
  const slideFrame = {
    x: 0 as Emu,
    y: 0 as Emu,
    w: slideWidth,
    h: slideHeight,
  };

  const slides = presentation.slides.map((slide) => {
    const sceneNodes = resolveSlideChildren(slide.children, slideFrame);
    const ctx = createSlideContext();
    return {
      shapes: sceneNodes.map((node) => toInternalShape(node, ctx)),
      images: ctx.images.size > 0 ? ctx.images : undefined,
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
