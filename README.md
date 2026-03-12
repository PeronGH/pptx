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
  }),
  noteCard: sty.box({
    fill: fill.solid(clr.hex("F3F6FA")),
    inset: u.in(0.12),
  }),
  title: sty.text({
    fontSize: u.font(20),
    bold: true,
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
    scene.shape(
      "rect",
      {
        x: u.in(0.5),
        y: u.in(0.5),
        w: u.in(9),
        h: u.in(1.1),
        style: styles.heroBar,
      },
    ),
    row(
      { gap: u.in(0.25), padding: u.in(1) },
      item(
        { basis: u.in(2.5) },
        image({
          data: Deno.readFileSync("chart.png"),
          contentType: "image/png",
          description: "Chart preview",
        }),
      ),
      item(
        { grow: 1 },
        table(
          { cols: [u.in(2.5), u.in(2.5)] },
          tr(u.in(0.5), td("Revenue"), td("$1.2M")),
          tr(u.in(0.5), td("Growth"), td("15%")),
        ),
      ),
      item(
        { basis: u.in(2.5) },
        textbox(
          { style: styles.noteCard },
          p(tx.bold("Notes", { style: styles.title })),
          p("Highlights and next steps"),
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
| `table({ cols }, ...rows)`               | Positionless table leaf                             |
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
