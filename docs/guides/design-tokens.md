# Design Tokens Guide

Make-studio uses a semantic token system for colors and typography. All blocks must use these tokens — never hardcode colors or font sizes.

## System Colors

| Token | CSS Class (bg/text/border) | Purpose |
|-------|---------------------------|---------|
| `base` | `bg-base`, `text-base` | Page background — usually the darkest (dark themes) or lightest (light themes) color |
| `base-muted` | `bg-base-muted` | Slightly lighter/darker than base, for subtle differentiation |
| `base-alt` | `bg-base-alt` | Contrasting alternative background (if base is dark, this is light) |
| `panel` | `bg-panel` | Card/panel backgrounds — distinct from base but not contrasting |
| `fg` | `text-fg` | Primary text color — highest contrast against base |
| `fg-muted` | `text-fg-muted` | Secondary text — descriptions, body copy |
| `fg-alt` | `text-fg-alt` | Tertiary text — fine print, least important text |
| `brand` | `bg-brand`, `text-brand` | Primary accent/brand color |
| `on-brand` | `text-on-brand` | Text color that sits on brand-colored backgrounds |
| `border` | `border-border` | Default border color |

### Opacity Modifiers

Tailwind opacity modifiers work with tokens:
- `bg-brand/10` — brand color at 10% opacity (subtle background)
- `bg-brand/15` — brand at 15% (hover state)
- `border-fg/10` — fg color at 10% opacity (subtle dividers)

### Color Mapping Strategy

When analyzing a source site:

1. **Identify base**: The dominant background color (body/main background)
2. **Identify fg**: The primary text color (headings, main content)
3. **Identify brand**: The most saturated accent color (buttons, highlights, links)
4. **Derive on-brand**: Text that sits on brand — usually base or white, whichever has better contrast
5. **Derive panel**: Card backgrounds — usually a shade between base and fg
6. **Derive fg-muted**: Secondary text color — usually between fg and panel
7. **Derive base-muted**: Subtle background variation — one step from base toward panel
8. **Derive base-alt**: The opposite end — if base is dark, base-alt is light
9. **Derive border**: Border color — usually mid-range, around panel level
10. **Derive fg-alt**: Tertiary text — between fg-muted and border

### Dark Theme Example (PeakPerformance)

```json
{
  "base": "#0a0a0a",
  "base-muted": "#1a1a1a",
  "base-alt": "#e5e5e5",
  "panel": "#1a1a1a",
  "fg": "#ffffff",
  "fg-muted": "#a0a0a0",
  "fg-alt": "#666666",
  "brand": "#c8ff00",
  "on-brand": "#0a0a0a",
  "border": "#333333"
}
```

### Light Theme Example (Oatmeal)

```json
{
  "base": "#0C0C09",
  "base-muted": "#181816",
  "base-alt": "#EBEBE5",
  "panel": "#181816",
  "fg": "#FFFFFF",
  "fg-muted": "#A5A596",
  "fg-alt": "#7C7C67",
  "brand": "#D8D8D0",
  "on-brand": "#0C0C09",
  "border": "#464644"
}
```

## Typography Tiers

### Heading Tiers

| Token | CSS Class | Typical Use | Approximate Size |
|-------|-----------|-------------|-----------------|
| `heading-xl` | `heading-xl` | Hero headline (h1) | 48-80px |
| `heading-lg` | `heading-lg` | Section headlines (h2) | 30-44px |
| `heading-md` | `heading-md` | Sub-section headlines (h3) | 24-36px |
| `heading-sm` | `heading-sm` | Card titles, feature names | 18-28px |
| `heading-xs` | `heading-xs` | Small labels, table headers | 14-24px |

### Body Tiers

| Token | CSS Class | Typical Use |
|-------|-----------|-------------|
| `body-lg` | `body-lg` | Large body text, hero subheadlines | 18px |
| `body-md` | `body-md` | Standard body text, descriptions | 16px |
| `body-sm` | `body-sm` | Small text, labels, eyebrows, buttons | 14px |

### Eyebrow Pattern

Eyebrows (small labels above headlines) use:
```html
<p class="body-sm font-semibold text-fg-muted">{{eyebrow}}</p>
```

Some themes use `text-brand` for eyebrows instead of `text-fg-muted`.

### Typography Mapping Strategy

When analyzing a source site's fonts:

1. **Heading font**: The font used on h1/h2 elements (often a serif or display font)
2. **Body font**: The font used on p/span elements (often a sans-serif)
3. Map the heading font to `heading-xl` through `heading-md` (or all five tiers)
4. Map the body font to `heading-sm`, `heading-xs`, and all body tiers
5. Extract actual sizes/weights/line-heights from the computed styles or CSS

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

The palette provides 5-shade color ramps for the design system:

```json
{
  "palette": {
    "primary": {
      "label": "primary",
      "colors": ["#lightest", "#light", "#mid", "#dark", "#darkest"]
    },
    "grays": {
      "label": "gray",
      "colors": ["#lightest", "#light", "#mid", "#dark", "#darkest"]
    },
    "accent1": { "label": "accent-1", "colors": [...] },
    "accent2": { "label": "accent-2", "colors": [...] },
    "accent3": { "label": "accent-3", "colors": [...] }
  }
}
```

## Fonts in theme.json

List all unique font family + weight + style combinations used:

```json
{
  "fonts": [
    { "family": "Bebas Neue", "weight": 400, "style": "normal" },
    { "family": "Inter", "weight": 400, "style": "normal" },
    { "family": "Inter", "weight": 500, "style": "normal" },
    { "family": "Inter", "weight": 600, "style": "normal" }
  ]
}
```

## Prose Configuration

Controls how WYSIWYG content renders:

```json
{
  "prose": {
    "elements": {
      "h1": { "typographyClass": "heading-xl", "marginBottom": 1.5 },
      "p": { "typographyClass": "body-md", "marginBottom": 1.25 },
      "ul": { "typographyClass": "body-md", "marginBottom": 1.25 }
    },
    "lists": {
      "listStyleType": "disc",
      "indent": 1.5,
      "itemSpacing": 0.5
    },
    "links": {
      "color": "accent",
      "hoverColor": "primary",
      "underline": "always"
    }
  }
}
```
