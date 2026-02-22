# Pending Review

## Open

### Server: Accept API tokens on `/files` routes

The server's `/files` route currently requires Clerk JWT auth (`requireAuth` middleware). API tokens cannot upload files, which blocks agent-driven media upload.

**Required change:** Add `apiTokenAuth` middleware alongside `requireAuth` on `/files/*` routes in the server, so that per-site API tokens can upload files the same way they can manage blocks/partials/pages.

**Routes affected:** `POST /files/upload-url`, `POST /files/register`, `GET /files` (at minimum).

**Why:** The agent workspace needs to upload images and media when converting themes. Without this, all media must be manually uploaded or referenced by external URL.

### Server: `POST /files/upload` returns 404 on local server

The multipart file upload endpoint (`POST /files/upload`) returns 404 on the local development server. The `uploadFile()` API method exists in the client but has no corresponding server route.

**Workaround:** Upload directly to R2 via S3Client, then call `uploadFilesFromUrls` with the R2 public URL to register in the media library.

**Ideal fix:** Implement `POST /files/upload` on the server to accept multipart form data, eliminating the need for direct R2 credentials in agent scripts.

### Compiler: items sub-field names are not resolved by `set-content`

The `PATCH /pages/:id/set-content` endpoint resolves top-level field names to UUIDs, but items array contents pass through verbatim. This means agents must know the `fieldToSlug()` format for items sub-field keys, creating a coupling between the API consumer and the compiler's internal normalization logic.

**Possible improvement:** Have `set-content` recursively resolve sub-field names within items arrays using `config.fields` from the block definition. This would let agents pass `{ "CTA Label": "Click" }` in items data instead of requiring `{ "cta-label": "Click" }`.

## Resolved

(Resolved items are moved here after human review.)
