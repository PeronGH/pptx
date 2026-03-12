/**
 * Text runs and paragraphs for the public DSL.
 */

import type { ParagraphStyle, TextStyle } from "./style.ts";

/** A styled text run. */
export interface TextRun extends TextStyle {
  readonly text: string;
}

/** A text paragraph. */
export interface Paragraph extends ParagraphStyle {
  readonly runs: ReadonlyArray<TextRun>;
}

/** Content that auto-coerces to a TextRun. */
export type TextContent = string | TextRun;

/** Content that auto-coerces to a Paragraph. */
export type ParagraphContent = string | Paragraph;

/** Create a plain text run. */
export function text(content: string, style?: TextStyle): TextRun {
  return { text: content, ...style };
}

/** Create a bold text run. */
export function bold(content: string, style?: TextStyle): TextRun {
  return { text: content, ...style, bold: true };
}

/** Create an italic text run. */
export function italic(content: string, style?: TextStyle): TextRun {
  return { text: content, ...style, italic: true };
}

/** Create a bold-italic text run. */
export function boldItalic(content: string, style?: TextStyle): TextRun {
  return { text: content, ...style, bold: true, italic: true };
}

/** Create an underlined text run. */
export function underline(content: string, style?: TextStyle): TextRun {
  return { text: content, ...style, underline: true };
}

/** Create a hyperlinked text run. */
export function link(
  content: string,
  url: string,
  style?: TextStyle,
): TextRun {
  return { text: content, ...style, hyperlink: url };
}

function isParagraphStyle(
  value: ParagraphStyle | TextContent,
): value is ParagraphStyle {
  return typeof value !== "string" && !("text" in value);
}

function toRun(content: TextContent): TextRun {
  return typeof content === "string" ? { text: content } : content;
}

/** Create a paragraph from text runs or strings. */
export function p(
  first?: ParagraphStyle | TextContent,
  ...rest: ReadonlyArray<TextContent>
): Paragraph {
  if (first === undefined) return { runs: [] };
  if (isParagraphStyle(first)) {
    return { runs: rest.map(toRun), ...first };
  }
  return { runs: [toRun(first), ...rest.map(toRun)] };
}

/** Coerce paragraph content into a paragraph. */
export function toParagraph(content: ParagraphContent): Paragraph {
  return typeof content === "string" ? { runs: [{ text: content }] } : content;
}
