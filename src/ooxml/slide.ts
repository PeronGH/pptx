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
import {
  AUTO_NUMBER_SCHEMES,
  type AutoNumberScheme,
  PRESET_GEOMETRIES,
  type PresetGeometry,
  type TextLevel,
  UNDERLINE_STYLES,
  type UnderlineStyle,
} from "./enums.ts";
import { NS_A, NS_C, NS_P, NS_R } from "./namespaces.ts";
import {
  coordinate,
  enumeration,
  lineWidth,
  minOccurs,
  percentage,
  positiveCoordinate,
  positiveFixedAngle,
  positiveFixedPercentage,
  textFontSize,
  textIndent,
  textIndentLevel,
  textMargin,
  textPoint,
  textSpacingPercent,
  textSpacingPoint,
} from "./simple_types.ts";

/** Solid color fill. */
export interface SolidFill {
  readonly kind: "solid";
  readonly color: HexColor;
  readonly alpha?: Percentage;
}

/** Linear gradient stop. */
export interface GradientStop {
  readonly pos: Percentage;
  readonly color: HexColor;
  readonly alpha?: Percentage;
}

/** Linear gradient fill. */
export interface LinearGradientFill {
  readonly kind: "linear-gradient";
  readonly angle: number;
  readonly stops: readonly [GradientStop, GradientStop, ...GradientStop[]];
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
/**
 * How a text body relates to its frame. `"none"` (the default) keeps the
 * frame. `"resize-shape"` lets consumers grow the shape to fit its text:
 * LibreOffice does so when rendering, PowerPoint only once the text is
 * edited, so a LibreOffice render will not match PowerPoint. Shrinking text
 * to fit is deliberately unsupported for the same reason.
 */
export type TextFit = "none" | "resize-shape";

/** Simple outer shadow effect. */
export interface Shadow {
  readonly color: HexColor;
  readonly blur: Emu;
  readonly distance: Emu;
  readonly angle: number;
  readonly alpha?: Percentage;
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

/** Character formatting for a text run (§21.1.2.3.9 `a:rPr`). */
export interface TextRunStyle {
  readonly bold?: boolean;
  readonly italic?: boolean;
  /** `true` for a single underline, or a specific underline style. */
  readonly underline?: boolean | UnderlineStyle;
  /** `true` for a single strikethrough line, `"double"` for two. */
  readonly strike?: boolean | "double";
  /**
   * Vertical offset: `"superscript"` and `"subscript"` match PowerPoint's
   * buttons; a percentage of the font size (`u.pct(30)`) sets it exactly.
   */
  readonly baseline?: "superscript" | "subscript" | Percentage;
  /** Background highlight color. */
  readonly highlight?: HexColor;
  /** Extra space between characters; negative values condense. */
  readonly characterSpacing?: Emu;
  /** Show lowercase letters as capitals (`"all"`) or small capitals. */
  readonly caps?: "all" | "small";
  readonly fontSize?: HundredthPoint;
  readonly fontColor?: HexColor;
  readonly fontFamily?: string;
}

/** A text run. */
export interface TextRun extends TextRunStyle {
  readonly text: string;
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
  readonly type: AutoNumberScheme;
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

/**
 * Line spacing: a multiple of single spacing (`{ multiple: 1.5 }`) or an
 * exact line height (`{ exactly: u.pt(24) }`).
 */
export type LineSpacing =
  | { readonly multiple: number }
  | { readonly exactly: Emu };

/** A text paragraph. */
export interface TextParagraph {
  readonly runs: ReadonlyArray<TextRun>;
  readonly level?: TextLevel;
  readonly alignment?: "l" | "ctr" | "r" | "just";
  readonly bullet?: Bullet;
  readonly spacing?: ParagraphSpacing;
  readonly lineSpacing?: LineSpacing;
}

/** Vertical alignment for text bodies. */
export type VerticalAlignment = "t" | "ctr" | "b";

/** Shape-backed text box. */
export interface TextBoxShape {
  readonly kind: "textbox";
  /** Shape name (`p:cNvPr/@name`); defaults to a kind-and-id name. */
  readonly name?: string;
  /**
   * Write the text box as the slide's title placeholder (§19.3.1.36 `p:ph`),
   * so PowerPoint's outline, navigation, and screen readers see the title.
   */
  readonly placeholder?: "title";
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
  readonly paragraphs: ReadonlyArray<TextParagraph>;
  readonly fill?: Fill;
  readonly line?: LineProperties;
  readonly verticalAlignment?: VerticalAlignment;
  readonly padding?: Insets;
  readonly fit?: TextFit;
  readonly shadow?: Shadow;
}

/** Preset shape. */
export interface PresetShape {
  readonly kind: "preset";
  /** Shape name (`p:cNvPr/@name`); defaults to a kind-and-id name. */
  readonly name?: string;
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
  readonly preset: PresetGeometry;
  readonly paragraphs?: ReadonlyArray<TextParagraph>;
  readonly fill?: Fill;
  readonly line?: LineProperties;
  readonly verticalAlignment?: VerticalAlignment;
  readonly padding?: Insets;
  readonly fit?: TextFit;
  readonly shadow?: Shadow;
}

/** Picture shape. */
export interface PictureShape {
  readonly kind: "picture";
  /** Shape name (`p:cNvPr/@name`); defaults to a kind-and-id name. */
  readonly name?: string;
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
  readonly rId: string;
  readonly description?: string;
  readonly crop?: CropRect;
  readonly alpha?: Percentage;
}

/** A table cell. */
export interface TableCell {
  readonly paragraphs: ReadonlyArray<TextParagraph>;
  /** Grid columns spanned by this cell (`gridSpan`). */
  readonly gridSpan?: number;
  /** Rows spanned by this cell (`rowSpan`). */
  readonly rowSpan?: number;
  /** Merged into the cell to the left (`hMerge`). */
  readonly hMerge?: boolean;
  /** Merged into the cell above (`vMerge`). */
  readonly vMerge?: boolean;
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
  /** Shape name (`p:cNvPr/@name`); defaults to a kind-and-id name. */
  readonly name?: string;
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
  readonly columns: ReadonlyArray<Emu>;
  readonly rows: ReadonlyArray<TableRow>;
}

/** Graphic-frame-backed chart. */
export interface ChartShape {
  readonly kind: "chart";
  /** Shape name (`p:cNvPr/@name`); defaults to a kind-and-id name. */
  readonly name?: string;
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
  readonly rId: string;
}

/** A picture used as the slide background. */
export interface BackgroundImage {
  readonly rId: string;
  readonly crop?: CropRect;
  /** Insets of the stretched image from the slide edges (`a:fillRect`). */
  readonly inset?: CropRect;
  readonly alpha?: Percentage;
}

/** Slide background: a fill or a picture. */
export type SlideBackground =
  | { readonly fill: Fill }
  | { readonly image: BackgroundImage };

/** Union of all shape types on a slide. */
export type SlideShape =
  | TextBoxShape
  | PresetShape
  | PictureShape
  | TableShape
  | ChartShape;

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
      case "chart":
        return renderChart(id, shape);
    }
  });

  const cSldChildren: XmlElement[] = [];
  if (background) {
    cSldChildren.push(
      el(
        "p:bg",
        {},
        el(
          "p:bgPr",
          {},
          "fill" in background
            ? renderFill(background.fill)
            : renderBackgroundImage(background.image),
        ),
      ),
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

interface Placement {
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
}

function renderTransform(tag: "a:xfrm" | "p:xfrm", shape: Placement) {
  return el(
    tag,
    {},
    el("a:off", { x: coordinate(shape.x, "x"), y: coordinate(shape.y, "y") }),
    el("a:ext", {
      cx: positiveCoordinate(shape.cx, "width"),
      cy: positiveCoordinate(shape.cy, "height"),
    }),
  );
}

function renderColor(color: HexColor, alpha?: Percentage): XmlElement {
  const children: XmlElement[] = [];
  if (alpha !== undefined) {
    children.push(
      el("a:alpha", { val: positiveFixedPercentage(alpha, "alpha") }),
    );
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
          ...minOccurs(fill.stops, 2, "gradient stops").map((stop) =>
            el(
              "a:gs",
              { pos: positiveFixedPercentage(stop.pos, "gradient stop") },
              renderColor(stop.color, stop.alpha),
            )
          ),
        ),
        el("a:lin", { ang: positiveFixedAngle(fill.angle), scaled: "1" }),
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
  if (line.width !== undefined) attrs["w"] = lineWidth(line.width);
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
        blurRad: positiveCoordinate(shadow.blur, "shadow blur"),
        dist: positiveCoordinate(shadow.distance, "shadow distance"),
        dir: positiveFixedAngle(shadow.angle),
        rotWithShape: "0",
      },
      renderColor(shadow.color, shadow.alpha),
    ),
  );
}

function renderRelativeRect(
  tag: "a:srcRect" | "a:fillRect",
  rect: CropRect | undefined,
): XmlElement {
  const side = (value: Percentage | undefined) =>
    value === undefined || value === 0 ? undefined : percentage(value, tag);
  return el(tag, {
    l: side(rect?.left),
    t: side(rect?.top),
    r: side(rect?.right),
    b: side(rect?.bottom),
  });
}

/** `a:blip` with optional opacity, plus source crop and stretch insets. */
function renderBlipFillContent(
  rId: string,
  alpha: Percentage | undefined,
  crop: CropRect | undefined,
  inset?: CropRect,
): ReadonlyArray<XmlElement> {
  return [
    el(
      "a:blip",
      { "r:embed": rId },
      alpha === undefined ? undefined : el("a:alphaModFix", {
        amt: positiveFixedPercentage(alpha, "image alpha"),
      }),
    ),
    ...(crop ? [renderRelativeRect("a:srcRect", crop)] : []),
    el("a:stretch", {}, renderRelativeRect("a:fillRect", inset)),
  ];
}

function renderBackgroundImage(image: BackgroundImage): XmlElement {
  return el(
    "a:blipFill",
    { dpi: "0", rotWithShape: "1" },
    ...renderBlipFillContent(image.rId, image.alpha, image.crop, image.inset),
  );
}

function renderTextFit(fit: TextFit | undefined): XmlElement | undefined {
  switch (fit) {
    case "none":
      return el("a:noAutofit", {});
    case "resize-shape":
      return el("a:spAutoFit", {});
    case undefined:
      return undefined;
  }
}

function renderBodyPr(
  attrs: Record<string, string>,
  padding: Insets | undefined,
  fit: TextFit | undefined,
): XmlElement {
  const bodyAttrs: Record<string, string> = { ...attrs };
  if (padding?.left !== undefined) bodyAttrs["lIns"] = textMargin(padding.left);
  if (padding?.right !== undefined) {
    bodyAttrs["rIns"] = textMargin(padding.right);
  }
  if (padding?.top !== undefined) bodyAttrs["tIns"] = textMargin(padding.top);
  if (padding?.bottom !== undefined) {
    bodyAttrs["bIns"] = textMargin(padding.bottom);
  }
  return el("a:bodyPr", bodyAttrs, renderTextFit(fit));
}

function renderTextBoxSp(id: number, shape: TextBoxShape): XmlElement {
  const spPrChildren: XmlElement[] = [
    renderTransform("a:xfrm", shape),
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
      el("p:cNvPr", {
        id: String(id),
        name: shape.name ??
          `${shape.placeholder === "title" ? "Title" : "TextBox"} ${id}`,
      }),
      shape.placeholder === "title"
        ? el("p:cNvSpPr", {}, el("a:spLocks", { noGrp: "1" }))
        : el("p:cNvSpPr", { txBox: "1" }),
      el(
        "p:nvPr",
        {},
        shape.placeholder && el("p:ph", { type: shape.placeholder }),
      ),
    ),
    el("p:spPr", {}, ...spPrChildren),
    el(
      "p:txBody",
      {},
      renderBodyPr(bodyPrAttrs, shape.padding, shape.fit),
      el("a:lstStyle", {}),
      ...shape.paragraphs.map(renderParagraph),
    ),
  );
}

function renderPresetSp(id: number, shape: PresetShape): XmlElement {
  const spPrChildren: XmlElement[] = [
    renderTransform("a:xfrm", shape),
    el("a:prstGeom", {
      prst: enumeration(shape.preset, PRESET_GEOMETRIES, "preset geometry"),
    }, el("a:avLst", {})),
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
      el("p:cNvPr", { id: String(id), name: shape.name ?? `Shape ${id}` }),
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
        renderBodyPr(bodyPrAttrs, shape.padding, shape.fit),
        el("a:lstStyle", {}),
        ...paragraphs.map(renderParagraph),
      ),
    );
  }

  return el("p:sp", {}, ...children);
}

function renderPicture(id: number, shape: PictureShape): XmlElement {
  const desc = shape.description ?? "";
  return el(
    "p:pic",
    {},
    el(
      "p:nvPicPr",
      {},
      el("p:cNvPr", {
        id: String(id),
        name: shape.name ?? `Picture ${id}`,
        descr: desc,
      }),
      el("p:cNvPicPr", {}, el("a:picLocks", { noChangeAspect: "1" })),
      el("p:nvPr", {}),
    ),
    el(
      "p:blipFill",
      {},
      ...renderBlipFillContent(shape.rId, shape.alpha, shape.crop),
    ),
    el(
      "p:spPr",
      {},
      renderTransform("a:xfrm", shape),
      el("a:prstGeom", { prst: "rect" }, el("a:avLst", {})),
    ),
  );
}

const TABLE_URI = "http://schemas.openxmlformats.org/drawingml/2006/table";
const CHART_URI = "http://schemas.openxmlformats.org/drawingml/2006/chart";

function renderTable(id: number, shape: TableShape): XmlElement {
  const gridCols = shape.columns.map((w) =>
    el("a:gridCol", { w: positiveCoordinate(w, "column width") })
  );

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
        tcPrAttrs["marL"] = textMargin(cell.padding.left);
      }
      if (cell.padding?.right !== undefined) {
        tcPrAttrs["marR"] = textMargin(cell.padding.right);
      }
      if (cell.padding?.top !== undefined) {
        tcPrAttrs["marT"] = textMargin(cell.padding.top);
      }
      if (cell.padding?.bottom !== undefined) {
        tcPrAttrs["marB"] = textMargin(cell.padding.bottom);
      }
      if (cell.verticalAlignment) tcPrAttrs["anchor"] = cell.verticalAlignment;
      const tcPrChildren: XmlElement[] = [];
      // CT_TableCellProperties order: lnL, lnR, lnT, lnB, ..., fill.
      if (cell.line) {
        const tags = ["a:lnL", "a:lnR", "a:lnT", "a:lnB"] as const;
        for (const tag of tags) {
          const lineEl = renderLine(cell.line, tag);
          if (lineEl) tcPrChildren.push(lineEl);
        }
      }
      if (cell.fill) {
        const fillEl = renderFill(cell.fill);
        if (fillEl) tcPrChildren.push(fillEl);
      }
      if (Object.keys(tcPrAttrs).length > 0 || tcPrChildren.length > 0) {
        tcChildren.push(el("a:tcPr", tcPrAttrs, ...tcPrChildren));
      }
      // CT_TableCell (§21.1.3.16): merges are spans on the first cell plus
      // hMerge/vMerge on every grid slot it covers.
      return el("a:tc", {
        gridSpan: cell.gridSpan !== undefined && cell.gridSpan > 1
          ? String(cell.gridSpan)
          : undefined,
        rowSpan: cell.rowSpan !== undefined && cell.rowSpan > 1
          ? String(cell.rowSpan)
          : undefined,
        hMerge: cell.hMerge ? "1" : undefined,
        vMerge: cell.vMerge ? "1" : undefined,
      }, ...tcChildren);
    });
    return el(
      "a:tr",
      { h: positiveCoordinate(row.height, "row height") },
      ...cells,
    );
  });

  return el(
    "p:graphicFrame",
    {},
    el(
      "p:nvGraphicFramePr",
      {},
      el("p:cNvPr", { id: String(id), name: shape.name ?? `Table ${id}` }),
      el("p:cNvGraphicFramePr", {}, el("a:graphicFrameLocks", { noGrp: "1" })),
      el("p:nvPr", {}),
    ),
    renderTransform("p:xfrm", shape),
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

function renderChart(id: number, shape: ChartShape): XmlElement {
  return el(
    "p:graphicFrame",
    {},
    el(
      "p:nvGraphicFramePr",
      {},
      el("p:cNvPr", { id: String(id), name: shape.name ?? `Chart ${id}` }),
      el("p:cNvGraphicFramePr", {}, el("a:graphicFrameLocks", { noGrp: "1" })),
      el("p:nvPr", {}),
    ),
    renderTransform("p:xfrm", shape),
    el(
      "a:graphic",
      {},
      el(
        "a:graphicData",
        { uri: CHART_URI },
        el("c:chart", { "xmlns:c": NS_C, "r:id": shape.rId }),
      ),
    ),
  );
}

const BULLET_INDENT = 228600;
const LEVEL_INDENT = 457200;

function renderParagraph(para: TextParagraph): XmlElement {
  const children: XmlElement[] = [];

  const hasPPr = para.level !== undefined || para.alignment !== undefined ||
    para.bullet !== undefined || para.spacing !== undefined ||
    para.lineSpacing !== undefined;

  if (hasPPr) {
    const pPrAttrs: Record<string, string | undefined> = {};
    if (para.bullet && para.bullet.kind !== "none") {
      // Hanging indent so the bullet sits left of the text, using the
      // per-level margins of PowerPoint's default body style.
      const level = para.level ?? 0;
      pPrAttrs["marL"] = textMargin(
        (BULLET_INDENT + level * LEVEL_INDENT) as Emu,
      );
      pPrAttrs["indent"] = textIndent(-BULLET_INDENT as Emu);
    }
    if (para.level !== undefined) pPrAttrs["lvl"] = textIndentLevel(para.level);
    if (para.alignment !== undefined) pPrAttrs["algn"] = para.alignment;

    // CT_TextParagraphProperties order: lnSpc, spcBef, spcAft, bullets.
    const pPrChildren: XmlElement[] = [];

    if (para.lineSpacing !== undefined) {
      pPrChildren.push(
        el(
          "a:lnSpc",
          {},
          "multiple" in para.lineSpacing
            ? el("a:spcPct", {
              val: textSpacingPercent(para.lineSpacing.multiple),
            })
            : el("a:spcPts", {
              val: textSpacingPoint(para.lineSpacing.exactly),
            }),
        ),
      );
    }

    if (para.spacing?.before !== undefined) {
      pPrChildren.push(
        el(
          "a:spcBef",
          {},
          el("a:spcPts", { val: textSpacingPoint(para.spacing.before) }),
        ),
      );
    }
    if (para.spacing?.after !== undefined) {
      pPrChildren.push(
        el(
          "a:spcAft",
          {},
          el("a:spcPts", { val: textSpacingPoint(para.spacing.after) }),
        ),
      );
    }

    if (para.bullet) {
      switch (para.bullet.kind) {
        case "char":
          pPrChildren.push(el("a:buChar", { char: para.bullet.char }));
          break;
        case "autonum":
          pPrChildren.push(el("a:buAutoNum", {
            type: enumeration(
              para.bullet.type,
              AUTO_NUMBER_SCHEMES,
              "auto-number scheme",
            ),
          }));
          break;
        case "none":
          pPrChildren.push(el("a:buNone", {}));
          break;
      }
    }

    children.push(el("a:pPr", pPrAttrs, ...pPrChildren));
  }

  for (const run of para.runs) {
    children.push(...renderTextRun(run));
  }

  return el("a:p", {}, ...children);
}

function renderTextRun(run: TextRun): ReadonlyArray<XmlElement> {
  const rPrAttrs: Record<string, string | undefined> = {};
  if (run.bold) rPrAttrs["b"] = "1";
  if (run.italic) rPrAttrs["i"] = "1";
  if (run.underline) {
    rPrAttrs["u"] = run.underline === true
      ? "sng"
      : enumeration(run.underline, UNDERLINE_STYLES, "underline style");
  }
  if (run.strike) {
    rPrAttrs["strike"] = run.strike === "double" ? "dblStrike" : "sngStrike";
  }
  if (run.caps) rPrAttrs["cap"] = run.caps;
  if (run.characterSpacing !== undefined) {
    rPrAttrs["spc"] = textPoint(run.characterSpacing);
  }
  if (run.baseline !== undefined) {
    // PowerPoint's superscript and subscript buttons use these offsets.
    rPrAttrs["baseline"] = run.baseline === "superscript"
      ? "30000"
      : run.baseline === "subscript"
      ? "-25000"
      : percentage(run.baseline, "baseline");
  }
  if (run.fontSize !== undefined) rPrAttrs["sz"] = textFontSize(run.fontSize);

  // CT_TextCharacterProperties order: fill, effectLst, highlight, ..., latin,
  // ea, cs, ..., hlinkClick.
  const rPrChildren: XmlElement[] = [];
  if (run.fontColor !== undefined) {
    rPrChildren.push(
      el("a:solidFill", {}, renderColor(run.fontColor)),
    );
  }
  if (run.highlight !== undefined) {
    rPrChildren.push(el("a:highlight", {}, renderColor(run.highlight)));
  }
  if (run.fontFamily !== undefined) {
    rPrChildren.push(
      el("a:latin", { typeface: run.fontFamily }),
      el("a:cs", { typeface: run.fontFamily }),
    );
  }
  if (run.hyperlink) {
    rPrChildren.push(el("a:hlinkClick", { "r:id": run.hyperlink.rId }));
  }

  const hasRunProps = Object.keys(rPrAttrs).length > 0 ||
    rPrChildren.length > 0;
  const rPr = () =>
    hasRunProps ? el("a:rPr", rPrAttrs, ...rPrChildren) : undefined;

  // DrawingML models line breaks as a:br (§21.1.2.2.1), not as newlines in
  // a:t. Vertical tab is PowerPoint's own soft-return character.
  const segments = run.text.split(LINE_BREAK);
  return segments.flatMap((segment, index) => {
    const parts: XmlElement[] = [];
    if (segment !== "" || segments.length === 1) {
      parts.push(el("a:r", {}, rPr(), el("a:t", {}, segment)));
    }
    if (index < segments.length - 1) parts.push(el("a:br", {}, rPr()));
    return parts;
  });
}

const LINE_BREAK = /\r\n|[\n\r\v\u2028]/;
