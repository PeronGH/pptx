/**
 * High-level chart leaf constructors for the public DSL.
 */

import type { HexColor } from "./types.ts";

type KeysOfType<T, Value> = Extract<
  {
    [K in keyof T]-?: T[K] extends Value ? K : never;
  }[keyof T],
  string
>;

function invalidChart(message: string): never {
  // Numeric range and dynamic series-shape validation can be bypassed by plain
  // JavaScript callers, so chart constructors still guard those boundaries.
  throw new Error(message);
}

/** Shared legend positions. */
export type ChartLegendPosition = "right" | "bottom" | "top" | "left";

/** Public legend options. */
export type ChartLegend =
  | boolean
  | {
    readonly position?: ChartLegendPosition;
  };

/** Shared title-only axis options. */
export interface ChartAxis {
  readonly title?: string;
}

/** Optional value-axis bounds and title. */
export interface ChartValueAxis extends ChartAxis {
  readonly min?: number;
  readonly max?: number;
}

/** Supported directions for a bar chart. */
export type ChartBarDirection = "column" | "bar";

/** A public series definition keyed into the row data. */
export interface ChartSeries<
  Row,
  ValueKey extends KeysOfType<Row, number> = KeysOfType<Row, number>,
> {
  readonly name: string;
  readonly value: ValueKey;
  readonly color?: HexColor;
}

/** A normalized series definition. */
export interface ChartSeriesData {
  readonly name: string;
  readonly values: ReadonlyArray<number>;
  readonly color?: HexColor;
}

/** A normalized legend configuration. */
export interface NormalizedChartLegend {
  readonly show: boolean;
  readonly position: ChartLegendPosition;
}

/** Shared chart fields. */
interface ChartBase {
  readonly kind: "chart";
  readonly categories: ReadonlyArray<string>;
  readonly title?: string;
  readonly labels: boolean;
  readonly legend: NormalizedChartLegend;
}

/** Shared axis-chart fields. */
interface AxisChartBase extends ChartBase {
  readonly series: readonly [
    ChartSeriesData,
    ...ReadonlyArray<ChartSeriesData>,
  ];
  readonly categoryAxis?: ChartAxis;
  readonly valueAxis?: ChartValueAxis;
}

/** A normalized multi-series bar chart leaf. */
export interface BarChart extends AxisChartBase {
  readonly chartType: "bar";
  readonly direction: ChartBarDirection;
}

/** A normalized multi-series line chart leaf. */
export interface LineChart extends AxisChartBase {
  readonly chartType: "line";
  readonly markers: boolean;
}

/** A normalized single-series pie chart leaf. */
export interface PieChart extends ChartBase {
  readonly chartType: "pie";
  readonly series: readonly [ChartSeriesData];
}

/** A normalized single-series donut chart leaf. */
export interface DonutChart extends ChartBase {
  readonly chartType: "donut";
  readonly series: readonly [ChartSeriesData];
  readonly holeSize: number;
}

/** Union of public chart leaves. */
export type Chart = BarChart | LineChart | PieChart | DonutChart;

interface ChartCategoryOptions<
  Row,
  CategoryKey extends KeysOfType<Row, string>,
> {
  readonly data: ReadonlyArray<Row>;
  readonly category: CategoryKey;
  readonly title?: string;
  readonly labels?: boolean;
  readonly legend?: ChartLegend;
}

/** Options for creating a multi-series bar chart. */
export interface BarChartOptions<
  Row,
  CategoryKey extends KeysOfType<Row, string>,
> extends ChartCategoryOptions<Row, CategoryKey> {
  readonly series: readonly [
    ChartSeries<Row>,
    ...ReadonlyArray<ChartSeries<Row>>,
  ];
  readonly direction?: ChartBarDirection;
  readonly categoryAxis?: ChartAxis;
  readonly valueAxis?: ChartValueAxis;
}

/** Options for creating a multi-series line chart. */
export interface LineChartOptions<
  Row,
  CategoryKey extends KeysOfType<Row, string>,
> extends ChartCategoryOptions<Row, CategoryKey> {
  readonly series: readonly [
    ChartSeries<Row>,
    ...ReadonlyArray<ChartSeries<Row>>,
  ];
  readonly markers?: boolean;
  readonly categoryAxis?: ChartAxis;
  readonly valueAxis?: ChartValueAxis;
}

/** Options for creating a single-series pie chart. */
export interface PieChartOptions<
  Row,
  CategoryKey extends KeysOfType<Row, string>,
> extends ChartCategoryOptions<Row, CategoryKey> {
  readonly series: readonly [ChartSeries<Row>];
}

/** Options for creating a single-series donut chart. */
export interface DonutChartOptions<
  Row,
  CategoryKey extends KeysOfType<Row, string>,
> extends ChartCategoryOptions<Row, CategoryKey> {
  readonly series: readonly [ChartSeries<Row>];
  readonly holeSize?: number;
}

function normalizeLegend(
  legend: ChartLegend | undefined,
): NormalizedChartLegend {
  if (legend === undefined || legend === false) {
    return { show: false, position: "right" };
  }
  if (legend === true) {
    return { show: true, position: "right" };
  }
  return {
    show: true,
    position: legend.position ?? "right",
  };
}

function requireNonEmptySeries(
  series: ReadonlyArray<ChartSeriesData>,
): readonly [ChartSeriesData, ...ReadonlyArray<ChartSeriesData>] {
  if (series.length === 0) {
    invalidChart("Charts require at least one series");
  }
  return series as readonly [
    ChartSeriesData,
    ...ReadonlyArray<ChartSeriesData>,
  ];
}

function normalizeSeries<Row>(
  data: ReadonlyArray<Row>,
  series: ReadonlyArray<ChartSeries<Row>>,
) {
  return requireNonEmptySeries(series.map((entry) => ({
    name: entry.name,
    values: data.map((row) => row[entry.value] as number),
    color: entry.color,
  })));
}

function normalizeCategories<Row, CategoryKey extends KeysOfType<Row, string>>(
  data: ReadonlyArray<Row>,
  category: CategoryKey,
): ReadonlyArray<string> {
  return data.map((row) => row[category] as string);
}

function normalizeHoleSize(holeSize: number | undefined): number {
  const value = holeSize ?? 50;
  if (!Number.isInteger(value) || value < 10 || value > 90) {
    invalidChart(
      `Invalid donut holeSize "${value}": expected an integer from 10 to 90`,
    );
  }
  return value;
}

/** Create a multi-series categorical bar/column chart leaf. */
export function bar<
  Row,
  CategoryKey extends KeysOfType<Row, string>,
>(
  options: BarChartOptions<Row, CategoryKey>,
): BarChart {
  return {
    kind: "chart",
    chartType: "bar",
    categories: normalizeCategories(options.data, options.category),
    series: normalizeSeries(options.data, options.series),
    title: options.title,
    labels: options.labels ?? false,
    legend: normalizeLegend(options.legend),
    direction: options.direction ?? "column",
    categoryAxis: options.categoryAxis,
    valueAxis: options.valueAxis,
  };
}

/** Create a multi-series categorical line chart leaf. */
export function line<
  Row,
  CategoryKey extends KeysOfType<Row, string>,
>(
  options: LineChartOptions<Row, CategoryKey>,
): LineChart {
  return {
    kind: "chart",
    chartType: "line",
    categories: normalizeCategories(options.data, options.category),
    series: normalizeSeries(options.data, options.series),
    title: options.title,
    labels: options.labels ?? false,
    legend: normalizeLegend(options.legend),
    markers: options.markers ?? false,
    categoryAxis: options.categoryAxis,
    valueAxis: options.valueAxis,
  };
}

/** Create a single-series pie chart leaf. */
export function pie<
  Row,
  CategoryKey extends KeysOfType<Row, string>,
>(
  options: PieChartOptions<Row, CategoryKey>,
): PieChart {
  return {
    kind: "chart",
    chartType: "pie",
    categories: normalizeCategories(options.data, options.category),
    series: [normalizeSeries(options.data, options.series)[0]!],
    title: options.title,
    labels: options.labels ?? false,
    legend: normalizeLegend(options.legend),
  };
}

/** Create a single-series donut chart leaf. */
export function donut<
  Row,
  CategoryKey extends KeysOfType<Row, string>,
>(
  options: DonutChartOptions<Row, CategoryKey>,
): DonutChart {
  return {
    kind: "chart",
    chartType: "donut",
    categories: normalizeCategories(options.data, options.category),
    series: [normalizeSeries(options.data, options.series)[0]!],
    title: options.title,
    labels: options.labels ?? false,
    legend: normalizeLegend(options.legend),
    holeSize: normalizeHoleSize(options.holeSize),
  };
}

/** Public chart namespace. */
export const chart = {
  bar,
  line,
  pie,
  donut,
} as const;
