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
            value="amount"
            title="Pipeline"
          />
        </Row.End>
      </Row>
    </Slide>
  </Presentation>
);

void generate(deck);
