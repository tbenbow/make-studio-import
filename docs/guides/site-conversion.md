# Site Conversion Guide

Detailed workflow for converting a website into a make-studio theme.

## Prerequisites

- URL of the site to convert
- The site should be server-rendered (SSR) for best results — Nuxt, Next.js, Astro, etc.
- For SPAs, use Playwright to get the rendered HTML

## Phase 1: Analysis

### 1.1 Fetch the Page

```typescript
const response = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; ...)' }
})
const html = await response.text()
```

For SPAs or pages with client-rendered content, use Playwright:

```typescript
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(url, { waitUntil: 'networkidle' })
const html = await page.content()
```

### 1.2 Take a Reference Screenshot

```typescript
await page.screenshot({ path: 'reference-full.png', fullPage: true })
```

This is your ground truth for visual comparison.

### 1.3 Identify Sections

Look at the page structure and identify distinct sections. Common pattern:

```
<body>
  <header> → Navbar block
  <main> or app root
    <section> → Hero
    <section> → Features
    <section> → Stats
    <section> → Process
    <section> → Testimonial
    <section> → CTA
  </main>
  <footer> → Footer block
</body>
```

Name each block using PascalCase. Use descriptive suffixes when there are multiple blocks of the same type: `Features`, `FeaturesAlternating`, `FeaturesWithImages`.

### 1.4 Extract Colors

Gather all colors used on the site:
- CSS custom properties / variables
- Tailwind color classes (both semantic and arbitrary `bg-[#hex]`)
- Inline styles
- External stylesheet color definitions

Map them to make-studio's 10 system colors (see `design-tokens.md`).

### 1.5 Extract Typography

Identify:
- Google Fonts or self-hosted font URLs
- Which font is used for headings vs. body text
- Font weights used (400, 500, 600, 700, etc.)
- Approximate sizes for each heading tier

## Phase 2: Theme Setup

### 2.1 Create theme.json

Build the complete theme configuration:

```json
{
  "fonts": [...],
  "systemColors": {...},
  "customColors": [],
  "palette": {...},
  "headingTypography": {...},
  "bodyTypography": {...},
  "prose": {...}
}
```

See `design-tokens.md` for the full structure.

### 2.2 Create Button Partial

Every theme needs a Button partial. Analyze the site's button styles and create variants:

- **primary**: The main CTA button (usually `bg-brand text-on-brand`)
- **secondary**: Less prominent button (usually `bg-brand/10 text-fg`)
- **ghost**: Text-only or outlined button

See `docs/references/Button.md` for the template.

### 2.3 Deploy Theme Foundation

```bash
npm run sync -- --theme=<name> --apply --only=theme,Button
```

## Phase 3: Block Conversion

For each section, working top-to-bottom:

### 3.1 Extract the Section HTML

Get the raw HTML for just this section from the source page.

### 3.2 Clean and Convert

This is the core creative work. Transform source HTML into a clean Handlebars template:

1. **Strip animation classes** — Remove `opacity-0`, `translate-y-*`, `transition-*`, `duration-*`, `delay-*`, `ease-*`
2. **Replace color classes** — `bg-[#0a0a0a]` → `bg-base`, `text-white` → `text-fg`, `text-[#c8ff00]` → `text-brand`
3. **Replace typography classes** — `text-7xl` → `heading-xl`, `text-lg` → `body-lg`
4. **Strip redundant classes** — Remove `font-family:...` utilities if covered by typography tiers, remove framework-specific classes
5. **Apply standard container** — Replace whatever wrapper exists with the standard section/container pattern
6. **Extract text into fields** — Replace hardcoded text with `{{fieldName}}`
7. **Detect repeaters** — Similar sibling elements → `{{#each items}}`
8. **Use Button partial** — Replace inline button HTML with `{{> Button}}`
9. **Add conditionals** — Wrap optional elements in `{{#if fieldName}}`
10. **Format and indent** — Clean 2-space indented HTML

### 3.3 Write Field Definitions

Create the JSON file with all fields, using content from the original site as defaults.

### 3.4 Deploy and Verify

```bash
npm run sync -- --theme=<name> --apply --only=BlockName
```

Take a screenshot of the deployed block. Compare to the original. If it doesn't match, iterate.

## Phase 4: Assessment

### 4.1 Full Deployment

Once all blocks are converted:

```bash
npm run sync -- --theme=<name> --apply
```

### 4.2 Visual Comparison

Take a full-page screenshot of the deployed site and compare section-by-section to the original reference screenshot.

Common issues to look for:
- Color mismatches (wrong token mapping)
- Typography size/weight mismatches
- Layout differences (wrong grid columns, missing gaps)
- Missing content (fields not extracted)
- Broken repeaters (wrong data structure)

### 4.3 Human Feedback

Present the deployed preview to the human. Document their feedback for each block. Iterate.

## Phase 5: Compound

After a successful conversion, update `docs/learnings/conversion-notes.md` with:

1. **Site characteristics**: What framework, what CSS approach, what made this site unique
2. **What worked well**: Patterns or approaches that produced good results
3. **What went wrong**: Mistakes made and how they were fixed
4. **New patterns**: Any block patterns or conversion techniques discovered
5. **Token mapping insights**: Any color/typography mapping lessons learned

## Tips

- Work on one block at a time, deploy, verify, then move to the next
- Start with the simplest blocks (CTA, Stats) before tackling complex ones (Navbar, Footer)
- Hero blocks vary the most between themes — study the original carefully
- When in doubt about a field type, use `text` — it's the safest default
- WYSIWYG fields should always have `<p>` wrapped defaults
- Keep block descriptions short (under 30 chars) — they appear in the block picker
