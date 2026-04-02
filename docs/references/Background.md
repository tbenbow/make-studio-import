# Reference: Block Backgrounds

Every block should include a controllable background via a `Background` select field. This is not a partial — it's a field convention that all blocks follow.

## How It Works

Each block's outer `<section>` applies `bg-{{background}}` as a class. The user picks from system color options in the editor. This means any block can sit on any background without editing the template.

## Field Definition

Add to every block's JSON fields:

```json
{
  "type": "select",
  "name": "Background",
  "default": "base",
  "config": {
    "selectOptions": [
      { "key": "Default", "value": "base" },
      { "key": "Muted", "value": "base-muted" },
      { "key": "Alt", "value": "base-alt" },
      { "key": "Panel", "value": "panel" },
      { "key": "Brand", "value": "brand" },
      { "key": "Foreground", "value": "fg" }
    ]
  }
}
```

## Template Pattern

```handlebars
<section class="py-16 lg:py-24 bg-{{background}}">
  <div class="container mx-auto px-6">
    {{!-- block content --}}
  </div>
</section>
```

### Text color adaptation

When the background changes, text colors need to adapt. Use the `text-on-*` convention or conditional classes:

```handlebars
<section class="py-16 lg:py-24 bg-{{background}} {{#if-eq background 'brand'}}text-on-brand{{else}}{{#if-eq background 'fg'}}text-base{{else}}text-fg{{/if-eq}}{{/if-eq}}">
```

Or simpler — rely on the CSS color system where `text-fg` automatically contrasts with the background. If the theme's system colors are set up correctly, `bg-brand text-on-brand` and `bg-base text-fg` just work.

For the generic library, the simplest approach is:

```handlebars
<section class="py-16 lg:py-24 bg-{{background}}">
```

And let the theme's color tokens handle contrast. Blocks that need explicit light-on-dark treatment (like a brand CTA) can use conditional classes.

## Usage in Blocks

```handlebars
{{!-- Feature grid --}}
<section class="py-16 lg:py-24 bg-{{background}}">
  <div class="max-w-7xl mx-auto px-6">
    <h2 class="heading-lg text-center">{{heading}}</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
      {{#each items}}
        <div class="card card-bordered">
          {{icon icon size="24"}}
          <h3 class="heading-sm mt-4">{{title}}</h3>
          <p class="body-sm text-fg-muted mt-2">{{description}}</p>
        </div>
      {{/each}}
    </div>
  </div>
</section>
```

## Notes

- `Background` should be the **last** field in the block's field list (it's a layout control, not content)
- Default to `base` for most blocks, `brand` for CTA blocks
- The `bg-*` classes map directly to system colors defined in `theme.json` → `systemColors`
