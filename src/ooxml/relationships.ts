/**
 * OPC relationship generation.
 *
 * ECMA-376 Part 2 §6.5 defines relationships and §6.5.3.3-§6.5.3.4 define
 * the `Relationships` and `Relationship` XML elements.
 * Each relationship has an Id, Type URI, and Target path.
 */

import { el, renderXmlDocument, type XmlElement } from "../xml.ts";
import { NS_PKG_REL } from "./namespaces.ts";

/** A single OPC relationship. ECMA-376 Part 2 §6.5.3.4. */
export interface Relationship {
  readonly id: string;
  readonly type: string;
  readonly target: string;
  /** External target mode for hyperlinks. ECMA-376 Part 2 §6.5.3.4. */
  readonly targetMode?: "External";
}

/** Counter-based relationship ID generator. */
export class RelationshipIdGenerator {
  #counter: number;

  constructor(start = 1) {
    this.#counter = start;
  }

  /** Generate the next relationship ID (rId1, rId2, ...). */
  next(): string {
    const id = `rId${this.#counter}`;
    this.#counter++;
    return id;
  }
}

/** Generate the XML for a .rels file. ECMA-376 Part 2 §6.5.3.3-§6.5.3.4. */
export function renderRelationships(
  relationships: ReadonlyArray<Relationship>,
): string {
  const children: XmlElement[] = relationships.map((rel) =>
    el("Relationship", {
      Id: rel.id,
      Type: rel.type,
      Target: rel.target,
      TargetMode: rel.targetMode,
    })
  );

  const root = el(
    "Relationships",
    { xmlns: NS_PKG_REL },
    ...children,
  );

  return renderXmlDocument(root);
}
