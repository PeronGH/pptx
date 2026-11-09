/**
 * Normalized slide and presentation model.
 */

import type { Emu, HexColor, Percentage } from "./types.ts";
import type { CropRect, Fill, ImageFit, Insets } from "./style.ts";
import type { ResolvableNode } from "./layout.ts";

/** Slide background image properties. */
export interface BackgroundImageProps {
  /** PNG, JPEG, GIF, or BMP bytes; the format is detected from the data. */
  readonly data: Uint8Array;
  readonly fit?: ImageFit;
  readonly crop?: CropRect;
  readonly alpha?: Percentage;
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
  readonly children: ReadonlyArray<ResolvableNode>;
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
