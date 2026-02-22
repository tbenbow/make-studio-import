# Site Generation Capability

Generate complete Make Studio sites from vibe prompts. Two-phase approach: unconstrained creative HTML first, then mechanical conversion to Make Studio blocks.

## Why Two Phases?

The Make Studio block format (Handlebars, JSON fields, semantic tokens) constrains creative output. By generating pure HTML first, the AI can be genuinely creative without worrying about template syntax or field definitions. The conversion step is mechanical and can follow strict rules.

## Workflow

### Phase 1: Creative Generation

User provides a vibe prompt — business type, tone, visual direction. Generate 4 single-page HTML variations, each maximally different.

**Variation strategy** — vary across all dimensions:

- Layout: asymmetric vs centered vs split-screen vs full-bleed
- Color: dark mode vs light vs warm vs cool
- Typography: serif vs sans-serif vs display vs monospace pairings
- Content: formal vs casual vs bold vs minimal
- Density: spacious vs compact vs mixed

**HTML format rules:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Name</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Font+Name:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    /* Tailwind config overrides and custom styles only */
  </style>
</head>
<body>
  <nav id="navbar">...</nav>
  <section id="hero">...</section>
  <section id="features">...</section>
  <section id="about">...</section>
  <footer id="footer">...</footer>
</body>
</html>
```

- Self-contained: Tailwind CDN + Google Fonts links, no JS frameworks
- Every `<section>` gets a descriptive `id` attribute
- Real or realistic content — no lorem ipsum
- Responsive: mobile-first with `sm:`, `md:`, `lg:` breakpoints
- Use Tailwind `<script>` tag (not the CDN stylesheet) for full utility support
- Images: use placeholder services like `https://placehold.co/600x400` or inline SVG illustrations

**Output:** `themes/<name>/source/v1.html`, `v2.html`, `v3.html`, `v4.html`

### Phase 2: Screenshot & Selection

Screenshot all variations for side-by-side comparison:

```bash
npm run preview-generations -- --theme=<name>
```

This starts a local server, takes full-page Playwright screenshots of each HTML file, saves them as `.png` files alongside the HTML.

User reviews the screenshots and picks a winner. The selected variation becomes the source for conversion.

### Phase 3: Design Extraction

Extract the design system from the selected HTML and build `theme.json`.

**Colors:**

1. List every color used in the HTML (hex values from classes, inline styles, Tailwind config)
2. Map to the 10 system colors — see `docs/capabilities/design/guide.md` for the mapping strategy
3. Remaining colors → `customColors`

**Typography:**

1. Identify all font families and weights used
2. Build the `fonts` array
3. Map sizes to typography tiers (`heading-xl` through `heading-xs`, `body-lg` through `body-sm`)
4. Set `mobileFontSize` and `mobileLineHeight` for headings

**Buttons:**

1. Identify button styles in the HTML
2. Define all 4 variants: primary, secondary, outline, ghost
3. Create `Button.html` and `Button.json` partials

**Sync:**

```bash
npm run sync -- --theme=<name> --apply --only=theme,Button
```

### Phase 4: Block Decomposition

Convert each `<section>` from the source HTML into a Make Studio block.

**For each section:**

1. **Name** — derive block name from the section's `id` (e.g., `hero` → `Hero`, `features` → `Features`)
2. **Colors** — replace all hex/rgb values with semantic tokens (`text-fg`, `bg-brand`, `bg-base-alt`, etc.)
3. **Typography** — replace Tailwind text sizes with tier classes (`heading-xl`, `body-md`, etc.)
4. **Container** — wrap content sections in `<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">`
5. **Animations** — strip for now (add in Phase 6)
6. **Fields** — extract editable content:
   - Static text → `{{default field-name 'Original text'}}`
   - Rich text / HTML content → `{{{field-name}}}`
   - Images → `{{image field-name}}`
   - Links → `href="{{url}}"`
   - Repeating elements → `{{#each items}}...{{/each}}`
7. **Buttons** — replace with `{{> Button}}` partial
8. **Field definitions** — build the `.json` file with proper types

**Sync one block at a time:**

```bash
npm run sync -- --theme=<name> --apply --only=Hero
```

Pull after the first sync to get server-assigned IDs:

```bash
npm run pull -- --theme=<name>
```

**Check references** — before building each block type, consult `docs/references/` for gold-standard examples of that block type.

### Phase 5: Pages, Layout & Preview

1. Create a layout with Navbar as the header block and Footer as the footer block
2. Set up pages: `npm run setup-pages -- --theme=<name>`
3. Deploy a preview: see `docs/capabilities/deployment/guide.md`
4. Compare the preview to the selected source HTML — check spacing, colors, typography, responsive behavior

### Phase 6: Iteration

- **Minor fixes** — edit block `.html`/`.json` files directly, re-sync
- **Major changes** — revise the relevant section in the source HTML, re-convert that block
- **Animations** — add Alpine.js entrance animations after the base design is approved (see `docs/capabilities/design/guide.md` for animation patterns)
- **Final preview** — side-by-side comparison with source

### Phase 7: Compound

1. Write learnings to `docs/capabilities/generation/learnings.md`
2. Flag uncertainties in `docs/review/pending.md`
3. After human review, incorporate feedback into this guide

## Key References

- `docs/capabilities/design/guide.md` — Color tokens, typography tiers, animation patterns
- `docs/capabilities/blocks/guide.md` — Block creation workflow
- `docs/capabilities/blocks/checklist.md` — Block decomposition rules
- `docs/references/` — Gold-standard block examples
- `docs/capabilities/generation/checklist.md` — Quick-reference checklist for this workflow
