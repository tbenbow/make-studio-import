# Reference: CTA Block

Simple centered call-to-action with headline, subheadline, and buttons.

## Template (CTACentered.html)

```handlebars
<section class="py-16 bg-base">
  <div class="mx-auto w-full max-w-2xl px-6 md:max-w-3xl lg:max-w-7xl lg:px-10 flex flex-col items-center gap-10">
    <div class="flex flex-col gap-6">
      <h2 class="heading-lg text-fg max-w-4xl text-center text-pretty">{{headline}}</h2>
      {{#if subheadline}}
        <div class="body-md text-fg-muted max-w-3xl text-center text-pretty">{{{subheadline}}}</div>
      {{/if}}
    </div>
    {{#if (length buttons)}}
      <div class="flex flex-wrap items-center justify-center gap-4">
        {{#each buttons}}
          {{> Button}}
        {{/each}}
      </div>
    {{/if}}
  </div>
</section>
```

## Key Patterns

- Very similar to Hero but uses `h2` with `heading-lg` (not h1/heading-xl)
- No eyebrow typically
- Centered layout with `items-center` and `text-center`
- Uses Button partial for CTA buttons
- Simpler than Hero — focused on a single action
