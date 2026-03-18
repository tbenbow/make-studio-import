# Onboarding Capability

Provides dev-time data — recipes, themes, curated block metadata — for the chat-based onboarding flow. The main app handles runtime (chat UI, AI conversation, site creation). This project delivers the data that makes onboarding fast, cheap, and high quality.

## Data Contract

The onboarding chat produces a structured profile:

```json
{
  "category": "service-provider",
  "needs": ["gallery", "contact-form"],
  "themeId": "warm-premium",
  "businessName": "Summit Hardscaping",
  "whatYouDo": "Custom hardscaping — patios, retaining walls, outdoor kitchens",
  "whoItsFor": "Homeowners in the Denver metro area",
  "cta": "Get a free estimate",
  "differentiator": "15 years experience, all work done in-house"
}
```

- `category` — recipe ID (`empty`, `service-provider`, `portfolio`, `local-business`, `about`, `contact`)
- `needs` — from fixed vocabulary: `gallery`, `contact-form`, `pricing`, `team`, `faq`, `location`, `blog`, `menu`, `hours`, `booking`
- `themeId` — selected from theme library
- Business context fields — used for AI copy generation

## Data Files

- `data/recipes.json` — all recipe definitions (single file, keyed by recipe ID)
- `data/themeLibrary.json` — theme library (array of theme entries)
- `data/blocks.json` — block library manifest (metadata only)

## Recipe Format

```json
{
  "recipe-id": {
    "label": "Display Name",
    "description": "What this recipe is for",
    "buildPage": true,
    "slots": [
      { "role": "hero", "blockName": null, "blockTag": "hero" },
      { "role": "features", "blockName": "Features Grid", "blockTag": "features" }
    ],
    "extras": {
      "gallery": { "role": "gallery", "blockName": "Logo Cloud", "blockTag": "logos" }
    }
  }
}
```

### Resolution Rules

1. Start with `slots` — always included, in order
2. For each `needs` value, find matching key in `extras`
3. Insert matched extras before the last slot (CTA is conventionally last)
4. For each slot: `blockName` set → exact name lookup; `blockName: null` → AI picks by `blockTag`

### Three Contexts

| Context | Recipe | Theme | Page |
|---------|--------|-------|------|
| Onboarding wizard | By `category` + `needs` | Applied from theme library | Built with generated content |
| Onboarding empty | `"empty"` recipe | Default theme | No page built |
| Page generation | By page type (about, contact) | Already exists on site | Built with generated content |

## Hero Selection (Special Case)

Hero slots have `blockName: null`. System queries all hero blocks, sends metadata to AI, AI picks best hero + returns `styleConfig`.

## Theme Selection

Themes wrap the full server-schema `theme.json` with metadata (`id`, `name`, `vibe`). Selected by `id` from chat's `themeId`. Brand color swapped at runtime.

## Sync to Make Studio

```bash
npx tsx scripts/sync-onboarding-data.ts [--target=../make-studio/server/data/] [--dry-run]
```

Syncs `recipes.json`, `themeLibrary.json`, and `blocks.json` to the make-studio repo.

## Review Workflow

Use `/ms-onboarding-review` to distill feedback from generated sites into guidebook entries and recipe updates.

## Related

- `docs/capabilities/onboarding/guidebook.md` — block selection heuristics
- `docs/capabilities/compose/guide.md` — compose workflow (upstream)
- `docs/capabilities/compose/learnings.md` — compose learnings
- `../make-studio/docs/ai/ONBOARDING_CHAT_DESIGN.md` — full design doc
