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
  Slide,
  Text,
  u,
} from "../mod.ts";
import { createTestPng, extractZipText, validatePptx } from "./helpers.ts";

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
  const pptx = generate(
    <Presentation title={"Deck\u0001 title"}>
      <Slide>
        <Row>
          <Text.P grow={1} style={{ bold: true }}>
            {"one\ntwo\r\nthree\u000Bfour\u0000"}
          </Text.P>
          <Image
            grow={1}
            data={createTestPng()}
            contentType="image/png"
            description={"alt\ntext"}
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
