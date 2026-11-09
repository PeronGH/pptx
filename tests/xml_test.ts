import { assertEquals } from "@std/assert/equals";
import { el, renderXml } from "../src/xml.ts";

Deno.test("renderXml drops characters that XML 1.0 forbids", () => {
  const xml = renderXml(
    el("t", { v: "a\u0001b\uFFFE" }, "x\u0000y\u000Bz\uD800!\u{1F600}"),
  );
  assertEquals(xml, '<t v="ab">xyz!\u{1F600}</t>');
});

Deno.test("renderXml escapes markup and attribute whitespace", () => {
  const xml = renderXml(el("t", { v: 'a"<&>\t\n\rb' }, "<&>\t\n"));
  assertEquals(
    xml,
    '<t v="a&quot;&lt;&amp;&gt;&#9;&#10;&#13;b">&lt;&amp;&gt;\t\n</t>',
  );
});
