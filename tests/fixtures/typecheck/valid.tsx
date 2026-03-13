/** @jsxImportSource @pixel/pptx */

import {
  Chart,
  generate,
  Presentation,
  Row,
  Slide,
  TextBox,
  u,
} from "../../../mod.ts";

const pipeline = [
  { quarter: "Q1", amount: 12 },
  { quarter: "Q2", amount: 18 },
] as const;

const trend = [
  { quarter: "Q1", pipeline: 12, closed: 8 },
  { quarter: "Q2", pipeline: 18, closed: 11 },
] as const;

const mix = [
  { segment: "New", value: 12 },
  { segment: "Expansion", value: 8 },
] as const;

const deck = (
  <Presentation>
    <Slide>
      <Row>
        <Row.Start>
          <TextBox basis={u.in(2)}>Left</TextBox>
        </Row.Start>
        <Row.End>
          <Chart.Bar
            basis={u.in(3)}
            h={u.in(2)}
            data={pipeline}
            category="quarter"
            title="Pipeline"
            series={[{ name: "Pipeline", value: "amount" }]}
          />
        </Row.End>
      </Row>
    </Slide>
    <Slide>
      <Chart.Line
        data={trend}
        category="quarter"
        markers
        series={[
          { name: "Pipeline", value: "pipeline" },
          { name: "Closed", value: "closed" },
        ]}
      />
      <Chart.Pie
        data={mix}
        category="segment"
        series={[{ name: "Revenue", value: "value" }]}
      />
      <Chart.Donut
        data={mix}
        category="segment"
        holeSize={60}
        series={[{ name: "Revenue", value: "value" }]}
      />
    </Slide>
  </Presentation>
);

void generate(deck);
