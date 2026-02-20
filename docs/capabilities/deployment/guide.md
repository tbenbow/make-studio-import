# Deployment Guide

Preview, deploy, snapshots, and deployment requests.

## Preview

Deploy a preview build to inspect the site before going live:

```typescript
const result = await client.deployPreview(siteId)
console.log(result.previewUrl)  // Preview URL to check

const status = await client.getPreviewStatus(siteId)
console.log(status.isStale)     // true if site changed since last preview
```

## Snapshots

Server-side snapshots capture the complete site state for rollback:

```typescript
// Create a snapshot before making changes
const snapshot = await client.createSnapshot(siteId, 'Before homepage redesign')

// List recent snapshots
const snapshots = await client.listSnapshots(siteId)

// Restore a snapshot
await client.restoreSnapshot(snapshotId)
```

The server auto-prunes to 10 snapshots per site.

### Local Snapshots

The sync engine also creates local snapshots before applying changes (stored in `themes/<name>/snapshots/`). Use `npm run rollback` to restore from local snapshots.

## Deployment Requests

For production deploys, use deployment requests instead of deploying directly:

```typescript
// Check what has changed since last deploy
const changes = await client.detectChanges(siteId)

// Create a deployment request
const request = await client.createDeploymentRequest({
  siteId,
  title: 'Homepage redesign',
  description: 'Updated hero, features, and CTA blocks',
  selectedPageIds: [pageId1, pageId2]  // optional: deploy specific pages
})

// List pending deployment requests
const requests = await client.listDeploymentRequests(siteId)
```

Deployment requests must be approved and deployed by a Publisher or higher via the Make Studio UI.

## Guardrails

- **NEVER production deploy from the agent** — Use preview or create deployment requests
- **Always create a snapshot before destructive changes**
- **Check preview status before creating deployment requests** — Ensure the preview reflects current state
