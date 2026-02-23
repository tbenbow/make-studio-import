# Workflow State Tracking

The agent workspace tracks active workflows using `.state/active.json` to enable resumable, multi-phase operations.

## Overview

When an agent starts a major workflow (generate, convert, block, deploy), it creates a state file that tracks:
- Current workflow type and theme
- Phase checklist with status
- Resume context in notes field
- Start timestamp

This enables:
1. **Resumability** — Pick up where you left off across sessions
2. **Progress visibility** — Visual progress bar in Cursor statusline
3. **Context preservation** — Notes field stores critical context for resuming
4. **History tracking** — Completed workflows are archived

## State File Format

```json
{
  "workflow": "generate|compose|convert|block|deploy",
  "theme": "theme-name",
  "startedAt": "2026-02-22T10:00:00Z",
  "currentPhase": 0,
  "phases": [
    { "name": "Phase 1", "status": "done" },
    { "name": "Phase 2", "status": "in-progress" },
    { "name": "Phase 3", "status": "pending" }
  ],
  "notes": "Context for resuming: what's done, what's next, blockers"
}
```

**Phase statuses**:
- `pending` — Not started yet
- `in-progress` — Currently working on this phase
- `done` — Completed successfully

## Workflow Types

### Generate Workflow

Creates a new site from a vibe prompt (4 HTML variations → pick one → convert to blocks).

**Phases**:
1. Generate 4 HTML variations
2. Screenshot + user selection
3. Extract design tokens
4. Convert blocks
5. Sync to Make Studio
6. Setup pages + content
7. Deploy + verify

**Slash command**: `/ms-generate <theme-name>`

### Convert Workflow

Converts an existing website into a Make Studio theme.

**Phases**:
1. Analyze source HTML
2. Create theme.json + Button partial
3. Convert blocks
4. Sync blocks to Make Studio
5. Setup pages + content
6. Upload images
7. Deploy + verify

**Slash command**: `/ms-convert <theme-name>`

### Compose Workflow

Composes a site from existing seed blocks + a vibe prompt.

**Phases**:
1. Fetch seed blocks + user prompt
2. Select blocks + generate theme
3. Source images
4. Create site + push blocks/theme
5. Populate content + deploy

**Slash command**: `/ms-compose <theme-name>`

### Block Workflow

Builds a single block from a screenshot using the block-ingress site.

**Phases**:
1. Analyze screenshot
2. Setup/update theme
3. Create block template + fields
4. Sync + preview
5. Iterate from feedback

**Slash command**: `/ms-block <block-name>`

### Deploy Workflow

Deploys a preview of a theme.

**Phases**:
1. Validate theme
2. Sync blocks + partials
3. Deploy preview
4. Verify preview URL

**Slash command**: `/ms-deploy <theme-name>`

## Updating State

As you work through phases, update the state file:

```typescript
import fs from 'fs'

const state = JSON.parse(fs.readFileSync('.state/active.json', 'utf-8'))

// Mark current phase as done
state.phases[state.currentPhase].status = 'done'

// Move to next phase
state.currentPhase++
if (state.currentPhase < state.phases.length) {
  state.phases[state.currentPhase].status = 'in-progress'
}

// Add context for resuming
state.notes = "Hero and Features synced. Starting CTA block next."

fs.writeFileSync('.state/active.json', JSON.stringify(state, null, 2))
```

## Checking Progress

Use `/ms-progress` to see current workflow status:

```
## Generate: make-studio

✓ Generate 4 HTML variations
→ **Screenshot + user selection** — 4 variations created, waiting for user pick
○ Extract design tokens
○ Convert blocks
○ Sync to Make Studio
○ Setup pages + content
○ Deploy + verify

**Next:** User needs to review v1-v4 screenshots and select preferred variation.
```

## Statusline Integration

The `.claude/statusline.sh` script reads `.state/active.json` and displays progress in the Cursor status bar:

```
generate make-studio ████░░░░░░ 4/7 │ Screenshot + user selection │ claude
```

Format: `workflow theme [progress-bar] done/total │ current-phase │ model`

## Completing Workflows

Use `/ms-done` when a workflow is complete:

1. Reads current state
2. Asks user for learnings
3. Writes learnings to appropriate `docs/capabilities/<workflow>/learnings.md`
4. Archives state to `.state/history/<workflow>-<theme>-<timestamp>.json`
5. Clears `.state/active.json`

## File Locations

```
.state/
  active.json              # Current workflow state
  history/                 # Archived workflow states
    generate-pirate-golf-20260221.json
    convert-okgosandbox-20260219.json
```

Both files are ignored in git (ephemeral, machine-local state).

## Best Practices

1. **Update frequently** — After each major step, update phase status and notes
2. **Detailed notes** — Write enough context in `notes` to resume from cold start
3. **Archive when done** — Use `/ms-done` to properly archive and document learnings
4. **Check before starting** — Read existing `.state/active.json` to avoid overwriting active work
5. **One workflow at a time** — Don't run concurrent workflows (state file is singular)

## Example: Complete Workflow Lifecycle

```bash
# 1. Start generation
/ms-generate pirate-golf

# State created: currentPhase=0, all phases pending

# 2. Agent generates 4 variations
# State updated: phase 0 done, phase 1 in-progress, notes="4 variations in source/"

# 3. User selects v2
# State updated: phase 1 done, phase 2 in-progress, notes="User picked v2"

# ... phases continue ...

# 7. Preview deployed successfully
# State updated: all phases done, notes="Preview URL: https://..."

# 8. Complete workflow
/ms-done

# State archived to history/, learnings written, active.json cleared
```

## Integration with Slash Commands

All major workflows automatically manage state:
- **Start**: `/ms-generate`, `/ms-compose`, `/ms-convert`, `/ms-block`, `/ms-deploy`
- **Check**: `/ms-progress`
- **Complete**: `/ms-done`

The agent reads state at the start of each command to determine whether to resume or start fresh.
