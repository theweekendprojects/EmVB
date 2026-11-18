# EmVB Licensed DaisyUI Template Program

## Persistent delivery plan and implementation handoff

**Document purpose:** Preserve the agreed template strategy, source candidates, architecture, delivery bundles, licensing rules, conversion standards, database format, editor behavior, and release gates for future implementation work.

**Current EmVB baseline:** Continue from the latest accepted EmVB code after WP31. Do not restart the template work from an older provider or DaisyUI branch.

---

# 1. Product decision

EmVB will provide a **DaisyUI-first template library**.

The library will contain:

- complete editable page templates
- reusable editable page blocks
- responsive previews
- template variables
- source provenance
- license and attribution records
- importable JSON packages
- database-backed gallery records

Templates must not be generic AI-generated layouts. The preferred approach is to select strong, human-designed, permissively licensed open-source templates and convert them into native EmVB/DaisyUI layouts.

AI may assist with mechanical conversion, validation, testing, documentation, and repetitive JSON generation. AI must not replace the source design with a generic recreation.

---

# 2. Core design principles

## 2.1 DaisyUI-first output

Converted templates should use DaisyUI provider nodes whenever an appropriate DaisyUI component exists.

Examples:

```text
Custom button       -> DaisyUI Button
Panel               -> DaisyUI Card
Navigation header   -> DaisyUI Navbar + Menu
Disclosure          -> DaisyUI Accordion
Dialog              -> DaisyUI Modal
Metrics              -> DaisyUI Stats
Form controls        -> DaisyUI Input, Select, Checkbox, Toggle
Data table           -> DaisyUI Table
Notification         -> DaisyUI Alert or Toast
Loading state        -> DaisyUI Loading or Skeleton
```

Use native EmVB nodes only for capabilities not represented by DaisyUI, especially:

- layout wrappers
- bindings
- conditional visibility
- loops and collections
- forms and submission behavior
- responsive style controls
- content editing
- media integration
- page metadata

## 2.2 Templates become normal EmVB content

After insertion, the user must be able to:

- edit all text
- edit links
- replace images
- change DaisyUI variants
- change the theme
- move nodes through Layers
- duplicate or delete sections
- undo and redo insertion
- save and reload
- publish without the template package remaining installed

A template must never remain a special locked runtime object.

## 2.3 Human-designed source material

A source design must be preserved meaningfully during conversion:

- section order
- spacing rhythm
- typography hierarchy
- content density
- alignment
- responsive composition
- mobile navigation
- image proportions
- distinct visual details

Do not reduce a distinctive source into a generic hero, three cards, and CTA layout.

## 2.4 Legal traceability

Every template must record:

- source project name
- original repository URL
- exact source commit or release
- source license
- copied license text
- original framework
- conversion notes
- third-party asset licenses
- required attribution
- reviewer and approval date

No template enters the published gallery without a completed provenance record.

---

# 3. Source candidates

These are candidates, not automatically approved sources. Bundle H must verify every license and asset before conversion.

## 3.1 Dashboard and application sources

### DashWind

**Intended use:**

- admin dashboard
- sidebar layouts
- statistics panels
- activity tables
- authentication screens
- settings pages

**Review requirements:**

- confirm exact repository and MIT license
- pin exact source commit
- review all images and icons separately
- upgrade DaisyUI 4 patterns to DaisyUI 5.7.50
- replace React-specific state with EmVB/DaisyUI runtime behavior

### Mosaic Lite

**Intended use:**

- analytics dashboard
- data cards
- filter bars
- activity feeds
- table layouts

**Review requirements:**

- obtain license from original repository
- separate reusable blocks from application-specific code
- replace proprietary charting or assets when redistribution is unclear

### Windmill Dashboard

**Intended use:**

- admin shell
- navigation
- cards
- tables
- account pages
- forms

**Review requirements:**

- confirm source license and current repository
- replace non-Daisy component primitives
- verify dark mode and responsive navigation

## 3.2 SaaS and startup sources

### Astroship

**Intended use:**

- SaaS landing page
- product hero
- feature sections
- CTA blocks
- footer

### Astrolus

**Intended use:**

- startup landing page
- feature grids
- social proof
- pricing blocks
- product sections

### Landwind

**Intended use:**

- product landing page
- marketing sections
- comparison layouts
- testimonial sections
- pricing

### Nextly

**Intended use:**

- startup landing page
- split heroes
- feature sections
- benefits
- CTA sections

For every source above:

- verify the original repository, not only an aggregator listing
- pin a specific commit
- verify redistribution and commercial-use rights
- audit logos, screenshots, illustrations, and fonts independently

## 3.3 Portfolio and agency sources

### Astrofy

**Intended use:**

- personal portfolio
- developer portfolio
- project listing
- experience timeline
- contact page

### Astro Sarissa

**Intended use:**

- business website
- creative site
- content-rich landing page
- service sections

### Tailwind Toolbox themes

**Intended use:**

- agency landing pages
- business sections
- portfolios
- contact blocks

**Important:** Each individual Tailwind Toolbox source requires its own repository and license review. Do not approve the entire catalog as one source.

## 3.4 Blog and editorial sources

### Frosti

**Intended use:**

- blog homepage
- article grid
- article page
- author information
- newsletter block

### Astro News

**Intended use:**

- news homepage
- magazine layout
- featured story
- category archive
- related articles

### Other DaisyUI/Astro blog sources

Only use individually reviewed MIT, Apache-2.0, BSD, or similarly permissive repositories.

## 3.5 Business and commerce sources

Potential sources may come from:

- Tailwind Toolbox
- Tailwind Market source repositories
- other MIT or Apache-2.0 storefronts
- permissively licensed restaurant, event, agency, and service-business templates

Aggregator listings are discovery tools only. The original repository and its license are the authoritative source.

---

# 4. Excluded sources

Do not copy or redistribute:

- paid DaisyUI store templates
- Blink
- Scalo
- Nexus
- paid Auth templates
- paid Blog templates
- paid Online Store templates
- paid Documentation templates
- Envato templates
- Creative Market templates
- Freepik assets without explicit redistribution rights
- templates marked “free” without a license
- non-commercial templates
- no-derivatives templates
- GPL templates unless EmVB deliberately accepts the resulting obligations
- screenshots or branded assets from commercial products

A purchased license is not automatically a redistribution license.

---

# 5. Canonical template JSON model

Each source template is authored as an independent JSON document.

```json
{
  "format": "emvb-template",
  "formatVersion": 1,
  "id": "pricing-three-tier",
  "version": 1,
  "name": "Three-tier pricing",
  "description": "Responsive pricing cards adapted from an approved source.",
  "templateType": "block",
  "category": "pricing",
  "tags": ["saas", "pricing", "cards"],
  "status": "reviewed",
  "schemaVersion": 18,
  "designSchemaVersion": 16,
  "requiredProviders": [
    {
      "id": "daisyui",
      "minimumVersion": "0.1.0"
    }
  ],
  "requiredComponents": ["card", "badge", "list", "button"],
  "theme": {
    "mode": "inherit"
  },
  "variables": [],
  "layout": {
    "id": "template-root",
    "type": "container",
    "props": {},
    "children": []
  },
  "design": null,
  "assets": [],
  "source": {
    "name": "Source template name",
    "repository": "original repository URL",
    "revision": "exact commit hash",
    "license": "MIT",
    "licenseFile": "licenses/source-MIT.txt",
    "originalFramework": "Astro",
    "adaptation": "Converted to EmVB schema 18 DaisyUI provider nodes"
  },
  "metadata": {
    "author": "EmVB",
    "license": "MIT",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  }
}
```

## 5.1 Development and distribution rules

Use:

- one source JSON file per template
- one JSON file per reusable block
- one generated pack JSON for distribution
- one database record per imported template

Do not maintain all templates in one manually edited JSON file.

## 5.2 Package wrapper

```json
{
  "format": "emvb-template-package",
  "formatVersion": 1,
  "packageId": "emvb-daisyui-starter-pack",
  "packageVersion": "1.0.0",
  "templates": [],
  "categories": [],
  "assets": [],
  "licenses": [],
  "sourceManifest": []
}
```

---

# 6. Database model

Use the same canonical representation for PostgreSQL and MongoDB.

Suggested fields:

```text
id
version
name
slug
description
template_type
category_id
tags
status
schema_version
design_schema_version
required_providers
required_components
theme_config
variables
layout_json
design_json
assets
thumbnail_asset_id
source_manifest
license
attribution
author
created_at
updated_at
reviewed_at
published_at
```

## PostgreSQL

Use JSONB for:

- layout JSON
- design JSON
- variables
- asset manifest
- provider requirements
- provenance

## MongoDB

Store the canonical document directly. Do not add MongoDB-only semantics that prevent PostgreSQL portability.

---

# 7. Import behavior

The importer must:

1. Parse and validate the package.
2. Validate template and category schemas.
3. Validate the source and license manifest.
4. Reject unsupported or unknown licenses.
5. Check required DaisyUI provider version.
6. Check every required DaisyUI component.
7. Migrate the template schema if necessary.
8. Reject unknown node types.
9. Sanitize URLs, attributes, SVG, and provider props.
10. Upload or resolve package assets.
11. Rewrite asset references.
12. Write one database record per template.
13. Record package version and source revision.
14. Produce a machine-readable import report.
15. Roll back transactionally when any mandatory record fails.

---

# 8. Insertion behavior

When a user chooses a template, EmVB must:

1. Load the immutable template record.
2. Validate it again at the trust boundary.
3. Confirm required providers.
4. Generate fresh IDs for every node.
5. Rewrite internal node references.
6. Substitute template variables.
7. Apply the selected theme policy.
8. Merge or isolate design tokens safely.
9. Clone assets and bindings as required.
10. Insert through the standard EmVB editor action.
11. Create one undo-history operation.
12. Store source template ID and version in page metadata.

Never mutate an already customized page automatically when the source template is updated.

---

# 9. Theme policy

Every template defaults to:

```text
Inherit current site theme
```

The user may choose:

```text
Inherit current theme
Apply theme to inserted block
Apply theme to entire page
Import source design tokens
Keep existing site tokens
Create isolated template classes
```

Templates must not contain copied DaisyUI CSS. They reference the installed DaisyUI provider and use EmVB conditional asset loading.

---

# 10. Asset policy

Do not place large Base64 images inside template JSON.

Use asset references:

```json
{
  "id": "hero-dashboard",
  "type": "image",
  "source": {
    "kind": "package-asset",
    "path": "assets/hero-dashboard.webp"
  },
  "alt": "Product dashboard"
}
```

Portable package structure:

```text
manifest.json
templates/
blocks/
assets/
licenses/
ATTRIBUTIONS.md
SOURCE-MANIFEST.json
```

Every external asset must have its own provenance and redistribution review.

---

# 11. Delivery bundles

## Bundle G: Template foundation

### WP32: Template JSON engine

Deliver:

- `@perkyzz/emvb-templates`
- Zod schemas
- package schema
- category schema
- variable schema
- asset schema
- source provenance schema
- schema migrations
- fresh-ID cloning
- reference rewriting
- provider validation
- variable substitution
- theme policy
- token merge policy
- one-history-operation insertion
- PostgreSQL/MongoDB-neutral canonical model

Output:

```text
EmVB-bundle-G-template-engine.bundle
```

## Bundle H: Licensed source intake

### WP33: Provenance and licensing pipeline

Evaluate:

- DashWind
- Mosaic Lite
- Windmill Dashboard
- Astroship
- Astrolus
- Landwind
- Nextly
- Astrofy
- Astro Sarissa
- Frosti
- Astro News
- selected Tailwind Toolbox sources

Deliver:

- license allowlist
- source manifest schema
- exact commit tracking
- asset-license review
- attribution generator
- rejection report
- human approval state
- `LICENSES/`
- `ATTRIBUTIONS.md`
- `SOURCE-MANIFEST.json`

Output:

```text
EmVB-bundle-H-template-intake.bundle
```

## Bundle I: Conversion pipeline

### WP34: Licensed source to EmVB converter

Deliver:

- HTML analyzer
- Astro analyzer
- JSX structure analyzer
- Tailwind-to-DaisyUI mapping
- responsive utility conversion
- theme mapping
- asset rewriting
- unsafe behavior rejection
- EmVB JSON generation
- conversion-difference report
- manual design-review checklist

Output:

```text
EmVB-bundle-I-template-converter.bundle
```

## Bundle J: Template database

### WP35: Database import and management

Deliver:

- template table/collection
- categories
- tags
- version history
- draft/reviewed/published/retired status
- transactional package import
- duplicate detection
- asset import
- source-manifest storage
- admin API
- PostgreSQL support
- MongoDB support

Output:

```text
EmVB-bundle-J-template-database.bundle
```

## Bundle K: Template Gallery

### WP36: Gallery and preview

Deliver:

- Start from Template flow
- Insert Block flow
- Page and Block tabs
- category filters
- source filters
- search
- desktop/tablet/mobile preview
- theme preview
- source and license display
- template-variable form
- theme-import decision
- one-click insertion
- one undo event
- favorites
- recent templates

Output:

```text
EmVB-bundle-K-template-gallery.bundle
```

---

# 12. Curated template packs

## Bundle L: Dashboard and application pack

### WP37

Source candidates:

- DashWind
- Mosaic Lite
- Windmill Dashboard

Templates:

```text
1. Admin Dashboard
2. Analytics Dashboard
3. Account Settings
4. User Management
5. Login
6. Registration
7. Password Reset
8. Dashboard Sidebar
9. Statistics Grid
10. Activity Table
```

Outputs:

```text
EmVB-bundle-L-dashboard-pack.bundle
EmVB-dashboard-template-pack.json
```

## Bundle M: SaaS and startup pack

### WP38

Source candidates:

- Astroship
- Astrolus
- Landwind
- Nextly

Templates:

```text
1. SaaS Launch
2. Product Landing
3. Startup Landing
4. Developer Tool Landing
5. App Download Page
6. Three-tier Pricing
7. Feature Comparison
8. Product Screenshot Hero
9. Logo Cloud
10. SaaS FAQ
```

Outputs:

```text
EmVB-bundle-M-saas-pack.bundle
EmVB-saas-template-pack.json
```

## Bundle N: Portfolio and agency pack

### WP39

Source candidates:

- Astrofy
- Astro Sarissa
- approved Tailwind Toolbox agency sources

Templates:

```text
1. Personal Portfolio
2. Designer Portfolio
3. Developer Portfolio
4. Creative Agency
5. Digital Agency
6. Consultancy
7. Project Case Study
8. Service Grid
9. Team Section
10. Contact and Inquiry
```

Outputs:

```text
EmVB-bundle-N-portfolio-agency-pack.bundle
EmVB-portfolio-agency-template-pack.json
```

## Bundle O: Blog and editorial pack

### WP40

Source candidates:

- Frosti
- Astro News
- approved DaisyUI/Astro blog sources

Templates:

```text
1. Blog Homepage
2. Magazine Homepage
3. News Homepage
4. Article Page
5. Author Page
6. Category Archive
7. Featured Article Hero
8. Article Grid
9. Newsletter Block
10. Related Articles
```

Outputs:

```text
EmVB-bundle-O-editorial-pack.bundle
EmVB-editorial-template-pack.json
```

## Bundle P: Business and commerce pack

### WP41

Source candidates:

- approved Tailwind Toolbox sources
- approved Tailwind Market repositories
- other reviewed MIT or Apache-2.0 sources

Templates:

```text
1. Local Service Business
2. Restaurant
3. Event Registration
4. Product Launch
5. Ecommerce Homepage
6. Product Detail
7. Pricing and Booking
8. Testimonials
9. Contact and Location
10. Footer and Business Information
```

Outputs:

```text
EmVB-bundle-P-business-commerce-pack.bundle
EmVB-business-commerce-template-pack.json
```

---

# 13. Authoring and qualification

## Bundle Q: Template authoring

### WP42

Deliver:

- save page as template
- save selection as block
- mark variables
- detect DaisyUI dependencies
- collect assets
- generate thumbnails
- provenance and license form
- export package
- import round trip
- private organization library

Output:

```text
EmVB-bundle-Q-template-authoring.bundle
```

## Bundle R: Final qualification

### WP43

Mandatory gates:

- JSON schema validation
- source-license verification
- attribution verification
- asset-license verification
- schema migration
- fresh-ID collision tests
- internal-reference rewriting
- provider dependency checks
- edit every exposed field
- image replacement
- link editing
- save/reload
- undo/redo
- public-render parity
- conditional CSS/runtime
- axe-core WCAG A/AA
- Chromium
- Firefox
- WebKit
- screenshots at 375, 768, and 1280 CSS pixels
- light and dark themes
- PostgreSQL import
- MongoDB import
- Cloudflare Worker deployment

Outputs:

```text
EmVB-bundle-R-template-qualification.bundle
EmVB-licensed-template-pack-v1.json
EmVB-template-qualification-report.md
EmVB-template-evidence.tar.gz
```

---

# 14. Template acceptance checklist

A template is accepted only when all items pass.

## Legal

- original repository identified
- exact source revision recorded
- license permits commercial use
- license permits modification
- license permits redistribution
- license text included
- attribution generated
- assets reviewed independently

## Conversion

- DaisyUI components used where available
- no unsafe source scripts copied
- no arbitrary class injection
- URLs sanitized
- responsive behavior preserved
- source composition recognizable
- template variables documented

## Editing

- every text field editable
- every link editable
- every image replaceable
- DaisyUI variants editable
- compound components editable
- Layers tree works
- save/reload works
- undo/redo works

## Rendering

- editor/public parity
- mobile/tablet/desktop
- light/dark
- no console errors
- conditional assets correct
- no hydration mismatch

## Accessibility

- accessible names
- correct landmark structure
- focus order
- keyboard interaction
- contrast
- axe serious/critical count equals zero

## Packaging

- JSON validation
- database import
- export/import round trip
- fresh IDs
- no duplicate assets
- package checksum
- evidence archived

---

# 15. Development layout

```text
packages/emvb-templates/
├── schema/
│   ├── template.ts
│   ├── package.ts
│   ├── category.ts
│   ├── variable.ts
│   ├── asset.ts
│   └── provenance.ts
├── import/
│   ├── validate.ts
│   ├── migrate.ts
│   ├── clone-ids.ts
│   ├── rewrite-references.ts
│   ├── variables.ts
│   ├── providers.ts
│   ├── assets.ts
│   └── transaction.ts
├── conversion/
│   ├── html.ts
│   ├── astro.ts
│   ├── jsx.ts
│   ├── tailwind-map.ts
│   ├── daisy-map.ts
│   └── report.ts
├── templates/
│   ├── dashboard/
│   ├── saas/
│   ├── portfolio/
│   ├── editorial/
│   └── business/
├── blocks/
│   ├── navbar/
│   ├── hero/
│   ├── features/
│   ├── pricing/
│   ├── faq/
│   ├── testimonials/
│   ├── stats/
│   ├── contact/
│   ├── cta/
│   └── footer/
├── licenses/
├── assets/
└── generated/
    ├── starter-pack.json
    ├── source-manifest.json
    └── attributions.md
```

---

# 16. Commit and bundle policy

Each WP receives a separate commit.

Each converted template receives its own commit where practical:

```text
feat(templates): convert DashWind admin dashboard
feat(templates): convert Astroship SaaS landing page
feat(blocks): add licensed three-tier pricing block
```

Licensing changes must be isolated:

```text
legal(templates): add DashWind MIT attribution
```

Never combine unrelated source conversions into one unreviewable commit.

---

# 17. Delivery order

```text
Bundle G  Template engine
-> Bundle H  Source and license intake
-> Bundle I  Conversion pipeline
-> Bundle J  Database import and management
-> Bundle K  Template Gallery
-> Bundle L  Dashboard and application pack
-> Bundle M  SaaS and startup pack
-> Bundle N  Portfolio and agency pack
-> Bundle O  Blog and editorial pack
-> Bundle P  Business and commerce pack
-> Bundle Q  Authoring tools
-> Bundle R  Final qualification
```

Do not begin bulk template conversion before Bundles G, H, and I establish the schema, legal intake, and deterministic conversion workflow.

---

# 18. Definition of complete

The program is complete when:

- all agreed bundles G-R are delivered
- every source has verified licensing
- every template is importable JSON
- every template is stored individually in the database
- every inserted layout becomes normal editable EmVB nodes
- DaisyUI is used as the UI component layer
- template assets are legally traceable
- all browser, accessibility, responsive, database, Worker, and editor/public gates pass
- the final qualification report says PASS

Until then, individual template packs may be marked experimental, reviewed, or blocked, but must not be described as production-qualified.
