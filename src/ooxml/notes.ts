/**
 * Speaker notes: the notes master and per-slide notes slides.
 *
 * ECMA-376 Part 1 §13.3.4 (Notes Master Part) and §13.3.5 (Notes Slide Part).
 * The notes page is PowerPoint's portrait 7.5in x 10in (see `p:notesSz`).
 */

import { el, renderXmlDocument, type XmlElement } from "../xml.ts";
import type { Emu } from "../types.ts";
import { NS_A, NS_P, NS_R } from "./namespaces.ts";
import { COLOR_MAP } from "./slide_master.ts";

const NOTES_WIDTH = 6858000;
const NOTES_HEIGHT = 9144000;
const MARGIN = 685800;
const CONTENT_WIDTH = NOTES_WIDTH - 2 * MARGIN;

function emptyGroup(): ReadonlyArray<XmlElement> {
  return [
    el(
      "p:nvGrpSpPr",
      {},
      el("p:cNvPr", { id: "1", name: "" }),
      el("p:cNvGrpSpPr", {}),
      el("p:nvPr", {}),
    ),
    el("p:grpSpPr", {}),
  ];
}

function placeholder(
  id: number,
  name: string,
  ph: Record<string, string>,
  locks: Record<string, string>,
  spPr: XmlElement,
  txBody?: XmlElement,
): XmlElement {
  return el(
    "p:sp",
    {},
    el(
      "p:nvSpPr",
      {},
      el("p:cNvPr", { id: String(id), name }),
      el("p:cNvSpPr", {}, el("a:spLocks", locks)),
      el("p:nvPr", {}, el("p:ph", ph)),
    ),
    spPr,
    txBody,
  );
}

function frame(x: number, y: number, cx: number, cy: number): XmlElement {
  return el(
    "p:spPr",
    {},
    el(
      "a:xfrm",
      {},
      el("a:off", { x: String(x), y: String(y) }),
      el("a:ext", { cx: String(cx), cy: String(cy) }),
    ),
    el("a:prstGeom", { prst: "rect" }, el("a:avLst", {})),
  );
}

/**
 * Generate the notes master. The slide image keeps the slide's aspect ratio;
 * the notes body fills the page below it.
 */
export function renderNotesMaster(slideWidth: Emu, slideHeight: Emu): string {
  const imageTop = MARGIN;
  const imageHeight = Math.round(CONTENT_WIDTH * slideHeight / slideWidth);
  const bodyTop = imageTop + imageHeight + MARGIN / 2;
  const level1 = el(
    "a:lvl1pPr",
    { marL: "0", algn: "l", defTabSz: "914400", rtl: "0" },
    el(
      "a:defRPr",
      { sz: "1200", kern: "1200" },
      el("a:solidFill", {}, el("a:schemeClr", { val: "tx1" })),
      el("a:latin", { typeface: "+mn-lt" }),
      el("a:ea", { typeface: "+mn-ea" }),
      el("a:cs", { typeface: "+mn-cs" }),
    ),
  );

  const root = el(
    "p:notesMaster",
    { "xmlns:a": NS_A, "xmlns:r": NS_R, "xmlns:p": NS_P },
    el(
      "p:cSld",
      {},
      el(
        "p:spTree",
        {},
        ...emptyGroup(),
        placeholder(
          2,
          "Slide Image Placeholder 1",
          { type: "sldImg", idx: "2" },
          { noGrp: "1", noRot: "1", noChangeAspect: "1" },
          frame(MARGIN, imageTop, CONTENT_WIDTH, imageHeight),
        ),
        placeholder(
          3,
          "Notes Placeholder 2",
          { type: "body", sz: "quarter", idx: "3" },
          { noGrp: "1" },
          frame(
            MARGIN,
            bodyTop,
            CONTENT_WIDTH,
            NOTES_HEIGHT - bodyTop - MARGIN,
          ),
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
    el("p:clrMap", COLOR_MAP),
    el("p:notesStyle", {}, level1),
  );
  return renderXmlDocument(root);
}

/** Generate a notes slide; each line of `notes` becomes a paragraph. */
export function renderNotesSlide(notes: string): string {
  const paragraphs = notes.split(/\r\n|[\n\r]/).map((line) =>
    el("a:p", {}, line === "" ? undefined : el("a:r", {}, el("a:t", {}, line)))
  );
  const root = el(
    "p:notes",
    { "xmlns:a": NS_A, "xmlns:r": NS_R, "xmlns:p": NS_P },
    el(
      "p:cSld",
      {},
      el(
        "p:spTree",
        {},
        ...emptyGroup(),
        placeholder(
          2,
          "Slide Image Placeholder 1",
          { type: "sldImg" },
          { noGrp: "1", noRot: "1", noChangeAspect: "1" },
          el("p:spPr", {}),
        ),
        placeholder(
          3,
          "Notes Placeholder 2",
          { type: "body", idx: "1" },
          { noGrp: "1" },
          el("p:spPr", {}),
          el(
            "p:txBody",
            {},
            el("a:bodyPr", {}),
            el("a:lstStyle", {}),
            ...paragraphs,
          ),
        ),
      ),
    ),
    el("p:clrMapOvr", {}, el("a:masterClrMapping", {})),
  );
  return renderXmlDocument(root);
}
