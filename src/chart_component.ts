/**
 * Typed JSX chart components.
 */

import {
  type ChartBarElement,
  type ChartBarProps,
  ChartBarTag,
} from "./public_types.ts";

type KeysOfType<T, Value> = Extract<
  {
    [K in keyof T]-?: T[K] extends Value ? K : never;
  }[keyof T],
  string
>;

/** Create a typed JSX bar/column chart node. */
export function ChartBar<
  Row extends object,
  CategoryKey extends KeysOfType<Row, string>,
  ValueKey extends KeysOfType<Row, number>,
>(
  props: ChartBarProps<Row, CategoryKey, ValueKey>,
): ChartBarElement<Row, CategoryKey, ValueKey> {
  return {
    type: ChartBarTag,
    props,
    key: null,
  };
}
