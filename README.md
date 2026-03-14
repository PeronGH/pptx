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
  u,
} from "@pixel/pptx";

const heroStyle = {
  fill: { kind: "solid", color: clr.hex("1F4E79") },
  verticalAlign: "middle",
  padding: u.in(0.18),
  fontSize: u.font(28),
  fontColor: clr.hex("FFFFFF"),
  bold: true,
};

const deck = (
  <Presentation title="Hello deck">
    <Slide background={{ kind: "solid", color: clr.hex("F7F4EE") }}>
      <Align x="center" y="center" w={u.in(6)} h={u.in(1.2)}>
        <Text.P style={heroStyle}>Hello, world!</Text.P>
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

- `<Text>` — multi-paragraph text body (`gap` for paragraph spacing)
- `<Text.P>` — single paragraph; auto-creates a text body at the top level
- `<Shape preset="...">`
- `<Image ... />`
- `<Table cols=[...]>`
- `<Table.Row height={...}>`
- `<Table.Cell>`
- `<Chart.Bar ... />`
- `<Chart.Line ... />`
- `<Chart.Pie ... />`
- `<Chart.Donut ... />`

### Text JSX components

- Raw string and number children create text directly inside `<Text.P>`
- `<Text.Span>` is optional — bare strings inside `<Text.P>` work directly
- `gap={...}` on `<Text>`, `<Shape>`, and `<Table.Cell>` inserts paragraph-block
  spacing
- Inline components: `<Text.Span>`, `<Text.Link href="...">`, `<Text.Bold>`,
  `<Text.Italic>`, `<Text.Underline>`

### Styling model

- Style props are plain typed objects, not special builder tokens
- `style` accepts either one style object or an array of style objects
- Later style entries win, with nested objects merged structurally
- Backgrounds, fills, lines, shadows, bullets, and image options are plain data
- Charts use `data`, `category`, and `series=[...]`, with one or more series for
  bar/line and exactly one series for pie/donut

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
