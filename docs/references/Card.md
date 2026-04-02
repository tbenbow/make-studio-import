# Reference: Card Partial

The Card partial provides consistent card styling across all blocks. Blocks wrap their card content in the partial's output classes.

## How It Works

Unlike Button (which wraps its own content), Card is a **class generator** — it outputs a `<div>` with the right card classes, and the block template places content inside it. This follows the same parameter-passing pattern as Button.

## Template (Card.html)

```handlebars
<div class="card card-{{default style 'flat'}} {{default class ''}}">
  {{{yield}}}
</div>
```

> **Note:** If `{{{yield}}}` / `@partial-block` is not supported, blocks should instead apply card classes directly using a CSS convention:

### Fallback: CSS-only approach

If the partial can't wrap content, blocks apply card classes directly:

```handlebars
<div class="card card-bordered p-6">
  {{!-- card content here --}}
</div>
```

This is the safer approach until we confirm yield support.

## Card Styles

| Style | Class | Effect |
|-------|-------|--------|
| `flat` | `card-flat` | Padding only. No border, no shadow. |
| `bordered` | `card-bordered` | Subtle border using `border-border`. |
| `elevated` | `card-elevated` | Shadow (`shadow-md`), no border. |
| `filled` | `card-filled` | Background fill using `bg-base-muted`. |
| `glass` | `card-glass` | Translucent background with backdrop blur. |

## CSS Definitions

Add to the theme's base styles or as a utility layer:

```css
.card {
  border-radius: var(--card-radius, 0.75rem);
  padding: var(--card-padding, 1.5rem);
}

.card-flat {
  /* padding only, no decoration */
}

.card-bordered {
  border: 1px solid rgb(var(--color-border) / 0.15);
}

.card-elevated {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.card-filled {
  background-color: rgb(var(--color-base-muted));
}

.card-glass {
  background-color: rgb(var(--color-base) / 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgb(var(--color-border) / 0.1);
}
```

## Usage in Blocks

```handlebars
{{!-- Simple flat card --}}
<div class="card card-flat">
  <h3 class="heading-sm">{{title}}</h3>
  <p class="body-base text-fg-muted">{{description}}</p>
</div>

{{!-- Bordered card with icon --}}
<div class="card card-bordered">
  {{icon icon size="24"}}
  <h3 class="heading-sm mt-4">{{title}}</h3>
  <p class="body-sm text-fg-muted mt-2">{{description}}</p>
</div>

{{!-- Elevated card in a grid --}}
{{#each items}}
  <div class="card card-elevated">
    <img src="{{image}}" alt="" class="rounded-lg mb-4">
    <h3 class="heading-sm">{{title}}</h3>
    <p class="body-sm text-fg-muted">{{description}}</p>
  </div>
{{/each}}

{{!-- Glass card over a background image --}}
<div class="card card-glass">
  <h3 class="heading-md text-fg">{{title}}</h3>
  <p class="body-base text-fg-muted">{{description}}</p>
</div>
```

## Customizing Per Theme

Card styles are controlled via CSS custom properties on the theme:

- `--card-radius` — border radius (default `0.75rem`)
- `--card-padding` — internal padding (default `1.5rem`)

The card classes reference system colors (`border`, `base-muted`, `base`) so they adapt to any theme's color scheme automatically.
