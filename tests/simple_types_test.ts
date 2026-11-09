import { assertEquals } from "@std/assert/equals";
import { assertThrows } from "@std/assert/throws";
import { u } from "../mod.ts";
import type { Emu, HundredthPoint, Percentage } from "../src/types.ts";
import { PRESET_GEOMETRIES } from "../src/ooxml/enums.ts";
import {
  coordinate,
  enumeration,
  lineWidth,
  minOccurs,
  positiveCoordinate,
  positiveFixedAngle,
  positiveFixedPercentage,
  slideSizeCoordinate,
  textFontSize,
  textIndentLevel,
  textPoint,
  textSpacingPercent,
  textSpacingPoint,
} from "../src/ooxml/simple_types.ts";

Deno.test("positiveFixedAngle normalizes degrees into [0, 360)", () => {
  assertEquals(positiveFixedAngle(0), "0");
  assertEquals(positiveFixedAngle(90), "5400000");
  assertEquals(positiveFixedAngle(360), "0");
  assertEquals(positiveFixedAngle(-45), "18900000");
  assertEquals(positiveFixedAngle(725), "300000");
  assertThrows(() => positiveFixedAngle(NaN), RangeError);
});

Deno.test("simple types reject values outside their ECMA-376 range", () => {
  assertEquals(textFontSize(u.font(4000)), "400000");
  assertThrows(() => textFontSize(u.font(4000.01)), RangeError, "font size");
  assertThrows(() => textFontSize(u.font(0.5)), RangeError, "font size");
  assertThrows(() => textFontSize(1033.3 as HundredthPoint), RangeError);

  assertEquals(textSpacingPoint(u.pt(1584)), "158400");
  assertThrows(() => textSpacingPoint(u.pt(1585)), RangeError, "spacing");

  assertEquals(positiveFixedPercentage(u.pct(100), "alpha"), "100000");
  assertThrows(
    () => positiveFixedPercentage(u.pct(101), "alpha"),
    RangeError,
    "alpha",
  );
  assertThrows(() => positiveFixedPercentage(0.5 as Percentage, "alpha"));

  assertThrows(() => positiveCoordinate(u.in(-1)), RangeError, "size");
  assertEquals(coordinate(u.in(-1)), "-914400");
  assertThrows(() => lineWidth(u.pt(1585)), RangeError, "line width");
  assertThrows(() => coordinate(0.5 as Emu), RangeError);

  assertEquals(slideSizeCoordinate(u.in(1), "w"), "914400");
  assertThrows(() => slideSizeCoordinate(u.in(0.5), "w"), RangeError, "w");
  assertThrows(() => slideSizeCoordinate(u.in(57), "w"), RangeError, "w");
});

Deno.test("enumerations, levels, and counts are checked at runtime", () => {
  assertEquals(enumeration("rect", PRESET_GEOMETRIES, "preset"), "rect");
  assertThrows(
    () => enumeration("notAShape" as "rect", PRESET_GEOMETRIES, "preset"),
    RangeError,
    'Unknown preset "notAShape"',
  );
  assertEquals(textIndentLevel(8), "8");
  assertThrows(() => textIndentLevel(9), RangeError, "paragraph level");
  assertThrows(
    () => minOccurs([1], 2, "gradient stops"),
    RangeError,
    "at least 2",
  );
});

Deno.test("character and line spacing stay within their ranges", () => {
  assertEquals(textPoint(u.pt(-2)), "-200");
  assertThrows(() => textPoint(u.pt(4001)), RangeError, "character spacing");
  assertEquals(textSpacingPercent(1.25), "125000");
  assertThrows(() => textSpacingPercent(-1), RangeError, "line spacing");
  assertThrows(() => textSpacingPercent(133), RangeError, "line spacing");
});
