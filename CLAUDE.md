# pptx — OOXML Presentation Generator for Deno

This file is institutional memory for project-specific conventions that are easy
to miss by only reading the code.

Update this file only when one of these changes:

- source-of-truth or reference policy
- architecture boundaries or public API direction
- validation or release workflow
- project conventions that future agents would otherwise keep only in their head

Do not add:

- one-off implementation notes
- change summaries or recent-refactor details
- facts that are obvious from the code, tests, or `deno.json`

## Source of truth

- Use the local OOXML bundle in `.spec/` first (gitignored; create it with
  `scripts/fetch-spec`). It holds ECMA-376 parts 1-4 as PDF and grep-able text,
  plus the Strict, Transitional, and OPC schemas.
- Treat ECMA-376 and ISO/IEC 29500 as authoritative.
- Use Microsoft implementation notes and Open XML SDK as secondary references.
- Use `python-pptx` only for structural validation.
- Use PptxGenJS only as a compatibility reference when the spec is ambiguous.
- If a needed reference is missing from the bundle, stop and ask.

## Design constraints

- Keep the library Deno-native and JSR-publishable, and keep library code
  runtime-agnostic (no `Deno.*` outside tests and scripts) so it runs on Node.
  `tests/node_test.ts` enforces this.
- Push correctness into the type system as far as practical so invalid states
  are hard to represent and runtime failures stay exceptional.
- Do not build XML with string concatenation.
- Generate relationship IDs from the content graph.
- Do not add external theme support.
- Assume PowerPoint/LibreOffice own text wrapping and autofit inside text
  bodies; this library owns sibling layout, resource relationships, and OOXML
  correctness.

## Architecture

- Keep the layers separate: DSL, layout, scene, OOXML/package.
- The scene layer is internal. `<Positioned>` is the public escape hatch for
  absolute placement.
- Do not expose raw OOXML or raw XML injection publicly.
- Plain data types shared by the DSL and the writer (fills, lines, shadows,
  insets, chart definitions) are defined once in `src/ooxml/` and re-exported by
  the DSL; do not mirror them.
- Emit every numeric OOXML attribute through `src/ooxml/simple_types.ts`, which
  mirrors the XSD simple-type ranges. Spec enumerations used in the public API
  live in `src/ooxml/enums.ts`, copied from the schemas.

## Public API

- Keep the API declarative.
- Keep the public authoring surface JSX-first via Deno's automatic JSX runtime.
- Keep the public authoring surface component-based; do not expose public
  lowercase intrinsic JSX tags.
- Do not reintroduce the old function-builder DSL publicly.
- `@pixel/pptx/imperative` is the only non-JSX authoring surface. It must only
  build component elements (no second model, no direct writer calls), derive its
  option types from component props, and stay secondary in the docs.
- Keep layout inference spec-safe: infer from container geometry, flex/grow,
  defaults, and intrinsic non-text metadata, but do not add text-measurement
  heuristics that try to predict Office wrapping/autofit.
- Prefer positionless leaves plus layout containers over absolute coordinates.
- Keep the root surface small and focused on slide-building.
- Prefer plain typed objects for styles and other declarative data instead of
  public builder helpers.
- Prefer a single unified style prop over separate props for each style level.
- Use `padding` (not `inset`) for internal spacing on all components.
- Keep branded types (`Emu`, `HexColor`, etc.) — TypeScript cannot validate 6
  hex digits via template literals (exceeds the union expansion limit).
- Break the API freely when the abstraction is wrong.

## Validation

Run before every commit:

```bash
deno check mod.ts
deno lint
deno fmt --check
deno task test
deno publish --dry-run
```

- Add tests for every new behavior, not just regressions. If a feature ships
  without a test that exercises it directly, the feature is incomplete.
- Every PPTX-producing test must validate ZIP, OPC structure, ECMA-376 XSDs,
  Open XML SDK, `python-pptx` round-trip, and LibreOffice conversion (all via
  `scripts/validate.py`).
- Any intentional runtime throw, assertion, or type/lint suppression must carry
  a brief justification explaining why the invariant cannot be enforced
  statically or at the validation boundary.
- Use `scripts/python3` for Python validation, `scripts/libreoffice` for
  LibreOffice invocation, and `scripts/openxml-validate` for the Open XML SDK.
- If `python-pptx`, `lxml`, LibreOffice, `dotnet`, `node`, fonts, or rasterizer
  tools are missing, stop and ask the user to install them.
- After large layout, styling, or public API changes, do a manual visual check
  by generating a complex deck, converting it with LibreOffice, rasterizing it,
  and inspecting the images.

## Release and docs

- Bump `deno.json` for user-facing changes on `main`.
- Treat breaking API changes as version-bump-worthy in the same batch.
- Use `deno publish --dry-run --allow-dirty` during iteration; the final
  pre-commit verification should pass on a clean tree.
- Keep the README aligned with the actual public API.
