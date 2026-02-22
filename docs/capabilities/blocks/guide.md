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

### Step 3: Preview & Iterate

1. Preview the site to see the block rendered.
2. User compares the preview to the original screenshot.
3. User provides feedback — adjust spacing, colors, layout, typography.
4. Re-sync and preview again.

```bash
npm run sync -- --theme=block-ingress --apply --only=BlockName
```

### Step 4: Completion

When the user approves the block:

1. Write learnings to `docs/capabilities/blocks/learnings.md`.
2. If the block reveals a new pattern, update `docs/capabilities/blocks/checklist.md`.
3. The block files remain in `themes/block-ingress/converted/blocks/` for reference.

## Theme Swap Strategy

Since different screenshots have different design languages, we overwrite `theme.json` per block (or per design system). This works because the ingress site is dedicated — no other blocks depend on the current theme state.

If testing multiple blocks from the same design system, keep the theme stable and just add new blocks.

## Key References

- `docs/references/` — Gold-standard block examples
- `docs/capabilities/design/guide.md` — Color tokens, typography tiers
- `docs/capabilities/conversion/guide.md` — Full conversion workflow (useful patterns)
- `docs/capabilities/blocks/checklist.md` — Quick-reference checklist
