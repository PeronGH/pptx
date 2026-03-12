/**
 * Default Office Theme XML generation.
 *
 * ECMA-376 Part 1 §20.1.6.9 (a:theme) defines the theme element.
 * This generates a minimal Office Theme compatible with the reference PPTX
 * produced by python-pptx, following the standard color scheme, font scheme,
 * and format scheme.
 */

import { el, renderXmlDocument } from "../xml.ts";
import { NS_A } from "./namespaces.ts";

/** Generate the default Office Theme. ECMA-376 §20.1.6.9. */
export function renderTheme(): string {
  const root = el(
    "a:theme",
    { "xmlns:a": NS_A, name: "Office Theme" },
    el(
      "a:themeElements",
      {},
      renderColorScheme(),
      renderFontScheme(),
      renderFmtScheme(),
    ),
    el(
      "a:objectDefaults",
      {},
      el(
        "a:spDef",
        {},
        el("a:spPr", {}),
        el("a:bodyPr", {}),
        el("a:lstStyle", {}),
        el(
          "a:style",
          {},
          el("a:lnRef", { idx: "1" }, el("a:schemeClr", { val: "accent1" })),
          el("a:fillRef", { idx: "3" }, el("a:schemeClr", { val: "accent1" })),
          el(
            "a:effectRef",
            { idx: "2" },
            el("a:schemeClr", { val: "accent1" }),
          ),
          el(
            "a:fontRef",
            { idx: "minor" },
            el("a:schemeClr", { val: "lt1" }),
          ),
        ),
      ),
    ),
    el("a:extraClrSchemeLst", {}),
  );

  return renderXmlDocument(root);
}

/** Color scheme. ECMA-376 §20.1.6.2. */
function renderColorScheme() {
  return el(
    "a:clrScheme",
    { name: "Office" },
    el("a:dk1", {}, el("a:sysClr", { val: "windowText", lastClr: "000000" })),
    el("a:lt1", {}, el("a:sysClr", { val: "window", lastClr: "FFFFFF" })),
    el("a:dk2", {}, el("a:srgbClr", { val: "1F497D" })),
    el("a:lt2", {}, el("a:srgbClr", { val: "EEECE1" })),
    el("a:accent1", {}, el("a:srgbClr", { val: "4F81BD" })),
    el("a:accent2", {}, el("a:srgbClr", { val: "C0504D" })),
    el("a:accent3", {}, el("a:srgbClr", { val: "9BBB59" })),
    el("a:accent4", {}, el("a:srgbClr", { val: "8064A2" })),
    el("a:accent5", {}, el("a:srgbClr", { val: "4BACC6" })),
    el("a:accent6", {}, el("a:srgbClr", { val: "F79646" })),
    el("a:hlink", {}, el("a:srgbClr", { val: "0000FF" })),
    el("a:folHlink", {}, el("a:srgbClr", { val: "800080" })),
  );
}

/** Font scheme. ECMA-376 §20.1.6.5. */
function renderFontScheme() {
  return el(
    "a:fontScheme",
    { name: "Office" },
    el(
      "a:majorFont",
      {},
      el("a:latin", { typeface: "Calibri" }),
      el("a:ea", { typeface: "" }),
      el("a:cs", { typeface: "" }),
    ),
    el(
      "a:minorFont",
      {},
      el("a:latin", { typeface: "Calibri" }),
      el("a:ea", { typeface: "" }),
      el("a:cs", { typeface: "" }),
    ),
  );
}

/** Format scheme. ECMA-376 §20.1.4.1.14. */
function renderFmtScheme() {
  return el(
    "a:fmtScheme",
    { name: "Office" },
    el(
      "a:fillStyleLst",
      {},
      el("a:solidFill", {}, el("a:schemeClr", { val: "phClr" })),
      el(
        "a:gradFill",
        { rotWithShape: "1" },
        el(
          "a:gsLst",
          {},
          el(
            "a:gs",
            { pos: "0" },
            el(
              "a:schemeClr",
              { val: "phClr" },
              el("a:tint", { val: "50000" }),
              el("a:satMod", { val: "300000" }),
            ),
          ),
          el(
            "a:gs",
            { pos: "35000" },
            el(
              "a:schemeClr",
              { val: "phClr" },
              el("a:tint", { val: "37000" }),
              el("a:satMod", { val: "300000" }),
            ),
          ),
          el(
            "a:gs",
            { pos: "100000" },
            el(
              "a:schemeClr",
              { val: "phClr" },
              el("a:tint", { val: "15000" }),
              el("a:satMod", { val: "350000" }),
            ),
          ),
        ),
        el("a:lin", { ang: "16200000", scaled: "1" }),
      ),
      el(
        "a:gradFill",
        { rotWithShape: "1" },
        el(
          "a:gsLst",
          {},
          el(
            "a:gs",
            { pos: "0" },
            el(
              "a:schemeClr",
              { val: "phClr" },
              el("a:tint", { val: "100000" }),
              el("a:shade", { val: "100000" }),
              el("a:satMod", { val: "130000" }),
            ),
          ),
          el(
            "a:gs",
            { pos: "100000" },
            el(
              "a:schemeClr",
              { val: "phClr" },
              el("a:tint", { val: "50000" }),
              el("a:shade", { val: "100000" }),
              el("a:satMod", { val: "350000" }),
            ),
          ),
        ),
        el("a:lin", { ang: "16200000", scaled: "0" }),
      ),
    ),
    el(
      "a:lnStyleLst",
      {},
      el(
        "a:ln",
        { w: "9525", cap: "flat", cmpd: "sng", algn: "ctr" },
        el(
          "a:solidFill",
          {},
          el(
            "a:schemeClr",
            { val: "phClr" },
            el("a:shade", { val: "95000" }),
            el("a:satMod", { val: "105000" }),
          ),
        ),
        el("a:prstDash", { val: "solid" }),
      ),
      el(
        "a:ln",
        { w: "25400", cap: "flat", cmpd: "sng", algn: "ctr" },
        el("a:solidFill", {}, el("a:schemeClr", { val: "phClr" })),
        el("a:prstDash", { val: "solid" }),
      ),
      el(
        "a:ln",
        { w: "38100", cap: "flat", cmpd: "sng", algn: "ctr" },
        el("a:solidFill", {}, el("a:schemeClr", { val: "phClr" })),
        el("a:prstDash", { val: "solid" }),
      ),
    ),
    el(
      "a:effectStyleLst",
      {},
      el(
        "a:effectStyle",
        {},
        el(
          "a:effectLst",
          {},
          el(
            "a:outerShdw",
            {
              blurRad: "40000",
              dist: "20000",
              dir: "5400000",
              rotWithShape: "0",
            },
            el(
              "a:srgbClr",
              { val: "000000" },
              el("a:alpha", { val: "38000" }),
            ),
          ),
        ),
      ),
      el(
        "a:effectStyle",
        {},
        el(
          "a:effectLst",
          {},
          el(
            "a:outerShdw",
            {
              blurRad: "40000",
              dist: "23000",
              dir: "5400000",
              rotWithShape: "0",
            },
            el(
              "a:srgbClr",
              { val: "000000" },
              el("a:alpha", { val: "35000" }),
            ),
          ),
        ),
      ),
      el(
        "a:effectStyle",
        {},
        el(
          "a:effectLst",
          {},
          el(
            "a:outerShdw",
            {
              blurRad: "40000",
              dist: "23000",
              dir: "5400000",
              rotWithShape: "0",
            },
            el(
              "a:srgbClr",
              { val: "000000" },
              el("a:alpha", { val: "35000" }),
            ),
          ),
        ),
        el(
          "a:scene3d",
          {},
          el(
            "a:camera",
            { prst: "orthographicFront" },
            el("a:rot", { lat: "0", lon: "0", rev: "0" }),
          ),
          el(
            "a:lightRig",
            { rig: "threePt", dir: "t" },
            el("a:rot", { lat: "0", lon: "0", rev: "1200000" }),
          ),
        ),
        el("a:sp3d", {}, el("a:bevelT", { w: "63500", h: "25400" })),
      ),
    ),
    el(
      "a:bgFillStyleLst",
      {},
      el("a:solidFill", {}, el("a:schemeClr", { val: "phClr" })),
      el(
        "a:gradFill",
        { rotWithShape: "1" },
        el(
          "a:gsLst",
          {},
          el(
            "a:gs",
            { pos: "0" },
            el(
              "a:schemeClr",
              { val: "phClr" },
              el("a:tint", { val: "40000" }),
              el("a:satMod", { val: "350000" }),
            ),
          ),
          el(
            "a:gs",
            { pos: "40000" },
            el(
              "a:schemeClr",
              { val: "phClr" },
              el("a:tint", { val: "45000" }),
              el("a:shade", { val: "99000" }),
              el("a:satMod", { val: "350000" }),
            ),
          ),
          el(
            "a:gs",
            { pos: "100000" },
            el(
              "a:schemeClr",
              { val: "phClr" },
              el("a:shade", { val: "20000" }),
              el("a:satMod", { val: "255000" }),
            ),
          ),
        ),
        el(
          "a:path",
          { path: "circle" },
          el("a:fillToRect", {
            l: "50000",
            t: "-80000",
            r: "50000",
            b: "180000",
          }),
        ),
      ),
      el(
        "a:gradFill",
        { rotWithShape: "1" },
        el(
          "a:gsLst",
          {},
          el(
            "a:gs",
            { pos: "0" },
            el(
              "a:schemeClr",
              { val: "phClr" },
              el("a:tint", { val: "80000" }),
              el("a:satMod", { val: "300000" }),
            ),
          ),
          el(
            "a:gs",
            { pos: "100000" },
            el(
              "a:schemeClr",
              { val: "phClr" },
              el("a:shade", { val: "30000" }),
              el("a:satMod", { val: "200000" }),
            ),
          ),
        ),
        el(
          "a:path",
          { path: "circle" },
          el("a:fillToRect", {
            l: "50000",
            t: "50000",
            r: "50000",
            b: "50000",
          }),
        ),
      ),
    ),
  );
}
