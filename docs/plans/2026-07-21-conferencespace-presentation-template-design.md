# ConferenceSpace Presentation Template Design

## Objective

Create a private, reusable Codex presentation template for ConferenceSpace progress reports, thesis presentations, and defense decks from `E:\Download\Conference Management.pptx`.

## Approved approach

Retain the complete 66-slide PowerPoint as the template reference instead of producing a reduced theme or a cleaned blank deck. This preserves the established off-white background, black typography, centered section dividers, tables, timelines, screenshots, comparison layouts, and roadmap compositions.

The template will use the display name **ConferenceSpace Progress & Thesis**. Its intended-use description will target Vietnamese ConferenceSpace progress reviews, thesis presentations, and defense-oriented decks.

## Runtime writing requirement

Whenever the template is used to create, revise, review, or translate Vietnamese slide content, the operator must invoke the `vietnamese-academic-writing` skill before drafting any visible sentence or paragraph. The dependency is mandatory for titles, body text, table text, captions, notes, and other Vietnamese academic prose.

The template instruction will preserve the source meaning, evidence, numbers, terminology, scope, and uncertainty. It will not silently rewrite or translate content outside the user's requested scope.

## Packaging and verification

The official Template Creator script will install a numbered personal skill under the Codex personal skills directory. The package will retain the original `.pptx`, use the rendered first slide as `assets/preview.png`, and include the generated manifest and agent metadata.

Verification will cover the preview image, required package files, retained reference integrity, intended-use metadata, and the mandatory Vietnamese academic-writing instruction. The original source file will remain unchanged.
