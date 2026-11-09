/**
 * Image format detection, intrinsic size parsing, and fit/crop resolution.
 */

import type { Percentage } from "./types.ts";
import type { CropRect, ImageFit } from "./style.ts";
import type { Frame } from "./scene.ts";

/** A raster format PowerPoint renders without a fallback image. */
export interface ImageFormat {
  readonly extension: "png" | "jpeg" | "gif" | "bmp";
  readonly contentType: "image/png" | "image/jpeg" | "image/gif" | "image/bmp";
}

interface ImageSize {
  readonly width: number;
  readonly height: number;
}

/** Detected format plus intrinsic pixel size when the header is readable. */
export interface ImageInfo extends ImageFormat {
  readonly size?: ImageSize;
}

function view(data: Uint8Array): DataView {
  return new DataView(data.buffer, data.byteOffset, data.byteLength);
}

function startsWith(data: Uint8Array, bytes: ReadonlyArray<number>): boolean {
  return bytes.every((byte, index) => data[index] === byte);
}

function readPngSize(data: Uint8Array): ImageSize | undefined {
  if (data.length < 24) return undefined;
  return { width: view(data).getUint32(16), height: view(data).getUint32(20) };
}

function readGifSize(data: Uint8Array): ImageSize | undefined {
  if (data.length < 10) return undefined;
  return {
    width: view(data).getUint16(6, true),
    height: view(data).getUint16(8, true),
  };
}

function readBmpSize(data: Uint8Array): ImageSize | undefined {
  if (data.length < 26) return undefined;
  // BITMAPINFOHEADER height is signed; negative means top-down row order.
  return {
    width: Math.abs(view(data).getInt32(18, true)),
    height: Math.abs(view(data).getInt32(22, true)),
  };
}

function readJpegSize(data: Uint8Array): ImageSize | undefined {
  let offset = 2;
  while (offset + 9 < data.length) {
    if (data[offset] !== 0xFF) {
      offset++;
      continue;
    }
    while (offset < data.length && data[offset] === 0xFF) offset++;
    const marker = data[offset];
    if (marker === undefined) return undefined;
    offset++;
    if (marker === 0xD8 || marker === 0xD9) continue;
    if (offset + 1 >= data.length) return undefined;
    const length = view(data).getUint16(offset);
    if (length < 2 || offset + length > data.length) return undefined;
    const isStartOfFrame = marker >= 0xC0 && marker <= 0xCF &&
      marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC;
    if (isStartOfFrame && length >= 7) {
      return {
        height: view(data).getUint16(offset + 3),
        width: view(data).getUint16(offset + 5),
      };
    }
    offset += length;
  }
  return undefined;
}

const FORMATS: ReadonlyArray<
  ImageFormat & {
    readonly magic: ReadonlyArray<number>;
    readonly readSize: (data: Uint8Array) => ImageSize | undefined;
  }
> = [
  {
    extension: "png",
    contentType: "image/png",
    magic: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    readSize: readPngSize,
  },
  {
    extension: "jpeg",
    contentType: "image/jpeg",
    magic: [0xFF, 0xD8, 0xFF],
    readSize: readJpegSize,
  },
  {
    extension: "gif",
    contentType: "image/gif",
    magic: [0x47, 0x49, 0x46, 0x38],
    readSize: readGifSize,
  },
  {
    extension: "bmp",
    contentType: "image/bmp",
    magic: [0x42, 0x4D],
    readSize: readBmpSize,
  },
];

/** Detect the image format from its signature and read its pixel size. */
export function inspectImage(data: Uint8Array): ImageInfo {
  const format = FORMATS.find((entry) => startsWith(data, entry.magic));
  if (!format) {
    // Image bytes are runtime data, so the format can only be checked here.
    throw new Error(
      "Unsupported image data: expected PNG, JPEG, GIF, or BMP bytes",
    );
  }
  const size = format.readSize(data);
  return {
    extension: format.extension,
    contentType: format.contentType,
    size: size && size.width > 0 && size.height > 0 ? size : undefined,
  };
}

function asPercent(value: number): Percentage {
  return Math.round(value) as Percentage;
}

/** Placement of an image inside a frame after applying a fit mode. */
export interface ResolvedImageFit {
  /** Where the visible image lands; inside `frame` for `contain`. */
  readonly frame: Frame;
  /** Source crop in 1/1000 % of the image (`a:srcRect`). */
  readonly crop?: CropRect;
}

/**
 * Resolve an image's placement for a fit mode. The aspect ratio is taken from
 * the source region left after the caller's crop. Images whose size cannot be
 * read are stretched.
 */
export function resolveImageFit(
  frame: Frame,
  size: ImageSize | undefined,
  fit: ImageFit | undefined,
  crop: CropRect | undefined,
): ResolvedImageFit {
  const mode = fit ?? "contain";
  if (!size || mode === "stretch" || frame.w <= 0 || frame.h <= 0) {
    return { frame, crop };
  }

  const keepX = 1 - ((crop?.left ?? 0) + (crop?.right ?? 0)) / 100000;
  const keepY = 1 - ((crop?.top ?? 0) + (crop?.bottom ?? 0)) / 100000;
  if (keepX <= 0 || keepY <= 0) return { frame, crop };

  const imageRatio = (size.width * keepX) / (size.height * keepY);
  const frameRatio = frame.w / frame.h;

  if (mode === "contain") {
    const w = imageRatio > frameRatio ? frame.w : frame.h * imageRatio;
    const h = imageRatio > frameRatio ? frame.w / imageRatio : frame.h;
    return {
      frame: {
        x: Math.round(frame.x + (frame.w - w) / 2) as Frame["x"],
        y: Math.round(frame.y + (frame.h - h) / 2) as Frame["y"],
        w: Math.round(w) as Frame["w"],
        h: Math.round(h) as Frame["h"],
      },
      crop,
    };
  }

  // cover: trim the longer axis of the remaining source region equally.
  if (imageRatio > frameRatio) {
    const trim = (1 - frameRatio / imageRatio) * keepX * 100000 / 2;
    return {
      frame,
      crop: {
        ...crop,
        left: asPercent((crop?.left ?? 0) + trim),
        right: asPercent((crop?.right ?? 0) + trim),
      },
    };
  }
  const trim = (1 - imageRatio / frameRatio) * keepY * 100000 / 2;
  return {
    frame,
    crop: {
      ...crop,
      top: asPercent((crop?.top ?? 0) + trim),
      bottom: asPercent((crop?.bottom ?? 0) + trim),
    },
  };
}
