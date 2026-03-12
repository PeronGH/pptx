/**
 * Chart part XML generation.
 */

import { el, renderXmlDocument } from "../xml.ts";
import type { Emu, HexColor } from "../types.ts";
import { NS_A, NS_C, NS_R } from "./namespaces.ts";

/** A normalized chart point. */
export interface ChartPoint {
  readonly category: string;
  readonly value: number;
}

/** Optional value-axis bounds. */
export interface ChartValueAxis {
  readonly min?: number;
  readonly max?: number;
}

/** Internal chart definition. */
export interface ChartDefinition {
  readonly type: "bar";
  readonly title?: string;
  readonly seriesName: string;
  readonly points: ReadonlyArray<ChartPoint>;
  readonly color?: HexColor;
  readonly labels: boolean;
  readonly legend: boolean;
  readonly direction: "column" | "bar";
  readonly valueAxis?: ChartValueAxis;
}

/** Graphic-frame-backed chart shape on a slide. */
export interface ChartShape {
  readonly kind: "chart";
  readonly x: Emu;
  readonly y: Emu;
  readonly cx: Emu;
  readonly cy: Emu;
  readonly rId: string;
}

const AXIS_CATEGORY_ID = 100000;
const AXIS_VALUE_ID = 100001;

function renderSeriesColor(color: HexColor | undefined) {
  if (!color) return undefined;
  return el(
    "c:spPr",
    {},
    el("a:solidFill", {}, el("a:srgbClr", { val: color })),
    el("a:ln", {}, el("a:noFill", {})),
  );
}

function renderStrCache(points: ReadonlyArray<ChartPoint>) {
  return el(
    "c:strCache",
    {},
    el("c:ptCount", { val: String(points.length) }),
    ...points.map((point, index) =>
      el("c:pt", { idx: String(index) }, el("c:v", {}, point.category))
    ),
  );
}

function renderNumCache(points: ReadonlyArray<ChartPoint>) {
  return el(
    "c:numCache",
    {},
    el("c:formatCode", {}, "General"),
    el("c:ptCount", { val: String(points.length) }),
    ...points.map((point, index) =>
      el("c:pt", { idx: String(index) }, el("c:v", {}, String(point.value)))
    ),
  );
}

function workbookRange(column: "A" | "B", count: number): string {
  return `Sheet1!$${column}$2:$${column}$${count + 1}`;
}

function renderDataLabels(direction: "column" | "bar") {
  return el(
    "c:dLbls",
    {},
    el("c:showLegendKey", { val: "0" }),
    el("c:showVal", { val: "1" }),
    el("c:showCatName", { val: "0" }),
    el("c:showSerName", { val: "0" }),
    el("c:showPercent", { val: "0" }),
    el("c:showBubbleSize", { val: "0" }),
    el("c:dLblPos", { val: direction === "column" ? "outEnd" : "r" }),
  );
}

function renderChartTitle(title: string) {
  return el(
    "c:title",
    {},
    el(
      "c:tx",
      {},
      el(
        "c:rich",
        {},
        el("a:bodyPr", {}),
        el("a:lstStyle", {}),
        el(
          "a:p",
          {},
          el(
            "a:r",
            {},
            el("a:rPr", { lang: "en-US", sz: "1400", b: "1" }),
            el("a:t", {}, title),
          ),
        ),
      ),
    ),
  );
}

function renderCategoryAxis(direction: "column" | "bar") {
  return el(
    "c:catAx",
    {},
    el("c:axId", { val: String(AXIS_CATEGORY_ID) }),
    el("c:scaling", {}, el("c:orientation", { val: "minMax" })),
    el("c:delete", { val: "0" }),
    el("c:axPos", { val: direction === "column" ? "b" : "l" }),
    el("c:numFmt", { formatCode: "General", sourceLinked: "1" }),
    el("c:majorTickMark", { val: "none" }),
    el("c:minorTickMark", { val: "none" }),
    el("c:tickLblPos", { val: "nextTo" }),
    el("c:crossAx", { val: String(AXIS_VALUE_ID) }),
    el("c:crosses", { val: "autoZero" }),
    el("c:auto", { val: "1" }),
    el("c:lblAlgn", { val: "ctr" }),
    el("c:lblOffset", { val: "100" }),
    el("c:noMultiLvlLbl", { val: "0" }),
  );
}

function renderValueAxis(definition: ChartDefinition) {
  const scalingChildren = [el("c:orientation", { val: "minMax" })];
  if (definition.valueAxis?.max !== undefined) {
    scalingChildren.push(
      el("c:max", { val: String(definition.valueAxis.max) }),
    );
  }
  if (definition.valueAxis?.min !== undefined) {
    scalingChildren.push(
      el("c:min", { val: String(definition.valueAxis.min) }),
    );
  }

  return el(
    "c:valAx",
    {},
    el("c:axId", { val: String(AXIS_VALUE_ID) }),
    el("c:scaling", {}, ...scalingChildren),
    el("c:delete", { val: "0" }),
    el("c:axPos", { val: definition.direction === "column" ? "l" : "b" }),
    el("c:majorGridlines", {}),
    el("c:numFmt", { formatCode: "General", sourceLinked: "1" }),
    el("c:majorTickMark", { val: "none" }),
    el("c:minorTickMark", { val: "none" }),
    el("c:tickLblPos", { val: "nextTo" }),
    el("c:crossAx", { val: String(AXIS_CATEGORY_ID) }),
    el("c:crosses", { val: "autoZero" }),
    el("c:crossBetween", { val: "between" }),
  );
}

function renderLegend() {
  return el(
    "c:legend",
    {},
    el("c:legendPos", { val: "r" }),
    el("c:overlay", { val: "0" }),
  );
}

/** Generate a bar/column chart part. */
export function renderChartSpace(
  definition: ChartDefinition,
  workbookRelId: string,
): string {
  const series = el(
    "c:ser",
    {},
    el("c:idx", { val: "0" }),
    el("c:order", { val: "0" }),
    el(
      "c:tx",
      {},
      el(
        "c:strRef",
        {},
        el("c:f", {}, "Sheet1!$B$1"),
        el(
          "c:strCache",
          {},
          el("c:ptCount", { val: "1" }),
          el("c:pt", { idx: "0" }, el("c:v", {}, definition.seriesName)),
        ),
      ),
    ),
    renderSeriesColor(definition.color),
    el(
      "c:cat",
      {},
      el(
        "c:strRef",
        {},
        el("c:f", {}, workbookRange("A", definition.points.length)),
        renderStrCache(definition.points),
      ),
    ),
    el(
      "c:val",
      {},
      el(
        "c:numRef",
        {},
        el("c:f", {}, workbookRange("B", definition.points.length)),
        renderNumCache(definition.points),
      ),
    ),
  );

  const plotAreaChildren = [
    el("c:layout", {}),
    el(
      "c:barChart",
      {},
      el("c:barDir", {
        val: definition.direction === "column" ? "col" : "bar",
      }),
      el("c:grouping", { val: "clustered" }),
      el("c:varyColors", { val: "0" }),
      series,
      definition.labels ? renderDataLabels(definition.direction) : undefined,
      el("c:gapWidth", { val: "60" }),
      el("c:axId", { val: String(AXIS_CATEGORY_ID) }),
      el("c:axId", { val: String(AXIS_VALUE_ID) }),
    ),
    renderCategoryAxis(definition.direction),
    renderValueAxis(definition),
  ];

  const root = el(
    "c:chartSpace",
    {
      "xmlns:c": NS_C,
      "xmlns:a": NS_A,
      "xmlns:r": NS_R,
    },
    el("c:date1904", { val: "0" }),
    el("c:lang", { val: "en-US" }),
    el("c:roundedCorners", { val: "0" }),
    el(
      "c:chart",
      {},
      definition.title ? renderChartTitle(definition.title) : undefined,
      el(
        "c:plotArea",
        {},
        ...plotAreaChildren,
      ),
      definition.legend ? renderLegend() : undefined,
      el("c:plotVisOnly", { val: "1" }),
      el("c:dispBlanksAs", { val: "gap" }),
      el("c:showDLblsOverMax", { val: "0" }),
    ),
    el(
      "c:externalData",
      { "r:id": workbookRelId },
      el("c:autoUpdate", { val: "0" }),
    ),
  );

  return renderXmlDocument(root);
}
