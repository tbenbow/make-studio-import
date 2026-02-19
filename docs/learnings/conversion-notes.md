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

---

## Site: OK Go Sandbox (2026-02-17)

**URL**: https://okgosandbox.org/
**Framework**: Nuxt 3 (Vue SPA) with scoped component styles
**Theme type**: Light (base=#ffffff, brand=#46b3ff blue accent, base-alt=#252525 dark footer)
**Fonts**: Roboto Slab (headings) + Roboto (body)
**Approach**: Multi-page conversion starting with homepage. Claude-driven with Playwright for analysis.

### What went wrong

1. **Items sub-fields in wrong location** — Put repeater sub-fields at `fields` (top-level on the items object) instead of `config.fields`. Make Studio silently ignored them — the items appeared in the editor but with "No field definitions configured." The correct format is:
   ```json
   {
     "type": "items",
     "name": "Items",
     "config": {
       "fields": [
         { "type": "text", "name": "Title" }
       ]
     },
     "default": [...]
   }
   ```

2. **`isOdd` helper doesn't exist** — Tried `{{#if (isOdd @index)}}` for alternating card layouts. Not a registered Handlebars helper in Make Studio. Also tried `{{#if (eq (mod @index 2) 1)}}` — this caused a template compilation error too (likely `mod` not registered either).

3. **Handlebars expressions inside class attributes can fail** — Putting conditional Handlebars blocks inside a `class=""` attribute (e.g. for alternating CSS classes) can cause compilation errors depending on the expression complexity.

4. **Page block format was wrong** — First attempt used `{ _id, blockId, blockName, fields: [...] }` which rendered blocks but with empty/default content. The correct format uses `content` keyed by field UUIDs:
   ```json
   {
     "id": "uuid",
     "blockId": "mongoId",
     "name": "BlockName",
     "description": "...",
     "content": {
       "field-uuid-1": { "value": "actual content" },
       "field-uuid-2": { "value": [...items...] }
     }
   }
   ```

5. **No media upload API** — Media goes to R2, and there's no API endpoint for uploading. For now, reference original site images directly by URL.

### What worked well

1. **Playwright scraping for SPA sites** — WebFetch couldn't extract CSS/styles from the Vue SPA (scoped styles, runtime-generated classes). Playwright rendered the page and extracted computed styles, fonts, colors, and full DOM.

2. **CSS-only alternating pattern** — `even:lg:flex-row-reverse` on flex containers handles alternating card layouts purely in CSS. No Handlebars helpers needed.

3. **Full-bleed layout** — Some sites don't use max-width containers. Removing the standard container wrapper and using `w-full` with percentage-based widths (`lg:w-3/5` / `lg:w-2/5`) produced the right edge-to-edge look.

4. **Image aspect ratio with `h-auto`** — Using `w-full h-auto` instead of a fixed `aspect-[16/10]` container lets images maintain their natural proportions, matching the original site.

5. **Compound docs still valuable** — Reference examples and design token guides prevented many first-pass errors. Validation passed on first try (0 errors).

### Lessons learned

- **Items sub-fields go in `config.fields`** — This is the #1 gotcha. Never put sub-fields at the top level of an items field. Always nest under `config.fields`.

- **For alternating layouts, use CSS `even:` variant** — Don't try Handlebars index math. Tailwind's `even:lg:flex-row-reverse` is cleaner and always compiles.

- **Page content uses field UUIDs, not names** — The page `content` object maps field UUID → `{ value }`. Get UUIDs from the block's `fields` array in MongoDB. Items within repeaters also need a `uuid` `id` field.

- **Full-bleed sites skip the standard container** — Not every site uses the `max-w-7xl` container. Check the original site's layout and omit the container when the design is edge-to-edge.

- **Use original site image URLs when no upload API exists** — Directly referencing `https://original-site.com/images/...` works as a stopgap. Plan for R2 upload API in the future.

- **Multi-page conversions share blocks/partials** — When converting additional pages of the same site, the Navbar, Footer, and Button partial are already deployed. Only new section types need to be created.

- **Always pull before sync** — Run `npm run pull -- --theme=<name> --only=Block` before editing and syncing. The user may have made changes in the Make Studio editor that will be overwritten if you sync without pulling first.

- **Template variables use kebab-case** — All Handlebars variables must be kebab-case (`{{video-url}}`, `{{about-heading}}`), never snake_case (`{{video_url}}`). This is a Make Studio convention.

- **Capture decorative details** — Small visual details like thin separator lines, colored stripes, and decorative illustrations are important for fidelity. Don't skip them — they define a site's personality.

- **Use Playwright to measure spacing** — Don't eyeball pixel values from screenshots. Write a measurement script (`scripts/measure-spacing.ts`) that uses `getBoundingClientRect()` and `getComputedStyle()` on the original site to get exact widths, gaps, padding, font sizes, etc. This eliminates most spacing revision rounds.

- **Add extra colors as customColors, NOT systemColors** — The Make Studio UI only supports a fixed set of system colors (brand, on-brand, base, base-muted, base-alt, panel, fg, fg-muted, fg-alt, border). Adding arbitrary keys like `accent` to `systemColors` works at the rendering level but the UI doesn't expose them for editing. Instead, add them to the `customColors` array: `{ "id": "uuid", "name": "accent", "value": "#f9613e" }`. Custom colors generate the same Tailwind utilities (`bg-accent`, `text-accent`, `border-accent`) and are editable in the Make Studio color picker.

- **Alpine.js for interactive content** — Use `x-data`, `x-show`, `@click`, and `:src` for interactive elements like video grids where clicking a thumbnail switches the playing video. Only load the active iframe with conditional `:src` binding to avoid loading all videos at once.

- **Use fixed pixel dimensions for small UI elements** — Thumbnails, icons, and other small elements should use exact pixel sizes (`w-[90px] h-[50px]`) rather than responsive grid columns. This ensures they match the original site precisely and don't scale unexpectedly.

- **Extract partials for repeated UI patterns** — When the same HTML appears in 3+ blocks, extract it into a partial. Good candidates: video embeds (poster frame + play button + iframe), decorative stripes, buttons. This centralizes changes — update the partial once and it cascades everywhere.

- **VideoPlayer partial for click-to-play videos** — A shared partial that shows a poster image with a play button overlay, then swaps to an iframe on click using Alpine.js `x-data="{ playing: false }"`. Expects `video-url`, `image`, and `image-alt` in context. Add `bg-black` to the container to prevent white flash during iframe load.

- **Use the Button partial everywhere possible** — Define all button styles (primary, secondary, ghost, accent, nav) in the Button partial with `{{#switch style}}`. Use `{{> Button}}` in blocks for standard CTAs, and `{{> Button link=field label=field style="variant"}}` for inline buttons with explicit context. Only inline button HTML when the design is too specialized (icons + subtitles, split arrow buttons, form submits).

- **Keep JSON defaults clean** — After pulling from the remote, defaults can get polluted with `id`, `value`, and stringified JSON. Clean them: defaults should be proper arrays with kebab-case keys, and `config.fields` should only have `type` and `name` (no `id` or `value`). Title Case keys in defaults (e.g. `"Title"`) should be normalized to kebab-case (`"title"`).

- **Write meaningful block descriptions** — Don't use the block name as the description (`"AskOkGo"`). Write a short phrase that describes what the block looks like: `"Alternating Q&A cards with video and question overlay"`. Avoid truncation — the API may silently clip long description fields.

- **Tailwind arbitrary variants for parent-child alternation** — When you need different child styles based on parent position (e.g. odd/even rows with different child layouts), use `[&:nth-child(even)>[data-child]]` on the parent. Note: Make Studio encodes `&` to `&amp;` on pull, but the unencoded version renders correctly when pushed.

- **Footer semantic color workaround** — When a footer uses `bg-base-alt` (dark) and needs white text, `text-on-brand` works if `on-brand` is white, but it's semantically imprecise. There's no `on-base-alt` token in make-studio. This is an acceptable pragmatic workaround until the token system expands.

---

## Site: OK Go Sandbox — Filter Menu & Link Fixes (2026-02-19)

**Scope**: Added interactive filter overlay to Navbar, created data stores, fixed resource link structure across all pages.

### What went wrong

1. **Resource links used source site's URL structure** — `create-all-resources.ts` and `update-lesson-pages.ts` generated links like `/{parentSlug}/{slug}` matching the original site (okgosandbox.org). Our site uses post types, so resource URLs are `/resources/{slug}.html`. Had to write a fix script to update all 23 resource posts and 8 lesson pages in MongoDB.

2. **Links stored in two different places** — Resource posts store related links in `content` (top-level on the page document), but lesson pages store ResourceCards links inside `blocks[].content`. The first fix script only patched `content`, missing the `blocks` path entirely. Always check both locations when fixing page data.

3. **`accent` added to systemColors but UI doesn't support it** — The Make Studio UI has a fixed set of system colors. Adding `accent` to `systemColors` worked for rendering but wasn't editable in the theme editor. Had to move it to `customColors` array instead. Custom colors produce the same Tailwind classes (`bg-accent`, `text-accent`) but are visible in the UI.

4. **Filter panel z-index too low** — Initial `z-50` was behind page content blocks. Bumped to `z-[999]` for the full-screen modal overlay.

5. **Theme sync removes remote-only keys** — Syncing theme.json with `--only=theme` deleted `customCSS` and `buttons` keys that existed on the remote but weren't in the local file. The sync treats missing local keys as deletions. Keep theme.json in sync with remote state, or be aware that sync is destructive for theme keys.

### What worked well

1. **Data stores for filter content** — Created `music-videos`, `subjects`, and `grade-levels` data stores directly in MongoDB's site document. The `{{#each (dataStore "slug")}}` helper rendered them immediately in templates without any API changes.

2. **Alpine.js for modal toggle** — `x-data="{ filterOpen: false }"` on the header with `x-show` on the overlay panel provided smooth open/close behavior with CSS transitions, no custom JS needed.

3. **Full-screen modal with card layout** — `fixed inset-0 z-[999] bg-fg/60 backdrop-blur-sm` creates a dimmed overlay. White cards with colored top borders (`bg-base rounded-b-lg shadow-lg`) float over it, matching the original site's design.

### Lessons learned

- **Post type URLs follow `/postTypePath/{slug}.html`** — Resources post type uses `/resources/{slug}.html`. Never use the source site's URL structure for internal links. Check the post type's path setting in Make Studio.

- **Page data lives in two places** — For pages created via `update-page` scripts, block content is in `page.blocks[].content`. For post type pages created via `create-all-resources`, related data is in `page.content`. Fix scripts must check both.

- **Custom colors, not system colors** — System colors are a fixed set (brand, on-brand, base, base-muted, base-alt, panel, fg, fg-muted, fg-alt, border). Any additional colors (accent, accent2, etc.) go in `customColors`: `{ "id": "uuid", "name": "color-name", "value": "#hex" }`. They generate identical Tailwind utilities.

- **Data stores for dynamic filter/tag content** — When a block needs a list of items that aren't page content (filter categories, tag lists, dropdown options), use data stores. Add them to the site's `dataStores` array in MongoDB. Access in templates with `{{#each (dataStore "slug")}}` — each entry has `{{this.key}}` (display) and `{{this.value}}` (slug).

- **Full-screen modals need z-[999]** — Page section blocks can have high z-indexes. Use `z-[999]` for modals that must appear above everything. The navbar itself uses `z-10`.

- **Button system is declarative, not template-driven** — Button styling is defined in `theme.json` under `buttons` with `global` (font, sizes sm/md/lg) and `variants` (primary, secondary, outline, ghost). The template uses `btn btn-{{size}} btn-{{style}}` CSS classes generated by Make Studio. This means button appearance is controlled centrally — no inline Tailwind for colors/padding/radius in the template. The template only handles structural elements (icon placement, dividers). See `docs/references/Button.md` for the full config schema.

- **Include `buttons` in theme.json** — The `buttons` key was previously only on the remote and got wiped by a theme sync. Always include it in local theme.json. It defines `global.fontFamily`, `global.sizes.{sm,md,lg}` (fontSize, padding, borderRadius), and `variants.{name}` (backgroundColor, textColor, borderColor, hoverPreset).

- **Button partial supports sizing and icons** — Pass `size="lg"` or `size="sm"` to override the default `md`. Pass `icon="arrow-right"` (Phosphor icon name) to add a right-aligned icon with a divider. Icon size scales with button size (20/24/28px for sm/md/lg).

---

## Site: OK Go Sandbox — Database Corruption Incident (2026-02-19)

**Scope**: Direct MongoDB writes caused site_id type mismatch, breaking page rendering. Root cause analysis and critical policy change.

### What went wrong

1. **Direct DB writes bypassed Mongoose schema casting** — Scripts like `create-all-resources.ts` and `fix-site-id-types.ts` wrote directly to MongoDB using the native driver (`mongoose.connection.db.collection()`). This bypasses Mongoose model validation and type casting entirely. The Page model defines `site_id` as `ObjectId`, but direct writes stored it as a string on some pages.

2. **Misdiagnosed the type mismatch** — When investigating broken pages, we found working pages had `site_id` as ObjectId and broken pages had it as string. We incorrectly concluded that string was correct (because some scripts wrote strings) and wrote `fix-site-id-types.ts` to convert all ObjectId values to strings. This was **exactly backwards** — the Page model expects ObjectId, so we corrupted the working pages too.

3. **`site.pages` array fell out of sync** — Make Studio maintains an abbreviated `pages` array on the site document (used for navigation/sitemap). Direct page creation via MongoDB doesn't update this array. The site document's `pages` list must be kept in sync with the actual pages collection, or pages won't appear in navigation/deploy.

4. **Multiple scripts accumulated inconsistent data** — Different scripts used different approaches: some used `new mongoose.Types.ObjectId(siteId)` (correct for Page model), others used the bare string `siteId` (wrong for Page model but correct for blocks/partials/postTypes). This inconsistency made diagnosis harder and caused the initial misdiagnosis.

### Root cause

The Page Mongoose model defines `site_id: { type: Schema.Types.ObjectId }`. When using `Model.create()` or `Model.find()`, Mongoose automatically casts string IDs to ObjectId. But `db.collection('pages').insertOne()` bypasses this — whatever type you pass is what gets stored. The make-studio server's `Page.find({ site_id })` then fails to match string values because Mongoose casts the query parameter to ObjectId, which doesn't match a stored string.

### Critical policy change

**NEVER write directly to MongoDB. Always use the Make Studio API.**

- The API handles type casting, validation, and keeps related documents (like `site.pages`) in sync
- If an API endpoint doesn't exist for what you need, **discuss adding one** in the make-studio app rather than writing a direct DB script
- The only acceptable direct DB reads are for inspection/debugging scripts that don't modify data

### Type reference (if direct DB access is ever unavoidable)

| Collection   | `site_id` type | Notes |
|-------------|----------------|-------|
| pages       | **ObjectId**   | `new mongoose.Types.ObjectId(siteId)` |
| blocks      | String         | Bare string `siteId` |
| partials    | String         | Bare string `siteId` |
| posttypes   | String         | Bare string `siteId` |
| sites       | N/A            | `_id` is the site identifier |
