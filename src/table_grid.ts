/**
 * Table grid placement for spanning cells, following HTML table semantics:
 * each row lists only the cells it starts, and a cell takes the next grid
 * column not already covered by a row span from an earlier row.
 */

/** Span fields shared by table cells. */
export interface CellSpan {
  readonly colSpan?: number;
  readonly rowSpan?: number;
}

/** One grid slot: the cell that starts here, or a slot merged into one. */
export type GridSlot<Cell> =
  | {
    readonly kind: "anchor";
    readonly cell: Cell;
    readonly colSpan: number;
    readonly rowSpan: number;
  }
  | {
    readonly kind: "covered";
    readonly anchor: Cell;
    /** Merged with the slot to its left (`a:tc/@hMerge`). */
    readonly hMerge: boolean;
    /** Merged with the slot above (`a:tc/@vMerge`). */
    readonly vMerge: boolean;
    /** Width of a vertically merged row segment (`a:tc/@gridSpan`). */
    readonly colSpan: number;
  };

function invalidGrid(message: string): never {
  // Rows and spans come from JSX children, which TypeScript cannot count, and
  // PowerPoint rejects tables whose rows do not tile the grid exactly.
  throw new Error(message);
}

function span(value: number | undefined, what: string, row: number): number {
  const result = value ?? 1;
  if (!Number.isInteger(result) || result < 1) {
    invalidGrid(
      `<Table.Row> ${
        row + 1
      }: ${what} must be a positive integer, got ${value}`,
    );
  }
  return result;
}

/**
 * Place cells on a `rows x columnCount` grid. Throws when a row overflows the
 * grid, spans overlap, a row span runs past the last row, or a row leaves
 * grid columns empty.
 */
export function placeTableCells<Cell extends CellSpan>(
  rows: ReadonlyArray<ReadonlyArray<Cell>>,
  columnCount: number,
): ReadonlyArray<ReadonlyArray<GridSlot<Cell>>> {
  const grid: Array<Array<GridSlot<Cell> | undefined>> = rows.map(() =>
    new Array(columnCount).fill(undefined)
  );

  for (const [r, cells] of rows.entries()) {
    let c = 0;
    for (const cell of cells) {
      while (c < columnCount && grid[r]![c]) c++;
      const colSpan = span(cell.colSpan, "colSpan", r);
      const rowSpan = span(cell.rowSpan, "rowSpan", r);
      if (c + colSpan > columnCount) {
        invalidGrid(
          `<Table.Row> ${
            r + 1
          } needs more than the table's ${columnCount} columns`,
        );
      }
      if (r + rowSpan > rows.length) {
        invalidGrid(
          `<Table.Row> ${r + 1}: rowSpan ${rowSpan} runs past the last row`,
        );
      }
      for (let rr = r; rr < r + rowSpan; rr++) {
        for (let cc = c; cc < c + colSpan; cc++) {
          if (grid[rr]![cc]) {
            invalidGrid(
              `<Table.Row> ${
                r + 1
              }: a cell overlaps a span from an earlier row`,
            );
          }
          grid[rr]![cc] = rr === r && cc === c
            ? { kind: "anchor", cell, colSpan, rowSpan }
            : {
              kind: "covered",
              anchor: cell,
              hMerge: cc > c,
              vMerge: rr > r,
              colSpan: cc === c ? colSpan : 1,
            };
        }
      }
      c += colSpan;
    }
    const empty = grid[r]!.filter((slot) => !slot).length;
    if (empty > 0) {
      invalidGrid(
        `<Table.Row> ${
          r + 1
        } leaves ${empty} of the table's ${columnCount} columns empty`,
      );
    }
  }

  return grid as ReadonlyArray<ReadonlyArray<GridSlot<Cell>>>;
}
