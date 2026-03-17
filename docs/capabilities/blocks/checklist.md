# Block Creation Checklist

Quick-reference for building blocks. Distilled from conversion and design learnings.

## Theme Requirements

- [ ] All 4 button variants defined (primary, secondary, outline, ghost) — server crashes if any missing
- [ ] `buttons` key included in theme.json — gets wiped by sync if missing
- [ ] Custom colors go in `customColors` array, not `systemColors`
- [ ] All fonts listed in `fonts` array with correct weight/style
- [ ] Heading tiers (xl through xs) and body tiers (lg, md, sm) all defined

## Template Patterns

- [ ] Use `{{> Button}}` partial — never inline button HTML
- [ ] Use `{{default field 'fallback'}}` for text fields with defaults
- [ ] Use kebab-case for template variables: `{{hero-title}}`, not `{{heroTitle}}`
- [ ] Use `{{#each items}}` for repeating content
- [ ] Use `{{#if field}}` for conditional content
- [ ] Images are just `{{field-name}}` — NOT `{{image field-name}}`
- [ ] Standard container: `<div class="max-w-7xl mx-auto px-6">` (skip if full-bleed)

## Field Types

All available field types in Make Studio:

| Type | Template Access | Default Format | Notes |
|------|----------------|----------------|-------|
| `text` | `{{field-name}}` | `"string"` | Single-line text |
| `textarea` | `{{field-name}}` | `"string"` | Multi-line plain text |
| `wysiwyg` | `{{{field-name}}}` | `"<p>html</p>"` | Rich text — use triple braces for unescaped HTML |
| `image` | `{{field-name}}` | `"url"` | Returns URL string. NOT `{{image field}}` — just `{{field}}` |
| `video` | `{{field-name}}` | `"url"` | Video URL |
| `link` | `{{field-name}}` | `"url"` | URL field |
| `options` | `{{field-name}}` | `"value"` | Needs `config.selectOptions: [{ key, value }]` |
| `number` | `{{field-name}}` | `0` | Numeric value |
| `date` | `{{field-name}}` | `"ISO string"` | Date picker |
| `toggle` | `{{#if field-name}}` | `true/false` | Boolean toggle |
| `items` | `{{#each field-name}}` | `[{...}]` | Repeater — needs `config.fields` for sub-fields |
| `group` | `{{field-name.sub-field}}` | `{...}` | Groups related fields — needs `config.fields`, default is an object |

### Items fields

- Sub-fields go in `config.fields`, NOT top level
- **Must have a `default` array** with populated entries — without this, blocks render empty
- Default keys are lowercase versions of sub-field names

```json
{
  "type": "items", "name": "Buttons",
  "default": [
    { "label": "Get started", "link": "#", "style": "primary" },
    { "label": "Learn more", "link": "#", "style": "ghost" }
  ],
  "config": { "fields": [
    { "type": "text", "name": "Label" },
    { "type": "text", "name": "Link" },
    { "type": "options", "name": "Style", "config": { "selectOptions": [...] } }
  ] }
}
```

### Group fields

- Use for fixed-position card layouts (bento grids, feature sections with unique per-card styling)
- Sub-fields in `config.fields`, default is an **object** (not array)
- Template accesses via dot notation: `{{card-1.title}}`

```json
{
  "type": "group", "name": "Card 1",
  "default": { "title": "Card title", "description": "...", "image": "https://placehold.co/..." },
  "config": { "fields": [
    { "type": "text", "name": "Title" },
    { "type": "textarea", "name": "Description" },
    { "type": "image", "name": "Image" }
  ] }
}
```

## Field Definitions (.json)

- [ ] `makeStudioFields: true` and `version: 1` at top level
- [ ] **Every visible field needs a default** — blocks should look complete out of the box
- [ ] **Image defaults**: use `https://placehold.co/WxH/bg/fg?text=Label` (match aspect ratio)
- [ ] Items default: array of objects. Group default: single object. Both use lowercase keys.
- [ ] Options fields need `config.selectOptions` with `{ key, value }` pairs

## Tailwind → Make Studio Token Mapping

| Tailwind | Make Studio |
|----------|-------------|
| `bg-gray-900` | `bg-base` |
| `bg-gray-800` | `bg-panel` |
| `bg-indigo-950` | `bg-base-alt` |
| `bg-indigo-500/600/700` | `bg-brand` |
| `text-white` | `text-fg` |
| `text-gray-300` | `text-fg-muted` |
| `text-gray-400` | `text-fg-alt` |
| `text-indigo-400` | `text-brand` |
| `ring-white/10` | `ring-border` |
| `text-3xl..5xl font-semibold` | `heading-lg` |
| `text-lg/8`, `text-base/7` | `body-md` |
| `text-xl/8` | `body-lg` |
| `text-sm font-semibold` (eyebrow) | `body-sm font-semibold` |

## Layout & Spacing

- [ ] Section padding: `py-16 lg:py-24` or `py-20 lg:py-32` (measure from source)
- [ ] Responsive: mobile-first, use `lg:` breakpoint for desktop layout
- [ ] Grid: `grid grid-cols-1 lg:grid-cols-2 gap-8` (adjust columns as needed)
- [ ] For alternating layouts, use CSS `even:` variant, not Handlebars index math

## Screenshot Pipeline (block-screenshot.ts)

- [ ] Block description ≤30 characters — API rejects longer
- [ ] Use inline styles for colors/backgrounds — Tailwind gets overridden by site theme
- [ ] Pipeline uses Index page at `/` — no slug setup needed
- [ ] Iteration screenshots saved to `themes/<theme>/iterations/<BlockName>/render-N.png`

## Common Gotchas

- [ ] No Handlebars math helpers — can't do `{{multiply @index 100}}`
- [ ] Pull after first sync — server normalizes templates
- [ ] Strip source animations — replace with Alpine.js `x-intersect` if needed
- [ ] `x-intersect` attributes get stripped by server — pull to get canonical version
- [ ] Page slug doesn't persist via updatePage settings — use existing pages with known URLs
