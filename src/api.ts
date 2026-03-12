/**
 * Composable, function-based public API for generating PPTX presentations.
 *
 * Every concept is a typed function that returns an immutable value.
 * Functions compose naturally: `presentation(slide(textbox(...)))`.
 * No imperative mutation — the presentation is data built from functions.
 */

import type { Emu, HexColor, HundredthPoint } from "./types.ts";
import { inches } from "./types.ts";
import { generatePptx } from "./packaging.ts";
import type {
  SlideShape,
  TextParagraph as InternalParagraph,
  TextRun as InternalRun,
} from "./ooxml/slide.ts";

// ---------------------------------------------------------------------------
// Text runs
// ---------------------------------------------------------------------------

/** A styled text run. ECMA-376 §21.1.2.3.8 (a:r). */
export interface TextRun {
  readonly text: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly fontSize?: HundredthPoint;
  readonly fontColor?: HexColor;
}

/** Styling options applicable to a text run. */
export interface TextRunStyle {
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly fontSize?: HundredthPoint;
  readonly fontColor?: HexColor;
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

// ---------------------------------------------------------------------------
// Paragraphs
// ---------------------------------------------------------------------------

/** Alignment options for paragraphs. */
export type Alignment = "left" | "center" | "right" | "justify";

/** Options for paragraph formatting. */
export interface ParagraphOptions {
  readonly level?: number;
  readonly alignment?: Alignment;
}

/** A text paragraph. ECMA-376 §21.1.2.2.6 (a:p). */
export interface Paragraph {
  readonly runs: ReadonlyArray<TextRun>;
  readonly level?: number;
  readonly alignment?: Alignment;
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

// ---------------------------------------------------------------------------
// Geometry bounds
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
// Shapes
// ---------------------------------------------------------------------------

/** A text box element. ECMA-376 §19.3.1.43 (sp, txBox). */
export interface TextBox {
  readonly kind: "textbox";
  readonly bounds: Bounds;
  readonly paragraphs: ReadonlyArray<Paragraph>;
}

/** A preset geometry shape. ECMA-376 §20.1.9.18 (a:prstGeom). */
export interface Shape {
  readonly kind: "shape";
  readonly bounds: Bounds;
  readonly preset: string;
  readonly paragraphs: ReadonlyArray<Paragraph>;
}

/** Union of all slide element types. */
export type SlideElement = TextBox | Shape;

/**
 * Create a text box with paragraphs.
 *
 * @example
 * ```ts
 * textbox(bounds(inches(1), inches(1), inches(8), inches(1)), [
 *   paragraph("Hello, World!"),
 *   paragraph([bold("Bold"), text(" and normal")]),
 * ])
 * ```
 */
export function textbox(
  b: Bounds,
  paragraphs: ReadonlyArray<Paragraph>,
): TextBox {
  return { kind: "textbox", bounds: b, paragraphs };
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
 * ])
 * ```
 */
export function shape(
  preset: string,
  b: Bounds,
  paragraphs?: ReadonlyArray<Paragraph>,
): Shape {
  return { kind: "shape", bounds: b, preset, paragraphs: paragraphs ?? [] };
}

// ---------------------------------------------------------------------------
// Slides
// ---------------------------------------------------------------------------

/** A slide containing elements. ECMA-376 §13.3.8. */
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
// Presentation
// ---------------------------------------------------------------------------

/** Options for the presentation. */
export interface PresentationOptions {
  readonly title?: string;
  readonly creator?: string;
  readonly slideWidth?: Emu;
  readonly slideHeight?: Emu;
}

/** A complete presentation. ECMA-376 §13.3.6. */
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
// Generation
// ---------------------------------------------------------------------------

const ALIGNMENT_MAP: Record<Alignment, "l" | "ctr" | "r" | "just"> = {
  left: "l",
  center: "ctr",
  right: "r",
  justify: "just",
};

function toInternalRun(run: TextRun): InternalRun {
  return {
    text: run.text,
    bold: run.bold,
    italic: run.italic,
    fontSize: run.fontSize,
    fontColor: run.fontColor,
  };
}

function toInternalParagraph(p: Paragraph): InternalParagraph {
  return {
    runs: p.runs.map(toInternalRun),
    level: p.level,
    alignment: p.alignment ? ALIGNMENT_MAP[p.alignment] : undefined,
  };
}

function toInternalShape(element: SlideElement): SlideShape {
  switch (element.kind) {
    case "textbox":
      return {
        kind: "textbox",
        x: element.bounds.x,
        y: element.bounds.y,
        cx: element.bounds.cx,
        cy: element.bounds.cy,
        paragraphs: element.paragraphs.map(toInternalParagraph),
      };
    case "shape":
      return {
        kind: "preset",
        x: element.bounds.x,
        y: element.bounds.y,
        cx: element.bounds.cx,
        cy: element.bounds.cy,
        preset: element.preset,
        paragraphs: element.paragraphs.map(toInternalParagraph),
      };
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

  return generatePptx({
    title: pres.options.title,
    creator: pres.options.creator,
    slideWidth,
    slideHeight,
    slides: pres.slides.map((s) => ({
      shapes: s.elements.map(toInternalShape),
    })),
  });
}
