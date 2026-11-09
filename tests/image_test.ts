import { assertEquals } from "@std/assert/equals";
import { assertThrows } from "@std/assert/throws";
import { u } from "../mod.ts";
import { inspectImage, resolveImageFit } from "../src/image.ts";
import type { Frame } from "../src/scene.ts";
import { createTestBmp, createTestPng } from "./helpers.ts";

const frame: Frame = { x: u.emu(0), y: u.emu(0), w: u.emu(300), h: u.emu(100) };

Deno.test("inspectImage detects formats from their signatures", () => {
  assertEquals(inspectImage(createTestPng()), {
    extension: "png",
    contentType: "image/png",
    size: { width: 1, height: 1 },
  });
  assertEquals(inspectImage(createTestBmp(8, 4)).size, { width: 8, height: 4 });
  assertThrows(
    () => inspectImage(new TextEncoder().encode("<svg/>")),
    Error,
    "Unsupported image data",
  );
});

Deno.test("inspectImage reads top-down BMP heights", () => {
  const bmp = createTestBmp(8, 4);
  new DataView(bmp.buffer).setInt32(22, -4, true);
  assertEquals(inspectImage(bmp).size, { width: 8, height: 4 });
});

Deno.test("contain keeps the image aspect ratio with integer EMUs", () => {
  const fit = resolveImageFit(
    frame,
    { width: 3, height: 2 },
    "contain",
    undefined,
  );
  assertEquals(fit.frame, { x: 75, y: 0, w: 150, h: 100 });
});

Deno.test("fit modes use the aspect ratio left after the caller's crop", () => {
  // A 4:1 image cropped to its left half is 2:1, which contains as 200x100.
  const crop = { right: u.pct(50) };
  const contain = resolveImageFit(
    frame,
    { width: 4, height: 1 },
    "contain",
    crop,
  );
  assertEquals(contain.frame, { x: 50, y: 0, w: 200, h: 100 });
  // Covering a 3:1 frame with that 2:1 region trims 1/6 of it top and bottom.
  const cover = resolveImageFit(frame, { width: 4, height: 1 }, "cover", crop);
  assertEquals({ ...cover.crop }, { right: 50000, top: 16667, bottom: 16667 });
});
