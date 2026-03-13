/**
 * Chart part XML generation.
 */

import { el, renderXmlDocument } from "../xml.ts";
import type { Emu, HexColor } from "../types.ts";
import { NS_A, NS_C, NS_R } from "./namespaces.ts";

/** A normalized chart series. */
export interface ChartSeriesDefinition {
  readonly name: string;
  readonly values: ReadonlyArray<number>;
  readonly color?: HexColor;
}

/** Shared legend positions. */
export type ChartLegendPosition = "right" | "bottom" | "top" | "left";

/** Normalized legend options. */
export interface ChartLegendDefinition {
  readonly show: boolean;
  readonly position: ChartLegendPosition;
}

/** Shared title-only axis options. */
export interface ChartAxisDefinition {
  readonly title?: string;
}

/** Optional value-axis bounds and title. */
export interface ChartValueAxisDefinition extends ChartAxisDefinition {
  readonly min?: number;
  readonly max?: number;
}

interface ChartDefinitionBase {
  readonly title?: string;
  readonly categories: ReadonlyArray<string>;
  readonly labels: boolean;
  readonly legend: ChartLegendDefinition;
}

/** Internal bar chart definition. */
export interface BarChartDefinition extends ChartDefinitionBase {
  readonly type: "bar";
  readonly series: readonly [
    ChartSeriesDefinition,
    ...ReadonlyArray<ChartSeriesDefinition>,
  ];
  readonly direction: "column" | "bar";
  readonly categoryAxis?: ChartAxisDefinition;
  readonly valueAxis?: ChartValueAxisDefinition;
}

/** Internal line chart definition. */
export interface LineChartDefinition extends ChartDefinitionBase {
  readonly type: "line";
  readonly series: readonly [
    ChartSeriesDefinition,
    ...ReadonlyArray<ChartSeriesDefinition>,
  ];
  readonly markers: boolean;
  readonly categoryAxis?: ChartAxisDefinition;
  readonly valueAxis?: ChartValueAxisDefinition;
}

/** Internal pie chart definition. */
export interface PieChartDefinition extends ChartDefinitionBase {
  readonly type: "pie";
  readonly series: readonly [ChartSeriesDefinition];
}

/** Internal donut chart definition. */
export interface DonutChartDefinition extends ChartDefinitionBase {
  readonly type: "donut";
  readonly series: readonly [ChartSeriesDefinition];
  readonly holeSize: number;
}

/** Internal chart definition union. */
export type ChartDefinition =
  | BarChartDefinition
  | LineChartDefinition
  | PieChartDefinition
  | DonutChartDefinition;

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

function columnName(index: number): string {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function workbookRange(columnIndex: number, count: number): string {
  const column = columnName(columnIndex);
  return `Sheet1!$${column}$2:$${column}$${count + 1}`;
}

function seriesTitleRef(index: number): string {
  return `Sheet1!$${columnName(index + 1)}$1`;
}

function renderBarSeriesColor(color: HexColor | undefined) {
  if (!color) return undefined;
  return el(
    "c:spPr",
    {},
    el("a:solidFill", {}, el("a:srgbClr", { val: color })),
    el("a:ln", {}, el("a:noFill", {})),
  );
}

function renderLineSeriesColor(color: HexColor | undefined) {
  if (!color) return undefined;
  return el(
    "c:spPr",
    {},
    el(
      "a:ln",
      {},
      el("a:solidFill", {}, el("a:srgbClr", { val: color })),
    ),
  );
}

function renderStrCache(categories: ReadonlyArray<string>) {
  return el(
    "c:strCache",
    {},
    el("c:ptCount", { val: String(categories.length) }),
    ...categories.map((category, index) =>
      el("c:pt", { idx: String(index) }, el("c:v", {}, category))
    ),
  );
}

function renderNumCache(values: ReadonlyArray<number>) {
  return el(
    "c:numCache",
    {},
    el("c:formatCode", {}, "General"),
    el("c:ptCount", { val: String(values.length) }),
    ...values.map((value, index) =>
      el("c:pt", { idx: String(index) }, el("c:v", {}, String(value)))
    ),
  );
}

function legendPosValue(position: ChartLegendPosition): "r" | "b" | "t" | "l" {
  switch (position) {
    case "right":
      return "r";
    case "bottom":
      return "b";
    case "top":
      return "t";
    case "left":
      return "l";
  }
}

function renderAxisTitle(title: string) {
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
        el("a:p", {}, el("a:r", {}, el("a:t", {}, title))),
      ),
    ),
    el("c:layout", {}),
    el("c:overlay", { val: "0" }),
  );
}

function renderChartTitle(title: string) {
  return renderAxisTitle(title);
}

function renderLegend(legend: ChartLegendDefinition) {
  return el(
    "c:legend",
    {},
    el("c:legendPos", { val: legendPosValue(legend.position) }),
    el("c:layout", {}),
    el("c:overlay", { val: "0" }),
  );
}

function renderAxisDataLabels(kind: "bar" | "line") {
  return el(
    "c:dLbls",
    {},
    el("c:showLegendKey", { val: "0" }),
    el("c:showVal", { val: "1" }),
    el("c:showCatName", { val: "0" }),
    el("c:showSerName", { val: "0" }),
    el("c:showPercent", { val: "0" }),
    el("c:showBubbleSize", { val: "0" }),
    kind === "bar"
      ? el("c:dLblPos", { val: "outEnd" })
      : el("c:showLeaderLines", { val: "1" }),
  );
}

function renderCircularDataLabels() {
  return el(
    "c:dLbls",
    {},
    el("c:showLegendKey", { val: "0" }),
    el("c:showVal", { val: "1" }),
    el("c:showCatName", { val: "0" }),
    el("c:showSerName", { val: "0" }),
    el("c:showPercent", { val: "0" }),
    el("c:showBubbleSize", { val: "0" }),
    el("c:showLeaderLines", { val: "1" }),
  );
}

function renderSeriesText(index: number, name: string) {
  return el(
    "c:tx",
    {},
    el(
      "c:strRef",
      {},
      el("c:f", {}, seriesTitleRef(index)),
      el(
        "c:strCache",
        {},
        el("c:ptCount", { val: "1" }),
        el("c:pt", { idx: "0" }, el("c:v", {}, name)),
      ),
    ),
  );
}

function renderCategoryRef(categories: ReadonlyArray<string>) {
  return el(
    "c:cat",
    {},
    el(
      "c:strRef",
      {},
      el("c:f", {}, workbookRange(0, categories.length)),
      renderStrCache(categories),
    ),
  );
}

function renderValueRef(
  values: ReadonlyArray<number>,
  seriesIndex: number,
) {
  return el(
    "c:val",
    {},
    el(
      "c:numRef",
      {},
      el("c:f", {}, workbookRange(seriesIndex + 1, values.length)),
      renderNumCache(values),
    ),
  );
}

function renderBarSeries(
  definition: BarChartDefinition,
  series: ChartSeriesDefinition,
  index: number,
) {
  return el(
    "c:ser",
    {},
    el("c:idx", { val: String(index) }),
    el("c:order", { val: String(index) }),
    renderSeriesText(index, series.name),
    renderBarSeriesColor(series.color),
    renderCategoryRef(definition.categories),
    renderValueRef(series.values, index),
  );
}

function renderLineSeries(
  definition: LineChartDefinition,
  series: ChartSeriesDefinition,
  index: number,
) {
  return el(
    "c:ser",
    {},
    el("c:idx", { val: String(index) }),
    el("c:order", { val: String(index) }),
    renderSeriesText(index, series.name),
    definition.markers
      ? undefined
      : el("c:marker", {}, el("c:symbol", { val: "none" })),
    renderLineSeriesColor(series.color),
    renderCategoryRef(definition.categories),
    renderValueRef(series.values, index),
    el("c:smooth", { val: "0" }),
  );
}

function renderPieSeries(
  definition: PieChartDefinition | DonutChartDefinition,
  series: ChartSeriesDefinition,
  index: number,
) {
  return el(
    "c:ser",
    {},
    el("c:idx", { val: String(index) }),
    el("c:order", { val: String(index) }),
    renderSeriesText(index, series.name),
    renderBarSeriesColor(series.color),
    renderCategoryRef(definition.categories),
    renderValueRef(series.values, index),
  );
}

function renderCategoryAxis(
  definition: BarChartDefinition | LineChartDefinition,
) {
  return el(
    "c:catAx",
    {},
    el("c:axId", { val: String(AXIS_CATEGORY_ID) }),
    el("c:scaling", {}, el("c:orientation", { val: "minMax" })),
    el("c:delete", { val: "0" }),
    el("c:axPos", { val: "b" }),
    definition.categoryAxis?.title
      ? renderAxisTitle(definition.categoryAxis.title)
      : undefined,
    el("c:majorTickMark", { val: "out" }),
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

function renderValueAxis(definition: BarChartDefinition | LineChartDefinition) {
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
    el("c:axPos", { val: "l" }),
    el("c:majorGridlines", {}),
    definition.valueAxis?.title
      ? renderAxisTitle(definition.valueAxis.title)
      : undefined,
    el("c:majorTickMark", { val: "out" }),
    el("c:minorTickMark", { val: "none" }),
    el("c:tickLblPos", { val: "nextTo" }),
    el("c:crossAx", { val: String(AXIS_CATEGORY_ID) }),
    el("c:crosses", { val: "autoZero" }),
  );
}

function renderBarChart(definition: BarChartDefinition) {
  return el(
    "c:barChart",
    {},
    el("c:barDir", {
      val: definition.direction === "column" ? "col" : "bar",
    }),
    el("c:grouping", { val: "clustered" }),
    el("c:varyColors", { val: "0" }),
    ...definition.series.map((series, index) =>
      renderBarSeries(definition, series, index)
    ),
    definition.labels ? renderAxisDataLabels("bar") : undefined,
    el("c:gapWidth", { val: "60" }),
    el("c:axId", { val: String(AXIS_CATEGORY_ID) }),
    el("c:axId", { val: String(AXIS_VALUE_ID) }),
  );
}

function renderLineChart(definition: LineChartDefinition) {
  return el(
    "c:lineChart",
    {},
    el("c:grouping", { val: "standard" }),
    el("c:varyColors", { val: "0" }),
    ...definition.series.map((series, index) =>
      renderLineSeries(definition, series, index)
    ),
    definition.labels ? renderAxisDataLabels("line") : undefined,
    el("c:marker", { val: definition.markers ? "1" : "0" }),
    el("c:smooth", { val: "0" }),
    el("c:axId", { val: String(AXIS_CATEGORY_ID) }),
    el("c:axId", { val: String(AXIS_VALUE_ID) }),
  );
}

function renderPieChart(definition: PieChartDefinition) {
  return el(
    "c:pieChart",
    {},
    el("c:varyColors", { val: "1" }),
    renderPieSeries(definition, definition.series[0], 0),
    definition.labels ? renderCircularDataLabels() : undefined,
    el("c:firstSliceAng", { val: "0" }),
  );
}

function renderDonutChart(definition: DonutChartDefinition) {
  return el(
    "c:doughnutChart",
    {},
    el("c:varyColors", { val: "1" }),
    renderPieSeries(definition, definition.series[0], 0),
    definition.labels ? renderCircularDataLabels() : undefined,
    el("c:firstSliceAng", { val: "0" }),
    el("c:holeSize", { val: `${definition.holeSize}%` }),
  );
}

/** Generate a chart part. */
export function renderChartSpace(
  definition: ChartDefinition,
  workbookRelId: string,
): string {
  const plotAreaChildren = [
    el("c:layout", {}),
    definition.type === "bar"
      ? renderBarChart(definition)
      : definition.type === "line"
      ? renderLineChart(definition)
      : definition.type === "pie"
      ? renderPieChart(definition)
      : renderDonutChart(definition),
    definition.type === "bar" || definition.type === "line"
      ? renderCategoryAxis(definition)
      : undefined,
    definition.type === "bar" || definition.type === "line"
      ? renderValueAxis(definition)
      : undefined,
  ];

  const root = el(
    "c:chartSpace",
    {
      "xmlns:c": NS_C,
      "xmlns:a": NS_A,
      "xmlns:r": NS_R,
    },
    el("c:date1904", { val: "0" }),
    el("c:roundedCorners", { val: "0" }),
    el(
      "c:chart",
      {},
      definition.title ? renderChartTitle(definition.title) : undefined,
      el("c:autoTitleDeleted", { val: definition.title ? "0" : "1" }),
      el("c:plotArea", {}, ...plotAreaChildren),
      definition.legend.show ? renderLegend(definition.legend) : undefined,
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
