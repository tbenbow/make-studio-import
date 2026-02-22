# Site Generation Learnings

Accumulated insights from generating sites from scratch. Read this before starting a new generation.

---

<!-- Entries follow this format:
## Site Name (YYYY-MM-DD)

**Prompt**: Brief description of what was requested
**Design**: Brief description of selected variation (dark/light, brand color, fonts, tone)
**Variations**: Which variation was selected and why

### What Worked
- ...

### What Didn't
- ...

### Patterns Discovered
- ...
-->

## Buccaneer's Bluff — Pirate Mini Golf (2026-02-22)

**Prompt**: Pirate mini golf venue with courses, clubhouse, pricing
**Design**: V2 selected — vibrant tropical with Bangers + Quicksand fonts, teal/sunset/sand palette
**Variations**: 4 HTML variations generated, user selected V2

### What Worked

- **4-variation generation flow** — Generating 4 distinct HTML variations with different design languages (color palettes, fonts, tones) gave the user meaningful choices. Each variation was a complete, self-contained HTML page.
- **Direct-to-fresh-site workflow** — Creating a fresh site with `--delete` flag to remove all default blocks, then syncing only custom blocks, produced a clean result with no seed content interference.
- **End-to-end setup script** — A single TypeScript script handles images → page setup → content → deploy. Repeatable and idempotent (re-running doesn't break anything).
- **R2 direct upload for images** — Avoids dependency on server-side multipart upload endpoint. Works consistently.

### What Didn't

- **Underscore vs dash confusion** — Templates initially used `{{cta_label}}` but the compiler slugifies field names with dashes: `cta-label`. Cost several debug cycles.
- **`setPageContent` with instance IDs** — First attempt used block instance UUIDs as keys. The API actually wants block names. Wasted time debugging "Block not found on site" errors.
- **Layout not assigned** — Used `updatePage(id, { layout: layoutId })` which silently did nothing. The correct path is `settings.layoutId`.
- **WebFetch unreliable for verification** — WebFetch's AI summarization missed most images and structural elements. Had to fall back to `curl | grep` for accurate HTML inspection.
- **Pull overwrites local files** — Running `npm run pull` after sync wiped all local block templates with server defaults. Only pull when explicitly needed.

### Patterns Discovered

- **The compiler's `fieldToSlug()` is the Rosetta Stone** — Every field name goes through this function: underscores→spaces→dashes, lowercase, strip non-alphanumeric. Template variables, items sub-field keys, and `setPageContent` nested keys must all align with this.
- **Items data is opaque to the API** — `setPageContent` resolves top-level field names but passes items arrays through verbatim. Sub-field keys in the data must match the template exactly.
- **`uploadFilesFromUrls` works with R2 URLs** — Upload to R2 first (for immediate CDN availability), then call `uploadFilesFromUrls` with the R2 URLs to register in the media library. Two-step but avoids MongoDB.
