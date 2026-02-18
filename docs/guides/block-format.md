# Block Format Guide

Every block consists of two files: `BlockName.html` (Handlebars template) and `BlockName.json` (field definitions).

## HTML Template

### Standard Container

Every section block MUST use this wrapper pattern:

```html
<section class="py-16 bg-base">
  <div class="mx-auto w-full max-w-2xl px-6 md:max-w-3xl lg:max-w-7xl lg:px-10">
    <!-- content here -->
  </div>
</section>
```

Exceptions:
- **Navbar**: Uses `<header class="sticky top-0 z-10 bg-base">` with `<nav>` and a fixed-height flex container (`h-20`)
- **Footer**: Uses `<footer class="pt-16">` with `<div class="bg-panel py-16 text-fg">`
- **Hero with full-bleed image**: May extend beyond the container

### Indentation

Use **2-space indentation**. Templates should be clean, readable HTML — not minified or dumped from a scraper.

### Handlebars Syntax

| Pattern | Usage |
|---------|-------|
| `{{fieldName}}` | Plain text output (escaped) |
| `{{{fieldName}}}` | Rich text / WYSIWYG output (unescaped HTML) |
| `{{#if fieldName}}...{{/if}}` | Conditional rendering |
| `{{#if (length items)}}...{{/if}}` | Check if repeater has items |
| `{{#each items}}...{{/each}}` | Iterate over repeater items |
| `{{> PartialName}}` | Include a partial (passes current context) |
| `{{default fieldName "fallback"}}` | Field with default fallback value |
| `{{icon "icon-name" size="24"}}` | Render a Phosphor icon |
| `{{#switch fieldName}}` | Switch statement for variants |
| `{{#case "value"}}...{{/case}}` | Case within switch |
| `{{#otherwise}}...{{/otherwise}}` | Default case in switch |
| `{{#if (isActive url)}}` | Active state for nav links |

### Field Naming

- Use **camelCase** in templates: `{{headline}}`, `{{subheadline}}`, `{{logoText}}`
- Field names in JSON use **Title Case**: `"name": "Headline"`, `"name": "Logo Text"`
- The template variable is the camelCase version of the JSON name
- Multi-word fields: JSON `"Logo Text"` → template `{{logo_text}}` (underscore-separated lowercase)

### Repeater Pattern

When 3+ similar elements appear, convert to a repeater:

```html
{{#if (length features)}}
  <div class="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
    {{#each features}}
      <div class="flex flex-col gap-2 body-sm">
        <h3 class="font-semibold text-fg">{{headline}}</h3>
        <div class="text-fg-muted">{{{description}}}</div>
      </div>
    {{/each}}
  </div>
{{/if}}
```

Always guard repeaters with `{{#if (length items)}}`.

### Button Partial

Buttons use the shared `Button` partial. In templates:

```html
{{#if (length buttons)}}
  <div class="flex flex-wrap items-center justify-center gap-4">
    {{#each buttons}}
      {{> Button}}
    {{/each}}
  </div>
{{/if}}
```

## JSON Field Definitions

### Structure

```json
{
  "makeStudioFields": true,
  "version": 1,
  "description": "Short description for the block picker",
  "fields": [...]
}
```

### Field Types

| Type | Usage | Template |
|------|-------|----------|
| `text` | Single line text, headlines, labels | `{{fieldName}}` |
| `textarea` | Multi-line plain text | `{{fieldName}}` |
| `wysiwyg` | Rich text with HTML | `{{{fieldName}}}` |
| `image` | Image URL | `{{fieldName}}` in `src="..."` |
| `items` | Repeater / array of sub-fields | `{{#each fieldName}}` |
| `select` | Dropdown choice | `{{#switch fieldName}}` |
| `number` | Numeric value | `{{fieldName}}` |

### Items (Repeater) Config

**IMPORTANT**: Sub-fields MUST go inside `config.fields`, NOT at the top level. Putting them at `fields` will silently fail — the repeater will appear in the editor but show "No field definitions configured."

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

### Select Config

```json
{
  "type": "select",
  "name": "Style",
  "default": "primary",
  "config": {
    "selectOptions": [
      { "key": "Primary", "value": "primary" },
      { "key": "Secondary", "value": "secondary" },
      { "key": "Ghost", "value": "ghost" }
    ]
  }
}
```

### Image Config

```json
{
  "type": "image",
  "name": "Logo",
  "default": "",
  "config": {
    "maxWidth": 200,
    "maxHeight": 60
  }
}
```

### Default Values

- **text**: Use representative content from the original site
- **wysiwyg**: Wrap in `<p>` tags: `"<p>Description text here.</p>"`
- **image**: Use the original image URL or an unsplash placeholder
- **items**: Include 2-4 representative items with realistic content
- **select**: Use the most common variant value

## Common Block Types

| Type | Key Elements |
|------|-------------|
| **Navbar** | Logo (image or text), nav links (repeater), CTA button |
| **Hero** | Eyebrow, headline (h1), subheadline (wysiwyg), buttons |
| **Features** | Eyebrow, headline, subheadline, feature cards (repeater with icon/headline/description) |
| **Stats** | Headline, stat cards (repeater with stat value + label) |
| **Testimonial** | Quote (wysiwyg), author image, name, byline |
| **CTA** | Headline, subheadline, buttons |
| **Process** | Headline, steps (repeater with number/title/description) |
| **Footer** | Nav links (repeater), social links (repeater), fineprint (wysiwyg) |

## Classes to Strip

Never include these in generated templates:
- Animation/transition classes: `opacity-0`, `translate-y-16`, `transition-all`, `duration-*`, `ease-*`, `delay-*`
- Framework internals: `v-bind`, `data-v-*`, `ng-*`, `__nuxt`, `_nuxt`
- JavaScript state: `is-visible`, `is-active`, `js-*`
- Arbitrary values that should be tokens: `bg-[#0a0a0a]`, `text-[#c8ff00]`

Use Alpine.js `x-intersect` for animations instead (see animation-patterns.md).
