/** @jsxImportSource @pixel/pptx */

import { ChartBar, generate, u } from "../../../mod.ts";

const pipeline = [
  { quarter: "Q1", amount: 12 },
  { quarter: "Q2", amount: 18 },
] as const;

const deck = (
  <presentation>
    <slide>
      <row>
        <textbox basis={u.in(2)}>Left</textbox>
        <ChartBar
          basis={u.in(3)}
          h={u.in(2)}
          push="end"
          data={pipeline}
          category="quarter"
          value="amount"
          title="Pipeline"
        />
      </row>
    </slide>
  </presentation>
);

void generate(deck);
