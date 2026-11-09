/**
 * Text runs and paragraphs for the public DSL.
 */

import type { ParagraphStyle, TextStyle } from "./style.ts";

/** A styled text run. */
export interface TextRun {
  readonly text: string;
  readonly style?: TextStyle;
  readonly hyperlink?: string;
}

/** A text paragraph. */
export interface Paragraph {
  readonly style?: ParagraphStyle;
  readonly runs: ReadonlyArray<TextRun>;
}
