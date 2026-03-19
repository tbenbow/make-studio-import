# Onboarding Learnings

Accumulated insights from building onboarding data (recipes, themes, block library). Read this before modifying onboarding data.

---

## Initial Data Build (2026-03-18)

**Goal**: Build the complete onboarding data layer — recipes, theme library, block library with metadata — matching the revised spec from make-studio's ONBOARDING_CHAT_DESIGN.md.

### What Worked

- **Template analysis for metadata** — Reading the actual Handlebars templates and CSS classes from the API was far more reliable than screenshots for writing `aiDescription` and `tags`. CSS classes like `grid-cols-3`, `aspect-[3/2]`, `bg-brand` tell you exactly what a block does.
- **Parallel agent analysis** — Splitting 101 blocks into 3 category groups (heroes, features, everything else) and analyzing in parallel cut the metadata writing time significantly.
- **Sync script with cross-reference validation** — Catching broken recipe→block references at validation time instead of at runtime. The `--dry-run` flag proved useful for iterating on data without touching the target repo.
- **Single-file format for recipes and themes** — `recipes.json` (keyed object) and `themeLibrary.json` (array) are simpler to manage than directories of separate files. Matches the make-studio server expectations.

### What Didn't

- **Started from wrong block set** — Initially built blocks.json from local block-ingress theme files (~72 blocks with spaces in names like "Features Grid"). The actual seed site (69ae41bd212dd9e93c104e55) has 101 different blocks with PascalCase names like "FeatureSimpleGrid". Cost a full rewrite of both blocks.json and recipes.json.
- **Local Playwright rendering failed** — The seed site uses a dark theme, so locally rendered blocks were invisible (white text on dark bg). Many blocks also failed with Handlebars errors ("options.inverse is not a function") due to missing helper registrations. Reading templates directly was the better path.
- **Recipe spec changed mid-build** — The original plan used `baseSlots`/`conditionalSlots` with `required`/`after` fields. The revised make-studio spec uses `slots`/`extras` with `buildPage` and insertion before the last slot. Had to rewrite the format, sync script validation, and docs.

### Patterns Discovered

- **Always check the seed site API first** — Local theme files may be stale or from a different block set. The seed site is the source of truth for block names and availability.
- **Block naming on seed site is PascalCase** — `FeatureSimpleGrid`, `CtaBrandBg`, `TestimonialCentered`. Old block-ingress blocks used spaces. Recipes must use the exact names from the seed site.
- **Header* blocks are hero-category** — `HeaderSimple`, `HeaderBgImage`, `HeaderCards`, `HeaderStats` are categorized as `hero` on the seed site. They're simpler than full heroes (no CTAs) but serve as page headers for interior pages.
- **Incentive* blocks are features-category** — 8 Incentive variants (Banner, Card, Centered, Divided, FourCol, SplitHero, ThreeCol, TwoColGrid) are categorized as `features`. They're benefit/perk focused vs feature/capability focused.
- **Gallery category is all Product* blocks** — 16 blocks covering product listings, details, features, and overviews. Used for gallery/menu/portfolio needs in recipes.
- **The seed site has 5 metadata fields populated** — Only navbars and footers had `aiDescription` and `tags` on the API. Everything else needed to be written from scratch. The `blockCategory` was already set on 96/101 blocks.
