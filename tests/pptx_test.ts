/**
 * End-to-end tests for PPTX generation.
 *
 * Every test generates a PPTX, then validates it using:
 * 1. ZIP validity
 * 2. OPC structure ([Content_Types].xml, .rels)
 * 3. python-pptx round-trip
 * 4. LibreOffice headless PDF conversion
 */

import { assertEquals } from "@std/assert/equals";
import { assert } from "@std/assert/assert";
import { assertThrows } from "@std/assert/throws";
import {
  bold,
  boldItalic,
  bounds,
  bulletAutoNum,
  bulletChar,
  bulletNone,
  cell,
  cm,
  emu,
  fontSize,
  generate,
  hexColor,
  image,
  inches,
  italic,
  lineStyle,
  link,
  noFill,
  paragraph,
  percentage,
  presentation,
  pt,
  row,
  shape,
  slide,
  solidFill,
  table,
  text,
  textbox,
  underline,
} from "../mod.ts";

// ---------------------------------------------------------------------------
// Validation infrastructure
// ---------------------------------------------------------------------------

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

/**
 * Run the validation script against a PPTX file.
 * Checks ZIP, OPC structure, python-pptx round-trip, and LibreOffice.
 */
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

  const stdout = new TextDecoder().decode(output.stdout).trim();
  return JSON.parse(stdout) as ValidationResult;
}

/** Write bytes to a temp file, validate, and clean up. */
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

/** Create a minimal valid 1x1 red PNG for testing. */
function createTestPng(): Uint8Array {
  // Minimal 1x1 red PNG generated according to PNG spec (ISO/IEC 15948)
  const bytes = [
    // PNG signature
    0x89,
    0x50,
    0x4E,
    0x47,
    0x0D,
    0x0A,
    0x1A,
    0x0A,
    // IHDR chunk (13 bytes data)
    0x00,
    0x00,
    0x00,
    0x0D, // length
    0x49,
    0x48,
    0x44,
    0x52, // "IHDR"
    0x00,
    0x00,
    0x00,
    0x01, // width: 1
    0x00,
    0x00,
    0x00,
    0x01, // height: 1
    0x08,
    0x02, // 8-bit RGB
    0x00,
    0x00,
    0x00, // compression, filter, interlace
    0x90,
    0x77,
    0x53,
    0xDE, // CRC
    // IDAT chunk (zlib compressed single red pixel)
    0x00,
    0x00,
    0x00,
    0x0C, // length: 12
    0x49,
    0x44,
    0x41,
    0x54, // "IDAT"
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
    0xB4, // CRC
    // IEND chunk
    0x00,
    0x00,
    0x00,
    0x00, // length: 0
    0x49,
    0x45,
    0x4E,
    0x44, // "IEND"
    0xAE,
    0x42,
    0x60,
    0x82, // CRC
  ];
  return new Uint8Array(bytes);
}

// ---------------------------------------------------------------------------
// Unit conversion tests
// ---------------------------------------------------------------------------

/**
 * Verify inches() converts correctly: 1 inch = 914400 EMUs.
 * Spec: ECMA-376 §20.1.10.16 (ST_Coordinate).
 */
Deno.test("inches() converts to EMUs", () => {
  assertEquals(inches(1) as number, 914400);
  assertEquals(inches(0.5) as number, 457200);
  assertEquals(inches(10) as number, 9144000);
});

/**
 * Verify cm() converts correctly: 1 cm = 360000 EMUs.
 * Spec: ECMA-376 §20.1.10.16.
 */
Deno.test("cm() converts to EMUs", () => {
  assertEquals(cm(1) as number, 360000);
  assertEquals(cm(2.54) as number, 914400);
});

/**
 * Verify pt() converts correctly: 1 pt = 12700 EMUs.
 * Spec: ECMA-376 §20.1.10.16.
 */
Deno.test("pt() converts to EMUs", () => {
  assertEquals(pt(1) as number, 12700);
  assertEquals(pt(72) as number, 914400);
});

/**
 * Verify emu() passes through values unchanged.
 * Spec: ECMA-376 §20.1.10.16.
 */
Deno.test("emu() creates branded EMU value", () => {
  assertEquals(emu(914400) as number, 914400);
});

/**
 * Verify fontSize() converts points to hundredths of a point.
 * Spec: ECMA-376 §21.1.2.3.10 (a:rPr sz attribute).
 */
Deno.test("fontSize() converts points to hundredths", () => {
  assertEquals(fontSize(12) as number, 1200);
  assertEquals(fontSize(24) as number, 2400);
  assertEquals(fontSize(10.5) as number, 1050);
});

/**
 * Verify hexColor() validates and normalizes hex colors.
 * Spec: ECMA-376 §20.1.2.3.19 (ST_HexColorRGB).
 */
Deno.test("hexColor() validates and uppercases", () => {
  assertEquals(hexColor("ff0000") as string, "FF0000");
  assertEquals(hexColor("00ff00") as string, "00FF00");
  assertEquals(hexColor("AABBCC") as string, "AABBCC");
});

/**
 * Verify hexColor() rejects invalid input.
 * Spec: ECMA-376 §20.1.2.3.19.
 */
Deno.test("hexColor() rejects invalid colors", () => {
  assertThrows(() => hexColor("#FF0000"), Error);
  assertThrows(() => hexColor("red"), Error);
  assertThrows(() => hexColor("FFF"), Error);
  assertThrows(() => hexColor("GGGGGG"), Error);
});

/**
 * Verify percentage() converts to thousandths of a percent.
 * Spec: ECMA-376 §20.1.10.40 (ST_Percentage).
 */
Deno.test("percentage() converts to thousandths", () => {
  assertEquals(percentage(100) as number, 100000);
  assertEquals(percentage(50) as number, 50000);
});

// ---------------------------------------------------------------------------
// Text run builder tests
// ---------------------------------------------------------------------------

/**
 * Verify text() creates a plain run.
 * Spec: ECMA-376 §21.1.2.3.8 (a:r).
 */
Deno.test("text() creates a plain run", () => {
  const run = text("hello");
  assertEquals(run.text, "hello");
  assertEquals(run.bold, undefined);
  assertEquals(run.italic, undefined);
});

/**
 * Verify text() accepts style options.
 * Spec: ECMA-376 §21.1.2.3.10 (a:rPr).
 */
Deno.test("text() accepts style options", () => {
  const run = text("styled", {
    bold: true,
    fontSize: fontSize(18),
    fontColor: hexColor("0000FF"),
  });
  assertEquals(run.text, "styled");
  assertEquals(run.bold, true);
  assertEquals(run.fontSize, fontSize(18));
  assertEquals(run.fontColor, hexColor("0000FF"));
});

/**
 * Verify bold() creates a bold run.
 * Spec: ECMA-376 §21.1.2.3.10 (a:rPr b attribute).
 */
Deno.test("bold() creates a bold run", () => {
  const run = bold("strong");
  assertEquals(run.text, "strong");
  assertEquals(run.bold, true);
  assertEquals(run.italic, undefined);
});

/**
 * Verify bold() merges additional styles.
 * Spec: ECMA-376 §21.1.2.3.10.
 */
Deno.test("bold() merges additional styles", () => {
  const run = bold("big bold", { fontSize: fontSize(36) });
  assertEquals(run.bold, true);
  assertEquals(run.fontSize, fontSize(36));
});

/**
 * Verify italic() creates an italic run.
 * Spec: ECMA-376 §21.1.2.3.10 (a:rPr i attribute).
 */
Deno.test("italic() creates an italic run", () => {
  const run = italic("emphasis");
  assertEquals(run.text, "emphasis");
  assertEquals(run.italic, true);
  assertEquals(run.bold, undefined);
});

/**
 * Verify italic() merges additional styles.
 * Spec: ECMA-376 §21.1.2.3.10.
 */
Deno.test("italic() merges additional styles", () => {
  const run = italic("colored italic", { fontColor: hexColor("FF0000") });
  assertEquals(run.italic, true);
  assertEquals(run.fontColor, hexColor("FF0000"));
});

/**
 * Verify boldItalic() creates a bold+italic run.
 * Spec: ECMA-376 §21.1.2.3.10 (a:rPr b and i attributes).
 */
Deno.test("boldItalic() creates a bold+italic run", () => {
  const run = boldItalic("both");
  assertEquals(run.text, "both");
  assertEquals(run.bold, true);
  assertEquals(run.italic, true);
});

/**
 * Verify boldItalic() merges additional styles.
 * Spec: ECMA-376 §21.1.2.3.10.
 */
Deno.test("boldItalic() merges additional styles", () => {
  const run = boldItalic("big", { fontSize: fontSize(48) });
  assertEquals(run.bold, true);
  assertEquals(run.italic, true);
  assertEquals(run.fontSize, fontSize(48));
});

/**
 * Verify underline() creates an underlined run.
 * Spec: ECMA-376 §21.1.2.3.10 (a:rPr u attribute).
 */
Deno.test("underline() creates an underlined run", () => {
  const run = underline("underlined");
  assertEquals(run.text, "underlined");
  assertEquals(run.underline, true);
});

/**
 * Verify link() creates a hyperlinked text run.
 * Spec: ECMA-376 §21.1.2.3.5 (a:hlinkClick).
 */
Deno.test("link() creates a hyperlinked run", () => {
  const run = link("click me", "https://example.com");
  assertEquals(run.text, "click me");
  assertEquals(run.hyperlink, "https://example.com");
});

/**
 * Verify link() accepts additional styles.
 * Spec: ECMA-376 §21.1.2.3.5, §21.1.2.3.10.
 */
Deno.test("link() with styles", () => {
  const run = link("styled link", "https://example.com", {
    bold: true,
    fontColor: hexColor("0000FF"),
  });
  assertEquals(run.bold, true);
  assertEquals(run.hyperlink, "https://example.com");
  assertEquals(run.fontColor, hexColor("0000FF"));
});

// ---------------------------------------------------------------------------
// Paragraph builder tests
// ---------------------------------------------------------------------------

/**
 * Verify paragraph() from a string creates a single-run paragraph.
 * Spec: ECMA-376 §21.1.2.2.6 (a:p).
 */
Deno.test("paragraph() from string", () => {
  const p = paragraph("hello");
  assertEquals(p.runs.length, 1);
  assertEquals(p.runs[0]?.text, "hello");
  assertEquals(p.level, undefined);
  assertEquals(p.alignment, undefined);
});

/**
 * Verify paragraph() from a single TextRun.
 * Spec: ECMA-376 §21.1.2.2.6.
 */
Deno.test("paragraph() from single TextRun", () => {
  const p = paragraph(bold("title"));
  assertEquals(p.runs.length, 1);
  assertEquals(p.runs[0]?.text, "title");
  assertEquals(p.runs[0]?.bold, true);
});

/**
 * Verify paragraph() from an array of runs composes them.
 * Spec: ECMA-376 §21.1.2.2.6.
 */
Deno.test("paragraph() from array of runs", () => {
  const p = paragraph([bold("Hello"), text(", "), italic("world")]);
  assertEquals(p.runs.length, 3);
  assertEquals(p.runs[0]?.bold, true);
  assertEquals(p.runs[1]?.text, ", ");
  assertEquals(p.runs[2]?.italic, true);
});

/**
 * Verify paragraph() with alignment option.
 * Spec: ECMA-376 §21.1.2.2.7 (a:pPr algn attribute).
 */
Deno.test("paragraph() with alignment", () => {
  const p = paragraph("centered", { alignment: "center" });
  assertEquals(p.alignment, "center");
  assertEquals(p.runs[0]?.text, "centered");
});

/**
 * Verify paragraph() with level option for indentation.
 * Spec: ECMA-376 §21.1.2.2.7 (a:pPr lvl attribute).
 */
Deno.test("paragraph() with level", () => {
  const p = paragraph("indented", { level: 2 });
  assertEquals(p.level, 2);
});

/**
 * Verify paragraph() with all options.
 * Spec: ECMA-376 §21.1.2.2.7.
 */
Deno.test("paragraph() with all options", () => {
  const p = paragraph([bold("title")], { alignment: "right", level: 1 });
  assertEquals(p.alignment, "right");
  assertEquals(p.level, 1);
  assertEquals(p.runs.length, 1);
});

/**
 * Verify paragraph() with bullet character.
 * Spec: ECMA-376 §21.1.2.4.3 (a:buChar).
 */
Deno.test("paragraph() with bullet char", () => {
  const p = paragraph("Item", { bullet: bulletChar("\u2022") });
  assertEquals(p.bullet?.kind, "char");
});

/**
 * Verify paragraph() with auto-numbered bullet.
 * Spec: ECMA-376 §21.1.2.4.1 (a:buAutoNum).
 */
Deno.test("paragraph() with bullet autonum", () => {
  const p = paragraph("Step", { bullet: bulletAutoNum("arabicPeriod") });
  assertEquals(p.bullet?.kind, "autonum");
});

/**
 * Verify paragraph() with no bullet override.
 * Spec: ECMA-376 §21.1.2.4.4 (a:buNone).
 */
Deno.test("paragraph() with bullet none", () => {
  const p = paragraph("No bullet", { bullet: bulletNone() });
  assertEquals(p.bullet?.kind, "none");
});

/**
 * Verify paragraph() with spacing.
 * Spec: ECMA-376 §21.1.2.2.10 (a:spcBef/a:spcAft).
 */
Deno.test("paragraph() with spacing", () => {
  const p = paragraph("Spaced", {
    spacing: { before: pt(12), after: pt(6) },
  });
  assertEquals(p.spacing?.before, pt(12));
  assertEquals(p.spacing?.after, pt(6));
});

// ---------------------------------------------------------------------------
// Fill and line builder tests
// ---------------------------------------------------------------------------

/**
 * Verify solidFill() creates a solid fill.
 * Spec: ECMA-376 §20.1.8.54 (a:solidFill).
 */
Deno.test("solidFill() creates solid fill", () => {
  const f = solidFill(hexColor("FF0000"));
  assertEquals(f.kind, "solid");
  if (f.kind === "solid") {
    assertEquals(f.color as string, "FF0000");
    assertEquals(f.alpha, undefined);
  }
});

/**
 * Verify solidFill() with alpha transparency.
 * Spec: ECMA-376 §20.1.2.3.1 (a:alpha).
 */
Deno.test("solidFill() with alpha", () => {
  const f = solidFill(hexColor("00FF00"), 50000);
  if (f.kind === "solid") {
    assertEquals(f.alpha, 50000);
  }
});

/**
 * Verify noFill() creates a no-fill specification.
 * Spec: ECMA-376 §20.1.8.44 (a:noFill).
 */
Deno.test("noFill() creates no fill", () => {
  const f = noFill();
  assertEquals(f.kind, "none");
});

/**
 * Verify lineStyle() creates line properties.
 * Spec: ECMA-376 §20.1.2.2.24 (a:ln).
 */
Deno.test("lineStyle() creates line properties", () => {
  const ls = lineStyle({
    width: pt(2),
    fill: solidFill(hexColor("000000")),
  });
  assertEquals(ls.width, pt(2));
  assertEquals(ls.fill?.kind, "solid");
});

// ---------------------------------------------------------------------------
// Bounds builder test
// ---------------------------------------------------------------------------

/**
 * Verify bounds() creates a position+size record.
 * Spec: ECMA-376 §20.1.7.5 (a:xfrm).
 */
Deno.test("bounds() creates position and size", () => {
  const b = bounds(inches(1), inches(2), inches(8), inches(5));
  assertEquals(b.x, inches(1));
  assertEquals(b.y, inches(2));
  assertEquals(b.cx, inches(8));
  assertEquals(b.cy, inches(5));
});

// ---------------------------------------------------------------------------
// Shape builder tests
// ---------------------------------------------------------------------------

/**
 * Verify textbox() creates a text box element.
 * Spec: ECMA-376 §19.3.1.43 (sp with txBox).
 */
Deno.test("textbox() creates a text box", () => {
  const tb = textbox(
    bounds(inches(1), inches(1), inches(4), inches(1)),
    [paragraph("content")],
  );
  assertEquals(tb.kind, "textbox");
  assertEquals(tb.bounds.x, inches(1));
  assertEquals(tb.paragraphs.length, 1);
  assertEquals(tb.paragraphs[0]?.runs[0]?.text, "content");
});

/**
 * Verify textbox() with styling options.
 * Spec: ECMA-376 §20.1.8, §20.1.2.2.24.
 */
Deno.test("textbox() with styling", () => {
  const tb = textbox(
    bounds(inches(1), inches(1), inches(4), inches(1)),
    [paragraph("styled")],
    {
      fill: solidFill(hexColor("FFFF00")),
      line: lineStyle({ width: pt(1), fill: solidFill(hexColor("000000")) }),
      verticalAlignment: "middle",
    },
  );
  assertEquals(tb.fill?.kind, "solid");
  assertEquals(tb.line?.width, pt(1));
  assertEquals(tb.verticalAlignment, "middle");
});

/**
 * Verify shape() creates a preset shape without text.
 * Spec: ECMA-376 §20.1.9.18 (a:prstGeom).
 */
Deno.test("shape() without text", () => {
  const s = shape("rect", bounds(inches(0), inches(0), inches(3), inches(2)));
  assertEquals(s.kind, "shape");
  assertEquals(s.preset, "rect");
  assertEquals(s.paragraphs.length, 0);
});

/**
 * Verify shape() creates a preset shape with text.
 * Spec: ECMA-376 §20.1.9.18, §21.1.2 (txBody).
 */
Deno.test("shape() with text", () => {
  const s = shape(
    "ellipse",
    bounds(inches(1), inches(1), inches(3), inches(3)),
    [paragraph("circle", { alignment: "center" })],
  );
  assertEquals(s.preset, "ellipse");
  assertEquals(s.paragraphs.length, 1);
  assertEquals(s.paragraphs[0]?.alignment, "center");
});

/**
 * Verify shape() with fill and line styling.
 * Spec: ECMA-376 §20.1.8, §20.1.2.2.24.
 */
Deno.test("shape() with styling", () => {
  const s = shape(
    "rect",
    bounds(inches(1), inches(1), inches(3), inches(2)),
    [],
    {
      fill: solidFill(hexColor("FF0000")),
      line: lineStyle({ width: pt(2), fill: solidFill(hexColor("000000")) }),
    },
  );
  assertEquals(s.fill?.kind, "solid");
  assertEquals(s.line?.width, pt(2));
});

/**
 * Verify image() creates an image element.
 * Spec: ECMA-376 §19.3.1.37 (p:pic).
 */
Deno.test("image() creates an image element", () => {
  const png = createTestPng();
  const img = image(
    bounds(inches(1), inches(1), inches(4), inches(3)),
    png,
    "image/png",
    "Test image",
  );
  assertEquals(img.kind, "image");
  assertEquals(img.contentType, "image/png");
  assertEquals(img.description, "Test image");
});

/**
 * Verify table builder functions create correct structures.
 * Spec: ECMA-376 §21.1.3 (a:tbl).
 */
Deno.test("table() creates a table element", () => {
  const t = table(
    bounds(inches(1), inches(1), inches(6), inches(3)),
    [inches(3), inches(3)],
    [
      row(inches(0.5), [
        cell([paragraph("A")]),
        cell([paragraph("B")]),
      ]),
    ],
  );
  assertEquals(t.kind, "table");
  assertEquals(t.columns.length, 2);
  assertEquals(t.rows.length, 1);
  assertEquals(t.rows[0]?.cells.length, 2);
});

/**
 * Verify cell() with fill option.
 * Spec: ECMA-376 §21.1.3.15 (a:tc).
 */
Deno.test("cell() with fill", () => {
  const c = cell([paragraph("colored")], {
    fill: solidFill(hexColor("4472C4")),
  });
  assertEquals(c.fill?.kind, "solid");
});

// ---------------------------------------------------------------------------
// Slide builder tests
// ---------------------------------------------------------------------------

/**
 * Verify slide() collects elements as rest parameters.
 * Spec: ECMA-376 §13.3.8 (p:sld).
 */
Deno.test("slide() collects elements", () => {
  const s = slide(
    textbox(bounds(inches(1), inches(1), inches(4), inches(1)), [
      paragraph("a"),
    ]),
    shape("rect", bounds(inches(1), inches(3), inches(4), inches(2))),
  );
  assertEquals(s.elements.length, 2);
  assertEquals(s.elements[0]?.kind, "textbox");
  assertEquals(s.elements[1]?.kind, "shape");
});

/**
 * Verify slide() with no elements creates an empty slide.
 * Spec: ECMA-376 §13.3.8.
 */
Deno.test("slide() with no elements", () => {
  const s = slide();
  assertEquals(s.elements.length, 0);
});

// ---------------------------------------------------------------------------
// Presentation builder tests
// ---------------------------------------------------------------------------

/**
 * Verify presentation() with slides only (no options).
 * Spec: ECMA-376 §13.3.6 (p:presentation).
 */
Deno.test("presentation() slides only", () => {
  const s = slide();
  const pres = presentation(s);
  assertEquals(pres.slides.length, 1);
  assertEquals(pres.options.title, undefined);
});

/**
 * Verify presentation() with options first argument.
 * Spec: ECMA-376 §13.3.6.
 */
Deno.test("presentation() with options", () => {
  const pres = presentation(
    { title: "Test", creator: "Author", slideWidth: inches(13.333) },
    slide(),
  );
  assertEquals(pres.options.title, "Test");
  assertEquals(pres.options.creator, "Author");
  assertEquals(pres.options.slideWidth, inches(13.333));
  assertEquals(pres.slides.length, 1);
});

/**
 * Verify presentation() with multiple slides.
 * Spec: ECMA-376 §13.3.6.
 */
Deno.test("presentation() with multiple slides", () => {
  const pres = presentation(slide(), slide(), slide());
  assertEquals(pres.slides.length, 3);
});

// ---------------------------------------------------------------------------
// End-to-end generation tests — existing features
// ---------------------------------------------------------------------------

/**
 * Generate a minimal single-slide presentation with one text box.
 * Spec: ECMA-376 §13.3.8, §19.3.1.43, §21.1.2.
 */
Deno.test("e2e: minimal text box presentation", async () => {
  const pptx = generate(presentation(
    { title: "Test Presentation" },
    slide(
      textbox(bounds(inches(1), inches(1), inches(8), inches(1)), [
        paragraph("Hello, World!"),
      ]),
    ),
  ));

  assert(pptx.length > 0, "PPTX should not be empty");

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slide_count, 1);
  assertEquals(result.slides[0]?.shape_count, 1);
  assertEquals(result.slides[0]?.shapes[0]?.has_text_frame, true);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Hello, World!");
});

/**
 * Generate a multi-slide presentation.
 * Spec: ECMA-376 §13.3.6 (sldIdLst).
 */
Deno.test("e2e: multi-slide presentation", async () => {
  const makeSlide = (label: string) =>
    slide(
      textbox(bounds(inches(1), inches(1), inches(6), inches(1)), [
        paragraph(label),
      ]),
    );

  const pptx = generate(presentation(
    { title: "Multi Slide" },
    makeSlide("Slide 1"),
    makeSlide("Slide 2"),
    makeSlide("Slide 3"),
  ));

  const result = await validatePptx(pptx, 3);
  assertEquals(result.slide_count, 3);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Slide 1");
  assertEquals(result.slides[1]?.shapes[0]?.text, "Slide 2");
  assertEquals(result.slides[2]?.shapes[0]?.text, "Slide 3");
});

/**
 * Generate a presentation with a preset geometry shape (rectangle).
 * Spec: ECMA-376 §20.1.9.18 (a:prstGeom).
 */
Deno.test("e2e: preset shape (rectangle)", async () => {
  const pptx = generate(presentation(
    slide(
      shape("rect", bounds(inches(1), inches(1), inches(4), inches(2)), [
        paragraph("Rectangle text"),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 1);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Rectangle text");
});

/**
 * Generate a presentation with an ellipse shape.
 * Spec: ECMA-376 §20.1.10.56 (ST_ShapeType).
 */
Deno.test("e2e: preset shape (ellipse)", async () => {
  const pptx = generate(presentation(
    slide(
      shape("ellipse", bounds(inches(1), inches(1), inches(3), inches(3)), [
        paragraph("Circle", { alignment: "center" }),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Circle");
});

/**
 * Generate a presentation with a shape without text.
 * Spec: ECMA-376 §20.1.9.18.
 */
Deno.test("e2e: shape without text", async () => {
  const pptx = generate(presentation(
    slide(
      shape("roundRect", bounds(inches(2), inches(2), inches(4), inches(3))),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 1);
});

/**
 * Generate a presentation with bold, italic, and boldItalic text.
 * Spec: ECMA-376 §21.1.2.3.10 (a:rPr b and i attributes).
 */
Deno.test("e2e: bold, italic, and boldItalic text", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(1), inches(8), inches(2)), [
        paragraph([
          bold("Bold"),
          text(" "),
          italic("Italic"),
          text(" "),
          boldItalic("Both"),
        ]),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const shapeText = result.slides[0]?.shapes[0]?.text;
  assert(shapeText?.includes("Bold"), "Should contain bold text");
  assert(shapeText?.includes("Italic"), "Should contain italic text");
  assert(shapeText?.includes("Both"), "Should contain bold-italic text");
});

/**
 * Generate a presentation with font size and color styling.
 * Spec: ECMA-376 §21.1.2.3.10, §20.1.2.3.19.
 */
Deno.test("e2e: font size and color", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(1), inches(8), inches(2)), [
        paragraph([
          text("Large red text", {
            fontSize: fontSize(36),
            fontColor: hexColor("FF0000"),
          }),
        ]),
        paragraph([
          text("Small blue text", {
            fontSize: fontSize(10),
            fontColor: hexColor("0000FF"),
          }),
        ]),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const shapeText = result.slides[0]?.shapes[0]?.text;
  assert(shapeText?.includes("Large red text"));
  assert(shapeText?.includes("Small blue text"));
});

/**
 * Generate a presentation with paragraph alignment (all four values).
 * Spec: ECMA-376 §21.1.2.2.7 (a:pPr algn attribute).
 */
Deno.test("e2e: paragraph alignment", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(1), inches(8), inches(3)), [
        paragraph("Left aligned", { alignment: "left" }),
        paragraph("Center aligned", { alignment: "center" }),
        paragraph("Right aligned", { alignment: "right" }),
        paragraph("Justified text", { alignment: "justify" }),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const shapeText = result.slides[0]?.shapes[0]?.text;
  assert(shapeText?.includes("Left aligned"));
  assert(shapeText?.includes("Center aligned"));
  assert(shapeText?.includes("Right aligned"));
  assert(shapeText?.includes("Justified text"));
});

/**
 * Generate a presentation with indented (leveled) paragraphs.
 * Spec: ECMA-376 §21.1.2.2.7 (a:pPr lvl attribute).
 */
Deno.test("e2e: paragraph levels", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(1), inches(8), inches(3)), [
        paragraph("Level 0", { level: 0 }),
        paragraph("Level 1", { level: 1 }),
        paragraph("Level 2", { level: 2 }),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const shapeText = result.slides[0]?.shapes[0]?.text;
  assert(shapeText?.includes("Level 0"));
  assert(shapeText?.includes("Level 1"));
  assert(shapeText?.includes("Level 2"));
});

/**
 * Generate a presentation with multiple shapes on one slide.
 * Spec: ECMA-376 §19.3.1.43.
 */
Deno.test("e2e: multiple shapes on one slide", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(1), inches(4), inches(1)), [
        paragraph("Text box"),
      ]),
      shape("ellipse", bounds(inches(1), inches(3), inches(3), inches(2)), [
        paragraph("Ellipse"),
      ]),
      shape("roundRect", bounds(inches(5), inches(3), inches(3), inches(2))),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 3);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Text box");
  assertEquals(result.slides[0]?.shapes[1]?.text, "Ellipse");
});

/**
 * Generate an empty slide (no shapes).
 * Spec: ECMA-376 §13.3.8.
 */
Deno.test("e2e: empty slide", async () => {
  const pptx = generate(presentation(slide()));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 0);
});

/**
 * Generate a presentation with custom slide dimensions (16:9 widescreen).
 * Spec: ECMA-376 §13.3.6 (p:sldSz cx/cy attributes).
 */
Deno.test("e2e: custom slide dimensions", async () => {
  const pptx = generate(presentation(
    { slideWidth: inches(13.333), slideHeight: inches(7.5) },
    slide(
      textbox(bounds(inches(1), inches(1), inches(11), inches(1)), [
        paragraph("Wide slide"),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Wide slide");
});

/**
 * Generate a presentation with cm units.
 * Spec: ECMA-376 §20.1.10.16.
 */
Deno.test("e2e: cm unit conversions", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(cm(2), cm(2), cm(20), cm(3)), [
        paragraph("Centimeter-positioned text"),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(
    result.slides[0]?.shapes[0]?.text,
    "Centimeter-positioned text",
  );
});

/**
 * Generate a presentation with pt units.
 * Spec: ECMA-376 §20.1.10.16.
 */
Deno.test("e2e: pt unit conversions", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(pt(72), pt(72), pt(500), pt(72)), [
        paragraph("Point-positioned text"),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Point-positioned text");
});

/**
 * Demonstrate composability: reusable slide-building functions.
 * Spec: ECMA-376 §13.3.6, §13.3.8.
 */
Deno.test("e2e: composable reusable functions", async () => {
  const titleSlide = (title: string) =>
    slide(
      textbox(bounds(inches(1), inches(2), inches(8), inches(2)), [
        paragraph(bold(title), { alignment: "center" }),
      ]),
    );

  const bulletSlide = (title: string, bullets: ReadonlyArray<string>) =>
    slide(
      textbox(bounds(inches(1), inches(0.5), inches(8), inches(1)), [
        paragraph(bold(title)),
      ]),
      textbox(
        bounds(inches(1), inches(2), inches(8), inches(4)),
        bullets.map((b, i) => paragraph(b, { level: i > 0 ? 1 : 0 })),
      ),
    );

  const pptx = generate(presentation(
    { title: "Composable API Demo" },
    titleSlide("Welcome"),
    bulletSlide("Key Points", ["First point", "Sub-point", "Second point"]),
    titleSlide("Thank You"),
  ));

  const result = await validatePptx(pptx, 3);
  assertEquals(result.slide_count, 3);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Welcome");
  assert(result.slides[1]?.shapes[1]?.text?.includes("First point"));
  assertEquals(result.slides[2]?.shapes[0]?.text, "Thank You");
});

/**
 * Generate a presentation with mixed text runs in one paragraph.
 * Spec: ECMA-376 §21.1.2.3.8.
 */
Deno.test("e2e: mixed text runs in one paragraph", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(1), inches(8), inches(1)), [
        paragraph([
          text("Normal "),
          bold("bold "),
          italic("italic "),
          boldItalic("both "),
          text("sized", { fontSize: fontSize(24) }),
          text(" colored", { fontColor: hexColor("00FF00") }),
        ]),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const shapeText = result.slides[0]?.shapes[0]?.text;
  assert(shapeText?.includes("Normal"));
  assert(shapeText?.includes("bold"));
  assert(shapeText?.includes("italic"));
  assert(shapeText?.includes("both"));
  assert(shapeText?.includes("sized"));
  assert(shapeText?.includes("colored"));
});

/**
 * Generate a presentation with presentation options (title, creator).
 * Spec: ECMA-376 Part 2 §11.2 (core properties).
 */
Deno.test("e2e: presentation with title and creator", async () => {
  const pptx = generate(presentation(
    { title: "Titled Presentation", creator: "Test Author" },
    slide(
      textbox(bounds(inches(1), inches(1), inches(6), inches(1)), [
        paragraph("Has metadata"),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Has metadata");
});

// ---------------------------------------------------------------------------
// End-to-end: Feature 1 — Images
// ---------------------------------------------------------------------------

/**
 * Generate a presentation with an embedded PNG image.
 * Spec: ECMA-376 §19.3.1.37 (p:pic), §20.1.8.15 (a:blip).
 */
Deno.test("e2e: embedded PNG image", async () => {
  const png = createTestPng();
  const pptx = generate(presentation(
    slide(
      image(
        bounds(inches(1), inches(1), inches(4), inches(3)),
        png,
        "image/png",
        "Test image",
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 1);
  const pic = result.slides[0]?.shapes[0];
  assert(pic?.is_picture, "Shape should be a picture");
  assertEquals(pic?.image_content_type, "image/png");
});

/**
 * Generate a slide with both an image and a text box.
 * Spec: ECMA-376 §19.3.1.43 (spTree with mixed shape types).
 */
Deno.test("e2e: image with text box on same slide", async () => {
  const png = createTestPng();
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(0.5), inches(8), inches(1)), [
        paragraph("Slide with image"),
      ]),
      image(
        bounds(inches(2), inches(2), inches(4), inches(3)),
        png,
        "image/png",
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 2);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Slide with image");
  assert(result.slides[0]?.shapes[1]?.is_picture);
});

/**
 * Generate slides with images on different slides (multiple media parts).
 * Spec: ECMA-376 Part 2 §9 (OPC relationships per-part).
 */
Deno.test("e2e: images on multiple slides", async () => {
  const png = createTestPng();
  const pptx = generate(presentation(
    slide(
      image(
        bounds(inches(1), inches(1), inches(3), inches(2)),
        png,
        "image/png",
      ),
    ),
    slide(
      image(
        bounds(inches(2), inches(2), inches(4), inches(3)),
        png,
        "image/png",
      ),
    ),
  ));

  const result = await validatePptx(pptx, 2);
  assert(result.slides[0]?.shapes[0]?.is_picture);
  assert(result.slides[1]?.shapes[0]?.is_picture);
});

// ---------------------------------------------------------------------------
// End-to-end: Feature 2 — Richer text and paragraph formatting
// ---------------------------------------------------------------------------

/**
 * Generate a presentation with underlined text.
 * Spec: ECMA-376 §21.1.2.3.10 (a:rPr u attribute).
 */
Deno.test("e2e: underlined text", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(1), inches(8), inches(1)), [
        paragraph([
          underline("This is underlined"),
          text(" and this is not"),
        ]),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const shapeText = result.slides[0]?.shapes[0]?.text;
  assert(shapeText?.includes("This is underlined"));
  assert(shapeText?.includes("and this is not"));
});

/**
 * Generate a presentation with custom font family.
 * Spec: ECMA-376 §21.1.2.3.7 (a:latin typeface).
 */
Deno.test("e2e: custom font family", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(1), inches(8), inches(1)), [
        paragraph([
          text("Courier text", { fontFamily: "Courier New" }),
        ]),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Courier text");
});

/**
 * Generate a presentation with bullet characters.
 * Spec: ECMA-376 §21.1.2.4.3 (a:buChar).
 */
Deno.test("e2e: bullet characters", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(1), inches(8), inches(3)), [
        paragraph("First bullet", { bullet: bulletChar("\u2022") }),
        paragraph("Second bullet", { bullet: bulletChar("\u2022") }),
        paragraph("Third bullet", { bullet: bulletChar("\u2022") }),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const shapeText = result.slides[0]?.shapes[0]?.text;
  assert(shapeText?.includes("First bullet"));
  assert(shapeText?.includes("Second bullet"));
  assert(shapeText?.includes("Third bullet"));
});

/**
 * Generate a presentation with auto-numbered bullets.
 * Spec: ECMA-376 §21.1.2.4.1 (a:buAutoNum).
 */
Deno.test("e2e: auto-numbered bullets", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(1), inches(8), inches(3)), [
        paragraph("Step one", { bullet: bulletAutoNum("arabicPeriod") }),
        paragraph("Step two", { bullet: bulletAutoNum("arabicPeriod") }),
        paragraph("Step three", { bullet: bulletAutoNum("arabicPeriod") }),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const shapeText = result.slides[0]?.shapes[0]?.text;
  assert(shapeText?.includes("Step one"));
  assert(shapeText?.includes("Step two"));
});

/**
 * Generate a presentation with paragraph spacing.
 * Spec: ECMA-376 §21.1.2.2.10 (a:spcBef, a:spcAft).
 */
Deno.test("e2e: paragraph spacing", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(1), inches(8), inches(4)), [
        paragraph("Before space", {
          spacing: { before: pt(12), after: pt(6) },
        }),
        paragraph("After space", {
          spacing: { before: pt(6), after: pt(12) },
        }),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const shapeText = result.slides[0]?.shapes[0]?.text;
  assert(shapeText?.includes("Before space"));
  assert(shapeText?.includes("After space"));
});

// ---------------------------------------------------------------------------
// End-to-end: Feature 3 — Shape and textbox styling
// ---------------------------------------------------------------------------

/**
 * Generate a presentation with a filled text box.
 * Spec: ECMA-376 §20.1.8.54 (a:solidFill).
 */
Deno.test("e2e: textbox with solid fill", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(
        bounds(inches(1), inches(1), inches(6), inches(2)),
        [paragraph("Yellow background")],
        { fill: solidFill(hexColor("FFFF00")) },
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Yellow background");
});

/**
 * Generate a presentation with a textbox with line border.
 * Spec: ECMA-376 §20.1.2.2.24 (a:ln).
 */
Deno.test("e2e: textbox with line border", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(
        bounds(inches(1), inches(1), inches(6), inches(2)),
        [paragraph("Bordered text")],
        {
          fill: noFill(),
          line: lineStyle({
            width: pt(2),
            fill: solidFill(hexColor("000000")),
          }),
        },
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Bordered text");
});

/**
 * Generate a presentation with a filled shape with custom styling.
 * Spec: ECMA-376 §20.1.8, §20.1.2.2.24.
 */
Deno.test("e2e: shape with custom fill and line", async () => {
  const pptx = generate(presentation(
    slide(
      shape(
        "rect",
        bounds(inches(1), inches(1), inches(4), inches(2)),
        [paragraph("Red box", { alignment: "center" })],
        {
          fill: solidFill(hexColor("FF0000")),
          line: lineStyle({
            width: pt(3),
            fill: solidFill(hexColor("000000")),
          }),
        },
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Red box");
});

/**
 * Generate a presentation with a shape with noFill.
 * Spec: ECMA-376 §20.1.8.44 (a:noFill).
 */
Deno.test("e2e: shape with noFill", async () => {
  const pptx = generate(presentation(
    slide(
      shape(
        "ellipse",
        bounds(inches(1), inches(1), inches(3), inches(3)),
        [paragraph("Transparent", { alignment: "center" })],
        {
          fill: noFill(),
          line: lineStyle({ fill: noFill() }),
        },
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Transparent");
});

/**
 * Generate a presentation with semi-transparent fill.
 * Spec: ECMA-376 §20.1.2.3.1 (a:alpha).
 */
Deno.test("e2e: shape with semi-transparent fill", async () => {
  const pptx = generate(presentation(
    slide(
      shape(
        "rect",
        bounds(inches(1), inches(1), inches(4), inches(2)),
        [paragraph("50% transparent")],
        { fill: solidFill(hexColor("0000FF"), 50000) },
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes[0]?.text, "50% transparent");
});

/**
 * Generate a presentation with vertical text alignment in textbox.
 * Spec: ECMA-376 §21.1.2.1.1 (a:bodyPr anchor attribute).
 */
Deno.test("e2e: textbox vertical alignment", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(
        bounds(inches(1), inches(1), inches(4), inches(3)),
        [paragraph("Top")],
        { verticalAlignment: "top" },
      ),
      textbox(
        bounds(inches(5), inches(1), inches(4), inches(3)),
        [paragraph("Middle")],
        { verticalAlignment: "middle" },
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 2);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Top");
  assertEquals(result.slides[0]?.shapes[1]?.text, "Middle");
});

// ---------------------------------------------------------------------------
// End-to-end: Feature 4 — Tables
// ---------------------------------------------------------------------------

/**
 * Generate a presentation with a simple 2x2 table.
 * Spec: ECMA-376 §21.1.3, §19.3.1.22.
 */
Deno.test("e2e: simple 2x2 table", async () => {
  const pptx = generate(presentation(
    slide(
      table(
        bounds(inches(1), inches(1), inches(6), inches(2)),
        [inches(3), inches(3)],
        [
          row(inches(0.5), [
            cell([paragraph("A1")]),
            cell([paragraph("B1")]),
          ]),
          row(inches(0.5), [
            cell([paragraph("A2")]),
            cell([paragraph("B2")]),
          ]),
        ],
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 1);
  const tbl = result.slides[0]?.shapes[0];
  assert(tbl?.is_table, "Shape should be a table");
  assertEquals(tbl?.table_rows, 2);
  assertEquals(tbl?.table_cols, 2);
  assertEquals(tbl?.table_data?.[0]?.[0], "A1");
  assertEquals(tbl?.table_data?.[0]?.[1], "B1");
  assertEquals(tbl?.table_data?.[1]?.[0], "A2");
  assertEquals(tbl?.table_data?.[1]?.[1], "B2");
});

/**
 * Generate a presentation with a table with colored header row.
 * Spec: ECMA-376 §21.1.3.15, §20.1.8.54.
 */
Deno.test("e2e: table with styled header", async () => {
  const headerFill = solidFill(hexColor("4472C4"));
  const pptx = generate(presentation(
    slide(
      table(
        bounds(inches(1), inches(1), inches(6), inches(2)),
        [inches(2), inches(2), inches(2)],
        [
          row(inches(0.5), [
            cell([paragraph(bold("Name"))], { fill: headerFill }),
            cell([paragraph(bold("Age"))], { fill: headerFill }),
            cell([paragraph(bold("City"))], { fill: headerFill }),
          ]),
          row(inches(0.5), [
            cell([paragraph("Alice")]),
            cell([paragraph("30")]),
            cell([paragraph("NYC")]),
          ]),
          row(inches(0.5), [
            cell([paragraph("Bob")]),
            cell([paragraph("25")]),
            cell([paragraph("LA")]),
          ]),
        ],
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const tbl = result.slides[0]?.shapes[0];
  assert(tbl?.is_table);
  assertEquals(tbl?.table_rows, 3);
  assertEquals(tbl?.table_cols, 3);
  assertEquals(tbl?.table_data?.[0]?.[0], "Name");
  assertEquals(tbl?.table_data?.[1]?.[0], "Alice");
  assertEquals(tbl?.table_data?.[2]?.[1], "25");
});

/**
 * Generate a table with text box on same slide.
 * Spec: ECMA-376 §19.3.1.43.
 */
Deno.test("e2e: table with text box on same slide", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(0.5), inches(8), inches(1)), [
        paragraph(bold("Data Report")),
      ]),
      table(
        bounds(inches(1), inches(2), inches(6), inches(2)),
        [inches(3), inches(3)],
        [
          row(inches(0.5), [
            cell([paragraph("X")]),
            cell([paragraph("Y")]),
          ]),
        ],
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 2);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Data Report");
  assert(result.slides[0]?.shapes[1]?.is_table);
});

// ---------------------------------------------------------------------------
// End-to-end: Feature 5 — Hyperlinks
// ---------------------------------------------------------------------------

/**
 * Generate a presentation with a hyperlinked text run.
 * Spec: ECMA-376 §21.1.2.3.5, Part 2 §9.3.
 */
Deno.test("e2e: text with hyperlink", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(1), inches(8), inches(1)), [
        paragraph([
          text("Visit "),
          link("our website", "https://example.com"),
          text(" for more info"),
        ]),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const shapeText = result.slides[0]?.shapes[0]?.text;
  assert(shapeText?.includes("Visit"));
  assert(shapeText?.includes("our website"));
  assert(shapeText?.includes("for more info"));
});

/**
 * Generate a presentation with multiple hyperlinks on one slide.
 * Spec: ECMA-376 §21.1.2.3.5.
 */
Deno.test("e2e: multiple hyperlinks", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(1), inches(8), inches(2)), [
        paragraph([
          link("Link 1", "https://example.com/1"),
          text(" | "),
          link("Link 2", "https://example.com/2"),
        ]),
        paragraph([
          link("Link 3", "https://example.com/3", { bold: true }),
        ]),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  const shapeText = result.slides[0]?.shapes[0]?.text;
  assert(shapeText?.includes("Link 1"));
  assert(shapeText?.includes("Link 2"));
  assert(shapeText?.includes("Link 3"));
});

/**
 * Generate a presentation with hyperlinks on different slides.
 * Spec: ECMA-376 Part 2 §9.3.
 */
Deno.test("e2e: hyperlinks on multiple slides", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(bounds(inches(1), inches(1), inches(8), inches(1)), [
        paragraph(link("Slide 1 link", "https://example.com/s1")),
      ]),
    ),
    slide(
      textbox(bounds(inches(1), inches(1), inches(8), inches(1)), [
        paragraph(link("Slide 2 link", "https://example.com/s2")),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 2);
  assert(result.slides[0]?.shapes[0]?.text?.includes("Slide 1 link"));
  assert(result.slides[1]?.shapes[0]?.text?.includes("Slide 2 link"));
});

// ---------------------------------------------------------------------------
// End-to-end: Combined features
// ---------------------------------------------------------------------------

/**
 * Generate a presentation using all five new features together.
 */
Deno.test("e2e: all features combined", async () => {
  const png = createTestPng();
  const pptx = generate(presentation(
    { title: "Feature Showcase" },
    // Slide 1: Image + styled text
    slide(
      textbox(
        bounds(inches(1), inches(0.5), inches(8), inches(1)),
        [
          paragraph([
            bold("Feature Showcase"),
            text(" - "),
            underline("Complete Demo"),
          ], { alignment: "center" }),
        ],
        { fill: solidFill(hexColor("E8E8E8")) },
      ),
      image(
        bounds(inches(3), inches(2), inches(4), inches(3)),
        png,
        "image/png",
        "Demo image",
      ),
    ),
    // Slide 2: Table + hyperlink
    slide(
      table(
        bounds(inches(1), inches(1), inches(6), inches(2)),
        [inches(3), inches(3)],
        [
          row(inches(0.5), [
            cell([paragraph(bold("Feature"))], {
              fill: solidFill(hexColor("4472C4")),
            }),
            cell([paragraph(bold("Status"))], {
              fill: solidFill(hexColor("4472C4")),
            }),
          ]),
          row(inches(0.5), [
            cell([paragraph("Images")]),
            cell([paragraph("Done")]),
          ]),
        ],
      ),
      textbox(bounds(inches(1), inches(4), inches(8), inches(1)), [
        paragraph([
          text("See "),
          link("docs", "https://example.com/docs"),
          text(" for details"),
        ]),
      ]),
    ),
    // Slide 3: Styled shapes + bullets
    slide(
      shape(
        "rect",
        bounds(inches(1), inches(1), inches(3), inches(2)),
        [paragraph("Red box", { alignment: "center" })],
        { fill: solidFill(hexColor("FF0000")) },
      ),
      textbox(bounds(inches(5), inches(1), inches(4), inches(4)), [
        paragraph("Bullet list:", { bullet: bulletNone() }),
        paragraph("First item", { bullet: bulletChar("\u2022"), level: 0 }),
        paragraph("Second item", { bullet: bulletChar("\u2022"), level: 0 }),
        paragraph("Sub-item", { bullet: bulletChar("\u2013"), level: 1 }),
      ]),
    ),
  ));

  const result = await validatePptx(pptx, 3);
  assertEquals(result.slide_count, 3);

  // Slide 1: textbox + image
  assertEquals(result.slides[0]?.shape_count, 2);
  assert(result.slides[0]?.shapes[0]?.text?.includes("Feature Showcase"));
  assert(result.slides[0]?.shapes[1]?.is_picture);

  // Slide 2: table + textbox with hyperlink
  assertEquals(result.slides[1]?.shape_count, 2);
  assert(result.slides[1]?.shapes[0]?.is_table);
  assertEquals(result.slides[1]?.shapes[0]?.table_data?.[1]?.[0], "Images");
  assert(result.slides[1]?.shapes[1]?.text?.includes("docs"));

  // Slide 3: styled shape + bullet list
  assertEquals(result.slides[2]?.shape_count, 2);
  assertEquals(result.slides[2]?.shapes[0]?.text, "Red box");
  assert(result.slides[2]?.shapes[1]?.text?.includes("First item"));
});

// ---------------------------------------------------------------------------
// Coverage gap tests
// ---------------------------------------------------------------------------

/**
 * Generate a JPEG image to exercise the JPEG content type path.
 * Spec: ECMA-376 Part 2 §10.1.2.2 (Default content types).
 */
Deno.test("e2e: JPEG image content type", async () => {
  // Minimal valid JPEG (SOI + APP0 + EOI)
  const jpeg = new Uint8Array([
    0xFF,
    0xD8,
    0xFF,
    0xE0,
    0x00,
    0x10,
    0x4A,
    0x46,
    0x49,
    0x46,
    0x00,
    0x01,
    0x01,
    0x00,
    0x00,
    0x01,
    0x00,
    0x01,
    0x00,
    0x00,
    0xFF,
    0xD9,
  ]);
  const pptx = generate(presentation(
    slide(
      image(
        bounds(inches(1), inches(1), inches(4), inches(3)),
        jpeg,
        "image/jpeg",
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 1);
});

/**
 * Generate a shape with vertical alignment and text.
 * Spec: ECMA-376 §21.1.2.1.1 (a:bodyPr anchor).
 */
Deno.test("e2e: preset shape with verticalAlignment", async () => {
  const pptx = generate(presentation(
    slide(
      shape(
        "rect",
        bounds(inches(1), inches(1), inches(4), inches(3)),
        [paragraph("Bottom aligned")],
        { verticalAlignment: "bottom" },
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Bottom aligned");
});

/**
 * Generate a table with an empty cell (no paragraphs).
 * Spec: ECMA-376 §21.1.3.15 (a:tc requires a:txBody with at least one a:p).
 */
Deno.test("e2e: table with empty cell", async () => {
  const pptx = generate(presentation(
    slide(
      table(
        bounds(inches(1), inches(1), inches(4), inches(1)),
        [inches(2), inches(2)],
        [
          row(inches(0.5), [
            cell([paragraph("Data")]),
            cell([]),
          ]),
        ],
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assert(result.slides[0]?.shapes[0]?.is_table);
  assertEquals(result.slides[0]?.shapes[0]?.table_data?.[0]?.[0], "Data");
  assertEquals(result.slides[0]?.shapes[0]?.table_data?.[0]?.[1], "");
});

/**
 * Generate a textbox with line-only styling (no fill on line).
 * Spec: ECMA-376 §20.1.2.2.24 (a:ln).
 */
Deno.test("e2e: textbox with line width only", async () => {
  const pptx = generate(presentation(
    slide(
      textbox(
        bounds(inches(1), inches(1), inches(6), inches(2)),
        [paragraph("Line width only")],
        { line: lineStyle({ width: pt(3) }) },
      ),
    ),
  ));

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes[0]?.text, "Line width only");
});
