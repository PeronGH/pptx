/** @jsxImportSource @pixel/pptx */

import {
  type BoxStyle,
  type CellStyle,
  clr,
  generate,
  type ParagraphStyle,
  type TextStyle,
  u,
} from "../mod.ts";

const styles = {
  heroBar: {
    fill: { kind: "solid", color: clr.hex("1F4E79") },
    inset: {
      top: u.in(0.18),
      right: u.in(0.28),
      bottom: u.in(0.18),
      left: u.in(0.28),
    },
  } satisfies BoxStyle,
  heroTitle: {
    fontSize: u.font(24),
    fontColor: clr.hex("FFFFFF"),
    bold: true,
  } satisfies TextStyle,
  heroSubtitle: {
    fontSize: u.font(11),
    fontColor: clr.hex("D9E7F5"),
  } satisfies TextStyle,
  card: {
    fill: { kind: "solid", color: clr.hex("FFFFFF") },
    inset: u.in(0.14),
    shadow: {
      color: clr.hex("000000"),
      blur: u.emu(12000),
      distance: u.emu(4000),
      angle: 50,
      alpha: u.pct(18),
    },
  } satisfies BoxStyle,
  cardTitle: {
    fontSize: u.font(14),
    fontColor: clr.hex("17324D"),
    bold: true,
  } satisfies TextStyle,
  body: {
    fontSize: u.font(11),
    fontColor: clr.hex("32465A"),
  } satisfies TextStyle,
  bullet: {
    bullet: { kind: "char", char: "•" },
  } satisfies ParagraphStyle,
  headCell: {
    fill: { kind: "solid", color: clr.hex("17324D") },
    padding: u.in(0.07),
    verticalAlign: "middle",
  } satisfies CellStyle,
  cell: {
    padding: u.in(0.07),
    verticalAlign: "middle",
  } satisfies CellStyle,
  headText: {
    fontSize: u.font(11),
    fontColor: clr.hex("FFFFFF"),
    bold: true,
  } satisfies TextStyle,
  metricText: {
    fontSize: u.font(11),
    fontColor: clr.hex("17324D"),
  } satisfies TextStyle,
};

export const deck = (
  <presentation
    title="Quarterly Review"
    layout={{
      rowGap: u.in(0.3),
      columnGap: u.in(0.35),
    }}
  >
    <slide
      background={{
        kind: "fill",
        fill: {
          kind: "linear-gradient",
          angle: 90,
          stops: [
            { pos: u.pct(0), color: clr.hex("FFF8F1") },
            { pos: u.pct(100), color: clr.hex("F2F6FB") },
          ],
        },
      }}
      layout={{
        slidePadding: {
          top: u.in(0.55),
          right: u.in(0.55),
          bottom: u.in(0.6),
          left: u.in(0.55),
        },
      }}
    >
      <column>
        <shape preset="roundRect" h={u.in(1.25)} style={styles.heroBar}>
          <p>
            <span style={styles.heroTitle}>Quarterly Review</span>
          </p>
          <p>
            <span style={styles.heroSubtitle}>
              Q2 snapshot: growth is ahead of plan
            </span>
          </p>
        </shape>

        <row align="start">
          <stack grow={3.05}>
            <shape preset="roundRect" style={styles.card} />
            <align
              x="center"
              y="start"
              padding={{ top: u.in(0.18) }}
              w={u.in(2.75)}
              h={u.in(0.32)}
            >
              <textbox>
                <p style={{ align: "center" }}>
                  <span style={styles.cardTitle}>Pipeline</span>
                </p>
              </textbox>
            </align>
            <align
              x="center"
              y="start"
              padding={{ top: u.in(0.55) }}
              w={u.in(2.75)}
              h={u.in(3.35)}
            >
              <chart
                kind="bar"
                data={[
                  { quarter: "Q1", amount: 8 },
                  { quarter: "Q2", amount: 12 },
                  { quarter: "Q3", amount: 10 },
                  { quarter: "Q4", amount: 15 },
                ]}
                category="quarter"
                value="amount"
                seriesName="Pipeline"
                labels
                color={clr.hex("2678B4")}
                valueAxis={{ min: 0, max: 16 }}
              />
            </align>
          </stack>

          <stack grow={2.3}>
            <shape preset="roundRect" style={styles.card} />
            <align
              x="center"
              y="start"
              padding={{ top: u.in(0.2) }}
              w={u.in(1.98)}
              h={u.in(3.2)}
            >
              <table cols={[u.in(1.15), u.in(0.85)]}>
                <tr height={u.in(0.44)}>
                  <td style={styles.headCell}>
                    <span style={styles.headText}>Metric</span>
                  </td>
                  <td style={styles.headCell}>
                    <span style={styles.headText}>Value</span>
                  </td>
                </tr>
                <tr height={u.in(0.44)}>
                  <td style={styles.cell}>
                    <span style={styles.metricText}>Revenue</span>
                  </td>
                  <td style={styles.cell}>
                    <span style={styles.metricText}>$1.2M</span>
                  </td>
                </tr>
                <tr height={u.in(0.44)}>
                  <td style={styles.cell}>
                    <span style={styles.metricText}>Growth</span>
                  </td>
                  <td style={styles.cell}>
                    <span style={styles.metricText}>15%</span>
                  </td>
                </tr>
                <tr height={u.in(0.44)}>
                  <td style={styles.cell}>
                    <span style={styles.metricText}>NPS</span>
                  </td>
                  <td style={styles.cell}>
                    <span style={styles.metricText}>61</span>
                  </td>
                </tr>
              </table>
            </align>
          </stack>

          <stack grow={2.9}>
            <shape preset="roundRect" style={styles.card} />
            <align
              x="center"
              y="start"
              padding={{ top: u.in(0.2) }}
              w={u.in(2.58)}
              h={u.in(3)}
            >
              <textbox gap={u.in(0.08)}>
                <p>
                  <span style={styles.cardTitle}>Notes</span>
                </p>
                <p style={styles.bullet}>
                  <span style={styles.body}>Highlights and next steps</span>
                </p>
                <p style={styles.bullet}>
                  <span style={styles.body}>Review pricing experiments</span>
                </p>
                <p style={styles.bullet}>
                  <span style={styles.body}>Expand onboarding capacity</span>
                </p>
              </textbox>
            </align>
          </stack>
        </row>
      </column>
    </slide>
  </presentation>
);

if (import.meta.main) {
  const path = new URL("./quarterly-review.pptx", import.meta.url);
  Deno.writeFileSync(path, generate(deck));
}
