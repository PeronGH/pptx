/**
 * OPC packaging: assembles OOXML parts into a ZIP (PPTX file).
 *
 * ECMA-376 Part 2 defines the Open Packaging Conventions; clauses 6 and 7
 * cover the abstract and physical package models used here.
 * A PPTX is a ZIP containing XML parts, relationships, and content types.
 */

import { zipSync } from "fflate";
import type { Emu } from "./types.ts";
import type { ImageFormat } from "./image.ts";
import {
  type ChartDefinition,
  CONTENT_TYPE,
  createEmbeddedWorkbook,
  type DefaultContentType,
  type OverrideContentType,
  REL_TYPE,
  type Relationship,
  RelationshipIdGenerator,
  renderAppProps,
  renderBlankSlideLayout,
  renderChartSpace,
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
  type SlideBackground,
  type SlideRef,
  type SlideShape,
} from "./ooxml/mod.ts";

/** Encode a string to UTF-8 bytes. */
function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** An image resource to embed in the package. */
export interface ImageResource extends ImageFormat {
  readonly data: Uint8Array;
}

/** A hyperlink target. */
export interface HyperlinkResource {
  readonly url: string;
}

/** A chart resource to embed in the package. */
export interface ChartResource {
  readonly definition: ChartDefinition;
}

/** A slide definition for packaging. */
export interface PackageSlide {
  /** Relationship ID the slide uses for its slide layout. */
  readonly layoutRelId: string;
  readonly shapes: ReadonlyArray<SlideShape>;
  readonly background?: SlideBackground;
  /** Images referenced by shapes on this slide. Map from rId to resource. */
  readonly images?: ReadonlyMap<string, ImageResource>;
  /** Charts referenced by shapes on this slide. Map from rId to resource. */
  readonly charts?: ReadonlyMap<string, ChartResource>;
  /** Hyperlinks referenced by shapes. Map from rId to resource. */
  readonly hyperlinks?: ReadonlyMap<string, HyperlinkResource>;
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
 * Assembles all parts according to OPC (ECMA-376 Part 2 clauses 6-7):
 * - [Content_Types].xml
 * - _rels/.rels
 * - ppt/presentation.xml and its relationships
 * - ppt/slides/slideN.xml and their relationships
 * - ppt/slideMasters/slideMaster1.xml and its relationships
 * - ppt/slideLayouts/slideLayout1.xml and its relationships
 * - ppt/theme/theme1.xml
 * - ppt/media/* (image files)
 * - Supporting properties files
 */
export function generatePptx(options: PackageOptions): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  const title = options.title ?? "";
  const creator = options.creator ?? "pptx-deno";

  // Media parts keyed by image bytes, so a reused image is stored once.
  const mediaParts = new Map<Uint8Array, string>();
  const imageFormats = new Map<string, ImageFormat>();
  let hasEmbeddedWorkbook = false;

  // --- Presentation-level relationships ---
  const presRelGen = new RelationshipIdGenerator();
  const presRels: Relationship[] = [];

  const slideMasterRelId = presRelGen.next();
  presRels.push({
    id: slideMasterRelId,
    type: REL_TYPE.slideMaster,
    target: "slideMasters/slideMaster1.xml",
  });

  const presPropsRelId = presRelGen.next();
  presRels.push({
    id: presPropsRelId,
    type: REL_TYPE.presProps,
    target: "presProps.xml",
  });

  presRels.push({
    id: presRelGen.next(),
    type: REL_TYPE.viewProps,
    target: "viewProps.xml",
  });

  presRels.push({
    id: presRelGen.next(),
    type: REL_TYPE.theme,
    target: "theme/theme1.xml",
  });

  presRels.push({
    id: presRelGen.next(),
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

  rootRels.push({
    id: rootRelGen.next(),
    type: REL_TYPE.officeDocument,
    target: "ppt/presentation.xml",
  });
  rootRels.push({
    id: rootRelGen.next(),
    type: REL_TYPE.coreProperties,
    target: "docProps/core.xml",
  });
  rootRels.push({
    id: rootRelGen.next(),
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
  smRels.push({
    id: smRelGen.next(),
    type: REL_TYPE.theme,
    target: "../theme/theme1.xml",
  });

  // --- Slide layout relationships ---
  const slRelGen = new RelationshipIdGenerator();
  const slRels: Relationship[] = [];
  slRels.push({
    id: slRelGen.next(),
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

  // --- Generate slide XML, relationships, and media ---
  let chartCounter = 0;

  for (const [i, slide] of options.slides.entries()) {
    files[`ppt/slides/slide${i + 1}.xml`] = encode(
      renderSlide(slide.shapes, slide.background),
    );

    const slideRels: Relationship[] = [];

    slideRels.push({
      id: slide.layoutRelId,
      type: REL_TYPE.slideLayout,
      target: "../slideLayouts/slideLayout1.xml",
    });

    if (slide.images) {
      for (const [rId, img] of slide.images) {
        let mediaName = mediaParts.get(img.data);
        if (!mediaName) {
          mediaName = `image${mediaParts.size + 1}.${img.extension}`;
          mediaParts.set(img.data, mediaName);
          files[`ppt/media/${mediaName}`] = img.data;
          imageFormats.set(img.extension, img);
        }
        slideRels.push({
          id: rId,
          type: REL_TYPE.image,
          target: `../media/${mediaName}`,
        });
      }
    }

    if (slide.charts) {
      for (const [rId, chart] of slide.charts) {
        chartCounter++;

        files[`ppt/charts/chart${chartCounter}.xml`] = encode(
          renderChartSpace(chart.definition, "rId1"),
        );
        files[`ppt/charts/_rels/chart${chartCounter}.xml.rels`] = encode(
          renderRelationships([
            {
              id: "rId1",
              type: REL_TYPE.package,
              target: `../embeddings/chart${chartCounter}.xlsx`,
            },
          ]),
        );
        files[`ppt/embeddings/chart${chartCounter}.xlsx`] =
          createEmbeddedWorkbook(
            chart.definition.categories,
            chart.definition.series,
          );
        hasEmbeddedWorkbook = true;

        overrides.push({
          partName: `/ppt/charts/chart${chartCounter}.xml`,
          contentType: CONTENT_TYPE.chart,
        });

        slideRels.push({
          id: rId,
          type: REL_TYPE.chart,
          target: `../charts/chart${chartCounter}.xml`,
        });
      }
    }

    // Hyperlink relationships
    if (slide.hyperlinks) {
      for (const [rId, link] of slide.hyperlinks) {
        slideRels.push({
          id: rId,
          type: REL_TYPE.hyperlink,
          target: link.url,
          targetMode: "External",
        });
      }
    }

    files[`ppt/slides/_rels/slide${i + 1}.xml.rels`] = encode(
      renderRelationships(slideRels),
    );
  }

  for (const format of imageFormats.values()) {
    defaults.push({
      extension: format.extension,
      contentType: format.contentType,
    });
  }
  if (hasEmbeddedWorkbook) {
    defaults.push({
      extension: "xlsx",
      contentType: CONTENT_TYPE.spreadsheetPackage,
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

  return zipSync(files);
}
