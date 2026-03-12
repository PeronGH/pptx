/**
 * [Content_Types].xml generation.
 *
 * ECMA-376 Part 2 §10.1.2.2 defines the Content Types stream.
 * Default elements map file extensions to content types.
 * Override elements map specific part names to content types.
 */

import { el, renderXmlDocument, type XmlElement } from "../xml.ts";
import { NS_CONTENT_TYPES } from "./namespaces.ts";

/** A Default content type mapping (by extension). */
export interface DefaultContentType {
  readonly extension: string;
  readonly contentType: string;
}

/** An Override content type mapping (by part name). */
export interface OverrideContentType {
  readonly partName: string;
  readonly contentType: string;
}

/** Generate [Content_Types].xml. ECMA-376 Part 2 §10.1.2.2.1. */
export function renderContentTypes(
  defaults: ReadonlyArray<DefaultContentType>,
  overrides: ReadonlyArray<OverrideContentType>,
): string {
  const children: XmlElement[] = [];

  for (const def of defaults) {
    children.push(
      el("Default", {
        Extension: def.extension,
        ContentType: def.contentType,
      }),
    );
  }

  for (const ovr of overrides) {
    children.push(
      el("Override", {
        PartName: ovr.partName,
        ContentType: ovr.contentType,
      }),
    );
  }

  const root = el("Types", { xmlns: NS_CONTENT_TYPES }, ...children);
  return renderXmlDocument(root);
}
