/**
 * Layout containers and resolution into scene nodes.
 */

import type { Emu } from "./types.ts";
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

/** Shared container properties. */
export interface ContainerProps {
  readonly gap?: Emu;
  readonly padding?: Emu | Insets;
  readonly justify?: MainAlignment;
  readonly align?: CrossAlignment;
}

/** Props for an overlay stack container. */
export interface StackProps {
  readonly padding?: Emu | Insets;
}

/** Alignment options within an align wrapper. */
export type AlignAxis = "start" | "center" | "end";

/** A layout item wrapping a child node. */
export interface LayoutItem {
  readonly kind: "item";
  readonly child: LayoutNode;
  readonly basis?: Emu;
  readonly grow?: number;
  readonly w?: Emu;
  readonly h?: Emu;
  readonly alignSelf?: CrossAlignment;
  readonly aspectRatio?: number;
}

/** A flexible spacer in a row or column. */
export interface Spacer {
  readonly kind: "spacer";
  readonly grow: number;
  readonly min?: Emu;
  readonly max?: Emu;
}

/** A horizontal flex-like container. */
export interface Row extends ContainerProps {
  readonly kind: "row";
  readonly children: ReadonlyArray<RowChild>;
}

/** A vertical flex-like container. */
export interface Col extends ContainerProps {
  readonly kind: "col";
  readonly children: ReadonlyArray<ColChild>;
}

/** An overlay stack container. */
export interface Stack extends StackProps {
  readonly kind: "stack";
  readonly children: ReadonlyArray<ResolvableNode>;
}

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

/** Any node that can resolve into scene nodes. */
export type ResolvableNode = LayoutNode | Positioned;

/** A top-level slide child. */
export type SlideChild = ResolvableNode;

type RowChild = LayoutItem | Positioned | Spacer;
type ColChild = LayoutItem | Positioned | Spacer;

function isContainerProps(
  value: ContainerProps | LayoutItem | Positioned | LayoutNode | Spacer,
): value is ContainerProps {
  return typeof value === "object" && value !== null && !("kind" in value);
}

function isLayoutItemProps(
  value: LayoutItemProps | LayoutNode,
): value is LayoutItemProps {
  return typeof value === "object" && value !== null && !("kind" in value);
}

function isLayoutItem(value: LayoutNode | LayoutItem): value is LayoutItem {
  return value.kind === "item";
}

/** Create a layout item wrapper. */
export function item(
  first: LayoutItemProps | LayoutNode,
  second?: LayoutNode,
): LayoutItem {
  if (isLayoutItemProps(first)) {
    if (second === undefined) {
      throw new Error("item(props, child) requires a child node");
    }
    return { kind: "item", child: second, ...first };
  }
  return { kind: "item", child: first };
}

/** Create a parent-relative absolute node. */
export function positioned(
  frame: Omit<Positioned, "kind" | "child">,
  child: LayoutNode,
): Positioned {
  return { kind: "positioned", child, ...frame };
}

/** Create a flex spacer for row/column layout. */
export function spacer(
  options?: Omit<Spacer, "kind" | "grow"> & {
    readonly grow?: number;
  },
): Spacer {
  return {
    kind: "spacer",
    grow: options?.grow ?? 1,
    min: options?.min,
    max: options?.max,
  };
}

function asRowChild(
  value: LayoutNode | LayoutItem | Positioned | Spacer,
): RowChild {
  if (value.kind === "positioned") return value;
  if (value.kind === "spacer") return value;
  if (isLayoutItem(value)) return value;
  return { kind: "item", child: value };
}

function asColChild(
  value: LayoutNode | LayoutItem | Positioned | Spacer,
): ColChild {
  if (value.kind === "positioned") return value;
  if (value.kind === "spacer") return value;
  if (isLayoutItem(value)) return value;
  return { kind: "item", child: value };
}

/** Create a horizontal flex-like container. */
export function row(
  first?: ContainerProps | LayoutNode | LayoutItem | Positioned | Spacer,
  ...rest: ReadonlyArray<LayoutNode | LayoutItem | Positioned | Spacer>
): Row {
  if (first === undefined) return { kind: "row", children: [] };
  if (isContainerProps(first)) {
    return {
      kind: "row",
      children: rest.map(asRowChild),
      gap: first.gap,
      padding: first.padding,
      justify: first.justify,
      align: first.align,
    };
  }
  return {
    kind: "row",
    children: [asRowChild(first), ...rest.map(asRowChild)],
  };
}

/** Create a vertical flex-like container. */
export function col(
  first?: ContainerProps | LayoutNode | LayoutItem | Positioned | Spacer,
  ...rest: ReadonlyArray<LayoutNode | LayoutItem | Positioned | Spacer>
): Col {
  if (first === undefined) return { kind: "col", children: [] };
  if (isContainerProps(first)) {
    return {
      kind: "col",
      children: rest.map(asColChild),
      gap: first.gap,
      padding: first.padding,
      justify: first.justify,
      align: first.align,
    };
  }
  return {
    kind: "col",
    children: [asColChild(first), ...rest.map(asColChild)],
  };
}

/** Create an overlay stack container. */
export function stack(
  first?: StackProps | ResolvableNode,
  ...rest: ReadonlyArray<ResolvableNode>
): Stack {
  if (first === undefined) return { kind: "stack", children: [] };
  if (
    typeof first === "object" &&
    first !== null &&
    !("kind" in first)
  ) {
    return {
      kind: "stack",
      padding: first.padding,
      children: rest,
    };
  }
  return {
    kind: "stack",
    children: [first, ...rest],
  };
}

/** Align a child within its parent frame. */
export function align(
  props: Omit<Align, "kind" | "child">,
  child: ResolvableNode,
): Align {
  return { kind: "align", child, ...props };
}

interface ResolvedInsets {
  readonly top: Emu;
  readonly right: Emu;
  readonly bottom: Emu;
  readonly left: Emu;
}

function zeroEmu(): Emu {
  return asEmu(0);
}

function asEmu(value: number): Emu {
  // `Emu` is a branded number, so layout math converts plain numeric
  // arithmetic back into the branded type at this single boundary.
  // OOXML coordinates and extents are integer-valued, and PowerPoint rejects
  // fractional EMUs even when other consumers tolerate them.
  return Math.round(value) as Emu;
}

function toInsets(padding: Emu | Insets | undefined): ResolvedInsets {
  if (padding === undefined) {
    return {
      top: zeroEmu(),
      right: zeroEmu(),
      bottom: zeroEmu(),
      left: zeroEmu(),
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
    top: padding.top ?? zeroEmu(),
    right: padding.right ?? zeroEmu(),
    bottom: padding.bottom ?? zeroEmu(),
    left: padding.left ?? zeroEmu(),
  };
}

function insetFrame(frame: Frame, padding: Emu | Insets | undefined): Frame {
  const insets = toInsets(padding);
  return {
    x: asEmu(frame.x + insets.left),
    y: asEmu(frame.y + insets.top),
    w: asEmu(Math.max(0, frame.w - insets.left - insets.right)),
    h: asEmu(Math.max(0, frame.h - insets.top - insets.bottom)),
  };
}

function positionedFrame(positionedNode: Positioned, frame: Frame): Frame {
  return {
    x: asEmu(frame.x + positionedNode.x),
    y: asEmu(frame.y + positionedNode.y),
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
  children: ReadonlyArray<SlideChild>,
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
    width = asEmu(height * node.aspectRatio);
  }
  if (
    height === undefined && width !== undefined &&
    node.aspectRatio !== undefined
  ) {
    height = asEmu(width / node.aspectRatio);
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
      return asEmu(start + (available - size) / 2);
    case "end":
      return asEmu(start + available - size);
  }
}

function resolveAxisContainer(
  axis: "row" | "col",
  container: Row | Col,
  frame: Frame,
): ReadonlyArray<SceneNode> {
  const inner = insetFrame(frame, container.padding);
  if (container.children.length === 0) return [];

  const gap = Number(container.gap ?? zeroEmu());
  const flowItems = container.children.filter((
    child,
  ): child is LayoutItem | Spacer => child.kind !== "positioned");

  const gapCount = flowItems.length > 1 ? flowItems.length - 1 : 0;
  const mainAvailable = Math.max(
    0,
    Number(axis === "row" ? inner.w : inner.h) - gap * gapCount,
  );

  const bases = flowItems.map((layoutItem) =>
    Number(itemBasis(layoutItem, axis))
  );
  const grows = flowItems.map((layoutItem, index) => {
    if (layoutItem.kind === "spacer") return layoutItem.grow;
    if (layoutItem.grow !== undefined) return layoutItem.grow;
    return bases[index] === 0 ? 1 : 0;
  });

  const maxes = flowItems.map((item) =>
    item.kind === "spacer"
      ? Number(item.max ?? Number.POSITIVE_INFINITY)
      : undefined
  );

  const sizes = resolveMainSizes(bases, grows, maxes, mainAvailable);

  const totalGrow = grows.reduce((sum, value) => sum + value, 0);
  const freeSpace = Math.max(
    0,
    mainAvailable - sizes.reduce((sum, value) => sum + value, 0),
  );
  const justify = container.justify ?? "start";
  const align = container.align ?? "stretch";

  let cursor = Number(axis === "row" ? inner.x : inner.y);
  let interGap = gap;

  if (totalGrow === 0) {
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
    const main = sizes[index] ?? 0;
    const rect = layoutItem.kind === "spacer"
      ? undefined
      : axis === "row"
      ? createRowItemFrame(layoutItem, inner, asEmu(cursor), asEmu(main), align)
      : createColItemFrame(
        layoutItem,
        inner,
        asEmu(cursor),
        asEmu(main),
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
    if (child.kind === "spacer") {
      flowIndex += 1;
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
  maxes: ReadonlyArray<number | undefined>,
  mainAvailable: number,
): ReadonlyArray<number> {
  const sizes = [...bases];
  let remaining = Math.max(
    0,
    mainAvailable - bases.reduce((sum, value) => sum + value, 0),
  );
  let active = grows.map((grow, index) => ({ grow, index })).filter((item) =>
    item.grow > 0
  );

  while (remaining > 0 && active.length > 0) {
    const totalGrow = active.reduce((sum, item) => sum + item.grow, 0);
    let clamped = false;

    for (const item of active) {
      const proposed = sizes[item.index]! + (remaining * item.grow / totalGrow);
      const max = maxes[item.index];
      if (max !== undefined && proposed > max) {
        remaining -= max - sizes[item.index]!;
        sizes[item.index] = max;
        item.grow = 0;
        clamped = true;
      }
    }

    if (!clamped) {
      for (const item of active) {
        sizes[item.index] = sizes[item.index]! +
          (remaining * item.grow / totalGrow);
      }
      remaining = 0;
    }

    active = active.filter((item) => item.grow > 0);
  }

  return sizes;
}

function itemBasis(item: LayoutItem | Spacer, axis: "row" | "col"): Emu {
  if (item.kind === "spacer") return item.min ?? zeroEmu();
  if (item.basis !== undefined) return item.basis;
  if (axis === "row") return item.w ?? zeroEmu();
  return item.h ?? zeroEmu();
}

function alignOffset(
  start: Emu,
  available: Emu,
  size: Emu,
  align: CrossAlignment,
): Emu {
  switch (align) {
    case "center":
      return asEmu(start + (available - size) / 2);
    case "end":
      return asEmu(start + available - size);
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
  return axis === "row" ? asEmu(main / aspectRatio) : asEmu(main * aspectRatio);
}
