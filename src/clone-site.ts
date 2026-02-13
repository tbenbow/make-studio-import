import mongoose from 'mongoose'
import { connect, disconnect } from './db.js'

export interface CloneSiteResult {
  success: boolean
  newSiteId?: string
  copied: {
    blocks: number
    partials: number
    pages: number
    theme: boolean
  }
  errors: string[]
}

export async function cloneSite(
  sourceSiteId: string,
  newSiteName: string,
  mongoUri: string
): Promise<CloneSiteResult> {
  const { Site, Block, Partial, Page } = await connect(mongoUri)

  const result: CloneSiteResult = {
    success: false,
    copied: {
      blocks: 0,
      partials: 0,
      pages: 0,
      theme: false
    },
    errors: []
  }

  try {
    // Find source site
    const sourceSite = await Site.findById(sourceSiteId)
    if (!sourceSite) {
      result.errors.push(`Source site ${sourceSiteId} not found`)
      return result
    }

    // Create new site
    const newSite = new Site({
      theme: sourceSite.theme || null,
      blocks: [],
      partials: [],
      pages: []
    })
    await newSite.save()

    const newSiteId = newSite._id.toString()
    result.newSiteId = newSiteId
    result.copied.theme = !!sourceSite.theme

    // Track block ID mappings (old -> new)
    const blockIdMap = new Map<string, string>()

    // Copy blocks
    const sourceBlocks = await Block.find({ site_id: sourceSiteId })
    for (const block of sourceBlocks) {
      try {
        const newBlock = new Block({
          name: block.name,
          description: block.description,
          thumbnailType: block.thumbnailType,
          site_id: newSiteId,
          template: block.template,
          fields: block.fields
        })
        await newBlock.save()

        // Track mapping
        blockIdMap.set(block._id.toString(), newBlock._id.toString())

        // Add to site's blocks array
        await Site.findByIdAndUpdate(newSiteId, {
          $push: { blocks: { _id: newBlock._id, name: block.name } }
        })

        result.copied.blocks++
      } catch (err) {
        result.errors.push(`Block "${block.name}": ${err}`)
      }
    }

    // Copy partials
    const sourcePartials = await Partial.find({ site_id: sourceSiteId })
    for (const partial of sourcePartials) {
      try {
        const newPartial = new Partial({
          name: partial.name,
          site_id: newSiteId,
          template: partial.template
        })
        await newPartial.save()

        // Add to site's partials array
        await Site.findByIdAndUpdate(newSiteId, {
          $push: { partials: { _id: newPartial._id, name: partial.name } }
        })

        result.copied.partials++
      } catch (err) {
        result.errors.push(`Partial "${partial.name}": ${err}`)
      }
    }

    // Copy pages with remapped block references
    const sourcePages = await Page.find({ site_id: sourceSiteId })
    for (const page of sourcePages) {
      try {
        // Remap block_id references in page blocks
        const remappedBlocks = (page.blocks || []).map((pageBlock: { block_id: unknown; content: unknown }) => {
          const oldBlockId = pageBlock.block_id?.toString()
          const newBlockId = oldBlockId ? blockIdMap.get(oldBlockId) : null

          return {
            block_id: newBlockId ? new mongoose.Types.ObjectId(newBlockId) : pageBlock.block_id,
            content: pageBlock.content
          }
        })

        const newPage = new Page({
          name: page.name,
          site_id: newSiteId,
          settings: page.settings,
          blocks: remappedBlocks
        })
        await newPage.save()

        // Add to site's pages array
        await Site.findByIdAndUpdate(newSiteId, {
          $push: { pages: { _id: newPage._id, name: page.name } }
        })

        result.copied.pages++
      } catch (err) {
        result.errors.push(`Page "${page.name}": ${err}`)
      }
    }

    result.success = true
  } finally {
    await disconnect()
  }

  return result
}
