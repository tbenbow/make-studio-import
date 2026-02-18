# Reference: Features Block

Three-column feature grid with optional eyebrow, headline, subheadline, and repeater.

## Template (Features.html)

```handlebars
<section class="py-16 bg-base">
  <div class="mx-auto w-full max-w-2xl px-6 md:max-w-3xl lg:max-w-7xl lg:px-10 flex flex-col gap-10 sm:gap-16">
    {{#if headline}}
      <div class="flex max-w-2xl flex-col gap-6">
        <div class="flex flex-col gap-2">
          {{#if eyebrow}}
            <p class="body-sm font-semibold text-fg-muted">{{eyebrow}}</p>
          {{/if}}
          <h2 class="heading-lg text-fg text-pretty">{{headline}}</h2>
        </div>
        {{#if subheadline}}
          <div class="body-md text-fg-muted text-pretty">{{{subheadline}}}</div>
        {{/if}}
      </div>
    {{/if}}
    {{#if (length features)}}
      <div class="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {{#each features}}
          <div class="flex flex-col gap-2 body-sm">
            <div class="flex items-start gap-3 text-fg">
              {{#if icon}}
                <div class="flex size-5 h-7 items-center text-brand">
                  {{icon icon size="20"}}
                </div>
              {{/if}}
              <h3 class="font-semibold">{{headline}}</h3>
            </div>
            <div class="flex flex-col gap-4 text-fg-muted">{{{description}}}</div>
          </div>
        {{/each}}
      </div>
    {{/if}}
  </div>
</section>
```

## Fields (Features.json)

```json
{
  "makeStudioFields": true,
  "version": 1,
  "description": "Three column",
  "fields": [
    { "type": "text", "name": "Eyebrow", "default": "Features" },
    { "type": "text", "name": "Headline", "default": "Everything you need to deliver great support." },
    {
      "type": "wysiwyg",
      "name": "Subheadline",
      "default": "<p>Work smarter, reply faster, and keep every customer conversation right where it belongs.</p>"
    },
    {
      "type": "items",
      "name": "Features",
      "default": [
        { "icon": "envelope", "headline": "Shared Inbox", "description": "<p>Keep every customer conversation in one clean, collaborative inbox.</p>" },
        { "icon": "robot", "headline": "AI Assistant", "description": "<p>Get valuable context without having to read through long email threads.</p>" },
        { "icon": "lightning", "headline": "Quick Replies", "description": "<p>Respond faster with templates and snippets for common questions.</p>" }
      ],
      "config": {
        "fields": [
          { "type": "text", "name": "Icon" },
          { "type": "text", "name": "Headline" },
          { "type": "wysiwyg", "name": "Description" }
        ]
      }
    }
  ]
}
```

## Key Patterns

- Section header pattern: eyebrow → headline → subheadline in a left-aligned `max-w-2xl` block
- `heading-lg` for section headlines (not `heading-xl` — that's reserved for hero)
- Responsive grid: 1 col → 2 col (sm) → 3 col (lg)
- Each feature card has `body-sm` as base text size
- Icons use `{{icon icon size="20"}}` helper with Phosphor icon names
- Description uses `{{{description}}}` (triple-stache for WYSIWYG)
