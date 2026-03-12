/**
 * OOXML namespace URIs and prefixes.
 *
 * ECMA-376 Part 1 §8.1 defines the namespace URIs for PresentationML.
 * ECMA-376 Part 1 §20.1 defines the namespace URIs for DrawingML.
 */

/** PresentationML namespace. ECMA-376 §13. */
export const NS_P =
  "http://schemas.openxmlformats.org/presentationml/2006/main";

/** DrawingML namespace. ECMA-376 §20. */
export const NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main";

/** Relationships namespace. ECMA-376 Part 2 §9.3. */
export const NS_R =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

/** Package relationships namespace. ECMA-376 Part 2 §9.3. */
export const NS_PKG_REL =
  "http://schemas.openxmlformats.org/package/2006/relationships";

/** Content types namespace. ECMA-376 Part 2 §10.1.2.2. */
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

/** Relationship type URIs. ECMA-376 Part 2 §Appendix F. */
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
} as const;

/** Content type strings for PPTX parts. ECMA-376 Part 2 §13.2.3. */
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
