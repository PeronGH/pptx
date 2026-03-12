/**
 * Unit and structure tests for the styling/layout DSL.
 */

import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import { assertThrows } from "@std/assert/throws";
import {
  align,
  backgroundFill,
  bold,
  boldItalic,
  boxStyle,
  bulletAutoNum,
  bulletChar,
  cellStyle,
  col,
  generate,
  gradientStop,
  image,
  italic,
  item,
  linearGradient,
  lineStyle,
  link,
  mergeBoxStyles,
  mergeCellStyles,
  mergeParagraphStyles,
  mergeTextStyles,
  p,
  paragraphStyle,
  presentation,
  resolveSlideChildren,
  row,
  scene,
  shadow,
  shape,
  slide,
  solidFill,
  st,
  stack,
  table,
  td,
  text,
  textbox,
  textStyle,
  tr,
  underline,
} from "../mod.ts";
import { cm, emu, font, hex, inch, pct, pt } from "../src/st.ts";
import { createTestBmp, extractZipText } from "./helpers.ts";

/**
 * Verify st.in() converts to EMUs.
 * Spec: ECMA-376 §20.1.10.16.
 */
Deno.test("st.in() converts to EMUs", () => {
  assertEquals(st.in(1) as number, 914400);
  assertEquals(st.in(0.5) as number, 457200);
});

/**
 * Verify st.cm(), st.pt(), st.emu(), and st.pct() helpers.
 * Spec: ECMA-376 §20.1.10.16 and §20.1.10.40.
 */
Deno.test("unit helpers convert correctly", () => {
  assertEquals(st.cm(2.54) as number, 914400);
  assertEquals(st.pt(72) as number, 914400);
  assertEquals(st.emu(1234) as number, 1234);
  assertEquals(st.pct(50) as number, 50000);
});

/**
 * Verify st.font() and st.hex().
 * Spec: ECMA-376 §21.1.2.3.10 and §20.1.2.3.19.
 */
Deno.test("font and color helpers validate", () => {
  assertEquals(st.font(12) as number, 1200);
  assertEquals(st.hex("ff0000") as string, "FF0000");
  assertThrows(() => st.hex("#FF0000"), Error);
});

/**
 * Verify direct helper imports share the same implementation as st.*.
 * Spec: implementation-specific.
 */
Deno.test("direct st helpers share implementation with st namespace", () => {
  assertEquals(st.in, inch);
  assertEquals(st.cm, cm);
  assertEquals(st.pt, pt);
  assertEquals(st.emu, emu);
  assertEquals(st.hex, hex);
  assertEquals(st.font, font);
  assertEquals(st.pct, pct);
});

/**
 * Verify text run builders create styled runs.
 * Spec: ECMA-376 §21.1.2.3.8.
 */
Deno.test("text run builders create styled runs", () => {
  assertEquals(text("plain").text, "plain");
  assertEquals(bold("b").bold, true);
  assertEquals(italic("i").italic, true);
  assertEquals(boldItalic("bi").bold, true);
  assertEquals(boldItalic("bi").italic, true);
  assertEquals(underline("u").underline, true);
  assertEquals(
    link("site", "https://example.com").hyperlink,
    "https://example.com",
  );
});

/**
 * Verify style fragments merge last-wins and carry new styling fields.
 * Spec: implementation-specific.
 */
Deno.test("style fragments merge deterministically", () => {
  const box = mergeBoxStyles(
    boxStyle({
      fill: solidFill(st.hex("FF0000")),
      fit: "shrink-text",
    }),
    boxStyle({
      line: lineStyle({ width: st.emu(12700), dash: "dash" }),
      inset: st.in(0.1),
    }),
    boxStyle({
      fill: linearGradient(
        45,
        gradientStop(st.pct(0), st.hex("FFFFFF")),
        gradientStop(st.pct(100), st.hex("000000")),
      ),
      shadow: shadow({
        color: st.hex("000000"),
        blur: st.emu(10000),
        distance: st.emu(5000),
        angle: 45,
      }),
    }),
  );
  assertEquals(box.fill?.kind, "linear-gradient");
  assertEquals(box.line?.dash, "dash");
  assertEquals(box.fit, "shrink-text");
  assertEquals(box.inset, st.in(0.1));
  assertEquals(box.shadow?.angle, 45);

  const paragraph = mergeParagraphStyles(
    paragraphStyle({ align: "center" }),
    paragraphStyle({ bullet: bulletChar("•") }),
  );
  assertEquals(paragraph.align, "center");
  assertEquals(paragraph.bullet?.kind, "char");

  const textRun = mergeTextStyles(
    textStyle({ fontFamily: "Aptos", fontColor: st.hex("112233") }),
    textStyle({ bold: true }),
  );
  assertEquals(textRun.fontFamily, "Aptos");
  assertEquals(textRun.bold, true);

  const cell = mergeCellStyles(
    cellStyle({ fill: solidFill(st.hex("CCCCCC")) }),
    cellStyle({
      line: lineStyle({ width: st.emu(6350) }),
      padding: st.in(0.05),
      verticalAlign: "middle",
    }),
  );
  assertEquals(cell.line?.width, st.emu(6350));
  assertEquals(cell.padding, st.in(0.05));
  assertEquals(cell.verticalAlign, "middle");
});

/**
 * Verify paragraphs carry style and runs.
 * Spec: ECMA-376 §21.1.2.2.6.
 */
Deno.test("paragraph builder supports styles and runs", () => {
  const para = p(
    paragraphStyle({
      align: "center",
      level: 1,
      bullet: bulletAutoNum("arabicPeriod"),
    }),
    bold("Hello"),
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
    mergeBoxStyles(boxStyle({
      fill: solidFill(st.hex("FFEECC")),
      inset: {
        top: st.in(0.1),
        right: st.in(0.2),
        bottom: st.in(0.3),
        left: st.in(0.4),
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
    st.in(0.4),
  );

  const preset = shape("rect", p("Rect"));
  assertEquals(preset.preset, "rect");

  const img = image({
    data: createTestBmp(4, 2),
    contentType: "image/bmp",
    description: "pixel",
    fit: "cover",
    crop: { left: st.pct(10) },
    alpha: st.pct(80),
  });
  assertEquals(img.fit, "cover");
  assertEquals(img.crop?.left, st.pct(10));
  assertEquals(img.alpha, st.pct(80));

  const grid = table(
    { cols: [st.in(2), st.in(2)] },
    tr(st.in(0.5), td("A"), td("B")),
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
      x: st.in(1),
      y: st.in(2),
      w: st.in(3),
      h: st.in(1),
      fit: "resize-shape",
      inset: st.in(0.1),
    },
    p("Hello"),
  );
  assertEquals(box.x, st.in(1));
  assertEquals(box.w, st.in(3));
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
    { x: st.emu(0), y: st.emu(0), w: st.in(10), h: st.in(2) },
  );

  assertEquals(nodes.length, 2);
  assertEquals(nodes[0]?.w, st.in(5));
  assertEquals(nodes[1]?.x, st.in(5));
});

/**
 * Resolve a row with fixed basis, grow, and gap.
 * Spec: implementation-specific.
 */
Deno.test("row() resolves basis, grow, and gap", () => {
  const nodes = resolveSlideChildren(
    [
      row(
        { gap: st.in(0.5) },
        item({ basis: st.in(2) }, textbox("Fixed")),
        item({ grow: 1 }, textbox("Grow")),
      ),
    ],
    { x: st.emu(0), y: st.emu(0), w: st.in(10), h: st.in(2) },
  );

  assertEquals(nodes.length, 2);
  assertEquals(nodes[0]?.w, st.in(2));
  assertEquals(nodes[1]?.x, st.in(2.5));
  assertEquals(nodes[1]?.w, st.in(7.5));
});

/**
 * Resolve a column with padding and gap.
 * Spec: implementation-specific.
 */
Deno.test("col() resolves padding and gap", () => {
  const nodes = resolveSlideChildren(
    [
      col(
        { padding: st.in(1), gap: st.in(0.25) },
        textbox("Top"),
        textbox("Bottom"),
      ),
    ],
    { x: st.emu(0), y: st.emu(0), w: st.in(6), h: st.in(6) },
  );

  assertEquals(nodes.length, 2);
  assertEquals(nodes[0]?.x, st.in(1));
  assertEquals(nodes[1]?.y, st.in(3.125));
});

/**
 * Resolve a stack overlay.
 * Spec: implementation-specific.
 */
Deno.test("stack() overlays children in the same frame", () => {
  const nodes = resolveSlideChildren(
    [
      stack(
        { padding: st.in(1) },
        textbox("Base"),
        shape("rect", p("Overlay")),
      ),
    ],
    { x: st.emu(0), y: st.emu(0), w: st.in(10), h: st.in(6) },
  );

  assertEquals(nodes.length, 2);
  assertEquals(nodes[0]?.x, st.in(1));
  assertEquals(nodes[1]?.x, st.in(1));
  assertEquals(nodes[0]?.w, st.in(8));
  assertEquals(nodes[1]?.w, st.in(8));
});

/**
 * Nested scene nodes in stack() preserve their absolute geometry.
 * Spec: implementation-specific.
 */
Deno.test("stack() preserves nested scene node geometry", () => {
  const nodes = resolveSlideChildren(
    [
      stack(
        { padding: st.in(1) },
        scene.shape("rect", {
          x: st.in(0.5),
          y: st.in(0.5),
          w: st.in(8),
          h: st.in(1),
          fill: solidFill(st.hex("17324D")),
        }),
        textbox("Overlay"),
      ),
    ],
    { x: st.emu(0), y: st.emu(0), w: st.in(10), h: st.in(6) },
  );

  assertEquals(nodes.length, 2);
  assertEquals(nodes[0]?.kind, "shape");
  assertEquals(nodes[0]?.x, st.in(0.5));
  assertEquals(nodes[0]?.y, st.in(0.5));
  assertEquals(nodes[0]?.w, st.in(8));
  assertEquals(nodes[0]?.h, st.in(1));
  assertEquals(nodes[1]?.x, st.in(1));
  assertEquals(nodes[1]?.w, st.in(8));
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
            w: st.in(3),
            h: st.in(1),
            padding: st.in(0.5),
          },
          textbox("Aligned"),
        ),
      ),
    ],
    { x: st.emu(0), y: st.emu(0), w: st.in(10), h: st.in(6) },
  );

  assertEquals(nodes.length, 1);
  assertEquals(nodes[0]?.x, st.in(3.5));
  assertEquals(nodes[0]?.y, st.in(4.5));
});

/**
 * Slide props preserve background metadata.
 * Spec: implementation-specific.
 */
Deno.test("slide() accepts slide props", () => {
  const deck = presentation(
    slide(
      {
        background: backgroundFill(
          linearGradient(
            90,
            gradientStop(st.pct(0), st.hex("FFFFFF")),
            gradientStop(st.pct(100), st.hex("EEEEEE")),
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
 * Spec: ECMA-376 §13.3.8 and p:bgPr.
 */
Deno.test("pptx XML includes slide background fill", () => {
  const pptx = generate(presentation(
    slide(
      {
        background: backgroundFill(
          solidFill(st.hex("F5F5F5")),
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
 * Spec: ECMA-376 §21.1.2.1.1 and §21.1.2.1.2.
 */
Deno.test("pptx XML includes text fit and inset", () => {
  const pptx = generate(presentation(
    slide(
      scene.textbox(
        {
          x: st.in(1),
          y: st.in(1),
          w: st.in(4),
          h: st.in(1),
          inset: {
            left: st.in(0.1),
            top: st.in(0.05),
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
 * Spec: ECMA-376 §20.1.8.14 (a:blipFill) and a:srcRect.
 */
Deno.test("pptx XML includes image crop for cover fit", () => {
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

  const slideXml = extractZipText(pptx, "ppt/slides/slide1.xml");
  assert(slideXml.includes("<a:srcRect"));
});

/**
 * Generated XML includes gradient fill and outer shadow.
 * Spec: ECMA-376 §20.1.8 and §20.1.8.20.
 */
Deno.test("pptx XML includes gradient fill and outer shadow", () => {
  const pptx = generate(presentation(
    slide(
      scene.shape(
        "rect",
        {
          x: st.in(1),
          y: st.in(1),
          w: st.in(4),
          h: st.in(2),
          fill: linearGradient(
            45,
            gradientStop(st.pct(0), st.hex("FF0000")),
            gradientStop(st.pct(100), st.hex("0000FF")),
          ),
          shadow: shadow({
            color: st.hex("000000"),
            blur: st.emu(10000),
            distance: st.emu(5000),
            angle: 45,
            alpha: st.pct(50),
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
 * Spec: ECMA-376 §21.1.3.15.
 */
Deno.test("pptx XML includes table cell padding and borders", () => {
  const pptx = generate(presentation(
    slide(
      scene.table(
        {
          x: st.in(1),
          y: st.in(1),
          w: st.in(4),
          h: st.in(1),
          cols: [st.in(2), st.in(2)],
        },
        tr(
          st.in(0.5),
          td(
            cellStyle({
              padding: st.in(0.05),
              verticalAlign: "middle",
              line: lineStyle({ width: st.emu(6350), dash: "dot" }),
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
