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
  cm,
  emu,
  fontSize,
  generate,
  hexColor,
  inches,
  italic,
  paragraph,
  percentage,
  presentation,
  pt,
  shape,
  slide,
  text,
  textbox,
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
  const scriptPath = new URL("../scripts/validate.py", import.meta.url)
    .pathname;

  const cmd = new Deno.Command("python3", {
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
  assertEquals(cm(2.54) as number, 914400); // 2.54 cm = 1 inch
});

/**
 * Verify pt() converts correctly: 1 pt = 12700 EMUs.
 * Spec: ECMA-376 §20.1.10.16.
 */
Deno.test("pt() converts to EMUs", () => {
  assertEquals(pt(1) as number, 12700);
  assertEquals(pt(72) as number, 914400); // 72 pt = 1 inch
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

// ---------------------------------------------------------------------------
// Bounds builder test
// ---------------------------------------------------------------------------

/**
 * Verify bounds() creates a position+size record.
 * Spec: ECMA-376 §20.1.7.5 (a:xfrm), §20.1.7.4 (a:off), §20.1.7.3 (a:ext).
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
// End-to-end generation tests
// ---------------------------------------------------------------------------

/**
 * Generate a minimal single-slide presentation with one text box.
 * Spec: ECMA-376 §13.3.8 (slide), §19.3.1.43 (sp), §21.1.2 (txBody).
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
 * Spec: ECMA-376 §21.1.2.3.10 (a:rPr sz attribute), §20.1.2.3.19 (srgbClr).
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
 * Spec: ECMA-376 §19.3.1.43 (spTree can contain multiple sp elements).
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
  assertEquals(result.slides[0]?.shapes[0]?.text, "Centimeter-positioned text");
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
 * Spec: ECMA-376 §21.1.2.3.8 (a:r can repeat within a:p).
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
