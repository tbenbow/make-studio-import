---
description: Show available workflows and how to get started.
allowed-tools: Read
---

Display the following help text:

---

## Make Studio Workflows

| Command | What it does |
|---------|-------------|
| `/ms-generate <theme>` | Generate a site from a vibe prompt — 4 HTML variations, pick one, convert to blocks |
| `/ms-compose <theme>` | Compose a site from existing seed blocks + a vibe prompt — faster than generate |
| `/ms-convert <theme>` | Convert a static website into Make Studio blocks |
| `/ms-block <name>` | Build a single block from a screenshot |
| `/ms-deploy <theme>` | Sync and deploy a preview |
| `/ms-progress` | Show current workflow progress and next steps |
| `/ms-done` | Complete the current job, write learnings, archive state |

### Quick start

1. **New site from scratch:** `/ms-generate my-site-name` then describe what you want
2. **New site from seed blocks:** `/ms-compose my-site-name` then describe what you want (faster than generate)
3. **Convert an existing site:** Put source HTML in `themes/<name>/source/`, then `/ms-convert <name>`
4. **Build one block:** `/ms-block block-ingress` then share a screenshot
5. **Check where you left off:** `/ms-progress`

### How it works

Each workflow tracks progress in `.state/active.json`. The statusline shows a live progress bar. If a session ends mid-workflow, just run the same command again — it picks up where you left off.

---
