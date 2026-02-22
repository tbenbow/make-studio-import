---
description: Generate a new site from a vibe prompt. Creates 4 HTML variations, user picks one, then converts to Make Studio blocks.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, Task
---

Read the generation guide at docs/capabilities/generation/guide.md and the generation learnings at docs/capabilities/generation/learnings.md.

Read the current state from .state/active.json (if it exists and workflow is "generate").

If resuming an existing job for the same theme, pick up from the current phase. If starting fresh, create/overwrite .state/active.json with:

{
  "workflow": "generate",
  "theme": "$ARGUMENTS",
  "startedAt": "<current ISO timestamp>",
  "currentPhase": 0,
  "phases": [
    { "name": "Generate 4 HTML variations", "status": "pending" },
    { "name": "Screenshot + user selection", "status": "pending" },
    { "name": "Extract design tokens", "status": "pending" },
    { "name": "Convert blocks", "status": "pending" },
    { "name": "Sync to Make Studio", "status": "pending" },
    { "name": "Setup pages + content", "status": "pending" },
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
