/**
 * Flex-like layout containers and resolution into scene nodes.
 */

import type { Emu } from "./types.ts";
import type { CrossAlignment, Insets, MainAlignment } from "./style.ts";
import type { LeafNode } from "./nodes.ts";
import type { Frame, SceneNode } from "./scene.ts";
import { isSceneNode, placeLeaf } from "./scene.ts";

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

/** A horizontal flex-like container. */
export interface Row extends ContainerProps {
  readonly kind: "row";
  readonly children: ReadonlyArray<LayoutItem>;
}

/** A vertical flex-like container. */
export interface Col extends ContainerProps {
  readonly kind: "col";
  readonly children: ReadonlyArray<LayoutItem>;
}

/** An overlay stack container. */
export interface Stack extends StackProps {
  readonly kind: "stack";
  readonly children: ReadonlyArray<StackChild>;
}

/** Align a child within its parent frame. */
export interface Align {
  readonly kind: "align";
  readonly child: LayoutNode;
  readonly x: AlignAxis;
  readonly y: AlignAxis;
  readonly padding?: Emu | Insets;
  readonly w?: Emu;
  readonly h?: Emu;
  readonly aspectRatio?: number;
}

/** Any layout-resolvable node. */
export type LayoutNode = LeafNode | Row | Col | Stack | Align;

/** A top-level slide child. */
export type SlideChild = SceneNode | Row | Col | Stack | Align;

type RowChild = LayoutItem | LayoutNode;
type ColChild = LayoutItem | LayoutNode;
type StackChild = LayoutNode | SceneNode;

function isContainerProps(
  value: ContainerProps | RowChild,
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

function asItem(value: LayoutNode | LayoutItem): LayoutItem {
  if (isLayoutItem(value)) return value;
  return { kind: "item", child: value };
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

/** Create a horizontal flex-like container. */
export function row(
  first?: ContainerProps | RowChild,
  ...rest: ReadonlyArray<RowChild>
): Row {
  if (first === undefined) return { kind: "row", children: [] };
  if (isContainerProps(first)) {
    return {
      kind: "row",
      children: rest.map(asItem),
      gap: first.gap,
      padding: first.padding,
      justify: first.justify,
      align: first.align,
    };
  }
  return {
    kind: "row",
    children: [asItem(first), ...rest.map(asItem)],
  };
}

/** Create a vertical flex-like container. */
export function col(
  first?: ContainerProps | ColChild,
  ...rest: ReadonlyArray<ColChild>
): Col {
  if (first === undefined) return { kind: "col", children: [] };
  if (isContainerProps(first)) {
    return {
      kind: "col",
      children: rest.map(asItem),
      gap: first.gap,
      padding: first.padding,
      justify: first.justify,
      align: first.align,
    };
  }
  return {
    kind: "col",
    children: [asItem(first), ...rest.map(asItem)],
  };
}

/** Create an overlay stack container. */
export function stack(
  first?: StackProps | StackChild,
  ...rest: ReadonlyArray<StackChild>
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
  child: LayoutNode,
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
  return 0 as Emu;
}

function asEmu(value: number): Emu {
  return value as Emu;
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

function resolveSlideChild(
  child: SlideChild,
  frame: Frame,
): ReadonlyArray<SceneNode> {
  if (isSceneNode(child)) {
    return [child];
  }
  return resolveLayoutNode(child, frame);
}

/** Resolve top-level slide children into positioned scene nodes. */
export function resolveSlideChildren(
  children: ReadonlyArray<SlideChild>,
  frame: Frame,
): ReadonlyArray<SceneNode> {
  return children.flatMap((child) => resolveSlideChild(child, frame));
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

function insetFrame(frame: Frame, padding: Emu | Insets | undefined): Frame {
  const insets = toInsets(padding);
  return {
    x: asEmu(frame.x + insets.left),
    y: asEmu(frame.y + insets.top),
    w: asEmu(Math.max(0, frame.w - insets.left - insets.right)),
    h: asEmu(Math.max(0, frame.h - insets.top - insets.bottom)),
  };
}

function resolveStack(
  stackNode: Stack,
  frame: Frame,
): ReadonlyArray<SceneNode> {
  const inner = insetFrame(frame, stackNode.padding);
  return stackNode.children.flatMap((child) =>
    isSceneNode(child) ? [child] : resolveLayoutNode(child, inner)
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
  return resolveLayoutNode(node.child, rect);
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
  const padding = toInsets(container.padding);
  const inner: Frame = {
    x: asEmu(frame.x + padding.left),
    y: asEmu(frame.y + padding.top),
    w: asEmu(Math.max(0, frame.w - padding.left - padding.right)),
    h: asEmu(Math.max(0, frame.h - padding.top - padding.bottom)),
  };

  const items = container.children;
  if (items.length === 0) return [];

  const gap = Number(container.gap ?? zeroEmu());
  const gapCount = items.length > 1 ? items.length - 1 : 0;
  const mainAvailable = Math.max(
    0,
    Number(axis === "row" ? inner.w : inner.h) - gap * gapCount,
  );

  const bases = items.map((layoutItem) => Number(itemBasis(layoutItem, axis)));
  const grows = items.map((layoutItem, index) => {
    if (layoutItem.grow !== undefined) return layoutItem.grow;
    return bases[index] === 0 ? 1 : 0;
  });

  const fixedMain = bases.reduce((sum, value) => sum + value, 0);
  const remaining = Math.max(0, mainAvailable - fixedMain);
  const totalGrow = grows.reduce((sum, value) => sum + value, 0);

  const sizes = items.map((_, index) =>
    resolveMainSize(
      bases[index] ?? zeroEmu(),
      grows[index] ?? 0,
      remaining,
      totalGrow,
    )
  );

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
        if (items.length > 1) {
          interGap = gap + freeSpace / (items.length - 1);
        }
        break;
      case "start":
        break;
    }
  }

  const scenes: SceneNode[] = [];
  for (const [index, layoutItem] of items.entries()) {
    const main = sizes[index] ?? 0;
    const rect = axis === "row"
      ? createRowItemFrame(layoutItem, inner, asEmu(cursor), asEmu(main), align)
      : createColItemFrame(
        layoutItem,
        inner,
        asEmu(cursor),
        asEmu(main),
        align,
      );
    scenes.push(...resolveLayoutNode(layoutItem.child, rect));
    cursor += main + interGap;
  }

  return scenes;
}

function resolveMainSize(
  basis: number,
  grow: number,
  remaining: number,
  totalGrow: number,
): number {
  if (grow <= 0 || totalGrow <= 0) return basis;
  return basis + (remaining * grow / totalGrow);
}

function itemBasis(item: LayoutItem, axis: "row" | "col"): Emu {
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
  mainSize: Emu,
  explicit: Emu | undefined,
  aspectRatio: number | undefined,
  axis: "row" | "col",
): Emu | undefined {
  if (explicit !== undefined) return explicit;
  if (aspectRatio === undefined || aspectRatio <= 0) return undefined;
  if (axis === "row") return (mainSize / aspectRatio) as Emu;
  return (mainSize * aspectRatio) as Emu;
}
