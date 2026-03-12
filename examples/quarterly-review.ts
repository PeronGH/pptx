import {
  align,
  bg,
  clr,
  col,
  fill,
  generate,
  item,
  p,
  presentation,
  row,
  shape,
  slide,
  stack,
  sty,
  table,
  td,
  textbox,
  tr,
  tx,
  u,
} from "../mod.ts";

const styles = sty.create({
  heroBar: sty.box({
    fill: fill.solid(clr.hex("1F4E79")),
    inset: {
      top: u.in(0.18),
      right: u.in(0.28),
      bottom: u.in(0.18),
      left: u.in(0.28),
    },
  }),
  heroTitle: sty.text({
    fontSize: u.font(24),
    fontColor: clr.hex("FFFFFF"),
    bold: true,
  }),
  heroSubtitle: sty.text({
    fontSize: u.font(11),
    fontColor: clr.hex("D9E7F5"),
  }),
  card: sty.box({
    fill: fill.solid(clr.hex("FFFFFF")),
    inset: u.in(0.14),
    shadow: sty.shadow({
      color: clr.hex("000000"),
      blur: u.emu(12000),
      distance: u.emu(4000),
      angle: 50,
      alpha: u.pct(18),
    }),
  }),
  cardTitle: sty.text({
    fontSize: u.font(14),
    fontColor: clr.hex("17324D"),
    bold: true,
  }),
  body: sty.text({
    fontSize: u.font(11),
    fontColor: clr.hex("32465A"),
  }),
  bullets: sty.para({
    bullet: sty.bullet.char("•"),
  }),
  metricHeadCell: sty.cell({
    fill: fill.solid(clr.hex("17324D")),
    padding: u.in(0.07),
    verticalAlign: "middle",
  }),
  metricCell: sty.cell({
    padding: u.in(0.07),
    verticalAlign: "middle",
  }),
  metricHeadText: sty.text({
    fontSize: u.font(11),
    fontColor: clr.hex("FFFFFF"),
    bold: true,
  }),
  metricText: sty.text({
    fontSize: u.font(11),
    fontColor: clr.hex("17324D"),
  }),
});

export const deck = presentation(
  { title: "Quarterly Review" },
  slide(
    {
      background: bg.fill(
        fill.grad(
          90,
          fill.stop(u.pct(0), clr.hex("FFF8F1")),
          fill.stop(u.pct(100), clr.hex("F2F6FB")),
        ),
      ),
    },
    col(
      {
        padding: {
          top: u.in(0.55),
          right: u.in(0.55),
          bottom: u.in(0.6),
          left: u.in(0.55),
        },
        gap: u.in(0.35),
      },
      item(
        { h: u.in(1.25) },
        shape(
          "roundRect",
          { style: styles.heroBar },
          p(tx.bold("Quarterly Review", { style: styles.heroTitle })),
          p(
            tx.run("Q2 snapshot: growth is ahead of plan", {
              style: styles.heroSubtitle,
            }),
          ),
        ),
      ),
      item(
        { h: u.in(4.45) },
        row(
          { gap: u.in(0.3), align: "start" },
          item(
            { basis: u.in(3.05), h: u.in(4.45), alignSelf: "start" },
            stack(
              shape("roundRect", { style: styles.card }),
              align(
                {
                  x: "center",
                  y: "start",
                  padding: { top: u.in(0.2) },
                  w: u.in(2.75),
                  h: u.in(0.32),
                },
                textbox(
                  p(tx.bold("Chart preview", { style: styles.cardTitle })),
                ),
              ),
              align(
                { x: "center", y: "center", w: u.in(2.75), h: u.in(2.35) },
                shape(
                  "rect",
                  { style: sty.box({ fill: fill.solid(clr.hex("2678B4")) }) },
                ),
              ),
              align(
                {
                  x: "center",
                  y: "end",
                  padding: { bottom: u.in(0.18) },
                  w: u.in(2.75),
                  h: u.in(0.48),
                },
                textbox(
                  p(
                    tx.run("Pipeline and retention trend", {
                      style: styles.body,
                    }),
                  ),
                ),
              ),
            ),
          ),
          item(
            { basis: u.in(2.3), h: u.in(4.45), alignSelf: "start" },
            stack(
              shape("roundRect", { style: styles.card }),
              align(
                {
                  x: "center",
                  y: "start",
                  padding: { top: u.in(0.2) },
                  w: u.in(1.98),
                  h: u.in(3.2),
                },
                table(
                  { cols: [u.in(1.15), u.in(0.85)] },
                  tr(
                    u.in(0.44),
                    td(
                      { style: styles.metricHeadCell },
                      p(tx.run("Metric", { style: styles.metricHeadText })),
                    ),
                    td(
                      { style: styles.metricHeadCell },
                      p(tx.run("Value", { style: styles.metricHeadText })),
                    ),
                  ),
                  tr(
                    u.in(0.44),
                    td(
                      { style: styles.metricCell },
                      p(tx.run("Revenue", { style: styles.metricText })),
                    ),
                    td(
                      { style: styles.metricCell },
                      p(tx.run("$1.2M", { style: styles.metricText })),
                    ),
                  ),
                  tr(
                    u.in(0.44),
                    td(
                      { style: styles.metricCell },
                      p(tx.run("Growth", { style: styles.metricText })),
                    ),
                    td(
                      { style: styles.metricCell },
                      p(tx.run("15%", { style: styles.metricText })),
                    ),
                  ),
                  tr(
                    u.in(0.44),
                    td(
                      { style: styles.metricCell },
                      p(tx.run("NPS", { style: styles.metricText })),
                    ),
                    td(
                      { style: styles.metricCell },
                      p(tx.run("61", { style: styles.metricText })),
                    ),
                  ),
                ),
              ),
            ),
          ),
          item(
            { basis: u.in(2.9), h: u.in(4.45), alignSelf: "start" },
            stack(
              shape("roundRect", { style: styles.card }),
              align(
                {
                  x: "center",
                  y: "start",
                  padding: { top: u.in(0.2) },
                  w: u.in(2.58),
                  h: u.in(3),
                },
                textbox(
                  p(tx.bold("Notes", { style: styles.cardTitle })),
                  p(
                    { style: styles.bullets },
                    tx.run("Highlights and next steps", { style: styles.body }),
                  ),
                  p(
                    { style: styles.bullets },
                    tx.run("Review pricing experiments", {
                      style: styles.body,
                    }),
                  ),
                  p(
                    { style: styles.bullets },
                    tx.run("Expand onboarding capacity", {
                      style: styles.body,
                    }),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  ),
);

if (import.meta.main) {
  const path = new URL("./quarterly-review.pptx", import.meta.url);
  Deno.writeFileSync(path, generate(deck));
}
