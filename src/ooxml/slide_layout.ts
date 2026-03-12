/**
 * Minimal slide layout XML generation.
 *
 * ECMA-376 Part 1 §13.3.9 defines the slide layout element (p:sldLayout).
 * We generate a single blank layout that all slides reference. This is the
 * minimal structure required for a valid PPTX.
 */

import { el, renderXmlDocument } from "../xml.ts";
import { NS_A, NS_P } from "./namespaces.ts";

/** Generate a blank slide layout. ECMA-376 §13.3.9. */
export function renderBlankSlideLayout(): string {
  const root = el(
    "p:sldLayout",
    {
      "xmlns:a": NS_A,
      "xmlns:p": NS_P,
      type: "blank",
      preserve: "1",
    },
    el(
      "p:cSld",
      { name: "Blank" },
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
        el(
          "p:grpSpPr",
          {},
          el(
            "a:xfrm",
            {},
            el("a:off", { x: "0", y: "0" }),
            el("a:ext", { cx: "0", cy: "0" }),
            el("a:chOff", { x: "0", y: "0" }),
            el("a:chExt", { cx: "0", cy: "0" }),
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
