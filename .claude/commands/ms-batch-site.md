---
description: Unattended per-site conversion for batch pipeline. Pass the site ID as an argument.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent, WebFetch
---

You are running an **unattended** batch conversion. No human interaction — complete all phases autonomously.

The site ID is: `$ARGUMENTS`

## Setup

Read the config from `.batch-state/$ARGUMENTS/config.json`. It contains:
- `siteId` — the Make Studio site ID
- `apiToken` — site-scoped API token
- `name` — the site display name
- `sourceUrl` — the live URL to convert
- `pages` — array of `{ path, name, isHome }` page definitions

Set env vars for this conversion:
```bash
export MAKE_STUDIO_SITE=<siteId from config>
export MAKE_STUDIO_TOKEN=<apiToken from config>
```

## Heartbeat

After every significant step, write a heartbeat file:
```bash
echo '{"phase": <N>, "phaseName": "<name>", "timestamp": "<ISO>", "detail": "<what just happened>"}' > .batch-state/$ARGUMENTS/heartbeat
```

The orchestrator kills processes with stale heartbeats (>10 min).

## Conversion Rules

These rules are **mandatory** for all block conversions:

1. **Buttons**: Items field with sub-fields: Label (text, FIRST), Link (link), Style (select + `config.dataStoreId` from site's "Button Style" data store), Size (select + `config.dataStoreId` from site's "Button Size" data store). Use `{{> Button}}` partial. Get data store IDs by reading the site: `GET /sites/<siteId>` → `dataStores` array, find by name. Never use separate CTA text/link fields.
2. **First items sub-field must be text** type for readable CMS labels.
3. **Field names**: Use `fieldToSlug()` in templates: `Background Image` → `{{background-image}}`.
4. **Items**: Sub-fields go in `config.fields`, NOT top-level. Default array items use slugified keys.
5. **Animations**: Strip `opacity-0`, `translate-y-*`, `transition-*`, `duration-*`. Use Alpine.js `x-intersect.once` if needed.
6. **Colors**: Use semantic tokens (`bg-base`, `text-fg`, `bg-brand`, `text-brand`). Extras go in theme `customColors` array.
7. **Typography**: Extract via Playwright computed styles → map to tiers (`heading-xl`…`heading-xs`, `body-lg/md/sm`).
8. **Images**: `{{field-name}}` in templates (NOT `{{image field-name}}`). Defaults: `https://placehold.co/WxH/bg/fg?text=Label`.
9. **Container**: `<div class="max-w-7xl mx-auto px-6">` (consistent across all blocks).
10. **Block descriptions**: Max 30 characters.
11. **Every visible field needs a default value**.
12. **Valid field types**: text, textarea, wysiwyg, image, video, link, select, number, date, toggle, items, group.
13. **Select fields**: Need `config.selectOptions: [{ key, value }]` or `config.dataStoreId`.
14. **All 4 button variants** must be in theme: primary, secondary, outline, ghost.
15. **Wysiwyg**: Use triple braces `{{{field}}}` in templates.
16. **Icons**: Use `{{icon "name" size="20"}}` helper for Phosphor icons. Never hardcode SVGs.
17. **Items need IDs**: Each item in content arrays must have a unique `id` field.
18. **Block order**: Set block order on pages BEFORE setting content, never after.
19. **Layout blocks**: Exclude Navbar/Footer from page body content — they go in the layout headerBlocks/footerBlocks.

## Phases

### Phase 0: Read Config
- Read `.batch-state/$ARGUMENTS/config.json`
- Create `themes/$ARGUMENTS/` directory
- Write heartbeat: phase 0

### Phase 1: Fetch Source
- Use Playwright to render each page URL from the config
- Save HTML to `.batch-state/$ARGUMENTS/source/<pagename>.html`
- Take full-page screenshots to `.batch-state/$ARGUMENTS/source/<pagename>-screenshot.png`
- Extract computed styles via `getComputedStyle()` for typography mapping (font-family, font-size, font-weight, line-height, letter-spacing, color for h1-h6, p, a, button, etc.)
- Collect all `<img>` src URLs for later upload
- Write heartbeat after each page

### Phase 2: Analyze & Create Theme
- From HTML + screenshots + computed styles, create `themes/$ARGUMENTS/theme.json`:
  - `systemColors`: Extract brand colors, backgrounds, foreground from the source
  - `fonts`: Map font families to Google Fonts or custom fonts
  - `typography`: Map to tiers (heading-xl through heading-xs, body-lg/md/sm)
  - `buttons`: All 4 variants (primary, secondary, outline, ghost)
  - `prose`: Prose styling
- Create `themes/$ARGUMENTS/converted/partials/Button.html` using the standard Button partial pattern
- Identify all page sections as blocks: list names and categories
- Write heartbeat

### Phase 3: Convert Blocks
- Read shared learnings from `.batch-state/learnings.md`
- For each identified section, create:
  - `themes/$ARGUMENTS/converted/blocks/BlockName.html` — Handlebars template
  - `themes/$ARGUMENTS/converted/blocks/BlockName.json` — Field definitions with defaults
- Follow ALL conversion rules above
- Write heartbeat after each block

### Phase 4: Bootstrap
- Read all generated theme, partials, and block files
- Build the bootstrap payload:
  ```
  {
    theme: <from theme.json>,
    partials: [{ name, template }],
    blocks: [{ name, template, fields, category, blockCategory, description }],
    layout: { name: "Default", headerBlocks: ["Navbar"], footerBlocks: ["Footer"] },
    pages: [{ name, slug, isHome, blocks: [...], content: {...} }]
  }
  ```
- Call the bootstrap API: `POST /sites/<siteId>/bootstrap`
  ```bash
  curl -X POST "${MAKE_STUDIO_URL}/sites/${siteId}/bootstrap" \
    -H "Authorization: Bearer ${apiToken}" \
    -H "Content-Type: application/json" \
    -d @payload.json
  ```
- Write heartbeat

### Phase 5: Upload Images
- Download source images from collected URLs
- Upload via `POST /files/upload-from-urls` in batches of 20
- Update page content with CDN URLs via `PATCH /pages/:id/set-content`
- Write heartbeat

### Phase 6: Deploy & Screenshot
- Deploy preview: `POST /static-site/preview/<siteId>`
- Take Playwright screenshots of both:
  - Source pages (original URLs)
  - Preview pages (from previewUrl)
- Save screenshots to `.batch-state/$ARGUMENTS/`
- Write heartbeat

### Phase 7: Iterate (max 2 rounds)
- Compare source vs preview screenshots visually
- Identify mismatches: wrong colors, broken layout, missing content, wrong spacing
- For each issue:
  - Fix the block template or field defaults
  - Re-sync changed blocks via the API
  - Re-deploy preview
  - Re-screenshot
- Max 2 iteration rounds, then accept the result
- Write heartbeat

### Phase 8: Write Learnings
- Append findings to `.batch-state/learnings.md`:
  - What worked well
  - Unexpected patterns found in the source
  - Workarounds applied
  - Tips for similar sites
- Use `>>` append to avoid conflicts with parallel conversions
- Write heartbeat

### Phase 9: Done
- Write `.batch-state/$ARGUMENTS/result.json`:
  ```json
  {
    "status": "done",
    "previewUrl": "...",
    "blocks": <count>,
    "pages": <count>,
    "iterationCount": <0-2>,
    "errors": []
  }
  ```
- Write final heartbeat: `{"phase": 9, "phaseName": "done", ...}`
