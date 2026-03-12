/**
 * Minimal slide master XML generation.
 *
 * ECMA-376 Part 1 §13.3.10 defines the slide master element (p:sldMaster).
 * We generate a minimal slide master with a single blank layout reference.
 */

import { el, renderXmlDocument } from "../xml.ts";
import { NS_A, NS_P, NS_R } from "./namespaces.ts";

/** Generate a minimal slide master. ECMA-376 §13.3.10. */
export function renderSlideMaster(layoutRelIds: ReadonlyArray<string>): string {
  const layoutRefs = layoutRelIds.map((relId) =>
    el("p:sldLayoutId", { id: String(2147483649), "r:id": relId })
  );

  const root = el(
    "p:sldMaster",
    {
      "xmlns:a": NS_A,
      "xmlns:r": NS_R,
      "xmlns:p": NS_P,
    },
    el(
      "p:cSld",
      {},
      el(
        "p:bg",
        {},
        el(
          "p:bgRef",
          { idx: "1001" },
          el("a:schemeClr", { val: "bg1" }),
        ),
      ),
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
      "p:clrMap",
      {
        bg1: "lt1",
        tx1: "dk1",
        bg2: "lt2",
        tx2: "dk2",
        accent1: "accent1",
        accent2: "accent2",
        accent3: "accent3",
        accent4: "accent4",
        accent5: "accent5",
        accent6: "accent6",
        hlink: "hlink",
        folHlink: "folHlink",
      },
    ),
    el("p:sldLayoutIdLst", {}, ...layoutRefs),
  );

  return renderXmlDocument(root);
}
