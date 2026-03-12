/**
 * Image dimension parsing and fit/crop resolution.
 */

import type { Percentage } from "./types.ts";
import type { CropRect, ImageFit } from "./style.ts";
import type { Frame } from "./scene.ts";

interface ImageSize {
  readonly width: number;
  readonly height: number;
}

function readPngSize(data: Uint8Array): ImageSize | undefined {
  if (data.length < 24) return undefined;
  if (
    data[0] !== 0x89 || data[1] !== 0x50 || data[2] !== 0x4E || data[3] !== 0x47
  ) return undefined;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function readGifSize(data: Uint8Array): ImageSize | undefined {
  if (data.length < 10) return undefined;
  if (
    data[0] !== 0x47 || data[1] !== 0x49 || data[2] !== 0x46
  ) return undefined;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
}

function readBmpSize(data: Uint8Array): ImageSize | undefined {
  if (data.length < 26) return undefined;
  if (data[0] !== 0x42 || data[1] !== 0x4D) return undefined;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return { width: view.getUint32(18, true), height: view.getUint32(22, true) };
}

function readJpegSize(data: Uint8Array): ImageSize | undefined {
  if (data.length < 4 || data[0] !== 0xFF || data[1] !== 0xD8) return undefined;
  let offset = 2;
  while (offset + 9 < data.length) {
    const current = data[offset];
    if (current === undefined) return undefined;
    if (current !== 0xFF) {
      offset++;
      continue;
    }
    while (offset < data.length && data[offset] === 0xFF) offset++;
    if (offset >= data.length) return undefined;
    const marker = data[offset];
    if (marker === undefined) return undefined;
    offset++;
    if (marker === 0xD8 || marker === 0xD9) continue;
    if (offset + 1 >= data.length) return undefined;
    const high = data[offset];
    const low = data[offset + 1];
    if (high === undefined || low === undefined) return undefined;
    const length = (high << 8) | low;
    if (length < 2 || offset + length > data.length) return undefined;
    const isSof = (marker >= 0xC0 && marker <= 0xC3) ||
      (marker >= 0xC5 && marker <= 0xC7) ||
      (marker >= 0xC9 && marker <= 0xCB) ||
      (marker >= 0xCD && marker <= 0xCF);
    if (isSof && offset + 6 < data.length) {
      const hHigh = data[offset + 3];
      const hLow = data[offset + 4];
      const wHigh = data[offset + 5];
      const wLow = data[offset + 6];
      if (
        hHigh === undefined || hLow === undefined || wHigh === undefined ||
        wLow === undefined
      ) return undefined;
      return {
        height: (hHigh << 8) | hLow,
        width: (wHigh << 8) | wLow,
      };
    }
    offset += length;
  }
  return undefined;
}

function readSvgSize(data: Uint8Array): ImageSize | undefined {
  const text = new TextDecoder().decode(data);
  const width = Number(text.match(/\bwidth="([\d.]+)"/)?.[1] ?? "");
  const height = Number(text.match(/\bheight="([\d.]+)"/)?.[1] ?? "");
  if (
    Number.isFinite(width) && Number.isFinite(height) && width > 0 &&
    height > 0
  ) {
    return { width, height };
  }
  const viewBox = text.match(/\bviewBox="([\d.\s-]+)"/)?.[1];
  if (!viewBox) return undefined;
  const parts = viewBox.trim().split(/\s+/).map(Number);
  if (parts.length !== 4 || !parts.every((value) => Number.isFinite(value))) {
    return undefined;
  }
  const [, , vbWidth, vbHeight] = parts;
  if (vbWidth === undefined || vbHeight === undefined) return undefined;
  return { width: vbWidth, height: vbHeight };
}

/** Attempt to parse image dimensions from supported image formats. */
export function readImageSize(
  data: Uint8Array,
  contentType: string,
): ImageSize | undefined {
  switch (contentType) {
    case "image/png":
      return readPngSize(data);
    case "image/jpeg":
      return readJpegSize(data);
    case "image/gif":
      return readGifSize(data);
    case "image/bmp":
      return readBmpSize(data);
    case "image/svg+xml":
      return readSvgSize(data);
    default:
      return undefined;
  }
}

function asPercent(value: number): Percentage {
  return Math.max(0, Math.min(100000, Math.round(value))) as Percentage;
}

/** Merge two crop rectangles additively with clamping. */
export function mergeCropRects(
  first: CropRect | undefined,
  second: CropRect | undefined,
): CropRect | undefined {
  if (!first && !second) return undefined;
  return {
    top: asPercent((first?.top ?? 0) + (second?.top ?? 0)),
    right: asPercent((first?.right ?? 0) + (second?.right ?? 0)),
    bottom: asPercent((first?.bottom ?? 0) + (second?.bottom ?? 0)),
    left: asPercent((first?.left ?? 0) + (second?.left ?? 0)),
  };
}

/** Resolve an image frame and crop rectangle for a target fit mode. */
export function resolveImageFit(
  frame: Frame,
  imageData: Uint8Array,
  contentType: string,
  fit: ImageFit | undefined,
  crop: CropRect | undefined,
): { readonly frame: Frame; readonly crop?: CropRect } {
  const mode = fit ?? "contain";
  const size = readImageSize(imageData, contentType);
  if (!size) {
    return { frame, crop };
  }

  const imageRatio = size.width / size.height;
  const frameRatio = frame.w / frame.h;

  switch (mode) {
    case "stretch":
      return { frame, crop };
    case "contain": {
      if (imageRatio > frameRatio) {
        const height = frame.w / imageRatio;
        return {
          frame: {
            x: frame.x,
            y: (frame.y + (frame.h - height) / 2) as Frame["y"],
            w: frame.w,
            h: height as Frame["h"],
          },
          crop,
        };
      }
      const width = frame.h * imageRatio;
      return {
        frame: {
          x: (frame.x + (frame.w - width) / 2) as Frame["x"],
          y: frame.y,
          w: width as Frame["w"],
          h: frame.h,
        },
        crop,
      };
    }
    case "cover": {
      if (imageRatio > frameRatio) {
        const visible = frameRatio / imageRatio;
        const autoCrop = asPercent(((1 - visible) * 100000) / 2);
        return {
          frame,
          crop: mergeCropRects(crop, {
            left: autoCrop,
            right: autoCrop,
          }),
        };
      }
      const visible = imageRatio / frameRatio;
      const autoCrop = asPercent(((1 - visible) * 100000) / 2);
      return {
        frame,
        crop: mergeCropRects(crop, {
          top: autoCrop,
          bottom: autoCrop,
        }),
      };
    }
  }
}
