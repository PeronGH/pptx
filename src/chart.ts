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

/** Supported directions for a bar chart. */
export type ChartBarDirection = "column" | "bar";

/** A normalized single-series bar chart leaf. */
export interface BarChart {
  readonly kind: "chart";
  readonly chartType: "bar";
  readonly points: ReadonlyArray<ChartPoint>;
  readonly title?: string;
  readonly seriesName: string;
  readonly color?: HexColor;
  readonly labels: boolean;
  readonly legend: boolean;
  readonly direction: ChartBarDirection;
  readonly valueAxis?: ChartValueAxis;
}

/** Union of public chart leaves. */
export type Chart = BarChart;

/** Options for creating a single-series bar chart. */
export interface BarChartOptions<
  Row,
  CategoryKey extends KeysOfType<Row, string>,
  ValueKey extends KeysOfType<Row, number>,
> {
  readonly data: ReadonlyArray<Row>;
  readonly category: CategoryKey;
  readonly value: ValueKey;
  readonly title?: string;
  readonly seriesName?: string;
  readonly color?: HexColor;
  readonly labels?: boolean;
  readonly legend?: boolean;
  readonly direction?: ChartBarDirection;
  readonly valueAxis?: ChartValueAxis;
}

/** Create a single-series categorical bar/column chart leaf. */
export function bar<
  Row,
  CategoryKey extends KeysOfType<Row, string>,
  ValueKey extends KeysOfType<Row, number>,
>(
  options: BarChartOptions<Row, CategoryKey, ValueKey>,
): BarChart {
  return {
    kind: "chart",
    chartType: "bar",
    points: options.data.map((row) => ({
      category: row[options.category] as string,
      value: row[options.value] as number,
    })),
    title: options.title,
    seriesName: options.seriesName ?? String(options.value),
    color: options.color,
    labels: options.labels ?? false,
    legend: options.legend ?? false,
    direction: options.direction ?? "column",
    valueAxis: options.valueAxis,
  };
}

/** Public chart namespace. */
export const chart = {
  bar,
} as const;
