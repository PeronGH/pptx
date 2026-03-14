/** @jsxImportSource @pixel/pptx */

import {
  Align,
  clr,
  generate,
  Presentation,
  Slide,
  type Style,
  Text,
  u,
} from "../mod.ts";

const heroStyle = {
  fill: { kind: "solid", color: clr.hex("1F4E79") },
  verticalAlign: "middle",
  padding: u.in(0.18),
  fontSize: u.font(28),
  fontColor: clr.hex("FFFFFF"),
  bold: true,
} satisfies Style;

export const deck = (
  <Presentation title="Hello deck">
    <Slide background={{ kind: "solid", color: clr.hex("F7F4EE") }}>
      <Align x="center" y="center" w={u.in(6)} h={u.in(1.2)}>
        <Text.P style={heroStyle}>Hello, world!</Text.P>
      </Align>
    </Slide>
  </Presentation>
);

if (import.meta.main) {
  const path = new URL("./minimal.pptx", import.meta.url);
  Deno.writeFileSync(path, generate(deck));
}
