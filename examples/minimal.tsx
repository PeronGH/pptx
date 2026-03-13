/** @jsxImportSource @pixel/pptx */

import {
  Align,
  type BoxStyle,
  clr,
  generate,
  Presentation,
  Slide,
  Text,
  TextBox,
  type TextStyle,
  u,
} from "../mod.ts";

const styles = {
  hero: {
    fill: { kind: "solid", color: clr.hex("1F4E79") },
    verticalAlign: "middle",
    inset: u.in(0.18),
  } satisfies BoxStyle,
  heroText: {
    fontSize: u.font(28),
    fontColor: clr.hex("FFFFFF"),
    bold: true,
  } satisfies TextStyle,
};

export const deck = (
  <Presentation title="Hello deck">
    <Slide
      background={{
        kind: "fill",
        fill: { kind: "solid", color: clr.hex("F7F4EE") },
      }}
    >
      <Align x="center" y="center" w={u.in(6)} h={u.in(1.2)}>
        <TextBox style={styles.hero}>
          <Text.Span style={styles.heroText}>Hello, world!</Text.Span>
        </TextBox>
      </Align>
    </Slide>
  </Presentation>
);

if (import.meta.main) {
  const path = new URL("./minimal.pptx", import.meta.url);
  Deno.writeFileSync(path, generate(deck));
}
