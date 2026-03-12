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

// ---------------------------------------------------------------------------
// Fill and line types. ECMA-376 §20.1.8 (fill), §20.1.2.2.24 (a:ln).
// ---------------------------------------------------------------------------

/** Solid color fill. ECMA-376 §20.1.8.54 (a:solidFill). */
export interface SolidFill {
  readonly kind: "solid";
  readonly color: HexColor;
  /** Transparency in 1/1000ths of a percent (0 = opaque, 100000 = invisible). */
  readonly alpha?: number;
}

/** No fill. ECMA-376 §20.1.8.44 (a:noFill). */
export interface NoFill {
  readonly kind: "none";
}

/** Fill specification for shapes. */
export type Fill = SolidFill | NoFill;

/** Line (outline) properties. ECMA-376 §20.1.2.2.24 (a:ln). */
export interface LineProperties {
  /** Line width in EMUs. ECMA-376 §20.1.10.35 (ST_LineWidth). */
  readonly width?: Emu;
  readonly fill?: Fill;
}

// ---------------------------------------------------------------------------
// Text types. ECMA-376 §21.1.2.
// ---------------------------------------------------------------------------

/** A hyperlink on a text run. ECMA-376 §21.1.2.3.5 (a:hlinkClick). */
export interface HyperlinkInfo {
  /** Relationship ID referencing the hyperlink target. */
  readonly rId: string;
}

/** A text run within a paragraph. ECMA-376 §21.1.2.3.8 (a:r). */
export interface TextRun {
  readonly text: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly fontSize?: HundredthPoint;
  readonly fontColor?: HexColor;
  readonly fontFamily?: string;
  readonly hyperlink?: HyperlinkInfo;
}

/** Bullet specification for a paragraph. */
export interface BulletChar {
  readonly kind: "char";
  readonly char: string;
}

/** Auto-numbered bullet. ECMA-376 §21.1.2.4.1 (a:buAutoNum). */
export interface BulletAutoNum {
  readonly kind: "autonum";
  /** Numbering type, e.g. "arabicPeriod", "romanUcPeriod". */
  readonly type: string;
}

/** No bullets. ECMA-376 §21.1.2.4.4 (a:buNone). */
export interface BulletNone {
  readonly kind: "none";
}

/** Bullet type union. */
export type Bullet = BulletChar | BulletAutoNum | BulletNone;

/** Paragraph spacing in EMUs. ECMA-376 §21.1.2.2.10 (a:spcBef/a:spcAft). */
export interface ParagraphSpacing {
  readonly before?: Emu;
  readonly after?: Emu;
}

/** A text paragraph containing runs. ECMA-376 §21.1.2.2.6 (a:p). */
export interface TextParagraph {
  readonly runs: ReadonlyArray<TextRun>;
  readonly level?: number;
  readonly alignment?: "l" | "ctr" | "r" | "just";
  readonly bullet?: Bullet;
  readonly spacing?: ParagraphSpacing;
}

/** Vertical alignment for text body. ECMA-376 §21.1.2.1.1 (a:bodyPr anchor). */
export type VerticalAlignment = "t" | "ctr" | "b";

// ---------------------------------------------------------------------------
// Shape types.
// ---------------------------------------------------------------------------

/** A text box shape. ECMA-376 §19.3.1.43 (sp). */
export interface TextBoxShape {
  readonly kind: "textbox";
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
  readonly paragraphs: ReadonlyArray<TextParagraph>;
  readonly fill?: Fill;
  readonly line?: LineProperties;
  readonly verticalAlignment?: VerticalAlignment;
}

/** A preset geometry shape. ECMA-376 §20.1.9.18 (a:prstGeom). */
export interface PresetShape {
  readonly kind: "preset";
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
  readonly preset: string;
  readonly paragraphs?: ReadonlyArray<TextParagraph>;
  readonly fill?: Fill;
  readonly line?: LineProperties;
  readonly verticalAlignment?: VerticalAlignment;
}

/** A picture shape. ECMA-376 §19.3.1.37 (p:pic). */
export interface PictureShape {
  readonly kind: "picture";
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
  /** Relationship ID for the embedded image. */
  readonly rId: string;
  readonly description?: string;
}

/** A table shape. ECMA-376 §19.3.1.22 (p:graphicFrame). */
export interface TableShape {
  readonly kind: "table";
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
  readonly columns: ReadonlyArray<Emu>;
  readonly rows: ReadonlyArray<TableRow>;
}

/** A table row. ECMA-376 §21.1.3.16 (a:tr). */
export interface TableRow {
  readonly height: Emu;
  readonly cells: ReadonlyArray<TableCell>;
}

/** A table cell. ECMA-376 §21.1.3.15 (a:tc). */
export interface TableCell {
  readonly paragraphs: ReadonlyArray<TextParagraph>;
  readonly fill?: Fill;
}

/** Union of all shape types on a slide. */
export type SlideShape =
  | TextBoxShape
  | PresetShape
  | PictureShape
  | TableShape;

// ---------------------------------------------------------------------------
// Rendering.
// ---------------------------------------------------------------------------

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
      case "picture":
        return renderPicture(id, shape);
      case "table":
        return renderTable(id, shape);
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

// ---------------------------------------------------------------------------
// Fill / line rendering helpers.
// ---------------------------------------------------------------------------

function renderFill(fill: Fill | undefined): XmlElement | undefined {
  if (!fill) return undefined;
  switch (fill.kind) {
    case "solid": {
      const clrChildren: XmlElement[] = [];
      if (fill.alpha !== undefined) {
        clrChildren.push(el("a:alpha", { val: String(fill.alpha) }));
      }
      return el(
        "a:solidFill",
        {},
        el("a:srgbClr", { val: fill.color }, ...clrChildren),
      );
    }
    case "none":
      return el("a:noFill", {});
  }
}

function renderLine(line: LineProperties | undefined): XmlElement | undefined {
  if (!line) return undefined;
  const attrs: Record<string, string | undefined> = {};
  if (line.width !== undefined) attrs["w"] = String(line.width);
  const children: XmlElement[] = [];
  if (line.fill) {
    const fillEl = renderFill(line.fill);
    if (fillEl) children.push(fillEl);
  }
  return el("a:ln", attrs, ...children);
}

// ---------------------------------------------------------------------------
// Shape renderers.
// ---------------------------------------------------------------------------

/**
 * Render a text box shape. ECMA-376 §19.3.1.43.
 * Text boxes use cNvSpPr with txBox="1".
 */
function renderTextBoxSp(id: number, shape: TextBoxShape): XmlElement {
  const spPrChildren: XmlElement[] = [
    el(
      "a:xfrm",
      {},
      el("a:off", { x: String(shape.x), y: String(shape.y) }),
      el("a:ext", { cx: String(shape.cx), cy: String(shape.cy) }),
    ),
    el("a:prstGeom", { prst: "rect" }, el("a:avLst", {})),
  ];

  const fillEl = shape.fill ? renderFill(shape.fill) : el("a:noFill", {});
  if (fillEl) spPrChildren.push(fillEl);

  const lineEl = renderLine(shape.line);
  if (lineEl) spPrChildren.push(lineEl);

  const bodyPrAttrs: Record<string, string> = { wrap: "square" };
  if (shape.verticalAlignment) bodyPrAttrs["anchor"] = shape.verticalAlignment;

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
    el("p:spPr", {}, ...spPrChildren),
    el(
      "p:txBody",
      {},
      el("a:bodyPr", bodyPrAttrs, el("a:spAutoFit", {})),
      el("a:lstStyle", {}),
      ...shape.paragraphs.map(renderParagraph),
    ),
  );
}

/**
 * Render a preset geometry shape. ECMA-376 §20.1.9.18.
 * Preset shapes use a:prstGeom with a named preset.
 */
function renderPresetSp(id: number, shape: PresetShape): XmlElement {
  const spPrChildren: XmlElement[] = [
    el(
      "a:xfrm",
      {},
      el("a:off", { x: String(shape.x), y: String(shape.y) }),
      el("a:ext", { cx: String(shape.cx), cy: String(shape.cy) }),
    ),
    el("a:prstGeom", { prst: shape.preset }, el("a:avLst", {})),
  ];

  if (shape.fill) {
    const fillEl = renderFill(shape.fill);
    if (fillEl) spPrChildren.push(fillEl);
  }

  const lineEl = renderLine(shape.line);
  if (lineEl) spPrChildren.push(lineEl);

  const children: XmlElement[] = [
    el(
      "p:nvSpPr",
      {},
      el("p:cNvPr", { id: String(id), name: `Shape ${id}` }),
      el("p:cNvSpPr", {}),
      el("p:nvPr", {}),
    ),
    el("p:spPr", {}, ...spPrChildren),
  ];

  // Only add style if no explicit fill (preserve theme defaults)
  if (!shape.fill && !shape.line) {
    children.push(
      el(
        "p:style",
        {},
        el("a:lnRef", { idx: "1" }, el("a:schemeClr", { val: "accent1" })),
        el("a:fillRef", { idx: "3" }, el("a:schemeClr", { val: "accent1" })),
        el(
          "a:effectRef",
          { idx: "2" },
          el("a:schemeClr", { val: "accent1" }),
        ),
        el("a:fontRef", { idx: "minor" }, el("a:schemeClr", { val: "lt1" })),
      ),
    );
  }

  const paragraphs = shape.paragraphs ?? [];
  if (paragraphs.length > 0) {
    const bodyPrAttrs: Record<string, string> = {
      rtlCol: "0",
      anchor: "ctr",
    };
    if (shape.verticalAlignment) {
      bodyPrAttrs["anchor"] = shape.verticalAlignment;
    }
    children.push(
      el(
        "p:txBody",
        {},
        el("a:bodyPr", bodyPrAttrs),
        el("a:lstStyle", {}),
        ...paragraphs.map(renderParagraph),
      ),
    );
  }

  return el("p:sp", {}, ...children);
}

/**
 * Render a picture shape. ECMA-376 §19.3.1.37 (p:pic).
 * Uses a:blipFill to reference the embedded image via relationship ID.
 */
function renderPicture(id: number, shape: PictureShape): XmlElement {
  const desc = shape.description ?? "";
  return el(
    "p:pic",
    {},
    el(
      "p:nvPicPr",
      {},
      el("p:cNvPr", { id: String(id), name: `Picture ${id}`, descr: desc }),
      el("p:cNvPicPr", {}, el("a:picLocks", { noChangeAspect: "1" })),
      el("p:nvPr", {}),
    ),
    el(
      "p:blipFill",
      {},
      el("a:blip", { "r:embed": shape.rId }),
      el("a:stretch", {}, el("a:fillRect", {})),
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
    ),
  );
}

/** Table graphic data URI. ECMA-376 §21.1.3. */
const TABLE_URI = "http://schemas.openxmlformats.org/drawingml/2006/table";

/**
 * Render a table as a graphicFrame. ECMA-376 §19.3.1.22.
 * Tables live inside a:graphic > a:graphicData with the table URI.
 */
function renderTable(id: number, shape: TableShape): XmlElement {
  const gridCols = shape.columns.map((w) => el("a:gridCol", { w: String(w) }));

  const rows = shape.rows.map((row) => {
    const cells = row.cells.map((cell) => {
      const tcChildren: XmlElement[] = [
        el(
          "a:txBody",
          {},
          el("a:bodyPr", {}),
          el("a:lstStyle", {}),
          ...(cell.paragraphs.length > 0
            ? cell.paragraphs.map(renderParagraph)
            : [el("a:p", {})]),
        ),
      ];
      const tcPrChildren: XmlElement[] = [];
      if (cell.fill) {
        const fillEl = renderFill(cell.fill);
        if (fillEl) tcPrChildren.push(fillEl);
      }
      if (tcPrChildren.length > 0) {
        tcChildren.push(el("a:tcPr", {}, ...tcPrChildren));
      }
      return el("a:tc", {}, ...tcChildren);
    });
    return el("a:tr", { h: String(row.height) }, ...cells);
  });

  return el(
    "p:graphicFrame",
    {},
    el(
      "p:nvGraphicFramePr",
      {},
      el("p:cNvPr", { id: String(id), name: `Table ${id}` }),
      el("p:cNvGraphicFramePr", {}, el("a:graphicFrameLocks", { noGrp: "1" })),
      el("p:nvPr", {}),
    ),
    el(
      "p:xfrm",
      {},
      el("a:off", { x: String(shape.x), y: String(shape.y) }),
      el("a:ext", { cx: String(shape.cx), cy: String(shape.cy) }),
    ),
    el(
      "a:graphic",
      {},
      el(
        "a:graphicData",
        { uri: TABLE_URI },
        el(
          "a:tbl",
          {},
          el("a:tblPr", { firstRow: "1", bandRow: "1" }),
          el("a:tblGrid", {}, ...gridCols),
          ...rows,
        ),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Text rendering.
// ---------------------------------------------------------------------------

/** Render a text paragraph. ECMA-376 §21.1.2.2.6 (a:p). */
function renderParagraph(para: TextParagraph): XmlElement {
  const children: XmlElement[] = [];

  const hasPPr = para.level !== undefined || para.alignment !== undefined ||
    para.bullet !== undefined || para.spacing !== undefined;

  if (hasPPr) {
    const pPrAttrs: Record<string, string | undefined> = {};
    if (para.level !== undefined) pPrAttrs["lvl"] = String(para.level);
    if (para.alignment !== undefined) pPrAttrs["algn"] = para.alignment;

    const pPrChildren: XmlElement[] = [];

    if (para.spacing?.before !== undefined) {
      pPrChildren.push(
        el(
          "a:spcBef",
          {},
          el("a:spcPts", {
            val: String(Math.round(para.spacing.before / 127)),
          }),
        ),
      );
    }
    if (para.spacing?.after !== undefined) {
      pPrChildren.push(
        el(
          "a:spcAft",
          {},
          el("a:spcPts", { val: String(Math.round(para.spacing.after / 127)) }),
        ),
      );
    }

    if (para.bullet) {
      switch (para.bullet.kind) {
        case "char":
          pPrChildren.push(el("a:buChar", { char: para.bullet.char }));
          break;
        case "autonum":
          pPrChildren.push(el("a:buAutoNum", { type: para.bullet.type }));
          break;
        case "none":
          pPrChildren.push(el("a:buNone", {}));
          break;
      }
    }

    children.push(el("a:pPr", pPrAttrs, ...pPrChildren));
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
  if (run.underline) rPrAttrs["u"] = "sng";
  if (run.fontSize !== undefined) rPrAttrs["sz"] = String(run.fontSize);

  const rPrChildren: XmlElement[] = [];
  if (run.fontColor !== undefined) {
    rPrChildren.push(
      el("a:solidFill", {}, el("a:srgbClr", { val: run.fontColor })),
    );
  }
  if (run.hyperlink) {
    rPrChildren.push(el("a:hlinkClick", { "r:id": run.hyperlink.rId }));
  }
  if (run.fontFamily !== undefined) {
    rPrChildren.push(
      el("a:latin", { typeface: run.fontFamily }),
      el("a:cs", { typeface: run.fontFamily }),
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
