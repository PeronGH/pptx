/**
 * Imperative presentation builder: an alternative to JSX for plain JavaScript
 * and for code coming from PptxGenJS. Every method builds the same component
 * elements as the declarative API, wrapped in `Positioned`, so both APIs share
 * one model, one layout engine, and one OOXML writer.
 */

import { emu, hex } from "./st.ts";
import type { LineStyle } from "./style.ts";
import type { Emu } from "./types.ts";
import type { PresetGeometry } from "./ooxml/enums.ts";
import { generate } from "./generate.ts";
import {
  Chart,
  Image,
  Positioned,
  Presentation,
  Shape,
  Slide,
  Table,
  Text,
  Title,
} from "./jsx_components.ts";
import type {
  ChartAreaProps,
  ChartBarProps,
  ChartDonutProps,
  ChartLineProps,
  ChartPieProps,
  ImageProps,
  KeysOfType,
  LayoutProps,
  PositionedProps,
  PptxChild,
  PptxNode,
  PresentationProps,
  ShapeNameProps,
  ShapeProps,
  SlideElement,
  SlideProps,
  TableCellProps,
  TableProps,
  TextProps,
} from "./public_types.ts";

/** Absolute position and size of an item, relative to the slide. */
export type Placement = Omit<PositionedProps, "children">;

/** Component props without flow-layout sizing, plus an absolute placement. */
type Placed<Props> = Placement & Omit<Props, keyof LayoutProps | "children">;

/** Presentation-level options (title, slide size, layout defaults). */
export type PresentationOptions = Omit<PresentationProps, "children">;

/** Slide-level options (background, layout defaults). */
export type SlideOptions = Omit<SlideProps, "children">;

/** Options for {@linkcode SlideBuilder.addText}. */
export type TextOptions = Placed<TextProps>;

/** Options for {@linkcode SlideBuilder.addShape}; `text` is drawn inside it. */
export type ShapeOptions = Placed<Omit<ShapeProps, "preset">> & {
  readonly text?: PptxChild;
};

/** A point relative to the slide's top-left corner. */
export interface Point {
  readonly x: Emu;
  readonly y: Emu;
}

/** Options for {@linkcode SlideBuilder.addLine}. */
export interface LineOptions extends ShapeNameProps {
  readonly from: Point;
  readonly to: Point;
  /**
   * Line style, merged over a 1.5pt black line. `beginArrow` sits at `from`,
   * `endArrow` at `to`.
   */
  readonly line?: LineStyle;
}

/** Options for {@linkcode SlideBuilder.addImage}. */
export type ImageOptions = Placed<Omit<ImageProps, "data">>;

/** A table cell: plain content, or content with cell styling. */
export type TableCellInput =
  | PptxChild
  | (Omit<TableCellProps, "children"> & { readonly content: PptxChild });

/** Options for {@linkcode SlideBuilder.addTable}. */
export type TableOptions = Placed<TableProps> & {
  /** One height for every row, or one per row. Defaults to `h / rows`. */
  readonly rowHeights?: Emu | ReadonlyArray<Emu>;
};

/** Options for the `add*Chart` methods of {@linkcode SlideBuilder}. */
export type ChartOptions<Props> = Placed<Props>;

/** Adds content to one slide. Every method returns the builder for chaining. */
export interface SlideBuilder {
  /** Add a text box. `text` is a string or `Text.P(...)` paragraphs. */
  addText(text: PptxChild, options: TextOptions): SlideBuilder;
  /** Add the slide title (at most one per slide); see `Title`. */
  addTitle(text: PptxChild, options: TextOptions): SlideBuilder;
  /** Add a preset shape, optionally with text inside. */
  addShape(preset: PresetGeometry, options: ShapeOptions): SlideBuilder;
  /** Add a PNG, JPEG, GIF, or BMP image. */
  addImage(data: Uint8Array, options: ImageOptions): SlideBuilder;
  /** Add a straight line, optionally with arrowheads, between two points. */
  addLine(options: LineOptions): SlideBuilder;
  /** Add a table from rows of cells. */
  addTable(
    rows: ReadonlyArray<ReadonlyArray<TableCellInput>>,
    options: TableOptions,
  ): SlideBuilder;
  /** Add a bar or column chart. */
  addBarChart<Row extends object, Category extends KeysOfType<Row, string>>(
    options: ChartOptions<ChartBarProps<Row, Category>>,
  ): SlideBuilder;
  /** Add a line chart. */
  addLineChart<Row extends object, Category extends KeysOfType<Row, string>>(
    options: ChartOptions<ChartLineProps<Row, Category>>,
  ): SlideBuilder;
  /** Add an area chart. */
  addAreaChart<Row extends object, Category extends KeysOfType<Row, string>>(
    options: ChartOptions<ChartAreaProps<Row, Category>>,
  ): SlideBuilder;
  /** Add a single-series pie chart. */
  addPieChart<Row extends object, Category extends KeysOfType<Row, string>>(
    options: ChartOptions<ChartPieProps<Row, Category>>,
  ): SlideBuilder;
  /** Add a single-series donut chart. */
  addDonutChart<Row extends object, Category extends KeysOfType<Row, string>>(
    options: ChartOptions<ChartDonutProps<Row, Category>>,
  ): SlideBuilder;
  /**
   * Place any declarative component tree (for example `Row({...})`) inside
   * an absolute frame.
   */
  add(node: PptxNode, placement: Placement): SlideBuilder;
}

/** Collects slides and generates the PPTX package. */
export interface PresentationBuilder {
  /** Append a slide and return its builder. */
  addSlide(options?: SlideOptions): SlideBuilder;
  /** Generate the PPTX file from the slides added so far. */
  generate(): Uint8Array;
}

function isStyledCell(
  cell: TableCellInput,
): cell is Exclude<TableCellInput, PptxChild> {
  return typeof cell === "object" && cell !== null && !Array.isArray(cell) &&
    "content" in cell;
}

function splitPlacement<Options extends Placement>(options: Options) {
  const { x, y, w, h, ...props } = options;
  return { placement: { x, y, w, h }, props };
}

class SlideBuilderImpl implements SlideBuilder {
  readonly #children: PptxNode[] = [];

  constructor(readonly options: SlideOptions) {}

  add(node: PptxNode, placement: Placement): SlideBuilder {
    this.#children.push(Positioned({ ...placement, children: node }));
    return this;
  }

  addText(text: PptxChild, options: TextOptions): SlideBuilder {
    const { placement, props } = splitPlacement(options);
    return this.add(Text({ ...props, children: text }), placement);
  }

  addTitle(text: PptxChild, options: TextOptions): SlideBuilder {
    const { placement, props } = splitPlacement(options);
    return this.add(Title({ ...props, children: text }), placement);
  }

  addShape(preset: PresetGeometry, options: ShapeOptions): SlideBuilder {
    const { placement, props: { text, ...props } } = splitPlacement(options);
    return this.add(Shape({ ...props, preset, children: text }), placement);
  }

  addImage(data: Uint8Array, options: ImageOptions): SlideBuilder {
    const { placement, props } = splitPlacement(options);
    return this.add(Image({ ...props, data }), placement);
  }

  addLine(options: LineOptions): SlideBuilder {
    const { from, to } = options;
    // A "line" preset runs from the frame's top-left to bottom-right corner;
    // flips point it from `from` to `to` in any direction.
    const line = Shape({
      preset: "line",
      name: options.name,
      flipH: to.x < from.x,
      flipV: to.y < from.y,
      style: {
        line: {
          width: emu(19050),
          fill: { kind: "solid", color: hex("000000") },
          ...options.line,
        },
      },
    });
    return this.add(line, {
      x: emu(Math.min(from.x, to.x)),
      y: emu(Math.min(from.y, to.y)),
      w: emu(Math.abs(to.x - from.x)),
      h: emu(Math.abs(to.y - from.y)),
    });
  }

  addTable(
    rows: ReadonlyArray<ReadonlyArray<TableCellInput>>,
    options: TableOptions,
  ): SlideBuilder {
    const { placement, props: { rowHeights, ...props } } = splitPlacement(
      options,
    );
    const heightOf = (index: number): Emu =>
      typeof rowHeights === "number"
        ? rowHeights
        : rowHeights?.[index] ?? emu(placement.h / rows.length);
    const tableRows = rows.map((cells, index) =>
      Table.Row({
        height: heightOf(index),
        children: cells.map((cell) => {
          if (!isStyledCell(cell)) return Table.Cell({ children: cell });
          const { content, ...cellProps } = cell;
          return Table.Cell({ ...cellProps, children: content });
        }),
      })
    );
    return this.add(Table({ ...props, children: tableRows }), placement);
  }

  addBarChart<Row extends object, Category extends KeysOfType<Row, string>>(
    options: ChartOptions<ChartBarProps<Row, Category>>,
  ): SlideBuilder {
    const { placement, props } = splitPlacement(options);
    return this.add(Chart.Bar(props), placement);
  }

  addLineChart<Row extends object, Category extends KeysOfType<Row, string>>(
    options: ChartOptions<ChartLineProps<Row, Category>>,
  ): SlideBuilder {
    const { placement, props } = splitPlacement(options);
    return this.add(Chart.Line(props), placement);
  }

  addAreaChart<Row extends object, Category extends KeysOfType<Row, string>>(
    options: ChartOptions<ChartAreaProps<Row, Category>>,
  ): SlideBuilder {
    const { placement, props } = splitPlacement(options);
    return this.add(Chart.Area(props), placement);
  }

  addPieChart<Row extends object, Category extends KeysOfType<Row, string>>(
    options: ChartOptions<ChartPieProps<Row, Category>>,
  ): SlideBuilder {
    const { placement, props } = splitPlacement(options);
    return this.add(Chart.Pie(props), placement);
  }

  addDonutChart<Row extends object, Category extends KeysOfType<Row, string>>(
    options: ChartOptions<ChartDonutProps<Row, Category>>,
  ): SlideBuilder {
    const { placement, props } = splitPlacement(options);
    return this.add(Chart.Donut(props), placement);
  }

  toElement(): SlideElement {
    return Slide({ ...this.options, children: this.#children });
  }
}

/**
 * Start an imperative presentation.
 *
 * @example
 * ```ts
 * import { clr, u } from "@pixel/pptx";
 * import { createPresentation } from "@pixel/pptx/imperative";
 *
 * const pres = createPresentation({ title: "Q2 review" });
 * pres.addSlide({ background: clr.hex("F7F4EE") })
 *   .addText("Hello, world!", {
 *     x: u.in(1),
 *     y: u.in(1),
 *     w: u.in(8),
 *     h: u.in(1),
 *     style: { fontSize: u.font(32), bold: true },
 *   });
 * const bytes: Uint8Array = pres.generate();
 * ```
 */
export function createPresentation(
  options: PresentationOptions = {},
): PresentationBuilder {
  const slides: SlideBuilderImpl[] = [];
  return {
    addSlide(slideOptions: SlideOptions = {}): SlideBuilder {
      const slide = new SlideBuilderImpl(slideOptions);
      slides.push(slide);
      return slide;
    },
    generate(): Uint8Array {
      return generate(
        Presentation({
          ...options,
          children: slides.map((slide) => slide.toElement()),
        }),
      );
    },
  };
}
