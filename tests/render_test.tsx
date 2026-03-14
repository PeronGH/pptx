/** @jsxImportSource @pixel/pptx */

import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import {
  Align,
  type BoxStyle,
  type CellStyle,
  Chart,
  clr,
  generate,
  Image,
  type ParagraphStyle,
  Positioned,
  Presentation,
  Row,
  Shape,
  Slide,
  Stack,
  Table,
  Text,
  type TextStyle,
  u,
} from "../mod.ts";
import { createTestBmp, validatePptx } from "./helpers.ts";

const styles = {
  heroBar: {
    fill: { kind: "solid", color: clr.hex("17324D") },
  } satisfies BoxStyle,
  heroTitle: {
    fontSize: u.font(22),
    fontColor: clr.hex("FFFFFF"),
    bold: true,
  } satisfies TextStyle,
  noteCard: {
    fill: { kind: "solid", color: clr.hex("FFFFFF") },
    line: { width: u.emu(6350), dash: "dash" },
    shadow: {
      color: clr.hex("000000"),
      blur: u.emu(15000),
      distance: u.emu(5000),
      angle: 50,
      alpha: u.pct(20),
    },
    padding: u.in(0.1),
  } satisfies BoxStyle,
  bullets: {
    bullet: { kind: "char", char: "•" },
  } satisfies ParagraphStyle,
  metricCell: {
    fill: { kind: "solid", color: clr.hex("17324D") },
    line: { width: u.emu(6350) },
    padding: u.in(0.05),
    verticalAlign: "middle",
  } satisfies CellStyle,
  metricText: {
    fontColor: clr.hex("FFFFFF"),
    bold: true,
  } satisfies TextStyle,
};

Deno.test("e2e: slide background and stack overlay", async () => {
  const pptx = generate(
    <Presentation>
      <Slide
        background={{ kind: "solid", color: clr.hex("F7F4EE") }}
      >
        <Stack>
          <Positioned
            x={u.in(0.6)}
            y={u.in(0.6)}
            w={u.in(8.8)}
            h={u.in(1)}
          >
            <Shape preset="rect" style={styles.heroBar} />
          </Positioned>
          <Align x="center" y="start" w={u.in(6)} h={u.in(1)}>
            <Text.P
              style={{
                verticalAlign: "middle",
                align: "center",
                ...styles.heroTitle,
              }}
            >
              Hero Title
            </Text.P>
          </Align>
        </Stack>
      </Slide>
    </Presentation>,
  );

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slide_count, 1);
  assert(result.slides[0]?.shapes.some((shape) => shape.text === "Hero Title"));
});

Deno.test("e2e: slide background image", async () => {
  const pptx = generate(
    <Presentation>
      <Slide
        background={{
          data: createTestBmp(8, 4),
          contentType: "image/bmp",
          fit: "cover",
        }}
      >
        <Positioned
          x={u.in(1)}
          y={u.in(1)}
          w={u.in(5)}
          h={u.in(1)}
        >
          <Text.P
            style={{
              fill: {
                kind: "solid",
                color: clr.hex("FFFFFF"),
                alpha: u.pct(80),
              },
            }}
          >
            On top of background
          </Text.P>
        </Positioned>
      </Slide>
    </Presentation>,
  );

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slide_count, 1);
  assertEquals(result.slides[0]?.shape_count, 2);
});

Deno.test("e2e: image fits", async () => {
  const bmp = createTestBmp(4, 2);
  const pptx = generate(
    <Presentation>
      <Slide>
        <Positioned
          x={u.in(1)}
          y={u.in(1)}
          w={u.in(4)}
          h={u.in(4)}
        >
          <Image data={bmp} contentType="image/bmp" fit="contain" />
        </Positioned>
        <Positioned
          x={u.in(5.5)}
          y={u.in(1)}
          w={u.in(2)}
          h={u.in(2)}
        >
          <Image data={bmp} contentType="image/bmp" fit="cover" />
        </Positioned>
      </Slide>
    </Presentation>,
  );

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 2);
  assertEquals(result.slides[0]?.shapes[0]?.is_picture, true);
  assertEquals(result.slides[0]?.shapes[1]?.is_picture, true);
});

Deno.test("e2e: chart and table layout", async () => {
  const pptx = generate(
    <Presentation>
      <Slide>
        <Row gap={u.in(0.3)}>
          <Chart.Bar
            basis={u.in(4.8)}
            h={u.in(3)}
            data={[
              { quarter: "Q1", value: 12 },
              { quarter: "Q2", value: 18 },
              { quarter: "Q3", value: 15 },
            ]}
            category="quarter"
            title="Pipeline"
            labels
            series={[
              {
                name: "Pipeline",
                value: "value",
                color: clr.hex("2678B4"),
              },
            ]}
          />
          <Table
            basis={u.in(4.2)}
            h={u.in(2)}
            cols={[u.in(1.4), u.in(1.4), u.in(1.4)]}
          >
            <Table.Row height={u.in(0.5)}>
              <Table.Cell style={styles.metricCell}>
                <Text.Span style={styles.metricText}>Metric</Text.Span>
              </Table.Cell>
              <Table.Cell style={styles.metricCell}>
                <Text.Span style={styles.metricText}>Owner</Text.Span>
              </Table.Cell>
              <Table.Cell style={styles.metricCell}>
                <Text.Span style={styles.metricText}>Status</Text.Span>
              </Table.Cell>
            </Table.Row>
            <Table.Row height={u.in(0.5)}>
              <Table.Cell>Revenue</Table.Cell>
              <Table.Cell>Alex</Table.Cell>
              <Table.Cell>On track</Table.Cell>
            </Table.Row>
          </Table>
        </Row>
      </Slide>
    </Presentation>,
  );

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 2);
  assertEquals(result.slides[0]?.shapes[0]?.is_chart, true);
  assertEquals(result.slides[0]?.shapes[1]?.is_table, true);
});

Deno.test("e2e: line, pie, and donut charts", async () => {
  const pptx = generate(
    <Presentation>
      <Slide>
        <Row gap={u.in(0.25)}>
          <Chart.Line
            basis={u.in(3)}
            h={u.in(2.6)}
            data={[
              { quarter: "Q1", pipeline: 12, closed: 8 },
              { quarter: "Q2", pipeline: 18, closed: 11 },
              { quarter: "Q3", pipeline: 15, closed: 13 },
            ]}
            category="quarter"
            markers
            series={[
              { name: "Pipeline", value: "pipeline" },
              { name: "Closed", value: "closed" },
            ]}
          />
          <Chart.Pie
            basis={u.in(2.8)}
            h={u.in(2.6)}
            data={[
              { segment: "New", value: 12 },
              { segment: "Expansion", value: 8 },
              { segment: "Renewal", value: 6 },
            ]}
            category="segment"
            labels
            series={[{ name: "Revenue", value: "value" }]}
          />
          <Chart.Donut
            basis={u.in(2.8)}
            h={u.in(2.6)}
            data={[
              { segment: "Won", value: 9 },
              { segment: "Open", value: 3 },
              { segment: "Lost", value: 2 },
            ]}
            category="segment"
            holeSize={60}
            series={[{ name: "Deals", value: "value" }]}
          />
        </Row>
      </Slide>
    </Presentation>,
  );

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 3);
  assertEquals(result.slides[0]?.shapes[0]?.is_chart, true);
  assertEquals(result.slides[0]?.shapes[1]?.is_chart, true);
  assertEquals(result.slides[0]?.shapes[2]?.is_chart, true);
});

Deno.test("e2e: text gap and inline formatting", async () => {
  const pptx = generate(
    <Presentation>
      <Slide>
        <Positioned
          x={u.in(1)}
          y={u.in(1)}
          w={u.in(6)}
          h={u.in(2.2)}
        >
          <Text gap={u.in(0.12)} style={styles.noteCard}>
            <Text.P>
              <Text.Span style={styles.heroTitle}>Q2 Strategy</Text.Span>
            </Text.P>
            <Text.P style={styles.bullets}>
              <Text.Span style={{ fontColor: clr.hex("17324D") }}>
                Ship the pricing refresh
              </Text.Span>
            </Text.P>
            <Text.P style={styles.bullets}>
              <Text.Span style={{ fontColor: clr.hex("17324D") }}>
                Expand onboarding capacity
              </Text.Span>
            </Text.P>
            <Text.P>
              Memo:{" "}
              <Text.Link href="https://example.com">example.com</Text.Link>
            </Text.P>
          </Text>
        </Positioned>
      </Slide>
    </Presentation>,
  );

  const result = await validatePptx(pptx, 1);
  const text = result.slides[0]?.shapes[0]?.text ?? "";
  assert(text.includes("Q2 Strategy"));
  assert(text.includes("example.com"));
});
