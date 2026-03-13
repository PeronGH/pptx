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
  <presentation title="Quarterly Review">
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
    >
      <column
        padding={{
          top: u.in(0.55),
          right: u.in(0.55),
          bottom: u.in(0.6),
          left: u.in(0.55),
        }}
        gap={u.in(0.35)}
      >
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

        <row gap={u.in(0.3)} align="start" h={u.in(4.45)}>
          <stack basis={u.in(3.05)} h={u.in(4.45)}>
            <shape preset="roundRect" style={styles.card} />
            <chart
              kind="bar"
              x={u.in(0.15)}
              y={u.in(0.2)}
              w={u.in(2.75)}
              h={u.in(3.9)}
              data={[
                { quarter: "Q1", amount: 8 },
                { quarter: "Q2", amount: 12 },
                { quarter: "Q3", amount: 10 },
                { quarter: "Q4", amount: 15 },
              ]}
              category="quarter"
              value="amount"
              title="Pipeline"
              seriesName="Pipeline"
              labels
              color={clr.hex("2678B4")}
              valueAxis={{ min: 0, max: 16 }}
            />
          </stack>

          <stack basis={u.in(2.3)} h={u.in(4.45)}>
            <shape preset="roundRect" style={styles.card} />
            <table
              x={u.in(0.16)}
              y={u.in(0.2)}
              w={u.in(1.98)}
              h={u.in(3.2)}
              cols={[u.in(1.15), u.in(0.85)]}
            >
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
          </stack>

          <stack basis={u.in(2.9)} h={u.in(4.45)}>
            <shape preset="roundRect" style={styles.card} />
            <textbox x={u.in(0.16)} y={u.in(0.2)} w={u.in(2.58)} h={u.in(3)}>
              <p>
                <span style={styles.cardTitle}>Notes</span>
              </p>
              <spacer size={u.in(0.08)} />
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
