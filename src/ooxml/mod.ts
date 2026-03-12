/**
 * Re-exports all OOXML generation modules.
 */
export { renderContentTypes } from "./content_types.ts";
export type {
  DefaultContentType,
  OverrideContentType,
} from "./content_types.ts";
export {
  RelationshipIdGenerator,
  renderRelationships,
} from "./relationships.ts";
export type { Relationship } from "./relationships.ts";
export { CONTENT_TYPE, NS_A, NS_P, NS_R, REL_TYPE } from "./namespaces.ts";
export { renderPresentation } from "./presentation.ts";
export type { SlideRef } from "./presentation.ts";
export { renderSlide } from "./slide.ts";
export type {
  BulletAutoNum,
  BulletChar,
  BulletNone,
  CropRect,
  Fill,
  GradientStop,
  HyperlinkInfo,
  Insets,
  LineDash,
  LineProperties,
  NoFill,
  ParagraphSpacing,
  PictureShape,
  PresetShape,
  Shadow,
  SlideBackground,
  SlideShape,
  SolidFill,
  TableCell,
  TableRow,
  TableShape,
  TextBoxShape,
  TextFit,
  TextParagraph,
  TextRun,
  VerticalAlignment,
} from "./slide.ts";
export { renderBlankSlideLayout } from "./slide_layout.ts";
export { renderSlideMaster } from "./slide_master.ts";
export { renderTheme } from "./theme.ts";
export {
  renderAppProps,
  renderCoreProps,
  renderPresProps,
  renderTableStyles,
  renderViewProps,
} from "./props.ts";
