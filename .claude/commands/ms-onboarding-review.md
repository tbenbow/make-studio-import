---
description: Review an onboarding-generated site and distill feedback into guidebook entries and recipe updates.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, Task
---

Read the onboarding guidebook at `docs/capabilities/onboarding/guidebook.md` and the onboarding guide at `docs/capabilities/onboarding/guide.md`.

Read the current recipes from `data/recipes/` and the block library at `data/blocks.json`.

## Review Flow

1. **Examine the generated site** — review the deployed preview URL (if provided) or the compose config / page content. Identify:
   - Which blocks were selected and in what order
   - Whether the layout matches the recipe + needs
   - Content quality and relevance to the business context
   - Visual hierarchy and section flow

2. **Critique** — discuss with the user:
   - Are the block choices appropriate for this business type?
   - Is the section ordering effective? (hero → features → social proof → CTA)
   - Are any sections missing that would help this specific business?
   - Are any sections unnecessary or redundant?
   - Does the hero style match the business vibe?

3. **Distill feedback** — based on the review:
   - Add new heuristics to `docs/capabilities/onboarding/guidebook.md`
   - If a recipe slot mapping proved wrong, suggest updates to the recipe JSON
   - If a block's `aiDescription` was misleading, suggest updates to `data/blocks.json`
   - If a theme didn't fit, note which vibe keywords should change

4. **Optionally update data files** — with user approval:
   - Edit guidebook with new patterns
   - Update recipe conditional slots or block references
   - Improve block metadata (descriptions, tags, aiDescriptions)

Always frame feedback as specific, actionable changes to the data files — not abstract observations.
