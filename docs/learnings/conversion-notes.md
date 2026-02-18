# Conversion Notes

Accumulated learnings from site conversions. Read this before starting a new conversion.

---

## Site: PeakPerformance (2026-02-17)

**URL**: https://699333a35bec310008209eec--peakperformance-nuxt.netlify.app/
**Framework**: Nuxt 3 + Tailwind CSS
**Theme type**: Dark (base=#0a0a0a, brand=#c8ff00 lime accent)
**Fonts**: Bebas Neue (headings) + Inter (body)

### What went wrong

1. **Deterministic scraping produced raw HTML dumps** — The scraper extracted section HTML but didn't properly clean it. Block templates were single-line minified HTML with animation classes, framework-specific classes, and hardcoded colors left in place. Templates should be clean, indented, human-readable Handlebars.

2. **Color mapping got confused by Tailwind v3 CSS format** — Tailwind v3 outputs colors as `rgb(R G B / var(--tw-bg-opacity,1))`. The initial regex didn't parse this format. Also, custom color names (e.g., `bg-coal`, `text-volt`) required reading the CSS variable definitions to resolve to hex values.

3. **Saturation heuristic needed** — The most-used background color was initially mapped to `base`, but for this site the most-used bg was a page section with the bright lime brand color. Had to add a saturation check: if the most-used bg is highly saturated, it's probably `brand`, not `base`.

4. **Body element wasn't the root for class detection** — In Nuxt, the actual page wrapper is an inner div, not `<body>`. Had to check multiple root-level elements for background color classes.

5. **Section classification order matters** — "About" detection (looking for words like "coach") was too aggressive and caught the Process section first. Process detection needs to come before about detection in the heuristic chain.

6. **`$el.text()` concatenates all text without spaces** — Cheerio's `.text()` returns "01DISCOVERY02ASSESSMENT..." which broke word-boundary regex patterns. Had to use lookahead/lookbehind patterns instead of `\b`.

7. **Cheerio encodes HTML entities in output** — `{{> Button}}` becomes `{{&gt; Button}}` when output through `$.html()`. Need post-processing to decode these back.

8. **Field extraction for complex layouts was incomplete** — The deterministic scraper only extracted fields for simple patterns. Complex layouts with mixed static/dynamic content, nested structures, or non-standard grid arrangements were left as raw HTML.

### What worked well

1. **Section detection by structural heuristics** — Finding `<section>`, `<header>`, `<footer>` elements and classifying by content (h1 = hero, numbers = stats, quotes = testimonial) worked reasonably for identifying WHAT sections exist.

2. **theme.json generation** — Font extraction from Google Fonts links and CSS, color extraction from computed styles, and typography tier mapping all produced solid theme.json output.

3. **Button partial pattern** — Detecting button patterns across sections and generating a `{{#switch style}}` partial worked well.

### Lessons learned

- **Claude-driven conversion is better than deterministic scraping** — The scraper can identify sections and extract colors/fonts, but the actual HTML-to-Handlebars conversion needs creative judgment that Claude provides. Each section has unique structure that doesn't fit a rigid template.

- **Work one block at a time** — Deploy, screenshot, compare, iterate. Don't batch all blocks and hope for the best.

- **Start with theme.json and Button** — Get the design foundation right before converting any blocks.

- **Nuxt sites use custom Tailwind color names** — Look for CSS variable definitions like `--color-coal: #0a0a0a` to map custom class names to hex values.

- **Animation classes must be stripped entirely** — Don't try to preserve CSS transition/animation classes. Replace with Alpine.js `x-intersect` patterns if animations are desired.

---

## Site: PeakPerformance — Round 2 (2026-02-17)

**Approach**: Full manual conversion using compound engineering docs (CLAUDE.md + guides + references). Scrapped deterministic scraper entirely.

### What went wrong

1. **Old site token was invalid** — The previous site and its API token no longer worked. Sync command returned "Authentication required". Had to implement `create-site` command using the account token (`MAKE_STUDIO_CREATE_TOKEN` / `mst_a_*`) to create a fresh site, which returns a new site-level token.

2. **Seed site page references break after sync** — When a new site is created from a seed, the default Index page references the seed blocks by ID. After sync deletes those seed blocks and creates custom ones, the page shows "Block template not found" for every block. The page must be updated to reference the new block IDs.

3. **Page API doesn't support API tokens** — The `accessCheckPage` middleware only supports Clerk auth (`req.auth().userId`), not `mst_*` bearer tokens. Had to update the page via MongoDB directly (`scripts/update-page.ts`) instead of the API.

4. **`tsx -e` inline scripts break on special characters** — Bash tool escapes `!` in TypeScript null assertions and logical NOT, causing syntax errors. Write the script to a file instead of using inline `-e` mode.

### What worked well

1. **Compound engineering docs produced clean blocks** — Having reference examples (oatmeal Hero, Features, etc.) and design token guides meant blocks were correct on the first pass. All 9 blocks + 1 partial validated with 0 errors, 0 warnings.

2. **`create-site` command with auto-token save** — Creating a site returns an `apiToken` in the response. The command auto-updates `.env` with the new token and site ID, making the workflow seamless: `create-site` → `sync`.

3. **Color mapping was accurate** — Reading the actual site CSS/HTML and manually mapping colors to semantic tokens (base=#0a0a0a, brand=#c8ff00, fg=#ffffff) produced correct results without any heuristic confusion.

4. **Block order via MongoDB worked** — `scripts/update-page.ts` successfully updated the page with the correct 9 blocks in order.

### Lessons learned

- **Always create a fresh site for new conversions** — Don't try to reuse old sites with expired tokens. Use `npm run create-site -- --name="Site Name"` to get a clean slate.

- **After sync, update the page** — The sync command handles blocks/partials/theme but NOT pages. After syncing, run `scripts/update-page.ts` (or a future `update-page` CLI command) to wire the blocks to the page in the correct order.

- **Page management needs API support** — Currently requires MongoDB. The make-studio page routes should be updated to accept API tokens, or the importer should add a dedicated page management command.

- **The create-site → sync → update-page workflow** — The full deployment flow is: (1) create-site, (2) sync blocks/partials/theme, (3) update page with correct block IDs and order. All three steps are needed for a working site.
