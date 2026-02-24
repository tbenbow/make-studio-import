---
description: Build a single block from a screenshot using the block ingress workflow.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, Task
---

Build a single block from a screenshot with visual iteration.

## Setup

Read these files before starting (compound loop — past learnings prevent repeat mistakes):
1. `docs/capabilities/blocks/learnings.md` — past block builds, what worked, what didn't
2. `docs/capabilities/blocks/checklist.md` — quick-reference rules
3. `docs/capabilities/blocks/guide.md` — canonical workflow
4. Reference examples in `docs/references/` for the relevant block type

Read the current state from `.state/active.json` (if it exists and workflow is "block"). If resuming, pick up from the current phase. If starting fresh, create/overwrite `.state/active.json` with:

```json
{
  "workflow": "block",
  "theme": "$ARGUMENTS",
  "startedAt": "<current ISO timestamp>",
  "currentPhase": 0,
  "phases": [
    { "name": "Analyze screenshot", "status": "pending" },
    { "name": "Extract theme tokens", "status": "pending" },
    { "name": "Create block template + fields", "status": "pending" },
    { "name": "Visual iteration", "status": "pending" },
    { "name": "Finalize", "status": "pending" }
  ],
  "notes": ""
}
```

Update `.state/active.json` after each phase: set completed phase to "done", next to "in-progress", advance `currentPhase`, update `notes`.

## Phase 1: Analyze Screenshot

Read the source screenshot image. Identify:
- Block type (Hero, Features, CTA, Stats, Testimonial, Footer, Navbar, etc.)
- Layout structure (columns, alignment, stacking)
- Colors (backgrounds, text, accents)
- Typography (heading sizes, body text, weights)
- Spacing patterns (padding, gaps)
- Interactive elements (buttons, links, icons)
- Any images or decorative elements

Copy the source screenshot to `themes/<theme>/iterations/<BlockName>/source.png`.

## Phase 2: Extract Theme Tokens

Based on the analysis, write/update `themes/<theme>/theme.json` with:
- Color palette (primary, secondary, accent, neutral shades)
- Font families, weights
- Typography scale

Sync theme via the block-screenshot script (it handles theme sync automatically).

## Phase 3: Create Block Template + Fields

Write the block files following reference patterns in `docs/references/`:
- `themes/<theme>/converted/blocks/<BlockName>.html` — Handlebars template
- `themes/<theme>/converted/blocks/<BlockName>.json` — Field definitions with defaults

Include realistic default content that matches the source design. Use the Button partial (`{{> Button}}`) if the block has buttons.

## Phase 4: Visual Iteration (up to 3 rounds)

This is the core feedback loop. For each round:

1. **Screenshot the rendered block:**
   ```bash
   npx tsx scripts/block-screenshot.ts --theme=<theme> --block=<BlockName>
   ```
   This syncs the block, deploys a preview, and captures a screenshot to `themes/<theme>/iterations/<BlockName>/render-<N>.png`.

2. **Read the rendered screenshot** (the script prints the path).

3. **Compare against the source screenshot** (`themes/<theme>/iterations/<BlockName>/source.png`). Check:
   - Layout accuracy — columns, alignment, element positioning
   - Spacing — padding, margins, gaps between elements
   - Colors — backgrounds, text colors, accent colors
   - Typography — font sizes, weights, line heights
   - Missing elements — buttons, icons, images, decorative elements
   - Content fidelity — text matches the source design intent

4. **If issues found:** Fix the template (`.html`) and/or fields (`.json`), then repeat from step 1.

5. **If the render matches well enough:** Proceed to Phase 5.

Stop iterating after 3 rounds maximum, even if imperfect — diminishing returns.

## Phase 5: Finalize

1. Deploy final preview and share the preview URL with the user for approval.
2. **Write learnings** to `docs/capabilities/blocks/learnings.md` using this format:
   ```
   ## Block Name (YYYY-MM-DD)
   **Type**: ...  **Source**: ...  **Design**: ...  **Iterations**: N
   ### What Worked
   ### What Didn't
   ### Patterns Discovered
   ```
   Focus on surprises — things that would save time next time. Skip the obvious.
3. **Update checklist** — if a new gotcha or rule emerged, add it to `docs/capabilities/blocks/checklist.md`.
4. **Update guide** — if the workflow itself changed (not just a block-specific issue), update `docs/capabilities/blocks/guide.md`.
5. Run `/ms-done` or archive state manually.

## Notes

- The block-ingress site (ID `699a31ac451f939b5bab64d2`) is the dedicated sandbox for this workflow. Ensure `.env` is pointed at it.
- The script creates a "Scratch" page automatically — no manual page setup needed.
- Each iteration screenshot is numbered (render-1.png, render-2.png, render-3.png) so you can track progress.
