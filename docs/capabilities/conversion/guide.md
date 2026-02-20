# Site Conversion Guide

Converting third-party websites into Make Studio themes. This merges the site conversion workflow with block format specifications.

## Prerequisites

- URL of the site to convert
- The site should be server-rendered (SSR) for best results — Nuxt, Next.js, Astro, etc.
- For SPAs, use Playwright to get the rendered HTML

## Phase 1: Analysis

### 1.1 Fetch the Page

```typescript
const response = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; ...)' }
})
const html = await response.text()
```

For SPAs or pages with client-rendered content, use Playwright:

```typescript
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(url, { waitUntil: 'networkidle' })
const html = await page.content()
```

### 1.2 Take a Reference Screenshot

```typescript
await page.screenshot({ path: 'reference-full.png', fullPage: true })
```

### 1.3 Identify Sections

Look at the page structure and identify distinct sections:

```
<body>
  <header> → Navbar block
  <main>
    <section> → Hero
    <section> → Features
    <section> → Stats
    <section> → Testimonial
    <section> → CTA
  </main>
  <footer> → Footer block
</body>
```

Name each block using PascalCase. Use descriptive suffixes for variants: `Features`, `FeaturesAlternating`.

### 1.4 Extract Colors

Map site colors to Make Studio's 10 system colors (see `docs/capabilities/design/guide.md`).

### 1.5 Extract Typography

Identify Google Fonts, heading vs body fonts, weights, and approximate sizes per tier.

## Phase 2: Theme Setup

### 2.1 Create theme.json

Build the complete theme configuration with fonts, systemColors, customColors, palette, typography, and prose. See `docs/capabilities/design/guide.md`.

### 2.2 Create Button Partial

Every theme needs a Button partial. See `docs/references/Button.md`.

### 2.3 Deploy Theme Foundation

```bash
npm run sync -- --theme=<name> --apply --only=theme,Button
```

## Phase 3: Block Conversion

For each section, working top-to-bottom:

### 3.1 Clean and Convert

Transform source HTML into clean Handlebars:

1. Strip animation classes (opacity-0, translate-y-*, transition-*, duration-*, etc.)
2. Replace color classes with semantic tokens (`bg-[#hex]` → `bg-base`)
3. Replace typography classes with tiers (`text-7xl` → `heading-xl`)
4. Apply standard container wrapper
5. Extract text into `{{fieldName}}` variables
6. Convert similar siblings to `{{#each items}}`
7. Use `{{> Button}}` for buttons
8. Wrap optional elements in `{{#if fieldName}}`
9. Clean 2-space indented HTML

### 3.2 Deploy and Verify

```bash
npm run sync -- --theme=<name> --apply --only=BlockName
```

Take a screenshot, compare to original, iterate.

## Block Format

### Standard Container

Every section block MUST use this wrapper:

```html
<section class="py-16 bg-base">
  <div class="mx-auto w-full max-w-2xl px-6 md:max-w-3xl lg:max-w-7xl lg:px-10">
    <!-- content here -->
  </div>
</section>
```

Exceptions: Navbar (sticky header), Footer, full-bleed sections.

### Handlebars Syntax

| Pattern | Usage |
|---------|-------|
| `{{fieldName}}` | Plain text (escaped) |
| `{{{fieldName}}}` | Rich text / WYSIWYG (unescaped) |
| `{{#if fieldName}}...{{/if}}` | Conditional |
| `{{#if (length items)}}...{{/if}}` | Check repeater |
| `{{#each items}}...{{/each}}` | Iterate repeater |
| `{{> PartialName}}` | Include partial |
| `{{icon "name" size="24"}}` | Phosphor icon |
| `{{#switch fieldName}}` | Switch statement |

### Field Types

| Type | Usage | Template |
|------|-------|----------|
| `text` | Single line text | `{{fieldName}}` |
| `textarea` | Multi-line plain text | `{{fieldName}}` |
| `wysiwyg` | Rich text with HTML | `{{{fieldName}}}` |
| `image` | Image URL | `{{fieldName}}` |
| `items` | Repeater | `{{#each fieldName}}` |
| `select` | Dropdown | `{{#switch fieldName}}` |
| `number` | Numeric | `{{fieldName}}` |

### Items (Repeater) Config

**IMPORTANT**: Sub-fields MUST go inside `config.fields`, NOT at the top level.

```json
{
  "type": "items",
  "name": "Features",
  "config": {
    "fields": [
      { "type": "text", "name": "Headline" },
      { "type": "wysiwyg", "name": "Description" }
    ]
  },
  "default": [
    { "headline": "Feature One", "description": "<p>Description</p>" }
  ]
}
```

### Classes to Strip

Never include: `opacity-0`, `translate-y-*`, `transition-*`, `duration-*`, `ease-*`, `data-v-*`, `v-bind`, `ng-*`, `__nuxt`, `bg-[#hex]`.

## Phase 4: Assessment

1. Full deployment: `npm run sync -- --theme=<name> --apply`
2. Full-page screenshot comparison
3. Present to human for feedback
4. Iterate on specific blocks

## Phase 5: Compound

After successful conversion, update `docs/capabilities/conversion/learnings.md`.
