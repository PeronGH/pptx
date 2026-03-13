/** @jsxImportSource @pixel/pptx */

import { type BoxStyle, clr, generate, type TextStyle, u } from "../mod.ts";

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
  <presentation title="Hello deck">
    <slide
      background={{
        kind: "fill",
        fill: { kind: "solid", color: clr.hex("F7F4EE") },
      }}
    >
      <align x="center" y="center" w={u.in(6)} h={u.in(1.2)}>
        <textbox style={styles.hero}>
          <span style={styles.heroText}>Hello, world!</span>
        </textbox>
      </align>
    </slide>
  </presentation>
);

if (import.meta.main) {
  const path = new URL("./minimal.pptx", import.meta.url);
  Deno.writeFileSync(path, generate(deck));
}
