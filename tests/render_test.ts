/**
 * End-to-end render and validation tests for styling/layout features.
 */

import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import {
  align,
  bg,
  chart,
  clr,
  col,
  fill,
  generate,
  image,
  item,
  p,
  presentation,
  row,
  scene,
  slide,
  stack,
  sty,
  td,
  textbox,
  tr,
  tx,
  u,
} from "../mod.ts";
import { createTestBmp, validatePptx } from "./helpers.ts";

const styles = sty.create({
  heroBar: sty.box({
    fill: fill.solid(clr.hex("17324D")),
  }),
  heroTitle: sty.text({
    fontSize: u.font(22),
    fontColor: clr.hex("FFFFFF"),
    bold: true,
  }),
  noteCard: sty.box({
    fill: fill.solid(clr.hex("FFFFFF")),
    line: sty.line({ width: u.emu(6350), dash: "dash" }),
    shadow: sty.shadow({
      color: clr.hex("000000"),
      blur: u.emu(15000),
      distance: u.emu(5000),
      angle: 50,
      alpha: u.pct(20),
    }),
    inset: u.in(0.1),
  }),
  bullets: sty.para({
    bullet: sty.bullet.char("•"),
  }),
  metricCell: sty.cell({
    fill: fill.solid(clr.hex("17324D")),
    line: sty.line({ width: u.emu(6350) }),
    padding: u.in(0.05),
    verticalAlign: "middle",
  }),
  metricText: sty.text({
    fontColor: clr.hex("FFFFFF"),
    bold: true,
  }),
});

/**
 * Generate a slide with a solid background and overlay content.
 * Spec: ECMA-376 §13.3.8 and §19.3.1.1.
 */
Deno.test("e2e: slide background and stack overlay", async () => {
  const pptx = generate(presentation(
    slide(
      { background: bg.fill(fill.solid(clr.hex("F7F4EE"))) },
      stack(
        scene.shape(
          "rect",
          {
            x: u.in(0.6),
            y: u.in(0.6),
            w: u.in(8.8),
            h: u.in(1),
            style: styles.heroBar,
          },
        ),
        align(
          { x: "center", y: "start", w: u.in(6), h: u.in(1) },
          textbox(
            { style: sty.box({ verticalAlign: "middle" }) },
            p(
              { style: sty.para({ align: "center" }) },
              tx.bold("Hero Title", { style: styles.heroTitle }),
            ),
          ),
        ),
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slide_count, 1);
  assert(result.slides[0]?.shapes.some((shape) => shape.text === "Hero Title"));
});

/**
 * Generate a slide with a background image.
 * Spec: implementation-specific.
 */
Deno.test("e2e: slide background image", async () => {
  const pptx = generate(presentation(
    slide(
      {
        background: bg.image({
          data: createTestBmp(8, 4),
          contentType: "image/bmp",
          fit: "cover",
        }),
      },
      scene.textbox(
        {
          x: u.in(1),
          y: u.in(1),
          w: u.in(5),
          h: u.in(1),
          style: sty.box({
            fill: fill.solid(clr.hex("FFFFFF"), u.pct(80)),
          }),
        },
        p("On top of background"),
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slide_count, 1);
  assert(result.slides[0]?.shape_count === 2);
});

/**
 * Generate image cards with contain and cover fits.
 * Spec: ECMA-376 §19.3.1.37, §20.1.8.14, and §20.1.8.55.
 */
Deno.test("e2e: image fits", async () => {
  const pptx = generate(presentation(
    slide(
      scene.image({
        x: u.in(1),
        y: u.in(1),
        w: u.in(4),
        h: u.in(4),
        data: createTestBmp(4, 2),
        contentType: "image/bmp",
        fit: "contain",
      }),
      scene.image({
        x: u.in(5.5),
        y: u.in(1),
        w: u.in(2),
        h: u.in(2),
        data: createTestBmp(4, 2),
        contentType: "image/bmp",
        fit: "cover",
      }),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 2);
  assertEquals(result.slides[0]?.shapes[0]?.is_picture, true);
  assertEquals(result.slides[0]?.shapes[1]?.is_picture, true);
});

/**
 * Generate a bar chart leaf.
 * Spec: ECMA-376 §14.2.1 and §21.2.2.16.
 */
Deno.test("e2e: bar chart leaf", async () => {
  const pptx = generate(presentation(
    slide(
      align(
        { x: "center", y: "center", w: u.in(5), h: u.in(3) },
        chart.bar({
          data: [
            { quarter: "Q1", value: 12 },
            { quarter: "Q2", value: 18 },
            { quarter: "Q3", value: 15 },
          ],
          category: "quarter",
          value: "value",
          title: "Pipeline",
          labels: true,
          color: clr.hex("2678B4"),
        }),
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 1);
  assertEquals(result.slides[0]?.shapes[0]?.is_chart, true);
});

/**
 * Generate a text box with inset and shrink-text fit plus a gradient card.
 * Spec: ECMA-376 §21.1.2.1.1, §21.1.2.1.3, §20.1.8.33, and §20.1.8.45.
 */
Deno.test("e2e: textbox fit and gradient card", async () => {
  const pptx = generate(presentation(
    slide(
      scene.textbox(
        {
          x: u.in(1),
          y: u.in(1),
          w: u.in(5),
          h: u.in(1.2),
          style: sty.box({
            inset: u.in(0.1),
            fit: "shrink-text",
            fill: fill.solid(clr.hex("FFF7E6")),
            line: sty.line({ width: u.emu(12700) }),
          }),
        },
        p(
          tx.run(
            "Dense label that should still render cleanly",
            { style: sty.text({ fontSize: u.font(18) }) },
          ),
        ),
      ),
      scene.shape(
        "roundRect",
        {
          x: u.in(1),
          y: u.in(2.6),
          w: u.in(4),
          h: u.in(2),
          style: sty.box({
            fill: fill.grad(
              35,
              fill.stop(u.pct(0), clr.hex("4F81BD")),
              fill.stop(u.pct(100), clr.hex("1F497D")),
            ),
            shadow: sty.shadow({
              color: clr.hex("000000"),
              blur: u.emu(30000),
              distance: u.emu(15000),
              angle: 45,
              alpha: u.pct(30),
            }),
          }),
        },
        p(
          { style: sty.para({ align: "center" }) },
          tx.bold("Gradient card", {
            style: sty.text({ fontColor: clr.hex("FFFFFF") }),
          }),
        ),
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assert(result.slides[0]?.shapes[0]?.text?.includes("Dense label"));
  assert(result.slides[0]?.shapes[1]?.text?.includes("Gradient card"));
});

/**
 * Generate mixed stack, align, row, and col content.
 * Spec: implementation-specific.
 */
Deno.test("e2e: stack and align with flex layout", async () => {
  const pptx = generate(presentation(
    slide(
      stack(
        scene.shape(
          "rect",
          {
            x: u.emu(0),
            y: u.emu(0),
            w: u.in(10),
            h: u.in(7.5),
            style: sty.box({ fill: fill.solid(clr.hex("F5F5F5")) }),
          },
        ),
        align(
          { x: "center", y: "center", w: u.in(8), h: u.in(4.5) },
          row(
            { gap: u.in(0.25) },
            item({ grow: 1 }, textbox(p("Left panel"))),
            item(
              { grow: 1 },
              col(
                { gap: u.in(0.25) },
                textbox(p("Top right")),
                textbox(p("Bottom right")),
              ),
            ),
          ),
        ),
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const texts =
    result.slides[0]?.shapes.map((shape) => shape.text).join("\n") ?? "";
  assert(texts.includes("Left panel"));
  assert(texts.includes("Top right"));
  assert(texts.includes("Bottom right"));
});

/**
 * Generate a styled table with reusable cell and text styles.
 * Spec: ECMA-376 §21.1.3.15 and §21.1.3.17.
 */
Deno.test("e2e: styled table polish", async () => {
  const pptx = generate(presentation(
    slide(
      scene.table(
        {
          x: u.in(1),
          y: u.in(1),
          w: u.in(6),
          h: u.in(2),
          cols: [u.in(2), u.in(2), u.in(2)],
        },
        tr(
          u.in(0.5),
          td(
            { style: styles.metricCell },
            p(tx.bold("Metric", { style: styles.metricText })),
          ),
          td(
            { style: styles.metricCell },
            p(tx.bold("Owner", { style: styles.metricText })),
          ),
          td(
            { style: styles.metricCell },
            p(tx.bold("Status", { style: styles.metricText })),
          ),
        ),
        tr(u.in(0.5), td("Activation"), td("Mia"), td("Ready")),
        tr(u.in(0.5), td("Onboarding"), td("Ken"), td("Blocked")),
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const table = result.slides[0]?.shapes[0];
  assertEquals(table?.is_table, true);
  assertEquals(table?.table_cols, 3);
  assertEquals(table?.table_rows, 3);
});

/**
 * Generate a dense, visually mixed slide using reusable styles.
 * Spec: implementation-specific.
 */
Deno.test("e2e: design stress test", async () => {
  const pptx = generate(presentation(
    slide(
      {
        background: bg.fill(
          fill.grad(
            90,
            fill.stop(u.pct(0), clr.hex("FFF8F1")),
            fill.stop(u.pct(100), clr.hex("F2F6FB")),
          ),
        ),
      },
      scene.shape(
        "roundRect",
        {
          x: u.in(0.7),
          y: u.in(0.6),
          w: u.in(8.6),
          h: u.in(0.9),
          style: styles.heroBar,
        },
      ),
      scene.textbox(
        { x: u.in(1), y: u.in(0.75), w: u.in(5), h: u.in(0.4) },
        p(tx.bold("Q2 Strategy", { style: styles.heroTitle })),
      ),
      row(
        {
          padding: {
            left: u.in(0.9),
            right: u.in(0.9),
            top: u.in(1.8),
            bottom: u.in(0.8),
          },
          gap: u.in(0.25),
        },
        item(
          { grow: 2 },
          textbox(
            { style: styles.noteCard },
            p(
              { style: styles.bullets },
              "One clear hero, one comparison region, one action region.",
            ),
            p(
              { style: styles.bullets },
              "Styling and layout should cooperate without theme support.",
            ),
            p("Memo: ", tx.link("example.com", "https://example.com")),
          ),
        ),
        item(
          { grow: 1, aspectRatio: 1 },
          image({
            data: createTestBmp(4, 2),
            contentType: "image/bmp",
            fit: "cover",
          }),
        ),
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slide_count, 1);
  assert(result.slides[0]?.shape_count !== undefined);
});
