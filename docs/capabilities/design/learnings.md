# Design Learnings

Accumulated insights about the Make Studio design system.

---

## Color Mapping

- **Saturation heuristic** — If the most-used background is highly saturated, it's `brand`, not `base`. Base is usually the least saturated background.
- **Custom colors, not system colors** — System colors are a fixed set of 10. Any additional colors (accent, accent2) go in `customColors` array.
- **Footer semantic workaround** — When footer uses `bg-base-alt` (dark) and needs white text, `text-on-brand` works if `on-brand` is white. No `on-base-alt` token exists yet.

## Typography

- **Heading font vs body font** — Headings (xl through md) typically use the display font. Body tiers and heading-sm/xs typically use the body font.
- **Measure, don't eyeball** — Use Playwright `getComputedStyle()` to extract exact font sizes, weights, line heights.

## Buttons

- **Button system is declarative** — Styling in `theme.json` under `buttons` with `global` (font, sizes) and `variants` (colors, hover).
- **Always include `buttons` in theme.json** — Gets wiped by theme sync if missing locally.
- **All 4 hardcoded variants must exist** — The server CSS generator iterates `['primary', 'secondary', 'outline', 'ghost']` and crashes with `Cannot read properties of undefined (reading 'backgroundColor')` if any is missing. Always define all four, even if the theme doesn't use them.
- **Button partial supports sizing and icons** — `size="lg"` or `size="sm"`, `icon="arrow-right"` for Phosphor icons.

## Animations

- **Strip all source animations** — Remove opacity-0, translate-y, transition, duration, delay, ease, AOS, GSAP, Vue transitions.
- **Replace with Alpine.js x-intersect** — `x-data="{ show: false }" x-intersect.once="show = true"`.
- **Easing** — Prefer `ease-out`. For dramatic: `ease-[cubic-bezier(0.16,1,0.3,1)]`.
- **No `multiply` or math helpers in Handlebars** — Can't compute staggered delays inside `{{#each}}`. Use individual `x-intersect` per item instead, or CSS `nth-child` with fixed delays.
