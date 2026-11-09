/**
 * Positioned scene nodes: layout output and OOXML writer input.
 */

import type { Emu } from "./types.ts";
import type { LeafNode } from "./nodes.ts";

/** Absolute frame in slide coordinates. */
export interface Frame {
  readonly x: Emu;
  readonly y: Emu;
  readonly w: Emu;
  readonly h: Emu;
}

/** A content leaf placed at an absolute frame. */
export type SceneNode = LeafNode & Frame;

/** Convert a positioned frame and a leaf node into a scene node. */
export function placeLeaf(frame: Frame, leaf: LeafNode): SceneNode {
  return { ...leaf, x: frame.x, y: frame.y, w: frame.w, h: frame.h };
}
