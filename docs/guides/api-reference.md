# Make Studio API Reference

The API client is in `src/api.ts`. All operations use bearer token authentication.

## Environment

```
MAKE_STUDIO_URL=https://api.makestudio.cc
MAKE_STUDIO_TOKEN=<per-site API token>
MAKE_STUDIO_SITE=<site ID>
```

## Client Usage

```typescript
import { MakeStudioClient } from './api.js'

const client = new MakeStudioClient(baseUrl, token)
```

## Operations

### Site

| Method | Description |
|--------|-------------|
| `getSite(siteId)` | Get site with theme, block/partial/page summaries |
| `updateSiteTheme(siteId, theme)` | PATCH site theme (merge with existing) |
| `reconcile(siteId)` | Re-index site relationships |

### Blocks

| Method | Description |
|--------|-------------|
| `getBlocks(siteId)` | List all blocks for a site |
| `createBlock({ name, site_id, template, fields, category })` | Create a new block |
| `updateBlock(id, { template?, fields?, description?, thumbnailType? })` | Update block properties |
| `deleteBlock(id)` | Delete a block |

Block fields must be transformed from source format (JSON file) to API format before sending. The `transformField` function in `src/index.ts` handles this — it adds `id` (UUID) and converts `default` to `value`.

### Partials

| Method | Description |
|--------|-------------|
| `getPartials(siteId)` | List all partials (returns `{ partials, templateObject }`) |
| `createPartial({ name, site_id, template })` | Create a new partial |
| `updatePartial(id, { template? })` | Update partial template |
| `deletePartial(id)` | Delete a partial |

## Sync Workflow

The standard workflow for deploying changes:

```bash
# Dry run — see what would change
npm run sync -- --theme=peakperformance

# Apply changes
npm run sync -- --theme=peakperformance --apply

# Sync specific blocks only
npm run sync -- --theme=peakperformance --apply --only=Hero,Features

# Sync theme.json only
npm run sync -- --theme=peakperformance --apply --only=theme

# Pull remote state to local files
npm run pull -- --theme=peakperformance
```

## Sync Internals

1. Fetches remote state (site, blocks, partials)
2. Reads local theme files
3. Computes a changeset (create/update/delete for blocks, partials, theme)
4. Shows dry-run diff
5. With `--apply`: saves a snapshot, then applies changes
6. Snapshot enables rollback if needed

## Block Category

When creating blocks, use `category: 'section'` for full-width page sections.

## Theme Update

The theme PATCH merges at the top level. To update just colors:

```typescript
await client.updateSiteTheme(siteId, {
  systemColors: { base: '#0a0a0a', fg: '#ffffff', ... }
})
```

This preserves other theme keys (fonts, typography, etc.) on the server.
