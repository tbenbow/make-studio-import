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
      "name": "Headline",
      "default": "Your headline goes here"
    },
    {
      "type": "wysiwyg",
      "name": "Content",
      "default": "<p>Your content goes here.</p>"
    },
    {
      "type": "text",
      "name": "Button Label",
      "default": "Get Started"
    },
    {
      "type": "text",
      "name": "Button URL",
      "default": "#"
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

## Default Values (Important!)

**Always include default values** so blocks aren't empty when imported. Empty blocks make it impossible to see styling.

### Simple Fields
```json
{
  "type": "text",
  "name": "Headline",
  "default": "Your headline goes here"
}
```

### WYSIWYG/HTML Fields
```json
{
  "type": "wysiwyg",
  "name": "Content",
  "default": "<p>Your content goes here with <strong>formatting</strong>.</p>"
}
```

### Items/Repeater Fields
```json
{
  "type": "items",
  "name": "Features",
  "default": [
    { "headline": "Feature One", "description": "<p>Description of feature one.</p>" },
    { "headline": "Feature Two", "description": "<p>Description of feature two.</p>" },
    { "headline": "Feature Three", "description": "<p>Description of feature three.</p>" }
  ],
  "config": {
    "fields": [
      { "type": "text", "name": "Headline" },
      { "type": "wysiwyg", "name": "Description" }
    ]
  }
}
```

### Image Fields
Use placeholder images from Unsplash:
```json
{
  "type": "image",
  "name": "Avatar",
  "default": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
}
```

### Where to Get Default Content

1. **From the source theme** - Look at example pages in the Next.js project
2. **Generic placeholders** - Use realistic but generic content
3. **Appropriate length** - Match the expected content length (short for labels, longer for descriptions)

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

### System Colors (10 Colors)

Make Studio uses a semantic 10-color system. Map theme colors to these:

#### Brand Colors (3)
| Class | Usage |
|-------|-------|
| `bg-brand` / `text-brand` | Primary brand color (buttons, CTAs, links) |
| `bg-brand-hover` / `text-brand-hover` | Hover state for brand elements |
| `text-on-brand` | Text on brand backgrounds (usually white) |

#### Base/Surface Colors (3)
| Class | Usage |
|-------|-------|
| `bg-base` | Main page background |
| `bg-base-muted` | Slightly muted background (subtle sections) |
| `bg-base-panel` | Panel/card backgrounds |

#### Foreground/Text Colors (3)
| Class | Usage |
|-------|-------|
| `text-fg` | Primary text (headlines, body) |
| `text-fg-muted` | Secondary/muted text (descriptions, captions) |
| `text-fg-subtle` | Tertiary text (placeholders, hints) |

#### UI Colors (1)
| Class | Usage |
|-------|-------|
| `border-border` | All borders and dividers |

### Common Color Mappings

| Original (Tailwind) | Make Studio |
|---------------------|-------------|
| `bg-gray-950`, `bg-slate-900` | `bg-brand` (for buttons) |
| `bg-white`, `bg-gray-50` | `bg-base` |
| `bg-gray-100`, `bg-slate-100` | `bg-base-panel` |
| `text-gray-900`, `text-slate-900` | `text-fg` |
| `text-gray-600`, `text-slate-600` | `text-fg-muted` |
| `text-gray-400`, `text-slate-400` | `text-fg-subtle` |
| `border-gray-200` | `border-border` |
| `hover:bg-gray-800` | `hover:bg-brand-hover` |
| Text on dark buttons | `text-on-brand` |

### Button Example
```html
<!-- Primary button -->
<a href="{{url}}" class="bg-brand text-on-brand hover:bg-brand-hover px-4 py-2 rounded">
  {{label}}
</a>

<!-- Secondary/ghost button -->
<a href="{{url}}" class="bg-base-panel text-fg hover:bg-base-muted px-4 py-2 rounded">
  {{label}}
</a>
```

### Opacity Variants
All system colors support opacity modifiers:
- `bg-brand/90` - 90% opacity
- `text-fg-muted/80` - 80% opacity
- `border-border/50` - 50% opacity

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
