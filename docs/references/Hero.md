# Reference: Hero Block

Simple centered hero with eyebrow, headline, subheadline, and buttons.

## Template (Hero.html)

```handlebars
<section class="py-16 bg-base">
  <div class="mx-auto w-full max-w-2xl px-6 md:max-w-3xl lg:max-w-7xl lg:px-10 flex flex-col items-center gap-6">
    {{#if eyebrow}}
      <p class="body-sm font-semibold text-fg-muted">{{eyebrow}}</p>
    {{/if}}
    <h1 class="heading-xl text-fg max-w-5xl text-center text-balance">{{headline}}</h1>
    <div class="body-lg text-fg-muted max-w-xl text-center">
      {{{subheadline}}}
    </div>
    {{#if (length buttons)}}
      <div class="flex flex-wrap items-center justify-center gap-4 mt-2">
        {{#each buttons}}
          {{> Button}}
        {{/each}}
      </div>
    {{/if}}
  </div>
</section>
```

## Fields (Hero.json)

```json
{
  "makeStudioFields": true,
  "version": 1,
  "description": "Simple centered",
  "fields": [
    {
      "type": "text",
      "name": "Eyebrow",
      "default": "Introducing Oatmeal"
    },
    {
      "type": "text",
      "name": "Headline",
      "default": "Customer support that feels like a conversation."
    },
    {
      "type": "wysiwyg",
      "name": "Subheadline",
      "default": "<p>Simplify your shared inbox, collaborate effortlessly, and give every customer a reply that feels personal.</p>"
    },
    {
      "type": "items",
      "name": "Buttons",
      "default": [
        { "label": "Start free trial", "link": "#", "style": "primary" },
        { "label": "Learn more", "link": "#", "style": "ghost" }
      ],
      "config": {
        "fields": [
          { "type": "text", "name": "Label" },
          { "type": "text", "name": "Link" },
          {
            "type": "select",
            "name": "Style",
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
    }
  ]
}
```

## Key Patterns

- `h1` with `heading-xl` — only used in hero blocks
- Eyebrow wrapped in `{{#if}}` — optional
- Subheadline uses triple-stache `{{{subheadline}}}` for WYSIWYG
- Buttons use the `Button` partial with style select field
- Centered layout with `items-center`, `text-center`, `text-balance`
- `max-w-5xl` on headline, `max-w-xl` on subheadline for readable line lengths
