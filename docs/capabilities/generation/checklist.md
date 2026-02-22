# Site Generation Checklist

Quick-reference for each phase. Use alongside `guide.md`.

## Phase 1: Creative Generation

- [ ] Vibe prompt received (business type, tone, visual direction)
- [ ] 4 variations generated, each maximally different:
  - Different layout structures (asymmetric, centered, split, full-bleed)
  - Different color palettes (dark, light, warm, cool)
  - Different typography pairings
  - Different content approaches and tone
- [ ] Each variation is self-contained HTML with:
  - Tailwind CDN (`<script src="https://cdn.tailwindcss.com">`)
  - Google Fonts `<link>` tags (no local fonts)
  - No JS frameworks (plain HTML only)
  - Every `<section>` has a descriptive `id` attribute
  - Real or realistic content (no lorem ipsum)
  - Responsive: mobile-first with `sm:`, `md:`, `lg:` breakpoints
- [ ] Files saved as `themes/<name>/source/v1.html` through `v4.html`

## Phase 2: Screenshot & Selection

- [ ] Run `npm run preview-generations -- --theme=<name>`
- [ ] Screenshots saved alongside HTML files (`.png`)
- [ ] User reviews all 4 screenshots
- [ ] User selects one variation

## Phase 3: Design Extraction

- [ ] Extract colors from selected HTML → map to 10 system colors
- [ ] Extra colors → `customColors`
- [ ] Extract fonts → `fonts` array with all weight/style combos
- [ ] Map to typography tiers:
  - `heading-xl` through `heading-xs`
  - `body-lg`, `body-md`, `body-sm`
- [ ] Define 4 button variants (primary, secondary, outline, ghost)
- [ ] Build `theme.json`
- [ ] Create `Button.html` and `Button.json` partials
- [ ] Sync theme + Button: `npm run sync -- --theme=<name> --apply --only=theme,Button`

## Phase 4: Block Decomposition

For each `<section>` in the selected HTML:

- [ ] Identify section purpose → name the block (e.g., Hero, Features, Footer)
- [ ] Replace hex/rgb colors with semantic tokens (`text-fg`, `bg-brand`, etc.)
- [ ] Replace font sizes with typography tiers (`heading-xl`, `body-md`, etc.)
- [ ] Strip animation classes (add later in Phase 6)
- [ ] Wrap content in standard container: `<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">`
- [ ] Extract static text into `{{field-name}}` variables
- [ ] Convert repeating elements to `{{#each items}}...{{/each}}`
- [ ] Use `{{> Button}}` partial for all buttons
- [ ] Use `{{image field-name}}` for images
- [ ] Use `{{default field-name 'Fallback text'}}` for text with defaults
- [ ] Build `.json` field definitions:
  - Text fields: `{ "type": "text", "name": "field-name" }`
  - Rich text: `{ "type": "richText", "name": "field-name" }`
  - Images: `{ "type": "image", "name": "field-name" }`
  - Links: `{ "type": "url", "name": "field-name" }`
  - Repeaters: `{ "type": "items", "name": "items", "config": { "fields": [...] } }`
- [ ] Sync one block at a time: `npm run sync -- --theme=<name> --apply --only=BlockName`
- [ ] Pull after first sync to get server-generated IDs

## Phase 5: Pages, Layout & Preview

- [ ] Create layout with Navbar as header block, Footer as footer block
- [ ] Set up pages using `npm run setup-pages -- --theme=<name>`
- [ ] Deploy preview
- [ ] Compare preview to source HTML — check spacing, colors, typography, responsiveness

## Phase 6: Iteration

- [ ] Minor fixes: edit block files directly, re-sync
- [ ] Major changes: revise source HTML section, re-convert that block
- [ ] Add animations (Alpine.js `x-intersect`) after base design is approved
- [ ] Final preview comparison

## Phase 7: Compound

- [ ] Write learnings to `docs/capabilities/generation/learnings.md`
- [ ] Flag uncertainties in `docs/review/pending.md`
