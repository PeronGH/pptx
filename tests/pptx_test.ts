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
import { fontSize, generatePresentation, hexColor, inches } from "../mod.ts";

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

/** Write bytes to a temp file and return the path. */
async function writeTempPptx(data: Uint8Array): Promise<string> {
  const path = await Deno.makeTempFile({ suffix: ".pptx" });
  await Deno.writeFile(path, data);
  return path;
}

/**
 * Generate a minimal single-slide presentation with one text box.
 * Spec: ECMA-376 §13.3.8 (slide), §19.3.1.43 (sp), §21.1.2 (txBody).
 */
Deno.test("minimal presentation with one text box", async () => {
  const pptx = generatePresentation({
    title: "Test Presentation",
    slides: [
      {
        elements: [
          {
            kind: "textbox",
            x: inches(1),
            y: inches(1),
            cx: inches(8),
            cy: inches(1),
            paragraphs: [{ text: "Hello, World!" }],
          },
        ],
      },
    ],
  });

  assert(pptx.length > 0, "PPTX should not be empty");

  const path = await writeTempPptx(pptx);
  try {
    const result = await validate(path, 1);
    assertEquals(result.slide_count, 1);
    assertEquals(result.slides[0]?.shape_count, 1);
    assertEquals(result.slides[0]?.shapes[0]?.has_text_frame, true);
    assertEquals(result.slides[0]?.shapes[0]?.text, "Hello, World!");
  } finally {
    await Deno.remove(path);
  }
});

/**
 * Generate a multi-slide presentation.
 * Spec: ECMA-376 §13.3.6 (sldIdLst).
 */
Deno.test("multi-slide presentation", async () => {
  const pptx = generatePresentation({
    title: "Multi Slide",
    slides: [
      {
        elements: [
          {
            kind: "textbox",
            x: inches(1),
            y: inches(1),
            cx: inches(6),
            cy: inches(1),
            paragraphs: [{ text: "Slide 1" }],
          },
        ],
      },
      {
        elements: [
          {
            kind: "textbox",
            x: inches(1),
            y: inches(1),
            cx: inches(6),
            cy: inches(1),
            paragraphs: [{ text: "Slide 2" }],
          },
        ],
      },
      {
        elements: [
          {
            kind: "textbox",
            x: inches(1),
            y: inches(1),
            cx: inches(6),
            cy: inches(1),
            paragraphs: [{ text: "Slide 3" }],
          },
        ],
      },
    ],
  });

  const path = await writeTempPptx(pptx);
  try {
    const result = await validate(path, 3);
    assertEquals(result.slide_count, 3);
    assertEquals(result.slides[0]?.shapes[0]?.text, "Slide 1");
    assertEquals(result.slides[1]?.shapes[0]?.text, "Slide 2");
    assertEquals(result.slides[2]?.shapes[0]?.text, "Slide 3");
  } finally {
    await Deno.remove(path);
  }
});

/**
 * Generate a presentation with a preset geometry shape.
 * Spec: ECMA-376 §20.1.9.18 (a:prstGeom).
 */
Deno.test("preset shape (rectangle)", async () => {
  const pptx = generatePresentation({
    slides: [
      {
        elements: [
          {
            kind: "shape",
            x: inches(1),
            y: inches(1),
            cx: inches(4),
            cy: inches(2),
            preset: "rect",
            paragraphs: [{ text: "Rectangle text" }],
          },
        ],
      },
    ],
  });

  const path = await writeTempPptx(pptx);
  try {
    const result = await validate(path, 1);
    assertEquals(result.slide_count, 1);
    assertEquals(result.slides[0]?.shape_count, 1);
    assertEquals(result.slides[0]?.shapes[0]?.text, "Rectangle text");
  } finally {
    await Deno.remove(path);
  }
});

/**
 * Generate a presentation with formatted text (bold, italic, font size, color).
 * Spec: ECMA-376 §21.1.2.3.8 (a:r), §21.1.2.3.10 (a:rPr).
 */
Deno.test("formatted text runs", async () => {
  const pptx = generatePresentation({
    slides: [
      {
        elements: [
          {
            kind: "textbox",
            x: inches(1),
            y: inches(1),
            cx: inches(8),
            cy: inches(2),
            paragraphs: [
              {
                text: [
                  { text: "Bold text", bold: true },
                  { text: " and " },
                  {
                    text: "colored italic",
                    italic: true,
                    fontSize: fontSize(24),
                    fontColor: hexColor("FF0000"),
                  },
                ],
              },
              {
                text: "Centered paragraph",
                alignment: "center",
              },
            ],
          },
        ],
      },
    ],
  });

  const path = await writeTempPptx(pptx);
  try {
    const result = await validate(path, 1);
    assertEquals(result.slide_count, 1);
    const shape = result.slides[0]?.shapes[0];
    assert(shape !== undefined, "Should have a shape");
    assert(shape.has_text_frame, "Should have text frame");
    assert(
      shape.text?.includes("Bold text"),
      "Should contain bold text",
    );
    assert(
      shape.text?.includes("colored italic"),
      "Should contain colored italic text",
    );
  } finally {
    await Deno.remove(path);
  }
});

/**
 * Generate a presentation with multiple shapes on one slide.
 * Spec: ECMA-376 §19.3.1.43 (spTree can contain multiple sp elements).
 */
Deno.test("multiple shapes on one slide", async () => {
  const pptx = generatePresentation({
    slides: [
      {
        elements: [
          {
            kind: "textbox",
            x: inches(1),
            y: inches(1),
            cx: inches(4),
            cy: inches(1),
            paragraphs: [{ text: "Text box" }],
          },
          {
            kind: "shape",
            x: inches(1),
            y: inches(3),
            cx: inches(3),
            cy: inches(2),
            preset: "ellipse",
            paragraphs: [{ text: "Ellipse" }],
          },
          {
            kind: "shape",
            x: inches(5),
            y: inches(3),
            cx: inches(3),
            cy: inches(2),
            preset: "roundRect",
          },
        ],
      },
    ],
  });

  const path = await writeTempPptx(pptx);
  try {
    const result = await validate(path, 1);
    assertEquals(result.slide_count, 1);
    assertEquals(result.slides[0]?.shape_count, 3);
  } finally {
    await Deno.remove(path);
  }
});
