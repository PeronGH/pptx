/** @jsxImportSource @pixel/pptx */

import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import { assertThrows } from "@std/assert/throws";
import { ChartBar, clr, generate, u } from "../mod.ts";
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
    <presentation>
      <slide>
        <textbox>
          Hello <b>bold</b> <a href="https://example.com">link</a>
        </textbox>
      </slide>
    </presentation>,
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
    <presentation>
      <slide>
        <textbox gap={u.in(0.2)}>
          <p>Alpha</p>
          <p>Beta</p>
        </textbox>
      </slide>
    </presentation>,
  );

  const textbox = presentation.slides[0]?.children[0];
  assert(textbox && textbox.kind === "textbox");
  assertEquals(textbox.paragraphs.length, 2);
  assertEquals(textbox.paragraphs[1]?.style?.spacing?.before, u.in(0.2));
});

Deno.test("presentation layout defaults propagate to slides, rows, and text blocks", () => {
  const presentation = normalizePresentation(
    <presentation
      layout={{
        slidePadding: u.in(1),
        rowGap: u.in(0.25),
        textGap: u.in(0.1),
      }}
    >
      <slide>
        <column>
          <textbox h={u.in(1)}>
            <p>Alpha</p>
            <p>Beta</p>
          </textbox>
          <row h={u.in(1.5)}>
            <textbox basis={u.in(1)}>A</textbox>
            <textbox basis={u.in(1)}>B</textbox>
          </row>
        </column>
      </slide>
    </presentation>,
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

Deno.test("spacer consumes remaining space in a row", () => {
  const presentation = normalizePresentation(
    <presentation>
      <slide>
        <row>
          <textbox basis={u.in(2)}>Left</textbox>
          <spacer />
          <textbox basis={u.in(2)}>Right</textbox>
        </row>
      </slide>
    </presentation>,
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

Deno.test("generated slide geometry keeps flex math in integer EMUs", () => {
  const pptx = generate(
    <presentation>
      <slide>
        <row>
          <shape preset="rect" grow={3.05} />
          <shape preset="rect" grow={2.3} />
          <shape preset="rect" grow={2.9} />
        </row>
      </slide>
    </presentation>,
  );

  const slideXml = extractZipText(pptx, "ppt/slides/slide1.xml");
  assertEquals(
    /\b(?:x|y|cx|cy)="\d+\.\d+"/.test(slideXml),
    false,
  );
});

Deno.test("style arrays merge left to right", () => {
  const presentation = normalizePresentation(
    <presentation>
      <slide>
        <textbox
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
        </textbox>
      </slide>
    </presentation>,
  );

  const textbox = presentation.slides[0]?.children[0];
  assert(textbox && textbox.kind === "textbox");
  assertEquals(textbox.style?.fill?.kind, "solid");
  assertEquals(textbox.style?.line?.dash, "dash");
  assertEquals(textbox.style?.fit, "shrink-text");
  assertEquals(textbox.style?.inset, u.in(0.1));
});

Deno.test("absolute children in row resolve without consuming flow space", () => {
  const presentation = normalizePresentation(
    <presentation>
      <slide>
        <row>
          <textbox basis={u.in(2)}>Left</textbox>
          <textbox x={u.in(1)} y={u.in(0.5)} w={u.in(1)} h={u.in(0.5)}>
            Overlay
          </textbox>
          <textbox basis={u.in(2)}>Right</textbox>
        </row>
      </slide>
    </presentation>,
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

Deno.test("ChartBar component normalizes a bar chart leaf", () => {
  const presentation = normalizePresentation(
    <presentation>
      <slide>
        <ChartBar
          data={[
            { quarter: "Q1", amount: 12 },
            { quarter: "Q2", amount: 18 },
          ]}
          category="quarter"
          value="amount"
          title="Pipeline"
          labels
        />
      </slide>
    </presentation>,
  );

  const chart = presentation.slides[0]?.children[0];
  assert(chart && chart.kind === "chart");
  assertEquals(chart.chartType, "bar");
  assertEquals(chart.points[0]?.category, "Q1");
  assertEquals(chart.points[1]?.value, 18);
});

Deno.test("generated XML includes hyperlink relationships from inline tags", () => {
  const pptx = generate(
    <presentation>
      <slide>
        <textbox>
          Visit <a href="https://example.com">example.com</a>
        </textbox>
      </slide>
    </presentation>,
  );

  const slideXml = extractZipText(pptx, "ppt/slides/slide1.xml");
  const relsXml = extractZipText(pptx, "ppt/slides/_rels/slide1.xml.rels");
  assert(slideXml.includes("hlinkClick"));
  assert(relsXml.includes("https://example.com"));
});
