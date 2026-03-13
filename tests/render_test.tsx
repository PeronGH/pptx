/** @jsxImportSource @pixel/pptx */

import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import {
  type BoxStyle,
  type CellStyle,
  ChartBar,
  clr,
  generate,
  type ParagraphStyle,
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
    inset: u.in(0.1),
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
    <presentation>
      <slide
        background={{
          kind: "fill",
          fill: { kind: "solid", color: clr.hex("F7F4EE") },
        }}
      >
        <stack>
          <shape
            preset="rect"
            x={u.in(0.6)}
            y={u.in(0.6)}
            w={u.in(8.8)}
            h={u.in(1)}
            style={styles.heroBar}
          />
          <align x="center" y="start" w={u.in(6)} h={u.in(1)}>
            <textbox style={{ verticalAlign: "middle" }}>
              <p style={{ align: "center" }}>
                <span style={styles.heroTitle}>Hero Title</span>
              </p>
            </textbox>
          </align>
        </stack>
      </slide>
    </presentation>,
  );

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slide_count, 1);
  assert(result.slides[0]?.shapes.some((shape) => shape.text === "Hero Title"));
});

Deno.test("e2e: slide background image", async () => {
  const pptx = generate(
    <presentation>
      <slide
        background={{
          kind: "image",
          data: createTestBmp(8, 4),
          contentType: "image/bmp",
          fit: "cover",
        }}
      >
        <textbox
          x={u.in(1)}
          y={u.in(1)}
          w={u.in(5)}
          h={u.in(1)}
          style={{
            fill: {
              kind: "solid",
              color: clr.hex("FFFFFF"),
              alpha: u.pct(80),
            },
          }}
        >
          On top of background
        </textbox>
      </slide>
    </presentation>,
  );

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slide_count, 1);
  assertEquals(result.slides[0]?.shape_count, 2);
});

Deno.test("e2e: image fits", async () => {
  const bmp = createTestBmp(4, 2);
  const pptx = generate(
    <presentation>
      <slide>
        <image
          x={u.in(1)}
          y={u.in(1)}
          w={u.in(4)}
          h={u.in(4)}
          data={bmp}
          contentType="image/bmp"
          fit="contain"
        />
        <image
          x={u.in(5.5)}
          y={u.in(1)}
          w={u.in(2)}
          h={u.in(2)}
          data={bmp}
          contentType="image/bmp"
          fit="cover"
        />
      </slide>
    </presentation>,
  );

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 2);
  assertEquals(result.slides[0]?.shapes[0]?.is_picture, true);
  assertEquals(result.slides[0]?.shapes[1]?.is_picture, true);
});

Deno.test("e2e: chart and table layout", async () => {
  const pptx = generate(
    <presentation>
      <slide>
        <row gap={u.in(0.3)}>
          <ChartBar
            basis={u.in(4.8)}
            h={u.in(3)}
            data={[
              { quarter: "Q1", value: 12 },
              { quarter: "Q2", value: 18 },
              { quarter: "Q3", value: 15 },
            ]}
            category="quarter"
            value="value"
            title="Pipeline"
            labels
            color={clr.hex("2678B4")}
          />
          <table
            basis={u.in(4.2)}
            h={u.in(2)}
            cols={[u.in(1.4), u.in(1.4), u.in(1.4)]}
          >
            <tr height={u.in(0.5)}>
              <td style={styles.metricCell}>
                <span style={styles.metricText}>Metric</span>
              </td>
              <td style={styles.metricCell}>
                <span style={styles.metricText}>Owner</span>
              </td>
              <td style={styles.metricCell}>
                <span style={styles.metricText}>Status</span>
              </td>
            </tr>
            <tr height={u.in(0.5)}>
              <td>Revenue</td>
              <td>Alex</td>
              <td>On track</td>
            </tr>
          </table>
        </row>
      </slide>
    </presentation>,
  );

  const result = await validatePptx(pptx, 1);
  assertEquals(result.slides[0]?.shape_count, 2);
  assertEquals(result.slides[0]?.shapes[0]?.is_chart, true);
  assertEquals(result.slides[0]?.shapes[1]?.is_table, true);
});

Deno.test("e2e: textbox gap and inline formatting", async () => {
  const pptx = generate(
    <presentation>
      <slide>
        <textbox
          x={u.in(1)}
          y={u.in(1)}
          w={u.in(6)}
          h={u.in(2.2)}
          gap={u.in(0.12)}
          style={styles.noteCard}
        >
          <p>
            <span style={styles.heroTitle}>Q2 Strategy</span>
          </p>
          <p style={styles.bullets}>
            <span style={{ fontColor: clr.hex("17324D") }}>
              Ship the pricing refresh
            </span>
          </p>
          <p style={styles.bullets}>
            <span style={{ fontColor: clr.hex("17324D") }}>
              Expand onboarding capacity
            </span>
          </p>
          <p>
            Memo: <a href="https://example.com">example.com</a>
          </p>
        </textbox>
      </slide>
    </presentation>,
  );

  const result = await validatePptx(pptx, 1);
  const text = result.slides[0]?.shapes[0]?.text ?? "";
  assert(text.includes("Q2 Strategy"));
  assert(text.includes("example.com"));
});
