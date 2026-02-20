# Make Studio Agent Workspace

Agent workspace for building and managing Make Studio sites.

## Capabilities

- **Conversion** — Convert third-party websites into Make Studio themes (`docs/capabilities/conversion/guide.md`)
- **Design** — Color tokens, typography tiers, animations (`docs/capabilities/design/guide.md`)
- **Pages** — Page management, layouts, post types via API (`docs/capabilities/pages/guide.md`)
- **Deployment** — Preview, deploy requests, snapshots (`docs/capabilities/deployment/guide.md`)

## Guardrails

- **NEVER write directly to MongoDB** — Always use the Make Studio API. Direct DB writes bypass schema casting and skip side effects. If an API endpoint doesn't exist, discuss adding one first.
- **NEVER production deploy** — Use preview or create deployment requests.
- **ALWAYS pull before push** — Enforced by the sync engine. Use `--force` only when you're certain.
- **ALWAYS check activity log before modifying a site** — The sync engine does this automatically.
- **ALWAYS check `docs/review/pending.md`** for resolved items before starting work.

## Compound Loop

After completing work:
1. Write learnings to the appropriate capability's `learnings.md`
2. If unsure about something, add to `docs/review/pending.md`
3. After human review of pending items, incorporate feedback into `guide.md`

## Reference Examples

`docs/references/` — Gold-standard block examples (Hero, Features, Stats, Navbar, Footer, CTA, Button, Testimonial)

## API Reference

`docs/guides/api-reference.md` — All client methods documented

## CLI Commands

```bash
npm run sync -- --theme=<name> [--apply] [--force] [--delete] [--batch] [--only=Block1,Block2]
npm run pull -- --theme=<name> [--only=Block1,theme]
npm run validate -- --theme=<name>
npm run status -- --theme=<name>
npm run rollback -- --theme=<name> --snapshot=<file>
npm run create-site -- --name=<name>
npm run setup-pages -- --theme=<name>
npm test
```

### Copy Site Between Environments

```bash
npx tsx scripts/copy-site.ts \
  --source-url=https://api.makestudio.cc --source-token=xxx --source-site=abc123 \
  --target-url=http://localhost:5001 --target-token=yyy \
  [--target-site=def456] [--name="My Site Copy"] [--files]
```

Copies blocks, partials, theme, layouts, post types, and pages. Remaps all internal IDs.
Use `--files` to also copy media files and rewrite CDN URLs in content.

## Environment

```
MAKE_STUDIO_URL=https://api.makestudio.cc
MAKE_STUDIO_TOKEN=<per-site API token>
MAKE_STUDIO_SITE=<site ID>
```

## File Structure

```
themes/<name>/
  theme.json                    # Fonts, colors, typography, prose
  .sync-state.json              # Last sync timestamp (auto-managed)
  converted/
    blocks/
      BlockName.html            # Handlebars template
      BlockName.json            # Field definitions
    partials/
      Button.html               # Shared button partial
  snapshots/                    # Pre-sync state snapshots
docs/
  capabilities/                 # Capability guides and learnings
  references/                   # Gold-standard block examples
  guides/api-reference.md       # API client documentation
  review/pending.md             # Agent-to-human review queue
scripts/                        # Utility scripts (archive/ for one-offs)
```
