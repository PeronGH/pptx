import { assert } from "@std/assert/assert";

async function runDenoCheck(
  path: URL,
): Promise<{ success: boolean; stderr: string }> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      "check",
      "--config",
      new URL("../deno.json", import.meta.url).pathname,
      path.pathname,
    ],
    cwd: new URL("..", import.meta.url).pathname,
    stdout: "piped",
    stderr: "piped",
  }).output();

  return {
    success: output.success,
    stderr: new TextDecoder().decode(output.stderr),
  };
}

Deno.test("type fixture: valid JSX trees compile", async () => {
  const result = await runDenoCheck(
    new URL("./fixtures/typecheck/valid.tsx", import.meta.url),
  );
  assert(result.success, result.stderr);
});

Deno.test("type fixture: invalid JSX trees are rejected by TypeScript", async () => {
  const result = await runDenoCheck(
    new URL("./fixtures/typecheck/invalid.tsx", import.meta.url),
  );
  assert(result.success, result.stderr);
});
