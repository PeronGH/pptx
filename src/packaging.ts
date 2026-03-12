/**
 * OPC packaging: assembles OOXML parts into a ZIP (PPTX file).
 *
 * ECMA-376 Part 2 §9 defines the Open Packaging Conventions.
 * A PPTX is a ZIP containing XML parts, relationships, and content types.
 */

import { zipSync } from "fflate";
import type { Emu } from "./types.ts";
import {
  CONTENT_TYPE,
  type DefaultContentType,
  type OverrideContentType,
  REL_TYPE,
  type Relationship,
  RelationshipIdGenerator,
  renderAppProps,
  renderBlankSlideLayout,
  renderContentTypes,
  renderCoreProps,
  renderPresentation,
  renderPresProps,
  renderRelationships,
  renderSlide,
  renderSlideMaster,
  renderTableStyles,
  renderTheme,
  renderViewProps,
  type SlideRef,
  type SlideShape,
} from "./ooxml/mod.ts";

/** Encode a string to UTF-8 bytes. */
function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** A slide definition for packaging. */
export interface PackageSlide {
  readonly shapes: ReadonlyArray<SlideShape>;
}

/** Options for generating a PPTX package. */
export interface PackageOptions {
  readonly title?: string;
  readonly creator?: string;
  readonly slideWidth: Emu;
  readonly slideHeight: Emu;
  readonly slides: ReadonlyArray<PackageSlide>;
}

/**
 * Generate a complete PPTX file as a Uint8Array.
 *
 * Assembles all parts according to OPC (ECMA-376 Part 2):
 * - [Content_Types].xml
 * - _rels/.rels
 * - ppt/presentation.xml and its relationships
 * - ppt/slides/slideN.xml and their relationships
 * - ppt/slideMasters/slideMaster1.xml and its relationships
 * - ppt/slideLayouts/slideLayout1.xml and its relationships
 * - ppt/theme/theme1.xml
 * - Supporting properties files
 */
export function generatePptx(options: PackageOptions): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  const title = options.title ?? "";
  const creator = options.creator ?? "pptx-deno";

  // --- Presentation-level relationships ---
  const presRelGen = new RelationshipIdGenerator();
  const presRels: Relationship[] = [];

  // slideMaster
  const slideMasterRelId = presRelGen.next();
  presRels.push({
    id: slideMasterRelId,
    type: REL_TYPE.slideMaster,
    target: "slideMasters/slideMaster1.xml",
  });

  // presProps
  const presPropsRelId = presRelGen.next();
  presRels.push({
    id: presPropsRelId,
    type: REL_TYPE.presProps,
    target: "presProps.xml",
  });

  // viewProps
  const viewPropsRelId = presRelGen.next();
  presRels.push({
    id: viewPropsRelId,
    type: REL_TYPE.viewProps,
    target: "viewProps.xml",
  });

  // theme
  const themeRelId = presRelGen.next();
  presRels.push({
    id: themeRelId,
    type: REL_TYPE.theme,
    target: "theme/theme1.xml",
  });

  // tableStyles
  const tableStylesRelId = presRelGen.next();
  presRels.push({
    id: tableStylesRelId,
    type: REL_TYPE.tableStyles,
    target: "tableStyles.xml",
  });

  // Slides
  const slideRefs: SlideRef[] = [];
  for (let i = 0; i < options.slides.length; i++) {
    const relId = presRelGen.next();
    presRels.push({
      id: relId,
      type: REL_TYPE.slide,
      target: `slides/slide${i + 1}.xml`,
    });
    slideRefs.push({ id: 256 + i, relId });
  }

  // --- Root relationships (_rels/.rels) ---
  const rootRelGen = new RelationshipIdGenerator();
  const rootRels: Relationship[] = [];

  const presDocRelId = rootRelGen.next();
  rootRels.push({
    id: presDocRelId,
    type: REL_TYPE.officeDocument,
    target: "ppt/presentation.xml",
  });

  const corePropsRelId = rootRelGen.next();
  rootRels.push({
    id: corePropsRelId,
    type: REL_TYPE.coreProperties,
    target: "docProps/core.xml",
  });

  const appPropsRelId = rootRelGen.next();
  rootRels.push({
    id: appPropsRelId,
    type: REL_TYPE.extendedProperties,
    target: "docProps/app.xml",
  });

  // --- Slide master relationships ---
  const smRelGen = new RelationshipIdGenerator();
  const smRels: Relationship[] = [];
  const layoutRelId = smRelGen.next();
  smRels.push({
    id: layoutRelId,
    type: REL_TYPE.slideLayout,
    target: "../slideLayouts/slideLayout1.xml",
  });
  const smThemeRelId = smRelGen.next();
  smRels.push({
    id: smThemeRelId,
    type: REL_TYPE.theme,
    target: "../theme/theme1.xml",
  });

  // --- Slide layout relationships ---
  const slRelGen = new RelationshipIdGenerator();
  const slRels: Relationship[] = [];
  const slMasterRelId = slRelGen.next();
  slRels.push({
    id: slMasterRelId,
    type: REL_TYPE.slideMaster,
    target: "../slideMasters/slideMaster1.xml",
  });

  // --- Content types ---
  const defaults: DefaultContentType[] = [
    { extension: "rels", contentType: CONTENT_TYPE.relationships },
    { extension: "xml", contentType: CONTENT_TYPE.xml },
  ];

  const overrides: OverrideContentType[] = [
    {
      partName: "/ppt/presentation.xml",
      contentType: CONTENT_TYPE.presentation,
    },
    {
      partName: "/ppt/slideMasters/slideMaster1.xml",
      contentType: CONTENT_TYPE.slideMaster,
    },
    {
      partName: "/ppt/slideLayouts/slideLayout1.xml",
      contentType: CONTENT_TYPE.slideLayout,
    },
    { partName: "/ppt/theme/theme1.xml", contentType: CONTENT_TYPE.theme },
    { partName: "/ppt/presProps.xml", contentType: CONTENT_TYPE.presProps },
    { partName: "/ppt/viewProps.xml", contentType: CONTENT_TYPE.viewProps },
    {
      partName: "/ppt/tableStyles.xml",
      contentType: CONTENT_TYPE.tableStyles,
    },
    {
      partName: "/docProps/core.xml",
      contentType: CONTENT_TYPE.coreProperties,
    },
    {
      partName: "/docProps/app.xml",
      contentType: CONTENT_TYPE.extendedProperties,
    },
  ];

  for (let i = 0; i < options.slides.length; i++) {
    overrides.push({
      partName: `/ppt/slides/slide${i + 1}.xml`,
      contentType: CONTENT_TYPE.slide,
    });
  }

  // --- Write all files ---
  files["[Content_Types].xml"] = encode(
    renderContentTypes(defaults, overrides),
  );
  files["_rels/.rels"] = encode(renderRelationships(rootRels));
  files["ppt/presentation.xml"] = encode(
    renderPresentation(
      slideMasterRelId,
      slideRefs,
      options.slideWidth,
      options.slideHeight,
    ),
  );
  files["ppt/_rels/presentation.xml.rels"] = encode(
    renderRelationships(presRels),
  );
  files["ppt/presProps.xml"] = encode(renderPresProps());
  files["ppt/viewProps.xml"] = encode(renderViewProps());
  files["ppt/tableStyles.xml"] = encode(renderTableStyles());
  files["ppt/theme/theme1.xml"] = encode(renderTheme());
  files["ppt/slideMasters/slideMaster1.xml"] = encode(
    renderSlideMaster([layoutRelId]),
  );
  files["ppt/slideMasters/_rels/slideMaster1.xml.rels"] = encode(
    renderRelationships(smRels),
  );
  files["ppt/slideLayouts/slideLayout1.xml"] = encode(
    renderBlankSlideLayout(),
  );
  files["ppt/slideLayouts/_rels/slideLayout1.xml.rels"] = encode(
    renderRelationships(slRels),
  );
  files["docProps/core.xml"] = encode(renderCoreProps(title, creator));
  files["docProps/app.xml"] = encode(renderAppProps(options.slides.length));

  // Generate slide XML and relationships
  for (let i = 0; i < options.slides.length; i++) {
    const slide = options.slides[i];
    if (!slide) continue;

    files[`ppt/slides/slide${i + 1}.xml`] = encode(
      renderSlide(slide.shapes),
    );

    // Each slide needs a relationship to its layout
    const slideRelGen = new RelationshipIdGenerator();
    const slideRels: Relationship[] = [];
    const slideLayoutRelId = slideRelGen.next();
    slideRels.push({
      id: slideLayoutRelId,
      type: REL_TYPE.slideLayout,
      target: "../slideLayouts/slideLayout1.xml",
    });
    files[`ppt/slides/_rels/slide${i + 1}.xml.rels`] = encode(
      renderRelationships(slideRels),
    );
  }

  return zipSync(files);
}
