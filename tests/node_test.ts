import { assertEquals } from "@std/assert/equals";
import { validate } from "./helpers.ts";

Deno.test("e2e: the library runs under Node without JSX", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const bundle = `${dir}/smoke.mjs`;
    const built = await new Deno.Command(Deno.execPath(), {
      args: [
        "bundle",
        "--quiet",
        "--config",
        new URL("../deno.json", import.meta.url).pathname,
        "--output",
        bundle,
        new URL("./fixtures/node/smoke.ts", import.meta.url).pathname,
      ],
      stderr: "piped",
    }).output();
    assertEquals(built.code, 0, new TextDecoder().decode(built.stderr));

    const imperative = `${dir}/imperative.pptx`;
    const declarative = `${dir}/declarative.pptx`;
    const ran = await new Deno.Command("node", {
      args: [bundle, imperative, declarative],
      stderr: "piped",
    }).output();
    assertEquals(ran.code, 0, new TextDecoder().decode(ran.stderr));

    const result = await validate(imperative, 1);
    assertEquals(result.slides[0]?.shapes[0]?.text, "Hello from Node");
    assertEquals(result.slides[0]?.shapes[1]?.is_chart, true);
    await validate(declarative, 1);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
