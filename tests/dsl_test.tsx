/** @jsxImportSource @pixel/pptx */

import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import { assertThrows } from "@std/assert/throws";
import {
  Chart,
  clr,
  Column,
  generate,
  Positioned,
  Presentation,
  Row,
  Shape,
  Slide,
  Table,
  Text,
  u,
} from "../mod.ts";
import { resolveSlideChildren } from "../src/layout.ts";
import { normalizePresentation } from "../src/normalize.ts";
import type { SceneNode } from "../src/scene.ts";

type SceneTextBox = Extract<SceneNode, { readonly kind: "textbox" }>;
import { extractZipText } from "./helpers.ts";

function isSceneTextBox(node: unknown): node is SceneTextBox {
  return typeof node === "object" && node !== null && "kind" in node &&
    node.kind === "textbox" && "paragraphs" in node;
}

function sceneText(node: unknown): string {
  if (!isSceneTextBox(node)) return "";
  return node.paragraphs.flatMap((paragraph) => paragraph.runs).map((run) =>
    run.text
  ).join("");
}

Deno.test("unit helpers convert correctly", () => {
  assertEquals(Number(u.in(1)), 914400);
  assertEquals(Number(u.cm(2.54)), 914400);
  assertEquals(Number(u.pt(72)), 914400);
  assertEquals(Number(u.font(12)), 1200);
  assertEquals(Number(u.pct(50)), 50000);
});

Deno.test("unit helpers round to the integer units OOXML requires", () => {
  assertEquals(Number(u.font(10.333)), 1033);
  assertEquals(Number(u.pct(12.3456)), 12346);
  assertEquals(Number(u.emu(0.5)), 1);
  assertEquals(Number(u.in(1 / 3)), 304800);
  assertThrows(() => u.in(NaN), Error, "finite");
  assertThrows(() => u.font(Infinity), Error, "finite");
});

Deno.test("clr.hex validates and normalizes colors", () => {
  assertEquals(String(clr.hex("ff0000")), "FF0000");
  assertThrows(() => clr.hex("#FF0000"), Error);
});

Deno.test("inline children normalize into one implicit paragraph", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <Text.P>
          Hello <Text.Bold>bold</Text.Bold>{" "}
          <Text.Link href="https://example.com">link</Text.Link>
        </Text.P>
      </Slide>
    </Presentation>,
  );

  const textbox = presentation.slides[0]?.children[0];
  assert(textbox && textbox.kind === "textbox");
  assertEquals(textbox.paragraphs.length, 1);
  assertEquals(textbox.paragraphs[0]?.runs.length, 4);
  assertEquals(textbox.paragraphs[0]?.runs[1]?.style?.bold, true);
  assertEquals(
    textbox.paragraphs[0]?.runs[3]?.hyperlink,
    "https://example.com",
  );
});

Deno.test("text gap applies paragraph spacing between paragraph blocks", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <Text gap={u.in(0.2)}>
          <Text.P>Alpha</Text.P>
          <Text.P>Beta</Text.P>
        </Text>
      </Slide>
    </Presentation>,
  );

  const textbox = presentation.slides[0]?.children[0];
  assert(textbox && textbox.kind === "textbox");
  assertEquals(textbox.paragraphs.length, 2);
  assertEquals(textbox.paragraphs[1]?.style?.spacing?.before, u.in(0.2));
});

Deno.test("presentation layout defaults propagate to slides, rows, and text blocks", () => {
  const presentation = normalizePresentation(
    <Presentation
      layout={{
        slidePadding: u.in(1),
        rowGap: u.in(0.25),
        textGap: u.in(0.1),
      }}
    >
      <Slide>
        <Column>
          <Text h={u.in(1)}>
            <Text.P>Alpha</Text.P>
            <Text.P>Beta</Text.P>
          </Text>
          <Row h={u.in(1.5)}>
            <Text.P basis={u.in(1)}>A</Text.P>
            <Text.P basis={u.in(1)}>B</Text.P>
          </Row>
        </Column>
      </Slide>
    </Presentation>,
  );

  const slide = presentation.slides[0];
  assertEquals(slide?.props.contentPadding, u.in(1));

  const column = slide?.children[0];
  assert(column && column.kind === "col");

  const textbox = column.children[0];
  assert(
    textbox && textbox.kind === "item" && textbox.child.kind === "textbox",
  );
  assertEquals(textbox.child.paragraphs[1]?.style?.spacing?.before, u.in(0.1));

  const row = column.children[1];
  assert(row && row.kind === "item" && row.child.kind === "row");
  assertEquals(row.child.gap, u.in(0.25));
});

Deno.test("Row.End consumes remaining space before the trailing group", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <Row>
          <Row.Start>
            <Text.P basis={u.in(2)}>Left</Text.P>
          </Row.Start>
          <Row.End>
            <Text.P basis={u.in(2)}>Right</Text.P>
          </Row.End>
        </Row>
      </Slide>
    </Presentation>,
  );

  const scenes = resolveSlideChildren(presentation.slides[0]?.children ?? [], {
    x: u.emu(0),
    y: u.emu(0),
    w: u.in(10),
    h: u.in(7.5),
  });

  assertEquals(scenes.length, 2);
  assertEquals(sceneText(scenes[0]), "Left");
  assertEquals(sceneText(scenes[1]), "Right");
  assertEquals(scenes[1]?.x, u.in(8));
});

Deno.test("Column.End consumes remaining space before the trailing group", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <Column>
          <Column.Start>
            <Text.P h={u.in(2)}>Top</Text.P>
          </Column.Start>
          <Column.End>
            <Text.P h={u.in(2)}>Bottom</Text.P>
          </Column.End>
        </Column>
      </Slide>
    </Presentation>,
  );

  const scenes = resolveSlideChildren(presentation.slides[0]?.children ?? [], {
    x: u.emu(0),
    y: u.emu(0),
    w: u.in(10),
    h: u.in(7.5),
  });

  assertEquals(scenes.length, 2);
  assertEquals(sceneText(scenes[0]), "Top");
  assertEquals(sceneText(scenes[1]), "Bottom");
  assertEquals(scenes[1]?.y, u.in(5.5));
});

Deno.test("generated slide geometry keeps flex math in integer EMUs", () => {
  const pptx = generate(
    <Presentation>
      <Slide>
        <Row>
          <Shape preset="rect" grow={3.05} />
          <Shape preset="rect" grow={2.3} />
          <Shape preset="rect" grow={2.9} />
        </Row>
      </Slide>
    </Presentation>,
  );

  const slideXml = extractZipText(pptx, "ppt/slides/slide1.xml");
  assertEquals(
    /\b(?:x|y|cx|cy)="\d+\.\d+"/.test(slideXml),
    false,
  );
});

Deno.test("style arrays merge left to right", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <Text.P
          style={[
            {
              fill: { kind: "solid", color: clr.hex("FFEECC") },
              padding: u.in(0.1),
            },
            {
              line: { width: u.emu(12700), dash: "dash" },
              fit: "resize-shape",
            },
          ]}
        >
          Hello
        </Text.P>
      </Slide>
    </Presentation>,
  );

  const textbox = presentation.slides[0]?.children[0];
  assert(textbox && textbox.kind === "textbox");
  assertEquals(textbox.style?.fill?.kind, "solid");
  assertEquals(textbox.style?.line?.dash, "dash");
  assertEquals(textbox.style?.fit, "resize-shape");
  assertEquals(textbox.style?.padding, u.in(0.1));
});

Deno.test("positioned children in a row resolve without consuming flow space", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <Row>
          <Text.P basis={u.in(2)}>Left</Text.P>
          <Positioned x={u.in(1)} y={u.in(0.5)} w={u.in(1)} h={u.in(0.5)}>
            <Text.P>Overlay</Text.P>
          </Positioned>
          <Text.P basis={u.in(2)}>Right</Text.P>
        </Row>
      </Slide>
    </Presentation>,
  );

  const scenes = resolveSlideChildren(presentation.slides[0]?.children ?? [], {
    x: u.emu(0),
    y: u.emu(0),
    w: u.in(10),
    h: u.in(7.5),
  });

  assertEquals(scenes.length, 3);
  assertEquals(sceneText(scenes[0]), "Left");
  assertEquals(sceneText(scenes[1]), "Overlay");
  assertEquals(sceneText(scenes[2]), "Right");
  const overlay = scenes[1];
  assert(overlay);
  assertEquals(overlay.x, u.in(1));
});

Deno.test("row slot groups reject mixed direct flow children", () => {
  assertThrows(
    () =>
      generate(
        <Presentation>
          <Slide>
            <Row>
              <Text.P basis={u.in(2)}>Left</Text.P>
              <Row.End>
                <Text.P basis={u.in(2)}>Right</Text.P>
              </Row.End>
            </Row>
          </Slide>
        </Presentation>,
      ),
    Error,
    "cannot mix direct flow children with slot groups",
  );
});

Deno.test("Chart.Bar component normalizes a bar chart leaf", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <Chart.Bar
          data={[
            { quarter: "Q1", amount: 12 },
            { quarter: "Q2", amount: 18 },
          ]}
          category="quarter"
          title="Pipeline"
          labels
          series={[
            {
              name: "Pipeline",
              value: "amount",
            },
          ]}
        />
      </Slide>
    </Presentation>,
  );

  const chart = presentation.slides[0]?.children[0];
  assert(chart && chart.kind === "chart");
  assertEquals(chart.type, "bar");
  assertEquals(chart.categories[0], "Q1");
  assertEquals(chart.series[0]?.values[1], 18);
});

Deno.test("Chart.Line component normalizes a multi-series line chart leaf", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <Chart.Line
          data={[
            { quarter: "Q1", pipeline: 12, closed: 8 },
            { quarter: "Q2", pipeline: 18, closed: 11 },
          ]}
          category="quarter"
          markers
          series={[
            { name: "Pipeline", value: "pipeline" },
            { name: "Closed", value: "closed" },
          ]}
          valueAxis={{ title: "Value", min: 0, max: 20 }}
        />
      </Slide>
    </Presentation>,
  );

  const chart = presentation.slides[0]?.children[0];
  assert(chart && chart.kind === "chart");
  assertEquals(chart.type, "line");
  if (chart.type !== "line") {
    throw new Error("Expected a line chart");
  }
  assertEquals(chart.series.length, 2);
  assertEquals(chart.series[1]?.values[1], 11);
  assertEquals(chart.markers, true);
});

Deno.test("Chart.Pie and Chart.Donut normalize circular chart leaves", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <Chart.Pie
          data={[
            { segment: "New", value: 12 },
            { segment: "Expansion", value: 8 },
          ]}
          category="segment"
          labels
          series={[{ name: "Revenue", value: "value" }]}
        />
        <Chart.Donut
          data={[
            { segment: "Won", value: 9 },
            { segment: "Open", value: 3 },
          ]}
          category="segment"
          holeSize={60}
          series={[{ name: "Deals", value: "value" }]}
        />
      </Slide>
    </Presentation>,
  );

  const pie = presentation.slides[0]?.children[0];
  const donut = presentation.slides[0]?.children[1];
  assert(pie && pie.kind === "chart");
  assert(donut && donut.kind === "chart");
  assertEquals(pie.type, "pie");
  assertEquals(donut.type, "donut");
  if (donut.type !== "donut") {
    throw new Error("Expected a donut chart");
  }
  assertEquals(donut.holeSize, 60);
});

Deno.test("generated chart XML includes line, pie, and doughnut parts", () => {
  const pptx = generate(
    <Presentation>
      <Slide>
        <Chart.Line
          data={[
            { quarter: "Q1", pipeline: 12, closed: 8 },
            { quarter: "Q2", pipeline: 18, closed: 11 },
          ]}
          category="quarter"
          series={[
            { name: "Pipeline", value: "pipeline" },
            { name: "Closed", value: "closed" },
          ]}
        />
        <Chart.Pie
          data={[
            { segment: "New", value: 12 },
            { segment: "Expansion", value: 8 },
          ]}
          category="segment"
          series={[{ name: "Revenue", value: "value" }]}
        />
        <Chart.Donut
          data={[
            { segment: "Won", value: 9 },
            { segment: "Open", value: 3 },
          ]}
          category="segment"
          holeSize={60}
          series={[{ name: "Deals", value: "value" }]}
        />
      </Slide>
    </Presentation>,
  );

  assert(extractZipText(pptx, "ppt/charts/chart1.xml").includes("c:lineChart"));
  assert(extractZipText(pptx, "ppt/charts/chart2.xml").includes("c:pieChart"));
  assert(
    extractZipText(pptx, "ppt/charts/chart3.xml").includes("c:doughnutChart"),
  );
});

Deno.test("Chart.Donut validates holeSize range", () => {
  assertThrows(
    () =>
      normalizePresentation(
        <Presentation>
          <Slide>
            <Chart.Donut
              data={[
                { segment: "Won", value: 9 },
                { segment: "Open", value: 3 },
              ]}
              category="segment"
              holeSize={91}
              series={[{ name: "Deals", value: "value" }]}
            />
          </Slide>
        </Presentation>,
      ),
    Error,
    "holeSize",
  );
  assertThrows(
    () =>
      normalizePresentation(
        <Presentation>
          <Slide>
            <Chart.Donut
              data={[{ segment: "Won", value: 9 }]}
              category="segment"
              holeSize={9}
              series={[{ name: "Deals", value: "value" }]}
            />
          </Slide>
        </Presentation>,
      ),
    Error,
    "10 to 90",
  );
});

Deno.test("charts reject non-finite values and axis bounds", () => {
  assertThrows(
    () =>
      normalizePresentation(
        <Presentation>
          <Slide>
            <Chart.Bar
              data={[{ c: "A", v: NaN }]}
              category="c"
              series={[{ name: "S", value: "v" }]}
            />
          </Slide>
        </Presentation>,
      ),
    Error,
    "non-finite",
  );
  assertThrows(
    () =>
      normalizePresentation(
        <Presentation>
          <Slide>
            <Chart.Line
              data={[{ c: "A", v: 1 }]}
              category="c"
              valueAxis={{ max: Infinity }}
              series={[{ name: "S", value: "v" }]}
            />
          </Slide>
        </Presentation>,
      ),
    Error,
    "valueAxis.max",
  );
});

Deno.test("tables reject missing rows and ragged rows", () => {
  assertThrows(
    () =>
      normalizePresentation(
        <Presentation>
          <Slide>
            <Table cols={[u.in(1)]} />
          </Slide>
        </Presentation>,
      ),
    Error,
    "at least one row",
  );
  assertThrows(
    () =>
      normalizePresentation(
        <Presentation>
          <Slide>
            <Table cols={[u.in(1), u.in(1)]}>
              <Table.Row height={u.in(0.4)}>
                <Table.Cell>only one</Table.Cell>
              </Table.Row>
            </Table>
          </Slide>
        </Presentation>,
      ),
    Error,
    "has 1 cells but the table has 2 columns",
  );
});

Deno.test("unified style on Text.P splits into box, paragraph, and text parts", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <Text.P
          style={{
            fill: { kind: "solid", color: clr.hex("AABBCC") },
            align: "center",
            bold: true,
            fontSize: u.font(18),
          }}
        >
          Styled
        </Text.P>
      </Slide>
    </Presentation>,
  );

  const textbox = presentation.slides[0]?.children[0];
  assert(textbox && textbox.kind === "textbox");
  // Box part
  assertEquals(textbox.style?.fill?.kind, "solid");
  // Paragraph part
  assertEquals(textbox.paragraphs[0]?.style?.align, "center");
  // Text part applied to bare string run
  assertEquals(textbox.paragraphs[0]?.runs[0]?.style?.bold, true);
  assertEquals(textbox.paragraphs[0]?.runs[0]?.style?.fontSize, u.font(18));
});

Deno.test("Text propagates text style defaults to child paragraphs", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <Text style={{ fontSize: u.font(14), fontColor: clr.hex("333333") }}>
          <Text.P>Inherits defaults</Text.P>
          <Text.P style={{ bold: true }}>Also inherits, plus bold</Text.P>
        </Text>
      </Slide>
    </Presentation>,
  );

  const textbox = presentation.slides[0]?.children[0];
  assert(textbox && textbox.kind === "textbox");
  // First paragraph inherits text defaults
  const run0 = textbox.paragraphs[0]?.runs[0];
  assertEquals(run0?.style?.fontSize, u.font(14));
  assertEquals(run0?.style?.fontColor, clr.hex("333333"));
  // Second paragraph merges its own bold with inherited defaults
  const run1 = textbox.paragraphs[1]?.runs[0];
  assertEquals(run1?.style?.bold, true);
  assertEquals(run1?.style?.fontSize, u.font(14));
});

Deno.test("Shape propagates text style defaults to children", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <Shape
          preset="roundRect"
          style={{
            fill: { kind: "solid", color: clr.hex("17324D") },
            fontColor: clr.hex("FFFFFF"),
            bold: true,
          }}
        >
          <Text.P>Inherits white bold</Text.P>
        </Shape>
      </Slide>
    </Presentation>,
  );

  const shape = presentation.slides[0]?.children[0];
  assert(shape && shape.kind === "shape");
  assertEquals(shape.style?.fill?.kind, "solid");
  const run = shape.paragraphs[0]?.runs[0];
  assertEquals(run?.style?.fontColor, clr.hex("FFFFFF"));
  assertEquals(run?.style?.bold, true);
});

Deno.test("Table.Cell propagates text style defaults to children", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <Table cols={[u.in(5)]}>
          <Table.Row height={u.in(1)}>
            <Table.Cell
              style={{
                fill: { kind: "solid", color: clr.hex("17324D") },
                fontColor: clr.hex("FFFFFF"),
              }}
            >
              Inherits white text
            </Table.Cell>
          </Table.Row>
        </Table>
      </Slide>
    </Presentation>,
  );

  const table = presentation.slides[0]?.children[0];
  assert(table && table.kind === "table");
  const cell = table.rows[0]?.cells[0];
  assertEquals(cell?.style?.fill?.kind, "solid");
  const run = cell?.paragraphs[0]?.runs[0];
  assertEquals(run?.style?.fontColor, clr.hex("FFFFFF"));
});

Deno.test("generated XML includes hyperlink relationships from inline tags", () => {
  const pptx = generate(
    <Presentation>
      <Slide>
        <Text.P>
          Visit <Text.Link href="https://example.com">example.com</Text.Link>
        </Text.P>
      </Slide>
    </Presentation>,
  );

  const slideXml = extractZipText(pptx, "ppt/slides/slide1.xml");
  const relsXml = extractZipText(pptx, "ppt/slides/_rels/slide1.xml.rels");
  assert(slideXml.includes("hlinkClick"));
  assert(relsXml.includes("https://example.com"));
});

Deno.test("hyperlinks are serialized as URLs and invalid ones are rejected", () => {
  const pptx = generate(
    <Presentation>
      <Slide>
        <Text.P>
          <Text.Link href="https://example.com/a b?q=ü">link</Text.Link>
        </Text.P>
      </Slide>
    </Presentation>,
  );
  const relsXml = extractZipText(pptx, "ppt/slides/_rels/slide1.xml.rels");
  assert(relsXml.includes('Target="https://example.com/a%20b?q=%C3%BC"'));

  assertThrows(
    () =>
      generate(
        <Presentation>
          <Slide>
            <Text.P>
              <Text.Link href="not a url">link</Text.Link>
            </Text.P>
          </Slide>
        </Presentation>,
      ),
    TypeError,
  );
});

Deno.test("type-only constraints are enforced for plain-JavaScript callers", () => {
  const generateWith = (child: unknown) => () =>
    generate(
      <Presentation>
        <Slide>{child as never}</Slide>
      </Presentation>,
    );
  // Casts stand in for untyped JavaScript input.
  assertThrows(
    generateWith(<Shape preset={"notAShape" as "rect"} />),
    RangeError,
    "preset geometry",
  );
  assertThrows(
    generateWith(<Text.P style={{ level: 9 as 8 }}>x</Text.P>),
    RangeError,
    "paragraph level",
  );
  assertThrows(
    generateWith(
      <Text.P
        style={{ bullet: { kind: "autonum", type: "bogus" as "arabicPeriod" } }}
      >
        x
      </Text.P>,
    ),
    RangeError,
    "auto-number scheme",
  );
  const oneStop = [{ pos: u.pct(0), color: clr.hex("FF0000") }];
  assertThrows(
    generateWith(
      <Shape
        preset="rect"
        style={{
          fill: {
            kind: "linear-gradient",
            angle: 0,
            stops: oneStop as never,
          },
        }}
      />,
    ),
    RangeError,
    "gradient stops",
  );
});
