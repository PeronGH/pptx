/**
 * Public declarative API for generating PPTX presentations.
 *
 * Users describe presentations as data, then call `writePresentation()`.
 * No imperative mutation — the presentation is a value.
 */

import type { Emu, HexColor, HundredthPoint } from "./types.ts";
import { inches } from "./types.ts";
import { generatePptx } from "./packaging.ts";
import type { SlideShape, TextParagraph } from "./ooxml/slide.ts";

/** A text run in the public API. */
export interface PTextRun {
  /** The text content. */
  readonly text: string;
  /** Whether the text is bold. */
  readonly bold?: boolean;
  /** Whether the text is italic. */
  readonly italic?: boolean;
  /** Font size in hundredths of a point (use `fontSize()` helper). */
  readonly fontSize?: HundredthPoint;
  /** Font color as hex (use `hexColor()` helper). */
  readonly fontColor?: HexColor;
}

/** A text paragraph in the public API. */
export interface PParagraph {
  /** Text content. If a string, creates a single run. */
  readonly text: string | ReadonlyArray<PTextRun>;
  /** Indentation level (0-8). */
  readonly level?: number;
  /** Paragraph alignment. */
  readonly alignment?: "left" | "center" | "right" | "justify";
}

/** A text box element. */
export interface PTextBox {
  readonly kind: "textbox";
  /** X position in EMUs. */
  readonly x: Emu;
  /** Y position in EMUs. */
  readonly y: Emu;
  /** Width in EMUs. */
  readonly cx: Emu;
  /** Height in EMUs. */
  readonly cy: Emu;
  /** Paragraphs of text. */
  readonly paragraphs: ReadonlyArray<PParagraph>;
}

/** A preset geometry shape. */
export interface PShape {
  readonly kind: "shape";
  /** X position in EMUs. */
  readonly x: Emu;
  /** Y position in EMUs. */
  readonly y: Emu;
  /** Width in EMUs. */
  readonly cx: Emu;
  /** Height in EMUs. */
  readonly cy: Emu;
  /** Preset geometry name (e.g. "rect", "ellipse", "roundRect"). ECMA-376 §20.1.10.56. */
  readonly preset: string;
  /** Optional text paragraphs. */
  readonly paragraphs?: ReadonlyArray<PParagraph>;
}

/** Union of all slide element types. */
export type PSlideElement = PTextBox | PShape;

/** A slide in the public API. */
export interface PSlide {
  /** Elements on this slide. */
  readonly elements: ReadonlyArray<PSlideElement>;
}

/** A complete presentation description. */
export interface PPresentation {
  /** Presentation title (used in document properties). */
  readonly title?: string;
  /** Author name (used in document properties). */
  readonly creator?: string;
  /** Slide width in EMUs. Defaults to 10 inches (standard widescreen). */
  readonly slideWidth?: Emu;
  /** Slide height in EMUs. Defaults to 7.5 inches (standard widescreen). */
  readonly slideHeight?: Emu;
  /** Slides in order. */
  readonly slides: ReadonlyArray<PSlide>;
}

const ALIGNMENT_MAP: Record<string, "l" | "ctr" | "r" | "just"> = {
  left: "l",
  center: "ctr",
  right: "r",
  justify: "just",
};

/** Convert a public paragraph to an internal text paragraph. */
function toParagraph(p: PParagraph): TextParagraph {
  const runs = typeof p.text === "string" ? [{ text: p.text }] : [...p.text];

  return {
    runs,
    level: p.level,
    alignment: p.alignment ? ALIGNMENT_MAP[p.alignment] : undefined,
  };
}

/** Convert a public slide element to an internal slide shape. */
function toShape(element: PSlideElement): SlideShape {
  switch (element.kind) {
    case "textbox":
      return {
        kind: "textbox",
        x: element.x,
        y: element.y,
        cx: element.cx,
        cy: element.cy,
        paragraphs: element.paragraphs.map(toParagraph),
      };
    case "shape":
      return {
        kind: "preset",
        x: element.x,
        y: element.y,
        cx: element.cx,
        cy: element.cy,
        preset: element.preset,
        paragraphs: element.paragraphs?.map(toParagraph),
      };
  }
}

/**
 * Generate a PPTX file from a declarative presentation description.
 *
 * Returns the file contents as a Uint8Array (ZIP/PPTX binary).
 */
export function generatePresentation(presentation: PPresentation): Uint8Array {
  const slideWidth = presentation.slideWidth ?? inches(10);
  const slideHeight = presentation.slideHeight ?? inches(7.5);

  return generatePptx({
    title: presentation.title,
    creator: presentation.creator,
    slideWidth,
    slideHeight,
    slides: presentation.slides.map((slide) => ({
      shapes: slide.elements.map(toShape),
    })),
  });
}
