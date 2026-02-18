# Animation Patterns

Make-studio supports Alpine.js. Use `x-intersect` for entrance animations that trigger when elements scroll into view.

## Basic Fade-Up Pattern

The most common entrance animation: fade in + slide up when the element enters the viewport.

```html
<div
  x-data="{ show: false }"
  x-intersect.once="show = true"
  :class="show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
  class="transition-all duration-700 ease-out"
>
  <!-- content -->
</div>
```

## Staggered Children

For repeater items (feature cards, stats, etc.), stagger the entrance with inline transition-delay:

```html
{{#each features}}
  <div
    x-data="{ show: false }"
    x-intersect.once="show = true"
    :class="show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
    class="transition-all duration-700 ease-out"
    style="transition-delay: {{multiply @index 100}}ms;"
  >
    <h3 class="heading-sm text-fg">{{headline}}</h3>
    <div class="body-sm text-fg-muted">{{{description}}}</div>
  </div>
{{/each}}
```

Note: If `{{multiply}}` helper is not available, use fixed delays:

```html
<div class="transition-all duration-700 ease-out" style="transition-delay: 0ms;">...</div>
<div class="transition-all duration-700 ease-out" style="transition-delay: 100ms;">...</div>
<div class="transition-all duration-700 ease-out" style="transition-delay: 200ms;">...</div>
```

For repeaters where you can't set individual delays, apply the animation at the container level instead.

## Section-Level Animation

Wrap the entire section content in a single animation controller:

```html
<section class="py-16 bg-base">
  <div
    class="mx-auto w-full max-w-2xl px-6 md:max-w-3xl lg:max-w-7xl lg:px-10"
    x-data="{ show: false }"
    x-intersect.once="show = true"
  >
    <div
      :class="show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
      class="transition-all duration-700 ease-out"
    >
      <!-- section content -->
    </div>
  </div>
</section>
```

## Counter Animation

For stats/numbers that count up:

```html
<div
  x-data="{ count: 0, target: 500, show: false }"
  x-intersect.once="show = true; let start = performance.now(); const duration = 2000; const animate = (now) => { const progress = Math.min((now - start) / duration, 1); count = Math.floor(progress * target); if (progress < 1) requestAnimationFrame(animate); }; requestAnimationFrame(animate);"
>
  <span class="heading-xl text-fg" x-text="count + '+'"></span>
</div>
```

## Easing

Prefer `ease-out` for entrance animations. For a more dramatic feel:
- `ease-[cubic-bezier(0.16,1,0.3,1)]` — overshoot ease (snappy entrance)

## Duration Guidelines

| Animation Type | Duration |
|---------------|----------|
| Fade in | 500-700ms |
| Slide up | 600-800ms |
| Stagger delay | 80-150ms per item |
| Counter | 1500-2500ms |
| Hover transitions | 200-300ms |

## When to Animate

- Section entrances (fade-up on scroll)
- Card grids (staggered fade-up)
- Stats/numbers (count up)
- Hero content (initial page load animation)

## When NOT to Animate

- Navigation elements
- Footer content
- Form inputs
- Already-visible above-the-fold content (hero should animate on load, not on scroll)

## Stripping Source Animations

When converting from source HTML, remove all of these and replace with Alpine.js patterns:
- `opacity-0` (initial state classes)
- `translate-y-*` (transform classes used for animation start states)
- `transition-all`, `transition-*`
- `duration-*`, `delay-*`
- `ease-*`
- AOS attributes (`data-aos`, `data-aos-delay`)
- GSAP/Framer Motion classes
- Vue/Nuxt transition classes (`v-enter`, `v-leave`, etc.)
