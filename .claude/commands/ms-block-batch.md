---
description: Batch-convert a folder of screenshots into Make Studio blocks.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, Task
---

Batch-convert a folder of screenshots into Make Studio blocks with visual iteration.

## Usage

```
/ms-block-batch ./path/to/screenshots
```

The argument `$ARGUMENTS` is the path to a directory containing screenshot images (`.png`, `.jpg`, `.jpeg`, `.webp`).

## Setup

Read these files before starting (compound loop — past learnings prevent repeat mistakes):
1. `docs/capabilities/blocks/learnings.md` — past block builds, what worked, what didn't
2. `docs/capabilities/blocks/checklist.md` — quick-reference rules
3. `docs/capabilities/blocks/guide.md` — canonical workflow
4. Reference examples in `docs/references/` for the relevant block types

Determine the theme name. If `.state/active.json` exists with a theme, use it. Otherwise default to `block-ingress`.

Create/overwrite `.state/active.json`:

```json
{
  "workflow": "block-batch",
  "theme": "<theme>",
  "inputDir": "$ARGUMENTS",
  "startedAt": "<current ISO timestamp>",
  "currentPhase": 0,
  "phases": [
    { "name": "Scan input directory", "status": "pending" },
    { "name": "Establish theme", "status": "pending" },
    { "name": "Process blocks", "status": "pending" },
    { "name": "Final deploy + report", "status": "pending" }
  ],
  "blocks": [],
  "notes": ""
}
```

## Phase 1: Scan Input Directory

List all image files in the input directory. For each file:
- Derive a block name from the filename: `hero-section.png` → `HeroSection`, `features_grid.jpg` → `FeaturesGrid`
- Strip extensions, convert to PascalCase

Record the mapping in `.state/active.json` blocks array:
```json
"blocks": [
  { "file": "hero-section.png", "name": "HeroSection", "status": "pending" },
  { "file": "features-grid.png", "name": "FeaturesGrid", "status": "pending" }
]
```

## Phase 2: Establish Theme

Analyze the first screenshot to establish the design system:
- Extract colors, typography, spacing patterns
- Write `themes/<theme>/theme.json`
- Sync theme to Make Studio (the block-screenshot script handles this)

This theme applies to all blocks in the batch.

## Phase 3: Process Each Block

For each block in the manifest:

1. **Analyze** — Read the source screenshot, identify block type and structure
2. **Create** — Write `<BlockName>.html` + `<BlockName>.json` to `themes/<theme>/converted/blocks/`
3. **Copy source** — Copy screenshot to `themes/<theme>/iterations/<BlockName>/source.png`
4. **Iterate** (up to 2 rounds per block in batch mode):
   ```bash
   npx tsx scripts/block-screenshot.ts --theme=<theme> --block=<BlockName>
   ```
   Read the rendered screenshot, compare to source, fix if needed.
5. **Record result** — Update the block's status in `.state/active.json` to "done"

Skip the theme phase for blocks after the first (theme is already synced).

## Phase 4: Final Deploy + Report

1. Deploy final preview with all blocks.
2. Print a summary report:

```
Batch Complete: <N> blocks processed

| Block | Iterations | Status |
|-------|-----------|--------|
| HeroSection | 2 | ✓ |
| FeaturesGrid | 1 | ✓ |
| ... | ... | ... |

Preview: <preview URL>
```

3. Share the preview URL with the user.
4. Write learnings to `docs/capabilities/blocks/learnings.md`.

## Notes

- In batch mode, limit iterations to 2 per block (vs 3 in single-block mode) to keep total time reasonable.
- Process blocks sequentially — each one shares the same Scratch page.
- If a block fails to render, log the error and continue with the next block.
