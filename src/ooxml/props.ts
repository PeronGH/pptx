/**
 * Presentation properties, view properties, table styles, and document properties.
 *
 * ECMA-376 Part 1 §13.3.5 (presProps), §13.3.12 (viewPr), §20.1.4.2.27 (tblStyleLst).
 * ECMA-376 Part 2 §11.2 (core properties), §11.3 (extended properties).
 */

import { el, renderXmlDocument } from "../xml.ts";
import {
  NS_A,
  NS_CP,
  NS_DC,
  NS_DCMITYPE,
  NS_DCTERMS,
  NS_EP,
  NS_P,
  NS_VT,
  NS_XSI,
} from "./namespaces.ts";

/** Generate presProps.xml. ECMA-376 §13.3.5. */
export function renderPresProps(): string {
  const root = el(
    "p:presentationPr",
    {
      "xmlns:a": NS_A,
      "xmlns:r":
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "xmlns:p": NS_P,
    },
  );
  return renderXmlDocument(root);
}

/** Generate viewProps.xml. ECMA-376 §13.3.12. */
export function renderViewProps(): string {
  const root = el(
    "p:viewPr",
    {
      "xmlns:a": NS_A,
      "xmlns:r":
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "xmlns:p": NS_P,
    },
    el(
      "p:normalViewPr",
      {},
      el("p:restoredLeft", { sz: "15620" }),
      el("p:restoredTop", { sz: "94660" }),
    ),
    el(
      "p:slideViewPr",
      {},
      el(
        "p:cSldViewPr",
        {},
        el(
          "p:cViewPr",
          { varScale: "1" },
          el(
            "p:scale",
            {},
            el("a:sx", { n: "100", d: "100" }),
            el("a:sy", { n: "100", d: "100" }),
          ),
          el("p:origin", { x: "0", y: "0" }),
        ),
      ),
    ),
  );
  return renderXmlDocument(root);
}

/** Generate tableStyles.xml. ECMA-376 §20.1.4.2.27. */
export function renderTableStyles(): string {
  const root = el("a:tblStyleLst", {
    "xmlns:a": NS_A,
    def: "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}",
  });
  return renderXmlDocument(root);
}

/** Generate docProps/core.xml. ECMA-376 Part 2 §11.2. */
export function renderCoreProps(title: string, creator: string): string {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const root = el(
    "cp:coreProperties",
    {
      "xmlns:cp": NS_CP,
      "xmlns:dc": NS_DC,
      "xmlns:dcterms": NS_DCTERMS,
      "xmlns:dcmitype": NS_DCMITYPE,
      "xmlns:xsi": NS_XSI,
    },
    el("dc:title", {}, title),
    el("dc:creator", {}, creator),
    el("cp:revision", {}, "1"),
    el("dcterms:created", { "xsi:type": "dcterms:W3CDTF" }, now),
    el("dcterms:modified", { "xsi:type": "dcterms:W3CDTF" }, now),
  );
  return renderXmlDocument(root);
}

/** Generate docProps/app.xml. ECMA-376 Part 2 §11.3. */
export function renderAppProps(slideCount: number): string {
  const root = el(
    "Properties",
    {
      xmlns: NS_EP,
      "xmlns:vt": NS_VT,
    },
    el("TotalTime", {}, "0"),
    el("Words", {}, "0"),
    el("Application", {}, "pptx-deno"),
    el("Paragraphs", {}, "0"),
    el("Slides", {}, String(slideCount)),
    el("Notes", {}, "0"),
    el("HiddenSlides", {}, "0"),
    el("ScaleCrop", {}, "false"),
    el(
      "HeadingPairs",
      {},
      el(
        "vt:vector",
        { size: "4", baseType: "variant" },
        el("vt:variant", {}, el("vt:lpstr", {}, "Theme")),
        el("vt:variant", {}, el("vt:i4", {}, "1")),
        el("vt:variant", {}, el("vt:lpstr", {}, "Slide Titles")),
        el("vt:variant", {}, el("vt:i4", {}, String(slideCount))),
      ),
    ),
    el(
      "TitlesOfParts",
      {},
      el(
        "vt:vector",
        { size: "1", baseType: "lpstr" },
        el("vt:lpstr", {}, "Office Theme"),
      ),
    ),
    el("LinksUpToDate", {}, "false"),
    el("SharedDoc", {}, "false"),
    el("HyperlinksChanged", {}, "false"),
    el("AppVersion", {}, "16.0000"),
  );
  return renderXmlDocument(root);
}
