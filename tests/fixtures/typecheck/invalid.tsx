/** @jsxImportSource @pixel/pptx */

import {
  Align,
  Chart,
  clr,
  Image,
  Positioned,
  Presentation,
  Row,
  Shape,
  Slide,
  Table,
  Text,
  u,
} from "../../../mod.ts";
import { createPresentation } from "../../../imperative.ts";

const pipeline = [
  { quarter: "Q1", amount: 12, flag: true },
] as const;

void (
  // @ts-expect-error Lowercase intrinsics are no longer part of the public JSX API
  <presentation />
);

void (
  // @ts-expect-error Lowercase spacer does not exist anymore
  <spacer />
);

void (
  // @ts-expect-error Absolute placement now belongs to Positioned, not Text.P props
  <Text.P x={u.in(1)} y={u.in(1)}>
    Partial frame
  </Text.P>
);

void (
  // @ts-expect-error push has been removed in favor of Row.End/Column.End slots
  <Text.P basis={u.in(1)} push="end">
    Wrong API
  </Text.P>
);

void (
  // @ts-expect-error Align still requires children
  <Align x="center" y="center" />
);

void (
  // @ts-expect-error Image is self-closing and does not accept children
  <Image data={new Uint8Array()}>
    Wrong child
  </Image>
);

void (
  <Chart.Bar
    data={pipeline}
    // @ts-expect-error category must reference a string field
    category="amount"
    series={[{ name: "Pipeline", value: "amount" }]}
  />
);

void (
  <Chart.Bar
    data={pipeline}
    category="quarter"
    // @ts-expect-error value must reference a numeric field
    series={[{ name: "Pipeline", value: "quarter" }]}
  />
);

void (
  <Chart.Pie
    data={pipeline}
    category="quarter"
    // @ts-expect-error pie charts accept exactly one series
    series={[
      { name: "A", value: "amount" },
      { name: "B", value: "amount" },
    ]}
  />
);

void (
  <Presentation>
    <Slide>
      <Row>
        <Row.End>
          <Positioned x={u.in(1)} y={u.in(1)} w={u.in(1)} h={u.in(1)}>
            <Text.P>Wrong place</Text.P>
          </Positioned>
        </Row.End>
      </Row>
    </Slide>
  </Presentation>
);

void (
  // @ts-expect-error preset must be an ST_ShapeType name
  <Shape preset="notAShape" />
);

void (
  // @ts-expect-error paragraph level is 0..8 (ST_TextIndentLevelType)
  <Text.P style={{ level: 9 }}>Too deep</Text.P>
);

void (
  <Text.P
    // @ts-expect-error autonum type must be an ST_TextAutonumberScheme name
    style={{ bullet: { kind: "autonum", type: "romanBogus" } }}
  >
    Wrong scheme
  </Text.P>
);

void (
  <Shape
    preset="rect"
    // @ts-expect-error gradients need at least two stops
    style={{
      fill: {
        kind: "linear-gradient",
        angle: 0,
        stops: [{ pos: u.pct(0), color: clr.hex("FF0000") }],
      },
    }}
  />
);

void (
  <Shape
    preset="rect"
    // @ts-expect-error alpha is a Percentage from u.pct, not a bare number
    style={{ fill: { kind: "solid", color: clr.hex("FF0000"), alpha: 0.5 } }}
  />
);

void (
  // @ts-expect-error tables need at least one column
  <Table cols={[]} />
);

const imperativeSlide = createPresentation().addSlide();
const at = { x: u.in(1), y: u.in(1), w: u.in(1), h: u.in(1) };

// @ts-expect-error imperative items take absolute placement, not flow props
imperativeSlide.addText("x", { ...at, grow: 1 });

// @ts-expect-error imperative shapes use the same preset names
imperativeSlide.addShape("notAShape", at);

// @ts-expect-error tables still need their column widths
imperativeSlide.addTable([["a"]], at);

imperativeSlide.addBarChart({
  ...at,
  data: pipeline,
  // @ts-expect-error chart category must reference a string field
  category: "amount",
  series: [{ name: "Pipeline", value: "amount" }],
});

imperativeSlide.addPieChart({
  ...at,
  data: pipeline,
  category: "quarter",
  // @ts-expect-error pie charts accept exactly one series
  series: [{ name: "A", value: "amount" }, { name: "B", value: "amount" }],
});

void (
  // @ts-expect-error shrink-on-overflow is unsupported (renders differ)
  <Text.P style={{ fit: "shrink-text" }}>Too long</Text.P>
);
