/**
 * Composable, function-based public API for generating PPTX presentations.
 *
 * Every concept is a typed function that returns an immutable value.
 * Functions compose naturally: `presentation(slide(textbox(...)))`.
 * No imperative mutation — the presentation is data built from functions.
 */

import type { Emu, HexColor, HundredthPoint } from "./types.ts";
import { inches } from "./types.ts";
import type { HyperlinkResource, ImageResource } from "./packaging.ts";
import { generatePptx } from "./packaging.ts";
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
import { RelationshipIdGenerator } from "./ooxml/relationships.ts";

// ---------------------------------------------------------------------------
// Text runs. ECMA-376 §21.1.2.3.8 (a:r).
// ---------------------------------------------------------------------------

/** A styled text run. */
export interface TextRun {
  readonly text: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly fontSize?: HundredthPoint;
  readonly fontColor?: HexColor;
  readonly fontFamily?: string;
  readonly hyperlink?: string;
}

/** Styling options applicable to a text run. */
export interface TextRunStyle {
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly fontSize?: HundredthPoint;
  readonly fontColor?: HexColor;
  readonly fontFamily?: string;
  readonly hyperlink?: string;
}

/** Create a plain text run. */
export function text(content: string, style?: TextRunStyle): TextRun {
  return { text: content, ...style };
}

/** Create a bold text run. */
export function bold(content: string, style?: TextRunStyle): TextRun {
  return { text: content, bold: true, ...style };
}

/** Create an italic text run. */
export function italic(content: string, style?: TextRunStyle): TextRun {
  return { text: content, italic: true, ...style };
}

/** Create a bold-italic text run. */
export function boldItalic(content: string, style?: TextRunStyle): TextRun {
  return { text: content, bold: true, italic: true, ...style };
}

/** Create an underlined text run. ECMA-376 §21.1.2.3.10 (a:rPr u attribute). */
export function underline(content: string, style?: TextRunStyle): TextRun {
  return { text: content, underline: true, ...style };
}

/** Create a hyperlinked text run. ECMA-376 §21.1.2.3.5 (a:hlinkClick). */
export function link(
  content: string,
  url: string,
  style?: TextRunStyle,
): TextRun {
  return { text: content, hyperlink: url, ...style };
}

// ---------------------------------------------------------------------------
// Paragraphs. ECMA-376 §21.1.2.2.6 (a:p).
// ---------------------------------------------------------------------------

/** Alignment options for paragraphs. */
export type Alignment = "left" | "center" | "right" | "justify";

/** Bullet specification for a paragraph. */
export type Bullet =
  | { readonly kind: "char"; readonly char: string }
  | { readonly kind: "autonum"; readonly type: string }
  | { readonly kind: "none" };

/** Paragraph spacing in EMUs. ECMA-376 §21.1.2.2.10. */
export interface Spacing {
  readonly before?: Emu;
  readonly after?: Emu;
}

/** Options for paragraph formatting. */
export interface ParagraphOptions {
  readonly level?: number;
  readonly alignment?: Alignment;
  readonly bullet?: Bullet;
  readonly spacing?: Spacing;
}

/** A text paragraph. */
export interface Paragraph {
  readonly runs: ReadonlyArray<TextRun>;
  readonly level?: number;
  readonly alignment?: Alignment;
  readonly bullet?: Bullet;
  readonly spacing?: Spacing;
}

/**
 * Create a paragraph from a string, a single run, or an array of runs.
 *
 * @example
 * ```ts
 * paragraph("Simple text")
 * paragraph("Centered", { alignment: "center" })
 * paragraph([bold("Hello"), text(" world")])
 * paragraph([bold("Title")], { alignment: "center", level: 0 })
 * ```
 */
export function paragraph(
  content: string | TextRun | ReadonlyArray<TextRun>,
  options?: ParagraphOptions,
): Paragraph {
  const runs = typeof content === "string"
    ? [{ text: content }]
    : Array.isArray(content)
    ? content
    : [content];
  return { runs, ...options };
}

/**
 * Create a bullet character specification.
 *
 * @example
 * ```ts
 * paragraph("Item", { bullet: bulletChar("•") })
 * ```
 */
export function bulletChar(char: string): Bullet {
  return { kind: "char", char };
}

/**
 * Create an auto-numbered bullet specification.
 *
 * @example
 * ```ts
 * paragraph("Step 1", { bullet: bulletAutoNum("arabicPeriod") })
 * ```
 */
export function bulletAutoNum(type: string): Bullet {
  return { kind: "autonum", type };
}

/**
 * Create a "no bullet" specification to suppress inherited bullets.
 *
 * @example
 * ```ts
 * paragraph("No bullet", { bullet: bulletNone() })
 * ```
 */
export function bulletNone(): Bullet {
  return { kind: "none" };
}

// ---------------------------------------------------------------------------
// Fill and line styling. ECMA-376 §20.1.8 (fill), §20.1.2.2.24 (a:ln).
// ---------------------------------------------------------------------------

/** Fill specification for shapes and cells. */
export type Fill =
  | {
    readonly kind: "solid";
    readonly color: HexColor;
    readonly alpha?: number;
  }
  | { readonly kind: "none" };

/** Create a solid color fill. ECMA-376 §20.1.8.54 (a:solidFill). */
export function solidFill(color: HexColor, alpha?: number): Fill {
  return { kind: "solid", color, alpha };
}

/** Create a "no fill" specification. ECMA-376 §20.1.8.44 (a:noFill). */
export function noFill(): Fill {
  return { kind: "none" };
}

/** Line (outline) properties for shapes. */
export interface LineStyle {
  /** Line width in EMUs. */
  readonly width?: Emu;
  /** Line fill (solid color or none). */
  readonly fill?: Fill;
}

/** Create line style properties. ECMA-376 §20.1.2.2.24 (a:ln). */
export function lineStyle(options: LineStyle): LineStyle {
  return options;
}

// ---------------------------------------------------------------------------
// Geometry bounds. ECMA-376 §20.1.7.5 (a:xfrm).
// ---------------------------------------------------------------------------

/** Position and size for a shape on a slide. All values in EMUs. */
export interface Bounds {
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
}

/**
 * Create shape bounds (position + size) in EMUs.
 *
 * @example
 * ```ts
 * bounds(inches(1), inches(2), inches(8), inches(1))
 * ```
 */
export function bounds(x: Emu, y: Emu, cx: Emu, cy: Emu): Bounds {
  return { x, y, cx, cy };
}

// ---------------------------------------------------------------------------
// Vertical alignment. ECMA-376 §21.1.2.1.1 (a:bodyPr anchor).
// ---------------------------------------------------------------------------

/** Vertical alignment for text within a shape. */
export type VerticalAlignment = "top" | "middle" | "bottom";

// ---------------------------------------------------------------------------
// Shape elements.
// ---------------------------------------------------------------------------

/** Styling options for a text box. */
export interface TextBoxOptions {
  readonly fill?: Fill;
  readonly line?: LineStyle;
  readonly verticalAlignment?: VerticalAlignment;
}

/** A text box element. ECMA-376 §19.3.1.43 (sp, txBox). */
export interface TextBox {
  readonly kind: "textbox";
  readonly bounds: Bounds;
  readonly paragraphs: ReadonlyArray<Paragraph>;
  readonly fill?: Fill;
  readonly line?: LineStyle;
  readonly verticalAlignment?: VerticalAlignment;
}

/** Styling options for a preset shape. */
export interface ShapeOptions {
  readonly fill?: Fill;
  readonly line?: LineStyle;
  readonly verticalAlignment?: VerticalAlignment;
}

/** A preset geometry shape. ECMA-376 §20.1.9.18 (a:prstGeom). */
export interface Shape {
  readonly kind: "shape";
  readonly bounds: Bounds;
  readonly preset: string;
  readonly paragraphs: ReadonlyArray<Paragraph>;
  readonly fill?: Fill;
  readonly line?: LineStyle;
  readonly verticalAlignment?: VerticalAlignment;
}

/** An image element. ECMA-376 §19.3.1.37 (p:pic). */
export interface Image {
  readonly kind: "image";
  readonly bounds: Bounds;
  readonly data: Uint8Array;
  readonly contentType: string;
  readonly description?: string;
}

/** A table cell. ECMA-376 §21.1.3.15 (a:tc). */
export interface TableCell {
  readonly paragraphs: ReadonlyArray<Paragraph>;
  readonly fill?: Fill;
}

/** A table row. ECMA-376 §21.1.3.16 (a:tr). */
export interface TableRow {
  readonly height: Emu;
  readonly cells: ReadonlyArray<TableCell>;
}

/** A table element. ECMA-376 §19.3.1.22 (p:graphicFrame). */
export interface Table {
  readonly kind: "table";
  readonly bounds: Bounds;
  readonly columns: ReadonlyArray<Emu>;
  readonly rows: ReadonlyArray<TableRow>;
}

/** Union of all slide element types. */
export type SlideElement = TextBox | Shape | Image | Table;

// ---------------------------------------------------------------------------
// Builder functions for shapes.
// ---------------------------------------------------------------------------

/**
 * Create a text box with paragraphs.
 *
 * @example
 * ```ts
 * textbox(bounds(inches(1), inches(1), inches(8), inches(1)), [
 *   paragraph("Hello, World!"),
 * ])
 * textbox(bounds(inches(1), inches(1), inches(8), inches(1)), [
 *   paragraph("Styled"),
 * ], { fill: solidFill(hexColor("FFFF00")) })
 * ```
 */
export function textbox(
  b: Bounds,
  paragraphs: ReadonlyArray<Paragraph>,
  options?: TextBoxOptions,
): TextBox {
  return { kind: "textbox", bounds: b, paragraphs, ...options };
}

/**
 * Create a preset geometry shape with optional text.
 *
 * Preset names follow ECMA-376 §20.1.10.56 (ST_ShapeType):
 * "rect", "ellipse", "roundRect", "triangle", "diamond", etc.
 *
 * @example
 * ```ts
 * shape("rect", bounds(inches(1), inches(1), inches(4), inches(2)))
 * shape("ellipse", bounds(inches(1), inches(1), inches(3), inches(3)), [
 *   paragraph("Circle text", { alignment: "center" }),
 * ], { fill: solidFill(hexColor("FF0000")) })
 * ```
 */
export function shape(
  preset: string,
  b: Bounds,
  paragraphs?: ReadonlyArray<Paragraph>,
  options?: ShapeOptions,
): Shape {
  return {
    kind: "shape",
    bounds: b,
    preset,
    paragraphs: paragraphs ?? [],
    ...options,
  };
}

/**
 * Create an image element from raw bytes.
 *
 * @example
 * ```ts
 * const pngData = Deno.readFileSync("photo.png");
 * image(bounds(inches(1), inches(1), inches(4), inches(3)), pngData, "image/png")
 * ```
 */
export function image(
  b: Bounds,
  data: Uint8Array,
  contentType: string,
  description?: string,
): Image {
  return { kind: "image", bounds: b, data, contentType, description };
}

/**
 * Create a table cell with text content.
 *
 * @example
 * ```ts
 * cell([paragraph("Header")], { fill: solidFill(hexColor("4472C4")) })
 * ```
 */
export function cell(
  paragraphs: ReadonlyArray<Paragraph>,
  options?: { fill?: Fill },
): TableCell {
  return { paragraphs, ...options };
}

/**
 * Create a table row.
 *
 * @example
 * ```ts
 * row(inches(0.5), [cell([paragraph("A")]), cell([paragraph("B")])])
 * ```
 */
export function row(height: Emu, cells: ReadonlyArray<TableCell>): TableRow {
  return { height, cells };
}

/**
 * Create a table element.
 *
 * @example
 * ```ts
 * table(
 *   bounds(inches(1), inches(1), inches(6), inches(3)),
 *   [inches(3), inches(3)],
 *   [
 *     row(inches(0.5), [cell([paragraph("A")]), cell([paragraph("B")])]),
 *     row(inches(0.5), [cell([paragraph("1")]), cell([paragraph("2")])]),
 *   ],
 * )
 * ```
 */
export function table(
  b: Bounds,
  columns: ReadonlyArray<Emu>,
  rows: ReadonlyArray<TableRow>,
): Table {
  return { kind: "table", bounds: b, columns, rows };
}

// ---------------------------------------------------------------------------
// Slides. ECMA-376 §13.3.8.
// ---------------------------------------------------------------------------

/** A slide containing elements. */
export interface Slide {
  readonly elements: ReadonlyArray<SlideElement>;
}

/**
 * Create a slide from its elements.
 *
 * @example
 * ```ts
 * slide(
 *   textbox(bounds(inches(1), inches(1), inches(8), inches(1)), [
 *     paragraph("Title"),
 *   ]),
 *   shape("rect", bounds(inches(2), inches(3), inches(4), inches(2))),
 * )
 * ```
 */
export function slide(...elements: ReadonlyArray<SlideElement>): Slide {
  return { elements };
}

// ---------------------------------------------------------------------------
// Presentation. ECMA-376 §13.3.6.
// ---------------------------------------------------------------------------

/** Options for the presentation. */
export interface PresentationOptions {
  readonly title?: string;
  readonly creator?: string;
  readonly slideWidth?: Emu;
  readonly slideHeight?: Emu;
}

/** A complete presentation. */
export interface Presentation {
  readonly options: PresentationOptions;
  readonly slides: ReadonlyArray<Slide>;
}

/**
 * Create a presentation from slides.
 *
 * @example
 * ```ts
 * presentation(
 *   slide(textbox(bounds(inches(1), inches(1), inches(8), inches(1)), [
 *     paragraph("Hello"),
 *   ])),
 * )
 *
 * presentation(
 *   { title: "My Deck", creator: "Author" },
 *   slide(textbox(bounds(inches(1), inches(1), inches(8), inches(1)), [
 *     paragraph("With options"),
 *   ])),
 * )
 * ```
 */
export function presentation(
  first: Slide | PresentationOptions,
  ...rest: ReadonlyArray<Slide>
): Presentation {
  if ("elements" in first) {
    return { options: {}, slides: [first, ...rest] };
  }
  return { options: first, slides: rest };
}

// ---------------------------------------------------------------------------
// Generation — conversion from public API types to internal types.
// ---------------------------------------------------------------------------

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

/** Context for a slide being assembled — tracks resource relationships. */
interface SlideContext {
  readonly relGen: RelationshipIdGenerator;
  readonly images: Map<string, ImageResource>;
  readonly hyperlinks: Map<string, HyperlinkResource>;
}

function createSlideContext(): SlideContext {
  // Start at rId2 because rId1 is the slide layout relationship
  return {
    relGen: new RelationshipIdGenerator(2),
    images: new Map(),
    hyperlinks: new Map(),
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
  p: Paragraph,
  ctx: SlideContext,
): InternalParagraph {
  return {
    runs: p.runs.map((r) => toInternalRun(r, ctx)),
    level: p.level,
    alignment: p.alignment ? ALIGNMENT_MAP[p.alignment] : undefined,
    bullet: p.bullet,
    spacing: p.spacing,
  };
}

function toInternalShape(
  element: SlideElement,
  ctx: SlideContext,
): SlideShape {
  switch (element.kind) {
    case "textbox":
      return {
        kind: "textbox",
        x: element.bounds.x,
        y: element.bounds.y,
        cx: element.bounds.cx,
        cy: element.bounds.cy,
        paragraphs: element.paragraphs.map((p) => toInternalParagraph(p, ctx)),
        fill: element.fill ? toInternalFill(element.fill) : undefined,
        line: element.line ? toInternalLine(element.line) : undefined,
        verticalAlignment: element.verticalAlignment
          ? VALIGN_MAP[element.verticalAlignment]
          : undefined,
      };
    case "shape":
      return {
        kind: "preset",
        x: element.bounds.x,
        y: element.bounds.y,
        cx: element.bounds.cx,
        cy: element.bounds.cy,
        preset: element.preset,
        paragraphs: element.paragraphs.map((p) => toInternalParagraph(p, ctx)),
        fill: element.fill ? toInternalFill(element.fill) : undefined,
        line: element.line ? toInternalLine(element.line) : undefined,
        verticalAlignment: element.verticalAlignment
          ? VALIGN_MAP[element.verticalAlignment]
          : undefined,
      };
    case "image": {
      const rId = ctx.relGen.next();
      const ext = mimeToExtension(element.contentType);
      ctx.images.set(rId, {
        data: element.data,
        extension: ext,
        contentType: element.contentType,
      });
      return {
        kind: "picture",
        x: element.bounds.x,
        y: element.bounds.y,
        cx: element.bounds.cx,
        cy: element.bounds.cy,
        rId,
        description: element.description,
      } satisfies PictureShape;
    }
    case "table":
      return {
        kind: "table",
        x: element.bounds.x,
        y: element.bounds.y,
        cx: element.bounds.cx,
        cy: element.bounds.cy,
        columns: element.columns,
        rows: element.rows.map((r) => toInternalTableRow(r, ctx)),
      } satisfies InternalTableShape;
  }
}

function toInternalTableRow(
  r: TableRow,
  ctx: SlideContext,
): InternalTableRow {
  return {
    height: r.height,
    cells: r.cells.map((c) => toInternalTableCell(c, ctx)),
  };
}

function toInternalTableCell(
  c: TableCell,
  ctx: SlideContext,
): InternalTableCell {
  return {
    paragraphs: c.paragraphs.map((p) => toInternalParagraph(p, ctx)),
    fill: c.fill ? toInternalFill(c.fill) : undefined,
  };
}

/** Map MIME type to file extension. */
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

/**
 * Generate a PPTX file from a presentation.
 *
 * Returns the file contents as a Uint8Array (ZIP/PPTX binary).
 *
 * @example
 * ```ts
 * const pptx = generate(presentation(
 *   slide(textbox(bounds(inches(1), inches(1), inches(8), inches(1)), [
 *     paragraph("Hello, World!"),
 *   ])),
 * ));
 * Deno.writeFileSync("output.pptx", pptx);
 * ```
 */
export function generate(pres: Presentation): Uint8Array {
  const slideWidth = pres.options.slideWidth ?? inches(10);
  const slideHeight = pres.options.slideHeight ?? inches(7.5);

  const packageSlides = pres.slides.map((s) => {
    const ctx = createSlideContext();
    const shapes = s.elements.map((el) => toInternalShape(el, ctx));
    return {
      shapes,
      images: ctx.images.size > 0 ? ctx.images : undefined,
      hyperlinks: ctx.hyperlinks.size > 0 ? ctx.hyperlinks : undefined,
    };
  });

  return generatePptx({
    title: pres.options.title,
    creator: pres.options.creator,
    slideWidth,
    slideHeight,
    slides: packageSlides,
  });
}
