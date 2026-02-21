# Deployment Learnings

Accumulated insights about deployment and previews.

## Cross-Environment Site Copy

- **Use snapshot export/import for site duplication** — `POST /snapshots` to serialize, `GET /snapshots/:id/export` to get the full data blob, `POST /snapshots/import` with `{ siteId, data }` to restore on the target. Captures pages, blocks, partials, layouts, post types, folders, data stores, and theme in one shot. No ID remapping needed.
- **Snapshots do NOT include media files** — `MediaFile` records and R2 binaries are not part of the snapshot. Copy them separately via `listFiles` + `upload-from-urls`.
- **CDN URLs require a preview deploy** — Files uploaded to R2 via `upload-from-urls` exist immediately, but `makestudio.site/{siteId}/...` paths only resolve after the target site has been deployed/previewed. Always deploy preview after a copy with `--files`.

## File Upload

- **Use `POST /files/upload-from-urls` for bulk media copy** — Send `{ siteId, images: [{ url, fileName }] }` (max 20 per request). The server fetches each image, resizes to max 3000×3000, converts to WebP at 80% quality, uploads to R2, and returns `{ results: [{ url, success, fullPath }] }` per image. SVGs pass through unchanged. Works with API tokens (Contributor level auth).
- **"File already exists" is not a failure** — The server returns `success: false` with this error for duplicate fileKeys, but the file is already on the target. Treat it as success and construct the target URL for rewriting.
- **`GET /files` requires `folder` = siteId** — Not `"/"` but the actual site ID string (e.g. `folder=6512ab...`). Response is `{ files: [...] }`, not a flat array.
