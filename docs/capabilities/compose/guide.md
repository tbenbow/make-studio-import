# Site Composition Capability

Compose complete Make Studio sites by selecting from a library of existing blocks on a seed site, then generating a theme, sourcing images, and populating content — all driven by a vibe prompt.

## Why Compose?

The `/ms-generate` workflow creates sites from scratch (raw HTML → block conversion). It's creative but slow. `/ms-compose` is faster because it reuses proven, tested block templates from a seed site. The creative step is selecting which blocks to use, generating a fitting design system, and writing content — not building templates from zero.

## Prerequisites

- `SEED_SITE_ID` in `.env` — the site ID that serves as the block library
- `MAKE_STUDIO_URL`, `MAKE_STUDIO_TOKEN` in `.env` — API credentials with access to the seed site
- `PEXELS_API_KEY` in `.env` — for stock photo sourcing
- `OPENAI_API_KEY` in `.env` — for DALL-E image generation (logos, custom illustrations)

## Workflow

### Phase 1: Fetch Seed Blocks + User Prompt

**Fetch the block catalog:**

```typescript
import { MakeStudioClient } from './api.js'

const client = new MakeStudioClient(process.env.MAKE_STUDIO_URL, process.env.MAKE_STUDIO_TOKEN)
const seedSiteId = process.env.SEED_SITE_ID

const blocks = await client.getBlocks(seedSiteId)
const { partials } = await client.getPartials(seedSiteId)
```

**Build a block catalog** from the fetched blocks' `aiDescription`, `tags`, and `fields`:

```typescript
function buildBlockCatalog(blocks: ApiBlock[]): string {
  // Group blocks by thumbnailType (hero, features, stats, etc.)
  const groups: Record<string, ApiBlock[]> = {}
  for (const block of blocks) {
    const group = block.thumbnailType || block.category || 'other'
    ;(groups[group] ??= []).push(block)
  }

  let catalog = ''
  for (const [group, groupBlocks] of Object.entries(groups)) {
    catalog += `\n### ${group}\n`
    for (const block of groupBlocks) {
      const desc = block.aiDescription || block.description || '(no description)'
      const tagStr = block.tags?.length ? ` [${block.tags.join(', ')}]` : ''
      // Summarize fields: list image fields and items/repeater fields
      const imageFields = block.fields?.filter(f => f.type === 'image').map(f => f.name) || []
      const itemsFields = block.fields?.filter(f => f.type === 'items').map(f => f.name) || []
      let fieldSummary = ''
      if (imageFields.length) fieldSummary += ` | images: ${imageFields.join(', ')}`
      if (itemsFields.length) fieldSummary += ` | repeaters: ${itemsFields.join(', ')}`
      catalog += `- **${block.name}**: ${desc}${tagStr}${fieldSummary}\n`
    }
  }
  return catalog
}

const catalog = buildBlockCatalog(blocks)
```

This catalog is what gets passed to the model in Phase 2. Each entry includes:
- `aiDescription` — what the block does and when to choose it over alternatives
- `tags` — searchable categories (e.g., `minimal`, `image-heavy`, `social-proof`)
- Field summaries — which blocks need images, which have repeater items

**Collect the vibe prompt:**
- Business type and industry
- Tone (professional, playful, bold, minimal, etc.)
- Content needs (what sections matter most)
- Any specific requirements (color preferences, must-have sections)

**Ask how many variations** to generate (default: 1).

### Phase 2: Select Blocks + Generate Theme

**Pass the block catalog + vibe prompt to the model** for AI-driven block selection:

The model receives:
1. The full block catalog (built in Phase 1 with `aiDescription`, `tags`, and field summaries)
2. The user's vibe prompt (business type, tone, content needs)
3. The selection constraints below

The model selects blocks with reasoning, informed by the "choose this over X when..." guidance baked into each `aiDescription`.

**Required blocks:**
- 1 navbar (category: `header`)
- 1 hero (thumbnailType: `hero`)
- 1 footer (category: `footer`)

**Optional blocks** — model selects based on the vibe prompt + `aiDescription` guidance:
- Each `aiDescription` includes "choose this over X when..." to help the model differentiate similar blocks
- `tags` help match blocks to the prompt (e.g., `social-proof` tags for testimonial-heavy prompts)
- Field summaries show content requirements (image-heavy blocks vs text-only)

**Variation strategy** — when generating multiple variations, differ by:
- Which hero block (different layout/visual style)
- Which features block (grid vs rows vs cards)
- Which optional sections to include (more or fewer sections)
- Color palette (warm vs cool, light vs dark)
- Font pairing (serif vs sans-serif, display vs clean)

**Generate theme** for each variation using the **server theme schema** (not the simplified guide format):

```json
{
  "fonts": [
    { "family": "Playfair Display", "weight": 400, "style": "normal" },
    { "family": "Playfair Display", "weight": 700, "style": "normal" },
    { "family": "Inter", "weight": 400, "style": "normal" },
    { "family": "Inter", "weight": 600, "style": "normal" }
  ],
  "systemColors": {
    "brand": "#2563eb",
    "on-brand": "#ffffff",
    "base": "#ffffff",
    "base-muted": "#f9fafb",
    "base-alt": "#f3f4f6",
    "panel": "#ffffff",
    "border": "#e5e7eb",
    "fg": "#111827",
    "fg-muted": "#6b7280",
    "fg-alt": "#9ca3af"
  },
  "palette": {
    "primary": { "label": "primary", "colors": ["rgb(219,234,254)", "rgb(147,197,253)", "rgb(59,130,246)", "rgb(29,78,216)", "rgb(30,64,175)"] },
    "accent1": { "label": "accent-1", "colors": ["...5 shades..."] },
    "accent2": { "label": "accent-2", "colors": ["...5 shades..."] },
    "accent3": { "label": "accent-3", "colors": ["...5 shades..."] },
    "grays": { "label": "gray", "colors": ["...5 shades..."] }
  },
  "headingTypography": {
    "heading-xl": { "fontFamily": "Playfair Display", "fontWeight": 700, "fontSize": 60, "lineHeight": 65, "letterSpacing": -1.5, "mobileFontSize": 36, "mobileLineHeight": 41 },
    "heading-lg": { "fontFamily": "Playfair Display", "fontWeight": 700, "fontSize": 48, "lineHeight": 53, "letterSpacing": -1, "mobileFontSize": 30, "mobileLineHeight": 35 },
    "heading-md": { "fontFamily": "Playfair Display", "fontWeight": 700, "fontSize": 32, "lineHeight": 38, "letterSpacing": -0.8, "mobileFontSize": 24, "mobileLineHeight": 30 },
    "heading-sm": { "fontFamily": "Inter", "fontWeight": 600, "fontSize": 22, "lineHeight": 30, "letterSpacing": -0.3, "mobileFontSize": 18, "mobileLineHeight": 23 },
    "heading-xs": { "fontFamily": "Inter", "fontWeight": 600, "fontSize": 18, "lineHeight": 25, "letterSpacing": -0.2, "mobileFontSize": 16, "mobileLineHeight": 22 }
  },
  "bodyTypography": {
    "body-lg": { "fontFamily": "Inter", "fontWeight": 400, "fontSize": 18, "lineHeight": 32, "letterSpacing": 0 },
    "body-md": { "fontFamily": "Inter", "fontWeight": 400, "fontSize": 16, "lineHeight": 28, "letterSpacing": 0 },
    "body-sm": { "fontFamily": "Inter", "fontWeight": 400, "fontSize": 14, "lineHeight": 22, "letterSpacing": 0 }
  },
  "prose": {
    "elements": {
      "h1": { "typographyClass": "heading-xl", "marginBottom": 1.5 },
      "h2": { "typographyClass": "heading-lg", "marginBottom": 1.25 },
      "h3": { "typographyClass": "heading-md", "marginBottom": 1 },
      "h4": { "typographyClass": "heading-sm", "marginBottom": 0.75 },
      "h5": { "typographyClass": "heading-xs", "marginBottom": 0.5 },
      "h6": { "typographyClass": "heading-xs", "marginBottom": 0.5 },
      "p": { "typographyClass": "body-md", "marginBottom": 1.25 },
      "ul": { "typographyClass": "body-md", "marginBottom": 1.25 },
      "ol": { "typographyClass": "body-md", "marginBottom": 1.25 }
    },
    "lists": { "listStyleType": "disc", "indent": 1.5, "itemSpacing": 0.5, "nestedIndent": 1.5 },
    "links": { "color": "accent", "hoverColor": "primary", "underline": "always" },
    "customCSS": ""
  },
  "buttons": {
    "global": {
      "fontFamily": "'Inter', sans-serif",
      "fontWeight": 600,
      "uppercase": false,
      "sizes": {
        "lg": { "fontSize": 16, "letterSpacing": 0, "opticalYOffset": 0, "paddingTop": 12, "paddingBottom": 12, "paddingLeft": 24, "paddingRight": 24, "borderRadius": 8 },
        "md": { "fontSize": 14, "letterSpacing": 0, "opticalYOffset": 0, "paddingTop": 10, "paddingBottom": 10, "paddingLeft": 20, "paddingRight": 20, "borderRadius": 6 },
        "sm": { "fontSize": 12, "letterSpacing": 0, "opticalYOffset": 0, "paddingTop": 8, "paddingBottom": 8, "paddingLeft": 16, "paddingRight": 16, "borderRadius": 4 }
      }
    },
    "variants": {
      "primary": { "backgroundColor": "system:brand", "textColor": "system:on-brand", "borderColor": "transparent", "borderWidth": 1, "hoverPreset": "scale" },
      "secondary": { "backgroundColor": "system:base-muted", "textColor": "system:fg", "borderColor": "transparent", "borderWidth": 1, "hoverPreset": "darken" },
      "outline": { "backgroundColor": "transparent", "textColor": "system:brand", "borderColor": "system:brand", "borderWidth": 1, "hoverPreset": "fill" },
      "ghost": { "backgroundColor": "transparent", "textColor": "system:fg", "borderColor": "transparent", "borderWidth": 1, "hoverPreset": "darken" }
    }
  }
}
```

**Important**: Font sizes and line heights use **pixel values** (not rem). Font entries are **individual weight objects** (not arrays). Colors use `systemColors` (not `colors`). Buttons use `global`/`variants` (not flat CSS). Always reference the seed site's theme as a model for the correct schema.

See `docs/capabilities/design/guide.md` for full color/typography/button reference.

**Save each variation** to `themes/<name>/source/variation-N.json`:

```json
{
  "blocks": ["Navbar1", "Hero2", "Features1", "Testimonials1", "CTA1", "Footer1"],
  "theme": { "...theme.json contents..." },
  "rationale": "Selected split-hero for visual impact, 3-col features for services, testimonials for trust"
}
```

### Phase 3: Source Images

**Analyze selected blocks' fields** to identify all `image` fields:
- Examine each selected block's `fields` array
- Find fields with `type: "image"` at the top level
- Find image fields inside `items` sub-fields (repeaters)
- Count total images needed

**Source images using existing scripts:**

For stock photos (hero backgrounds, team photos, feature images, product shots):
```bash
npx tsx scripts/search-pexels.ts --query="modern office teamwork" --out=themes/<name>/source/images/ --count=3
```

For custom/branded images (logos, abstract illustrations):
```bash
npx tsx scripts/generate-image.ts --prompt="Minimalist geometric logo mark..." --out=themes/<name>/source/images/logo.png
```

**Image sourcing strategy:**
- **Pexels** for: hero backgrounds, team photos, feature illustrations, product shots, office/lifestyle imagery
- **DALL-E** for: logos, custom icons, abstract/branded graphics, illustrations that need to match the brand

**Upload to CDN:**
```typescript
const uploadedFiles = await client.uploadFilesFromUrls(siteId, [
  { url: 'https://r2-url/hero-bg.jpg', name: 'hero-bg.jpg' },
  { url: 'https://r2-url/team-1.jpg', name: 'team-1.jpg' },
  // ...
])
```

Store a URL mapping for use in Phase 5 content population.

### Phase 4: Create Site + Push Blocks/Theme

> **Recommended**: Use `scripts/compose-site.ts` instead of manual steps. It bakes in all the learnings below.
> ```bash
> npx tsx scripts/compose-site.ts --config=themes/<name>/compose.json [--site-id=xxx] [--dry-run]
> ```

**Create a new site** (or use existing):
```typescript
// New site — response is flat: { _id, name, apiToken, ... }
const result = await client.createSite('My Composed Site')
const siteId = result._id
const apiToken = result.apiToken

// Or use existing
const siteId = process.env.MAKE_STUDIO_SITE
```

**Push the theme:**
```typescript
await client.updateSiteTheme(siteId, theme)
```

**Copy partials** (Button, Field) from the seed site:
```typescript
for (const partialName of ['Button', 'Field']) {
  const existing = existingPartials.find(p => p.name === partialName)
  if (existing) continue // skip if already exists
  const seedPartial = seedPartials.find(p => p.name === partialName)
  if (seedPartial) {
    await client.createPartial({ name: partialName, site_id: siteId, template: seedPartial.template })
  }
}
```

**Delete ALL existing blocks** — `createSite` creates default blocks with matching names but different templates:
```typescript
const existingBlocks = await client.getBlocks(siteId)
for (const block of existingBlocks) {
  await client.deleteBlock(block._id)
}
```

**Create selected blocks** on the target site from seed:
```typescript
for (const blockName of selectedBlockNames) {
  const seedBlock = seedBlocks.find(b => b.name === blockName)
  await client.createBlock({
    name: seedBlock.name,
    site_id: siteId,
    template: seedBlock.template,
    fields: seedBlock.fields,
    category: seedBlock.category
  })
}
```

**Clear layout headerBlocks/footerBlocks** — don't put navbar/footer in the layout (they won't render page content due to different instance IDs):
```typescript
const layouts = await client.getLayouts(siteId)
const defaultLayout = layouts.find(l => l.isDefault) || layouts[0]
await client.updateLayout(defaultLayout._id, {
  headerBlocks: [],
  footerBlocks: [],
})
```

**Important notes:**
- Only copy blocks that were selected — don't import the entire seed library
- Delete ALL existing blocks first — default blocks share names with seed but have different templates
- Can't delete the default layout — use `updateLayout()` to clear it instead
- Keep the Index page — we'll update it in Phase 5

### Phase 5: Populate Content + Deploy

**Get the existing Index page:**
```typescript
const pages = await client.getPages(siteId)
const indexPage = pages.find(p => p.name === 'Index' || p.slug === '/')
```

**Assign ALL blocks to page** — navbar first, content middle, footer last. Don't put navbar/footer in the layout (see learnings: layout blocks use different instance IDs and won't render page content):

```typescript
const navbarName = selectedBlockNames.find(n => createdBlocks[n]?.category === 'header')
const footerName = selectedBlockNames.find(n => createdBlocks[n]?.category === 'footer')
const contentNames = selectedBlockNames.filter(n => n !== navbarName && n !== footerName)

const orderedNames = [
  ...(navbarName ? [navbarName] : []),
  ...contentNames,
  ...(footerName ? [footerName] : []),
]

const blockRefs = orderedNames.map(name => ({
  blockId: createdBlocks[name]._id,
  id: uuidv4(),
  name: createdBlocks[name].name,  // Required — omitting causes validation error
}))

await client.updatePage(indexPage._id, {
  blocks: blockRefs,
  settings: { layoutId: defaultLayout._id },
})
```

**Set ALL content** (including navbar/footer) via a single `setPageContent` call. Use `$key` syntax for image references that get resolved to CDN URLs:

```typescript
const content = {
  "Navbar": {
    "Logo Text": "My Company",
    "Links": [
      { "label": "About", "url": "/about" },
      { "label": "Contact", "url": "/contact" }
    ]
  },
  "Hero": {
    "Headline": "Welcome",
    "Photo": "$hero",  // Resolved to CDN URL before calling API
  },
  "Features Triple": {
    "Eyebrow": "What We Offer",
    "Features": [  // Use the FIELD NAME, not "items"
      { "title": "Fast", "description": "...", "image": "$feature1" },
      { "title": "Easy", "description": "...", "image": "$feature2" }
    ]
  },
  "FooterNewsletter": {
    "Copyright": "<p>&copy; 2026 My Company</p>",
    "Categories": [  // Field name, not "items"
      { "title": "Company", "links": "<a href=\"/about\">About</a>" }
    ]
  }
}

// Resolve $key image refs to CDN URLs
const resolved = resolveImageRefs(content, imageUrls)
await client.setPageContent(indexPage._id, resolved)
```

**Critical `setPageContent` rules:**
- Keys are **block names**, not IDs
- Items fields use the **FIELD NAME** (e.g., `"Features"`, `"Categories"`, `"Links"`) — NOT `"items"`
- Items sub-field keys are lowercase matching the template (e.g., `title`, `description`, `image`)
- `setPageContent` auto-adds blocks and **disrupts block order**
- Image fields get CDN URLs (use `$key` refs in compose config for convenience)

**Re-order blocks** after `setPageContent` (it shuffles the order):
```typescript
const currentPage = await client.getPage(indexPage._id)
const reordered = []
for (const name of orderedNames) {
  const found = currentPage.blocks.find(b => b.name === name)
  if (found) reordered.push(found)
}
await client.updatePage(indexPage._id, { blocks: reordered })
```

**Deploy preview:**
```typescript
const preview = await client.deployPreview(siteId)
```

Verify with `curl | grep` (not WebFetch — the AI model is unreliable for HTML verification):
- All blocks render correctly
- Images load
- Colors and typography match the theme
- Navbar and footer render with correct content (not template defaults)
- Content is populated, not placeholder

## Key References

- `docs/capabilities/design/guide.md` — Color tokens, typography tiers, button variants
- `docs/capabilities/blocks/guide.md` — Block structure and field definitions
- `docs/references/` — Gold-standard block examples
- `docs/guides/api-reference.md` — All API client methods
- `docs/capabilities/generation/learnings.md` — Learnings from generate workflow (field slugification, setPageContent patterns)

## Critical Implementation Details

- **Seed site blocks come with full `template` and `fields`** via `getBlocks()` — no need to read local files
- **Only copy blocks that are selected** — don't import the entire seed library
- **Replace Index page content, don't create a new page** — new sites come with an Index page
- **Delete ALL default blocks first** — `createSite` creates blocks with names matching the seed (Navbar, Hero, etc.) but with different templates. Delete ALL existing blocks, then create from seed.
- **Don't use layouts for navbar/footer content** — layout blocks don't render page content (they use different instance IDs). Instead: clear `headerBlocks`/`footerBlocks` on the layout, put navbar first and footer last in the page blocks array.
- **Button partial must be copied** — blocks reference `{{> Button}}` so the partial must exist on the target site
- **`setPageContent` uses block names as keys** — e.g., `{ "Hero": { "Headline": "..." } }`, not IDs
- **Items fields use the FIELD NAME, not "items"** — e.g., `{ "Features Triple": { "Features": [...] } }` not `{ "Features Triple": { "items": [...] } }`
- **`setPageContent` auto-adds blocks and disrupts order** — after all `setPageContent` calls, re-order the page blocks to the desired sequence with `updatePage({ blocks: orderedRefs })`
- **Block refs require `name` field** — `updatePage({ blocks })` and `updateLayout({ headerBlocks })` both need `{ blockId, id, name }`. Omitting `name` causes a validation error.
- **Items sub-fields use lowercase keys matching the template** — items data is passed through verbatim; keys like `title`, `description`, `image` must match what `{{#each}}` expects in the Handlebars template
- **Layout assignment uses `settings.layoutId`** — not `layout` directly on the page object
- **Upload images via `uploadFilesFromUrls`** — works with R2 URLs, registers in media library
- **Theme must use server schema** — `systemColors` (not `colors`), `headingTypography`/`bodyTypography` (pixel values, not rem), `buttons.global`/`buttons.variants` (not flat CSS), individual font `{family, weight, style}` entries (not weight arrays), `palette`, `prose`. Wrong format causes 500 errors on deploy.
- **`createSite` response is flat** — `{ _id, name, apiToken }`, not `{ site, apiToken }`
