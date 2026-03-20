# Direct Site Generation — Exploration Results

## Summary

We explored and built three approaches to generating Make Studio sites via Claude API, eliminating the need for Claude Code running locally. The **hybrid approach** is the winner: Claude generates bespoke creative blocks (hero, features), library provides commodity blocks (navbar, testimonials, CTA, footer), and a deterministic theme builder handles design tokens.

**Final performance: ~2 minutes, ~1.4K Claude tokens per site.**

## Three Generation Modes

All three modes are live on `make-studio` branch `feat/direct-generation`, triggered via `POST /page-generation/sites/:siteId/generate-page` with `mode` parameter.

### Mode: `recipe` (existing, default)
- Selects blocks from site's block library
- GPT generates content to fill them
- Fast (~30s) but limited to pre-built blocks
- No bespoke design

### Mode: `direct`
- Claude generates full-page Tailwind HTML
- Splits into sections, converts each to a block
- Builds theme from the HTML
- **~2-3 min, ~51K tokens** — too expensive for production
- Best quality — every block is unique

### Mode: `hybrid` (recommended)
- Claude generates hero + features (creative blocks)
- Library provides navbar, testimonials, CTA, footer (commodity blocks)
- Deterministic theme builder (no LLM)
- GPT generates content for library blocks
- **~2 min, ~1.4K Claude tokens** — production viable

## Architecture

```
Onboarding chat (2 questions, business context only)
  ↓
Design brief (Claude Sonnet, ~15s)
  ↓
┌─────────────────────────────────────┐
│ In parallel:                         │
│  • Hero HTML generation (Claude)     │
│  • Features HTML generation (Claude) │
│  • Hero → block conversion (Claude)  │
│  • Features → block conversion       │
│  • Theme build (deterministic, 0ms)  │
│  • Image fetch (Pexels, ~7s)         │
└─────────────────────────────────────┘
  ↓ (~70s wall clock)
Library block selection (GPT-4.1-mini, ~2s)
  ↓
Content generation for library blocks (GPT-4.1-mini, ~25s)
  ↓
Page assembly (instant)
```

## Key Findings

### Prompt specificity > model choice
The quality difference between Sonnet and Opus was marginal. What made a dramatic difference was how specific the aesthetic direction was. A detailed vibe brief (exact fonts, colors, named effects, section concepts) produced results comparable to local Claude Code generation.

### The frontend-design skill is portable
Claude Code's frontend-design skill is ~40 lines of markdown that pushes for bold aesthetics and bans generic output. It's fully portable to API system prompts.

### Theme building doesn't need an LLM
Typography scales, prose config, button sizes — all static templates. Only font names and color hex values change. The deterministic builder is instant, free, and guaranteed correct (no schema mismatches).

### Block conversions must run in parallel
Serial: 3.5 minutes for 10 blocks. Parallel: 23 seconds. Each additional parallel block adds ~0-5s wall clock time.

### Content must live in two places
Page blocks render from `pageBlock.content`, the editor sidebar reads from the same. The `page.content` top-level map is also needed. Both must be populated or the editor shows empty fields.

### Design brief library eliminates 15s per generation
Briefs converge on predictable archetypes per business type. Pre-curated briefs (extracted from real websites via screenshot + Claude vision) provide more consistent quality and save the brief generation step entirely.

## Performance Evolution

| Approach | Time | Claude Tokens | Total Tokens |
|----------|------|--------------|--------------|
| Full direct (serial) | 10.2 min | 95K | 95K |
| Full direct (parallel) | 3.4 min | 51K | 51K |
| Hybrid (1 block) | 2.1 min | ~1.4K | ~1.4K + GPT |
| Hybrid (2 blocks) | 1.9 min | ~1.4K | ~1.4K + GPT |
| Hybrid + pre-baked brief | ~1.5 min (est) | ~0.8K | ~0.8K + GPT |

## Design Brief Extraction Tooling

### `scripts/extract-brief-from-url.ts`
Screenshots a website with Playwright, sends to Claude vision to extract aesthetic direction, font recommendations (Google Fonts only, no Inter/Roboto), color palette, effects, and vibe tags.

```bash
npx tsx scripts/extract-brief-from-url.ts --url=https://stripe.com
npx tsx scripts/extract-brief-from-url.ts --urls=urls.txt --out=briefs/
```

### `scripts/briefs-to-theme-library.ts`
Converts extracted briefs into Make Studio theme objects (deterministic) and either writes a library JSON file, applies directly to a site, or imports to the theme library via MongoDB.

```bash
npx tsx scripts/briefs-to-theme-library.ts --briefs=output/briefs-v2 --import
npx tsx scripts/briefs-to-theme-library.ts --brief=output/briefs/stripe.json --apply
```

## Extending Generated Sections

To add more Claude-generated sections, edit `GENERATED_SECTION_TYPES` in `hybridGeneration.ts`:

```typescript
const GENERATED_SECTION_TYPES = ['hero', 'features'] // add more here
```

Add a corresponding prompt in `sectionGenerator.ts` `SECTION_PROMPTS` for best results. Sections generate in parallel — each additional section adds ~0-5s.

## Files

### make-studio (branch: feat/direct-generation)

```
server/services/directGeneration/
  index.ts              — Full direct generation orchestrator
  hybridGeneration.ts   — Hybrid: Claude creative blocks + library blocks
  designBrief.ts        — Claude generates aesthetic brief from intake
  sectionGenerator.ts   — Claude generates individual section HTML
  htmlGenerator.ts      — Claude generates full-page HTML (direct mode)
  htmlParser.ts         — Splits HTML into sections, extracts fonts/colors
  blockConverter.ts     — Claude converts HTML section → Handlebars + fields
  themeBuilder.ts       — Deterministic theme construction (no LLM)
  logger.ts             — Structured run logging with artifacts

server/routes/pageGeneration.ts  — Routes hybrid/direct/recipe by mode
server/types/pageGeneration.ts   — Added mode + businessName to request
server/services/onboarding/chatPrompt.ts  — Simplified to 2 questions
client/src/features/onboarding/OnboardingChatView.tsx  — Uses hybrid mode
```

### make-studio-importer

```
scripts/test-generation.ts        — Full-page HTML generation test
scripts/test-convert.ts           — HTML → block conversion test
scripts/test-hero-only.ts         — Single-section speed benchmark
scripts/extract-brief-from-url.ts — Screenshot → design brief extraction
scripts/briefs-to-theme-library.ts — Brief → theme library converter
docs/exploration/                  — This document
```

## Next Steps

1. **Build brief library** — Extract 20-30 briefs from curated sites, review font pairings, tag by business type
2. **Replace brief generation with library lookup** — Match intake to pre-baked brief, eliminate 15s
3. **Improve hero quality** — Iterate on the section generator prompt, add more effects
4. **Add more generated sections** — Pricing, gallery, team sections could benefit from bespoke generation
5. **Upload flow** — Accept user-uploaded index.html, run through the conversion pipeline
6. **Speed optimization** — Pre-warm library selection during parallel build, stream content to editor
