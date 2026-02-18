# Make Studio Importer

This project converts third-party website designs into make-studio themes. Claude is the primary conversion agent — given a URL, Claude autonomously analyzes, converts, and deploys a complete make-studio site.

## Project Ethos

- **Compute over human effort** — spend cycles to get quality right; minimize human intervention
- **Compound engineering** — every conversion makes the next one better (see `docs/learnings/`)
- **Quality is king** — generated blocks should be production-ready, not "starting points"

## Workflow: Site Conversion

When given a URL to convert, follow these phases:

### Phase 1: ANALYZE
1. Fetch the page HTML (use `fetch` or Playwright for SPAs)
2. Take a full-page screenshot with Playwright for visual reference
3. Identify all sections, their types, colors, fonts, and layout patterns
4. Map site colors → make-studio semantic tokens (see `docs/guides/design-tokens.md`)
5. Map site typography → make-studio heading/body tiers

### Phase 2: SETUP
1. Create the make-studio site via API if needed (requires create token)
2. Generate `theme.json` with fonts, systemColors, palette, typography tiers, prose
3. Create the `Button` partial (every theme needs one — see `docs/references/Button.md`)
4. Sync theme.json and Button partial to the site

### Phase 3: CONVERT (per block)
For each section on the page:
1. Read the source HTML for that section
2. Write a clean Handlebars template following `docs/guides/block-format.md`
3. Write the field definition JSON
4. Sync to make-studio via `npm run sync`
5. Take a screenshot of the deployed block
6. Compare visually to the original — iterate if needed

Key principles for block conversion:
- **Clean, indented HTML** — 2-space indentation, readable structure
- **Semantic tokens only** — never hardcode colors, use `bg-base`, `text-fg`, `text-brand`, etc.
- **Semantic typography** — use `heading-xl`, `body-md`, etc. — never raw `text-7xl`
- **Handlebars fields** — extract all text content into editable fields
- **Repeaters** — similar sibling elements become `{{#each items}}`
- **Standard container** — every section uses the standard wrapper pattern
- **No junk classes** — strip animation, transition, framework-specific classes
- **Alpine.js animations** — use `x-intersect` for entrance animations (see `docs/guides/animation-patterns.md`)

### Phase 4: ASSESS
1. Deploy the full site
2. Take a full-page screenshot
3. Compare section-by-section to the original
4. Present findings to the human for feedback
5. Iterate on specific blocks based on feedback

### Phase 5: COMPOUND
After a successful conversion:
1. Append new learnings to `docs/learnings/conversion-notes.md`
2. Note any new patterns discovered
3. Note any mistakes made and how they were fixed
4. Update guides if a stable new pattern emerged

## Key Guides

- `docs/guides/block-format.md` — Block HTML/JSON format, container pattern, field types
- `docs/guides/design-tokens.md` — Color and typography token system
- `docs/guides/animation-patterns.md` — Alpine.js entrance animations
- `docs/guides/api-reference.md` — Make Studio API operations
- `docs/guides/site-conversion.md` — Detailed conversion workflow

## Reference Examples

- `docs/references/` — Curated gold-standard block examples from the oatmeal theme

## Learnings (Compound Knowledge)

- `docs/learnings/conversion-notes.md` — Accumulated insights from past conversions

## CLI Commands

```bash
npm run sync -- --theme=<name> [--apply] [--delete] [--only=Block1,Block2]
npm run pull -- --theme=<name> [--only=Block1,theme]
npm run validate -- --theme=<name>
npm run scrape-site -- --url=<url> --theme=<name>   # Legacy deterministic scraper
npm run status -- --theme=<name>
npm run rollback -- --theme=<name> --snapshot=<file>
```

## Environment

```
MAKE_STUDIO_URL=https://api.makestudio.cc
MAKE_STUDIO_TOKEN=<per-site API token>
MAKE_STUDIO_SITE=<site ID>
```

## File Structure

```
themes/<name>/
  theme.json                    # Fonts, colors, typography, prose
  converted/
    blocks/
      BlockName.html            # Handlebars template
      BlockName.json            # Field definitions
    partials/
      Button.html               # Shared button partial
      Button.json               # Button field definitions
  snapshots/                    # Pre-sync state snapshots
```
