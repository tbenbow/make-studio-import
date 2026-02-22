---
description: Deploy a preview of the current theme. Pass the theme name as an argument.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

Read the deployment guide at docs/capabilities/deployment/guide.md and the deployment learnings at docs/capabilities/deployment/learnings.md.

Read the current state from .state/active.json (if it exists).

Create/overwrite .state/active.json with:

{
  "workflow": "deploy",
  "theme": "$ARGUMENTS",
  "startedAt": "<current ISO timestamp>",
  "currentPhase": 0,
  "phases": [
    { "name": "Validate theme", "status": "pending" },
    { "name": "Sync blocks + partials", "status": "pending" },
    { "name": "Deploy preview", "status": "pending" },
    { "name": "Verify preview URL", "status": "pending" }
  ],
  "notes": ""
}

As you complete each phase, update .state/active.json:
- Set the completed phase's status to "done"
- Set the next phase's status to "in-progress"
- Advance currentPhase to the next phase index
- Update notes with the preview URL once deployed

Follow the deployment guide. Report the preview URL when done.
