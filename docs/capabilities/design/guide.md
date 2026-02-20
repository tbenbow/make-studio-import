# Design System Guide

Make Studio's semantic token system for colors, typography, and animations.

## System Colors

| Token | CSS Class | Purpose |
|-------|-----------|---------|
| `base` | `bg-base`, `text-base` | Page background |
| `base-muted` | `bg-base-muted` | Subtle background variation |
| `base-alt` | `bg-base-alt` | Contrasting alternative background |
| `panel` | `bg-panel` | Card/panel backgrounds |
| `fg` | `text-fg` | Primary text color |
| `fg-muted` | `text-fg-muted` | Secondary text |
| `fg-alt` | `text-fg-alt` | Tertiary text |
| `brand` | `bg-brand`, `text-brand` | Primary accent/brand color |
| `on-brand` | `text-on-brand` | Text on brand backgrounds |
| `border` | `border-border` | Default border color |

### Custom Colors

Additional colors go in `customColors` (never `systemColors`):

```json
{
  "customColors": [
    { "id": "uuid", "name": "accent", "value": "#f9613e" }
  ]
}
```

Custom colors generate the same Tailwind utilities (`bg-accent`, `text-accent`, `border-accent`) and appear in the Make Studio color picker.

### Opacity Modifiers

`bg-brand/10`, `bg-brand/15`, `border-fg/10` — all work with tokens.

### Color Mapping Strategy

1. **base**: Dominant background color
2. **fg**: Primary text color (highest contrast against base)
3. **brand**: Most saturated accent color
4. **on-brand**: Text on brand — usually base or white
5. **panel**: Card backgrounds
6. **fg-muted**: Secondary text
7. **base-muted**: One step from base toward panel
8. **base-alt**: Opposite end from base
9. **border**: Mid-range, around panel level
10. **fg-alt**: Between fg-muted and border

## Typography Tiers

### Headings

| Token | Typical Use | Size |
|-------|-------------|------|
| `heading-xl` | Hero headline (h1) | 48-80px |
| `heading-lg` | Section headlines (h2) | 30-44px |
| `heading-md` | Sub-section headlines (h3) | 24-36px |
| `heading-sm` | Card titles | 18-28px |
| `heading-xs` | Small labels | 14-24px |

### Body

| Token | Typical Use |
|-------|-------------|
| `body-lg` | Hero subheadlines | 18px |
| `body-md` | Standard body text | 16px |
| `body-sm` | Labels, eyebrows, buttons | 14px |

### Eyebrow Pattern

```html
<p class="body-sm font-semibold text-fg-muted">{{eyebrow}}</p>
```

### Typography in theme.json

```json
{
  "headingTypography": {
    "heading-xl": {
      "fontFamily": "Bebas Neue",
      "fontWeight": 400,
      "fontSize": 80,
      "lineHeight": 80,
      "letterSpacing": -2,
      "mobileFontSize": 48,
      "mobileLineHeight": 48
    }
  },
  "bodyTypography": {
    "body-md": {
      "fontFamily": "Inter",
      "fontWeight": 400,
      "fontSize": 16,
      "lineHeight": 28,
      "letterSpacing": 0
    }
  }
}
```

## Palette

5-shade color ramps for the design system:

```json
{
  "palette": {
    "primary": { "label": "primary", "colors": ["#lightest", "#light", "#mid", "#dark", "#darkest"] },
    "grays": { "label": "gray", "colors": [...] },
    "accent1": { "label": "accent-1", "colors": [...] }
  }
}
```

## Fonts in theme.json

List all unique font family + weight + style combinations:

```json
{
  "fonts": [
    { "family": "Bebas Neue", "weight": 400, "style": "normal" },
    { "family": "Inter", "weight": 400, "style": "normal" }
  ]
}
```

## Prose Configuration

Controls WYSIWYG content rendering:

```json
{
  "prose": {
    "elements": {
      "h1": { "typographyClass": "heading-xl", "marginBottom": 1.5 },
      "p": { "typographyClass": "body-md", "marginBottom": 1.25 }
    },
    "lists": { "listStyleType": "disc", "indent": 1.5, "itemSpacing": 0.5 },
    "links": { "color": "accent", "hoverColor": "primary", "underline": "always" }
  }
}
```

## Animation Patterns

Make Studio supports Alpine.js. Use `x-intersect` for entrance animations.

### Basic Fade-Up

```html
<div
  x-data="{ show: false }"
  x-intersect.once="show = true"
  :class="show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
  class="transition-all duration-700 ease-out"
>
```

### Staggered Children

Apply animation at container level for repeaters, or use fixed `style="transition-delay: Nms;"` per item.

### When to Animate

- Section entrances (fade-up on scroll)
- Card grids (staggered fade-up)
- Stats/numbers (count up)

### When NOT to Animate

- Navigation, footer, form inputs, already-visible above-the-fold content
