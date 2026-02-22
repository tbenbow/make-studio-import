---
description: Complete the current job. Write learnings, archive state, clean up.
allowed-tools: Read, Write, Edit, Glob, Grep
---

Read .state/active.json for current job context.

If no active job exists, say "No active job to complete."

Otherwise:

1. Read the appropriate learnings file for the workflow type:
   - generate → docs/capabilities/generation/learnings.md
   - convert → docs/capabilities/conversion/learnings.md
   - block → docs/capabilities/blocks/learnings.md (create if needed)
   - deploy → docs/capabilities/deployment/learnings.md

2. Read docs/review/pending.md for existing pending items.

3. **Summarize** what was accomplished in this job (phases completed, theme, key outcomes).

4. **Ask the user** what went well and what didn't, any learnings to capture.

5. **Write learnings** to the appropriate capability's learnings.md file.

6. **Add unresolved items** to docs/review/pending.md if any remain.

7. **Archive** the state file: copy .state/active.json to .state/history/{workflow}-{theme}-{timestamp}.json

8. **Clear** .state/active.json by deleting it or writing an empty object.

9. Confirm the job is complete and learnings are saved.
