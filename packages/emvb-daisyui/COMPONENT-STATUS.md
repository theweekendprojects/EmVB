# daisyUI component status

One row per component in the catalog (68). Last verified 2026-11-18 with `bun scripts/daisy-verify-components.ts` (public and canvas) and `bun scripts/daisy-verify-components.ts --css` (classes). Re-run after any change to a component, then update the row.

**Now:** 68/68 components pass every automated check: canvas, public render, and option classes in the compiled stylesheet. The 20 containers also hold a nested child on the public page.

**Not yet verified, per component:**

- Settings panel fields and how they write back (only the default props are rendered).
- Interaction in the editor: add, select, move, nest.
- Child rules beyond "a Button fits" (for example, Tabs should take tab panels).
- The live site. Verification here runs on the local renderer, not on theweekendprojects.com.

**Audit 2026-11-15:** the full audit found 11 broken, 37 partial, 20 OK. Its findings are stale: containers, option classes, default images and the canvas gap are now fixed for these rows. Its column is kept for reference only.

| Component                             | Category     | Canvas | Public | Holds child | Option classes | Audit 2026-11-15 |
| ------------------------------------- | ------------ | ------ | ------ | ----------- | -------------- | ---------------- |
| Button (`button`)                     | Actions      | yes    | yes    | no          | ok             | PARTIAL          |
| Badge (`badge`)                       | Data display | yes    | yes    | no          | ok             | PARTIAL          |
| Alert (`alert`)                       | Feedback     | yes    | yes    | no          | ok             | OK               |
| Card (`card`)                         | Layout       | yes    | yes    | yes         | ok             | PARTIAL          |
| Progress (`progress`)                 | Data display | yes    | yes    | no          | ok             | PARTIAL          |
| Statistic (`stats`)                   | Data display | yes    | yes    | no          | ok             | OK               |
| Input (`input`)                       | Actions      | yes    | yes    | no          | ok             | PARTIAL          |
| Textarea (`textarea`)                 | Actions      | yes    | yes    | no          | ok             | BROKEN           |
| Select (`select`)                     | Actions      | yes    | yes    | no          | ok             | BROKEN           |
| Checkbox (`checkbox`)                 | Actions      | yes    | yes    | no          | ok             | PARTIAL          |
| Radio (`radio`)                       | Actions      | yes    | yes    | no          | ok             | PARTIAL          |
| Toggle (`toggle`)                     | Actions      | yes    | yes    | no          | ok             | PARTIAL          |
| File-Input (`file-input`)             | Actions      | yes    | yes    | no          | ok             | BROKEN           |
| Range (`range`)                       | Actions      | yes    | yes    | no          | ok             | PARTIAL          |
| Rating (`rating`)                     | Actions      | yes    | yes    | no          | ok             | PARTIAL          |
| Navbar (`navbar`)                     | Navigation   | yes    | yes    | yes         | ok             | PARTIAL          |
| Menu (`menu`)                         | Navigation   | yes    | yes    | no          | ok             | PARTIAL          |
| Breadcrumbs (`breadcrumbs`)           | Navigation   | yes    | yes    | no          | ok             | OK               |
| Pagination (`pagination`)             | Navigation   | yes    | yes    | no          | ok             | PARTIAL          |
| Steps (`steps`)                       | Navigation   | yes    | yes    | no          | ok             | OK               |
| Dock (`dock`)                         | Navigation   | yes    | yes    | no          | ok             | OK               |
| Footer (`footer`)                     | Navigation   | yes    | yes    | yes         | ok             | PARTIAL          |
| Tabs (`tabs`)                         | Navigation   | yes    | yes    | no          | ok             | OK               |
| Accordion (`accordion`)               | Layout       | yes    | yes    | yes         | ok             | PARTIAL          |
| Dropdown (`dropdown`)                 | Navigation   | yes    | yes    | no          | ok             | OK               |
| Modal (`modal`)                       | Feedback     | yes    | yes    | yes         | ok             | BROKEN           |
| Drawer (`drawer`)                     | Layout       | yes    | yes    | yes         | ok             | PARTIAL          |
| Carousel (`carousel`)                 | Layout       | yes    | yes    | yes         | ok             | PARTIAL          |
| Collapse (`collapse`)                 | Layout       | yes    | yes    | yes         | ok             | PARTIAL          |
| Swap (`swap`)                         | Actions      | yes    | yes    | no          | ok             | OK               |
| Table (`table`)                       | Data display | yes    | yes    | no          | ok             | BROKEN           |
| Timeline (`timeline`)                 | Data display | yes    | yes    | no          | ok             | OK               |
| Avatar (`avatar`)                     | Data display | yes    | yes    | no          | ok             | PARTIAL          |
| Chat Bubble (`chat-bubble`)           | Data display | yes    | yes    | no          | ok             | OK               |
| List (`list`)                         | Data display | yes    | yes    | no          | ok             | OK               |
| Status (`status`)                     | Data display | yes    | yes    | no          | ok             | OK               |
| Tooltip (`tooltip`)                   | Data display | yes    | yes    | yes         | ok             | PARTIAL          |
| Countdown (`countdown`)               | Data display | yes    | yes    | no          | ok             | BROKEN           |
| Hero (`hero`)                         | Marketing    | yes    | yes    | yes         | ok             | PARTIAL          |
| Stack (`stack`)                       | Layout       | yes    | yes    | yes         | ok             | PARTIAL          |
| Divider (`divider`)                   | Layout       | yes    | yes    | no          | ok             | OK               |
| Join (`join`)                         | Layout       | yes    | yes    | yes         | ok             | PARTIAL          |
| Indicator (`indicator`)               | Layout       | yes    | yes    | yes         | ok             | PARTIAL          |
| Mask (`mask`)                         | Layout       | yes    | yes    | no          | ok             | PARTIAL          |
| Browser Mockup (`browser-mockup`)     | Marketing    | yes    | yes    | yes         | ok             | PARTIAL          |
| Phone Mockup (`phone-mockup`)         | Marketing    | yes    | yes    | yes         | ok             | PARTIAL          |
| Code Mockup (`code-mockup`)           | Marketing    | yes    | yes    | no          | ok             | BROKEN           |
| Loading (`loading`)                   | Feedback     | yes    | yes    | no          | ok             | PARTIAL          |
| Skeleton (`skeleton`)                 | Feedback     | yes    | yes    | no          | ok             | PARTIAL          |
| Radial progress (`radial-progress`)   | Feedback     | yes    | yes    | no          | ok             | BROKEN           |
| Toast (`toast`)                       | Feedback     | yes    | yes    | yes         | ok             | PARTIAL          |
| Label (`label`)                       | Actions      | yes    | yes    | no          | ok             | OK               |
| Fieldset (`fieldset`)                 | Actions      | yes    | yes    | yes         | ok             | PARTIAL          |
| Kbd (`kbd`)                           | Data display | yes    | yes    | no          | ok             | BROKEN           |
| Link (`link`)                         | Navigation   | yes    | yes    | no          | ok             | PARTIAL          |
| Window mockup (`window-mockup`)       | Layout       | yes    | yes    | yes         | ok             | PARTIAL          |
| Theme Controller (`theme-controller`) | Actions      | yes    | yes    | no          | ok             | OK               |
| Validator (`validator`)               | Actions      | yes    | yes    | no          | ok             | OK               |
| Diff (`diff`)                         | Data display | yes    | yes    | no          | ok             | PARTIAL          |
| Filter (`filter`)                     | Actions      | yes    | yes    | no          | ok             | OK               |
| Aura (`aura`)                         | Layout       | yes    | yes    | yes         | ok             | PARTIAL          |
| Calendar (`calendar`)                 | Actions      | yes    | yes    | no          | ok             | OK               |
| FAB / Speed Dial (`fab`)              | Actions      | yes    | yes    | no          | ok             | OK               |
| Hover 3D Card (`hover-3d`)            | Layout       | yes    | yes    | yes         | ok             | PARTIAL          |
| Hover Gallery (`hover-gallery`)       | Data display | yes    | yes    | no          | ok             | PARTIAL          |
| Megamenu (`megamenu`)                 | Navigation   | yes    | yes    | no          | ok             | BROKEN           |
| OTP (`otp`)                           | Actions      | yes    | yes    | no          | ok             | BROKEN           |
| Text Rotate (`text-rotate`)           | Data display | yes    | yes    | no          | ok             | OK               |

## Presets (section recipes)

21 recipes in packages/emvb-daisyui/src/recipes, checked with `bun scripts/daisy-verify-components.ts --recipes` on 2026-11-18. The check renders every node in each recipe (nested children included) on the canvas and the public page, and reports any refused markup. Passing means the nodes appear and nothing is refused. It does not check the recipe copy, its look on mobile, or how each node edits.

| Recipe                   | Id                    | Nodes | Canvas | Public | Refused |
| ------------------------ | --------------------- | ----- | ------ | ------ | ------- |
| daisyUI Hero             | `section-hero`        | 1     | yes    | yes    | -       |
| daisyUI Features         | `section-features`    | 4     | yes    | yes    | -       |
| daisyUI Call to action   | `section-cta`         | 2     | yes    | yes    | -       |
| daisyUI Customer reviews | `section-reviews`     | 4     | yes    | yes    | -       |
| daisyUI Key numbers      | `section-numbers`     | 4     | yes    | yes    | -       |
| daisyUI Footer           | `section-footer`      | 1     | yes    | yes    | -       |
| Pricing section          | `pricing`             | 7     | yes    | yes    | -       |
| FAQ section              | `faq`                 | 5     | yes    | yes    | -       |
| Login form               | `login`               | 4     | yes    | yes    | -       |
| Signup form              | `signup`              | 5     | yes    | yes    | -       |
| Contact form             | `contact`             | 4     | yes    | yes    | -       |
| Product cards            | `product-grid`        | 7     | yes    | yes    | -       |
| Blog grid                | `blog-grid`           | 7     | yes    | yes    | -       |
| Team grid                | `team-grid`           | 6     | yes    | yes    | -       |
| Dashboard statistics     | `dashboard-stats`     | 3     | yes    | yes    | -       |
| Navigation shell         | `navigation-shell`    | 3     | yes    | yes    | -       |
| Launch countdown         | `countdown-launch`    | 3     | yes    | yes    | -       |
| Sale ends countdown      | `countdown-sale`      | 3     | yes    | yes    | -       |
| Event starts in          | `countdown-event`     | 3     | yes    | yes    | -       |
| Flash sale clock         | `countdown-flash`     | 3     | yes    | yes    | -       |
| Early-bird days left     | `countdown-earlybird` | 3     | yes    | yes    | -       |
