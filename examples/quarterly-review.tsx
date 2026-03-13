/** @jsxImportSource @pixel/pptx */

import {
  Align,
  type BoxStyle,
  type CellStyle,
  Chart,
  clr,
  Column,
  generate,
  type ParagraphStyle,
  Presentation,
  Row,
  Shape,
  Slide,
  Stack,
  Table,
  Text,
  TextBox,
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
  <Presentation
    title="Quarterly Review"
    layout={{
      rowGap: u.in(0.3),
      columnGap: u.in(0.35),
    }}
  >
    <Slide
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
      <Column>
        <Shape preset="roundRect" h={u.in(1.25)} style={styles.heroBar}>
          <Text.P>
            <Text.Span style={styles.heroTitle}>Quarterly Review</Text.Span>
          </Text.P>
          <Text.P>
            <Text.Span style={styles.heroSubtitle}>
              Q2 snapshot: growth is ahead of plan
            </Text.Span>
          </Text.P>
        </Shape>

        <Row align="start">
          <Stack grow={3.05}>
            <Shape preset="roundRect" style={styles.card} />
            <Align
              x="center"
              y="start"
              padding={{ top: u.in(0.18) }}
              w={u.in(2.75)}
              h={u.in(0.32)}
            >
              <TextBox>
                <Text.P style={{ align: "center" }}>
                  <Text.Span style={styles.cardTitle}>Pipeline</Text.Span>
                </Text.P>
              </TextBox>
            </Align>
            <Align
              x="center"
              y="start"
              padding={{ top: u.in(0.55) }}
              w={u.in(2.75)}
              h={u.in(3.35)}
            >
              <Chart.Bar
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
            </Align>
          </Stack>

          <Stack grow={2.3}>
            <Shape preset="roundRect" style={styles.card} />
            <Align
              x="center"
              y="start"
              padding={{ top: u.in(0.2) }}
              w={u.in(1.98)}
              h={u.in(3.2)}
            >
              <Table cols={[u.in(1.15), u.in(0.85)]}>
                <Table.Row height={u.in(0.44)}>
                  <Table.Cell style={styles.headCell}>
                    <Text.Span style={styles.headText}>Metric</Text.Span>
                  </Table.Cell>
                  <Table.Cell style={styles.headCell}>
                    <Text.Span style={styles.headText}>Value</Text.Span>
                  </Table.Cell>
                </Table.Row>
                <Table.Row height={u.in(0.44)}>
                  <Table.Cell style={styles.cell}>
                    <Text.Span style={styles.metricText}>Revenue</Text.Span>
                  </Table.Cell>
                  <Table.Cell style={styles.cell}>
                    <Text.Span style={styles.metricText}>$1.2M</Text.Span>
                  </Table.Cell>
                </Table.Row>
                <Table.Row height={u.in(0.44)}>
                  <Table.Cell style={styles.cell}>
                    <Text.Span style={styles.metricText}>Growth</Text.Span>
                  </Table.Cell>
                  <Table.Cell style={styles.cell}>
                    <Text.Span style={styles.metricText}>15%</Text.Span>
                  </Table.Cell>
                </Table.Row>
                <Table.Row height={u.in(0.44)}>
                  <Table.Cell style={styles.cell}>
                    <Text.Span style={styles.metricText}>NPS</Text.Span>
                  </Table.Cell>
                  <Table.Cell style={styles.cell}>
                    <Text.Span style={styles.metricText}>61</Text.Span>
                  </Table.Cell>
                </Table.Row>
              </Table>
            </Align>
          </Stack>

          <Stack grow={2.9}>
            <Shape preset="roundRect" style={styles.card} />
            <Align
              x="center"
              y="start"
              padding={{ top: u.in(0.2) }}
              w={u.in(2.58)}
              h={u.in(3)}
            >
              <TextBox gap={u.in(0.08)}>
                <Text.P>
                  <Text.Span style={styles.cardTitle}>Notes</Text.Span>
                </Text.P>
                <Text.P style={styles.bullet}>
                  <Text.Span style={styles.body}>
                    Highlights and next steps
                  </Text.Span>
                </Text.P>
                <Text.P style={styles.bullet}>
                  <Text.Span style={styles.body}>
                    Review pricing experiments
                  </Text.Span>
                </Text.P>
                <Text.P style={styles.bullet}>
                  <Text.Span style={styles.body}>
                    Expand onboarding capacity
                  </Text.Span>
                </Text.P>
              </TextBox>
            </Align>
          </Stack>
        </Row>
      </Column>
    </Slide>
  </Presentation>
);

if (import.meta.main) {
  const path = new URL("./quarterly-review.pptx", import.meta.url);
  Deno.writeFileSync(path, generate(deck));
}
