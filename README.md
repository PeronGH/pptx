# @pixel/pptx

Deno library for generating PPTX files with a declarative layout DSL that lowers
to absolute scene nodes and then to OOXML.

The public API keeps slide-building primitives at the root and groups helper
constructors into short namespaces:

- Root DSL: `presentation`, `slide`, `row`, `col`, `stack`, `align`, `item`
- Root leaves: `textbox`, `shape`, `image`, `table`, `tr`, `td`
- Scene escape hatch: `scene.*`
- Helper namespaces: `bg.*`, `fill.*`, `tx.*`, `sty.*`, `u.*`, `clr.*`
- Output: `generate()`

## Install

```bash
deno add @pixel/pptx
```

## Minimal Example

```ts
import {
  bg,
  clr,
  col,
  fill,
  generate,
  p,
  presentation,
  shape,
  slide,
  sty,
  textbox,
  tx,
  u,
} from "@pixel/pptx";

const styles = sty.create({
  hero: sty.box({ fill: fill.solid(clr.hex("1F4E79")) }),
  heroText: sty.text({
    fontSize: u.font(22),
    fontColor: clr.hex("FFFFFF"),
    bold: true,
  }),
  card: sty.box({ fill: fill.solid(clr.hex("FFFFFF")), inset: u.in(0.16) }),
});

const deck = presentation(
  { title: "Hello deck" },
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
      { padding: u.in(0.6), gap: u.in(0.3) },
      shape(
        "roundRect",
        { style: styles.hero },
        p(tx.bold("Quarterly Review", { style: styles.heroText })),
      ),
      textbox(
        { style: styles.card },
        p("This slide uses only the high-level DSL."),
        p("See the full polished example in examples/quarterly-review.ts."),
      ),
    ),
  ),
);

Deno.writeFileSync("hello.pptx", generate(deck));
```

## Showcase

Full source: [`examples/quarterly-review.ts`](./examples/quarterly-review.ts)

![Quarterly review slide](./assets/quarterly-review.webp)

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

## Validation

Run the full local checks before committing:

```bash
deno check mod.ts
deno lint
deno fmt --check
deno test
deno publish --dry-run
```
