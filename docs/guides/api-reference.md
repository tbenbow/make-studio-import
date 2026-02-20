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
| `getSite(siteId)` | Get site with theme, block/partial/page/layout summaries |
| `updateSiteTheme(siteId, theme)` | PATCH site theme (merge with existing) |
| `createSite(name)` | Create a new site (returns apiToken) |
| `reconcile(siteId)` | Re-index site relationships |

### Blocks

| Method | Description |
|--------|-------------|
| `getBlocks(siteId)` | List all blocks for a site |
| `createBlock({ name, site_id, template, fields, category })` | Create a new block |
| `updateBlock(id, { template?, fields?, description?, thumbnailType? })` | Update block properties |
| `deleteBlock(id)` | Delete a block |

Block fields must be transformed from source format (JSON file) to API format before sending. The `transformField` function in `src/index.ts` adds `id` (UUID) and converts `default` to `value`.

### Partials

| Method | Description |
|--------|-------------|
| `getPartials(siteId)` | List all partials (returns `{ partials, templateObject }`) |
| `createPartial({ name, site_id, template })` | Create a new partial |
| `updatePartial(id, { template? })` | Update partial template |
| `deletePartial(id)` | Delete a partial |

### Pages

| Method | Description |
|--------|-------------|
| `getPages(siteId)` | List all pages for a site |
| `getPage(id)` | Get a single page with full content |
| `createPage({ name, site_id, settings?, parentId?, postTypeId? })` | Create a new page |
| `updatePage(id, data)` | Update page (name, blocks, content, settings) |
| `deletePage(id)` | Delete a page |

### Layouts

| Method | Description |
|--------|-------------|
| `getLayouts(siteId)` | List all layouts for a site |
| `getLayout(id)` | Get a single layout |
| `createLayout({ name, site_id, description?, headerBlocks?, footerBlocks?, settings?, isDefault? })` | Create a layout |
| `updateLayout(id, { name?, description?, headerBlocks?, footerBlocks?, settings?, isDefault? })` | Update a layout |
| `deleteLayout(id)` | Delete a layout |

### Post Types

| Method | Description |
|--------|-------------|
| `getPostTypes(siteId)` | List all post types for a site |
| `createPostType({ name, site_id })` | Create a post type (auto-creates detail, index, first post pages) |
| `updatePostType(id, data)` | Update a post type |
| `deletePostType(id)` | Delete a post type and all associated pages |

### Activity Log

| Method | Description |
|--------|-------------|
| `getActivityLog(siteId, { limit?, entityType?, action?, since? })` | Query activity log entries |

The `since` parameter accepts an ISO 8601 date string. Used by the sync engine for pull-before-push safety checks.

### Snapshots (Server-Side)

| Method | Description |
|--------|-------------|
| `listSnapshots(siteId)` | List up to 10 recent snapshots (metadata only) |
| `createSnapshot(siteId, label?)` | Create a site snapshot (auto-prunes to 10) |
| `restoreSnapshot(id)` | Restore site from a snapshot |

### Deployment

| Method | Description |
|--------|-------------|
| `deployPreview(siteId)` | Deploy a preview build |
| `getPreviewStatus(siteId)` | Check if preview is stale |

### Deployment Requests

| Method | Description |
|--------|-------------|
| `detectChanges(siteId)` | Detect what has changed since last deploy |
| `createDeploymentRequest({ siteId, title, description?, selectedPageIds? })` | Create a deployment request |
| `listDeploymentRequests(siteId)` | List deployment requests for a site |

## Sync Workflow

```bash
# Dry run
npm run sync -- --theme=<name>

# Apply changes
npm run sync -- --theme=<name> --apply

# Force (skip activity log check)
npm run sync -- --theme=<name> --apply --force

# Sync specific blocks
npm run sync -- --theme=<name> --apply --only=Hero,Features

# Sync theme.json only
npm run sync -- --theme=<name> --apply --only=theme

# Pull remote state
npm run pull -- --theme=<name>
```

## Sync Internals

1. Fetches remote state (site, blocks, partials)
2. Reads local theme files
3. Computes a changeset (create/update/delete)
4. Shows dry-run diff
5. With `--apply`: checks activity log for remote changes (unless `--force`)
6. Saves a snapshot, then applies changes
7. Updates `.sync-state.json` with timestamp

## Block Category

When creating blocks, use `category: 'section'` for full-width page sections.

## Theme Update

The theme PATCH merges at the top level:

```typescript
await client.updateSiteTheme(siteId, {
  systemColors: { base: '#0a0a0a', fg: '#ffffff', ... }
})
```

This preserves other theme keys (fonts, typography, etc.) on the server.
