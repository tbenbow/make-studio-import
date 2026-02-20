# Pending Review

## Open

### Server: Accept API tokens on `/files` routes

The server's `/files` route currently requires Clerk JWT auth (`requireAuth` middleware). API tokens cannot upload files, which blocks agent-driven media upload.

**Required change:** Add `apiTokenAuth` middleware alongside `requireAuth` on `/files/*` routes in the server, so that per-site API tokens can upload files the same way they can manage blocks/partials/pages.

**Routes affected:** `POST /files/upload-url`, `POST /files/register`, `GET /files` (at minimum).

**Why:** The agent workspace needs to upload images and media when converting themes. Without this, all media must be manually uploaded or referenced by external URL.

## Resolved

(Resolved items are moved here after human review.)
