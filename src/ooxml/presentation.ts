/**
 * Presentation part XML generation.
 *
 * ECMA-376 Part 1 §13.3.6 defines the presentation element (p:presentation).
 * This generates the main presentation.xml including slide references,
 * slide master references, and default text styles.
 */

import { el, renderXmlDocument } from "../xml.ts";
import type { Emu } from "../types.ts";
import { NS_A, NS_P, NS_R } from "./namespaces.ts";
import { slideSizeCoordinate } from "./simple_types.ts";

/** Slide reference with its relationship ID and numeric ID. */
export interface SlideRef {
  readonly id: number;
  readonly relId: string;
}

/** Generate presentation.xml. ECMA-376 §13.3.6. */
export function renderPresentation(
  slideMasterRelId: string,
  notesMasterRelId: string | undefined,
  slideRefs: ReadonlyArray<SlideRef>,
  slideWidth: Emu,
  slideHeight: Emu,
): string {
  const slideMasterIdLst = el(
    "p:sldMasterIdLst",
    {},
    el("p:sldMasterId", { id: "2147483648", "r:id": slideMasterRelId }),
  );

  const slideIdElements = slideRefs.map((ref) =>
    el("p:sldId", { id: String(ref.id), "r:id": ref.relId })
  );
  const sldIdLst = el("p:sldIdLst", {}, ...slideIdElements);

  const sldSz = el("p:sldSz", {
    cx: slideSizeCoordinate(slideWidth, "slide width (EMU)"),
    cy: slideSizeCoordinate(slideHeight, "slide height (EMU)"),
  });
  // PowerPoint's notes page: portrait 7.5in x 10in, independent of slides.
  const notesSz = el("p:notesSz", { cx: "6858000", cy: "9144000" });

  const root = el(
    "p:presentation",
    {
      "xmlns:a": NS_A,
      "xmlns:r": NS_R,
      "xmlns:p": NS_P,
      saveSubsetFonts: "1",
      autoCompressPictures: "0",
    },
    slideMasterIdLst,
    notesMasterRelId === undefined ? undefined : el(
      "p:notesMasterIdLst",
      {},
      el("p:notesMasterId", { "r:id": notesMasterRelId }),
    ),
    sldIdLst,
    sldSz,
    notesSz,
    renderDefaultTextStyle(),
  );

  return renderXmlDocument(root);
}

/**
 * Default text style. ECMA-376 Part 1 §19.2.1.8 (`p:defaultTextStyle`).
 * Provides 9 levels of text paragraph properties.
 */
function renderDefaultTextStyle() {
  const levels = [];
  const defRPr = el(
    "a:defRPr",
    { sz: "1800", kern: "1200" },
    el("a:solidFill", {}, el("a:schemeClr", { val: "tx1" })),
    el("a:latin", { typeface: "+mn-lt" }),
    el("a:ea", { typeface: "+mn-ea" }),
    el("a:cs", { typeface: "+mn-cs" }),
  );

  for (let i = 1; i <= 9; i++) {
    const marL = String((i - 1) * 457200);
    levels.push(
      el(
        `a:lvl${i}pPr`,
        {
          marL,
          algn: "l",
          defTabSz: "457200",
          rtl: "0",
          eaLnBrk: "1",
          latinLnBrk: "0",
          hangingPunct: "1",
        },
        defRPr,
      ),
    );
  }

  return el(
    "p:defaultTextStyle",
    {},
    el("a:defPPr", {}, el("a:defRPr", { lang: "en-US" })),
    ...levels,
  );
}
