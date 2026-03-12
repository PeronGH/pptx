/**
 * Slides and presentations in the new public API.
 */

import type { Emu } from "./types.ts";
import type { Col, Row, SlideChild } from "./layout.ts";
import type { SceneNode } from "./scene.ts";

/** A slide containing layout roots and/or absolute scene nodes. */
export interface Slide {
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

/** Create a slide. */
export function slide(
  ...children: ReadonlyArray<Row | Col | SceneNode>
): Slide {
  return { children };
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
