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
