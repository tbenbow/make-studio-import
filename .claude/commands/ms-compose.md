---
description: Compose a site from existing seed blocks + a vibe prompt. Selects blocks, generates theme, sources images, populates content.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, Task
---

Read the compose guide at docs/capabilities/compose/guide.md and the compose learnings at docs/capabilities/compose/learnings.md.

Read the current state from .state/active.json (if it exists and workflow is "compose").

If resuming an existing job for the same theme, pick up from the current phase. If starting fresh, create/overwrite .state/active.json with:

{
  "workflow": "compose",
  "theme": "$ARGUMENTS",
  "startedAt": "<current ISO timestamp>",
  "currentPhase": 0,
  "phases": [
    { "name": "Fetch seed blocks + user prompt", "status": "pending" },
    { "name": "Select blocks + generate theme", "status": "pending" },
    { "name": "Source images", "status": "pending" },
    { "name": "Create site + push blocks/theme", "status": "pending" },
    { "name": "Populate content + deploy", "status": "pending" }
  ],
  "notes": ""
}

As you complete each phase, update .state/active.json:
- Set the completed phase's status to "done"
- Set the next phase's status to "in-progress"
- Advance currentPhase to the next phase index
- Update notes with context useful for resuming (what's done, what's next, any blockers)

In Phase 1, build a block catalog from each block's `aiDescription`, `tags`, and field summaries (image fields, repeater fields). This catalog is what you pass to the model in Phase 2 for block selection — do NOT pick blocks from memory.

In Phase 2, use the block catalog + the user's vibe prompt to select blocks. Each `aiDescription` includes "choose this over X when..." guidance. Let the catalog inform your selection reasoning.

Follow the guide's phases in order. After each major milestone, deploy a preview and verify.
