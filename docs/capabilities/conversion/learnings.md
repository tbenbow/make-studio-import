# Conversion Learnings

Accumulated insights from site conversions. Read this before starting a new conversion.

---

## Fofood Store (2026-03-18)

**URL**: https://fofood-store.vercel.app/
**Framework**: Next.js App Router + Tailwind CSS
**Theme**: Light pink (base=#ffffff, brand=#DB6885, base-muted=#FFF4F5)
**Fonts**: Figtree (headings + body) + Fredoka (eyebrows/captions only)
**Approach**: Full conversion with Playwright analysis, R2 image upload, Alpine carousel

### Key Lessons

#### Extract typography from computed styles, never guess
Next.js compiles Tailwind config into opaque chunks — you can't read the source CSS. Use Playwright `getComputedStyle()` on every typography class to get exact fontFamily, fontSize, fontWeight, lineHeight, and letterSpacing values. The initial theme had Fredoka for headings when it was actually Figtree — the mistake was visible immediately. Run the extraction script for both desktop (1440px) and mobile (375px) viewports to get mobile overrides too.

#### `setPageContent` adds missing blocks to the page body
If you call `setPageContent(pageId, { Navbar: {...}, Hero: {...} })` and Navbar is a layout block (not in page body), the API will ADD Navbar to the page's `blocks` array. This causes duplicate rendering — Navbar appears once from the layout and once from the body. **Always exclude layout blocks (Navbar, Footer) from setPageContent payloads.** Set their content separately or rely on field defaults.

#### `updatePage({ blocks })` generates new instance IDs that orphan content
Content is stored in `page.content` keyed by block instance UUIDs. When you call `updatePage` with `blocks: [{ id: crypto.randomUUID(), ... }]`, new instance IDs are created and the content becomes unreachable. **Always set block order BEFORE setting content.** The correct sequence is:
1. `updatePage(pageId, { blocks: [...] })` — establish order with new IDs
2. `setPageContent(pageId, { BlockName: { ... } })` — content maps to current IDs

Never call `updatePage` to fix block order AFTER `setPageContent` — it will wipe the content.

#### Buttons should use items field with data store selects
Don't use separate `CTA Label` / `CTA Link` text fields for buttons. Use an `items` field named "Buttons" with sub-fields:
- `Label` (text) — first, so it's the CMS list label
- `Link` (text)
- `Style` (select with `config.dataStoreId` pointing to the "Button Style" data store)
- `Size` (select with `config.dataStoreId` pointing to the "Button Size" data store)

Default style to `primary`, size to `medium`. The Button partial needs a switch to map data store values (`small`/`medium`/`large`) to CSS classes (`sm`/`md`/`lg`).

#### First items sub-field must be a human-readable string
The CMS uses the first sub-field as the list item label. If the first field is an `image`, every item shows a URL as its label. Always put a text field (Name, Title, Label) first in `config.fields`.

#### Data store selects use `config.dataStoreId`, not `selectOptions`
For selects backed by a site-wide data store, use `{ "type": "select", "config": { "dataStoreId": "..." } }`. Don't inline `selectOptions` — data stores keep options consistent across all blocks. Get IDs from `site.dataStores` on the site object.

#### Lazy-loaded images need Playwright scroll or direct URL construction
`page.evaluate()` only captures images in the initial viewport. For Next.js sites with lazy loading, either scroll the page first (`window.scrollTo` in a loop) or construct URLs from known patterns (e.g., `/_next/image?url=...&w=640&q=75` or `/assets/img/food-{N}.png`).

#### Pull before sync overwrites local files
Running `npm run pull` downloads ALL remote blocks into the local theme directory — including blocks from other themes on the same site. This overwrites any local files you've created. Use `--only` on sync to target specific blocks, and don't pull into a fresh theme directory that shares a site with an existing block library.

#### Items array entries must include `id` fields — now fixed in the API
The CMS editor needs each item in an items array to have a unique `id` field. Without IDs, clicking any item shows the first item's content, and editing any item overwrites the first. The `set-content` endpoint was patched (`make-studio/server/routes/pages.ts`) to auto-add `id: crypto.randomUUID()` to items that lack one. This means `setPageContent` now handles it — no need to add IDs manually in content scripts. Items sub-field keys should use the slugified form (not sub-field UUIDs).

#### Register images in media library in batches of 20
`uploadFilesFromUrls` has a 20-file limit per request. When uploading many images, batch them: `allFiles.slice(i, i + 20)`. The first upload script hit this limit silently, leaving most images unregistered in the media library (they still rendered via CDN but weren't selectable in the CMS image picker).

#### Multi-page conversions: reuse blocks, only create what's new
After the initial homepage conversion (14 blocks), subsequent pages needed far fewer new blocks:
- **About page**: 4 new blocks (PageHeader, Values, ContentVideo, ChefGrid) + 2 reused (AboutUs, Testimonials)
- **Blog page**: 0 new blocks — all reused (PageHeader, Blog×2)
- **Product detail**: 1 new block (ProductDetail) + 1 reused (PopularMenu)
- **Blog post**: 1 new block (BlogPost) + 1 reused (Blog)

Design blocks to be reusable across pages by keeping content in fields rather than hardcoding.

#### Clean up seed blocks at the start of a conversion
When converting onto an existing site, delete all seed/default blocks first — or do it after conversion. The site ended up with 99 leftover blocks from a previous theme alongside our 14 Store blocks. Use a cleanup script that keeps only the blocks you created: `client.deleteBlock(id)` for each non-conversion block. This should be a standard step in the conversion workflow.

#### Preview URLs for non-index pages need `.html` extension
The preview worker doesn't do clean URL rewriting. `/about` returns 404 but `/about.html` works. When verifying new pages, always check with the `.html` extension. This is a worker/CDN routing issue, not a build issue — the page is generated correctly.

#### Alpine.js carousel pattern for testimonials/sliders
```html
<div x-data="{ active: 0, count: {{length items}} }">
  <div class="overflow-hidden">
    <div class="flex transition-transform duration-500"
         :style="'transform: translateX(-' + (active * 100) + '%)'">
      {{#each items}}
        <div class="w-full flex-shrink-0 px-4">...</div>
      {{/each}}
    </div>
  </div>
  <div class="flex justify-center gap-3">
    <template x-for="i in count">
      <button @click="active = i - 1"
              :class="active === i - 1 ? 'bg-brand' : 'bg-brand/30'"
              class="h-3 w-3 rounded-full"></button>
    </template>
  </div>
</div>
```

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

## WOOL Film — Live Site Conversion (2026-04-02)

**URL**: https://www.wool.film/
**Framework**: Squarespace
**Theme**: Dark cinematic (base=#000000, brand=#38bdf8, fg=#ffffff)
**Fonts**: widescreen (Typekit, headings xl/sm/xs + body-lg), Manrope (headings lg/md), Poppins (body md/sm)
**Approach**: Screenshot-based (`/ms-convert-live`) — 3 iterations to get right

### Key Lessons

#### Generate blocks locally with Claude, not via the API endpoint
The app's `POST /blocks/generate-template` endpoint produces structurally correct blocks in ~7 seconds, but the output has consistent problems: it adds rounded corners (`rounded-md`) that aren't in the source, uses wider spacing than shown, and picks "safe" Tailwind defaults over what's actually in the screenshot. Writing blocks locally with Claude Code using the section screenshot + theme.json + checklist produces much more faithful results. The local render loop (`render-block.ts`) takes ~5 seconds per iteration with no deployment needed.

#### `setPageContent` field name resolution uses exact field names, not slugs
The API resolves field names case-insensitively but requires the **exact field name with spaces** — NOT kebab-case slugs. `'Photo URL'` works, `'photo-url'` does not. Single-word names like `'Name'` or `'Role'` work in both cases since the slug equals the lowercase name. For items sub-fields within arrays, use **lowercase slug keys** (`photo`, `name`, `role`) since those pass through to templates verbatim.

#### Typekit fonts need `source` and `kitId` in theme.json fonts array
The PageRenderer generates `<link rel="stylesheet" href="https://use.typekit.net/{kitId}.css">` by reading `theme.fonts[]` for entries with `source: 'typekit'`. Putting the Typekit link in `customCode.head` does NOT work because `customCode` and `theme` are separate fields — the renderer only reads from `theme.fonts[]`. Font entries must include: `{ "family": "widescreen", "weight": 100, "style": "normal", "source": "typekit", "kitId": "tni1riq" }`.

#### Local renderer needs `fieldToSlug()` to match server compiler
The server's `TemplateAnalysisService.fieldToSlug()` converts field names to kebab-case for Handlebars: `"Photo URL"` → `photo-url`. The local `render-block.ts` must do the same in `extractDefaults()` or templates render empty. The slug algorithm: `name.replace(/_/g, ' ').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()`.

#### Local renderer needs font links (Google + Typekit) in HTML head
The original `render-block.ts` had no font loading — all blocks rendered in system fonts. Added `generateFontLinks()` that reads `theme.fonts[]` and emits Google Fonts `<link>` tags and Typekit `<link>` tags. Without this, local renders don't match production and font-dependent layouts are wrong.

#### API token auth bug: `accessCheckBlock` rejected tokens for update/delete
The `accessCheckBlock` middleware in `server/routes/blocks.ts` checked `if (!userId)` before checking `req.apiToken`, rejecting all API token requests for PATCH/DELETE with "Authentication required". The fix: `if (!userId && !req.apiToken)`. The `assertSiteAccess` call downstream already handles API tokens correctly. Pages middleware didn't have this bug because it checks `req.apiToken` first.

#### Keep field names simple to avoid slug mismatch pain
Multi-word field names like "Bio Paragraph 1" create slug `bio-paragraph-1` which is hard to remember and easy to typo. Single-word names (`Heading`, `Photo`, `Name`, `Bio`) slug to their lowercase form and work in both `setPageContent` (exact name) and templates (slug). Use items fields instead of numbered fields (e.g., one `Bio` wysiwyg field instead of `Bio Paragraph 1/2/3`).

#### The render → compare → iterate loop is the fastest path
Writing a block, rendering locally in ~5s, comparing side-by-side with the source screenshot, and tweaking — this loop is 10x faster than deploying to preview each time. Reserve deployment for final verification after all blocks are done.

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
