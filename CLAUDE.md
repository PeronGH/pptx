# pptx — OOXML Presentation Generator for Deno

## Goal

Build a correct, well-typed Deno library for generating PPTX files. The user describes a presentation declaratively; the library produces a valid Office Open XML package. The output must open without warnings in LibreOffice Impress, round-trip cleanly through `python-pptx`, and be structurally valid per ECMA-376. PowerPoint and Keynote compatibility is the intent, but the dev environment is Linux — validate against what is available.

This is a spec-first implementation. ECMA-376 and ISO/IEC 29500 are the source of truth, not existing JavaScript libraries. Do not port, reference, or imitate PptxGenJS or similar projects — their architecture is not salvageable and their patterns (string-concatenated XML, bags of optional properties, implicit nullability) are explicitly what this project avoids.

Deno-native, JSR-publishable. TypeScript strict mode with all checks enabled — `strict`, `strictNullChecks`, `noImplicitAny`, `noUncheckedIndexedAccess`. No escape hatches: zero `as any`, zero `@ts-ignore`, zero `// deno-lint-ignore`. If the types are wrong, fix the types.

Licensed MIT.

## Commands

```bash
deno check mod.ts
deno lint
deno fmt --check
deno test
deno publish --dry-run
```

All five must pass at every commit.

## Reference Materials

Before writing any code, you MUST prepare the following:

- ECMA-376 Part 1 — Fundamentals and Markup Language Reference (PresentationML §13, DrawingML §20). Download from `https://ecma-international.org/publications-and-standards/standards/ecma-376/`.
- ECMA-376 Part 2 — Open Packaging Conventions (the zip/relationship/content-type layer).
- ISO/IEC 29500 schemas (XSD and RELAX NG for the Strict variant). Download from `https://standards.iso.org/ittf/PubliclyAvailableStandards/`.
- Microsoft's implementation notes: `https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oe376/`.
- `python-pptx` source code (`https://github.com/python-openxml/python-pptx.git`). This is a well-structured, spec-aware PPTX reader/writer. Use it to understand how a correct implementation maps spec to XML. It is also the primary validation tool (see Testing below).
- `PptxGenJS` source code (`https://github.com/gitbrent/PptxGenJS.git`). Read-only reference for what OOXML output real-world consumers need. Do not imitate its architecture, patterns, or code style — the internals are string-concatenated XML with no type safety. Use it only to understand which XML structures PowerPoint actually requires when the spec is ambiguous.
- A reference PPTX: use `python-pptx` to create a minimal presentation, unzip it, and study every XML file and relationship. Keep this as a test fixture.

If any of these are missing, ask the user for them.

During implementation, reference the spec section for every element and attribute you emit. Do not guess at XML structure.

## Architecture

### Layers

Three concerns, cleanly separated:

1. **XML generation** — structured XML builder, never string concatenation. Use a real library or a typed builder that guarantees well-formed output. Every XML element maps to a typed function or object.
2. **OOXML model** — typed representation of PresentationML/DrawingML constructs (slides, shapes, text runs, charts, tables, images, relationships, content types). This is where the spec knowledge lives.
3. **Public API** — declarative surface the user interacts with. Presentation described as data, not through imperative mutation.

### Packaging

A PPTX is a ZIP containing XML parts and relationships. Use OPC (Open Packaging Conventions) correctly: `[Content_Types].xml`, `_rels/.rels`, part-level relationships. Do not hardcode relationship IDs — generate them from the content graph.

## Design Constraints

### Declarative API

The user builds a presentation description, then calls a single write function. No `slide.addText()` mutation chains. The presentation is data.

### Type-Driven

Represent OOXML constraints in the type system. If PowerPoint rejects a combination of attributes, it should not compile. Prefer discriminated unions over optional property bags. Prefer specific types (`Emu`, `HexColor`, `Percentage`) over raw primitives.

### Units

OOXML uses EMUs (English Metric Units, 914400 per inch) internally. The public API should accept inches, centimeters, or points and convert. Internal representation is always EMUs as a branded numeric type.

## Testing

### Validation Strategy

The dev environment is Linux. Do not assume Microsoft Office is installed. Two validation tools are available and both MUST be used:

1. **`python-pptx` (structural validation)** — read every generated PPTX back with `python-pptx`. Verify slide count, shape types, text content, images, and relationships survive the round-trip. Access the underlying `lxml` elements to assert exact XML structure when needed. This is the primary validation path and must run in CI.
2. **LibreOffice Impress (rendering validation)** — convert generated PPTX to PDF with `libreoffice --headless --convert-to pdf`. A successful conversion proves the file is well-formed enough for a real OOXML consumer. A failed conversion is a hard test failure. Use this for integration tests on completed features.

Every test that produces a PPTX must at minimum:

1. Verify the output is a valid ZIP.
2. Verify `[Content_Types].xml` and all `.rels` files are present and well-formed.
3. Round-trip through `python-pptx` and assert the content is intact.

Write a shared test helper (e.g. `scripts/validate.py`) that takes a PPTX path and runs both checks. Call it from Deno tests via `Deno.Command`.

### Test Format

Every test must have a doc comment:

```
/**
Short description.
Spec: ECMA-376 §X.Y.Z. (omit if implementation-specific)
*/
```

### Coverage

Add tests for every public API feature at introduction time. Not later. Not in a follow-up commit.

## Coding Standards

### File Size

Recommended maximum: 500 lines. Hard limit: 800 lines. If a file hits the limit, decompose it.

### Dependencies

Manage through `deno.json` imports. Keep the dependency set minimal: a zip library, an XML builder if needed, and standard library utilities. No kitchen-sink frameworks.

### Commits

Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`). Commit every meaningful change immediately. Each commit must pass all five commands listed above.

### Correctness Over Momentum

If an abstraction is wrong, rewrite it. Large-scale rewrites are encouraged. Layered patches are disallowed — the codebase must always look as if it was written this way from the beginning.

### No Deferred Work

Do not write TODO, FIXME, or HACK comments. If something needs doing, do it now. If it cannot be done now, it is out of scope — do not leave a marker for work that may never happen.

### Documentation

JSDoc on every public export. `deno doc` must produce useful output. The README must include a minimal working example and a feature support matrix.
