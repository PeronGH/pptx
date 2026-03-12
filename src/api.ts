/**
 * VanJS-inspired declarative API for generating PPTX presentations.
 *
 * Every concept is a typed function. Props-first, children as varargs.
 * Strings auto-coerce to text runs or paragraphs where appropriate.
 *
 * @example
 * ```ts
 * presentation(
 *   slide(
 *     textbox({ x: inches(1), y: inches(1), w: inches(8), h: inches(1) },
 *       p({ align: "center" }, bold("Hello"), ", World!"),
 *     ),
 *   ),
 * )
 * ```
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
// Coercion helpers (internal).
// ---------------------------------------------------------------------------

/** Content that auto-coerces to a TextRun. */
type TextContent = string | TextRun;

/** Content that auto-coerces to a Paragraph. */
type ParagraphContent = string | Paragraph;

function toRun(c: TextContent): TextRun {
  return typeof c === "string" ? { text: c } : c;
}

function toParagraph(c: ParagraphContent): Paragraph {
  return typeof c === "string" ? { runs: [{ text: c }] } : c;
}

function isParagraphProps(
  v: TextContent | ParagraphProps,
): v is ParagraphProps {
  return typeof v !== "string" && !("text" in v);
}

function isCellProps(
  v: ParagraphContent | CellProps,
): v is CellProps {
  return typeof v !== "string" && !("runs" in v);
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
export interface ParagraphProps {
  readonly level?: number;
  readonly align?: Alignment;
  readonly bullet?: Bullet;
  readonly spacing?: Spacing;
}

/** A text paragraph. */
export interface Paragraph {
  readonly runs: ReadonlyArray<TextRun>;
  readonly level?: number;
  readonly align?: Alignment;
  readonly bullet?: Bullet;
  readonly spacing?: Spacing;
}

/**
 * Create a paragraph. VanJS-style: first arg is optionally props, rest are runs.
 * Strings auto-coerce to plain text runs.
 *
 * @example
 * ```ts
 * p("Simple text")
 * p({ align: "center" }, "Centered")
 * p(bold("Hello"), ", World!")
 * p({ align: "right", level: 1 }, bold("Title"))
 * ```
 */
export function p(
  first?: ParagraphProps | TextContent,
  ...rest: ReadonlyArray<TextContent>
): Paragraph {
  if (first === undefined) return { runs: [] };
  if (isParagraphProps(first)) {
    return { runs: rest.map(toRun), ...first };
  }
  return { runs: [toRun(first), ...rest.map(toRun)] };
}

/**
 * Create a bullet character specification.
 *
 * @example
 * ```ts
 * p({ bullet: bulletChar("•") }, "Item")
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
 * p({ bullet: bulletAutoNum("arabicPeriod") }, "Step 1")
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
 * p({ bullet: bulletNone() }, "No bullet")
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
// Vertical alignment. ECMA-376 §21.1.2.1.1 (a:bodyPr anchor).
// ---------------------------------------------------------------------------

/** Vertical alignment for text within a shape. */
export type VerticalAlignment = "top" | "middle" | "bottom";

// ---------------------------------------------------------------------------
// Positioned props (shared by all slide elements).
// ---------------------------------------------------------------------------

/** Position and size properties. All values in EMUs. */
interface Positioned {
  readonly x: Emu;
  readonly y: Emu;
  readonly w: Emu;
  readonly h: Emu;
}

// ---------------------------------------------------------------------------
// Shape elements.
// ---------------------------------------------------------------------------

/** Props for a text box. */
export type TextBoxProps = Positioned & {
  readonly fill?: Fill;
  readonly line?: LineStyle;
  readonly verticalAlign?: VerticalAlignment;
};

/** A text box element. ECMA-376 §19.3.1.43 (sp, txBox). */
export interface TextBox {
  readonly kind: "textbox";
  readonly x: Emu;
  readonly y: Emu;
  readonly w: Emu;
  readonly h: Emu;
  readonly paragraphs: ReadonlyArray<Paragraph>;
  readonly fill?: Fill;
  readonly line?: LineStyle;
  readonly verticalAlign?: VerticalAlignment;
}

/** Props for a preset shape. */
export type ShapeProps = Positioned & {
  readonly fill?: Fill;
  readonly line?: LineStyle;
  readonly verticalAlign?: VerticalAlignment;
};

/** A preset geometry shape. ECMA-376 §20.1.9.18 (a:prstGeom). */
export interface Shape {
  readonly kind: "shape";
  readonly x: Emu;
  readonly y: Emu;
  readonly w: Emu;
  readonly h: Emu;
  readonly preset: string;
  readonly paragraphs: ReadonlyArray<Paragraph>;
  readonly fill?: Fill;
  readonly line?: LineStyle;
  readonly verticalAlign?: VerticalAlignment;
}

/** Props for an image element. */
export type ImageProps = Positioned & {
  readonly data: Uint8Array;
  readonly contentType: string;
  readonly description?: string;
};

/** An image element. ECMA-376 §19.3.1.37 (p:pic). */
export interface Image {
  readonly kind: "image";
  readonly x: Emu;
  readonly y: Emu;
  readonly w: Emu;
  readonly h: Emu;
  readonly data: Uint8Array;
  readonly contentType: string;
  readonly description?: string;
}

/** Props for a table cell. */
export interface CellProps {
  readonly fill?: Fill;
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

/** Props for a table element. */
export type TableProps = Positioned & {
  readonly cols: ReadonlyArray<Emu>;
};

/** A table element. ECMA-376 §19.3.1.22 (p:graphicFrame). */
export interface Table {
  readonly kind: "table";
  readonly x: Emu;
  readonly y: Emu;
  readonly w: Emu;
  readonly h: Emu;
  readonly cols: ReadonlyArray<Emu>;
  readonly rows: ReadonlyArray<TableRow>;
}

/** Union of all slide element types. */
export type SlideElement = TextBox | Shape | Image | Table;

// ---------------------------------------------------------------------------
// Builder functions for shapes.
// ---------------------------------------------------------------------------

/**
 * Create a text box. Strings auto-coerce to paragraphs.
 *
 * @example
 * ```ts
 * textbox({ x: inches(1), y: inches(1), w: inches(8), h: inches(1) },
 *   "Simple text",
 * )
 * textbox({ x: inches(1), y: inches(1), w: inches(8), h: inches(2), fill: solidFill(hexColor("FFFF00")) },
 *   p({ align: "center" }, bold("Title")),
 *   p("Body text"),
 * )
 * ```
 */
export function textbox(
  props: TextBoxProps,
  ...children: ReadonlyArray<ParagraphContent>
): TextBox {
  return {
    kind: "textbox",
    x: props.x,
    y: props.y,
    w: props.w,
    h: props.h,
    paragraphs: children.map(toParagraph),
    fill: props.fill,
    line: props.line,
    verticalAlign: props.verticalAlign,
  };
}

/**
 * Create a preset geometry shape. Strings auto-coerce to paragraphs.
 *
 * Preset names follow ECMA-376 §20.1.10.56 (ST_ShapeType):
 * "rect", "ellipse", "roundRect", "triangle", "diamond", etc.
 *
 * @example
 * ```ts
 * shape("rect", { x: inches(1), y: inches(1), w: inches(4), h: inches(2) })
 * shape("ellipse", { x: inches(1), y: inches(1), w: inches(3), h: inches(3), fill: solidFill(hexColor("FF0000")) },
 *   p({ align: "center" }, "Circle text"),
 * )
 * ```
 */
export function shape(
  preset: string,
  props: ShapeProps,
  ...children: ReadonlyArray<ParagraphContent>
): Shape {
  return {
    kind: "shape",
    x: props.x,
    y: props.y,
    w: props.w,
    h: props.h,
    preset,
    paragraphs: children.map(toParagraph),
    fill: props.fill,
    line: props.line,
    verticalAlign: props.verticalAlign,
  };
}

/**
 * Create an image element from raw bytes.
 *
 * @example
 * ```ts
 * const pngData = Deno.readFileSync("photo.png");
 * image({ x: inches(1), y: inches(1), w: inches(4), h: inches(3), data: pngData, contentType: "image/png" })
 * ```
 */
export function image(props: ImageProps): Image {
  return {
    kind: "image",
    x: props.x,
    y: props.y,
    w: props.w,
    h: props.h,
    data: props.data,
    contentType: props.contentType,
    description: props.description,
  };
}

/**
 * Create a table cell. VanJS-style: first arg optionally props, rest are paragraphs.
 * Strings auto-coerce to paragraphs.
 *
 * @example
 * ```ts
 * td("Simple text")
 * td({ fill: solidFill(hexColor("4472C4")) }, p(bold("Header")))
 * ```
 */
export function td(
  first?: CellProps | ParagraphContent,
  ...rest: ReadonlyArray<ParagraphContent>
): TableCell {
  if (first === undefined) return { paragraphs: [{ runs: [] }] };
  if (isCellProps(first)) {
    const paragraphs = rest.length === 0
      ? [{ runs: [] } as Paragraph]
      : rest.map(toParagraph);
    return { paragraphs, ...first };
  }
  return { paragraphs: [toParagraph(first), ...rest.map(toParagraph)] };
}

/**
 * Create a table row.
 *
 * @example
 * ```ts
 * tr(inches(0.5), td("A"), td("B"))
 * ```
 */
export function tr(
  height: Emu,
  ...cells: ReadonlyArray<TableCell>
): TableRow {
  return { height, cells };
}

/**
 * Create a table element.
 *
 * @example
 * ```ts
 * table({ x: inches(1), y: inches(1), w: inches(6), h: inches(3), cols: [inches(3), inches(3)] },
 *   tr(inches(0.5), td("A"), td("B")),
 *   tr(inches(0.5), td("1"), td("2")),
 * )
 * ```
 */
export function table(
  props: TableProps,
  ...rows: ReadonlyArray<TableRow>
): Table {
  return {
    kind: "table",
    x: props.x,
    y: props.y,
    w: props.w,
    h: props.h,
    cols: props.cols,
    rows,
  };
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
 *   textbox({ x: inches(1), y: inches(1), w: inches(8), h: inches(1) }, "Title"),
 *   shape("rect", { x: inches(2), y: inches(3), w: inches(4), h: inches(2) }),
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
 *   slide(textbox({ x: inches(1), y: inches(1), w: inches(8), h: inches(1) }, "Hello")),
 * )
 *
 * presentation(
 *   { title: "My Deck", creator: "Author" },
 *   slide(textbox({ x: inches(1), y: inches(1), w: inches(8), h: inches(1) }, "With options")),
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
  paragraph: Paragraph,
  ctx: SlideContext,
): InternalParagraph {
  return {
    runs: paragraph.runs.map((r) => toInternalRun(r, ctx)),
    level: paragraph.level,
    alignment: paragraph.align ? ALIGNMENT_MAP[paragraph.align] : undefined,
    bullet: paragraph.bullet,
    spacing: paragraph.spacing,
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
        x: element.x,
        y: element.y,
        cx: element.w,
        cy: element.h,
        paragraphs: element.paragraphs.map((pg) =>
          toInternalParagraph(pg, ctx)
        ),
        fill: element.fill ? toInternalFill(element.fill) : undefined,
        line: element.line ? toInternalLine(element.line) : undefined,
        verticalAlignment: element.verticalAlign
          ? VALIGN_MAP[element.verticalAlign]
          : undefined,
      };
    case "shape":
      return {
        kind: "preset",
        x: element.x,
        y: element.y,
        cx: element.w,
        cy: element.h,
        preset: element.preset,
        paragraphs: element.paragraphs.map((pg) =>
          toInternalParagraph(pg, ctx)
        ),
        fill: element.fill ? toInternalFill(element.fill) : undefined,
        line: element.line ? toInternalLine(element.line) : undefined,
        verticalAlignment: element.verticalAlign
          ? VALIGN_MAP[element.verticalAlign]
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
        x: element.x,
        y: element.y,
        cx: element.w,
        cy: element.h,
        rId,
        description: element.description,
      } satisfies PictureShape;
    }
    case "table":
      return {
        kind: "table",
        x: element.x,
        y: element.y,
        cx: element.w,
        cy: element.h,
        columns: element.cols,
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
    paragraphs: c.paragraphs.map((pg) => toInternalParagraph(pg, ctx)),
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
 *   slide(textbox({ x: inches(1), y: inches(1), w: inches(8), h: inches(1) },
 *     "Hello, World!",
 *   )),
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
