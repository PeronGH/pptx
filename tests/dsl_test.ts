/**
 * Unit and structure tests for the styling/layout DSL.
 */

import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import { assertThrows } from "@std/assert/throws";
import {
  align,
  bg,
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
  shape,
  slide,
  stack,
  sty,
  table,
  td,
  textbox,
  tr,
  tx,
  u,
} from "../mod.ts";
import { resolveSlideChildren } from "../src/layout.ts";
import { cm, emu, font, hex, inch, pct, pt } from "../src/st.ts";
import { createTestBmp, extractZipText } from "./helpers.ts";

/**
 * Verify `u.in()` converts to EMUs.
 * Spec: ECMA-376 §20.1.10.16.
 */
Deno.test("u.in() converts to EMUs", () => {
  assertEquals(u.in(1) as number, 914400);
  assertEquals(u.in(0.5) as number, 457200);
});

/**
 * Verify `u.cm()`, `u.pt()`, `u.emu()`, and `u.pct()` helpers.
 * Spec: ECMA-376 §20.1.10.16 and §20.1.10.40.
 */
Deno.test("unit helpers convert correctly", () => {
  assertEquals(u.cm(2.54) as number, 914400);
  assertEquals(u.pt(72) as number, 914400);
  assertEquals(u.emu(1234) as number, 1234);
  assertEquals(u.pct(50) as number, 50000);
});

/**
 * Verify `u.font()` and `clr.hex()`.
 * Spec: ECMA-376 §20.1.10.68 and §22.9.2.5.
 */
Deno.test("font and color helpers validate", () => {
  assertEquals(u.font(12) as number, 1200);
  assertEquals(clr.hex("ff0000") as string, "FF0000");
  assertThrows(() => clr.hex("#FF0000"), Error);
});

/**
 * Verify public value namespaces share implementation with the helper module.
 * Spec: implementation-specific.
 */
Deno.test("value namespaces share helper implementations", () => {
  assertEquals(u.in, inch);
  assertEquals(u.cm, cm);
  assertEquals(u.pt, pt);
  assertEquals(u.emu, emu);
  assertEquals(clr.hex, hex);
  assertEquals(u.font, font);
  assertEquals(u.pct, pct);
});

/**
 * Verify text run builders create styled runs.
 * Spec: ECMA-376 §21.1.2.3.5, §21.1.2.3.8, and §21.1.2.3.9.
 */
Deno.test("text run builders create styled runs", () => {
  assertEquals(tx.run("plain").text, "plain");
  assertEquals(tx.bold("b").bold, true);
  assertEquals(tx.italic("i").italic, true);
  assertEquals(tx.bi("bi").bold, true);
  assertEquals(tx.bi("bi").italic, true);
  assertEquals(tx.underline("u").underline, true);
  assertEquals(
    tx.link("site", "https://example.com").hyperlink,
    "https://example.com",
  );
});

/**
 * Verify style fragments merge last-wins and carry new styling fields.
 * Spec: implementation-specific.
 */
Deno.test("style fragments merge deterministically", () => {
  const box = sty.merge.box(
    sty.box({
      fill: fill.solid(clr.hex("FF0000")),
      fit: "shrink-text",
    }),
    sty.box({
      line: sty.line({ width: u.emu(12700), dash: "dash" }),
      inset: u.in(0.1),
    }),
    sty.box({
      fill: fill.grad(
        45,
        fill.stop(u.pct(0), clr.hex("FFFFFF")),
        fill.stop(u.pct(100), clr.hex("000000")),
      ),
      shadow: sty.shadow({
        color: clr.hex("000000"),
        blur: u.emu(10000),
        distance: u.emu(5000),
        angle: 45,
      }),
    }),
  );
  assertEquals(box.fill?.kind, "linear-gradient");
  assertEquals(box.line?.dash, "dash");
  assertEquals(box.fit, "shrink-text");
  assertEquals(box.inset, u.in(0.1));
  assertEquals(box.shadow?.angle, 45);

  const paragraph = sty.merge.para(
    sty.para({ align: "center" }),
    sty.para({ bullet: sty.bullet.char("•") }),
  );
  assertEquals(paragraph.align, "center");
  assertEquals(paragraph.bullet?.kind, "char");

  const textRun = sty.merge.text(
    sty.text({ fontFamily: "Aptos", fontColor: clr.hex("112233") }),
    sty.text({ bold: true }),
  );
  assertEquals(textRun.fontFamily, "Aptos");
  assertEquals(textRun.bold, true);

  const cell = sty.merge.cell(
    sty.cell({ fill: fill.solid(clr.hex("CCCCCC")) }),
    sty.cell({
      line: sty.line({ width: u.emu(6350) }),
      padding: u.in(0.05),
      verticalAlign: "middle",
    }),
  );
  assertEquals(cell.line?.width, u.emu(6350));
  assertEquals(cell.padding, u.in(0.05));
  assertEquals(cell.verticalAlign, "middle");
});

/**
 * Verify paragraphs carry style and runs.
 * Spec: ECMA-376 §21.1.2.2.6.
 */
Deno.test("paragraph builder supports styles and runs", () => {
  const para = p(
    sty.para({
      align: "center",
      level: 1,
      bullet: sty.bullet.num("arabicPeriod"),
    }),
    tx.bold("Hello"),
    ", world",
  );
  assertEquals(para.align, "center");
  assertEquals(para.level, 1);
  assertEquals(para.bullet?.kind, "autonum");
  assertEquals(para.runs.length, 2);
});

/**
 * Verify leaf builders carry new style/image properties.
 * Spec: implementation-specific.
 */
Deno.test("leaf builders preserve new style and image fields", () => {
  const box = textbox(
    sty.merge.box(sty.box({
      fill: fill.solid(clr.hex("FFEECC")),
      inset: {
        top: u.in(0.1),
        right: u.in(0.2),
        bottom: u.in(0.3),
        left: u.in(0.4),
      },
      fit: "none",
    })),
    p("Hello"),
  );
  assertEquals(box.fit, "none");
  assertEquals(
    typeof box.inset === "object" && box.inset !== null
      ? box.inset.left
      : undefined,
    u.in(0.4),
  );

  const preset = shape("rect", p("Rect"));
  assertEquals(preset.preset, "rect");

  const img = image({
    data: createTestBmp(4, 2),
    contentType: "image/bmp",
    description: "pixel",
    fit: "cover",
    crop: { left: u.pct(10) },
    alpha: u.pct(80),
  });
  assertEquals(img.fit, "cover");
  assertEquals(img.crop?.left, u.pct(10));
  assertEquals(img.alpha, u.pct(80));

  const grid = table(
    { cols: [u.in(2), u.in(2)] },
    tr(u.in(0.5), td("A"), td("B")),
  );
  assertEquals(grid.rows.length, 1);
});

/**
 * Verify scene builders create positioned nodes with richer props.
 * Spec: implementation-specific.
 */
Deno.test("scene builders create positioned nodes", () => {
  const box = scene.textbox(
    {
      x: u.in(1),
      y: u.in(2),
      w: u.in(3),
      h: u.in(1),
      fit: "resize-shape",
      inset: u.in(0.1),
    },
    p("Hello"),
  );
  assertEquals(box.x, u.in(1));
  assertEquals(box.w, u.in(3));
  assertEquals(box.fit, "resize-shape");
  assertEquals(box.paragraphs[0]?.runs[0]?.text, "Hello");
});

/**
 * Resolve a row with implicit equal-width items.
 * Spec: implementation-specific.
 */
Deno.test("row() resolves equal-width default items", () => {
  const nodes = resolveSlideChildren(
    [
      row(textbox(p("A")), textbox(p("B"))),
    ],
    { x: u.emu(0), y: u.emu(0), w: u.in(10), h: u.in(2) },
  );

  assertEquals(nodes.length, 2);
  assertEquals(nodes[0]?.w, u.in(5));
  assertEquals(nodes[1]?.x, u.in(5));
});

/**
 * Resolve a row with fixed basis, grow, and gap.
 * Spec: implementation-specific.
 */
Deno.test("row() resolves basis, grow, and gap", () => {
  const nodes = resolveSlideChildren(
    [
      row(
        { gap: u.in(0.5) },
        item({ basis: u.in(2) }, textbox("Fixed")),
        item({ grow: 1 }, textbox("Grow")),
      ),
    ],
    { x: u.emu(0), y: u.emu(0), w: u.in(10), h: u.in(2) },
  );

  assertEquals(nodes.length, 2);
  assertEquals(nodes[0]?.w, u.in(2));
  assertEquals(nodes[1]?.x, u.in(2.5));
  assertEquals(nodes[1]?.w, u.in(7.5));
});

/**
 * Resolve a column with padding and gap.
 * Spec: implementation-specific.
 */
Deno.test("col() resolves padding and gap", () => {
  const nodes = resolveSlideChildren(
    [
      col(
        { padding: u.in(1), gap: u.in(0.25) },
        textbox("Top"),
        textbox("Bottom"),
      ),
    ],
    { x: u.emu(0), y: u.emu(0), w: u.in(6), h: u.in(6) },
  );

  assertEquals(nodes.length, 2);
  assertEquals(nodes[0]?.x, u.in(1));
  assertEquals(nodes[1]?.y, u.in(3.125));
});

/**
 * Resolve a stack overlay.
 * Spec: implementation-specific.
 */
Deno.test("stack() overlays children in the same frame", () => {
  const nodes = resolveSlideChildren(
    [
      stack(
        { padding: u.in(1) },
        textbox("Base"),
        shape("rect", p("Overlay")),
      ),
    ],
    { x: u.emu(0), y: u.emu(0), w: u.in(10), h: u.in(6) },
  );

  assertEquals(nodes.length, 2);
  assertEquals(nodes[0]?.x, u.in(1));
  assertEquals(nodes[1]?.x, u.in(1));
  assertEquals(nodes[0]?.w, u.in(8));
  assertEquals(nodes[1]?.w, u.in(8));
});

/**
 * Nested scene nodes in stack() preserve their absolute geometry.
 * Spec: implementation-specific.
 */
Deno.test("stack() preserves nested scene node geometry", () => {
  const nodes = resolveSlideChildren(
    [
      stack(
        { padding: u.in(1) },
        scene.shape("rect", {
          x: u.in(0.5),
          y: u.in(0.5),
          w: u.in(8),
          h: u.in(1),
          fill: fill.solid(clr.hex("17324D")),
        }),
        textbox("Overlay"),
      ),
    ],
    { x: u.emu(0), y: u.emu(0), w: u.in(10), h: u.in(6) },
  );

  assertEquals(nodes.length, 2);
  assertEquals(nodes[0]?.kind, "shape");
  assertEquals(nodes[0]?.x, u.in(0.5));
  assertEquals(nodes[0]?.y, u.in(0.5));
  assertEquals(nodes[0]?.w, u.in(8));
  assertEquals(nodes[0]?.h, u.in(1));
  assertEquals(nodes[1]?.x, u.in(1));
  assertEquals(nodes[1]?.w, u.in(8));
});

/**
 * Resolve an aligned child inside an overlay frame.
 * Spec: implementation-specific.
 */
Deno.test("align() positions a child inside its parent frame", () => {
  const nodes = resolveSlideChildren(
    [
      stack(
        align(
          {
            x: "center",
            y: "end",
            w: u.in(3),
            h: u.in(1),
            padding: u.in(0.5),
          },
          textbox("Aligned"),
        ),
      ),
    ],
    { x: u.emu(0), y: u.emu(0), w: u.in(10), h: u.in(6) },
  );

  assertEquals(nodes.length, 1);
  assertEquals(nodes[0]?.x, u.in(3.5));
  assertEquals(nodes[0]?.y, u.in(4.5));
});

/**
 * Slide props preserve background metadata.
 * Spec: implementation-specific.
 */
Deno.test("slide() accepts slide props", () => {
  const deck = presentation(
    slide(
      {
        background: bg.fill(
          fill.grad(
            90,
            fill.stop(u.pct(0), clr.hex("FFFFFF")),
            fill.stop(u.pct(100), clr.hex("EEEEEE")),
          ),
        ),
      },
      stack(textbox("Hello")),
    ),
  );

  assertEquals(deck.slides[0]?.props.background?.kind, "fill");
});

/**
 * Generated XML includes background fill.
 * Spec: ECMA-376 §19.3.1.1 and §19.3.1.2.
 */
Deno.test("pptx XML includes slide background fill", () => {
  const pptx = generate(presentation(
    slide(
      {
        background: bg.fill(
          fill.solid(clr.hex("F5F5F5")),
        ),
      },
      stack(textbox("Hello")),
    ),
  ));

  const slideXml = extractZipText(pptx, "ppt/slides/slide1.xml");
  assert(slideXml.includes("<p:bg>"));
  assert(slideXml.includes("<a:solidFill>"));
});

/**
 * Generated XML includes text fit and inset attributes.
 * Spec: ECMA-376 §21.1.2.1.1 and §21.1.2.1.3.
 */
Deno.test("pptx XML includes text fit and inset", () => {
  const pptx = generate(presentation(
    slide(
      scene.textbox(
        {
          x: u.in(1),
          y: u.in(1),
          w: u.in(4),
          h: u.in(1),
          inset: {
            left: u.in(0.1),
            top: u.in(0.05),
          },
          fit: "shrink-text",
        },
        p("Hello"),
      ),
    ),
  ));

  const slideXml = extractZipText(pptx, "ppt/slides/slide1.xml");
  assert(slideXml.includes('lIns="91440"'));
  assert(slideXml.includes('tIns="45720"'));
  assert(slideXml.includes("<a:normAutofit/>"));
});

/**
 * Generated XML includes image crop data for cover fit.
 * Spec: ECMA-376 §20.1.8.14 (`a:blipFill`) and §20.1.8.55 (`a:srcRect`).
 */
Deno.test("pptx XML includes image crop for cover fit", () => {
  const pptx = generate(presentation(
    slide(
      scene.image({
        x: u.in(1),
        y: u.in(1),
        w: u.in(2),
        h: u.in(2),
        data: createTestBmp(4, 2),
        contentType: "image/bmp",
        fit: "cover",
      }),
    ),
  ));

  const slideXml = extractZipText(pptx, "ppt/slides/slide1.xml");
  assert(slideXml.includes("<a:srcRect"));
});

/**
 * Generated XML includes gradient fill and outer shadow.
 * Spec: ECMA-376 §20.1.8.33 and §20.1.8.45.
 */
Deno.test("pptx XML includes gradient fill and outer shadow", () => {
  const pptx = generate(presentation(
    slide(
      scene.shape(
        "rect",
        {
          x: u.in(1),
          y: u.in(1),
          w: u.in(4),
          h: u.in(2),
          fill: fill.grad(
            45,
            fill.stop(u.pct(0), clr.hex("FF0000")),
            fill.stop(u.pct(100), clr.hex("0000FF")),
          ),
          shadow: sty.shadow({
            color: clr.hex("000000"),
            blur: u.emu(10000),
            distance: u.emu(5000),
            angle: 45,
            alpha: u.pct(50),
          }),
        },
      ),
    ),
  ));

  const slideXml = extractZipText(pptx, "ppt/slides/slide1.xml");
  assert(slideXml.includes("<a:gradFill"));
  assert(slideXml.includes("<a:outerShdw"));
});

/**
 * Generated XML includes table padding, alignment, and borders.
 * Spec: ECMA-376 §21.1.3.7 and §21.1.3.17.
 */
Deno.test("pptx XML includes table cell padding and borders", () => {
  const pptx = generate(presentation(
    slide(
      scene.table(
        {
          x: u.in(1),
          y: u.in(1),
          w: u.in(4),
          h: u.in(1),
          cols: [u.in(2), u.in(2)],
        },
        tr(
          u.in(0.5),
          td(
            sty.cell({
              padding: u.in(0.05),
              verticalAlign: "middle",
              line: sty.line({ width: u.emu(6350), dash: "dot" }),
            }),
            "A",
          ),
          td("B"),
        ),
      ),
    ),
  ));

  const slideXml = extractZipText(pptx, "ppt/slides/slide1.xml");
  assert(slideXml.includes('marL="45720"'));
  assert(slideXml.includes('anchor="ctr"'));
  assert(slideXml.includes("<a:lnL"));
});
