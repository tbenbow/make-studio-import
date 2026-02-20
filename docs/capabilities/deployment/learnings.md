# Deployment Learnings

Accumulated insights about deployment and previews.

## File Upload

- **Use `POST /files/upload-from-urls` for bulk media copy** — Send `{ siteId, files: [{ url, fileName }] }` (max 20 per request). The server fetches each image, resizes to max 3000×3000, converts to WebP at 80% quality, uploads to R2, and returns `{ url, success, fullPath }` per image. SVGs pass through unchanged. Works with API tokens (Contributor level auth).
- **`listFiles` requires a `folder` parameter** — The server rejects requests without it. Pass `folder: "/"` for the root.
