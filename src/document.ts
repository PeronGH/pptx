/**
 * Slides and presentations in the new public API.
 */

import type { Emu, HexColor } from "./types.ts";
import type { CropRect, Fill, ImageFit, Insets } from "./style.ts";
import type { SlideChild } from "./layout.ts";

/** Slide background image properties. */
export interface BackgroundImageProps {
  readonly data: Uint8Array;
  readonly contentType: string;
  readonly description?: string;
  readonly fit?: ImageFit;
  readonly crop?: CropRect;
  readonly alpha?: number;
}

/** A slide background: a hex color, a fill, or an image. */
export type Background = Fill | HexColor | BackgroundImageProps;

/** Slide-level props. */
export interface SlideProps {
  readonly background?: Background;
  readonly contentPadding?: Emu | Insets;
}

/** A slide containing layout roots and/or absolute scene nodes. */
export interface Slide {
  readonly props: SlideProps;
  readonly children: ReadonlyArray<SlideChild>;
}

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

function isSlideProps(value: SlideProps | SlideChild): value is SlideProps {
  return typeof value === "object" && value !== null && !("kind" in value) &&
    !("x" in value) && !("children" in value);
}

/** Create a slide. */
export function slide(
  first?: SlideProps | SlideChild,
  ...rest: ReadonlyArray<SlideChild>
): Slide {
  if (first === undefined) return { props: {}, children: [] };
  if (isSlideProps(first)) {
    return { props: first, children: rest };
  }
  return { props: {}, children: [first, ...rest] };
}

/** Create a presentation from slides. */
export function presentation(
  first: Slide | PresentationOptions,
  ...rest: ReadonlyArray<Slide>
): Presentation {
  if ("children" in first) {
    return { options: {}, slides: [first, ...rest] };
  }
  return { options: first, slides: rest };
}
