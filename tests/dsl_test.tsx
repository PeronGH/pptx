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
  Text,
  TextBox,
  u,
} from "../mod.ts";
import { jsx } from "../src/jsx_runtime.ts";
import { resolveSlideChildren } from "../src/layout.ts";
import { normalizePresentation } from "../src/normalize.ts";
import type { SceneTextBox } from "../src/scene.ts";
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

Deno.test("clr.hex validates and normalizes colors", () => {
  assertEquals(String(clr.hex("ff0000")), "FF0000");
  assertThrows(() => clr.hex("#FF0000"), Error);
});

Deno.test("inline children normalize into one implicit paragraph", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <TextBox>
          Hello <Text.Bold>bold</Text.Bold>{" "}
          <Text.Link href="https://example.com">link</Text.Link>
        </TextBox>
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

Deno.test("textbox gap applies paragraph spacing between paragraph blocks", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <TextBox gap={u.in(0.2)}>
          <Text.P>Alpha</Text.P>
          <Text.P>Beta</Text.P>
        </TextBox>
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
          <TextBox h={u.in(1)}>
            <Text.P>Alpha</Text.P>
            <Text.P>Beta</Text.P>
          </TextBox>
          <Row h={u.in(1.5)}>
            <TextBox basis={u.in(1)}>A</TextBox>
            <TextBox basis={u.in(1)}>B</TextBox>
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
            <TextBox basis={u.in(2)}>Left</TextBox>
          </Row.Start>
          <Row.End>
            <TextBox basis={u.in(2)}>Right</TextBox>
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
            <TextBox h={u.in(2)}>Top</TextBox>
          </Column.Start>
          <Column.End>
            <TextBox h={u.in(2)}>Bottom</TextBox>
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
        <TextBox
          style={[
            {
              fill: { kind: "solid", color: clr.hex("FFEECC") },
              inset: u.in(0.1),
            },
            {
              line: { width: u.emu(12700), dash: "dash" },
              fit: "shrink-text",
            },
          ]}
        >
          Hello
        </TextBox>
      </Slide>
    </Presentation>,
  );

  const textbox = presentation.slides[0]?.children[0];
  assert(textbox && textbox.kind === "textbox");
  assertEquals(textbox.style?.fill?.kind, "solid");
  assertEquals(textbox.style?.line?.dash, "dash");
  assertEquals(textbox.style?.fit, "shrink-text");
  assertEquals(textbox.style?.inset, u.in(0.1));
});

Deno.test("positioned children in a row resolve without consuming flow space", () => {
  const presentation = normalizePresentation(
    <Presentation>
      <Slide>
        <Row>
          <TextBox basis={u.in(2)}>Left</TextBox>
          <Positioned x={u.in(1)} y={u.in(0.5)} w={u.in(1)} h={u.in(0.5)}>
            <TextBox>Overlay</TextBox>
          </Positioned>
          <TextBox basis={u.in(2)}>Right</TextBox>
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
              <TextBox basis={u.in(2)}>Left</TextBox>
              <Row.End>
                <TextBox basis={u.in(2)}>Right</TextBox>
              </Row.End>
            </Row>
          </Slide>
        </Presentation>,
      ),
    Error,
    "cannot mix direct flow children with slot groups",
  );
});

Deno.test("push is rejected for dynamic callers", () => {
  assertThrows(
    () =>
      generate(
        <Presentation>
          <Slide>
            {jsx("textbox", {
              push: "end",
              children: "Oops",
            } as never) as never}
          </Slide>
        </Presentation>,
      ),
    Error,
    "no longer accepts push",
  );
});

Deno.test("absolute x/y props are rejected for dynamic callers", () => {
  assertThrows(
    () =>
      generate(
        <Presentation>
          <Slide>
            <Row>
              {jsx("textbox", {
                x: u.in(1),
                y: u.in(1),
                w: u.in(1),
                h: u.in(1),
                children: "Oops",
              } as never) as never}
            </Row>
          </Slide>
        </Presentation>,
      ),
    Error,
    "wrap it in <Positioned>",
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
          value="amount"
          title="Pipeline"
          labels
        />
      </Slide>
    </Presentation>,
  );

  const chart = presentation.slides[0]?.children[0];
  assert(chart && chart.kind === "chart");
  assertEquals(chart.chartType, "bar");
  assertEquals(chart.points[0]?.category, "Q1");
  assertEquals(chart.points[1]?.value, 18);
});

Deno.test("generated XML includes hyperlink relationships from inline tags", () => {
  const pptx = generate(
    <Presentation>
      <Slide>
        <TextBox>
          Visit <Text.Link href="https://example.com">example.com</Text.Link>
        </TextBox>
      </Slide>
    </Presentation>,
  );

  const slideXml = extractZipText(pptx, "ppt/slides/slide1.xml");
  const relsXml = extractZipText(pptx, "ppt/slides/_rels/slide1.xml.rels");
  assert(slideXml.includes("hlinkClick"));
  assert(relsXml.includes("https://example.com"));
});
