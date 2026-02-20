# Pages Learnings

Accumulated insights about page management.

---

## Page Data Structure

- **Page content uses field UUIDs, not names** — The `content` object maps field UUID to `{ value }`.
- **Regular pages vs post pages store content differently**:
  - **Regular pages**: content lives in `page.blocks[].content[fieldId].value`
  - **Post pages**: content lives in `page.content[blockId][fieldId].value` where `blockId` is the block definition `_id`
  - The editor reads from different locations depending on page type — both must be populated correctly.
- **Post pages inherit block structure from the detail page template** — The detail page's `blocks[]` defines which blocks appear. Individual posts don't carry their own blocks array for structure — they only carry content overrides keyed by `blockId`.
- **Post type URLs follow `/postTypePath/{slug}.html`** — Never use the source site's URL structure.
- **Data stores for dynamic filter content** — Use `{{#each (dataStore "slug")}}` for filter categories, tag lists.

## setup-pages Command

- **`createPage` API does not accept `blocks`** — The create schema only accepts `name`, `site_id`, `settings`, `parentId`, `postTypeId`. Blocks must be added via a follow-up `updatePage` call.
- **Page/layout block refs need full objects** — Send `{ id, blockId, name }`, not just `{ blockId }`. The API validates that `id` and `name` are present.
- **`layoutId` goes inside `settings`** — Not at the top level of the page object. Use `settings: { layoutId: '...' }`.

## Cross-Environment Copy

- **Match pages by composite key, not just name** — Multiple pages can share the same name (e.g., "Index" for both the main site and a post type index page). Use `postTypeId + name` or `parentId + name` as the lookup key when matching source pages to existing target pages.

## Seed Site Issues

- **Use the Index page, don't create a "Home" page** — New sites come with an "Index" page that serves as the homepage. Instead of creating a separate "Home" page and deleting Index, update the existing Index page with your blocks and content. In `pages.json`, use `"name": "Index"` (not "Home") so `setup-pages` finds and updates it.
- **Seed site page references break after sync** — Default Index page references seed blocks by ID. After sync deletes those and creates custom ones, the page shows "Block template not found". Must update the page with new block IDs.
- **New sites come with template cruft** — Default blocks, pages, layouts, and post types from the seed template must be cleaned up. Delete stale pages/layouts before deploying preview, or the build will crash on missing block references.

## Post Import / set-content Endpoint

- **Use `PATCH /pages/:id/set-content`** — Accepts `{ "BlockName": { "FieldName": "value" } }`. Server resolves field UUIDs, block instance IDs, and writes to both `blocks[].content` and `page.content`. Much simpler than manual UUID wiring.
- **PATCH /pages/:id needed `markModified`** — The generic update handler was missing `markModified('content')` and `markModified('blocks')`. Mongoose `Mixed` fields require this for changes to persist.
- **Always verify which site the editor is connected to** — When working with multiple sites locally, the `.env` site ID and the editor session can point to different sites. The editor URL starts with the site ID (`localhost:5173/{siteId}/...`).
- **Rename seed post type before importing** — New sites come with a "Blog" post type. Rename it (or delete + recreate) to match your post type name before importing content. Name conflicts with existing pages must be resolved first.
- **WordPress REST API is reliable for content** — `/wp-json/wp/v2/posts?per_page=100&page=N&_embed` returns full HTML content even for client-side rendered WP sites. No need to scrape rendered pages.
