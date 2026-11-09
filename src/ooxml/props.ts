/**
 * Presentation properties, view properties, table styles, and document properties.
 *
 * ECMA-376 Part 1 §13.3.7 (Presentation Properties Part), §19.2.1.27
 * (`presentationPr`), §13.3.13 (View Properties Part), §19.2.2.18 (`viewPr`),
 * §14.2.9 (Table Styles Part), §20.1.4.2.27 (`tblStyleLst`),
 * §15.2.12.3 (Extended File Properties Part), and §22.2.2.21 (`Properties`).
 * ECMA-376 Part 2 §8.2-§8.3 define the Core Properties part and markup.
 */

import { el, renderXmlDocument } from "../xml.ts";
import { THEME_NAME } from "./theme.ts";
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

/** Generate presProps.xml. ECMA-376 Part 1 §13.3.7 and §19.2.1.27. */
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

/** Generate viewProps.xml. ECMA-376 Part 1 §13.3.13 and §19.2.2.18. */
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

/** Generate tableStyles.xml. ECMA-376 Part 1 §14.2.9 and §20.1.4.2.27. */
export function renderTableStyles(): string {
  const root = el("a:tblStyleLst", {
    "xmlns:a": NS_A,
    def: "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}",
  });
  return renderXmlDocument(root);
}

/** Generate docProps/core.xml. ECMA-376 Part 2 §8.2-§8.3. */
export function renderCoreProps(
  title: string | undefined,
  creator: string | undefined,
): string {
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
    title === undefined ? undefined : el("dc:title", {}, title),
    creator === undefined ? undefined : el("dc:creator", {}, creator),
    el("dcterms:created", { "xsi:type": "dcterms:W3CDTF" }, now),
    el("dcterms:modified", { "xsi:type": "dcterms:W3CDTF" }, now),
  );
  return renderXmlDocument(root);
}

/**
 * Generate docProps/app.xml. ECMA-376 Part 1 §15.2.12.3 and §22.2.2.21.
 * `HeadingPairs` counts must add up to the `TitlesOfParts` entries; the only
 * titled part this generator writes is the theme.
 */
export function renderAppProps(slideCount: number): string {
  const root = el(
    "Properties",
    {
      xmlns: NS_EP,
      "xmlns:vt": NS_VT,
    },
    el("Application", {}, "@pixel/pptx"),
    el("Slides", {}, String(slideCount)),
    el(
      "HeadingPairs",
      {},
      el(
        "vt:vector",
        { size: "2", baseType: "variant" },
        el("vt:variant", {}, el("vt:lpstr", {}, "Theme")),
        el("vt:variant", {}, el("vt:i4", {}, "1")),
      ),
    ),
    el(
      "TitlesOfParts",
      {},
      el(
        "vt:vector",
        { size: "1", baseType: "lpstr" },
        el("vt:lpstr", {}, THEME_NAME),
      ),
    ),
  );
  return renderXmlDocument(root);
}
