# pptx — OOXML Presentation Generator for Deno

## Goal

Build a correct, well-typed Deno library that generates valid PPTX files.
Optimize for an elegant, composable DSL on top of PPTX without fighting PPTX.
PowerPoint/LibreOffice handle text wrapping and autofit inside text bodies; this
library owns sibling layout, resource relationships, and OOXML correctness.

No external theme support is planned. Prefer composable layout and style
primitives instead.

## Source of Truth

Use the local OOXML spec bundle first.

- ECMA-376 and ISO/IEC 29500 are the source of truth.
- Use Microsoft implementation notes and Open XML SDK as secondary references.
- Use `python-pptx` as the structural validation tool, not as the design source.
- Use PptxGenJS only as a read-only compatibility reference when the spec is
  ambiguous. Do not imitate its architecture or code style.

If any needed spec or reference is missing, or the spec bundle location is not
already clear from the workspace, stop and ask the human to provide or point to
it.

## Constraints

- Deno-native, JSR-publishable, MIT.
- TypeScript strict mode with no `as any`, `@ts-ignore`, or lint ignores.
- Never build XML with string concatenation.
- Generate relationship IDs from the content graph. Do not hardcode them.

## Architecture

Keep these layers separate:

1. DSL layer: positionless authoring nodes, composable style fragments.
2. Layout layer: resolves `row`/`col`/`item` trees into positioned scene nodes.
3. Scene layer: typed absolute-position escape hatch.
4. OOXML/package layer: internal only. Owns DrawingML/PresentationML lowering,
   relationships, media, content types, and zip packaging.

Prefer the DSL by default. Use the scene layer only for exact placement or as a
narrow escape hatch. Do not expose raw OOXML or raw XML injection publicly.

## Public API Direction

- Keep the API declarative. No mutation chains like `slide.addText()`.
- Prefer positionless leaves plus layout containers over absolute coordinates in
  the main DSL.
- Keep the root surface focused on the slide-building DSL.
- Prefer short helper namespaces such as `bg.*`, `fill.*`, `tx.*`, `sty.*`,
  `u.*`, and `clr.*` over many top-level helper exports.
- Keep one canonical way to access helper constructors; do not add duplicate
  helper-only subpaths.
- Prefer first-class reusable style values created under `sty.create(...)`
  instead of mixing raw style props directly into nodes and text.
- Invalid style application should fail at type-check time. Keep style
  categories distinct so box, text, paragraph, and cell styles cannot be
  applied to the wrong targets.
- Make breaking changes freely when the abstraction is wrong. There are no users
  yet, so design quality wins over compatibility.
- Keep the public surface minimal; add escape hatches only when the DSL cannot
  express something cleanly.

## Validation

Run these before every commit:

```bash
deno check mod.ts
deno lint
deno fmt --check
deno test
deno publish --dry-run
```

Testing rules:

- Every PPTX-producing test must validate ZIP, OPC structure, `python-pptx`
  round-trip, and LibreOffice conversion.
- Use `scripts/validate.py` from Deno tests via `scripts/python3`, and invoke
  LibreOffice through `scripts/libreoffice` so `libreoffice`/`soffice`
  differences stay behind the shim.
- If a required local tool is missing (`python-pptx`, `lxml`, LibreOffice`,
  rasterizer tools), stop and ask the user to install it. Do not work around it.

After a large layout, styling, or public API change, do a manual visual check:

1. Generate a complex deck.
2. Convert it with LibreOffice.
3. Rasterize the result to images.
4. Inspect the images before calling the change good.

## Release Hygiene

- Bump `deno.json` version for user-facing changes that land on `main`.
- Treat breaking API changes as version-bump-worthy in the same batch.
- Use `deno publish --dry-run --allow-dirty` for local verification during
  iteration, but the final pre-commit check should pass on a clean tree.

## Docs

Keep the README aligned with the current public API.
It must show the real DSL shape, include a minimal working example, and keep the
feature matrix honest.

Treat this file as institutional memory for the project. When project-specific
conventions, release habits, architecture rules, or validation workflow change,
update this file in the same batch.
