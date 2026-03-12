# @pixel/pptx

Deno library for generating PPTX files with a declarative layout DSL that lowers
to absolute scene nodes and then to OOXML.

The public API keeps slide-building primitives at the root and groups helper
constructors into short namespaces. Reusable styling is built around named,
typed style values created with `sty.create(...)`.

- Root DSL: `presentation`, `slide`, `row`, `col`, `stack`, `align`, `item`
- Root leaves: `textbox`, `shape`, `image`, `table`, `tr`, `td`
- Scene escape hatch: `scene.*`
- Helper namespaces: `bg.*`, `fill.*`, `tx.*`, `sty.*`, `u.*`, `clr.*`
- Output: `generate()`

## Install

```bash
deno add @pixel/pptx
```

```ts
import { generate, p, presentation, slide, textbox, tx, u } from "@pixel/pptx";
```

## Example

```ts
import {
  bg,
  clr,
  fill,
  generate,
  image,
  item,
  p,
  presentation,
  row,
  scene,
  slide,
  sty,
  table,
  td,
  textbox,
  tr,
  tx,
  u,
} from "@pixel/pptx";

const styles = sty.create({
  heroBar: sty.box({
    fill: fill.solid(clr.hex("1F4E79")),
    inset: {
      top: u.in(0.18),
      right: u.in(0.28),
      bottom: u.in(0.18),
      left: u.in(0.28),
    },
  }),
  heroTitle: sty.text({
    fontSize: u.font(24),
    fontColor: clr.hex("FFFFFF"),
    bold: true,
  }),
  heroSubtitle: sty.text({
    fontSize: u.font(11),
    fontColor: clr.hex("D9E7F5"),
  }),
  card: sty.box({
    fill: fill.solid(clr.hex("FFFFFF")),
    inset: u.in(0.14),
    shadow: sty.shadow({
      color: clr.hex("000000"),
      blur: u.emu(12000),
      distance: u.emu(4000),
      angle: 50,
      alpha: u.pct(18),
    }),
  }),
  cardTitle: sty.text({
    fontSize: u.font(14),
    fontColor: clr.hex("17324D"),
    bold: true,
  }),
  body: sty.text({
    fontSize: u.font(11),
    fontColor: clr.hex("32465A"),
  }),
  bullets: sty.para({
    bullet: sty.bullet.char("•"),
  }),
  metricHeadCell: sty.cell({
    fill: fill.solid(clr.hex("17324D")),
    padding: u.in(0.07),
    verticalAlign: "middle",
  }),
  metricCell: sty.cell({
    padding: u.in(0.07),
    verticalAlign: "middle",
  }),
  metricHeadText: sty.text({
    fontSize: u.font(11),
    fontColor: clr.hex("FFFFFF"),
    bold: true,
  }),
  metricText: sty.text({
    fontSize: u.font(11),
    fontColor: clr.hex("17324D"),
  }),
});

const deck = presentation(
  { title: "Quarterly Review" },
  slide(
    {
      background: bg.fill(
        fill.grad(
          90,
          fill.stop(u.pct(0), clr.hex("FFF8F1")),
          fill.stop(u.pct(100), clr.hex("F2F6FB")),
        ),
      ),
    },
    col(
      {
        padding: {
          top: u.in(0.55),
          right: u.in(0.55),
          bottom: u.in(0.6),
          left: u.in(0.55),
        },
        gap: u.in(0.35),
      },
      item(
        { h: u.in(1.25) },
        shape(
          "roundRect",
          { style: styles.heroBar },
          p(tx.bold("Quarterly Review", { style: styles.heroTitle })),
          p(tx.run("Q2 snapshot: growth is ahead of plan", {
            style: styles.heroSubtitle,
          })),
        ),
      ),
      item(
        { h: u.in(4.45) },
        row(
          { gap: u.in(0.3), align: "start" },
          item(
            { basis: u.in(3.05), h: u.in(4.45), alignSelf: "start" },
            stack(
              shape("roundRect", { style: styles.card }),
              align(
                {
                  x: "center",
                  y: "start",
                  padding: { top: u.in(0.2) },
                  w: u.in(2.75),
                  h: u.in(0.32),
                },
                textbox(
                  p(tx.bold("Chart preview", { style: styles.cardTitle })),
                ),
              ),
              align(
                { x: "center", y: "center", w: u.in(2.75), h: u.in(2.35) },
                image({
                  data: Deno.readFileSync("chart.png"),
                  contentType: "image/png",
                  description: "Chart preview",
                  fit: "cover",
                }),
              ),
              align(
                {
                  x: "center",
                  y: "end",
                  padding: { bottom: u.in(0.18) },
                  w: u.in(2.75),
                  h: u.in(0.48),
                },
                textbox(
                  p(tx.run("Pipeline and retention trend", {
                    style: styles.body,
                  })),
                ),
              ),
            ),
          ),
          item(
            { basis: u.in(2.3), h: u.in(4.45), alignSelf: "start" },
            stack(
              shape("roundRect", { style: styles.card }),
              align(
                {
                  x: "center",
                  y: "start",
                  padding: { top: u.in(0.2) },
                  w: u.in(1.98),
                  h: u.in(3.2),
                },
                table(
                  { cols: [u.in(1.15), u.in(0.85)] },
                  tr(
                    u.in(0.44),
                    td(
                      { style: styles.metricHeadCell },
                      p(tx.run("Metric", { style: styles.metricHeadText })),
                    ),
                    td(
                      { style: styles.metricHeadCell },
                      p(tx.run("Value", { style: styles.metricHeadText })),
                    ),
                  ),
                  tr(
                    u.in(0.44),
                    td(
                      { style: styles.metricCell },
                      p(tx.run("Revenue", { style: styles.metricText })),
                    ),
                    td(
                      { style: styles.metricCell },
                      p(tx.run("$1.2M", { style: styles.metricText })),
                    ),
                  ),
                  tr(
                    u.in(0.44),
                    td(
                      { style: styles.metricCell },
                      p(tx.run("Growth", { style: styles.metricText })),
                    ),
                    td(
                      { style: styles.metricCell },
                      p(tx.run("15%", { style: styles.metricText })),
                    ),
                  ),
                  tr(
                    u.in(0.44),
                    td(
                      { style: styles.metricCell },
                      p(tx.run("NPS", { style: styles.metricText })),
                    ),
                    td(
                      { style: styles.metricCell },
                      p(tx.run("61", { style: styles.metricText })),
                    ),
                  ),
                ),
              ),
            ),
          ),
          item(
            { basis: u.in(2.9), h: u.in(4.45), alignSelf: "start" },
            stack(
              shape("roundRect", { style: styles.card }),
              align(
                {
                  x: "center",
                  y: "start",
                  padding: { top: u.in(0.2) },
                  w: u.in(2.58),
                  h: u.in(3),
                },
                textbox(
                  p(tx.bold("Notes", { style: styles.cardTitle })),
                  p(
                    { style: styles.bullets },
                    tx.run("Highlights and next steps", { style: styles.body }),
                  ),
                  p(
                    { style: styles.bullets },
                    tx.run("Review pricing experiments", {
                      style: styles.body,
                    }),
                  ),
                  p(
                    { style: styles.bullets },
                    tx.run("Expand onboarding capacity", {
                      style: styles.body,
                    }),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  ),
);

Deno.writeFileSync("report.pptx", generate(deck));
```

## Public API

### Root builders

| Export                                   | Description                                         |
| ---------------------------------------- | --------------------------------------------------- |
| `generate(presentation)`                 | Generate a PPTX as `Uint8Array`                     |
| `presentation(options?, ...slides)`      | Create a presentation                               |
| `slide(props?, ...children)`             | Create a slide from layout roots and/or scene nodes |
| `p(options?, ...runs)`                   | Create a paragraph                                  |
| `row(props?, ...children)`               | Horizontal layout container                         |
| `col(props?, ...children)`               | Vertical layout container                           |
| `stack(props?, ...children)`             | Overlay container                                   |
| `align(props, child)`                    | Align a child within a frame                        |
| `item(props?, child)`                    | Layout wrapper for basis/grow/alignment             |
| `textbox(options?, ...paragraphs)`       | Positionless text box leaf                          |
| `shape(preset, options?, ...paragraphs)` | Positionless preset shape leaf                      |
| `image(props)`                           | Positionless image leaf                             |
| `table({ cols }, ...rows)`               | Positionless table leaf with proportional columns   |
| `tr(height, ...cells)`                   | Table row                                           |
| `td(options?, ...paragraphs)`            | Table cell                                          |
| `scene.textbox(...)`                     | Absolute-position text box                          |
| `scene.shape(...)`                       | Absolute-position shape                             |
| `scene.image(...)`                       | Absolute-position image                             |
| `scene.table(...)`                       | Absolute-position table                             |

### Helper namespaces

| Namespace    | Members                                                   |
| ------------ | --------------------------------------------------------- |
| `bg`         | `fill`, `image`                                           |
| `fill`       | `solid`, `grad`, `stop`, `none`                           |
| `tx`         | `run`, `bold`, `italic`, `bi`, `underline`, `link`        |
| `sty`        | `create`, `box`, `text`, `para`, `cell`, `line`, `shadow` |
| `sty.bullet` | `char`, `num`, `none`                                     |
| `u`          | `in`, `cm`, `pt`, `emu`, `pct`, `font`                    |
| `clr`        | `hex`                                                     |

### Layout props

- Container props: `gap`, `padding`, `justify`, `align`
- Item props: `basis`, `grow`, `w`, `h`, `alignSelf`, `aspectRatio`
- Align props: `x`, `y`, `padding`, `w`, `h`, `aspectRatio`

### Style/data model

- `slide()` accepts `background?: Background`
- `sty.create(...)` returns named reusable style values with category-safe
  typing
- Nodes and text accept styles explicitly through `style`
- `sty.box(...)` covers `fill`, `line`, `verticalAlign`, `inset`, `fit`,
  `shadow`
- `sty.cell(...)` covers `fill`, `line`, `padding`, `verticalAlign`
- `table({ cols })` preserves column proportions and fits them to the resolved
  table frame
- `image(...)` and `scene.image(...)` support `fit`, `crop`, `alpha`

Examples:

```ts
const styles = sty.create({
  card: sty.box({ fill: fill.solid(clr.hex("FFFFFF")) }),
  body: sty.text({ fontFamily: "Aptos" }),
  bullets: sty.para({ bullet: sty.bullet.char("•") }),
});

textbox({ style: styles.card }, p("Hello"));
p({ style: styles.bullets }, "One bullet");
tx.bold("Title", { style: styles.body });
scene.shape("rect", {
  x: u.in(1),
  y: u.in(1),
  w: u.in(2),
  h: u.in(1),
  style: styles.card,
});
```

### Value helpers

| Helper         | Description                                |
| -------------- | ------------------------------------------ |
| `u.in(n)`      | Convert inches to EMUs                     |
| `u.cm(n)`      | Convert centimeters to EMUs                |
| `u.pt(n)`      | Convert points to EMUs                     |
| `u.emu(n)`     | Raw EMU value                              |
| `u.pct(n)`     | Percentage in thousandths                  |
| `u.font(pts)`  | Font size in hundredths of a point         |
| `clr.hex(hex)` | Validate and normalize a 6-digit hex color |

## Validation

Run the full local checks before committing:

```bash
deno check mod.ts
deno lint
deno fmt --check
deno test
deno publish --dry-run
```
