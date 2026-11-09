/** @jsxImportSource @pixel/pptx */

import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import {
  Chart,
  clr,
  generate,
  Image,
  Presentation,
  Row,
  Shape,
  Slide,
  Text,
  u,
} from "../mod.ts";
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
  assert(slide.includes('<a:fillRect t="16667" b="16667"/>'));
});
