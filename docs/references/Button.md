# Reference: Button Partial

The Button partial is shared across all blocks. Every theme must have one.

## How It Works

Make Studio has a **declarative button system**. Styling is defined in `theme.json` under the `buttons` key — the template itself uses CSS utility classes (`btn btn-md btn-primary`) that Make Studio generates from this config. This means button appearance (colors, padding, radius, font) is controlled centrally in the theme, not hardcoded in the template HTML.

## Template (Button.html)

```handlebars
<a @click="{{click}}" href="{{default link ''}}" class="relative btn btn-{{default size 'md'}} btn-{{default style 'primary'}}">
  {{default label 'Click Here'}}
  {{#if icon}}
    {{#switch size}}
      {{#case "sm"}}
        <div class="pr-9"></div>
        <div class="size-9 absolute right-0 flex items-center justify-center border-l border-on-brand/50 ml-4">
          {{icon icon size="20"}}
        </div>
      {{/case}}
      {{#case "lg"}}
        <div class="pr-14"></div>
        <div class="size-14 absolute right-0 flex items-center justify-center border-l border-on-brand/50 ml-4">
          {{icon icon size="28"}}
        </div>
      {{/case}}
      {{#otherwise}}
        <div class="pr-12"></div>
        <div class="size-12 absolute right-0 flex items-center justify-center border-l border-on-brand/50 ml-4">
          {{icon icon size="24"}}
        </div>
      {{/otherwise}}
    {{/switch}}
  {{/if}}
</a>
```

### Key template patterns

- `btn btn-{{default size 'md'}} btn-{{default style 'primary'}}` — combines size + variant CSS classes
- `{{default size 'md'}}` / `{{default style 'primary'}}` — defaults when not passed by the block
- `{{#if icon}}` — optional icon section with a divider, sized per button size
- `@click="{{click}}"` — optional Alpine.js click handler for interactive buttons

## Fields (Button.json)

```json
{
  "makeStudioFields": true,
  "version": 1,
  "fields": [
    { "type": "text", "name": "Label", "default": "Click Here" },
    { "type": "text", "name": "Link", "default": "#" },
    {
      "type": "select",
      "name": "Style",
      "default": "primary",
      "config": {
        "selectOptions": [
          { "key": "Primary", "value": "primary" },
          { "key": "Secondary", "value": "secondary" },
          { "key": "Ghost", "value": "ghost" },
          { "key": "Accent", "value": "accent" },
          { "key": "Nav", "value": "nav" }
        ]
      }
    }
  ]
}
```

Note: `size` and `icon` are not in the JSON fields — they are passed as context from the block template.

## Theme Config (theme.json `buttons`)

The `buttons` key in theme.json defines the button design system:

```json
{
  "buttons": {
    "global": {
      "fontFamily": "Roboto Slab",
      "fontWeight": 400,
      "uppercase": false,
      "sizes": {
        "lg": {
          "fontSize": 20,
          "letterSpacing": 0,
          "opticalYOffset": 0,
          "paddingTop": 17,
          "paddingBottom": 17,
          "paddingLeft": 15,
          "paddingRight": 15,
          "borderRadius": 0
        },
        "md": {
          "fontSize": 16,
          "paddingTop": 10,
          "paddingBottom": 10,
          "paddingLeft": 15,
          "paddingRight": 15,
          "borderRadius": 0
        },
        "sm": {
          "fontSize": 14,
          "paddingTop": 6,
          "paddingBottom": 6,
          "paddingLeft": 14,
          "paddingRight": 14,
          "borderRadius": 0
        }
      }
    },
    "variants": {
      "primary": {
        "backgroundColor": "system:brand",
        "textColor": "system:on-brand",
        "borderColor": "transparent",
        "borderWidth": 0,
        "hoverPreset": "darken"
      },
      "secondary": {
        "backgroundColor": "system:base-muted",
        "textColor": "system:fg",
        "borderColor": "transparent",
        "borderWidth": 0,
        "hoverPreset": "darken"
      },
      "outline": {
        "backgroundColor": "transparent",
        "textColor": "system:brand",
        "borderColor": "system:brand",
        "borderWidth": 1,
        "hoverPreset": "fill"
      },
      "ghost": {
        "backgroundColor": "transparent",
        "textColor": "system:fg",
        "borderColor": "transparent",
        "borderWidth": 0,
        "hoverPreset": "lighten"
      }
    }
  }
}
```

### Global settings
- `fontFamily` / `fontWeight` / `uppercase` — shared typography for all buttons
- `sizes` — defines `sm`, `md`, `lg` with font size, padding, radius, letter spacing, and optical Y offset

### Variant settings
- `backgroundColor` / `textColor` / `borderColor` — reference system or custom colors with `system:` or `custom:` prefix
- `borderWidth` — border thickness (0 for no border)
- `hoverPreset` — one of `darken`, `lighten`, `fill` (controls hover behavior)

## Usage in Blocks

Blocks invoke the button partial with explicit context:

```handlebars
{{!-- Basic usage (defaults to size=md, style=primary) --}}
{{> Button link=cta-link label=cta-label}}

{{!-- With explicit style --}}
{{> Button link=link label="View Resource" style="accent"}}

{{!-- With size override --}}
{{> Button link=cta-link label=cta-label style="primary" size="lg"}}

{{!-- With icon (Phosphor icon name) --}}
{{> Button link=cta-link label=cta-label style="primary" icon="arrow-right"}}

{{!-- Conditional nav button --}}
{{#if cta-label}}
  {{> Button link=cta-link label=cta-label style="nav"}}
{{/if}}
```

## Customizing Per Theme

When setting up a new theme's button system:

1. **Set `buttons.global`** — match the source site's button font, weight, uppercase, and sizes (sm/md/lg padding + radius)
2. **Define `buttons.variants`** — map each button style to system/custom colors with appropriate hover presets
3. **Update Button.html** — the template rarely changes between themes since styling is in the config; only modify for structural differences (icon placement, arrow dividers)
4. **Update Button.json** — add/remove style options in `selectOptions` to match available variants
5. **Never inline button HTML in blocks** — always use `{{> Button}}` unless the design is truly unique (form submits, icon-only buttons)
