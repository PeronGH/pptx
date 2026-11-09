/**
 * Chart part XML generation. ECMA-376 Part 1 §21.2 (DrawingML Charts).
 */

import { el, renderXmlDocument, type XmlElement } from "../xml.ts";
import type { HexColor } from "../types.ts";
import { NS_A, NS_C, NS_R } from "./namespaces.ts";
import { columnName } from "./embedded_workbook.ts";

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

/**
 * Series stacking for bar and area charts: `"stacked"` adds series on top of
 * each other, `"percent"` scales each category to 100%.
 */
export type ChartStacking = "stacked" | "percent";

interface ChartDefinitionBase {
  readonly title?: string;
  readonly categories: ReadonlyArray<string>;
  readonly labels: boolean;
  readonly legend: ChartLegendDefinition;
  /**
   * Excel number format code for values, data labels, and the value axis,
   * e.g. `"0%"`, `"$#,##0"`, `"#,##0.0"`.
   */
  readonly numberFormat?: string;
}

type MultiSeries = readonly [
  ChartSeriesDefinition,
  ...ReadonlyArray<ChartSeriesDefinition>,
];

interface AxisChartDefinition extends ChartDefinitionBase {
  readonly series: MultiSeries;
  readonly categoryAxis?: ChartAxisDefinition;
  readonly valueAxis?: ChartValueAxisDefinition;
}

/** Internal bar chart definition. */
export interface BarChartDefinition extends AxisChartDefinition {
  readonly type: "bar";
  readonly direction: "column" | "bar";
  readonly stacking?: ChartStacking;
}

/** Internal line chart definition. */
export interface LineChartDefinition extends AxisChartDefinition {
  readonly type: "line";
  readonly markers: boolean;
}

/** Internal area chart definition. */
export interface AreaChartDefinition extends AxisChartDefinition {
  readonly type: "area";
  readonly stacking?: ChartStacking;
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
  | AreaChartDefinition
  | PieChartDefinition
  | DonutChartDefinition;

type AxisChart = BarChartDefinition | LineChartDefinition | AreaChartDefinition;

const AXIS_CATEGORY_ID = 100000;
const AXIS_VALUE_ID = 100001;

function workbookRange(columnIndex: number, count: number): string {
  const column = columnName(columnIndex);
  return `Sheet1!$${column}$2:$${column}$${count + 1}`;
}

function seriesTitleRef(index: number): string {
  return `Sheet1!$${columnName(index + 1)}$1`;
}

/** `c:grouping` value (§21.2.3.4 `ST_BarGrouping`, §21.2.3.17 `ST_Grouping`). */
function grouping(stacking: ChartStacking | undefined, unstacked: string) {
  switch (stacking) {
    case undefined:
      return unstacked;
    case "stacked":
      return "stacked";
    case "percent":
      return "percentStacked";
  }
}

function renderFillSeriesColor(color: HexColor | undefined) {
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

function renderNumFmt(formatCode: string | undefined) {
  return formatCode === undefined
    ? undefined
    : el("c:numFmt", { formatCode, sourceLinked: "0" });
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

function renderNumCache(
  values: ReadonlyArray<number>,
  formatCode: string | undefined,
) {
  return el(
    "c:numCache",
    {},
    el("c:formatCode", {}, formatCode ?? "General"),
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

function renderTitle(title: string) {
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

function renderLegend(legend: ChartLegendDefinition) {
  return el(
    "c:legend",
    {},
    el("c:legendPos", { val: legendPosValue(legend.position) }),
    el("c:layout", {}),
    el("c:overlay", { val: "0" }),
  );
}

/**
 * Value data labels (§21.2.2.49 `c:dLbls`). `position` must be one the chart
 * type supports: outside ends do not exist on stacked bars, and area charts
 * accept no position at all.
 */
function renderDataLabels(
  definition: ChartDefinition,
  position: "outEnd" | "ctr" | undefined,
  showLeaderLines = false,
) {
  // CT_DLbls order: numFmt, dLblPos, show* flags, showLeaderLines.
  return el(
    "c:dLbls",
    {},
    renderNumFmt(definition.numberFormat),
    position && el("c:dLblPos", { val: position }),
    el("c:showLegendKey", { val: "0" }),
    el("c:showVal", { val: "1" }),
    el("c:showCatName", { val: "0" }),
    el("c:showSerName", { val: "0" }),
    el("c:showPercent", { val: "0" }),
    el("c:showBubbleSize", { val: "0" }),
    showLeaderLines && el("c:showLeaderLines", { val: "1" }),
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
  formatCode: string | undefined,
) {
  return el(
    "c:val",
    {},
    el(
      "c:numRef",
      {},
      el("c:f", {}, workbookRange(seriesIndex + 1, values.length)),
      renderNumCache(values, formatCode),
    ),
  );
}

/** Series content shared by every chart type, in `EG_SerShared` order. */
function renderSeries(
  definition: ChartDefinition,
  series: ChartSeriesDefinition,
  index: number,
  spPr: XmlElement | undefined,
  afterSpPr: ReadonlyArray<XmlElement | undefined> = [],
  trailing: ReadonlyArray<XmlElement> = [],
) {
  return el(
    "c:ser",
    {},
    el("c:idx", { val: String(index) }),
    el("c:order", { val: String(index) }),
    renderSeriesText(index, series.name),
    spPr,
    ...afterSpPr,
    renderCategoryRef(definition.categories),
    renderValueRef(series.values, index, definition.numberFormat),
    ...trailing,
  );
}

function renderCategoryAxis(definition: AxisChart) {
  return el(
    "c:catAx",
    {},
    el("c:axId", { val: String(AXIS_CATEGORY_ID) }),
    el("c:scaling", {}, el("c:orientation", { val: "minMax" })),
    el("c:delete", { val: "0" }),
    el("c:axPos", {
      val: definition.type === "bar" && definition.direction === "bar"
        ? "l"
        : "b",
    }),
    definition.categoryAxis?.title
      ? renderTitle(definition.categoryAxis.title)
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

function renderValueAxis(definition: AxisChart) {
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
  // A 100% stacked axis shows shares, whatever the format of the values is.
  const axisFormat = definition.type !== "line" &&
      definition.stacking === "percent"
    ? "0%"
    : definition.numberFormat;

  return el(
    "c:valAx",
    {},
    el("c:axId", { val: String(AXIS_VALUE_ID) }),
    el("c:scaling", {}, ...scalingChildren),
    el("c:delete", { val: "0" }),
    el("c:axPos", {
      val: definition.type === "bar" && definition.direction === "bar"
        ? "b"
        : "l",
    }),
    el("c:majorGridlines", {}),
    definition.valueAxis?.title
      ? renderTitle(definition.valueAxis.title)
      : undefined,
    renderNumFmt(axisFormat),
    el("c:majorTickMark", { val: "out" }),
    el("c:minorTickMark", { val: "none" }),
    el("c:tickLblPos", { val: "nextTo" }),
    el("c:crossAx", { val: String(AXIS_CATEGORY_ID) }),
    el("c:crosses", { val: "autoZero" }),
  );
}

function renderAxisIds() {
  return [
    el("c:axId", { val: String(AXIS_CATEGORY_ID) }),
    el("c:axId", { val: String(AXIS_VALUE_ID) }),
  ];
}

function renderBarChart(definition: BarChartDefinition) {
  const stacked = definition.stacking !== undefined;
  return el(
    "c:barChart",
    {},
    el("c:barDir", {
      val: definition.direction === "column" ? "col" : "bar",
    }),
    el("c:grouping", { val: grouping(definition.stacking, "clustered") }),
    el("c:varyColors", { val: "0" }),
    ...definition.series.map((series, index) =>
      renderSeries(
        definition,
        series,
        index,
        renderFillSeriesColor(series.color),
      )
    ),
    definition.labels
      ? renderDataLabels(definition, stacked ? "ctr" : "outEnd")
      : undefined,
    el("c:gapWidth", { val: "60" }),
    // Stacked series must fully overlap to sit on top of each other.
    stacked ? el("c:overlap", { val: "100" }) : undefined,
    ...renderAxisIds(),
  );
}

function renderLineChart(definition: LineChartDefinition) {
  return el(
    "c:lineChart",
    {},
    el("c:grouping", { val: "standard" }),
    el("c:varyColors", { val: "0" }),
    ...definition.series.map((series, index) =>
      renderSeries(
        definition,
        series,
        index,
        renderLineSeriesColor(series.color),
        [
          definition.markers
            ? undefined
            : el("c:marker", {}, el("c:symbol", { val: "none" })),
        ],
        [el("c:smooth", { val: "0" })],
      )
    ),
    definition.labels ? renderDataLabels(definition, undefined) : undefined,
    el("c:marker", { val: definition.markers ? "1" : "0" }),
    ...renderAxisIds(),
  );
}

function renderAreaChart(definition: AreaChartDefinition) {
  return el(
    "c:areaChart",
    {},
    el("c:grouping", { val: grouping(definition.stacking, "standard") }),
    el("c:varyColors", { val: "0" }),
    ...definition.series.map((series, index) =>
      renderSeries(
        definition,
        series,
        index,
        renderFillSeriesColor(series.color),
      )
    ),
    definition.labels ? renderDataLabels(definition, undefined) : undefined,
    ...renderAxisIds(),
  );
}

function renderPieChart(definition: PieChartDefinition | DonutChartDefinition) {
  return [
    el("c:varyColors", { val: "1" }),
    renderSeries(
      definition,
      definition.series[0],
      0,
      renderFillSeriesColor(definition.series[0].color),
    ),
    definition.labels
      ? renderDataLabels(definition, undefined, true)
      : undefined,
    el("c:firstSliceAng", { val: "0" }),
  ];
}

function renderPlotArea(definition: ChartDefinition) {
  switch (definition.type) {
    case "bar":
      return [
        renderBarChart(definition),
        renderCategoryAxis(definition),
        renderValueAxis(definition),
      ];
    case "line":
      return [
        renderLineChart(definition),
        renderCategoryAxis(definition),
        renderValueAxis(definition),
      ];
    case "area":
      return [
        renderAreaChart(definition),
        renderCategoryAxis(definition),
        renderValueAxis(definition),
      ];
    case "pie":
      return [el("c:pieChart", {}, ...renderPieChart(definition))];
    case "donut":
      return [
        el(
          "c:doughnutChart",
          {},
          ...renderPieChart(definition),
          // Transitional ST_HoleSize also allows "NN%", but Office only reads
          // the unsignedByte form.
          el("c:holeSize", { val: String(definition.holeSize) }),
        ),
      ];
  }
}

/** Generate a chart part. */
export function renderChartSpace(
  definition: ChartDefinition,
  workbookRelId: string,
): string {
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
      definition.title ? renderTitle(definition.title) : undefined,
      el("c:autoTitleDeleted", { val: definition.title ? "0" : "1" }),
      el(
        "c:plotArea",
        {},
        el("c:layout", {}),
        ...renderPlotArea(definition),
      ),
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
