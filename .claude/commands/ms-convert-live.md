---
description: Convert a live website into Make Studio blocks using screenshots. Pass the theme name as an argument.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, Task
---

Convert a live website (Squarespace, Wix, WordPress, etc.) into Make Studio blocks using a screenshot-based approach. This workflow is for sites where the source code is too messy to convert directly.

Read the process doc at `docs/capabilities/conversion/squarespace-refinement.md` for context.
Read the design guide at `docs/capabilities/design/guide.md` for theme token reference.
Read the conversion learnings at `docs/capabilities/conversion/learnings.md`.
Read the block checklist at `docs/capabilities/blocks/checklist.md`.

Read the current state from `.state/active.json` (if it exists and workflow is "convert-live"). If resuming, pick up from the current phase.

If starting fresh, create/overwrite `.state/active.json` with:

```json
{
  "workflow": "convert-live",
  "theme": "$ARGUMENTS",
  "startedAt": "<current ISO timestamp>",
  "sourceUrl": "",
  "currentPhase": 0,
  "phases": [
    { "name": "Gather inputs", "status": "pending" },
    { "name": "Build theme", "status": "pending" },
    { "name": "Split sections", "status": "pending" },
    { "name": "Generate blocks", "status": "pending" },
    { "name": "Extract content + images", "status": "pending" },
    { "name": "Assemble site", "status": "pending" },
    { "name": "Deploy + verify", "status": "pending" }
  ],
  "notes": ""
}
```

Update `.state/active.json` after each phase.

---

## Phase 1: Gather Inputs

Collect everything needed before building:

1. **Source URL** — Ask the user for the site URL. Take full-page Playwright screenshots of every page (1440px viewport, 2x device scale, scroll to trigger lazy images).

2. **Peek JSON** — Ask the user to run Peek (Chrome extension) on the source site and paste the JSON export. Request light filtering: remove obvious duplicates/hover states but keep anything that could be a distinct style.

3. **Font embed URL** — If the site uses custom fonts (Adobe Typekit, fonts.com, etc.), ask for the embed URL. Check the page source for `typekit.net`, `fonts.com`, or similar links.

4. **Site setup** — Ensure a Make Studio site exists with correct credentials in `.env`. Validate API permissions early: test that you can create a block, update a page, and deploy a preview.

Save all inputs to `themes/<name>/screenshots/` and `themes/<name>/source/`.

---

## Phase 2: Build Theme

Build `theme.json` from Peek data + screenshots using Claude's vision capabilities.

**DO NOT guess typography mappings abstractly.** Use this process:

1. Look at the full-page screenshot alongside the Peek JSON typography styles.
2. For each Peek style, find it visually in the screenshot. Note what role it plays:
   - Is it a large section heading? → heading tier
   - Is it body/paragraph text? → body tier
   - Is it a nav link, label, or small UI element? → heading-sm or body-sm
3. Sort headings by visual size: largest → `heading-xl`, next → `heading-lg`, etc.
4. Sort body text by size: largest → `body-lg`, next → `body-md`, smallest → `body-sm`.
5. Fill gaps if the source has fewer distinct sizes than our 5 heading + 3 body tiers.
6. For colors, look at the screenshot to determine which Peek color is `base` (background), `fg` (primary text), `brand` (accent), `panel` (card bg), etc.

**Verify by describing what you see:** Before writing theme.json, list each element you can see in the screenshot and state which Peek style + which theme tier it maps to. This forces explicit mapping rather than vague assumptions.

If custom fonts are needed, add the embed URL to the site's `customCode.head` via the API.

Sync the theme: `npm run sync -- --theme=<name> --apply --force`

---

## Phase 3: Split Sections

Screenshot each section of the source site individually.

```bash
npx tsx scripts/split-sections.ts --url=<url> --output=themes/<name>/screenshots/sections [--prefix=home]
```

Review the manifest output and the screenshots. For each section, decide:
- What type of block is this? (Hero, Features, CTA, Footer, etc.)
- What should it be named? (PascalCase: `HeroFilm`, `CrewGrid`, etc.)
- Should it be skipped? (e.g. cookie banners, empty spacers)

If the automatic splitting missed sections or split incorrectly, use `--prefix` per page and manually review.

---

## Phase 4: Generate Blocks

For each section screenshot, generate a block using the app's AI endpoint:

```bash
npx tsx scripts/generate-block-from-image.ts \
  --theme=<name> \
  --image=themes/<name>/screenshots/sections/<file>.png \
  --name=<BlockName> \
  [--prompt="additional instructions"]
```

After generating, sync all blocks: `npm run sync -- --theme=<name> --apply`

Render each block locally to verify: `npx tsx src/render-block.ts --theme=<name> --block=<BlockName> --full-page`

---

## Phase 5: Extract Content + Images

1. **Images** — Use Playwright to extract all image URLs from the source site. Upload to R2:
   ```typescript
   await client.uploadFilesFromUrls(siteId, images)
   ```

2. **Text content** — Use Playwright or WebFetch to extract text per section. Map to block field names.

3. **Prepare content JSON** — Create a content mapping per page:
   ```json
   {
     "BlockName": {
       "field-name": "value",
       "items-field": [{ "sub-field": "value" }]
     }
   }
   ```

---

## Phase 6: Assemble Site

1. Create `pages.json` with page names, layouts, and block assignments.
2. Run `npm run setup-pages -- --theme=<name>` to create/update pages.
3. Set content per page via `setPageContent` (body blocks only — never include Navbar/Footer).
4. **Always set block order before content.** Re-running `updatePage({ blocks })` after content orphans all field values.

---

## Phase 7: Deploy + Verify

1. Deploy preview: `await client.deployPreview(siteId)`
2. Screenshot each preview page.
3. **Compare section-by-section** against the original screenshots — don't just glance at the full page.
4. Check specifically:
   - Typography: Are fonts, weights, and sizes correct per element?
   - Spacing: Are gaps, padding, and margins matching?
   - Colors: Do backgrounds, text colors, and accents match?
   - Images: Are all images loading and correctly sized?
5. Present comparison to user and iterate.

---

## Notes

- The hide-all-but-one CSS injection approach for section splitting depends on the site having well-structured section elements. Squarespace, WordPress, and most modern platforms do.
- The app's generate-template endpoint sends the site's theme to the AI, so blocks automatically use the correct design tokens. **This is why getting the theme right first is critical.**
- Content population is the most manual step. Consider using Claude to map extracted text to field names if the mapping isn't obvious.
