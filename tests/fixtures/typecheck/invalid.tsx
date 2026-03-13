/** @jsxImportSource @pixel/pptx */

import {
  Align,
  Chart,
  Image,
  Positioned,
  Presentation,
  Row,
  Slide,
  TextBox,
  u,
} from "../../../mod.ts";

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
  // @ts-expect-error Absolute placement now belongs to Positioned, not TextBox props
  <TextBox x={u.in(1)} y={u.in(1)}>
    Partial frame
  </TextBox>
);

void (
  // @ts-expect-error push has been removed in favor of Row.End/Column.End slots
  <TextBox basis={u.in(1)} push="end">
    Wrong API
  </TextBox>
);

void (
  // @ts-expect-error Align still requires children
  <Align x="center" y="center" />
);

void (
  // @ts-expect-error Image is self-closing and does not accept children
  <Image data={new Uint8Array()} contentType="image/png">
    Wrong child
  </Image>
);

void (
  // @ts-expect-error category must reference a string field
  <Chart.Bar data={pipeline} category="amount" value="amount" />
);

void (
  // @ts-expect-error value must reference a numeric field
  <Chart.Bar data={pipeline} category="quarter" value="quarter" />
);

void (
  <Presentation>
    <Slide>
      <Row>
        <Row.End>
          <Positioned x={u.in(1)} y={u.in(1)} w={u.in(1)} h={u.in(1)}>
            <TextBox>Wrong place</TextBox>
          </Positioned>
        </Row.End>
      </Row>
    </Slide>
  </Presentation>
);
