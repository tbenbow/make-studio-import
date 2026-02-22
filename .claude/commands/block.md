---
description: Build a single block from a screenshot using the block ingress workflow.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, Task
---

Read the blocks guide at docs/capabilities/blocks/guide.md.

Read the current state from .state/active.json (if it exists and workflow is "block").

If resuming an existing job, pick up from the current phase. If starting fresh, create/overwrite .state/active.json with:

{
  "workflow": "block",
  "theme": "$ARGUMENTS",
  "startedAt": "<current ISO timestamp>",
  "currentPhase": 0,
  "phases": [
    { "name": "Analyze screenshot", "status": "pending" },
    { "name": "Setup/update theme", "status": "pending" },
    { "name": "Create block template + fields", "status": "pending" },
    { "name": "Sync + preview", "status": "pending" },
    { "name": "Iterate from feedback", "status": "pending" }
  ],
  "notes": ""
}

As you complete each phase, update .state/active.json:
- Set the completed phase's status to "done"
- Set the next phase's status to "in-progress"
- Advance currentPhase to the next phase index
- Update notes with context useful for resuming (what's done, what's next, any blockers)

Follow the guide's phases in order. After syncing, deploy a preview and share the URL for feedback.
