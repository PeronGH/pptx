/**
 * Minimal slide master XML generation.
 *
 * ECMA-376 Part 1 §13.3.10 defines the slide master element (p:sldMaster).
 * We generate a slide master with a title placeholder and a single layout.
 */

import { el, renderXmlDocument } from "../xml.ts";
import type { Emu } from "../types.ts";
import { NS_A, NS_P, NS_R } from "./namespaces.ts";

/** Theme color mapping shared by the slide and notes masters (§19.3.1.6). */
export const COLOR_MAP = {
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
} as const;

/** Title text defaults inherited by `<Title>` (§19.3.1.49 `p:titleStyle`). */
const TITLE_FONT_SIZE = "3600";

/**
 * Generate the slide master (§13.3.10): a title placeholder that slide titles
 * inherit position and text style from. Its text body has no autofit, so a
 * LibreOffice render matches PowerPoint.
 */
export function renderSlideMaster(
  layoutRelIds: ReadonlyArray<string>,
  slideWidth: Emu,
): string {
  const layoutRefs = layoutRelIds.map((relId) =>
    el("p:sldLayoutId", { id: String(2147483649), "r:id": relId })
  );
  const margin = 457200;

  const title = el(
    "p:sp",
    {},
    el(
      "p:nvSpPr",
      {},
      el("p:cNvPr", { id: "2", name: "Title Placeholder 1" }),
      el("p:cNvSpPr", {}, el("a:spLocks", { noGrp: "1" })),
      el("p:nvPr", {}, el("p:ph", { type: "title" })),
    ),
    el(
      "p:spPr",
      {},
      el(
        "a:xfrm",
        {},
        el("a:off", { x: String(margin), y: String(margin / 2) }),
        el("a:ext", {
          cx: String(slideWidth - 2 * margin),
          cy: String(2 * margin),
        }),
      ),
      el("a:prstGeom", { prst: "rect" }, el("a:avLst", {})),
    ),
    el(
      "p:txBody",
      {},
      el("a:bodyPr", { wrap: "square", anchor: "t" }),
      el("a:lstStyle", {}),
      el("a:p", {}),
    ),
  );

  const titleStyle = el(
    "p:titleStyle",
    {},
    el(
      "a:lvl1pPr",
      { algn: "l", rtl: "0" },
      el("a:buNone", {}),
      el(
        "a:defRPr",
        { sz: TITLE_FONT_SIZE, kern: "1200" },
        el("a:solidFill", {}, el("a:schemeClr", { val: "tx1" })),
        el("a:latin", { typeface: "+mj-lt" }),
        el("a:ea", { typeface: "+mj-ea" }),
        el("a:cs", { typeface: "+mj-cs" }),
      ),
    ),
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
        el("p:grpSpPr", {}),
        title,
      ),
    ),
    el("p:clrMap", COLOR_MAP),
    el("p:sldLayoutIdLst", {}, ...layoutRefs),
    el("p:txStyles", {}, titleStyle),
  );

  return renderXmlDocument(root);
}
