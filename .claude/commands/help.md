---
description: Show available workflows and how to get started.
allowed-tools: Read
---

Display the following help text:

---

## Make Studio Workflows

| Command | What it does |
|---------|-------------|
| `/generate <theme>` | Generate a site from a vibe prompt — 4 HTML variations, pick one, convert to blocks |
| `/convert <theme>` | Convert a static website into Make Studio blocks |
| `/block <name>` | Build a single block from a screenshot |
| `/deploy <theme>` | Sync and deploy a preview |
| `/progress` | Show current workflow progress and next steps |
| `/done` | Complete the current job, write learnings, archive state |

### Quick start

1. **New site from scratch:** `/generate my-site-name` then describe what you want
2. **Convert an existing site:** Put source HTML in `themes/<name>/source/`, then `/convert <name>`
3. **Build one block:** `/block block-ingress` then share a screenshot
4. **Check where you left off:** `/progress`

### How it works

Each workflow tracks progress in `.state/active.json`. The statusline shows a live progress bar. If a session ends mid-workflow, just run the same command again — it picks up where you left off.

---
