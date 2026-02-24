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
    { "name": "Human feedback", "status": "pending" },
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

## Phase 4: Visual Iteration (up to 3 automated rounds)

Self-review loop — compare your own render to the source and fix obvious issues.

For each round:

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

5. **If the render looks good:** Proceed to Phase 5.

Stop automated iteration after 3 rounds — get human eyes on it.

## Phase 5: Human Feedback Loop

**This is the most important phase.** Present the work and ask for feedback. Repeat until approved.

1. Show the user the latest rendered screenshot alongside the source screenshot.
2. Share the preview URL so they can inspect in a browser.
3. Ask: "What needs fixing?" — be specific about what you think is good and what might be off.
4. **Wait for user feedback.** Do not proceed until they respond.
5. If the user gives feedback:
   - Fix the template/fields based on their notes
   - Run `block-screenshot.ts` again to re-render
   - Show the new screenshot and ask again
   - Repeat — there is no limit on human feedback rounds
6. If the user approves: proceed to Phase 6.

**Every piece of human feedback is a learning.** Pay attention to the *type* of feedback:
- If it's about spacing/sizing → future blocks should use similar values
- If it's about color accuracy → note the gap between what you extracted and what was right
- If it's about missing elements → note what you overlooked in analysis
- If it's about feel/vibe → hardest to codify, but note the pattern

## Phase 6: Finalize

1. **Write learnings** to `docs/capabilities/blocks/learnings.md` using this format:
   ```
   ## Block Name (YYYY-MM-DD)
   **Type**: ...  **Source**: ...  **Design**: ...
   **Iterations**: N automated + M human feedback rounds
   ### What Worked
   ### What Didn't
   ### Human Feedback Received
   - Round 1: "..." → fix applied: ...
   - Round 2: "..." → fix applied: ...
   ### Patterns Discovered
   ```
   **Include the human feedback verbatim.** This is the highest-signal data — it reveals gaps between what Claude sees and what a designer sees. Over time, these accumulate into better first-pass blocks.
2. **Update checklist** — if a new gotcha or rule emerged, add it to `docs/capabilities/blocks/checklist.md`.
3. **Update guide** — if the workflow itself changed (not just a block-specific issue), update `docs/capabilities/blocks/guide.md`.
4. Run `/ms-done` or archive state manually.

## Notes

- The script uses the Index page at `/` for previews — no slug setup needed.
- Each iteration screenshot is numbered (render-1.png, render-2.png, ...) so you can track progress.
- Iteration artifacts are in `themes/<theme>/iterations/<BlockName>/` (git-ignored).
