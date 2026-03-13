/** @jsxImportSource @pixel/pptx */

import { ChartBar, u } from "../../../mod.ts";

const pipeline = [
  { quarter: "Q1", amount: 12, flag: true },
] as const;

void (
  // @ts-expect-error Absolute placement requires x, y, w, and h together
  <textbox x={u.in(1)} y={u.in(1)}>
    Partial frame
  </textbox>
);

void (
  <row>
    {
      // @ts-expect-error Absolute placement cannot also use grow/basis metadata


        <textbox x={u.in(1)} y={u.in(1)} w={u.in(1)} h={u.in(1)} grow={1}>
          Conflict
        </textbox>

    }
  </row>
);

void (
  // @ts-expect-error <align> requires a child
  <align x="center" y="center" />
);

void (
  // @ts-expect-error <align> accepts exactly one child
  <align x="center" y="center">
    <textbox>A</textbox>
    <textbox>B</textbox>
  </align>
);

void (
  // @ts-expect-error <image> is self-closing and does not accept children
  <image data={new Uint8Array()} contentType="image/png">
    Wrong child
  </image>
);

void (
  // @ts-expect-error category must reference a string field
  <ChartBar data={pipeline} category="amount" value="amount" />
);

void (
  // @ts-expect-error value must reference a numeric field
  <ChartBar data={pipeline} category="quarter" value="quarter" />
);
