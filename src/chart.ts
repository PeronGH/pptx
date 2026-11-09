/**
 * Chart leaf types for the public DSL. Normalized charts are the OOXML chart
 * definitions tagged as layout leaves.
 */

import type { HexColor } from "./types.ts";
import type {
  BarChartDefinition,
  ChartAxisDefinition,
  ChartLegendPosition,
  ChartSeriesDefinition,
  ChartValueAxisDefinition,
  DonutChartDefinition,
  LineChartDefinition,
  PieChartDefinition,
} from "./ooxml/chart.ts";

export type { ChartLegendPosition };

type KeysOfType<T, Value> = Extract<
  {
    [K in keyof T]-?: T[K] extends Value ? K : never;
  }[keyof T],
  string
>;

/** Public legend options: `true` shows it on the right. */
export type ChartLegend =
  | boolean
  | {
    readonly position?: ChartLegendPosition;
  };

/** Title-only axis options. */
export type ChartAxis = ChartAxisDefinition;

/** Value-axis bounds and title. */
export type ChartValueAxis = ChartValueAxisDefinition;

/** Supported directions for a bar chart. */
export type ChartBarDirection = BarChartDefinition["direction"];

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
export type ChartSeriesData = ChartSeriesDefinition;

/** Layout-leaf fields shared by every chart. */
interface ChartLeaf {
  readonly kind: "chart";
  readonly name?: string;
}

/** A normalized multi-series bar chart leaf. */
export type BarChart = BarChartDefinition & ChartLeaf;

/** A normalized multi-series line chart leaf. */
export type LineChart = LineChartDefinition & ChartLeaf;

/** A normalized single-series pie chart leaf. */
export type PieChart = PieChartDefinition & ChartLeaf;

/** A normalized single-series donut chart leaf. */
export type DonutChart = DonutChartDefinition & ChartLeaf;

/** Union of normalized chart leaves. */
export type Chart = BarChart | LineChart | PieChart | DonutChart;
