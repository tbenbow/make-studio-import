# Reference: Button Partial

The Button partial is shared across all blocks. Every theme must have one.

## Template (Button.html)

```handlebars
{{#switch style}}
  {{#case "secondary"}}
    <a href="{{link}}" class="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-brand/10 text-fg px-4 py-2 body-sm font-medium hover:bg-brand/15 transition">
      {{default label "Click Here"}}
    </a>
  {{/case}}
  {{#case "ghost"}}
    <a href="{{link}}" class="inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-fg px-4 py-2 body-sm font-medium hover:bg-brand/10 transition">
      {{default label "Click Here"}}
    </a>
  {{/case}}
  {{#otherwise}}
    <a href="{{link}}" class="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-brand text-on-brand px-4 py-2 body-sm font-medium hover:bg-base-alt transition">
      {{default label "Click Here"}}
    </a>
  {{/otherwise}}
{{/switch}}
```

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
          { "key": "Ghost", "value": "ghost" }
        ]
      }
    }
  ]
}
```

## Key Patterns

- `{{#switch style}}` for variant selection
- `{{default label "Click Here"}}` provides fallback text
- **Primary**: `bg-brand text-on-brand`, hover → `bg-base-alt`
- **Secondary**: `bg-brand/10 text-fg`, hover → `bg-brand/15`
- **Ghost**: transparent bg, `text-fg`, hover → `bg-brand/10`
- All variants: `rounded-full`, `body-sm font-medium`, `inline-flex` with centering
- `shrink-0` prevents button from shrinking in flex containers
- Keep `transition` for hover effects (this is a simple hover, not an entrance animation)

## Customizing Per Theme

Adapt the button styles to match the source site:
- Border radius: `rounded-full` (pill) vs `rounded-lg` (rounded) vs `rounded-none` (square)
- Padding: `px-4 py-2` (compact) vs `px-6 py-3` (spacious)
- Text treatment: `font-medium` vs `font-bold`, `uppercase tracking-wider` for bold styles
- Border: add `border-2 border-fg` for outlined ghost buttons
