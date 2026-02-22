# Make Studio Agent Workspace

AI-powered workspace for building and managing Make Studio sites.

## Overview

This workspace enables AI agents to work with Make Studio through a structured set of capabilities:

- **Conversion** — Convert third-party websites into Make Studio themes
- **Generation** — Generate complete sites from vibe prompts
- **Blocks** — Build individual blocks from screenshots
- **Design** — Manage color tokens, typography, and theme configuration
- **Pages** — Create and manage pages, layouts, and post types
- **Deployment** — Preview deployments and manage snapshots

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API credentials
```

## Core Workflows

### Theme Sync (Primary Workflow)

Bi-directional sync between local theme files and Make Studio API:

```bash
# Push local changes to Make Studio
npm run sync -- --theme=<name> --apply

# Pull remote changes to local files
npm run pull -- --theme=<name>

# Validate local files
npm run validate -- --theme=<name>

# Check sync status
npm run status -- --theme=<name>

# Rollback to snapshot
npm run rollback -- --theme=<name> --snapshot=<file>
```

**Sync Options**:
- `--apply`: Apply changes (otherwise dry-run)
- `--force`: Skip confirmation prompts
- `--delete`: Allow deletions
- `--batch`: Use batch operations
- `--only=Block1,Block2,theme`: Sync specific components only

### Site Management

```bash
# Create new site
npm run create-site -- --name="Site Name"

# Setup pages and layouts from theme manifest
npm run setup-pages -- --theme=<name>
```

**Copy Site Between Environments**:

Use `scripts/copy-site.ts` to copy blocks, partials, theme, layouts, post types, and pages:

```bash
npx tsx scripts/copy-site.ts \
  --source-url=https://api.makestudio.cc \
  --source-token=xxx \
  --source-site=abc123 \
  --target-url=http://localhost:5001 \
  --target-token=yyy \
  [--target-site=def456] \
  [--name="My Site Copy"] \
  [--files]
```

Use `--files` to copy media library and rewrite CDN URLs.

## Environment Variables

```bash
MAKE_STUDIO_URL=https://api.makestudio.cc
MAKE_STUDIO_TOKEN=<per-site API token>
MAKE_STUDIO_SITE=<site ID>

# Optional: R2 credentials for media uploads
R2_ACCOUNT_ID=<cloudflare account ID>
R2_ACCESS_KEY_ID=<R2 access key>
R2_SECRET_ACCESS_KEY=<R2 secret>
```

## File Structure

```
themes/<name>/
  theme.json                    # Design system (fonts, colors, typography)
  .sync-state.json              # Last sync timestamp (auto-managed)
  converted/
    blocks/
      BlockName.html            # Handlebars template
      BlockName.json            # Field definitions
    partials/
      Button.html               # Shared components
  source/                       # Reference material (not in git)
  snapshots/                    # Pre-sync backups (not in git)

docs/
  capabilities/                 # Workflow guides + learnings
    conversion/
    generation/
    blocks/
    design/
    pages/
    deployment/
  references/                   # Gold-standard block examples
  guides/api-reference.md       # Complete API documentation
  review/pending.md             # Agent-to-human review queue

scripts/
  copy-site.ts                  # Cross-environment site copy
  setup-pirate-golf.ts          # Site-specific setup
  generate-image.ts             # AI image generation
  search-pexels.ts              # Pexels API integration
  archive/                      # One-off scripts (reference only)

src/
  index.ts                      # CLI entry point
  api.ts                        # Make Studio API client
  diff.ts                       # Changeset computation
  snapshot.ts                   # Snapshot management
  validate.ts                   # Local file validation
  fields.ts                     # Field transformations
```

## For AI Agents

Read `CLAUDE.md` first — it contains:
- All capabilities with guide links
- Critical guardrails (no MongoDB writes, no production deploys)
- Compound loop for documenting learnings
- Reference examples and API docs

### Agent Slash Commands

Available in `.claude/commands/`:
- `/ms-guide` — Show capability guide for current workflow
- `/ms-progress` — Show workflow progress and next steps
- `/ms-convert` — Start site conversion workflow
- `/ms-generate` — Generate site from vibe prompt
- `/ms-block` — Build individual block from screenshot
- `/ms-deploy` — Deploy preview
- `/ms-done` — Complete workflow and document learnings

## Active Themes

| Theme | Blocks | Status |
|-------|--------|--------|
| `oatmeal` | 76 | Complete |
| `block-ingress` | 58 | Active (block library) |
| `lta` | 56 | Complete |
| `stock` | 50 | Library |
| `okgosandbox` | 44 | Complete |
| `radiant` | 38 | Complete |
| `spotlight` | 26 | Complete |
| `peakperformance` | 18 | Complete |
| `pirate-golf` | 16 | In progress |
| `kyleeleonetti` | 16 | Complete |
| `bloomstudio` | 16 | Complete |

## Testing

```bash
npm test
```

Runs unit tests for field transformations and diff computation.

## Documentation

- **Main Reference**: `CLAUDE.md` (agent workspace overview)
- **Capability Guides**: `docs/capabilities/*/guide.md`
- **API Reference**: `docs/guides/api-reference.md`
- **Workflow State**: `docs/guides/workflow-state.md` (progress tracking system)
- **Block Examples**: `docs/references/` (Hero, Features, CTA, Footer, etc.)

## Guardrails

- **NEVER write directly to MongoDB** — Always use the Make Studio API
- **NEVER production deploy** — Use preview or create deployment requests
- **ALWAYS pull before push** — Enforced by sync engine
- **ALWAYS check `docs/review/pending.md`** for resolved items before starting work

## Contributing

After completing work, follow the compound loop:
1. Write learnings to `docs/capabilities/<name>/learnings.md`
2. Add questions to `docs/review/pending.md`
3. After human review, incorporate feedback into `guide.md`
