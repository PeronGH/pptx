/**
 * Embedded SpreadsheetML workbook generation for chart data caches.
 */

import { zipSync } from "fflate";
import { el, renderXmlDocument } from "../xml.ts";
import {
  CONTENT_TYPE,
  NS_CONTENT_TYPES,
  NS_R,
  REL_TYPE,
} from "./namespaces.ts";
import { renderRelationships } from "./relationships.ts";

/** A single normalized chart point for workbook export. */
export interface WorkbookChartPoint {
  readonly category: string;
  readonly value: number;
}

const NS_S = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function cellRef(column: "A" | "B", row: number): string {
  return `${column}${row}`;
}

function inlineStringCell(ref: string, value: string) {
  return el(
    "c",
    { r: ref, t: "inlineStr" },
    el("is", {}, el("t", {}, value)),
  );
}

function numberCell(ref: string, value: number) {
  return el("c", { r: ref }, el("v", {}, String(value)));
}

function renderWorksheet(
  categoryHeader: string,
  seriesName: string,
  points: ReadonlyArray<WorkbookChartPoint>,
): string {
  const rows = [
    el(
      "row",
      { r: "1" },
      inlineStringCell(cellRef("A", 1), categoryHeader),
      inlineStringCell(cellRef("B", 1), seriesName),
    ),
    ...points.map((point, index) => {
      const row = index + 2;
      return el(
        "row",
        { r: String(row) },
        inlineStringCell(cellRef("A", row), point.category),
        numberCell(cellRef("B", row), point.value),
      );
    }),
  ];

  const root = el(
    "worksheet",
    { xmlns: NS_S },
    el("dimension", { ref: `A1:B${points.length + 1}` }),
    el("sheetData", {}, ...rows),
  );

  return renderXmlDocument(root);
}

function renderWorkbook(): string {
  const root = el(
    "workbook",
    {
      xmlns: NS_S,
      "xmlns:r": NS_R,
    },
    el(
      "sheets",
      {},
      el("sheet", {
        name: "Sheet1",
        sheetId: "1",
        "r:id": "rId1",
      }),
    ),
  );

  return renderXmlDocument(root);
}

function renderWorkbookContentTypes(): string {
  const root = el(
    "Types",
    { xmlns: NS_CONTENT_TYPES },
    el("Default", {
      Extension: "rels",
      ContentType: CONTENT_TYPE.relationships,
    }),
    el("Default", {
      Extension: "xml",
      ContentType: CONTENT_TYPE.xml,
    }),
    el("Override", {
      PartName: "/xl/workbook.xml",
      ContentType: CONTENT_TYPE.workbook,
    }),
    el("Override", {
      PartName: "/xl/worksheets/sheet1.xml",
      ContentType: CONTENT_TYPE.worksheet,
    }),
  );

  return renderXmlDocument(root);
}

/**
 * Create a minimal embedded `.xlsx` package for chart data.
 */
export function createEmbeddedWorkbook(
  seriesName: string,
  points: ReadonlyArray<WorkbookChartPoint>,
): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": encode(renderWorkbookContentTypes()),
    "_rels/.rels": encode(
      renderRelationships([
        {
          id: "rId1",
          type: REL_TYPE.officeDocument,
          target: "xl/workbook.xml",
        },
      ]),
    ),
    "xl/workbook.xml": encode(renderWorkbook()),
    "xl/_rels/workbook.xml.rels": encode(
      renderRelationships([
        {
          id: "rId1",
          type: REL_TYPE.worksheet,
          target: "worksheets/sheet1.xml",
        },
      ]),
    ),
    "xl/worksheets/sheet1.xml": encode(
      renderWorksheet("Category", seriesName, points),
    ),
  };

  return zipSync(files);
}
