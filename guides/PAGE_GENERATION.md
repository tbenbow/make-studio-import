# Page Generation Guide

Generate and import pages composed of blocks from the stock library.

## Overview

This feature allows you to:
1. Generate a block catalog from a theme (so AI understands available blocks)
2. Write page content in a simple JSON format
3. Validate pages against the catalog
4. Import pages directly to Make Studio

## Quick Start

```bash
# 1. Generate the block catalog
npm run generate-catalog -- --theme=stock

# 2. Create a site folder
mkdir -p sites/mysite/pages

# 3. Create site.json with your Make Studio site ID
echo '{"siteId": "YOUR_SITE_ID", "theme": "stock", "name": "My Site"}' > sites/mysite/site.json

# 4. Write a page (see format below)
# 5. Validate it
npm run validate-page -- --site=mysite --page=home

# 6. Import to Make Studio
npm run import-page -- --site=mysite --page=home
```

## Directory Structure

```
sites/
└── <site-name>/
    ├── site.json         # Links site to Make Studio
    ├── content/          # Reference docs for AI (company info, copy, etc.)
    └── pages/
        └── <page>.json   # Page interchange files
```

### site.json

```json
{
  "siteId": "6789abc...",
  "theme": "stock",
  "name": "Acme Corp Website"
}
```

- `siteId`: Your Make Studio site's MongoDB ID
- `theme`: Which theme's blocks to use (must have catalog generated)
- `name`: Human-readable name (for reference only)

## Block Catalog

The catalog (`themes/<theme>/catalog.json`) is auto-generated from block JSON files. It tells you what blocks exist and what fields they accept.

### Generate a Catalog

```bash
npm run generate-catalog -- --theme=stock
```

### Catalog Structure

```json
{
  "theme": "stock",
  "generatedAt": "2026-02-05T...",
  "blocks": [
    {
      "name": "Hero",
      "description": "Text w/ optional photo",
      "category": "hero",
      "fields": [
        {
          "name": "Eyebrow",
          "type": "text",
          "default": "Welcome"
        },
        {
          "name": "Buttons",
          "type": "items",
          "default": [{ "label": "Get started", "link": "#", "style": "primary" }],
          "itemFields": [
            { "name": "Label", "type": "text" },
            { "name": "Link", "type": "text" },
            { "name": "Style", "type": "select", "options": [...] }
          ]
        }
      ]
    }
  ]
}
```

Key catalog features:
- **Categories** are inferred from block names (hero, features, pricing, etc.)
- **Select fields** include their `options` array
- **Items fields** include `itemFields` showing the structure of each item
- **Defaults** show expected data shape

## Page Interchange Format

Pages are JSON files in `sites/<name>/pages/<page>.json`.

### Basic Structure

```json
{
  "name": "Home",
  "settings": {
    "title": "Home - Acme Corp",
    "description": "Meta description for SEO"
  },
  "blocks": [
    {
      "block": "Hero",
      "content": {
        "Eyebrow": "Welcome to Acme",
        "Headline": "Build products customers love"
      }
    }
  ]
}
```

### Field Reference

| Property | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Page name (shown in Make Studio) |
| `settings.title` | Recommended | Page title for SEO |
| `settings.description` | Optional | Meta description |
| `blocks` | Yes | Array of blocks to render |
| `blocks[].block` | Yes | Block name (must match catalog) |
| `blocks[].content` | Optional | Field values (omitted = use defaults) |

### Content Field Names

Use the **human-readable field names** from the catalog, not UUIDs:

```json
{
  "block": "Hero",
  "content": {
    "Eyebrow": "Welcome",
    "Headline": "Your headline here",
    "Subheadline": "<p>Supporting text with <strong>HTML</strong>.</p>"
  }
}
```

Field names are case-insensitive during validation and import.

### Field Types

**Text fields** — Plain strings:
```json
"Headline": "Your headline here"
```

**Rich text fields** (wysiwyg) — HTML strings:
```json
"Subheadline": "<p>Paragraph with <a href=\"/link\">links</a> and <strong>formatting</strong>.</p>"
```

**Image fields** — URL strings:
```json
"Photo": "https://images.unsplash.com/photo-123?w=1200"
```

**Select fields** — Value from options:
```json
"align": "items-center text-center"
```

**Items fields** (repeaters) — Arrays of objects:
```json
"Buttons": [
  { "label": "Get started", "link": "/signup", "style": "primary" },
  { "label": "Learn more", "link": "/about", "style": "ghost" }
]
```

Item field names also use human-readable names from `itemFields` in the catalog.

### Omitting Fields

Any field you don't specify uses the block's default value:

```json
{
  "block": "Hero",
  "content": {
    "Headline": "Custom headline"
    // Eyebrow, Subheadline, Photo, Buttons all use defaults
  }
}
```

### Same Block Multiple Times

Blocks can repeat:

```json
{
  "blocks": [
    { "block": "Testimonial", "content": { "Name": "Alice", "Quote": "..." } },
    { "block": "Testimonial", "content": { "Name": "Bob", "Quote": "..." } }
  ]
}
```

## Complete Example

```json
{
  "name": "Home",
  "settings": {
    "title": "Home - Acme Corp",
    "description": "Acme Corp helps teams ship faster"
  },
  "blocks": [
    {
      "block": "Navbar",
      "content": {
        "Logo Text": "Acme",
        "Links": [
          { "label": "Features", "url": "#features" },
          { "label": "Pricing", "url": "#pricing" }
        ],
        "Button Label": "Get Started",
        "Button Link": "/signup"
      }
    },
    {
      "block": "Hero",
      "content": {
        "Eyebrow": "Introducing Acme",
        "Headline": "Ship products your customers love",
        "Subheadline": "<p>The all-in-one platform for modern teams.</p>",
        "Buttons": [
          { "label": "Start free trial", "link": "/signup", "style": "primary" },
          { "label": "Watch demo", "link": "/demo", "style": "ghost" }
        ]
      }
    },
    {
      "block": "Features Grid",
      "content": {
        "Headline": "Everything you need",
        "Features": [
          {
            "icon": "rocket",
            "headline": "Fast",
            "description": "<p>Deploy in seconds.</p>"
          },
          {
            "icon": "shield-check",
            "headline": "Secure",
            "description": "<p>Enterprise-grade security.</p>"
          }
        ]
      }
    },
    {
      "block": "CTA",
      "content": {
        "Headline": "Ready to get started?",
        "Buttons": [
          { "label": "Start free trial", "link": "/signup", "style": "primary" }
        ]
      }
    },
    {
      "block": "Footer",
      "content": {}
    }
  ]
}
```

## Validation

Validate before importing to catch errors:

```bash
npm run validate-page -- --site=mysite --page=home
```

### Success Output

```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

### Error Examples

Unknown block:
```json
{
  "valid": false,
  "errors": [
    { "block": "HeroSection", "field": "", "message": "Unknown block \"HeroSection\". Available blocks: Hero, ..." }
  ]
}
```

Unknown field:
```json
{
  "valid": false,
  "errors": [
    { "block": "Hero", "field": "Title", "message": "Unknown field \"Title\". Available fields: Eyebrow, Headline, ..." }
  ]
}
```

## Import

Import creates the page in Make Studio:

```bash
npm run import-page -- --site=mysite --page=home
```

### Success Output

```json
{
  "success": true,
  "pageId": "65abc123...",
  "pageName": "Home",
  "blocksImported": 5,
  "errors": []
}
```

### What Import Does

1. Reads page JSON from `sites/<name>/pages/<page>.json`
2. Reads `site.json` to get the Make Studio site ID
3. For each block:
   - Looks up the block by name in the database
   - Maps field names to UUIDs
   - Adds UUIDs to repeater items
   - Falls back to defaults for missing fields
4. Creates page document in MongoDB
5. Adds page reference to site's pages array

## Workflow for AI Generation

1. **Provide context** — Put company docs, copy, brand guidelines in `sites/<name>/content/`

2. **Reference the catalog** — AI reads `themes/stock/catalog.json` to understand available blocks

3. **Generate page JSON** — AI writes page interchange files based on requirements

4. **Validate** — Run `validate-page` to catch issues

5. **Import** — Run `import-page` to create in Make Studio

6. **Review** — Open Make Studio to see the result

## CLI Reference

### generate-catalog

```bash
npm run generate-catalog -- --theme=<theme-name>
```

Generates `themes/<theme>/catalog.json` from block JSON files.

### validate-page

```bash
npm run validate-page -- --site=<site-name> --page=<page-name>
```

Validates `sites/<site>/pages/<page>.json` against the theme's catalog.

### import-page

```bash
npm run import-page -- --site=<site-name> --page=<page-name>
```

Imports page to Make Studio. Requires `MONGODB_URI` in `.env`.
