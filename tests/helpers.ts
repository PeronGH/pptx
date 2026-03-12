import { unzipSync } from "fflate";

/** Result from the Python validation script. */
export interface ValidationResult {
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
      is_chart?: boolean;
      is_table?: boolean;
      table_rows?: number;
      table_cols?: number;
      table_data?: string[][];
    }>;
  }>;
}

/** Validate a generated PPTX file with python-pptx and LibreOffice. */
export async function validate(
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

/** Write bytes to a temp file, validate, and clean up. */
export async function validatePptx(
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

/** Create a minimal valid 1x1 red PNG. */
export function createTestPng(): Uint8Array {
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

/** Create a simple solid BMP with explicit dimensions. */
export function createTestBmp(
  width: number,
  height: number,
  rgb = [255, 0, 0] as const,
): Uint8Array {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const data = new Uint8Array(fileSize);
  const view = new DataView(data.buffer);

  data[0] = 0x42;
  data[1] = 0x4D;
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setUint32(18, width, true);
  view.setUint32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelArraySize, true);

  for (let y = 0; y < height; y++) {
    const rowOffset = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const offset = rowOffset + x * 3;
      data[offset] = rgb[2];
      data[offset + 1] = rgb[1];
      data[offset + 2] = rgb[0];
    }
  }

  return data;
}

/** Read a text entry from a generated PPTX. */
export function extractZipText(data: Uint8Array, path: string): string {
  const entries = unzipSync(data);
  const bytes = entries[path];
  if (!bytes) {
    throw new Error(`Missing zip entry: ${path}`);
  }
  return new TextDecoder().decode(bytes);
}
