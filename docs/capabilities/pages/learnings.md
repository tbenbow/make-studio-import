# Pages Learnings

Accumulated insights about page management.

---

## Page Data Structure

- **Page content uses field UUIDs, not names** — The `content` object maps field UUID to `{ value }`.
- **Page data lives in two places** — Block content is in `page.blocks[].content`. For post type pages, related data can also be in `page.content`.
- **Post type URLs follow `/postTypePath/{slug}.html`** — Never use the source site's URL structure.
- **Data stores for dynamic filter content** — Use `{{#each (dataStore "slug")}}` for filter categories, tag lists.

## setup-pages Command

- **`createPage` API does not accept `blocks`** — The create schema only accepts `name`, `site_id`, `settings`, `parentId`, `postTypeId`. Blocks must be added via a follow-up `updatePage` call.
- **Page/layout block refs need full objects** — Send `{ id, blockId, name }`, not just `{ blockId }`. The API validates that `id` and `name` are present.
- **`layoutId` goes inside `settings`** — Not at the top level of the page object. Use `settings: { layoutId: '...' }`.

## Seed Site Issues

- **Seed site page references break after sync** — Default Index page references seed blocks by ID. After sync deletes those and creates custom ones, the page shows "Block template not found". Must update the page with new block IDs.
- **New sites come with template cruft** — Default blocks, pages, layouts, and post types from the seed template must be cleaned up. Delete stale pages/layouts before deploying preview, or the build will crash on missing block references.
