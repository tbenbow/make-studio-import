# Reference: Testimonial Block

Large centered quote with author attribution.

## Template (Testimonial.html)

```handlebars
<section class="py-16 bg-base">
  <div class="mx-auto w-full max-w-2xl px-6 md:max-w-3xl lg:max-w-7xl lg:px-10">
    <figure class="text-fg">
      <blockquote class="mx-auto flex max-w-4xl flex-col gap-4 text-center heading-lg tracking-tight text-pretty before:content-['"'] after:content-['"']">
        {{{quote}}}
      </blockquote>
      <figcaption class="mt-16 flex flex-col items-center">
        {{#if image}}
          <div class="flex size-12 overflow-hidden rounded-full outline -outline-offset-1 outline-border">
            <img src="{{image}}" alt="{{name}}" class="size-full object-cover" />
          </div>
        {{/if}}
        <p class="mt-4 text-center body-sm font-semibold text-fg">{{name}}</p>
        <p class="text-center body-sm text-fg-muted">{{byline}}</p>
      </figcaption>
    </figure>
  </div>
</section>
```

## Key Patterns

- Semantic HTML: `<figure>`, `<blockquote>`, `<figcaption>`
- Quote uses `heading-lg` for visual impact
- CSS `before:content` and `after:content` for decorative quote marks
- Author image with `rounded-full` and `outline-border`
- `{{{quote}}}` uses triple-stache for WYSIWYG
