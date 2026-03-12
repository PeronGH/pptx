/**
 * Slide part XML generation.
 *
 * ECMA-376 Part 1 §13.3.8 defines the slide element (p:sld).
 * §19.3.1.45 defines the shape tree (p:spTree).
 * §19.3.1.44 defines the PresentationML shape properties container (p:spPr).
 * §19.3.1.51 defines the shape text body container (p:txBody), whose text
 * content is specified by §21.1.2.
 */

import { el, renderXmlDocument, type XmlElement } from "../xml.ts";
import type { Emu, HexColor, HundredthPoint, Percentage } from "../types.ts";
import { NS_A, NS_P, NS_R } from "./namespaces.ts";

/** Solid color fill. */
export interface SolidFill {
  readonly kind: "solid";
  readonly color: HexColor;
  readonly alpha?: number;
}

/** Linear gradient stop. */
export interface GradientStop {
  readonly pos: Percentage;
  readonly color: HexColor;
  readonly alpha?: number;
}

/** Linear gradient fill. */
export interface LinearGradientFill {
  readonly kind: "linear-gradient";
  readonly angle: number;
  readonly stops: ReadonlyArray<GradientStop>;
}

/** No fill. */
export interface NoFill {
  readonly kind: "none";
}

/** Fill specification. */
export type Fill = SolidFill | LinearGradientFill | NoFill;

/** Supported line dash styles. */
export type LineDash = "solid" | "dash" | "dot" | "dash-dot";

/** Line properties. */
export interface LineProperties {
  readonly width?: Emu;
  readonly fill?: Fill;
  readonly dash?: LineDash;
}

/** Insets for text bodies and table cells. */
export interface Insets {
  readonly top?: Emu;
  readonly right?: Emu;
  readonly bottom?: Emu;
  readonly left?: Emu;
}

/** Supported text fit modes. */
export type TextFit = "none" | "shrink-text" | "resize-shape";

/** Simple outer shadow effect. */
export interface Shadow {
  readonly color: HexColor;
  readonly blur: Emu;
  readonly distance: Emu;
  readonly angle: number;
  readonly alpha?: number;
}

/** Crop percentages relative to the image source. */
export interface CropRect {
  readonly top?: Percentage;
  readonly right?: Percentage;
  readonly bottom?: Percentage;
  readonly left?: Percentage;
}

/** Hyperlink relationship info. */
export interface HyperlinkInfo {
  readonly rId: string;
}

/** A text run. */
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

/** Bullet character. */
export interface BulletChar {
  readonly kind: "char";
  readonly char: string;
}

/** Auto-numbered bullet. */
export interface BulletAutoNum {
  readonly kind: "autonum";
  readonly type: string;
}

/** No bullets. */
export interface BulletNone {
  readonly kind: "none";
}

/** Bullet union. */
export type Bullet = BulletChar | BulletAutoNum | BulletNone;

/** Paragraph spacing in EMUs. */
export interface ParagraphSpacing {
  readonly before?: Emu;
  readonly after?: Emu;
}

/** A text paragraph. */
export interface TextParagraph {
  readonly runs: ReadonlyArray<TextRun>;
  readonly level?: number;
  readonly alignment?: "l" | "ctr" | "r" | "just";
  readonly bullet?: Bullet;
  readonly spacing?: ParagraphSpacing;
}

/** Vertical alignment for text bodies. */
export type VerticalAlignment = "t" | "ctr" | "b";

/** Shape-backed text box. */
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
  readonly inset?: Insets;
  readonly fit?: TextFit;
  readonly shadow?: Shadow;
}

/** Preset shape. */
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
  readonly inset?: Insets;
  readonly fit?: TextFit;
  readonly shadow?: Shadow;
}

/** Picture shape. */
export interface PictureShape {
  readonly kind: "picture";
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
  readonly rId: string;
  readonly description?: string;
  readonly crop?: CropRect;
  readonly alpha?: number;
}

/** A table cell. */
export interface TableCell {
  readonly paragraphs: ReadonlyArray<TextParagraph>;
  readonly fill?: Fill;
  readonly line?: LineProperties;
  readonly padding?: Insets;
  readonly verticalAlignment?: VerticalAlignment;
}

/** A table row. */
export interface TableRow {
  readonly height: Emu;
  readonly cells: ReadonlyArray<TableCell>;
}

/** Table shape. */
export interface TableShape {
  readonly kind: "table";
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
  readonly columns: ReadonlyArray<Emu>;
  readonly rows: ReadonlyArray<TableRow>;
}

/** Slide background. */
export interface SlideBackground {
  readonly fill: Fill;
}

/** Union of all shape types on a slide. */
export type SlideShape =
  | TextBoxShape
  | PresetShape
  | PictureShape
  | TableShape;

/** Generate a slide XML part. */
export function renderSlide(
  shapes: ReadonlyArray<SlideShape>,
  background?: SlideBackground,
): string {
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

  const cSldChildren: XmlElement[] = [];
  if (background) {
    cSldChildren.push(
      el("p:bg", {}, el("p:bgPr", {}, renderFill(background.fill))),
    );
  }
  cSldChildren.push(
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
  );

  const root = el(
    "p:sld",
    {
      "xmlns:a": NS_A,
      "xmlns:p": NS_P,
      "xmlns:r": NS_R,
    },
    el("p:cSld", {}, ...cSldChildren),
    el("p:clrMapOvr", {}, el("a:masterClrMapping", {})),
  );

  return renderXmlDocument(root);
}

function degreesToAngle(degrees: number): string {
  return String(Math.round(degrees * 60000));
}

function renderColor(color: HexColor, alpha?: number): XmlElement {
  const children: XmlElement[] = [];
  if (alpha !== undefined) {
    children.push(el("a:alpha", { val: String(alpha) }));
  }
  return el("a:srgbClr", { val: color }, ...children);
}

function renderFill(fill: Fill | undefined): XmlElement | undefined {
  if (!fill) return undefined;
  switch (fill.kind) {
    case "solid":
      return el("a:solidFill", {}, renderColor(fill.color, fill.alpha));
    case "linear-gradient":
      return el(
        "a:gradFill",
        { rotWithShape: "1" },
        el(
          "a:gsLst",
          {},
          ...fill.stops.map((stop) =>
            el(
              "a:gs",
              { pos: String(stop.pos) },
              renderColor(stop.color, stop.alpha),
            )
          ),
        ),
        el("a:lin", { ang: degreesToAngle(fill.angle), scaled: "1" }),
      );
    case "none":
      return el("a:noFill", {});
  }
}

function dashValue(dash: LineDash | undefined): string | undefined {
  switch (dash) {
    case undefined:
    case "solid":
      return "solid";
    case "dash":
      return "dash";
    case "dot":
      return "sysDot";
    case "dash-dot":
      return "dashDot";
  }
}

function renderLine(
  line: LineProperties | undefined,
  tag = "a:ln",
): XmlElement | undefined {
  if (!line) return undefined;
  const attrs: Record<string, string | undefined> = {};
  if (line.width !== undefined) attrs["w"] = String(line.width);
  const children: XmlElement[] = [];
  if (line.fill) {
    const fillEl = renderFill(line.fill);
    if (fillEl) children.push(fillEl);
  }
  const dash = dashValue(line.dash);
  if (dash) {
    children.push(el("a:prstDash", { val: dash }));
  }
  return el(tag, attrs, ...children);
}

function renderShadow(shadow: Shadow | undefined): XmlElement | undefined {
  if (!shadow) return undefined;
  return el(
    "a:effectLst",
    {},
    el(
      "a:outerShdw",
      {
        blurRad: String(shadow.blur),
        dist: String(shadow.distance),
        dir: degreesToAngle(shadow.angle),
        rotWithShape: "0",
      },
      renderColor(shadow.color, shadow.alpha),
    ),
  );
}

function renderCropRect(crop: CropRect | undefined): XmlElement | undefined {
  if (!crop) return undefined;
  const attrs: Record<string, string | undefined> = {
    t: crop.top !== undefined ? String(crop.top) : undefined,
    r: crop.right !== undefined ? String(crop.right) : undefined,
    b: crop.bottom !== undefined ? String(crop.bottom) : undefined,
    l: crop.left !== undefined ? String(crop.left) : undefined,
  };
  return el("a:srcRect", attrs);
}

function renderTextFit(
  fit: TextFit | undefined,
  defaultFit?: TextFit,
): XmlElement | undefined {
  switch (fit ?? defaultFit) {
    case "none":
      return el("a:noAutofit", {});
    case "shrink-text":
      return el("a:normAutofit", {});
    case "resize-shape":
      return el("a:spAutoFit", {});
    case undefined:
      return undefined;
  }
}

function renderBodyPr(
  attrs: Record<string, string>,
  inset: Insets | undefined,
  fit: TextFit | undefined,
  defaultFit?: TextFit,
): XmlElement {
  const bodyAttrs: Record<string, string> = { ...attrs };
  if (inset?.left !== undefined) bodyAttrs["lIns"] = String(inset.left);
  if (inset?.right !== undefined) bodyAttrs["rIns"] = String(inset.right);
  if (inset?.top !== undefined) bodyAttrs["tIns"] = String(inset.top);
  if (inset?.bottom !== undefined) bodyAttrs["bIns"] = String(inset.bottom);
  return el("a:bodyPr", bodyAttrs, renderTextFit(fit, defaultFit));
}

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

  const shadowEl = renderShadow(shape.shadow);
  if (shadowEl) spPrChildren.push(shadowEl);

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
      renderBodyPr(bodyPrAttrs, shape.inset, shape.fit, "resize-shape"),
      el("a:lstStyle", {}),
      ...shape.paragraphs.map(renderParagraph),
    ),
  );
}

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

  const shadowEl = renderShadow(shape.shadow);
  if (shadowEl) spPrChildren.push(shadowEl);

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

  if (!shape.fill && !shape.line && !shape.shadow) {
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
    };
    if (shape.verticalAlignment) {
      bodyPrAttrs["anchor"] = shape.verticalAlignment;
    }
    children.push(
      el(
        "p:txBody",
        {},
        renderBodyPr(bodyPrAttrs, shape.inset, shape.fit),
        el("a:lstStyle", {}),
        ...paragraphs.map(renderParagraph),
      ),
    );
  }

  return el("p:sp", {}, ...children);
}

function renderPicture(id: number, shape: PictureShape): XmlElement {
  const desc = shape.description ?? "";
  const blipChildren: XmlElement[] = [];
  if (shape.alpha !== undefined) {
    blipChildren.push(el("a:alphaModFix", { amt: String(shape.alpha) }));
  }
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
      el("a:blip", { "r:embed": shape.rId }, ...blipChildren),
      renderCropRect(shape.crop),
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

const TABLE_URI = "http://schemas.openxmlformats.org/drawingml/2006/table";

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
      const tcPrAttrs: Record<string, string | undefined> = {};
      if (cell.padding?.left !== undefined) {
        tcPrAttrs["marL"] = String(cell.padding.left);
      }
      if (cell.padding?.right !== undefined) {
        tcPrAttrs["marR"] = String(cell.padding.right);
      }
      if (cell.padding?.top !== undefined) {
        tcPrAttrs["marT"] = String(cell.padding.top);
      }
      if (cell.padding?.bottom !== undefined) {
        tcPrAttrs["marB"] = String(cell.padding.bottom);
      }
      if (cell.verticalAlignment) tcPrAttrs["anchor"] = cell.verticalAlignment;
      const tcPrChildren: XmlElement[] = [];
      if (cell.fill) {
        const fillEl = renderFill(cell.fill);
        if (fillEl) tcPrChildren.push(fillEl);
      }
      if (cell.line) {
        const tags = ["a:lnL", "a:lnR", "a:lnT", "a:lnB"] as const;
        for (const tag of tags) {
          const lineEl = renderLine(cell.line, tag);
          if (lineEl) tcPrChildren.push(lineEl);
        }
      }
      if (Object.keys(tcPrAttrs).length > 0 || tcPrChildren.length > 0) {
        tcChildren.push(el("a:tcPr", tcPrAttrs, ...tcPrChildren));
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

function renderTextRun(run: TextRun): XmlElement {
  const rPrAttrs: Record<string, string | undefined> = {};
  if (run.bold) rPrAttrs["b"] = "1";
  if (run.italic) rPrAttrs["i"] = "1";
  if (run.underline) rPrAttrs["u"] = "sng";
  if (run.fontSize !== undefined) rPrAttrs["sz"] = String(run.fontSize);

  const rPrChildren: XmlElement[] = [];
  if (run.fontColor !== undefined) {
    rPrChildren.push(
      el("a:solidFill", {}, renderColor(run.fontColor)),
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
