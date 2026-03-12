/**
 * OOXML namespace URIs and prefixes.
 *
 * PresentationML and DrawingML namespace URIs come from the Part 1 schemas.
 * Package-wide namespaces come from ECMA-376 Part 2 Annex E.1.
 */

/** PresentationML main namespace. */
export const NS_P =
  "http://schemas.openxmlformats.org/presentationml/2006/main";

/** DrawingML main namespace. */
export const NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main";

/** Office document relationships namespace. */
export const NS_R =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

/** Package relationships namespace. ECMA-376 Part 2 Annex E.1. */
export const NS_PKG_REL =
  "http://schemas.openxmlformats.org/package/2006/relationships";

/** Content types namespace. ECMA-376 Part 2 Annex E.1. */
export const NS_CONTENT_TYPES =
  "http://schemas.openxmlformats.org/package/2006/content-types";

/** Core properties namespace. */
export const NS_CP =
  "http://schemas.openxmlformats.org/package/2006/metadata/core-properties";

/** Dublin Core namespace. */
export const NS_DC = "http://purl.org/dc/elements/1.1/";

/** Dublin Core Terms namespace. */
export const NS_DCTERMS = "http://purl.org/dc/terms/";

/** Dublin Core Type namespace. */
export const NS_DCMITYPE = "http://purl.org/dc/dcmitype/";

/** XML Schema Instance namespace. */
export const NS_XSI = "http://www.w3.org/2001/XMLSchema-instance";

/** Extended properties namespace. */
export const NS_EP =
  "http://schemas.openxmlformats.org/officeDocument/2006/extended-properties";

/** Extended properties VT namespace. */
export const NS_VT =
  "http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes";

/**
 * Relationship type URIs used by PPTX parts.
 * Package-wide types are listed in ECMA-376 Part 2 Annex E.3; PresentationML-
 * specific ones are defined by the corresponding Part 1 part clauses.
 */
export const REL_TYPE = {
  officeDocument:
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
  coreProperties:
    "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties",
  extendedProperties:
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties",
  slide:
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide",
  slideMaster:
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster",
  slideLayout:
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout",
  theme:
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme",
  presProps:
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps",
  viewProps:
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps",
  tableStyles:
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles",
  image:
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
  hyperlink:
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
} as const;

/**
 * Content type strings for PPTX parts.
 * See the corresponding Part 1 part clauses and ECMA-376 Part 2 Annex E.2.
 */
export const CONTENT_TYPE = {
  presentation:
    "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
  slide:
    "application/vnd.openxmlformats-officedocument.presentationml.slide+xml",
  slideMaster:
    "application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml",
  slideLayout:
    "application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml",
  theme: "application/vnd.openxmlformats-officedocument.theme+xml",
  presProps:
    "application/vnd.openxmlformats-officedocument.presentationml.presProps+xml",
  viewProps:
    "application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml",
  tableStyles:
    "application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml",
  coreProperties: "application/vnd.openxmlformats-package.core-properties+xml",
  extendedProperties:
    "application/vnd.openxmlformats-officedocument.extended-properties+xml",
  relationships: "application/vnd.openxmlformats-package.relationships+xml",
  xml: "application/xml",
} as const;
