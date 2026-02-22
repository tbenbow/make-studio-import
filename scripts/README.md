# Scripts

Utility scripts for the agent workspace.

## Utilities

| Script | Description |
|--------|-------------|
| `copy-site.ts` | Copy sites between environments with ID remapping |
| `deploy-preview.ts` | Deploy preview for a site |
| `generate-image.ts` | Generate images using AI (DALL-E or Flux) |
| `search-pexels.ts` | Search and download images from Pexels |
| `preview-generations.ts` | Preview site generation variations |
| `check-media.ts` | Audit media files referenced by blocks and pages |
| `inspect-page.ts` | Inspect page structure via API |

## Archive

`scripts/archive/` contains one-off setup and migration scripts:

| Script | Description |
|--------|-------------|
| `setup-pirate-golf.ts` | One-time setup script for Pirate Golf site |
| `import-wp-posts.ts` | Import WordPress posts into Make Studio |

**Warning**: Archived scripts may use outdated patterns. Always use the Make Studio API via `src/api.ts` for new work.
