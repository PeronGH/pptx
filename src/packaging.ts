/**
 * OPC packaging: assembles OOXML parts into a ZIP (PPTX file).
 *
 * ECMA-376 Part 2 defines the Open Packaging Conventions; clauses 6 and 7
 * cover the abstract and physical package models used here.
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
  type SlideBackground,
  type SlideRef,
  type SlideShape,
} from "./ooxml/mod.ts";

/** Encode a string to UTF-8 bytes. */
function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** An image resource to embed in the package. */
export interface ImageResource {
  readonly data: Uint8Array;
  /** File extension without dot, e.g. "png", "jpeg". */
  readonly extension: string;
  /** Content type MIME, e.g. "image/png". */
  readonly contentType: string;
}

/** A hyperlink target. */
export interface HyperlinkResource {
  readonly url: string;
}

/** A slide definition for packaging. */
export interface PackageSlide {
  readonly shapes: ReadonlyArray<SlideShape>;
  readonly background?: SlideBackground;
  /** Images referenced by shapes on this slide. Map from rId to resource. */
  readonly images?: ReadonlyMap<string, ImageResource>;
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

  // Track image extensions for content type defaults
  const imageExtensions = new Set<string>();

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
  let mediaCounter = 0;

  for (let i = 0; i < options.slides.length; i++) {
    const slide = options.slides[i];
    if (!slide) continue;

    files[`ppt/slides/slide${i + 1}.xml`] = encode(
      renderSlide(slide.shapes, slide.background),
    );

    // Build per-slide relationships
    const slideRelGen = new RelationshipIdGenerator();
    const slideRels: Relationship[] = [];

    // Layout relationship (always first)
    slideRels.push({
      id: slideRelGen.next(),
      type: REL_TYPE.slideLayout,
      target: "../slideLayouts/slideLayout1.xml",
    });

    // Image relationships and media files
    if (slide.images) {
      for (const [rId, img] of slide.images) {
        mediaCounter++;
        const mediaPath = `ppt/media/image${mediaCounter}.${img.extension}`;
        files[mediaPath] = img.data;
        imageExtensions.add(img.extension);

        // The rId was pre-assigned by the API layer, but we need to
        // ensure it matches what was assigned by the slide rel generator.
        // We skip the generator for pre-assigned IDs.
        slideRels.push({
          id: rId,
          type: REL_TYPE.image,
          target: `../media/image${mediaCounter}.${img.extension}`,
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

  // Add image extension defaults to content types
  for (const ext of imageExtensions) {
    const ct = imageContentType(ext);
    defaults.push({ extension: ext, contentType: ct });
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

/** Map image file extension to MIME content type. */
function imageContentType(ext: string): string {
  switch (ext.toLowerCase()) {
    case "png":
      return "image/png";
    case "jpeg":
    case "jpg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    case "tiff":
    case "tif":
      return "image/tiff";
    case "svg":
      return "image/svg+xml";
    default:
      return `image/${ext}`;
  }
}
