# Make Studio Conversion Guide

This guide documents how to convert React/Next.js components into Make Studio blocks and partials.

## Output Structure

```
themes/<theme-name>/
├── source/              # Original Next.js/React files
├── converted/
│   ├── blocks/          # Section components (Hero, Features, etc.)
│   │   ├── Component.html
│   │   └── Component.json
│   └── partials/        # Element components (Button, Badge, etc.)
│       ├── Component.html
│       └── Component.json
└── THEME_GUIDE.md       # Theme-specific learnings
```

## Component Classification

| Type | Description | Examples |
|------|-------------|----------|
| **Block** | Full-width page sections | Hero, Features, Footer, Testimonials |
| **Partial** | Reusable elements within blocks | Button, Badge, Link, Card |

## File Format

### Block (Section Component)

**HTML Template** (`blocks/ComponentName.html`):
```handlebars
<section class="py-16 bg-background">
  <div class="mx-auto w-full max-w-2xl px-6 md:max-w-3xl lg:max-w-7xl lg:px-10">
    <h1 class="heading-xl text-foreground">{{headline}}</h1>
    <div class="body-lg text-muted">{{{content}}}</div>
    {{> Button label=button_label url=button_url}}
  </div>
</section>
```

**Field Definition** (`blocks/ComponentName.json`):
```json
{
  "makeStudioFields": true,
  "version": 1,
  "fields": [
    {
      "type": "text",
      "name": "Headline"
    },
    {
      "type": "wysiwyg",
      "name": "Content"
    },
    {
      "type": "text",
      "name": "Button Label"
    },
    {
      "type": "text",
      "name": "Button URL"
    }
  ]
}
```

### Partial (Element Component)

**HTML Template** (`partials/ComponentName.html`):
```handlebars
<a href="{{url}}" class="inline-flex items-center ...">
  {{label}}
</a>
```

**Field Definition** (`partials/ComponentName.json`):
```json
{
  "makeStudioFields": true,
  "version": 1,
  "fields": [
    {
      "type": "text",
      "name": "Label"
    },
    {
      "type": "text",
      "name": "URL"
    }
  ]
}
```

## Field Types

| Type | Use Case | Template Usage |
|------|----------|----------------|
| `text` | Single-line text (headlines, labels, URLs) | `{{field-name}}` |
| `textarea` | Multi-line plain text | `{{field-name}}` |
| `wysiwyg` | Rich text with formatting | `{{{field-name}}}` (triple braces!) |
| `number` | Numeric values | `{{field-name}}` |
| `image` | Image uploads | `{{field-name}}` (returns URL) |
| `select` | Dropdown choices | `{{field-name}}` |
| `items` | Repeatable groups | `{{#each field-name}}...{{/each}}` |
| `group` | Nested field container | `{{field-name.nested-field}}` |
| `date` | Date/time values | `{{field-name}}` |

### Field Configs

**Image Field:**
```json
{
  "type": "image",
  "name": "Image",
  "config": {
    "maxWidth": 3000,
    "maxHeight": 3000,
    "fileType": "",
    "fileQuality": "0.8"
  }
}
```

**Items (Repeater) Field:**
```json
{
  "type": "items",
  "name": "Features",
  "config": {
    "fields": [
      { "type": "text", "name": "Title" },
      { "type": "text", "name": "Description" }
    ]
  }
}
```

**Select Field:**
```json
{
  "type": "select",
  "name": "Style",
  "config": {
    "selectOptions": [
      { "key": "Primary", "value": "primary" },
      { "key": "Secondary", "value": "secondary" }
    ]
  }
}
```

## JSX to Handlebars Conversion

| JSX Pattern | Handlebars |
|-------------|------------|
| `{variable}` | `{{variable}}` |
| `{htmlContent}` | `{{{variable}}}` (unescaped) |
| `{condition && <jsx>}` | `{{#if condition}}...{{/if}}` |
| `{items.map(item => <Item {...item} />)}` | `{{#each items}}...{{/each}}` |
| `<Component prop={val} />` | `{{> Component prop=val}}` |
| `className={clsx(...)}` | Pick default variant or use `{{#if}}` |

## Theme Class Mappings

### Typography (Use These)

| Original Classes | Theme Class |
|-----------------|-------------|
| Large headlines (h1) | `heading-xl` |
| Section headlines (h2) | `heading-lg` |
| Subsection headlines (h3) | `heading-md` |
| Small headlines (h4) | `heading-sm` |
| Extra small headlines | `heading-xs` |
| Large body text | `body-lg` |
| Standard body text | `body-md` |
| Small text, labels | `body-sm` |

### Colors (Map to These)

| Usage | Theme Class |
|-------|-------------|
| Primary text | `text-foreground` |
| Secondary/muted text | `text-muted` |
| Primary backgrounds | `bg-primary` |
| Light backgrounds | `bg-background` |
| Primary buttons | `bg-primary text-primary-foreground` |
| Hover states | Use `/90` opacity, e.g., `hover:bg-primary/90` |

### Container Pattern

Replace framework Container components with inline classes:
```html
<div class="mx-auto w-full max-w-2xl px-6 md:max-w-3xl lg:max-w-7xl lg:px-10">
```

## Using Partials in Blocks

```handlebars
{{! Basic usage }}
{{> Button label="Click Me" url="/action"}}

{{! With field values }}
{{> Button label=button-label url=button-url}}

{{! Conditional }}
{{#if show-button}}
  {{> Button label=button-label url=button-url}}
{{/if}}

{{! In a loop }}
{{#each buttons}}
  {{> Button}}
{{/each}}
```

## Icons

Use the `{{icon}}` helper with Phosphor icon names:
```handlebars
{{icon "arrowRight" size="24"}}
{{icon "check" size="16" class="text-primary"}}
```

Common mappings:
| Framework Icon | Phosphor Name |
|----------------|---------------|
| ChevronRight | `caretRight` |
| ArrowRight | `arrowRight` |
| Check | `check` |
| X | `x` |
| Menu | `list` |

## Conversion Checklist

1. [ ] Identify component type (Block vs Partial)
2. [ ] Extract props → fields with correct types
3. [ ] Convert JSX structure to Handlebars
4. [ ] Replace framework classes with theme classes
5. [ ] Remove all `dark:*` variants (theme handles dark mode)
6. [ ] Inline Container component styles
7. [ ] Convert icons to Phosphor
8. [ ] Use `{{{triple-braces}}}` for HTML/rich text
9. [ ] Create .json with field definitions
10. [ ] Test with sample data

## Common Gotchas

1. **Escaped vs Unescaped Output**
   - `{{field}}` = escaped (safe for text)
   - `{{{field}}}` = unescaped (required for WYSIWYG/HTML)

2. **Field Name Conventions**
   - JSON: Title Case `"Button Label"`
   - Template: kebab-case `{{button-label}}`

3. **Dark Mode**
   - Remove ALL `dark:*` classes
   - Theme handles dark mode via CSS variables

4. **clsx/cn Utilities**
   - These create conditional classes
   - Pick the default variant, or convert to `{{#if}}`

5. **Next.js Image Component**
   - Replace with standard `<img>` tag
   - Use the image field URL directly
