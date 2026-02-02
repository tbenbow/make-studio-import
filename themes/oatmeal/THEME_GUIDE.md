# Oatmeal to Make Studio Conversion Guide

This guide documents how to convert Oatmeal Next.js components into Make Studio blocks and partials.

## Output Structure

```
html-components/
├── partials/    # Element components (Button, Badge, etc.)
│   ├── Component.html
│   └── Component.json
└── blocks/      # Section components (Hero, Features, etc.)
    ├── Component.html
    └── Component.json
```

## Color Mapping (mist → theme)

| Original Class | Theme Class | Usage |
|----------------|-------------|-------|
| `text-mist-950` | `text-foreground` | Primary dark text |
| `text-mist-900` | `text-foreground` | Primary dark text |
| `text-mist-700` | `text-muted` | Secondary/muted text |
| `text-mist-600` | `text-muted` | Secondary/muted text |
| `text-mist-400` | `text-muted` | Secondary/muted text (dark mode) |
| `bg-mist-950` | `bg-primary` | Primary button backgrounds |
| `bg-mist-100` | `bg-background` | Light backgrounds |
| `bg-mist-50` | `bg-background` | Light backgrounds |
| `hover:bg-mist-800` | `hover:bg-primary/90` | Button hover states |
| `bg-mist-950/10` | `bg-muted/10` | Soft button backgrounds |
| `dark:*` variants | Remove | Use theme dark mode classes instead |

## Typography Mapping

| Original Classes | Theme Class | Notes |
|------------------|-------------|-------|
| `text-5xl/12`, `text-[5rem]/20` | `heading-xl` | Large headlines (h1) |
| `text-4xl`, `text-5xl` + font-bold | `heading-xl` | Large headlines |
| `text-3xl` + font-bold | `heading-lg` | Section headlines (h2) |
| `text-2xl` + font-semibold | `heading-md` | Subsection headlines (h3) |
| `text-xl` + font-semibold | `heading-sm` | Small headlines (h4) |
| `text-lg/8` | `body-lg` | Large body text |
| `text-base/7` | `body-md` | Standard body text |
| `text-sm/7` | `body-md` | Standard body text |
| `text-sm` | `body-sm` | Small text, labels |

## Icon Mapping

Use the `{{icon}}` Handlebars helper:

```handlebars
{{icon "phosphor-icon-name" size="24"}}
```

| Oatmeal Icon | Phosphor Name |
|--------------|---------------|
| ChevronRightIcon | `caretRight` |
| ArrowRightIcon | `arrowRight` |
| ArrowLeftIcon | `arrowLeft` |
| CheckIcon | `check` |
| XMarkIcon | `x` |

## Container Pattern

Original Oatmeal Container:
```jsx
<Container className="...">
```

Converted (inline the container styles):
```handlebars
<div class="mx-auto w-full max-w-2xl px-6 md:max-w-3xl lg:max-w-7xl lg:px-10 ...">
```

## File Format

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
      "type": "richText",
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

## Field Types

| Type | Use Case |
|------|----------|
| `text` | Single-line text (headlines, labels, URLs) - no config needed |
| `richText` | Multi-line content with formatting (use `{{{field}}}` for unescaped output) |
| `image` | Image uploads - requires config |
| `link` | URL with optional label |
| `select` | Dropdown choices |
| `toggle` | Boolean on/off |
| `repeater` | Lists of items - requires config with nested fields |

### Image Field Config
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

### Repeater Field Config
```json
{
  "type": "repeater",
  "name": "Items",
  "config": {
    "fields": [
      { "type": "text", "name": "Title" },
      { "type": "text", "name": "Description" }
    ]
  }
}
```

## Using Partials in Blocks

Reference a partial with `{{> PartialName}}`:

```handlebars
{{! Pass named parameters }}
{{> Button label=button_label url=button_url}}

{{! With conditional }}
{{#if button_label}}
  {{> Button label=button_label url=button_url}}
{{/if}}
```

## Conversion Steps

1. **Identify the component type**: Element → Partial, Section → Block
2. **Extract the JSX structure**: Copy the render output
3. **Convert classes**: Replace mist colors with theme classes
4. **Convert typography**: Replace text-* with heading-* or body-*
5. **Remove dark mode variants**: Theme handles this automatically
6. **Convert React to Handlebars**:
   - `{children}` → `{{field_name}}` or `{{{field_name}}}`
   - `{condition && <jsx>}` → `{{#if condition}}...{{/if}}`
   - `{items.map(...)}` → `{{#each items}}...{{/each}}`
7. **Define fields**: Create the .json file with field definitions
8. **Test**: Preview the component with sample data

## Common Gotchas

1. **Escaped vs Unescaped Output**
   - Use `{{field}}` for plain text (auto-escaped)
   - Use `{{{field}}}` for HTML/rich text content (unescaped)

2. **Field Name Conventions**
   - JSON field names use Title Case: `"Button Label"`
   - Handlebars variables use kebab-case: `{{button-label}}`

3. **Container Width**
   - Oatmeal uses `Container` component
   - Convert to inline classes: `mx-auto w-full max-w-2xl px-6 md:max-w-3xl lg:max-w-7xl lg:px-10`

4. **clsx Conditional Classes**
   - Oatmeal uses clsx for conditional classes
   - Convert to Handlebars conditionals or pick the default variant

5. **Dark Mode**
   - Remove all `dark:*` classes
   - Theme system handles dark mode automatically via CSS variables

## Examples

### Converted Components

**Partials:**
- `partials/Button.html` - Primary button link
- `partials/Eyebrow.html` - Small semibold label text

**Blocks:**
- `blocks/HeroSimpleCentered.html` - Centered hero with eyebrow, headline, subheadline, CTA
- `blocks/CallToActionSimpleCentered.html` - Centered CTA section with headline and button
- `blocks/StatsFourColumns.html` - Four-column stats grid (uses repeater)
- `blocks/TestimonialLargeQuote.html` - Large quote with avatar and attribution
