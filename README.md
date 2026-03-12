# @pixel/pptx

Deno library for generating PPTX files. Declarative, typed, spec-compliant.

Outputs valid ECMA-376 Office Open XML packages that open in LibreOffice Impress
and round-trip through python-pptx.

## Install

```ts
import {
  bold,
  generate,
  inches,
  p,
  presentation,
  slide,
  textbox,
} from "jsr:@pixel/pptx";
```

## Example

```ts
import {
  bold,
  generate,
  hexColor,
  image,
  inches,
  link,
  p,
  presentation,
  shape,
  slide,
  solidFill,
  table,
  td,
  textbox,
  tr,
} from "@pixel/pptx";

const pptx = generate(presentation(
  { title: "Quarterly Report" },
  // Title slide
  slide(
    textbox(
      { x: inches(1), y: inches(2), w: inches(8), h: inches(2) },
      p({ align: "center" }, bold("Quarterly Report")),
    ),
  ),
  // Content slide with table and link
  slide(
    table(
      {
        x: inches(1),
        y: inches(1),
        w: inches(6),
        h: inches(2),
        cols: [inches(3), inches(3)],
      },
      tr(
        inches(0.5),
        td({ fill: solidFill(hexColor("4472C4")) }, p(bold("Metric"))),
        td({ fill: solidFill(hexColor("4472C4")) }, p(bold("Value"))),
      ),
      tr(inches(0.5), td("Revenue"), td("$1.2M")),
      tr(inches(0.5), td("Growth"), td("15%")),
    ),
    textbox(
      { x: inches(1), y: inches(4), w: inches(8), h: inches(1) },
      p("Details at ", link("example.com", "https://example.com")),
    ),
  ),
  // Image slide
  slide(
    shape("rect", {
      x: inches(1),
      y: inches(1),
      w: inches(3),
      h: inches(2),
      fill: solidFill(hexColor("FF0000")),
    }),
    image({
      x: inches(5),
      y: inches(1),
      w: inches(4),
      h: inches(3),
      data: Deno.readFileSync("photo.png"),
      contentType: "image/png",
    }),
  ),
));

Deno.writeFileSync("report.pptx", pptx);
```

## API

### Structure

| Function                            | Description                   |
| ----------------------------------- | ----------------------------- |
| `presentation(options?, ...slides)` | Create a presentation         |
| `slide(...elements)`                | Create a slide                |
| `generate(presentation)`            | Generate PPTX as `Uint8Array` |

### Elements

| Function                              | Description                                               |
| ------------------------------------- | --------------------------------------------------------- |
| `textbox(props, ...paragraphs)`       | Text box. Strings auto-coerce to paragraphs               |
| `shape(preset, props, ...paragraphs)` | Preset shape (`"rect"`, `"ellipse"`, `"roundRect"`, etc.) |
| `image(props)`                        | Embedded image (PNG, JPEG, GIF, BMP, TIFF, SVG)           |
| `table(props, ...rows)`               | Table                                                     |
| `tr(height, ...cells)`                | Table row                                                 |
| `td(props?, ...paragraphs)`           | Table cell. Strings auto-coerce to paragraphs             |

### Text

| Function                      | Description                                 |
| ----------------------------- | ------------------------------------------- |
| `p(props?, ...runs)`          | Paragraph. Strings auto-coerce to text runs |
| `text(content, style?)`       | Plain text run                              |
| `bold(content, style?)`       | Bold text run                               |
| `italic(content, style?)`     | Italic text run                             |
| `boldItalic(content, style?)` | Bold + italic text run                      |
| `underline(content, style?)`  | Underlined text run                         |
| `link(content, url, style?)`  | Hyperlinked text run                        |

### Styling

| Function                       | Description               |
| ------------------------------ | ------------------------- |
| `solidFill(color, alpha?)`     | Solid color fill          |
| `noFill()`                     | No fill                   |
| `lineStyle({ width?, fill? })` | Line/border style         |
| `bulletChar(char)`             | Character bullet          |
| `bulletAutoNum(type)`          | Auto-numbered bullet      |
| `bulletNone()`                 | Suppress inherited bullet |

### Units

All positions and sizes are in EMUs internally. Use these helpers:

| Function        | Description                         |
| --------------- | ----------------------------------- |
| `inches(n)`     | Convert inches to EMUs              |
| `cm(n)`         | Convert centimeters to EMUs         |
| `pt(n)`         | Convert points to EMUs              |
| `emu(n)`        | Raw EMU value                       |
| `fontSize(pts)` | Font size in hundredths of a point  |
| `hexColor(hex)` | 6-digit hex color (e.g. `"FF0000"`) |
| `percentage(n)` | Percentage in thousandths           |

### Props reference

**Position** (required on all elements): `{ x, y, w, h }` — all `Emu` values.

**TextBoxProps / ShapeProps**: `{ x, y, w, h, fill?, line?, verticalAlign? }`

**ImageProps**: `{ x, y, w, h, data, contentType, description? }`

**TableProps**: `{ x, y, w, h, cols }` — `cols` is column widths as `Emu[]`

**ParagraphProps**: `{ align?, level?, bullet?, spacing? }`

**CellProps**: `{ fill? }`

**PresentationOptions**: `{ title?, creator?, slideWidth?, slideHeight? }`

## Feature support

| Feature                          | Status |
| -------------------------------- | ------ |
| Text boxes with rich text        | ✓      |
| Bold, italic, underline          | ✓      |
| Font size, color, family         | ✓      |
| Paragraph alignment              | ✓      |
| Paragraph levels (indent)        | ✓      |
| Bullet lists (char, auto-num)    | ✓      |
| Paragraph spacing                | ✓      |
| Preset shapes                    | ✓      |
| Shape/textbox fill (solid, none) | ✓      |
| Shape/textbox line/border        | ✓      |
| Semi-transparent fills           | ✓      |
| Vertical text alignment          | ✓      |
| Embedded images                  | ✓      |
| Tables with cell styling         | ✓      |
| Hyperlinks                       | ✓      |
| Custom slide dimensions          | ✓      |
| Multiple slides                  | ✓      |
| Gradients                        | ✗      |
| Charts                           | ✗      |
| Animations/transitions           | ✗      |
| Slide masters/layouts            | ✗      |
| Speaker notes                    | ✗      |

## License

MIT
