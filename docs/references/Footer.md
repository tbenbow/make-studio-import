# Reference: Footer Block

Footer with navigation links, social icons, and fineprint.

## Template (Footer.html)

```handlebars
<footer class="pt-16">
  <div class="bg-panel py-16 text-fg">
    <div class="mx-auto w-full max-w-2xl px-6 md:max-w-3xl lg:max-w-7xl lg:px-10 flex flex-col gap-10 text-center body-sm">
      <div class="flex flex-col gap-6">
        {{#if (length links)}}
          <nav>
            <ul class="flex flex-wrap items-center justify-center gap-x-10 gap-y-2">
              {{#each links}}
                <li class="text-fg-muted hover:text-fg transition">
                  <a href="{{url}}">{{label}}</a>
                </li>
              {{/each}}
            </ul>
          </nav>
        {{/if}}
        {{#if (length social-links)}}
          <div class="flex items-center justify-center gap-6">
            {{#each social-links}}
              <a href="{{url}}" target="_blank" rel="noopener" aria-label="{{name}}" class="text-fg hover:text-brand transition">
                {{icon icon size="24"}}
              </a>
            {{/each}}
          </div>
        {{/if}}
      </div>
      <div class="text-fg-alt">{{{fineprint}}}</div>
    </div>
  </div>
</footer>
```

## Key Patterns

- Uses `<footer>` not `<section>`
- `bg-panel` for visual separation from main content
- `pt-16` on outer footer, `py-16` on inner panel
- Social links use `{{icon icon size="24"}}` with Phosphor icon names
- Fineprint uses `text-fg-alt` (dimmest text color) and `{{{fineprint}}}` (WYSIWYG)
- Social links get `target="_blank" rel="noopener"` and `aria-label`
