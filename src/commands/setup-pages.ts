import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import {
  type CommandContext,
  getThemePath, output, requireApiConfig, MakeStudioClient
} from './context.js'

export async function setupPagesCommand(ctx: CommandContext): Promise<void> {
  const { args, rootDir } = ctx

  const themeName = args.theme
  if (!themeName) {
    output({ error: '--theme is required' })
    process.exit(1)
  }
  const themePath = getThemePath(rootDir, themeName)
  const pagesJsonPath = path.join(themePath, 'pages.json')
  if (!fs.existsSync(pagesJsonPath)) {
    output({ error: `pages.json not found at ${pagesJsonPath}` })
    process.exit(1)
  }

  const apiConfig = requireApiConfig(rootDir, args.env)
  const siteId = args.site || apiConfig.siteId
  const client = new MakeStudioClient(apiConfig.baseUrl, apiConfig.token)

  const manifest = JSON.parse(fs.readFileSync(pagesJsonPath, 'utf-8')) as {
    pages?: Array<{ name: string; slug?: string; layout?: string; blocks?: string[] }>
    layouts?: Array<{ name: string; headerBlocks?: string[]; footerBlocks?: string[]; isDefault?: boolean }>
  }

  // Fetch remote state
  console.log(`Fetching remote state for site ${siteId}...`)
  const [remotePages, remoteLayouts, remoteBlocks] = await Promise.all([
    client.getPages(siteId),
    client.getLayouts(siteId),
    client.getBlocks(siteId)
  ])

  const blocksByName = new Map(remoteBlocks.map(b => [b.name, b]))
  const layoutsByName = new Map(remoteLayouts.map(l => [l.name, l]))
  const pagesByName = new Map(remotePages.map(p => [p.name, p]))

  let layoutsCreated = 0, layoutsUpdated = 0
  let pagesCreated = 0, pagesUpdated = 0

  // Reconcile layouts first (pages reference them)
  if (manifest.layouts) {
    for (const layout of manifest.layouts) {
      const existing = layoutsByName.get(layout.name)
      const headerBlocks = (layout.headerBlocks || [])
        .map(name => blocksByName.get(name))
        .filter(Boolean)
        .map(b => ({ id: crypto.randomUUID(), blockId: b!._id, name: b!.name }))
      const footerBlocks = (layout.footerBlocks || [])
        .map(name => blocksByName.get(name))
        .filter(Boolean)
        .map(b => ({ id: crypto.randomUUID(), blockId: b!._id, name: b!.name }))

      if (existing) {
        console.log(`  Updating layout: ${layout.name}`)
        await client.updateLayout(existing._id, {
          headerBlocks,
          footerBlocks,
          isDefault: layout.isDefault
        })
        layoutsByName.set(layout.name, { ...existing, headerBlocks, footerBlocks })
        layoutsUpdated++
      } else {
        console.log(`  Creating layout: ${layout.name}`)
        const created = await client.createLayout({
          name: layout.name,
          site_id: siteId,
          headerBlocks,
          footerBlocks,
          isDefault: layout.isDefault
        })
        layoutsByName.set(layout.name, created)
        layoutsCreated++
      }
    }
  }

  // Reconcile pages
  if (manifest.pages) {
    for (const page of manifest.pages) {
      const existing = pagesByName.get(page.name)
      const layoutId = page.layout ? layoutsByName.get(page.layout)?._id : undefined
      const blocks = (page.blocks || [])
        .map(name => blocksByName.get(name))
        .filter(Boolean)
        .map(b => ({ id: crypto.randomUUID(), blockId: b!._id, name: b!.name }))

      const settings: Record<string, unknown> = {}
      if (page.slug) settings.slug = page.slug
      if (layoutId) settings.layoutId = layoutId

      if (existing) {
        console.log(`  Updating page: ${page.name}`)
        const patch: Record<string, unknown> = { blocks }
        if (Object.keys(settings).length > 0) patch.settings = { ...existing.settings, ...settings }
        await client.updatePage(existing._id, patch)
        pagesUpdated++
      } else {
        console.log(`  Creating page: ${page.name}`)
        const created = await client.createPage({
          name: page.name,
          site_id: siteId,
          settings: Object.keys(settings).length > 0 ? settings : undefined
        })
        // blocks must be added via update (not supported on create)
        if (blocks.length > 0) {
          await client.updatePage(created._id, { blocks })
        }
        pagesCreated++
      }
    }
  }

  console.log(`\nSetup complete: ${layoutsCreated} layouts created, ${layoutsUpdated} updated; ${pagesCreated} pages created, ${pagesUpdated} updated.`)
  process.exit(0)
}
