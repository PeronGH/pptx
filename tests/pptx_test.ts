/**
 * End-to-end and unit tests for the refactored PPTX DSL.
 *
 * The suite covers:
 * 1. Unit/value helpers
 * 2. Composable style fragments
 * 3. Text and content leaves
 * 4. Layout resolution into scene nodes
 * 5. PPTX generation validated by ZIP/OPC/python-pptx/LibreOffice
 */

import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import { assertThrows } from "@std/assert/throws";
import {
  bold,
  boldItalic,
  boxStyle,
  bulletAutoNum,
  bulletChar,
  bulletNone,
  cellStyle,
  cm,
  col,
  emu,
  fontSize,
  generate,
  hexColor,
  image,
  inches,
  italic,
  item,
  lineStyle,
  link,
  mergeBoxStyles,
  mergeCellStyles,
  mergeParagraphStyles,
  mergeTextStyles,
  noFill,
  p,
  paragraphStyle,
  percentage,
  presentation,
  pt,
  resolveSlideChildren,
  row,
  scene,
  shape,
  slide,
  solidFill,
  table,
  td,
  text,
  textbox,
  textStyle,
  tr,
  underline,
} from "../mod.ts";

/** Result from the Python validation script. */
interface ValidationResult {
  slide_count: number;
  slides: Array<{
    index: number;
    shape_count: number;
    shapes: Array<{
      name: string;
      shape_type: string | null;
      has_text_frame: boolean;
      text?: string;
      is_picture?: boolean;
      image_content_type?: string;
      is_table?: boolean;
      table_rows?: number;
      table_cols?: number;
      table_data?: string[][];
    }>;
  }>;
}

async function validate(
  pptxPath: string,
  expectedSlides: number,
): Promise<ValidationResult> {
  const pythonPath = new URL("../scripts/python3", import.meta.url).pathname;
  const scriptPath = new URL("../scripts/validate.py", import.meta.url)
    .pathname;

  const cmd = new Deno.Command(pythonPath, {
    args: [
      scriptPath,
      pptxPath,
      "--slides",
      String(expectedSlides),
      "--libreoffice",
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const output = await cmd.output();
  const stderr = new TextDecoder().decode(output.stderr);
  if (!output.success) {
    throw new Error(`Validation failed:\n${stderr}`);
  }

  return JSON.parse(
    new TextDecoder().decode(output.stdout).trim(),
  ) as ValidationResult;
}

async function validatePptx(
  data: Uint8Array,
  expectedSlides: number,
): Promise<ValidationResult> {
  const path = await Deno.makeTempFile({ suffix: ".pptx" });
  await Deno.writeFile(path, data);
  try {
    return await validate(path, expectedSlides);
  } finally {
    await Deno.remove(path);
  }
}

function createTestPng(): Uint8Array {
  const bytes = [
    0x89,
    0x50,
    0x4E,
    0x47,
    0x0D,
    0x0A,
    0x1A,
    0x0A,
    0x00,
    0x00,
    0x00,
    0x0D,
    0x49,
    0x48,
    0x44,
    0x52,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01,
    0x08,
    0x02,
    0x00,
    0x00,
    0x00,
    0x90,
    0x77,
    0x53,
    0xDE,
    0x00,
    0x00,
    0x00,
    0x0C,
    0x49,
    0x44,
    0x41,
    0x54,
    0x08,
    0xD7,
    0x63,
    0xF8,
    0xCF,
    0xC0,
    0x00,
    0x00,
    0x01,
    0x01,
    0x01,
    0x00,
    0x18,
    0xDD,
    0x8D,
    0xB4,
    0x00,
    0x00,
    0x00,
    0x00,
    0x49,
    0x45,
    0x4E,
    0x44,
    0xAE,
    0x42,
    0x60,
    0x82,
  ];
  return new Uint8Array(bytes);
}

/**
 * Verify inches() converts to EMUs.
 * Spec: ECMA-376 §20.1.10.16.
 */
Deno.test("inches() converts to EMUs", () => {
  assertEquals(inches(1) as number, 914400);
  assertEquals(inches(0.5) as number, 457200);
});

/**
 * Verify cm(), pt(), emu(), and percentage() helpers.
 * Spec: ECMA-376 §20.1.10.16 and §20.1.10.40.
 */
Deno.test("unit helpers convert correctly", () => {
  assertEquals(cm(2.54) as number, 914400);
  assertEquals(pt(72) as number, 914400);
  assertEquals(emu(1234) as number, 1234);
  assertEquals(percentage(50) as number, 50000);
});

/**
 * Verify fontSize() and hexColor().
 * Spec: ECMA-376 §21.1.2.3.10 and §20.1.2.3.19.
 */
Deno.test("font and color helpers validate", () => {
  assertEquals(fontSize(12) as number, 1200);
  assertEquals(hexColor("ff0000") as string, "FF0000");
  assertThrows(() => hexColor("#FF0000"), Error);
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
 * Verify composable style fragments merge last-wins.
 * Spec: implementation-specific.
 */
Deno.test("style fragments merge deterministically", () => {
  const box = mergeBoxStyles(
    boxStyle({ fill: solidFill(hexColor("FF0000")) }),
    boxStyle({ line: lineStyle({ width: emu(12700) }) }),
    boxStyle({ fill: noFill() }),
  );
  assertEquals(box.fill?.kind, "none");
  assertEquals(box.line?.width, emu(12700));

  const paragraph = mergeParagraphStyles(
    paragraphStyle({ align: "center" }),
    paragraphStyle({ bullet: bulletChar("•") }),
  );
  assertEquals(paragraph.align, "center");
  assertEquals(paragraph.bullet?.kind, "char");

  const textRun = mergeTextStyles(
    textStyle({ fontFamily: "Aptos", fontColor: hexColor("112233") }),
    textStyle({ bold: true }),
  );
  assertEquals(textRun.fontFamily, "Aptos");
  assertEquals(textRun.bold, true);

  const cell = mergeCellStyles(
    cellStyle({ fill: solidFill(hexColor("CCCCCC")) }),
    cellStyle({ fill: solidFill(hexColor("000000")) }),
  );
  assertEquals(cell.fill?.kind, "solid");
  if (cell.fill?.kind === "solid") {
    assertEquals(cell.fill.color, hexColor("000000"));
  }
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
 * Verify positionless content leaves preserve semantic content.
 * Spec: implementation-specific.
 */
Deno.test("leaf builders are positionless", () => {
  const box = textbox(
    mergeBoxStyles(boxStyle({ fill: solidFill(hexColor("FFEECC")) })),
    p("Hello"),
  );
  assertEquals(box.kind, "textbox");
  assertEquals("x" in box, false);
  assertEquals(box.paragraphs[0]?.runs[0]?.text, "Hello");

  const preset = shape("rect", p("Rect"));
  assertEquals(preset.preset, "rect");

  const img = image({
    data: createTestPng(),
    contentType: "image/png",
    description: "pixel",
  });
  assertEquals(img.kind, "image");
  assertEquals("w" in img, false);

  const grid = table(
    { cols: [inches(2), inches(2)] },
    tr(inches(0.5), td("A"), td("B")),
  );
  assertEquals(grid.rows.length, 1);
});

/**
 * Verify scene builders create positioned nodes.
 * Spec: implementation-specific.
 */
Deno.test("scene builders create absolute nodes", () => {
  const box = scene.textbox(
    { x: inches(1), y: inches(2), w: inches(3), h: inches(1) },
    p("Hello"),
  );
  assertEquals(box.x, inches(1));
  assertEquals(box.w, inches(3));
  assertEquals(box.paragraphs[0]?.runs[0]?.text, "Hello");
});

/**
 * Resolve a row with implicit equal-width items.
 * Spec: implementation-specific.
 */
Deno.test("row() resolves equal-width default items", () => {
  const nodes = resolveSlideChildren(
    [
      row(
        textbox(p("A")),
        textbox(p("B")),
      ),
    ],
    { x: emu(0), y: emu(0), w: inches(10), h: inches(2) },
  );

  assertEquals(nodes.length, 2);
  assertEquals(nodes[0]?.x, emu(0));
  assertEquals(nodes[0]?.w, inches(5));
  assertEquals(nodes[1]?.x, inches(5));
  assertEquals(nodes[1]?.w, inches(5));
});

/**
 * Resolve a row with fixed basis, grow, and gap.
 * Spec: implementation-specific.
 */
Deno.test("row() resolves basis, grow, and gap", () => {
  const nodes = resolveSlideChildren(
    [
      row(
        { gap: inches(0.5) },
        item({ basis: inches(2) }, textbox("Fixed")),
        item({ grow: 1 }, textbox("Grow")),
      ),
    ],
    { x: emu(0), y: emu(0), w: inches(10), h: inches(2) },
  );

  assertEquals(nodes.length, 2);
  assertEquals(nodes[0]?.w, inches(2));
  assertEquals(nodes[1]?.x, inches(2.5));
  assertEquals(nodes[1]?.w, inches(7.5));
});

/**
 * Resolve a column with padding and gap.
 * Spec: implementation-specific.
 */
Deno.test("col() resolves padding and gap", () => {
  const nodes = resolveSlideChildren(
    [
      col(
        { padding: inches(1), gap: inches(0.25) },
        textbox("Top"),
        textbox("Bottom"),
      ),
    ],
    { x: emu(0), y: emu(0), w: inches(6), h: inches(6) },
  );

  assertEquals(nodes.length, 2);
  assertEquals(nodes[0]?.x, inches(1));
  assertEquals(nodes[0]?.w, inches(4));
  assertEquals(nodes[0]?.y, inches(1));
  assertEquals(nodes[1]?.y, inches(3.125));
});

/**
 * Resolve cross-axis alignment and explicit item height.
 * Spec: implementation-specific.
 */
Deno.test("row() respects cross-axis alignment", () => {
  const nodes = resolveSlideChildren(
    [
      row(
        { align: "center" },
        item({ basis: inches(3), h: inches(1) }, textbox("Centered")),
      ),
    ],
    { x: emu(0), y: emu(0), w: inches(6), h: inches(4) },
  );

  assertEquals(nodes.length, 1);
  assertEquals(nodes[0]?.y, inches(1.5));
  assertEquals(nodes[0]?.h, inches(1));
});

/**
 * Resolve an aspect-ratio item in a row.
 * Spec: implementation-specific.
 */
Deno.test("row() derives cross size from aspect ratio", () => {
  const nodes = resolveSlideChildren(
    [
      row(
        item(
          { basis: inches(4), aspectRatio: 2 },
          image({
            data: createTestPng(),
            contentType: "image/png",
          }),
        ),
      ),
    ],
    { x: emu(0), y: emu(0), w: inches(10), h: inches(4) },
  );

  assertEquals(nodes.length, 1);
  assertEquals(nodes[0]?.w, inches(4));
  assertEquals(nodes[0]?.h, inches(2));
});

/**
 * Scene nodes and layout roots can coexist on a slide.
 * Spec: implementation-specific.
 */
Deno.test("slide child resolution preserves scene overlays", () => {
  const nodes = resolveSlideChildren(
    [
      scene.shape("rect", {
        x: emu(0),
        y: emu(0),
        w: inches(10),
        h: inches(7.5),
        fill: solidFill(hexColor("F5F5F5")),
      }),
      row(
        { padding: inches(1) },
        textbox("Overlay text"),
      ),
    ],
    { x: emu(0), y: emu(0), w: inches(10), h: inches(7.5) },
  );

  assertEquals(nodes.length, 2);
  assertEquals(nodes[0]?.kind, "shape");
  assertEquals(nodes[1]?.kind, "textbox");
});

/**
 * Generate a minimal PPTX using the scene escape hatch.
 * Spec: ECMA-376 §13.3.8 and §21.1.2.
 */
Deno.test("e2e: minimal scene text box", async () => {
  const pptx = generate(presentation(
    { title: "Scene minimal" },
    slide(
      scene.textbox(
        { x: inches(1), y: inches(1), w: inches(8), h: inches(1) },
        p("Hello, World!"),
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slide_count, 1);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Hello, World!");
});

/**
 * Generate a PPTX using the new row layout DSL.
 * Spec: implementation-specific.
 */
Deno.test("e2e: row layout DSL", async () => {
  const pptx = generate(presentation(
    slide(
      row(
        { gap: inches(0.5), padding: inches(1) },
        item(
          { basis: inches(2.5) },
          shape(
            "rect",
            mergeBoxStyles(boxStyle({
              fill: solidFill(hexColor("D9EAF7")),
              line: lineStyle({ width: emu(12700) }),
            })),
            p(paragraphStyle({ align: "center" }), "Left"),
          ),
        ),
        item(
          { grow: 1 },
          textbox(
            mergeBoxStyles(boxStyle({ fill: solidFill(hexColor("FFF2CC")) })),
            p("Right panel"),
          ),
        ),
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slide_count, 1);
  assertEquals(result.slides[0]?.shape_count, 2);
  assert(result.slides[0]?.shapes.some((shape) => shape.text === "Left"));
  assert(
    result.slides[0]?.shapes.some((shape) => shape.text === "Right panel"),
  );
});

/**
 * Generate rich text with bullets and paragraph styling.
 * Spec: ECMA-376 §21.1.2.
 */
Deno.test("e2e: rich text and bullets", async () => {
  const pptx = generate(presentation(
    slide(
      scene.textbox(
        {
          x: inches(1),
          y: inches(1),
          w: inches(8),
          h: inches(3),
          ...mergeBoxStyles(boxStyle({ fill: noFill() })),
        },
        p(
          mergeParagraphStyles(
            paragraphStyle({ bullet: bulletChar("•") }),
            paragraphStyle({ spacing: { after: pt(6) } }),
          ),
          bold("Bold"),
          " and ",
          italic("italic"),
        ),
        p(
          paragraphStyle({ bullet: bulletAutoNum("arabicPeriod") }),
          underline("Underlined"),
        ),
        p(
          paragraphStyle({ bullet: bulletNone() }),
          text(
            "No bullet",
            mergeTextStyles(textStyle({
              fontFamily: "Aptos",
              fontColor: hexColor("FF0000"),
              fontSize: fontSize(18),
            })),
          ),
        ),
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const shapeText = result.slides[0]?.shapes[0]?.text;
  assert(shapeText?.includes("Bold"));
  assert(shapeText?.includes("Underlined"));
  assert(shapeText?.includes("No bullet"));
});

/**
 * Generate an embedded image.
 * Spec: ECMA-376 §19.3.1.37.
 */
Deno.test("e2e: image via scene node", async () => {
  const pptx = generate(presentation(
    slide(
      scene.image({
        x: inches(2),
        y: inches(1),
        w: inches(3),
        h: inches(3),
        data: createTestPng(),
        contentType: "image/png",
        description: "pixel",
      }),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 1);
  assertEquals(result.slides[0]?.shapes[0]?.is_picture, true);
  assertEquals(result.slides[0]?.shapes[0]?.image_content_type, "image/png");
});

/**
 * Generate a simple table.
 * Spec: ECMA-376 §19.3.1.22 and §21.1.3.
 */
Deno.test("e2e: table via scene node", async () => {
  const pptx = generate(presentation(
    slide(
      scene.table(
        {
          x: inches(1),
          y: inches(1),
          w: inches(6),
          h: inches(2),
          cols: [inches(3), inches(3)],
        },
        tr(
          inches(0.5),
          td(
            mergeCellStyles(cellStyle({ fill: solidFill(hexColor("4472C4")) })),
            p(bold("A")),
          ),
          td(
            mergeCellStyles(cellStyle({ fill: solidFill(hexColor("4472C4")) })),
            p(bold("B")),
          ),
        ),
        tr(inches(0.5), td("1"), td("2")),
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const shape = result.slides[0]?.shapes[0];
  assertEquals(shape?.is_table, true);
  assertEquals(shape?.table_rows, 2);
  assertEquals(shape?.table_cols, 2);
  assertEquals(shape?.table_data?.[1]?.[0], "1");
});

/**
 * Generate hyperlinks and mixed element types on one slide.
 * Spec: ECMA-376 §21.1.2.3.5.
 */
Deno.test("e2e: hyperlinks and mixed content", async () => {
  const pptx = generate(presentation(
    slide(
      scene.shape(
        "rect",
        {
          x: inches(0.75),
          y: inches(0.75),
          w: inches(8.5),
          h: inches(4.5),
          fill: solidFill(hexColor("F2F2F2")),
        },
      ),
      scene.textbox(
        { x: inches(1), y: inches(1), w: inches(8), h: inches(1) },
        p("Visit ", link("example.com", "https://example.com")),
      ),
      scene.textbox(
        {
          x: inches(1),
          y: inches(2),
          w: inches(8),
          h: inches(1),
          ...mergeBoxStyles(boxStyle({
            fill: solidFill(hexColor("FFFFFF")),
            line: lineStyle({
              width: emu(12700),
              fill: solidFill(hexColor("000000")),
            }),
            verticalAlign: "middle",
          })),
        },
        p("Bordered box"),
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 3);
  assert(
    result.slides[0]?.shapes.some((shape) =>
      shape.text?.includes("example.com")
    ),
  );
  assert(
    result.slides[0]?.shapes.some((shape) => shape.text === "Bordered box"),
  );
});

/**
 * Generate multiple slides using both scene nodes and layout nodes.
 * Spec: ECMA-376 §13.3.6.
 */
Deno.test("e2e: multiple slides with scene and layout", async () => {
  const pptx = generate(presentation(
    { title: "Deck", creator: "Codex" },
    slide(
      scene.textbox(
        { x: inches(1), y: inches(1), w: inches(8), h: inches(1.5) },
        p(paragraphStyle({ align: "center" }), bold("Title Slide")),
      ),
    ),
    slide(
      col(
        { padding: inches(1), gap: inches(0.25) },
        item({ basis: inches(1) }, textbox(p("Slide 2"))),
        item({ grow: 1 }, textbox(p("Body"))),
      ),
    ),
  ));

  const result = await validatePptx(pptx, 2);
  assertEquals(result.slide_count, 2);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Title Slide");
  assert(result.slides[1]?.shapes.some((shape) => shape.text === "Slide 2"));
  assert(result.slides[1]?.shapes.some((shape) => shape.text === "Body"));
});
