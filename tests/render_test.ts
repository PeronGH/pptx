/**
 * End-to-end render and validation tests for styling/layout features.
 */

import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import {
  align,
  backgroundFill,
  backgroundImage,
  bold,
  boxStyle,
  bulletChar,
  cellStyle,
  col,
  generate,
  gradientStop,
  image,
  item,
  linearGradient,
  lineStyle,
  link,
  p,
  paragraphStyle,
  presentation,
  row,
  scene,
  shadow,
  slide,
  solidFill,
  st,
  stack,
  td,
  text,
  textbox,
  textStyle,
  tr,
} from "../mod.ts";
import { createTestBmp, validatePptx } from "./helpers.ts";

/**
 * Generate a slide with a solid background and overlay content.
 * Spec: ECMA-376 §13.3.8.
 */
Deno.test("e2e: slide background and stack overlay", async () => {
  const pptx = generate(presentation(
    slide(
      { background: backgroundFill(solidFill(st.hex("F7F4EE"))) },
      stack(
        scene.shape(
          "rect",
          {
            x: st.in(0.6),
            y: st.in(0.6),
            w: st.in(8.8),
            h: st.in(1),
            fill: solidFill(st.hex("17324D")),
          },
        ),
        align(
          { x: "center", y: "start", w: st.in(6), h: st.in(1) },
          textbox(
            boxStyle({ verticalAlign: "middle" }),
            p(
              paragraphStyle({ align: "center" }),
              bold(
                "Hero Title",
                textStyle({
                  fontSize: st.font(22),
                  fontColor: st.hex("FFFFFF"),
                }),
              ),
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
        background: backgroundImage({
          data: createTestBmp(8, 4),
          contentType: "image/bmp",
          fit: "cover",
        }),
      },
      scene.textbox(
        {
          x: st.in(1),
          y: st.in(1),
          w: st.in(5),
          h: st.in(1),
          fill: solidFill(st.hex("FFFFFF"), st.pct(80)),
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
 * Generate a contain-fit image card.
 * Spec: ECMA-376 §19.3.1.37.
 */
Deno.test("e2e: image contain fit", async () => {
  const pptx = generate(presentation(
    slide(
      scene.image({
        x: st.in(1),
        y: st.in(1),
        w: st.in(4),
        h: st.in(4),
        data: createTestBmp(4, 2),
        contentType: "image/bmp",
        fit: "contain",
      }),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 1);
  assertEquals(result.slides[0]?.shapes[0]?.is_picture, true);
});

/**
 * Generate a cropped cover image.
 * Spec: ECMA-376 §19.3.1.37.
 */
Deno.test("e2e: image cover crop", async () => {
  const pptx = generate(presentation(
    slide(
      scene.image({
        x: st.in(1),
        y: st.in(1),
        w: st.in(2),
        h: st.in(2),
        data: createTestBmp(4, 2),
        contentType: "image/bmp",
        fit: "cover",
      }),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes[0]?.is_picture, true);
});

/**
 * Generate a text box with insets and shrink-text fit.
 * Spec: ECMA-376 §21.1.2.1.1.
 */
Deno.test("e2e: textbox with insets and shrink-text", async () => {
  const pptx = generate(presentation(
    slide(
      scene.textbox(
        {
          x: st.in(1),
          y: st.in(1),
          w: st.in(5),
          h: st.in(1.2),
          inset: st.in(0.1),
          fit: "shrink-text",
          fill: solidFill(st.hex("FFF7E6")),
          line: lineStyle({ width: st.emu(12700) }),
        },
        p(
          text(
            "Dense label that should still render cleanly",
            textStyle({ fontSize: st.font(18) }),
          ),
        ),
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assert(result.slides[0]?.shapes[0]?.text?.includes("Dense label"));
});

/**
 * Generate a gradient and shadow card.
 * Spec: ECMA-376 §20.1.8.
 */
Deno.test("e2e: gradient fill and shadow", async () => {
  const pptx = generate(presentation(
    slide(
      scene.shape(
        "roundRect",
        {
          x: st.in(1),
          y: st.in(1),
          w: st.in(4),
          h: st.in(2),
          fill: linearGradient(
            35,
            gradientStop(st.pct(0), st.hex("4F81BD")),
            gradientStop(st.pct(100), st.hex("1F497D")),
          ),
          shadow: shadow({
            color: st.hex("000000"),
            blur: st.emu(30000),
            distance: st.emu(15000),
            angle: 45,
            alpha: st.pct(30),
          }),
        },
        p(
          paragraphStyle({ align: "center" }),
          bold("Gradient card", textStyle({ fontColor: st.hex("FFFFFF") })),
        ),
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assert(result.slides[0]?.shapes[0]?.text?.includes("Gradient card"));
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
            x: st.emu(0),
            y: st.emu(0),
            w: st.in(10),
            h: st.in(7.5),
            fill: solidFill(st.hex("F5F5F5")),
          },
        ),
        align(
          { x: "center", y: "center", w: st.in(8), h: st.in(4.5) },
          row(
            { gap: st.in(0.25) },
            item({ grow: 1 }, textbox(p("Left panel"))),
            item(
              { grow: 1 },
              col(
                { gap: st.in(0.25) },
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
 * Generate a styled table with padding, borders, and alignment.
 * Spec: ECMA-376 §21.1.3.
 */
Deno.test("e2e: styled table polish", async () => {
  const pptx = generate(presentation(
    slide(
      scene.table(
        {
          x: st.in(1),
          y: st.in(1),
          w: st.in(6),
          h: st.in(2),
          cols: [st.in(2), st.in(2), st.in(2)],
        },
        tr(
          st.in(0.5),
          td(
            cellStyle({
              fill: solidFill(st.hex("17324D")),
              line: lineStyle({ width: st.emu(6350) }),
              padding: st.in(0.05),
              verticalAlign: "middle",
            }),
            p(
              bold("Metric", textStyle({ fontColor: st.hex("FFFFFF") })),
            ),
          ),
          td(
            cellStyle({
              fill: solidFill(st.hex("17324D")),
              line: lineStyle({ width: st.emu(6350) }),
              padding: st.in(0.05),
              verticalAlign: "middle",
            }),
            p(bold("Owner", textStyle({ fontColor: st.hex("FFFFFF") }))),
          ),
          td(
            cellStyle({
              fill: solidFill(st.hex("17324D")),
              line: lineStyle({ width: st.emu(6350) }),
              padding: st.in(0.05),
              verticalAlign: "middle",
            }),
            p(bold("Status", textStyle({ fontColor: st.hex("FFFFFF") }))),
          ),
        ),
        tr(st.in(0.5), td("Activation"), td("Mia"), td("Ready")),
        tr(st.in(0.5), td("Onboarding"), td("Ken"), td("Blocked")),
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
 * Generate a dense, visually mixed slide.
 * Spec: implementation-specific.
 */
Deno.test("e2e: design stress test", async () => {
  const pptx = generate(presentation(
    slide(
      {
        background: backgroundFill(
          linearGradient(
            90,
            gradientStop(st.pct(0), st.hex("FFF8F1")),
            gradientStop(st.pct(100), st.hex("F2F6FB")),
          ),
        ),
      },
      scene.shape(
        "roundRect",
        {
          x: st.in(0.7),
          y: st.in(0.6),
          w: st.in(8.6),
          h: st.in(0.9),
          fill: solidFill(st.hex("17324D")),
        },
      ),
      scene.textbox(
        { x: st.in(1), y: st.in(0.75), w: st.in(5), h: st.in(0.4) },
        p(
          bold(
            "Q2 Strategy",
            textStyle({ fontSize: st.font(22), fontColor: st.hex("FFFFFF") }),
          ),
        ),
      ),
      row(
        {
          padding: {
            left: st.in(0.9),
            right: st.in(0.9),
            top: st.in(1.8),
            bottom: st.in(0.8),
          },
          gap: st.in(0.25),
        },
        item(
          { grow: 2 },
          textbox(
            boxStyle({
              fill: solidFill(st.hex("FFFFFF")),
              line: lineStyle({ width: st.emu(6350), dash: "dash" }),
              shadow: shadow({
                color: st.hex("000000"),
                blur: st.emu(15000),
                distance: st.emu(5000),
                angle: 50,
                alpha: st.pct(20),
              }),
              inset: st.in(0.1),
            }),
            p(
              paragraphStyle({ bullet: bulletChar("•") }),
              "One clear hero, one comparison region, one action region.",
            ),
            p(
              paragraphStyle({ bullet: bulletChar("•") }),
              "Styling and layout should cooperate without theme support.",
            ),
            p("Memo: ", link("example.com", "https://example.com")),
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
