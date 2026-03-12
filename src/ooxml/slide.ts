/**
 * Slide part XML generation.
 *
 * ECMA-376 Part 1 §13.3.8 defines the slide element (p:sld).
 * §19.3.1.43 defines the shape tree (p:spTree).
 * §20.1.2.2.33 defines shape properties (a:spPr).
 * §21.1.2 defines text body (a:txBody).
 */

import { el, renderXmlDocument, type XmlElement } from "../xml.ts";
import type { Emu, HexColor, HundredthPoint } from "../types.ts";
import { NS_A, NS_P, NS_R } from "./namespaces.ts";

/** A text run within a paragraph. */
export interface TextRun {
  readonly text: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly fontSize?: HundredthPoint;
  readonly fontColor?: HexColor;
}

/** A text paragraph containing runs. */
export interface TextParagraph {
  readonly runs: ReadonlyArray<TextRun>;
  readonly level?: number;
  readonly alignment?: "l" | "ctr" | "r" | "just";
}

/** A text box shape. ECMA-376 §19.3.1.43 (sp). */
export interface TextBoxShape {
  readonly kind: "textbox";
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
  readonly paragraphs: ReadonlyArray<TextParagraph>;
}

/** A preset geometry shape with optional text. ECMA-376 §20.1.9.18 (a:prstGeom). */
export interface PresetShape {
  readonly kind: "preset";
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
  readonly preset: string;
  readonly paragraphs?: ReadonlyArray<TextParagraph>;
}

/** Union of all shape types on a slide. */
export type SlideShape = TextBoxShape | PresetShape;

/** Generate a slide XML part. ECMA-376 §13.3.8. */
export function renderSlide(shapes: ReadonlyArray<SlideShape>): string {
  let nextId = 2;
  const shapeElements: XmlElement[] = shapes.map((shape) => {
    const id = nextId++;
    switch (shape.kind) {
      case "textbox":
        return renderTextBoxSp(id, shape);
      case "preset":
        return renderPresetSp(id, shape);
    }
  });

  const root = el(
    "p:sld",
    {
      "xmlns:a": NS_A,
      "xmlns:p": NS_P,
      "xmlns:r": NS_R,
    },
    el(
      "p:cSld",
      {},
      el(
        "p:spTree",
        {},
        el(
          "p:nvGrpSpPr",
          {},
          el("p:cNvPr", { id: "1", name: "" }),
          el("p:cNvGrpSpPr", {}),
          el("p:nvPr", {}),
        ),
        el("p:grpSpPr", {}),
        ...shapeElements,
      ),
    ),
    el("p:clrMapOvr", {}, el("a:masterClrMapping", {})),
  );

  return renderXmlDocument(root);
}

/**
 * Render a text box shape. ECMA-376 §19.3.1.43.
 * Text boxes use cNvSpPr with txBox="1" and noFill geometry.
 */
function renderTextBoxSp(id: number, shape: TextBoxShape): XmlElement {
  return el(
    "p:sp",
    {},
    el(
      "p:nvSpPr",
      {},
      el("p:cNvPr", { id: String(id), name: `TextBox ${id}` }),
      el("p:cNvSpPr", { txBox: "1" }),
      el("p:nvPr", {}),
    ),
    el(
      "p:spPr",
      {},
      el(
        "a:xfrm",
        {},
        el("a:off", { x: String(shape.x), y: String(shape.y) }),
        el("a:ext", { cx: String(shape.cx), cy: String(shape.cy) }),
      ),
      el("a:prstGeom", { prst: "rect" }, el("a:avLst", {})),
      el("a:noFill", {}),
    ),
    el(
      "p:txBody",
      {},
      el("a:bodyPr", { wrap: "square" }, el("a:spAutoFit", {})),
      el("a:lstStyle", {}),
      ...shape.paragraphs.map(renderParagraph),
    ),
  );
}

/**
 * Render a preset geometry shape. ECMA-376 §20.1.9.18.
 * Preset shapes use a:prstGeom with a named preset and default style.
 */
function renderPresetSp(id: number, shape: PresetShape): XmlElement {
  const children: XmlElement[] = [
    el(
      "p:nvSpPr",
      {},
      el("p:cNvPr", { id: String(id), name: `Shape ${id}` }),
      el("p:cNvSpPr", {}),
      el("p:nvPr", {}),
    ),
    el(
      "p:spPr",
      {},
      el(
        "a:xfrm",
        {},
        el("a:off", { x: String(shape.x), y: String(shape.y) }),
        el("a:ext", { cx: String(shape.cx), cy: String(shape.cy) }),
      ),
      el("a:prstGeom", { prst: shape.preset }, el("a:avLst", {})),
    ),
    el(
      "p:style",
      {},
      el("a:lnRef", { idx: "1" }, el("a:schemeClr", { val: "accent1" })),
      el("a:fillRef", { idx: "3" }, el("a:schemeClr", { val: "accent1" })),
      el("a:effectRef", { idx: "2" }, el("a:schemeClr", { val: "accent1" })),
      el("a:fontRef", { idx: "minor" }, el("a:schemeClr", { val: "lt1" })),
    ),
  ];

  const paragraphs = shape.paragraphs ?? [];
  if (paragraphs.length > 0) {
    children.push(
      el(
        "p:txBody",
        {},
        el("a:bodyPr", { rtlCol: "0", anchor: "ctr" }),
        el("a:lstStyle", {}),
        ...paragraphs.map(renderParagraph),
      ),
    );
  }

  return el("p:sp", {}, ...children);
}

/** Render a text paragraph. ECMA-376 §21.1.2.2.6 (a:p). */
function renderParagraph(para: TextParagraph): XmlElement {
  const children: XmlElement[] = [];

  if (para.level !== undefined || para.alignment !== undefined) {
    const pPrAttrs: Record<string, string | undefined> = {};
    if (para.level !== undefined) pPrAttrs["lvl"] = String(para.level);
    if (para.alignment !== undefined) pPrAttrs["algn"] = para.alignment;
    children.push(el("a:pPr", pPrAttrs));
  }

  for (const run of para.runs) {
    children.push(renderTextRun(run));
  }

  return el("a:p", {}, ...children);
}

/** Render a text run. ECMA-376 §21.1.2.3.8 (a:r). */
function renderTextRun(run: TextRun): XmlElement {
  const rPrAttrs: Record<string, string | undefined> = {};
  if (run.bold) rPrAttrs["b"] = "1";
  if (run.italic) rPrAttrs["i"] = "1";
  if (run.fontSize !== undefined) rPrAttrs["sz"] = String(run.fontSize);

  const rPrChildren: XmlElement[] = [];
  if (run.fontColor !== undefined) {
    rPrChildren.push(
      el("a:solidFill", {}, el("a:srgbClr", { val: run.fontColor })),
    );
  }

  const hasRunProps = Object.keys(rPrAttrs).length > 0 ||
    rPrChildren.length > 0;

  return el(
    "a:r",
    {},
    hasRunProps ? el("a:rPr", rPrAttrs, ...rPrChildren) : undefined,
    el("a:t", {}, run.text),
  );
}
