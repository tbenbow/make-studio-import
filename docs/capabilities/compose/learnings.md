# Site Composition Learnings

Accumulated insights from composing sites from seed blocks. Read this before starting a new composition.

---

<!-- Entries follow this format:
## Site Name (YYYY-MM-DD)

**Prompt**: Brief description of what was requested
**Design**: Brief description of theme (palette, fonts, tone)
**Blocks Used**: Which seed blocks were selected

### What Worked
- ...

### What Didn't
- ...

### Patterns Discovered
- ...
-->

## North Loop Yoga — Wellness Studio (2026-02-22)

**Prompt**: Candlelit yoga studio in Minneapolis North Loop, serene/earthy tone, mossy green + muted pink palette, focus on the vibe of the space, beauty, and cool community
**Design**: V2 "Community & Warmth" — Playfair Display + Work Sans, sage green `#6b7f5a` + dusty rose `#deb5b3`, rounded pill buttons, warm cream backgrounds
**Blocks Used**: Navbar, Split, Features Triple, Testimonials Grid, Stats, FooterNewsletter

### What Worked
- **Compose workflow is fast** — fetching seed blocks, selecting, theming, sourcing images, pushing, and populating content all happened in one session. No HTML generation or block conversion needed.
- **Seed blocks carry full templates + fields** — `getBlocks()` returns everything needed to recreate blocks on a new site. No local file reads required.
- **`setPageContent` with field names works for items** — passing `{ "Features Triple": { "Features": [...items] } }` correctly resolved the items field by name and stored the array. Sub-field keys in items data match the template variables directly (lowercase: `title`, `description`, `image`).
- **Pexels parallel search** — running multiple Pexels queries in parallel sourced 9 images quickly.
- **R2 upload + `uploadFilesFromUrls` two-step** — upload to R2 for immediate CDN availability, then register in media library. Proven pattern from pirate-golf.

### What Didn't
- **Theme format mismatch** — the guide documented a simplified theme format (`colors`, `typography`, `buttons` with CSS values). The actual server expects `systemColors`, `headingTypography`/`bodyTypography` (pixel values, not rem), `buttons.global`/`buttons.variants` (with `hoverPreset`, not inline CSS), `palette`, `prose`, and individual font weight entries. First deploy failed with `generateTypographyCSS` getting null because `typography` key doesn't exist on the server schema.
- **`setPageContent` auto-adds blocks to page** — calling `setPageContent(pageId, { "Navbar": {...} })` adds a Navbar instance to the page's blocks array, even though Navbar was only in the layout. This caused a double navbar and double footer. Fix: call `setPageContent` for layout blocks, then remove them from page blocks with `updatePage`.
- **Can't delete the default layout** — `deleteLayout()` on the default layout returns 403 "Cannot delete the default layout". Must use `updateLayout()` on the existing default layout instead of delete+create.
- **`createSite` response is flat** — returns `{ _id, name, apiToken, ... }` directly, not `{ site, apiToken }`. Type is `CreateSiteResponse` in `src/types.ts`.
- **Layout/page block refs require `name` field** — `updatePage({ blocks: [...] })` and `updateLayout({ headerBlocks: [...] })` both require `{ blockId, id, name }`. Omitting `name` causes a validation error.

### Patterns Discovered
- **Server theme schema** — the actual theme shape is: `fonts` (individual `{family, weight, style}` entries), `systemColors` (10 semantic colors including `on-brand`, `base`, `base-muted`, `base-alt`, `panel`), `palette` (5 ramps: primary, accent1-3, grays with 5 shades each), `headingTypography` (5 tiers, pixel values, with `letterSpacing`), `bodyTypography` (3 tiers, pixel values), `prose` (element mapping + lists + links + customCSS), `buttons.global` (fontFamily, fontWeight, uppercase, 3 size configs with px padding/radius) + `buttons.variants` (4 variants with `system:color-name` refs and `hoverPreset`).
- **Items data keys must match template** — the template uses `{{#each features}}` with `{{image}}`, and the items data keys are `image`. These are passed through verbatim by the API — no slugification happens on items sub-field keys. This is different from top-level fields where `setPageContent` resolves by field name.
- **Compose order matters** — the safe order is: (1) create blocks, (2) update layout with navbar/footer, (3) assign content blocks to page, (4) set ALL content via `setPageContent` (including layout blocks), (5) remove navbar/footer from page blocks, (6) deploy. Steps 4-5 are needed because `setPageContent` adds blocks it references to the page.
- **Idempotent scripts are essential** — the setup script ran 4 times due to incremental fixes. Making each step skip-if-exists (check partials, check blocks, reuse CDN URLs) prevented duplicate resources.

## Wax & Pour — Vinyl Listening Bar (2026-02-22)

**Prompt**: Surprise me (agent-chosen concept). Hi-fi vinyl listening bar, moody/warm/analog aesthetic, craft cocktails, Northeast Minneapolis.
**Design**: Dark base `#1a1412` + warm amber brand `#c8956c`, DM Serif Display + DM Sans, sharp 4px radius buttons.
**Blocks Used**: Navbar, Hero, Features Triple, Testimonial Large, Stats, FAQ, CTA, FooterNewsletter

### What Worked
- **Theme rendered perfectly on first deploy** — server schema is now well understood. Dark mode palette with warm amber worked immediately.
- **Items field names must be the FIELD name, not "items"** — e.g., `{ "Features Triple": { "Features": [...] } }` not `{ "Features Triple": { "items": [...] } }`. This was a bug in the first attempt.
- **Pexels + DALL-E image sourcing** — parallel Pexels queries for photos + DALL-E for the logo. All 6 images sourced and uploaded in one pass.
- **`createSite` copies default blocks with matching names** — the site comes pre-populated with blocks that may have the same names as seed blocks but different templates. Must delete ALL blocks first, then create from seed.

### What Didn't
- **Layout blocks don't render page content** — this is the biggest finding. `setPageContent` stores content on the page keyed by instance ID, and the layout renders its headerBlocks/footerBlocks using DIFFERENT instance IDs. Result: layout blocks always show template defaults ("Company", "Stay in the loop", etc.). The North Loop Yoga site has this same bug.
- **`setPageContent` disrupts block order** — calling `setPageContent(pageId, { "Navbar": {...} })` auto-adds the Navbar to the END of the page blocks array, regardless of where you placed it earlier. Must re-order blocks after all `setPageContent` calls.
- **WebFetch AI is unreliable for HTML verification** — the AI model behind WebFetch hallucinated content and mixed up template defaults with actual rendered content. Always use `curl | grep` for accurate verification.

### Patterns Discovered
- **Don't use layouts for navbar/footer content** — put navbar and footer directly in the page blocks array (first and last). Clear the layout's headerBlocks and footerBlocks to empty arrays. This ensures `setPageContent` content is found by the build. The layout `<header>` and `<footer>` wrappers render empty, and the navbar/footer render inside `<main>` with correct content.
- **Correct compose order (updated)**: (1) create blocks from seed, (2) clear layout headerBlocks/footerBlocks, (3) assign ALL blocks to page (navbar first, footer last), (4) set ALL content via `setPageContent`, (5) re-order blocks to desired sequence (setPageContent may have shuffled them), (6) deploy.
- **`createSite` default blocks share names with seed** — must delete ALL existing blocks before creating from seed. Otherwise the "Already exists" check keeps the default templates which have different HTML.

## Sable & Stitch — Leather Goods Atelier (2026-02-23)

**Prompt**: Surprise me (agent-chosen concept). Bespoke leather goods workshop, artisan/tactile aesthetic, North Loop Minneapolis.
**Design**: Dark warm base `#1c1814` + deep indigo brand `#2c3e6b`, Playfair Display + IBM Plex Sans, square-cornered uppercase buttons (borderRadius: 0).
**Blocks Used**: Navbar, Hero, Features Triple, Testimonial Large, Stats, Pricing Large, CTA, FooterNewsletter

### What Worked
- **`compose-site.ts` worked on the first run** — zero fix scripts needed. All 13 steps executed correctly: site creation, R2 upload, theme push, seed block copy, layout clearing, block assignment, content population, re-ordering, and deploy. This validates the unified script approach.
- **Config-driven workflow is fast** — writing `compose.json` with all content up front, then running a single command, is significantly faster than the interactive step-by-step approach of previous composes.
- **Pricing Large block used for first time** — items sub-field is just `{ "text": "..." }`, straightforward. Works well for commission/service pricing with a feature checklist.
- **New block variety** — 8 blocks including Pricing Large (not used in previous composes). Proves the script generalizes beyond the blocks tested in Wax & Pour.

### What Didn't
- **`$key` image ref matched `$195`** — the `resolveImageRefs` function treated any string starting with `$` as an image reference. The price field `"$195"` triggered a warning. Fixed: regex now requires `$` followed by a letter (`/^\$[a-zA-Z]/`).

### Patterns Discovered
- **compose.json as the single source of truth** — having theme, blocks, images, and content all in one file makes the workflow reproducible and reviewable. The `compose-site.ts` script is fully config-driven.
- **`$key` syntax for image refs** — content references like `"$hero"` get resolved to CDN URLs after upload. Must start with a letter after `$` to avoid false matches on currency values.
- **Compose is now a one-command workflow** — `npx tsx scripts/compose-site.ts --config=themes/<name>/compose.json` handles everything. The creative work is in writing the config; execution is automated.
