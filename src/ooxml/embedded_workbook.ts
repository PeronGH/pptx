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

/** A normalized chart series for workbook export. */
export interface WorkbookChartSeries {
  readonly name: string;
  readonly values: ReadonlyArray<number>;
}

const NS_S = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function columnName(index: number): string {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function cellRef(columnIndex: number, row: number): string {
  return `${columnName(columnIndex)}${row}`;
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
  categories: ReadonlyArray<string>,
  series: ReadonlyArray<WorkbookChartSeries>,
): string {
  const headerRow = el(
    "row",
    { r: "1" },
    inlineStringCell(cellRef(0, 1), "Category"),
    ...series.map((entry, index) =>
      inlineStringCell(cellRef(index + 1, 1), entry.name)
    ),
  );

  const dataRows = categories.map((category, index) => {
    const row = index + 2;
    return el(
      "row",
      { r: String(row) },
      inlineStringCell(cellRef(0, row), category),
      ...series.map((entry, seriesIndex) =>
        numberCell(cellRef(seriesIndex + 1, row), entry.values[index] ?? 0)
      ),
    );
  });

  const lastColumn = columnName(series.length);
  const root = el(
    "worksheet",
    { xmlns: NS_S },
    el("dimension", { ref: `A1:${lastColumn}${categories.length + 1}` }),
    el("sheetData", {}, headerRow, ...dataRows),
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
  categories: ReadonlyArray<string>,
  series: ReadonlyArray<WorkbookChartSeries>,
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
    "xl/worksheets/sheet1.xml": encode(renderWorksheet(categories, series)),
  };

  return zipSync(files);
}
