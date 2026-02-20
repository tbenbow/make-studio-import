# Pages, Layouts & Post Types Guide

Managing pages, layouts, and post types via the Make Studio API.

## Pages

### Creating a Page

```typescript
const page = await client.createPage({
  name: 'About',
  site_id: siteId,
  settings: { layoutId: layoutId },
  parentId: parentPageId  // optional, for nested pages
})
```

### Updating a Page

```typescript
await client.updatePage(pageId, {
  name: 'About Us',
  blocks: [...],        // array of block instances with content
  settings: { ... }     // merged with existing settings
})
```

### Deleting a Page

```typescript
await client.deletePage(pageId)
```

### Page Block Content Format

Pages reference blocks by ID and store field values keyed by field UUID:

```json
{
  "id": "uuid",
  "blockId": "mongoId",
  "name": "BlockName",
  "content": {
    "field-uuid-1": { "value": "actual content" },
    "field-uuid-2": { "value": [...] }
  }
}
```

## Layouts

Layouts define shared header/footer blocks across pages.

```typescript
// List layouts
const layouts = await client.getLayouts(siteId)

// Create layout
const layout = await client.createLayout({
  name: 'Default',
  site_id: siteId,
  headerBlocks: [...],
  footerBlocks: [...],
  isDefault: true
})

// Update layout
await client.updateLayout(layoutId, { name: 'New Name' })

// Delete layout
await client.deleteLayout(layoutId)
```

## Post Types

Post types create repeatable content structures (blog posts, resources, etc.).

```typescript
// List post types
const postTypes = await client.getPostTypes(siteId)

// Create post type (auto-creates detail, index, and first post pages)
const postType = await client.createPostType({
  name: 'Resources',
  site_id: siteId
})

// Update post type
await client.updatePostType(postTypeId, { name: 'Articles' })

// Delete post type (deletes all associated pages)
await client.deletePostType(postTypeId)
```

### Post Type URLs

Posts follow `/{postTypePath}/{slug}.html`. Never use the source site's URL structure for internal links.

## Key Patterns

- **After sync, update pages** — Sync handles blocks/partials/theme but NOT pages. Wire blocks to pages separately.
- **Always create a fresh site for new conversions** — Use `npm run create-site -- --name="Site Name"`.
- **The full deployment flow** — (1) create-site, (2) sync blocks/partials/theme, (3) update pages with block IDs.
