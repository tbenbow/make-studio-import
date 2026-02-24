# Block Ingress Learnings

Accumulated insights from building individual blocks from screenshots. Read this before starting a new block.

---

<!-- Entries follow this format:
## Block Name (YYYY-MM-DD)

**Type**: Hero / Features / Stats / Navbar / Footer / CTA / Testimonial / etc.
**Source**: Description of where the screenshot came from
**Design**: Brief description (dark/light, brand color, fonts)
**Iterations**: How many screenshot iterations were needed

### What Worked
- ...

### What Didn't
- ...

### Patterns Discovered
- ...
-->

## Editorial Split (2026-02-24)

**Type**: Split / Editorial
**Source**: User-provided screenshot — two-column editorial layout with image + blockquote on left, video image with play button on right
**Design**: Light warm off-white (#f5f5f0) background, serif italic quote, muted gold (#d4c9a8) decorative quotation mark, gold (#e8d9a0) play button
**Iterations**: 2 (first pipeline test)

### What Worked
- **block-screenshot.ts pipeline works end-to-end** — sync block → setup page → deploy preview → Playwright screenshot. Full round-trip in ~15 seconds.
- **Using Index page at `/`** — reliable URL resolution since it always exists and renders at the root path. No slug configuration needed.
- **Inline styles for self-contained blocks** — prevents the site's existing theme (dark navy for block-ingress) from overriding block colors. `style="background-color: #f5f5f0"` beats `class="bg-white"` when the Tailwind theme layer has its own opinion.
- **setPageContent with field names resolves server-side** — `{ "Editorial Split": { "Quote": "..." } }` works. No need to know the UUID.
- **Iteration artifacts auto-numbered** — render-1.png, render-2.png in `themes/<theme>/iterations/<BlockName>/`.

### What Didn't
- **Description field max 30 chars** — API rejects `updateBlock` with longer descriptions. Validation error: `"description" length must be less than or equal to 30 characters long`. Not documented anywhere until now.
- **Page slug doesn't persist via API** — `updatePage(id, { settings: { slug: 'scratch' } })` doesn't actually set the slug. The settings object comes back unchanged. Abandoned the Scratch page approach entirely.
- **Tailwind classes get overridden by site theme** — the block-ingress site has a dark navy theme. Using `bg-white` or `text-gray-800` doesn't override the theme's CSS custom properties. Inline styles are the escape hatch.
- **Site layout wraps all blocks** — the block-ingress site has a Navbar + Footer layout. The screenshot includes these. For pure block comparison, you'd need to either crop or strip the layout. Current approach: accept it and compare the block area visually.

### Patterns Discovered
- **Use Index page, not a Scratch page** — the Index page always exists, always has a working URL (`/`), and doesn't require slug configuration. Just replace its blocks array with the single block under test.
- **Inline styles > Tailwind for block isolation** — when the block will render on a themed site, inline styles ensure the block's intended design isn't corrupted. Use `style=` for backgrounds, text colors, and spacing. Tailwind is fine for layout utilities (grid, flex) that don't conflict with theme colors.
- **Pipeline timing** — sync + deploy + screenshot takes ~15s. This is fast enough for 3 iteration rounds to feel interactive.
- **Block description ≤30 chars** — keep it terse: "Editorial image + quote" not "Two-column editorial layout with image + blockquote on left..."
