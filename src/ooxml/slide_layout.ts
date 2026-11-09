/**
 * Slide layout XML generation.
 *
 * ECMA-376 Part 1 §13.3.9 defines the slide layout element (p:sldLayout).
 * Every slide uses one "Title Only" layout. Its title placeholder inherits
 * position and text style from the master and only appears on slides that
 * contain a `<Title>`.
 */

import { el, renderXmlDocument } from "../xml.ts";
import { NS_A, NS_P } from "./namespaces.ts";

/** Generate the "Title Only" slide layout. ECMA-376 §13.3.9. */
export function renderTitleOnlySlideLayout(): string {
  const root = el(
    "p:sldLayout",
    {
      "xmlns:a": NS_A,
      "xmlns:p": NS_P,
      type: "titleOnly",
      preserve: "1",
    },
    el(
      "p:cSld",
      { name: "Title Only" },
      el(
        "p:spTree",
        {},
        el(
          "p:nvGrpSpPr",
          {},
          el("p:cNvPr", { id: "1", name: "" }),
          el("p:cNvGrpSpPr", {}),
          el("p:nvPr", {}),
        ),
        el("p:grpSpPr", {}),
        el(
          "p:sp",
          {},
          el(
            "p:nvSpPr",
            {},
            el("p:cNvPr", { id: "2", name: "Title 1" }),
            el("p:cNvSpPr", {}, el("a:spLocks", { noGrp: "1" })),
            el("p:nvPr", {}, el("p:ph", { type: "title" })),
          ),
          el("p:spPr", {}),
          el(
            "p:txBody",
            {},
            el("a:bodyPr", {}),
            el("a:lstStyle", {}),
            el("a:p", {}),
          ),
        ),
      ),
    ),
    el(
      "p:clrMapOvr",
      {},
      el("a:masterClrMapping", {}),
    ),
  );

  return renderXmlDocument(root);
}
