/**
 * Layout containers and resolution into scene nodes.
 */

import type { Emu } from "./types.ts";
import { emu } from "./st.ts";
import type { CrossAlignment, Insets, MainAlignment } from "./style.ts";
import type { LeafNode } from "./nodes.ts";
import type { Frame, SceneNode } from "./scene.ts";
import { placeLeaf } from "./scene.ts";

/** Layout metadata applied to a child within a row or column. */
export interface LayoutItemProps {
  readonly basis?: Emu;
  readonly grow?: number;
  readonly w?: Emu;
  readonly h?: Emu;
  readonly alignSelf?: CrossAlignment;
  readonly aspectRatio?: number;
}

/** A layout item wrapping a child node. */
export interface LayoutItem extends LayoutItemProps {
  readonly kind: "item";
  readonly child: LayoutNode;
  /** Free space is inserted before this item (first child of an End slot). */
  readonly pushEnd?: boolean;
}

/** Shared row/column container properties. */
interface ContainerProps {
  readonly gap?: Emu;
  readonly padding?: Emu | Insets;
  readonly justify?: MainAlignment;
  readonly align?: CrossAlignment;
}

/** A horizontal flex-like container. */
export interface Row extends ContainerProps {
  readonly kind: "row";
  readonly children: ReadonlyArray<LayoutItem | Positioned>;
}

/** A vertical flex-like container. */
export interface Col extends ContainerProps {
  readonly kind: "col";
  readonly children: ReadonlyArray<LayoutItem | Positioned>;
}

/** An overlay stack container. */
export interface Stack {
  readonly kind: "stack";
  readonly padding?: Emu | Insets;
  readonly children: ReadonlyArray<ResolvableNode>;
}

/** Alignment options within an align wrapper. */
export type AlignAxis = "start" | "center" | "end";

/** Align a child within its parent frame. */
export interface Align {
  readonly kind: "align";
  readonly child: ResolvableNode;
  readonly x: AlignAxis;
  readonly y: AlignAxis;
  readonly padding?: Emu | Insets;
  readonly w?: Emu;
  readonly h?: Emu;
  readonly aspectRatio?: number;
}

/** Parent-relative absolute placement. */
export interface Positioned {
  readonly kind: "positioned";
  readonly x: Emu;
  readonly y: Emu;
  readonly w: Emu;
  readonly h: Emu;
  readonly child: LayoutNode;
}

/** Any layout-resolvable node. */
export type LayoutNode = LeafNode | Row | Col | Stack | Align;

/** Any node that can resolve into scene nodes; also a top-level slide child. */
export type ResolvableNode = LayoutNode | Positioned;

interface ResolvedInsets {
  readonly top: Emu;
  readonly right: Emu;
  readonly bottom: Emu;
  readonly left: Emu;
}

function toInsets(padding: Emu | Insets | undefined): ResolvedInsets {
  if (padding === undefined) {
    return {
      top: emu(0),
      right: emu(0),
      bottom: emu(0),
      left: emu(0),
    };
  }
  if (typeof padding === "number") {
    return {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding,
    };
  }
  return {
    top: padding.top ?? emu(0),
    right: padding.right ?? emu(0),
    bottom: padding.bottom ?? emu(0),
    left: padding.left ?? emu(0),
  };
}

/** Shrink a frame by padding, clamping the size at zero. */
export function insetFrame(
  frame: Frame,
  padding: Emu | Insets | undefined,
): Frame {
  const insets = toInsets(padding);
  return {
    x: emu(frame.x + insets.left),
    y: emu(frame.y + insets.top),
    w: emu(Math.max(0, frame.w - insets.left - insets.right)),
    h: emu(Math.max(0, frame.h - insets.top - insets.bottom)),
  };
}

function positionedFrame(positionedNode: Positioned, frame: Frame): Frame {
  return {
    x: emu(frame.x + positionedNode.x),
    y: emu(frame.y + positionedNode.y),
    w: positionedNode.w,
    h: positionedNode.h,
  };
}

function resolveResolvableNode(
  child: ResolvableNode,
  frame: Frame,
): ReadonlyArray<SceneNode> {
  if (child.kind === "positioned") {
    return resolveLayoutNode(child.child, positionedFrame(child, frame));
  }
  return resolveLayoutNode(child, frame);
}

/** Resolve top-level slide children into positioned scene nodes. */
export function resolveSlideChildren(
  children: ReadonlyArray<ResolvableNode>,
  frame: Frame,
): ReadonlyArray<SceneNode> {
  return children.flatMap((child) => resolveResolvableNode(child, frame));
}

function resolveLayoutNode(
  node: LayoutNode,
  frame: Frame,
): ReadonlyArray<SceneNode> {
  switch (node.kind) {
    case "textbox":
    case "shape":
    case "image":
    case "table":
    case "chart":
      return [placeLeaf(frame, node)];
    case "row":
      return resolveAxisContainer("row", node, frame);
    case "col":
      return resolveAxisContainer("col", node, frame);
    case "stack":
      return resolveStack(node, frame);
    case "align":
      return resolveAlign(node, frame);
  }
}

function resolveStack(
  stackNode: Stack,
  frame: Frame,
): ReadonlyArray<SceneNode> {
  const inner = insetFrame(frame, stackNode.padding);
  return stackNode.children.flatMap((child) =>
    resolveResolvableNode(child, inner)
  );
}

function resolveAlign(node: Align, frame: Frame): ReadonlyArray<SceneNode> {
  const inner = insetFrame(frame, node.padding);
  let width = node.w;
  let height = node.h;

  if (
    width === undefined && height !== undefined &&
    node.aspectRatio !== undefined
  ) {
    width = emu(height * node.aspectRatio);
  }
  if (
    height === undefined && width !== undefined &&
    node.aspectRatio !== undefined
  ) {
    height = emu(width / node.aspectRatio);
  }

  const rect: Frame = {
    x: alignAxis(inner.x, inner.w, width ?? inner.w, node.x),
    y: alignAxis(inner.y, inner.h, height ?? inner.h, node.y),
    w: width ?? inner.w,
    h: height ?? inner.h,
  };
  return resolveResolvableNode(node.child, rect);
}

function alignAxis(
  start: Emu,
  available: Emu,
  size: Emu,
  align: AlignAxis,
): Emu {
  switch (align) {
    case "start":
      return start;
    case "center":
      return emu(start + (available - size) / 2);
    case "end":
      return emu(start + available - size);
  }
}

function resolveAxisContainer(
  axis: "row" | "col",
  container: Row | Col,
  frame: Frame,
): ReadonlyArray<SceneNode> {
  const inner = insetFrame(frame, container.padding);
  if (container.children.length === 0) return [];

  const gap = Number(container.gap ?? emu(0));
  const flowItems = container.children.filter((
    child,
  ): child is LayoutItem => child.kind !== "positioned");

  const gapCount = flowItems.length > 1 ? flowItems.length - 1 : 0;
  const mainAvailable = Math.max(
    0,
    Number(axis === "row" ? inner.w : inner.h) - gap * gapCount,
  );

  const bases = flowItems.map((layoutItem) =>
    Number(itemBasis(layoutItem, axis))
  );
  const grows = flowItems.map((layoutItem, index) => {
    if (layoutItem.grow !== undefined) return layoutItem.grow;
    return bases[index] === 0 ? 1 : 0;
  });

  const sizes = resolveMainSizes(bases, grows, mainAvailable);
  const pushIndex = flowItems.findIndex((layoutItem) => layoutItem.pushEnd);

  const totalGrow = grows.reduce((sum, value) => sum + value, 0);
  const freeSpace = Math.max(
    0,
    mainAvailable - sizes.reduce((sum, value) => sum + value, 0),
  );
  const justify = container.justify ?? "start";
  const align = container.align ?? "stretch";

  let cursor = Number(axis === "row" ? inner.x : inner.y);
  let interGap = gap;

  if (pushIndex === -1 && totalGrow === 0) {
    switch (justify) {
      case "center":
        cursor += freeSpace / 2;
        break;
      case "end":
        cursor += freeSpace;
        break;
      case "space-between":
        if (flowItems.length > 1) {
          interGap = gap + freeSpace / (flowItems.length - 1);
        }
        break;
      case "start":
        break;
    }
  }

  const flowFrames: Array<Frame | undefined> = [];
  for (const [index, layoutItem] of flowItems.entries()) {
    if (index === pushIndex) cursor += freeSpace;
    const main = sizes[index] ?? 0;
    const rect = axis === "row"
      ? createRowItemFrame(layoutItem, inner, emu(cursor), emu(main), align)
      : createColItemFrame(
        layoutItem,
        inner,
        emu(cursor),
        emu(main),
        align,
      );
    flowFrames.push(rect);
    cursor += main + interGap;
  }

  const scenes: SceneNode[] = [];
  let flowIndex = 0;
  for (const child of container.children) {
    if (child.kind === "positioned") {
      scenes.push(...resolveResolvableNode(child, inner));
      continue;
    }
    const rect = flowFrames[flowIndex];
    flowIndex += 1;
    if (rect) {
      scenes.push(...resolveLayoutNode(child.child, rect));
    }
  }

  return scenes;
}

function resolveMainSizes(
  bases: ReadonlyArray<number>,
  grows: ReadonlyArray<number>,
  mainAvailable: number,
): ReadonlyArray<number> {
  const sizes = [...bases];
  const remaining = Math.max(
    0,
    mainAvailable - bases.reduce((sum, value) => sum + value, 0),
  );
  const totalGrow = grows.reduce((sum, value) => sum + value, 0);
  if (remaining === 0 || totalGrow === 0) {
    return sizes;
  }

  for (const [index, grow] of grows.entries()) {
    if (grow <= 0) continue;
    sizes[index] = sizes[index]! + (remaining * grow / totalGrow);
  }
  return sizes;
}

function itemBasis(item: LayoutItem, axis: "row" | "col"): Emu {
  if (item.basis !== undefined) return item.basis;
  if (axis === "row") return item.w ?? emu(0);
  return item.h ?? emu(0);
}

function alignOffset(
  start: Emu,
  available: Emu,
  size: Emu,
  align: CrossAlignment,
): Emu {
  switch (align) {
    case "center":
      return emu(start + (available - size) / 2);
    case "end":
      return emu(start + available - size);
    case "start":
    case "stretch":
      return start;
  }
}

function createRowItemFrame(
  item: LayoutItem,
  frame: Frame,
  x: Emu,
  width: Emu,
  fallbackAlign: CrossAlignment,
): Frame {
  const align = item.alignSelf ?? fallbackAlign;
  const explicitHeight = resolveCrossSize(
    width,
    item.h,
    item.aspectRatio,
    "row",
  );
  if (explicitHeight !== undefined && align !== "stretch") {
    return {
      x,
      y: alignOffset(frame.y, frame.h, explicitHeight, align),
      w: width,
      h: explicitHeight,
    };
  }
  return {
    x,
    y: frame.y,
    w: width,
    h: explicitHeight ?? frame.h,
  };
}

function createColItemFrame(
  item: LayoutItem,
  frame: Frame,
  y: Emu,
  height: Emu,
  fallbackAlign: CrossAlignment,
): Frame {
  const align = item.alignSelf ?? fallbackAlign;
  const explicitWidth = resolveCrossSize(
    height,
    item.w,
    item.aspectRatio,
    "col",
  );
  if (explicitWidth !== undefined && align !== "stretch") {
    return {
      x: alignOffset(frame.x, frame.w, explicitWidth, align),
      y,
      w: explicitWidth,
      h: height,
    };
  }
  return {
    x: frame.x,
    y,
    w: explicitWidth ?? frame.w,
    h: height,
  };
}

function resolveCrossSize(
  main: Emu,
  explicitCross: Emu | undefined,
  aspectRatio: number | undefined,
  axis: "row" | "col",
): Emu | undefined {
  if (explicitCross !== undefined) return explicitCross;
  if (aspectRatio === undefined) return undefined;
  return axis === "row" ? emu(main / aspectRatio) : emu(main * aspectRatio);
}
