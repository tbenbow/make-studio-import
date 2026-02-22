---
description: Convert a static website into Make Studio blocks. Pass the theme name as an argument.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, Task
---

Read the conversion guide at docs/capabilities/conversion/guide.md and the conversion learnings at docs/capabilities/conversion/learnings.md.

Read the current state from .state/active.json (if it exists and workflow is "convert").

If resuming an existing job for the same theme, pick up from the current phase. If starting fresh, create/overwrite .state/active.json with:

{
  "workflow": "convert",
  "theme": "$ARGUMENTS",
  "startedAt": "<current ISO timestamp>",
  "currentPhase": 0,
  "phases": [
    { "name": "Analyze source HTML", "status": "pending" },
    { "name": "Create theme.json + Button partial", "status": "pending" },
    { "name": "Convert blocks", "status": "pending" },
    { "name": "Sync blocks to Make Studio", "status": "pending" },
    { "name": "Setup pages + content", "status": "pending" },
    { "name": "Upload images", "status": "pending" },
    { "name": "Deploy + verify", "status": "pending" }
  ],
  "notes": ""
}

As you complete each phase, update .state/active.json:
- Set the completed phase's status to "done"
- Set the next phase's status to "in-progress"
- Advance currentPhase to the next phase index
- Update notes with context useful for resuming (what's done, what's next, any blockers)

Follow the guide's phases in order. After each major milestone, deploy a preview and verify.
