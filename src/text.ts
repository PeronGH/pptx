/**
 * Text runs and paragraphs for the public DSL.
 */

import type {
  ParagraphStyle,
  ParagraphStyleInput,
  TextStyle,
  TextStyleInput,
} from "./style.ts";
import { resolveParagraphStyle, resolveTextStyle } from "./style.ts";

/** Options for creating a text run. */
export interface TextRunOptions {
  readonly style?: TextStyleInput;
}

/** A styled text run. */
export interface TextRun {
  readonly text: string;
  readonly style?: TextStyle;
  readonly hyperlink?: string;
}

/** Options for creating a paragraph. */
export interface ParagraphOptions {
  readonly style?: ParagraphStyleInput;
}

/** A text paragraph. */
export interface Paragraph {
  readonly style?: ParagraphStyle;
  readonly runs: ReadonlyArray<TextRun>;
}

/** Content that auto-coerces to a TextRun. */
export type TextContent = string | TextRun;

/** Content that auto-coerces to a Paragraph. */
export type ParagraphContent = string | Paragraph;

/** Create a plain text run. */
export function text(content: string, options?: TextRunOptions): TextRun {
  return { text: content, style: resolveTextStyle(options?.style) };
}

/** Create a bold text run. */
export function bold(content: string, options?: TextRunOptions): TextRun {
  return {
    text: content,
    style: { ...resolveTextStyle(options?.style), bold: true },
  };
}

/** Create an italic text run. */
export function italic(content: string, options?: TextRunOptions): TextRun {
  return {
    text: content,
    style: { ...resolveTextStyle(options?.style), italic: true },
  };
}

/** Create a bold-italic text run. */
export function boldItalic(content: string, options?: TextRunOptions): TextRun {
  return {
    text: content,
    style: { ...resolveTextStyle(options?.style), bold: true, italic: true },
  };
}

/** Create an underlined text run. */
export function underline(content: string, options?: TextRunOptions): TextRun {
  return {
    text: content,
    style: { ...resolveTextStyle(options?.style), underline: true },
  };
}

/** Create a hyperlinked text run. */
export function link(
  content: string,
  url: string,
  options?: TextRunOptions,
): TextRun {
  return {
    text: content,
    style: resolveTextStyle(options?.style),
    hyperlink: url,
  };
}

function isParagraphOptions(
  value: ParagraphOptions | TextContent,
): value is ParagraphOptions {
  return typeof value !== "string" && !("text" in value);
}

function toRun(content: TextContent): TextRun {
  return typeof content === "string" ? { text: content } : content;
}

/** Create a paragraph from text runs or strings. */
export function p(
  first?: ParagraphOptions | TextContent,
  ...rest: ReadonlyArray<TextContent>
): Paragraph {
  if (first === undefined) return { runs: [] };
  if (isParagraphOptions(first)) {
    return {
      style: resolveParagraphStyle(first.style),
      runs: rest.map(toRun),
    };
  }
  return { runs: [toRun(first), ...rest.map(toRun)] };
}

/** Coerce paragraph content into a paragraph. */
export function toParagraph(content: ParagraphContent): Paragraph {
  return typeof content === "string" ? { runs: [{ text: content }] } : content;
}
