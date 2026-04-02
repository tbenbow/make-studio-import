# Conversion Process Refinement

Working document for improving the site conversion workflow, informed by the WOOL Film Squarespace conversion.

## Observations

### From WOOL Film conversion
- Squarespace HTML is too messy to convert directly — screenshot-based approach is better
- Font identification from computed styles is unreliable — external tools (Peek) give accurate data instantly
- Typography was assigned to theme tiers abstractly ("this feels like heading-lg") rather than measured precisely
- Grid gaps were guessed (Tailwind defaults) instead of measured from the source
- Theme should be locked down before building blocks — we rebuilt blocks 4 times
- API token permissions weren't validated upfront, causing workaround churn
- No section-by-section comparison loop during block building

### From prior conversions
- The Make Studio app's image-to-block generation (`POST /blocks/generate-template`) is fast (~7s) and produces high-quality blocks that respect the site's theme
- This is the same quality we'd want in a conversion — if the theme is set up correctly, the generated blocks should match the source design

## Proposed Approach

### Screenshot → App Image Conversion
1. Screenshot the source site, split into per-section images
2. Set up the theme correctly first (fonts, colors, typography tiers)
3. Feed each section screenshot to the app's `/blocks/generate-template` endpoint
4. The app generates blocks that already use the theme's design system

**Key dependency:** Theme must be accurate before block generation — fonts, weights, colors, and typography tiers all need to match the source.

### Theme Extraction with Peek

[Peek](https://trypeek.app/) is a Chrome extension that extracts colors, typography, and assets from any website. No API — manual step only.

**What it gives us:**
- Typography: font families, weights, sizes, line heights — grouped into named styles with sample text
- Colors: hex, RGB, HSL values
- Assets: SVGs, PNGs, icons
- Export as JSON design tokens (DTCG-style `$type`/`$value` format), CSS variables, or Tailwind classes

**What it doesn't do:**
- No programmatic/API access — requires someone to run the extension and export
- Doesn't map styles to theme tiers (we still need to decide what's `heading-lg` vs `body-lg`)
- Doesn't extract spacing/gaps between elements

**Format example (from WOOL):**
```json
{
  "typography": {
    "h3": {
      "$type": "typography",
      "$description": "Sample: 'WOOL is a surreal...'",
      "$value": {
        "fontFamily": "widescreen, sans-serif",
        "fontSize": "39.4624px",
        "fontWeight": "100",
        "lineHeight": "1.25"
      }
    }
  }
}
```

## Theme Building Pipeline

### Input
- Peek JSON (typography + colors)
- Full-page screenshot of source site

### Steps

1. **Extract raw values from Peek** — fonts, weights, sizes, colors (manual — Peek is a Chrome extension). Use light filtering: remove obvious duplicates and hover states, but keep anything that could be a distinct style. Err on the side of including too much — the vision step can ignore noise, but it can't recover missing data.
2. **Classify and assign tiers (vision + Peek JSON)** — Feed Claude the full-page screenshot alongside the Peek JSON. Claude uses visual context to determine which styles are headings vs body (a thin weight 100 style can still be a heading if it's visually large and positioned as a section title). Sort by size within each category to assign tiers (xl → sm). Fill gaps if the source has fewer distinct sizes than our tier system.
3. **Map colors from screenshot** — Same vision approach. Use the screenshot to determine which color is `base` (bg), `fg` (text), `brand` (accent), `panel`, etc. Raw hex values alone don't tell you which is which.

### Where this lives
- **This project (make-studio-importer)** — script that takes Peek JSON + screenshot, calls Claude API for classification, outputs theme.json. This is the experimentation space before anything moves to the main app.

### Output
- Complete `theme.json` ready for block generation

## Section Screenshot Approach

**Preferred: Hide-all-but-one via CSS injection**

Use Playwright to hide all sections except the target, then screenshot. This avoids clipping coordinate math and gives clean isolated renders.

```
For each section on the page:
  1. Hide all other sections via display:none
  2. Screenshot the visible section (full-width, natural height)
  3. Restore and move to next
```

**Advantages over clip-based approach:**
- No coordinate math or scroll-position bugs
- Each screenshot is exactly the section's natural dimensions
- Works regardless of section height or position on page

**Depends on:** Source site having well-structured section elements (most do — Squarespace uses `<section>` tags with IDs)

**Fallback:** If sections aren't cleanly separated in the DOM, fall back to clip-based Playwright screenshots with manually identified Y coordinates.

## Content Population

### Challenge
Generated blocks have placeholder defaults. Real content (text, image URLs) needs to come from the source site.

### Possible approach
1. **Extract content from source HTML** — Playwright grabs text content per section (filtered to remove Squarespace noise). Produce a structured JSON doc keyed by section/block.
2. **Map content to block fields** — Match extracted content to the generated block's field names. Could be automated (Claude maps section text → field names) or manual review of a JSON doc.
3. **Apply via local sync or setPageContent** — Push content to the site.

### Open questions
- What level of HTML filtering is needed? Squarespace injects a lot of wrapper divs.
- Should content extraction happen per-section (aligned with the screenshot split) or as a full-page pass?
- Can we use image URLs from the source directly during development, then upload to R2 as a final step?

## Process Changes
_(to be defined through discussion)_

## Workflow Landscape

| Workflow | When to use | Status |
|----------|-------------|--------|
| `/ms-convert` | Have the source project locally (Next.js, HTML, clean code) | Keep as-is |
| `/ms-generate` | New site from scratch, vibe prompt | Keep as-is |
| `/ms-compose` | New site from existing block library | Keep as-is |
| **`/ms-convert-live`** (new) | Online site without source project (Squarespace, Wix, WordPress, etc.) — code too messy to reuse | **Build this** |

`/ms-convert` = code-first (read HTML, transform to Handlebars)
`/ms-convert-live` = screenshot-first (capture visuals, generate blocks via app API)

## `/ms-convert-live` Pipeline (draft)

### Inputs
- Site URL
- Peek JSON export (typography + colors, light filtering)
- Full-page screenshot(s)
- Font embed URL if custom fonts (e.g. Adobe Typekit)

### Phases
1. **Screenshot + Peek** — Playwright full-page screenshots of each page. User runs Peek and provides JSON export.
2. **Build theme** — Feed screenshot + Peek JSON to Claude vision. Classify typography (heading vs body), assign tiers by size, map colors from screenshot. Output: `theme.json`.
3. **Split sections** — Use Playwright CSS injection (hide-all-but-one) to screenshot each section individually.
4. **Generate blocks** — Feed each section screenshot to the app's `/blocks/generate-template` API. Blocks inherit the theme.
5. **Extract content** — Scrape text + image URLs from source HTML per section. Prepare content JSON.
6. **Assemble site** — Create pages, assign blocks, set content via `setPageContent`, upload images to R2.
7. **Deploy + verify** — Preview, screenshot, compare section-by-section against originals.

## Open Questions
_(tracked as we go)_
