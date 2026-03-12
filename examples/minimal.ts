import {
  align,
  bg,
  clr,
  fill,
  generate,
  p,
  presentation,
  slide,
  sty,
  textbox,
  tx,
  u,
} from "../mod.ts";

const styles = sty.create({
  hero: sty.box({
    fill: fill.solid(clr.hex("1F4E79")),
    verticalAlign: "middle",
    inset: u.in(0.18),
  }),
  heroText: sty.text({
    fontSize: u.font(28),
    fontColor: clr.hex("FFFFFF"),
    bold: true,
  }),
});

export const deck = presentation(
  { title: "Hello deck" },
  slide(
    {
      background: bg.fill(
        fill.solid(clr.hex("F7F4EE")),
      ),
    },
    align(
      { x: "center", y: "center", w: u.in(6), h: u.in(1.2) },
      textbox(
        { style: styles.hero },
        p(tx.bold("Hello, world!", { style: styles.heroText })),
      ),
    ),
  ),
);

if (import.meta.main) {
  const path = new URL("./minimal.pptx", import.meta.url);
  Deno.writeFileSync(path, generate(deck));
}
