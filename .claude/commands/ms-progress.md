---
description: Show current workflow progress and next steps.
allowed-tools: Read, Glob
---

Read .state/active.json. Display a progress summary.

If the file doesn't exist or is empty, say "No active job. Start one with /generate, /convert, /block, or /deploy."

If a job is active, display:

1. **Workflow** and **theme** name
2. A checklist of all phases with status indicators:
   - ✓ done
   - → in-progress (bold this line)
   - ○ pending
3. The **notes** field for context on where things left off
4. **Next action**: suggest what to do next based on the current phase

Example output:

```
## Convert: pirate-golf

✓ Analyze source HTML
✓ Create theme.json + Button partial
→ **Convert blocks** — Synced 6/8 blocks. Hero and Courses done, starting EpicFeatures.
○ Sync blocks to Make Studio
○ Setup pages + content
○ Upload images
○ Deploy + verify

**Next:** Continue converting blocks. EpicFeatures is next.
```
