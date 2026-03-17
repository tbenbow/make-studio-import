# Conversion Learnings

Accumulated insights from site conversions. Read this before starting a new conversion.

---

## PeakPerformance (2026-02-17)

**URL**: https://699333a35bec310008209eec--peakperformance-nuxt.netlify.app/
**Framework**: Nuxt 3 + Tailwind CSS
**Theme**: Dark (base=#0a0a0a, brand=#c8ff00)
**Fonts**: Bebas Neue (headings) + Inter (body)

### Key Lessons

- **Claude-driven conversion beats deterministic scraping** — Each section has unique structure that doesn't fit rigid templates. The scraper can identify sections and extract colors/fonts, but the HTML-to-Handlebars conversion needs creative judgment.
- **Work one block at a time** — Deploy, screenshot, compare, iterate. Don't batch all blocks.
- **Start with theme.json and Button** — Get the design foundation right first.
- **Nuxt sites use custom Tailwind color names** — Look for CSS variable definitions like `--color-coal: #0a0a0a`.
- **Animation classes must be stripped entirely** — Replace with Alpine.js `x-intersect` patterns.
- **Server normalizes templates on save** — Strips `x-intersect` attributes, converts `/>` to `>`, removes `target="_blank"`. After first sync, pull to get the canonical version or you'll have phantom diffs on every subsequent sync.
- **Cheerio encodes HTML entities** — `{{> Button}}` becomes `{{&gt; Button}}`. Need post-processing to decode.
- **Saturation heuristic for color mapping** — If the most-used bg is highly saturated, it's probably `brand`, not `base`.

---

## OK Go Sandbox (2026-02-17)

**URL**: https://okgosandbox.org/
**Framework**: Nuxt 3 (Vue SPA)
**Theme**: Light (base=#ffffff, brand=#46b3ff)
**Fonts**: Roboto Slab (headings) + Roboto (body)

### Key Lessons

- **Items sub-fields go in `config.fields`** — #1 gotcha. Never put sub-fields at the top level of an items field.
- **For alternating layouts, use CSS `even:` variant** — Don't try Handlebars index math. `even:lg:flex-row-reverse` works cleanly.
- **Page content uses field UUIDs, not names** — The page `content` object maps field UUID to `{ value }`.
- **Full-bleed sites skip the standard container** — Check original site's layout before applying `max-w-7xl`.
- **Use original site image URLs when no upload API exists** — Works as a stopgap.
- **Always pull before sync** — Run `npm run pull` before editing. The sync engine now enforces this.
- **Template variables use kebab-case** — `{{video-url}}`, never `{{video_url}}`.
- **Capture decorative details** — Thin separator lines, colored stripes define a site's personality.
- **Use Playwright to measure spacing** — Write measurement scripts that use `getBoundingClientRect()` and `getComputedStyle()`.
- **Add extra colors as customColors, NOT systemColors** — UI only supports fixed system colors.
- **Alpine.js for interactive content** — `x-data`, `x-show`, `@click` for videos, filters, modals.
- **Use fixed pixel dimensions for small UI elements** — Thumbnails, icons: `w-[90px] h-[50px]`.
- **Extract partials for repeated UI patterns** — Video embeds, decorative stripes, buttons.
- **VideoPlayer partial** — Shows poster image with play button, swaps to iframe on click.
- **Button system is declarative** — Styling defined in `theme.json` under `buttons`, not inline Tailwind.
- **Include `buttons` in theme.json** — The key gets wiped by theme sync if missing locally.
- **Tailwind arbitrary variants for parent-child alternation** — `[&:nth-child(even)>[data-child]]`.

---

## Kylee Leonetti — New Site Build (2026-02-20)

**URL**: https://kyleeleonetti.com/
**Framework**: WordPress
**Theme**: Light warm (base=#FDFBF7, brand=#2D5A47 deep sage)
**Fonts**: DM Serif Display (headings) + DM Sans (body)
**Approach**: "Modern evolution" — redesign, not pixel-perfect conversion

### Key Lessons

- **setup-pages was broken in 3 ways** — `createPage` doesn't accept blocks (use `updatePage` after), block refs need `{ id, blockId, name }` not `{ blockId }`, and `layoutId` goes in `settings`.
- **All 4 button variants required** — Server hardcodes `['primary', 'secondary', 'outline', 'ghost']`. Missing `outline` crashed the preview build.
- **Pull after first sync** — Server normalizes templates (strips `x-intersect`, `/>` → `>`). Pull to avoid permanent phantom diffs.
- **Clean up seed site content** — New sites come with ~25 template pages and default blocks. Delete stale pages/layouts before preview or the build crashes on missing block refs.
- **No Handlebars math helpers** — `{{multiply @index 100}}` doesn't exist. Use per-item `x-intersect` or CSS `nth-child` delays.
- **WordPress post import via REST API** — Use `/wp-json/wp/v2/posts?per_page=100&page=N&_embed` to fetch all posts. Categories via `/wp-json/wp/v2/categories`. Content comes as full HTML even on client-side rendered WP sites.
- **Use `set-content` endpoint for post import** — `PATCH /pages/:id/set-content` with `{ "BlockName": { "FieldName": value } }` is far simpler than manually wiring field UUIDs, block instance IDs, and dual content locations.
- **Post content has a different storage model** — Regular pages: `blocks[].content`. Post pages: `page.content[blockId][fieldId]`. The editor reads from different places depending on page type. The `set-content` endpoint handles this.
- **Verify your site** — When multiple sites exist locally, it's easy to import to the wrong one. Always check the editor URL's site ID matches the `.env` `MAKE_STUDIO_SITE`.

---

## OK Go Sandbox — Database Corruption Incident (2026-02-19)

### Critical Policy: NEVER write directly to MongoDB

- Direct DB writes bypass Mongoose schema casting (`site_id` must be ObjectId for pages but String for blocks)
- Direct page creation doesn't update `site.pages` array
- Multiple scripts with inconsistent approaches made diagnosis harder
- Always use the Make Studio API — it handles type casting, validation, and keeps related documents in sync

---

## Tailwind Plus — Block Library Import (2026-03-09)

**Source**: Tailwind Plus authenticated UI blocks (copy-pasted HTML)
**Theme**: Dark (base=#111827 gray-900, brand=#6366F1 indigo-500)
**Fonts**: Inter
**Approach**: Clean source HTML → convert to Make Studio blocks with semantic tokens

### Key Lessons

#### Field Types — Complete List
Make Studio supports 12 field types: `text`, `textarea`, `wysiwyg`, `image`, `video`, `link`, `options`, `number`, `date`, `toggle`, `items`, `group`. Previous docs were missing group, link, video, number, date, options (was called "select").

#### Group Fields for Fixed Layouts
Bento grids and other fixed-position card layouts should use `group` fields — not flat `card-1-title`, `card-1-description` fields. Groups create collapsible sections in the editor. Access via dot notation: `{{card-1.title}}`. Default is an object: `"default": { "title": "...", "image": "..." }`.

#### Image Refs Are Simple
Use `{{field-name}}` not `{{image field-name}}`. The `image` helper doesn't exist — images are just URL strings.

#### Items Need Default Arrays
Without a `default` array on items fields, repeaters render empty. Always populate with representative content from the source design.

#### Image Placeholders
All image fields need `"default": "https://placehold.co/WxH/bg/fg?text=Label"` with dimensions matching the intended aspect ratio.

#### No `richtext` Field Type
The validator rejects `richtext` — use `textarea` for plain multi-line or `wysiwyg` for HTML content.

#### Cleaning Script for Tailwind Plus Source
`scripts/clean-tailwind-blocks.py` handles two formats: clean code paste (top-level elements) and raw page source (HTML-encoded in srcdoc iframes). Saves significant time across 24+ files.

---

## Buccaneer's Bluff — Generated Site (2026-02-22)

**Source**: AI-generated HTML (`themes/pirate-golf/source/v2.html`)
**Theme**: Vibrant tropical (base=#fff4e0 sand, brand=#0e7a6e teal, sunset=#ff6b35, treasure=#ffd700)
**Fonts**: Bangers (headings) + Quicksand (body)
**Approach**: Generate HTML → convert to blocks → fresh site with only custom blocks

### Key Lessons

#### Template Field References Must Use `fieldToSlug()` Format

The compiler normalizes field names via `fieldToSlug()` before passing to Handlebars:
- `"Background Image"` → `background-image`
- `"CTA Label"` → `cta-label`
- `"Logo Text"` → `logo-text`

**Always use dashes in templates**, never underscores. `{{cta-label}}` not `{{cta_label}}`. Make Studio's Handlebars supports dashes directly in expressions (unlike stock Handlebars).

#### Items Sub-Field Keys Are Pass-Through

The `set-content` API resolves top-level field names to UUIDs, but items array contents pass through as-is. Sub-field keys in items data must exactly match what the template references:
- Template: `{{image}}`, `{{heading}}`, `{{cta-label}}`
- Data: `{ image: "url", heading: "text", "cta-label": "Click" }`

For sub-fields with spaces in the JSON definition (e.g., "CTA Label"), use the slugified form (`cta-label`) in both the template AND the items data.

#### Image Upload: R2 Direct + `uploadFilesFromUrls` for Registration

1. Upload to R2 via `@aws-sdk/client-s3` (converts to WebP via sharp, key = `{siteId}/{name}.webp`)
2. Call `uploadFilesFromUrls` with the R2 public URLs — server registers files in the media library
3. "File already exists" from step 2 is fine — the file is already usable

This avoids needing direct MongoDB access. The images display via CDN regardless of media library registration.

#### Layout Assignment Uses `settings.layoutId`

Not a top-level field. Must use:
```typescript
await client.updatePage(pageId, { settings: { layoutId: layoutId } })
```

#### Fresh Sites Need Cleanup

New sites come with ~25 default pages and a "Default Layout" referencing seed blocks. When creating a fresh site with custom blocks only:
1. Use `--delete` flag on sync to remove all default blocks
2. The setup-pages command handles layout creation, but existing default layouts may conflict
3. Default blog post pages remain after sync — they're harmless but messy

#### `setPageContent` Uses Block Names, Not Instance IDs

The API accepts `{ "Hero": { "Headline": "text" } }` — block names as top-level keys, field names as nested keys. Server resolves everything to UUIDs internally. Case-insensitive matching for both block names and field names.

#### End-to-End Setup Script Pattern

A single setup script should:
1. Upload images to R2 → register via `uploadFilesFromUrls`
2. Find the Index page and assign a layout (`settings.layoutId`)
3. Set block order via `updatePage(id, { blocks: [...] })`
4. Set content via `setPageContent(id, { BlockName: { Field: value } })`
5. Deploy preview

This is the repeatable pattern for any site conversion.

---

## Concierge — Custom CSS Site (2026-03-10)

**Source**: Single HTML file with embedded `<style>` (custom CSS variables, no framework)
**Theme**: Light warm (base=#f5f2ed paper, brand=#9e7c3f warm-dark, custom warm=#c8a96e)
**Fonts**: Playfair Display (headings) + DM Sans (body, weight 300)
**Approach**: Direct conversion from custom CSS to Tailwind semantic tokens

### Key Lessons

#### Always call `setPageContent` after setting block order
Block field `default` values render in the preview, but the editor fields show empty until content is explicitly set via `setPageContent`. This is the #1 gotcha — every conversion must include this step. The End-to-End Setup Script Pattern (step 4) already documents this, but it's easy to skip when blocks "look fine" in the preview.

#### Navbar and Footer go in layout `headerBlocks`/`footerBlocks`, not page blocks
Layout blocks are shared across all pages. Use `updateLayout(id, { headerBlocks: [...], footerBlocks: [...] })` with the same `{ id, blockId, name }` ref format as page blocks. The page's `blocks` array should only contain body content blocks. Set content for layout blocks via `setPageContent` on the page — it resolves block names across both page and layout blocks.

#### Custom CSS sites convert cleanly to semantic tokens
CSS variable-based sites (no Tailwind) map directly to Make Studio's system colors. The mapping is straightforward: `--paper` → `base`, `--ink` → `fg`, `--muted` → `fg-muted`, `--rule` → `border`, etc. No class-name translation needed — just identify the variables and map them.

#### `toggle` field type gets converted to `select` by server
When syncing a field with `"type": "toggle"`, the server converts it to a `select` type. Use `select` from the start if you need boolean-like behavior in items sub-fields.

#### Deleting blocks requires block ID only, not site ID
`client.deleteBlock(blockId)` — not `client.deleteBlock(siteId, blockId)`. The `getPages` list endpoint also doesn't return `blocks` array — it's only available on single-page fetch.
