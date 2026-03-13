# @pixel/pptx

Deno library for generating PPTX files with a JSX-first layout DSL that lowers
to layout, scene, and OOXML.

## Install

```bash
deno add @pixel/pptx
```

Configure Deno to use `@pixel/pptx` as the JSX import source:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pixel/pptx"
  }
}
```

## Minimal Example

```tsx
/** @jsxImportSource @pixel/pptx */

import {
  Align,
  clr,
  generate,
  Presentation,
  Slide,
  Text,
  TextBox,
  u,
} from "@pixel/pptx";

const styles = {
  hero: {
    fill: { kind: "solid", color: clr.hex("1F4E79") },
    verticalAlign: "middle",
    inset: u.in(0.18),
  },
  heroText: {
    fontSize: u.font(28),
    fontColor: clr.hex("FFFFFF"),
    bold: true,
  },
};

const deck = (
  <Presentation title="Hello deck">
    <Slide
      background={{
        kind: "fill",
        fill: { kind: "solid", color: clr.hex("F7F4EE") },
      }}
    >
      <Align x="center" y="center" w={u.in(6)} h={u.in(1.2)}>
        <TextBox style={styles.hero}>
          <Text.Span style={styles.heroText}>Hello, world!</Text.Span>
        </TextBox>
      </Align>
    </Slide>
  </Presentation>
);

Deno.writeFileSync("hello.pptx", generate(deck));
```

Preview rendered from [`examples/minimal.tsx`](./examples/minimal.tsx).

![Minimal example slide](./assets/minimal.webp)

## Showcase

Full source: [`examples/quarterly-review.tsx`](./examples/quarterly-review.tsx)

![Quarterly review slide](./assets/quarterly-review.webp)

## Public API

### Core exports

- `generate(<Presentation>...</Presentation>)`
- `u.*` for units: `in`, `cm`, `pt`, `emu`, `font`, `pct`
- `clr.hex(...)` for validated OOXML colors
- Inherited layout defaults through `presentation layout={...}` and
  `slide layout={...}`

### Structural JSX components

- `<Presentation>`
- `<Slide>`
- `<Row>`
- `<Row.Start>`
- `<Row.End>`
- `<Column>`
- `<Column.Start>`
- `<Column.End>`
- `<Stack>`
- `<Align>`
- `<Positioned>`

### Content JSX components

- `<TextBox>`
- `<Shape preset="...">`
- `<Image ... />`
- `<Table cols=[...]>`
- `<Table.Row height={...}>`
- `<Table.Cell>`
- `<Chart.Bar ... />`

### Text JSX components

- Raw string and number children create text directly
- `<Text.P>` creates an explicit paragraph
- `gap={...}` on `TextBox`, `Shape`, and `Table.Cell` inserts paragraph-block
  spacing
- Inline components: `<Text.Span>`, `<Text.Link href="...">`, `<Text.Bold>`,
  `<Text.Italic>`, `<Text.Underline>`

### Styling model

- Style props are plain typed objects, not special builder tokens
- `style` accepts either one style object or an array of style objects
- Later style entries win, with nested objects merged structurally
- Backgrounds, fills, lines, shadows, bullets, and image options are plain data

### Placement model

- `basis`, `grow`, `alignSelf`, `aspectRatio`, `w`, and `h` apply directly to
  children inside `<Row>` and `<Column>`
- `<Row.Start>/<Row.End>` and `<Column.Start>/<Column.End>` express split
  layouts without spacer or push props
- `<Positioned x y w h>` is the explicit parent-relative absolute placement
  wrapper
- `<Positioned>` children inside `<Row>` and `<Column>` do not consume flow
  space
- `<Align>` remains the explicit single-child alignment wrapper
- `presentation layout={...}` and `slide layout={...}` provide inherited
  defaults for slide padding, row/column gap, stack padding, and text gap

## Validation

Run the full local checks before committing:

```bash
deno check mod.ts
deno lint
deno fmt --check
deno test
deno publish --dry-run
```
