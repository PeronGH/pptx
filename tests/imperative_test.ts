import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import { assertThrows } from "@std/assert/throws";
import { clr, Row, Text, u } from "../mod.ts";
import { createPresentation } from "../imperative.ts";
import { createTestBmp, extractZipText, validatePptx } from "./helpers.ts";

const frame = (x: number, y: number, w: number, h: number) => ({
  x: u.in(x),
  y: u.in(y),
  w: u.in(w),
  h: u.in(h),
});

Deno.test("e2e: imperative builder covers every content type without JSX", async () => {
  const pres = createPresentation({ title: "Imperative" });

  pres.addSlide({ background: clr.hex("F7F4EE") })
    .addText("Title\nsubtitle", {
      ...frame(0.5, 0.3, 9, 1),
      style: { fontSize: u.font(28), bold: true },
    })
    .addShape("roundRect", {
      ...frame(0.5, 1.5, 4, 1),
      style: { fill: { kind: "solid", color: clr.hex("1F4E79") } },
      text: Text.P({
        style: { align: "center", fontColor: clr.hex("FFFFFF") },
        children: "In a shape",
      }),
    })
    .addImage(createTestBmp(4, 2), { ...frame(5, 1.5, 4, 2), fit: "cover" })
    .addTable(
      [
        [
          { content: "Metric", style: { bold: true } },
          { content: "Value", style: { bold: true } },
        ],
        ["Revenue", "$1.2M"],
      ],
      { ...frame(0.5, 3, 4, 1), cols: [u.in(2), u.in(2)] },
    )
    .add(
      Row({
        gap: u.in(0.2),
        children: [
          Text.P({ grow: 1, children: "Left" }),
          Text.P({ grow: 1, children: "Right" }),
        ],
      }),
      frame(0.5, 4.5, 9, 0.5),
    );

  const data = [
    { quarter: "Q1", revenue: 12, cost: 8 },
    { quarter: "Q2", revenue: 18, cost: 9 },
  ];
  pres.addSlide()
    .addBarChart({
      ...frame(0.5, 0.5, 4, 3),
      data,
      category: "quarter",
      labels: true,
      series: [{ name: "Revenue", value: "revenue" }],
    })
    .addLineChart({
      ...frame(5, 0.5, 4, 3),
      data,
      category: "quarter",
      series: [
        { name: "Revenue", value: "revenue" },
        { name: "Cost", value: "cost" },
      ],
    })
    .addPieChart({
      ...frame(0.5, 4, 4, 3),
      data,
      category: "quarter",
      series: [{ name: "Revenue", value: "revenue" }],
    })
    .addDonutChart({
      ...frame(5, 4, 4, 3),
      data,
      category: "quarter",
      holeSize: 60,
      series: [{ name: "Cost", value: "cost" }],
    });

  const pptx = pres.generate();
  const result = await validatePptx(pptx, 2);
  const [first, second] = result.slides;
  assertEquals(first?.shape_count, 6);
  assertEquals(first?.shapes[0]?.text, "Title\vsubtitle");
  assertEquals(first?.shapes[1]?.text, "In a shape");
  assertEquals(first?.shapes[2]?.is_picture, true);
  assertEquals(first?.shapes[3]?.table_data, [
    ["Metric", "Value"],
    ["Revenue", "$1.2M"],
  ]);
  assertEquals(first?.shapes[5]?.text, "Right");
  assertEquals(second?.shapes.map((shape) => shape.is_chart), [
    true,
    true,
    true,
    true,
  ]);

  const slide = extractZipText(pptx, "ppt/slides/slide1.xml");
  // Two equal rows split the 1in table height.
  assertEquals(slide.match(/<a:tr h="457200">/g)?.length, 2);
  assert(slide.includes('<a:off x="457200" y="274320"/>'));
});

Deno.test("imperative builder accepts explicit row heights and regenerates", () => {
  const pres = createPresentation();
  const slide = pres.addSlide();
  slide.addTable([["a"], ["b"]], {
    ...frame(1, 1, 2, 2),
    cols: [u.in(2)],
    rowHeights: [u.in(0.5), u.in(0.75)],
  });
  const first = extractZipText(pres.generate(), "ppt/slides/slide1.xml");
  assert(first.includes('<a:tr h="457200">'));
  assert(first.includes('<a:tr h="685800">'));

  slide.addText("later", frame(1, 4, 2, 1));
  const second = extractZipText(pres.generate(), "ppt/slides/slide1.xml");
  assert(second.includes("later"));
  assert(!first.includes("later"));
});

Deno.test("imperative builder reports invalid content at generate time", () => {
  const pres = createPresentation();
  pres.addSlide().addTable([["a", "b"], ["c"]], {
    ...frame(1, 1, 2, 2),
    cols: [u.in(1), u.in(1)],
  });
  assertThrows(
    () => pres.generate(),
    Error,
    "leaves 1 of the table's 2 columns empty",
  );
});
