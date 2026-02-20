# Pages Learnings

Accumulated insights about page management.

---

## Page Data Structure

- **Page content uses field UUIDs, not names** — The `content` object maps field UUID to `{ value }`.
- **Page data lives in two places** — Block content is in `page.blocks[].content`. For post type pages, related data can also be in `page.content`.
- **Post type URLs follow `/postTypePath/{slug}.html`** — Never use the source site's URL structure.
- **Data stores for dynamic filter content** — Use `{{#each (dataStore "slug")}}` for filter categories, tag lists.

## Seed Site Issues

- **Seed site page references break after sync** — Default Index page references seed blocks by ID. After sync deletes those and creates custom ones, the page shows "Block template not found". Must update the page with new block IDs.
