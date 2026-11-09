/** @jsxImportSource @pixel/pptx */

import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import { assertThrows } from "@std/assert/throws";
import {
  Chart,
  clr,
  Column,
  generate,
  Image,
  Presentation,
  Row,
  Shape,
  Slide,
  Table,
  Text,
  Title,
  u,
} from "../mod.ts";
import { createPresentation } from "../imperative.ts";
import {
  createTestBmp,
  createTestPng,
  extractZipText,
  validatePptx,
} from "./helpers.ts";

Deno.test("e2e: line series color without markers and linked runs with a font", async () => {
  const pptx = generate(
    <Presentation>
      <Slide>
        <Row gap={u.in(0.25)}>
          <Chart.Line
            grow={1}
            data={[{ c: "A", v: 1 }, { c: "B", v: 2 }]}
            category="c"
            labels
            series={[{ name: "S", value: "v", color: clr.hex("C0504D") }]}
          />
          <Text.P grow={1}>
            <Text.Link
              href="https://example.com"
              style={{ fontFamily: "Arial", fontColor: clr.hex("1F4E79") }}
            >
              link
            </Text.Link>
          </Text.P>
        </Row>
      </Slide>
    </Presentation>,
  );

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes[0]?.is_chart, true);

  const chart = extractZipText(pptx, "ppt/charts/chart1.xml");
  assert(chart.indexOf("<c:spPr>") < chart.indexOf("<c:marker>"));
  const slide = extractZipText(pptx, "ppt/slides/slide1.xml");
  assert(slide.indexOf("<a:latin") < slide.indexOf("<a:hlinkClick"));
});

Deno.test("e2e: control characters are dropped and line breaks become a:br", async () => {
  const title = "Deck\u0001 title";
  const altText = "alt\ntext";
  const pptx = generate(
    <Presentation title={title}>
      <Slide>
        <Row>
          <Text.P grow={1} style={{ bold: true }}>
            {"one\ntwo\r\nthree\u000Bfour\u0000"}
          </Text.P>
          <Image
            grow={1}
            data={createTestPng()}
            description={altText}
          />
        </Row>
      </Slide>
    </Presentation>,
  );

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes[0]?.text, "one\vtwo\vthree\vfour");

  const slide = extractZipText(pptx, "ppt/slides/slide1.xml");
  assertEquals(slide.match(/<a:br>/g)?.length, 3);
  assert(slide.includes('descr="alt&#10;text"'));
  assert(
    extractZipText(pptx, "docProps/core.xml").includes(
      "<dc:title>Deck title</dc:title>",
    ),
  );
});

Deno.test("e2e: angles normalize and numeric attributes stay integral", async () => {
  const pptx = generate(
    <Presentation>
      <Slide>
        <Row gap={u.in(0.2)}>
          <Shape
            preset="roundRect"
            grow={1}
            style={{
              fill: {
                kind: "linear-gradient",
                angle: -45,
                stops: [
                  { pos: u.pct(0), color: clr.hex("1F4E79") },
                  {
                    pos: u.pct(100),
                    color: clr.hex("2678B4"),
                    alpha: u.pct(40),
                  },
                ],
              },
              line: { width: u.pt(1.25) },
              shadow: {
                color: clr.hex("000000"),
                blur: u.pt(4),
                distance: u.pt(2),
                angle: 360 + 45,
                alpha: u.pct(33.3333),
              },
            }}
          />
          <Text.P
            grow={1}
            style={{ fontSize: u.font(10.333), spacing: { before: u.pt(3.3) } }}
          >
            Integral
          </Text.P>
        </Row>
      </Slide>
    </Presentation>,
  );

  await validatePptx(pptx, 1);
  const slide = extractZipText(pptx, "ppt/slides/slide1.xml");
  assert(slide.includes('<a:lin ang="18900000"'));
  assert(slide.includes('dir="2700000"'));
  assert(slide.includes('sz="1033"'));
  assert(slide.includes('<a:spcPts val="330"/>'));
});

Deno.test("e2e: contain background letterboxes with fillRect insets", async () => {
  const pptx = generate(
    <Presentation>
      <Slide
        background={{
          data: createTestBmp(8, 4),
          fit: "contain",
          alpha: u.pct(60),
        }}
      />
    </Presentation>,
  );

  await validatePptx(pptx, 1);
  const slide = extractZipText(pptx, "ppt/slides/slide1.xml");
  assert(slide.includes('<a:alphaModFix amt="60000"/>'));
  assert(slide.includes('<a:fillRect t="5556" b="5556"/>'));
});

Deno.test("e2e: bullets hang, text boxes keep their frame, app.xml is consistent", async () => {
  const pptx = generate(
    <Presentation>
      <Slide>
        <Text>
          <Text.P style={{ bullet: { kind: "char", char: "•" } }}>one</Text.P>
          <Text.P
            style={{
              level: 1,
              bullet: { kind: "autonum", type: "arabicPeriod" },
            }}
          >
            two
          </Text.P>
          <Text.P style={{ bullet: { kind: "none" } }}>three</Text.P>
        </Text>
      </Slide>
      <Slide />
    </Presentation>,
  );

  await validatePptx(pptx, 2);
  const slide = extractZipText(pptx, "ppt/slides/slide1.xml");
  assert(slide.includes('<a:pPr marL="228600" indent="-228600">'));
  assert(slide.includes('<a:pPr marL="685800" indent="-228600" lvl="1">'));
  assert(slide.includes("<a:pPr><a:buNone/></a:pPr>"));
  assert(!slide.includes("spAutoFit"));

  const app = extractZipText(pptx, "docProps/app.xml");
  assert(app.includes("<Application>@pixel/pptx</Application>"));
  assert(app.includes("<Slides>2</Slides>"));
  assert(app.includes('<vt:vector size="1" baseType="lpstr">'));
  assert(!extractZipText(pptx, "docProps/core.xml").includes("dc:creator"));
});

Deno.test("e2e: shape names reach PowerPoint's selection pane", async () => {
  const pptx = generate(
    <Presentation>
      <Slide>
        <Column gap={u.in(0.1)}>
          <Text.P name="headline">Title</Text.P>
          <Shape name="badge" preset="ellipse" h={u.in(0.5)} />
          <Image name="logo" data={createTestPng()} h={u.in(0.5)} />
          <Table name="metrics" cols={[u.in(2)]} h={u.in(0.5)}>
            <Table.Row height={u.in(0.5)}>
              <Table.Cell>1</Table.Cell>
            </Table.Row>
          </Table>
          <Chart.Pie
            name="mix"
            data={[{ c: "A", v: 1 }]}
            category="c"
            series={[{ name: "S", value: "v" }]}
          />
          <Text.P>unnamed</Text.P>
        </Column>
      </Slide>
    </Presentation>,
  );
  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shapes.map((shape) => shape.name), [
    "headline",
    "badge",
    "logo",
    "metrics",
    "mix",
    "TextBox 7",
  ]);

  const pres = createPresentation();
  pres.addSlide().addText("x", {
    name: "imperative",
    x: u.in(1),
    y: u.in(1),
    w: u.in(1),
    h: u.in(1),
  });
  const slide = extractZipText(pres.generate(), "ppt/slides/slide1.xml");
  assert(slide.includes('name="imperative"'));
});

Deno.test("e2e: speaker notes become notes slides with a notes master", async () => {
  const notes = "Open with the headline.\nThen the chart.";
  const pptx = generate(
    <Presentation>
      <Slide notes={notes}>
        <Text.P>Slide with notes</Text.P>
      </Slide>
      <Slide>
        <Text.P>Slide without notes</Text.P>
      </Slide>
    </Presentation>,
  );
  const result = await validatePptx(pptx, 2);
  assertEquals(
    result.slides.map((slide) => slide.notes),
    [notes, null],
  );
  const presentation = extractZipText(pptx, "ppt/presentation.xml");
  assert(presentation.includes("<p:notesMasterIdLst>"));

  const withoutNotes = generate(
    <Presentation>
      <Slide />
    </Presentation>,
  );
  assert(
    !extractZipText(withoutNotes, "[Content_Types].xml").includes("notes"),
  );

  const pres = createPresentation();
  pres.addSlide({ notes: "imperative notes" });
  assert(
    extractZipText(pres.generate(), "ppt/notesSlides/notesSlide1.xml")
      .includes("imperative notes"),
  );
});

Deno.test("e2e: <Title> is the slide's title placeholder", async () => {
  const pptx = generate(
    <Presentation>
      <Slide>
        <Column gap={u.in(0.2)}>
          <Title h={u.in(1)}>Quarterly Review</Title>
          <Text.P>Body text</Text.P>
        </Column>
      </Slide>
      <Slide>
        <Text.P>No title here</Text.P>
      </Slide>
    </Presentation>,
  );
  const result = await validatePptx(pptx, 2);
  assertEquals(result.slides.map((slide) => slide.title), [
    "Quarterly Review",
    null,
  ]);
  assertEquals(result.slides[0]?.shapes[0]?.name, "Title 2");
  const slide = extractZipText(pptx, "ppt/slides/slide1.xml");
  assert(slide.includes('<p:nvPr><p:ph type="title"/></p:nvPr>'));
  assert(
    extractZipText(pptx, "ppt/slideLayouts/slideLayout1.xml").includes(
      'type="titleOnly"',
    ),
  );

  assertThrows(
    () =>
      generate(
        <Presentation>
          <Slide>
            <Column>
              <Title>One</Title>
              <Title>Two</Title>
            </Column>
          </Slide>
        </Presentation>,
      ),
    Error,
    "at most one <Title>",
  );

  const pres = createPresentation();
  pres.addSlide().addTitle("Imperative title", {
    x: u.in(0.5),
    y: u.in(0.3),
    w: u.in(9),
    h: u.in(1),
  });
  const imperative = extractZipText(pres.generate(), "ppt/slides/slide1.xml");
  assert(imperative.includes('<p:ph type="title"/>'));
});

Deno.test("e2e: stacked bars, area charts, and number formats", async () => {
  const data = [
    { q: "Q1", north: 0.12, south: 0.2 },
    { q: "Q2", north: 0.18, south: 0.25 },
    { q: "Q3", north: 0.15, south: 0.3 },
  ];
  const series = [
    { name: "North", value: "north", color: clr.hex("1F4E79") },
    { name: "South", value: "south", color: clr.hex("2E86C1") },
  ] as const;
  const pptx = generate(
    <Presentation>
      <Slide>
        <Column gap={u.in(0.2)}>
          <Row gap={u.in(0.2)} grow={1}>
            <Chart.Bar
              grow={1}
              data={data}
              category="q"
              stacking="stacked"
              numberFormat="0%"
              labels
              series={series}
            />
            <Chart.Bar
              grow={1}
              data={data}
              category="q"
              direction="bar"
              stacking="percent"
              labels
              series={series}
            />
            <Chart.Area
              grow={1}
              data={data}
              category="q"
              stacking="stacked"
              numberFormat="0.0%"
              labels
              legend={{ position: "bottom" }}
              series={series}
            />
          </Row>
          <Row gap={u.in(0.2)} grow={1}>
            <Chart.Area grow={1} data={data} category="q" series={series} />
            <Chart.Bar
              grow={1}
              data={[{ q: "Q1", revenue: 1250000 }, {
                q: "Q2",
                revenue: 1600000,
              }]}
              category="q"
              numberFormat="$#,##0"
              labels
              series={[{ name: "Revenue", value: "revenue" }]}
            />
            <Chart.Pie
              grow={1}
              data={[{ c: "A", share: 0.6 }, { c: "B", share: 0.4 }]}
              category="c"
              numberFormat="0%"
              labels
              series={[{ name: "Share", value: "share" }]}
            />
          </Row>
        </Column>
      </Slide>
    </Presentation>,
  );
  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 6);

  const stacked = extractZipText(pptx, "ppt/charts/chart1.xml");
  assert(stacked.includes('<c:grouping val="stacked"/>'));
  assert(stacked.includes('<c:overlap val="100"/>'));
  assert(stacked.includes('<c:dLblPos val="ctr"/>'));
  assert(stacked.includes("<c:formatCode>0%</c:formatCode>"));
  assert(stacked.includes('<c:numFmt formatCode="0%" sourceLinked="0"/>'));

  const percent = extractZipText(pptx, "ppt/charts/chart2.xml");
  assert(percent.includes('<c:grouping val="percentStacked"/>'));
  assert(percent.includes('<c:numFmt formatCode="0%" sourceLinked="0"/>'));
  // Horizontal bars put the category axis on the left.
  assert(/<c:catAx>(?:(?!<\/c:catAx>).)*<c:axPos val="l"\/>/.test(percent));

  const area = extractZipText(pptx, "ppt/charts/chart3.xml");
  assert(area.includes("<c:areaChart>"));
  assert(!area.includes("c:dLblPos"));

  const currency = extractZipText(pptx, "ppt/charts/chart5.xml");
  assert(currency.includes('<c:dLblPos val="outEnd"/>'));
  assert(currency.includes('formatCode="$#,##0"'));

  const pres = createPresentation();
  pres.addSlide().addAreaChart({
    x: u.in(1),
    y: u.in(1),
    w: u.in(4),
    h: u.in(3),
    data,
    category: "q",
    series,
  });
  assert(
    extractZipText(pres.generate(), "ppt/charts/chart1.xml").includes(
      "<c:areaChart>",
    ),
  );
});
