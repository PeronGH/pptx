# @pixel/pptx

Deno library for generating PPTX files with a layout DSL that lowers to
absolute-positioned scene nodes and then to OOXML.

The public surface is split into:

- A **DSL layer** for composition: `row()`, `col()`, `item()`, `textbox()`,
  `shape()`, `image()`, `table()`
- A **scene escape hatch** for precise placement: `scene.textbox()`,
  `scene.shape()`, `scene.image()`, `scene.table()`
- A single `generate()` step that writes a valid PPTX package

## Install

```ts
import {
  generate,
  item,
  p,
  presentation,
  row,
  slide,
  textbox,
} from "jsr:@pixel/pptx";
```

## Example

```ts
import {
  bold,
  boxStyle,
  generate,
  hexColor,
  image,
  inches,
  item,
  p,
  presentation,
  row,
  scene,
  slide,
  solidFill,
  table,
  td,
  textbox,
  tr,
} from "jsr:@pixel/pptx";

const deck = presentation(
  { title: "Quarterly Review" },
  slide(
    scene.shape(
      "rect",
      {
        x: inches(0.5),
        y: inches(0.5),
        w: inches(9),
        h: inches(1.1),
        fill: solidFill(hexColor("1F4E79")),
      },
      p({ align: "center" }, bold("Quarterly Review")),
    ),
    row(
      { gap: inches(0.25), padding: inches(1) },
      item(
        { basis: inches(2.5) },
        image({
          data: Deno.readFileSync("chart.png"),
          contentType: "image/png",
          description: "Chart preview",
        }),
      ),
      item(
        { grow: 1 },
        table(
          { cols: [inches(2.5), inches(2.5)] },
          tr(inches(0.5), td("Revenue"), td("$1.2M")),
          tr(inches(0.5), td("Growth"), td("15%")),
        ),
      ),
      item(
        { basis: inches(2.5) },
        textbox(
          boxStyle({ fill: solidFill(hexColor("F3F6FA")) }),
          p(bold("Notes")),
          p("Highlights and next steps"),
        ),
      ),
    ),
  ),
);

Deno.writeFileSync("report.pptx", generate(deck));
```

## API

### Structure

| Function                            | Description                                         |
| ----------------------------------- | --------------------------------------------------- |
| `presentation(options?, ...slides)` | Create a presentation                               |
| `slide(...children)`                | Create a slide from layout roots and/or scene nodes |
| `generate(presentation)`            | Generate PPTX as `Uint8Array`                       |

### Layout DSL

| Function                   | Description                                                 |
| -------------------------- | ----------------------------------------------------------- |
| `row(props?, ...children)` | Horizontal flex-like container                              |
| `col(props?, ...children)` | Vertical flex-like container                                |
| `item(props?, child)`      | Child layout wrapper for `grow`, `basis`, `alignSelf`, etc. |

Container props:

- `gap?: Emu`
- `padding?: Emu | { top?, right?, bottom?, left? }`
- `justify?: "start" | "center" | "end" | "space-between"`
- `align?: "start" | "center" | "end" | "stretch"`

Item props:

- `basis?: Emu`
- `grow?: number`
- `w?: Emu`
- `h?: Emu`
- `alignSelf?: "start" | "center" | "end" | "stretch"`
- `aspectRatio?: number`

### Positionless leaves

| Function                                     | Description                    |
| -------------------------------------------- | ------------------------------ |
| `textbox(style?, ...paragraphs)`             | Positionless text box leaf     |
| `shape(preset, style?, ...paragraphs)`       | Positionless preset shape leaf |
| `image({ data, contentType, description? })` | Positionless image leaf        |
| `table({ cols }, ...rows)`                   | Positionless table leaf        |
| `tr(height, ...cells)`                       | Table row                      |
| `td(style?, ...paragraphs)`                  | Table cell                     |

### Scene escape hatch

| Function                                                       | Description       |
| -------------------------------------------------------------- | ----------------- |
| `scene.textbox({ x, y, w, h, ...style }, ...paragraphs)`       | Absolute text box |
| `scene.shape(preset, { x, y, w, h, ...style }, ...paragraphs)` | Absolute shape    |
| `scene.image({ x, y, w, h, data, contentType, description? })` | Absolute image    |
| `scene.table({ x, y, w, h, cols }, ...rows)`                   | Absolute table    |

Use `scene.*` when you need exact placement or when the layout DSL is not the
right abstraction for a slide.

### Text

| Function                      | Description            |
| ----------------------------- | ---------------------- |
| `p(style?, ...runs)`          | Paragraph              |
| `text(content, style?)`       | Plain text run         |
| `bold(content, style?)`       | Bold text run          |
| `italic(content, style?)`     | Italic text run        |
| `boldItalic(content, style?)` | Bold + italic text run |
| `underline(content, style?)`  | Underlined text run    |
| `link(content, url, style?)`  | Hyperlinked text run   |

### Composable styles

| Function                    | Description                      |
| --------------------------- | -------------------------------- |
| `boxStyle(...)`             | Box/textbox/shape style fragment |
| `textStyle(...)`            | Text-run style fragment          |
| `paragraphStyle(...)`       | Paragraph style fragment         |
| `cellStyle(...)`            | Table-cell style fragment        |
| `mergeBoxStyles(...)`       | Merge box style fragments        |
| `mergeTextStyles(...)`      | Merge text style fragments       |
| `mergeParagraphStyles(...)` | Merge paragraph style fragments  |
| `mergeCellStyles(...)`      | Merge cell style fragments       |

Supporting style/value helpers:

- `solidFill(color, alpha?)`
- `noFill()`
- `lineStyle({ width?, fill? })`
- `bulletChar(char)`
- `bulletAutoNum(type)`
- `bulletNone()`

### Units

| Function        | Description                        |
| --------------- | ---------------------------------- |
| `inches(n)`     | Convert inches to EMUs             |
| `cm(n)`         | Convert centimeters to EMUs        |
| `pt(n)`         | Convert points to EMUs             |
| `emu(n)`        | Raw EMU value                      |
| `fontSize(pts)` | Font size in hundredths of a point |
| `hexColor(hex)` | 6-digit hex color                  |
| `percentage(n)` | Percentage in thousandths          |

## Feature support

| Feature                                       | Status |
| --------------------------------------------- | ------ |
| Positionless DSL leaves                       | ✓      |
| Row/column/item layout DSL                    | ✓      |
| Typed scene escape hatch                      | ✓      |
| Text boxes with rich text                     | ✓      |
| Bold, italic, underline                       | ✓      |
| Font size, color, family                      | ✓      |
| Paragraph alignment, levels, bullets, spacing | ✓      |
| Preset shapes                                 | ✓      |
| Shape/textbox fill and line styling           | ✓      |
| Vertical text alignment                       | ✓      |
| Embedded images                               | ✓      |
| Tables with cell fill styling                 | ✓      |
| Hyperlinks                                    | ✓      |
| Custom slide dimensions                       | ✓      |
| Multiple slides                               | ✓      |
| Slide backgrounds                             | ✗      |
| Explicit image fit/crop modes                 | ✗      |
| Explicit text fit modes                       | ✗      |
| Gradients/effects                             | ✗      |
| Charts                                        | ✗      |
| Animations/transitions                        | ✗      |
| Slide masters/layouts                         | ✗      |
| Speaker notes                                 | ✗      |

## License

MIT
