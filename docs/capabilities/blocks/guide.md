# Image-to-Block Capability

Build Make Studio blocks from screenshots. Provide a screenshot, we extract the design, build the theme layer, create the block, sync it, and iterate.

## Dedicated Site

All block ingress work uses a dedicated site to avoid polluting production themes.

- **Site name**: Block Ingress
- **Theme directory**: `themes/block-ingress/`
- **Credentials**: Set in `.env` when working on blocks (swap back for other sites)

## Workflow

### Step 1: Theme Setup

Analyze the screenshot for design tokens:

1. **Colors** — Extract background, text, accent, and border colors. Map to `systemColors` (brand, on-brand, base, base-muted, base-alt, panel, fg, fg-muted, fg-alt, border). Extras go in `customColors`.
2. **Fonts** — Identify heading and body typefaces, weights used. Add to `fonts` array.
3. **Typography scale** — Measure or estimate heading sizes (xl through xs) and body sizes (lg, md, sm). Fill `headingTypography` and `bodyTypography`.
4. **Buttons** — Determine font, weight, padding, radius, and variant colors. All four variants (primary, secondary, outline, ghost) must be defined even if unused.

Write `themes/block-ingress/theme.json` with the extracted values.

```bash
npm run sync -- --theme=block-ingress --apply --only=theme
```

### Step 2: Block Creation

Build the `.html` and `.json` files from the screenshot:

1. **Reference patterns** — Check `docs/references/` for gold-standard examples of the block type (Hero, Features, Stats, Navbar, Footer, CTA, Testimonial).
2. **Template** — Write Handlebars template using Tailwind utility classes. Use `{{> Button}}` for buttons, `{{default field 'fallback'}}` for text fields, `{{#each items}}` for repeating content.
3. **Fields** — Define field types in the `.json` file. Remember: items sub-fields go in `config.fields`, not top level.
4. **Sync** — Push just the block:

```bash
npm run sync -- --theme=block-ingress --apply --only=BlockName
```

### Step 3: Visual Iteration (screenshot pipeline)

Use `block-screenshot.ts` for automated screenshot comparison:

```bash
npx tsx scripts/block-screenshot.ts --theme=block-ingress --block=BlockName
```

This syncs the block, deploys a preview, and captures a Playwright screenshot to `themes/block-ingress/iterations/BlockName/render-N.png`. Compare the rendered screenshot to the source screenshot and fix issues. Repeat up to 3 rounds.

Key details:
- Uses the Index page at `/` (always exists, reliable URL)
- Use **inline styles** for colors/backgrounds — Tailwind classes get overridden by the site theme
- Block description must be **≤30 characters**
- ~15 seconds per round-trip

For manual sync (without the screenshot pipeline):
```bash
npm run sync -- --theme=block-ingress --apply --only=BlockName
```

### Step 4: Completion (compound loop)

When the user approves the block:

1. **Write learnings** to `docs/capabilities/blocks/learnings.md` — focus on surprises and time-savers.
2. **Update checklist** at `docs/capabilities/blocks/checklist.md` if a new rule or gotcha emerged.
3. **Update this guide** if the workflow itself changed.
4. The block files remain in `themes/block-ingress/converted/blocks/` for reference.

## Theme Swap Strategy

Since different screenshots have different design languages, we overwrite `theme.json` per block (or per design system). This works because the ingress site is dedicated — no other blocks depend on the current theme state.

If testing multiple blocks from the same design system, keep the theme stable and just add new blocks.

## Key References

- `docs/references/` — Gold-standard block examples
- `docs/capabilities/design/guide.md` — Color tokens, typography tiers
- `docs/capabilities/conversion/guide.md` — Full conversion workflow (useful patterns)
- `docs/capabilities/blocks/checklist.md` — Quick-reference checklist
