# R5-R7 completion and review record

## R5 verified primitive subset

The ten verified primitives now have a dedicated audit/render boundary: Button, Badge, Alert, Card, Input, Textarea, Select, Checkbox, Toggle, and Progress. Tests require each component to render its pinned official root class, retain a stable structural signature, reject unnamed controls, and reject invalid progress ranges. This complements the exact daisyUI 5.7.50 and Tailwind CSS 4.1.17 selector gate from R4.

Limit: axe-core and screenshot execution still require a fully installed browser-test environment. The package-level semantic audit is not represented as a replacement for axe or Playwright.

## R6 typed compound components

Typed provider parts replace delimiter text as the target model:

- `menu-item`
- `tab-item` with linked tab and tabpanel IDs
- `accordion-item` using native `details` and `summary`
- `table-head`, `table-body`, `table-row`, `table-header-cell`, `table-cell`
- `carousel-item`

`migrateLegacyItems()` converts old line-based Menu, Tabs, Accordion, and Carousel content to typed child nodes with deterministic IDs. The provider renderer recognizes compound parts and receives already-rendered EmVB children, so rich nested content remains possible.

## R7 runtime and preview separation

`nodeForRender()` strips transient `open`, `active`, `checked`, and `current` values. Editor preview state is applied only from render context. `serializableNode()` removes transient state recursively before persistence. Public `defaultOpen` remains an explicit authored default.

The minimal runtime uses native dialog `showModal()` and `close()` methods through delegated commands. It does not introduce React or another client framework. The provider API render contract now carries `mode` and optional preview state.

## Review gates completed

- Provider API tests.
- Full daisyUI package tests.
- R5 primitive semantic tests.
- R6 typed-part and legacy-migration tests.
- R7 persistence/preview/runtime tests.
- Browser-target package build.
- Source formatting check.
- Git object and bundle verification.

## Required host/browser follow-up

After `bun install`, CI must additionally run the official compiled-CSS CLI, axe-core against rendered fixtures, and Playwright keyboard/focus/screenshots at 375, 768, and 1280 CSS pixels. These external gates cannot be simulated by package unit tests and remain release requirements.
