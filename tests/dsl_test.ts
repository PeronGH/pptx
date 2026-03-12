/**
 * Unit and structure tests for the styling/layout DSL.
 */

import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import { assertThrows } from "@std/assert/throws";
import {
  align,
  bg,
  type BoxStyleInput,
  type CellStyleInput,
  chart,
  clr,
  fill,
  generate,
  image,
  item,
  p,
  type ParagraphStyleInput,
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
  type TextStyleInput,
  tr,
  tx,
  u,
} from "../mod.ts";
import { resolveSlideChildren } from "../src/layout.ts";
import { CONTENT_TYPE, REL_TYPE } from "../src/ooxml/namespaces.ts";
import { cm, emu, font, hex, inch, pct, pt } from "../src/st.ts";
import { createTestBmp, extractZipText } from "./helpers.ts";

type Assert<T extends true> = T;
type IsAssignable<From, To> = [From] extends [To] ? true : false;

const createdStyles = sty.create({
  card: sty.box({
    fill: fill.solid(clr.hex("FFEECC")),
    inset: u.in(0.1),
  }),
  title: sty.text({
    fontSize: u.font(12),
    fontColor: clr.hex("112233"),
  }),
  bullets: sty.para({
    align: "center",
    bullet: sty.bullet.num("arabicPeriod"),
  }),
  metricCell: sty.cell({
    padding: u.in(0.05),
    verticalAlign: "middle",
  }),
});

type _cardAppliesToBoxes = Assert<
  IsAssignable<typeof createdStyles.card, BoxStyleInput>
>;
type _cardDoesNotApplyToText = Assert<
  IsAssignable<typeof createdStyles.card, TextStyleInput> extends false ? true
    : false
>;
type _titleAppliesToText = Assert<
  IsAssignable<typeof createdStyles.title, TextStyleInput>
>;
type _titleDoesNotApplyToCells = Assert<
  IsAssignable<typeof createdStyles.title, CellStyleInput> extends false ? true
    : false
>;
type _bulletsApplyToParagraphs = Assert<
  IsAssignable<typeof createdStyles.bullets, ParagraphStyleInput>
>;
type _metricCellAppliesToCells = Assert<
  IsAssignable<typeof createdStyles.metricCell, CellStyleInput>
>;

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
 * Verify text run builders create styled runs with separate style data.
 * Spec: ECMA-376 §21.1.2.3.5, §21.1.2.3.8, and §21.1.2.3.9.
 */
Deno.test("text run builders create styled runs", () => {
  assertEquals(tx.run("plain").text, "plain");
  assertEquals(tx.bold("b").style?.bold, true);
  assertEquals(tx.italic("i").style?.italic, true);
  assertEquals(tx.bi("bi").style?.bold, true);
  assertEquals(tx.bi("bi").style?.italic, true);
  assertEquals(tx.underline("u").style?.underline, true);
  assertEquals(
    tx.link("site", "https://example.com").hyperlink,
    "https://example.com",
  );
});

/**
 * Verify reusable style values and local arrays compose deterministically.
 * Spec: implementation-specific.
 */
Deno.test("sty.create produces reusable typed styles", () => {
  const box = textbox(
    {
      style: [
        createdStyles.card,
        sty.box({
          line: sty.line({ width: u.emu(12700), dash: "dash" }),
          shadow: sty.shadow({
            color: clr.hex("000000"),
            blur: u.emu(10000),
            distance: u.emu(5000),
            angle: 45,
          }),
          fit: "shrink-text",
        }),
      ],
    },
    p("Hello"),
  );
  assertEquals(box.style?.fill?.kind, "solid");
  assertEquals(box.style?.line?.dash, "dash");
  assertEquals(box.style?.fit, "shrink-text");
  assertEquals(box.style?.inset, u.in(0.1));
  assertEquals(box.style?.shadow?.angle, 45);

  const paragraph = p({ style: createdStyles.bullets }, "Hello");
  assertEquals(paragraph.style?.align, "center");
  assertEquals(paragraph.style?.bullet?.kind, "autonum");

  const run = tx.bold("Hello", {
    style: [createdStyles.title, sty.text({ fontFamily: "Aptos" })],
  });
  assertEquals(run.style?.bold, true);
  assertEquals(run.style?.fontFamily, "Aptos");
  assertEquals(run.style?.fontColor, clr.hex("112233"));
});

/**
 * Verify paragraphs carry separate style and runs.
 * Spec: ECMA-376 §21.1.2.2.6.
 */
Deno.test("paragraph builder supports explicit style", () => {
  const para = p(
    { style: createdStyles.bullets },
    tx.bold("Hello"),
    ", world",
  );
  assertEquals(para.style?.align, "center");
  assertEquals(para.style?.bullet?.kind, "autonum");
  assertEquals(para.runs.length, 2);
});

/**
 * Verify leaf builders preserve explicit style and image fields.
 * Spec: implementation-specific.
 */
Deno.test("leaf builders preserve style and image fields", () => {
  const box = textbox({ style: createdStyles.card }, p("Hello"));
  assertEquals(box.style?.fill?.kind, "solid");
  assertEquals(box.style?.inset, u.in(0.1));

  const preset = shape("rect", { style: createdStyles.card }, p("Rect"));
  assertEquals(preset.preset, "rect");
  assertEquals(preset.style?.fill?.kind, "solid");

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

  const bar = chart.bar({
    data: [
      { month: "Jan", amount: 12 },
      { month: "Feb", amount: 18 },
    ],
    category: "month",
    value: "amount",
    title: "Pipeline",
    labels: true,
  });
  assertEquals(bar.kind, "chart");
  assertEquals(bar.chartType, "bar");
  assertEquals(bar.points[0]?.category, "Jan");
  assertEquals(bar.points[1]?.value, 18);

  const grid = table(
    { cols: [u.in(2), u.in(2)] },
    tr(u.in(0.5), td({ style: createdStyles.metricCell }, "A"), td("B")),
  );
  assertEquals(grid.rows.length, 1);
});

/**
 * Verify scene builders create positioned nodes with explicit style.
 * Spec: implementation-specific.
 */
Deno.test("scene builders create positioned nodes", () => {
  const box = scene.textbox(
    {
      x: u.in(1),
      y: u.in(2),
      w: u.in(3),
      h: u.in(1),
      style: sty.box({
        fit: "resize-shape",
        inset: u.in(0.1),
      }),
    },
    p("Hello"),
  );
  assertEquals(box.x, u.in(1));
  assertEquals(box.w, u.in(3));
  assertEquals(box.style?.fit, "resize-shape");
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
 * Resolve a stack overlay and preserve nested scene geometry.
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
          style: sty.box({ fill: fill.solid(clr.hex("17324D")) }),
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
  assertEquals(nodes[1]?.x, u.in(1));
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
          style: sty.box({
            inset: {
              left: u.in(0.1),
              top: u.in(0.05),
            },
            fit: "shrink-text",
          }),
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
          style: sty.box({
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
            {
              style: sty.cell({
                padding: u.in(0.05),
                verticalAlign: "middle",
                line: sty.line({ width: u.emu(6350), dash: "dot" }),
              }),
            },
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

/**
 * Generated package includes chart part and embedded workbook.
 * Spec: ECMA-376 §14.2.1 and §15.2.11.
 */
Deno.test("pptx package includes chart part and embedded workbook", () => {
  const pptx = generate(presentation(
    slide(
      align(
        { x: "center", y: "center", w: u.in(5), h: u.in(3) },
        chart.bar({
          data: [
            { metric: "Revenue", amount: 12 },
            { metric: "Growth", amount: 15 },
          ],
          category: "metric",
          value: "amount",
          title: "Highlights",
          labels: true,
          color: clr.hex("2678B4"),
        }),
      ),
    ),
  ));

  const contentTypes = extractZipText(pptx, "[Content_Types].xml");
  const slideRels = extractZipText(pptx, "ppt/slides/_rels/slide1.xml.rels");
  const chartXml = extractZipText(pptx, "ppt/charts/chart1.xml");
  const chartRels = extractZipText(pptx, "ppt/charts/_rels/chart1.xml.rels");

  assert(contentTypes.includes(CONTENT_TYPE.chart));
  assert(contentTypes.includes(CONTENT_TYPE.spreadsheetPackage));
  assert(slideRels.includes(REL_TYPE.chart));
  assert(slideRels.includes("../charts/chart1.xml"));
  assert(chartXml.includes("<c:chartSpace"));
  assert(chartXml.includes("<c:barChart>"));
  assert(chartXml.includes("<c:externalData"));
  assert(chartXml.includes("Sheet1!$A$2:$A$3"));
  assert(chartXml.includes("Sheet1!$B$2:$B$3"));
  assert(chartRels.includes(REL_TYPE.package));
  assert(chartRels.includes("../embeddings/chart1.xlsx"));
});

/**
 * Table columns are scaled to the allocated frame width.
 * Spec: implementation-specific.
 */
Deno.test("table column widths fit the resolved table frame", () => {
  const pptx = generate(presentation(
    slide(
      row(
        { gap: u.in(0.25), padding: u.in(1) },
        item({ basis: u.in(2.5) }, textbox("Left")),
        item(
          { grow: 1 },
          table(
            { cols: [u.in(2.5), u.in(2.5)] },
            tr(u.in(0.5), td("Revenue"), td("$1.2M")),
            tr(u.in(0.5), td("Growth"), td("15%")),
          ),
        ),
        item({ basis: u.in(2.5) }, textbox("Right")),
      ),
    ),
  ));

  const slideXml = extractZipText(pptx, "ppt/slides/slide1.xml");
  assert(slideXml.includes('<a:gridCol w="1143000"'));
  assertEquals(slideXml.match(/<a:gridCol w="1143000"/g)?.length, 2);
});
