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
- [ ] Use `{{image field}}` for images (not raw `<img src="{{field}}">`)
- [ ] Standard container: `<div class="max-w-7xl mx-auto px-6">` (skip if full-bleed)

## Field Definitions (.json)

- [ ] `makeStudioFields: true` and `version: 1` at top level
- [ ] Items sub-fields go in `config.fields`, NOT top level
- [ ] Field types: `text`, `textarea`, `richtext`, `image`, `select`, `toggle`, `color`, `items`
- [ ] Select fields need `config.selectOptions` with `{ key, value }` pairs
- [ ] Items fields need `config.fields` array for sub-fields

## Layout & Spacing

- [ ] Section padding: `py-16 lg:py-24` or `py-20 lg:py-32` (measure from source)
- [ ] Responsive: mobile-first, use `lg:` breakpoint for desktop layout
- [ ] Grid: `grid grid-cols-1 lg:grid-cols-2 gap-8` (adjust columns as needed)
- [ ] For alternating layouts, use CSS `even:` variant, not Handlebars index math

## Common Gotchas

- [ ] No Handlebars math helpers — can't do `{{multiply @index 100}}`
- [ ] Pull after first sync — server normalizes templates
- [ ] Strip source animations — replace with Alpine.js `x-intersect` if needed
- [ ] `x-intersect` attributes get stripped by server — pull to get canonical version
