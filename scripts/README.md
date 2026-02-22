# Scripts

Utility scripts for the agent workspace.

## Active Scripts

| Script | Description |
|--------|-------------|
| `copy-site.ts` | Copy sites between environments with ID remapping |
| `deploy-preview.ts` | Deploy preview for a site |
| `generate-image.ts` | Generate images using AI (DALL-E or Flux) |
| `search-pexels.ts` | Search and download images from Pexels |
| `preview-generations.ts` | Preview site generation variations |
| `setup-pirate-golf.ts` | One-time setup script for Pirate Golf site |
| `import-wp-posts.ts` | Import WordPress posts into Make Studio |
| `check-media.ts` | Audit media files referenced by blocks and pages |
| `inspect-page.ts` | Inspect page structure via API |

## Archive

`scripts/archive/` contains 90+ one-off scripts from past conversions (okgosandbox, peakperformance).

**⚠️ WARNING**: Most archived scripts use direct MongoDB access, which violates current guardrails. They are kept for reference only and should NOT be used for new work. Always use the Make Studio API via `src/api.ts` instead.
