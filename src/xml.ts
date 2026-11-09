/**
 * Typed XML builder that guarantees well-formed output.
 *
 * This replaces string concatenation with a structured representation.
 * Every XML element is built through typed functions, never raw strings.
 */

/** An XML element with tag name, attributes, and children. */
export interface XmlElement {
  readonly tag: string;
  readonly attrs: ReadonlyMap<string, string>;
  readonly children: ReadonlyArray<XmlElement | string>;
}

/** Create an XML element. */
export function el(
  tag: string,
  attrs: Record<string, string | number | boolean | undefined>,
  ...children: ReadonlyArray<XmlElement | string | undefined | false>
): XmlElement {
  const attrMap = new Map<string, string>();
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== false) {
      attrMap.set(key, String(value));
    }
  }
  const filteredChildren: Array<XmlElement | string> = [];
  for (const child of children) {
    if (child !== undefined && child !== false) {
      filteredChildren.push(child);
    }
  }
  return { tag, attrs: attrMap, children: filteredChildren };
}

// XML 1.0 §2.2 Char production; anything else (C0 controls other than tab/LF/CR,
// lone surrogates, U+FFFE/U+FFFF) makes the part malformed, so it is dropped.
const INVALID_XML_CHARS =
  /[^\t\n\r\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu;

/** Escape XML special characters in text content. */
function escapeXmlText(text: string): string {
  return text
    .replace(INVALID_XML_CHARS, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Escape XML special characters in attribute values. Tab, LF, and CR are
 * written as character references because attribute-value normalization
 * (XML 1.0 §3.3.3) would otherwise turn them into spaces.
 */
function escapeXmlAttr(text: string): string {
  return text
    .replace(INVALID_XML_CHARS, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\t/g, "&#9;")
    .replace(/\n/g, "&#10;")
    .replace(/\r/g, "&#13;");
}

/** Render an XML element tree to a string. */
export function renderXml(element: XmlElement): string {
  return renderNode(element);
}

function renderNode(node: XmlElement | string): string {
  if (typeof node === "string") {
    return escapeXmlText(node);
  }

  const attrStr = renderAttributes(node.attrs);
  const opening = `<${node.tag}${attrStr}`;

  if (node.children.length === 0) {
    return `${opening}/>`;
  }

  const childrenStr = node.children.map(renderNode).join("");
  return `${opening}>${childrenStr}</${node.tag}>`;
}

function renderAttributes(attrs: ReadonlyMap<string, string>): string {
  if (attrs.size === 0) return "";
  const parts: string[] = [];
  for (const [key, value] of attrs) {
    parts.push(` ${key}="${escapeXmlAttr(value)}"`);
  }
  return parts.join("");
}

/** Render a complete XML document with declaration. */
export function renderXmlDocument(root: XmlElement): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${
    renderXml(root)
  }`;
}
