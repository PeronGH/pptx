import { assertEquals } from "@std/assert/equals";
import { assertThrows } from "@std/assert/throws";
import { placeTableCells } from "../src/table_grid.ts";

const cell = (name: string, colSpan?: number, rowSpan?: number) => ({
  name,
  colSpan,
  rowSpan,
});

Deno.test("placeTableCells skips slots covered by earlier row spans", () => {
  const grid = placeTableCells([
    [cell("a", 1, 2), cell("b", 2)],
    [cell("c"), cell("d")],
  ], 3);
  const describe = grid.map((row) =>
    row.map((slot) =>
      slot.kind === "anchor"
        ? slot.cell.name
        : `${slot.anchor.name}:${slot.hMerge ? "h" : ""}${
          slot.vMerge ? "v" : ""
        }`
    )
  );
  assertEquals(describe, [["a", "b", "b:h"], ["a:v", "c", "d"]]);
});

Deno.test("placeTableCells marks a 2x2 merge the way PowerPoint writes it", () => {
  const grid = placeTableCells([
    [cell("m", 2, 2), cell("x")],
    [cell("y")],
  ], 3);
  const lower = grid[1]!;
  assertEquals(lower[0], {
    kind: "covered",
    anchor: cell("m", 2, 2),
    hMerge: false,
    vMerge: true,
    colSpan: 2,
  });
  assertEquals(lower[1]?.kind === "covered" && lower[1].hMerge, true);
  assertEquals(lower[1]?.kind === "covered" && lower[1].vMerge, true);
});

Deno.test("placeTableCells rejects grids that do not tile", () => {
  assertThrows(
    () => placeTableCells([[cell("a", 3)]], 2),
    Error,
    "needs more than the table's 2 columns",
  );
  assertThrows(
    () => placeTableCells([[cell("a")]], 2),
    Error,
    "leaves 1 of the table's 2 columns empty",
  );
  assertThrows(
    () => placeTableCells([[cell("a", 1, 3)], [cell("b")]], 2),
    Error,
    "runs past the last row",
  );
  assertThrows(
    () => placeTableCells([[cell("a", 1.5)]], 2),
    Error,
    "colSpan must be a positive integer",
  );
  assertThrows(
    () => placeTableCells([[cell("a"), cell("b", 1, 2)], [cell("c", 2)]], 2),
    Error,
    "overlaps a span from an earlier row",
  );
});
