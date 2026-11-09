// Bundled by tests/node_test.ts and run under Node to keep the library
// runtime-agnostic. Uses both entry points without JSX.
import { writeFileSync } from "node:fs";
import process from "node:process";
import { clr, generate, Presentation, Slide, Text, u } from "../../../mod.ts";
import { createPresentation } from "../../../imperative.ts";

const [imperativePath, declarativePath] = process.argv.slice(2);
if (!imperativePath || !declarativePath) {
  throw new Error("usage: smoke.mjs <imperative.pptx> <declarative.pptx>");
}

const pres = createPresentation({ title: "Node smoke" });
pres.addSlide({ background: clr.hex("F7F4EE") })
  .addText("Hello from Node", {
    x: u.in(1),
    y: u.in(1),
    w: u.in(8),
    h: u.in(1),
    style: { fontSize: u.font(28) },
  })
  .addBarChart({
    x: u.in(1),
    y: u.in(2.5),
    w: u.in(6),
    h: u.in(4),
    data: [{ q: "Q1", v: 3 }, { q: "Q2", v: 5 }],
    category: "q",
    series: [{ name: "V", value: "v" }],
  });
writeFileSync(imperativePath, pres.generate());

writeFileSync(
  declarativePath,
  generate(
    Presentation({
      children: Slide({ children: Text.P({ children: "Declarative" }) }),
    }),
  ),
);
