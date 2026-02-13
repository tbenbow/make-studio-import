import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { connect, disconnect } from './db.js'
import type { PageInterchange, ImportPageResult, SiteConfig, DbField } from './types.js'

// Load site config
function loadSiteConfig(sitePath: string): SiteConfig | null {
  const configPath = path.join(sitePath, 'site.json')
  if (!fs.existsSync(configPath)) {
    return null
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
}

// Load page interchange file
function loadPage(sitePath: string, pageName: string): PageInterchange | null {
  const pagePath = path.join(sitePath, 'pages', `${pageName}.json`)
  if (!fs.existsSync(pagePath)) {
    return null
  }
  return JSON.parse(fs.readFileSync(pagePath, 'utf-8'))
}

// Build field name to UUID map from DB block fields
function buildFieldMap(fields: DbField[]): Map<string, { id: string; field: DbField }> {
  const map = new Map<string, { id: string; field: DbField }>()
  for (const field of fields) {
    map.set(field.name.toLowerCase(), { id: field.id, field })
  }
  return map
}

// Convert field name to lowercase key format used in item objects
// "Button Label" -> "button_label", "Title" -> "title"
function toItemKey(fieldName: string): string {
  return fieldName.toLowerCase().replace(/\s+/g, '_')
}

// Resolve page content to use field UUIDs instead of names
// Page content format: { [fieldId]: { value: ... } }
function resolveContent(
  content: Record<string, unknown>,
  fieldMap: Map<string, { id: string; field: DbField }>,
  blockFields: DbField[]
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {}

  // Start with defaults from block fields (wrapped in { value: ... })
  for (const field of blockFields) {
    if (field.value !== undefined) {
      resolved[field.id] = { value: field.value }
    }
  }

  // Override with provided content
  for (const [fieldName, value] of Object.entries(content)) {
    const match = fieldMap.get(fieldName.toLowerCase())
    if (match) {
      // Handle items type - convert to lowercase keys and add id to each item
      if (match.field.type === 'items' && Array.isArray(value)) {
        const itemFields = (match.field.config?.fields as DbField[]) || []

        const resolvedItems = value.map(item => {
          if (typeof item !== 'object' || item === null) return item

          const resolvedItem: Record<string, unknown> = {
            id: uuidv4()
          }

          // Map input field names to lowercase keys
          for (const [itemFieldName, itemValue] of Object.entries(item as Record<string, unknown>)) {
            // Find matching field config to get proper key format
            const matchingField = itemFields.find(
              f => f.name.toLowerCase() === itemFieldName.toLowerCase()
            )
            if (matchingField) {
              resolvedItem[toItemKey(matchingField.name)] = itemValue
            } else {
              // Use the key as-is if no match (already lowercase)
              resolvedItem[toItemKey(itemFieldName)] = itemValue
            }
          }

          return resolvedItem
        })

        resolved[match.id] = { value: resolvedItems }
      } else {
        resolved[match.id] = { value: value }
      }
    }
  }

  return resolved
}

// Import a page to MongoDB
export async function importPage(
  sitePath: string,
  pageName: string,
  mongoUri: string
): Promise<ImportPageResult> {
  const errors: string[] = []

  // Load site config
  const siteConfig = loadSiteConfig(sitePath)
  if (!siteConfig) {
    return {
      success: false,
      pageName,
      blocksImported: 0,
      errors: [`site.json not found in ${sitePath}`]
    }
  }

  // Load page
  const page = loadPage(sitePath, pageName)
  if (!page) {
    return {
      success: false,
      pageName,
      blocksImported: 0,
      errors: [`Page "${pageName}.json" not found in ${sitePath}/pages/`]
    }
  }

  // Connect to database
  const { Site, Block, Page } = await connect(mongoUri)

  try {
    // Verify site exists
    const site = await Site.findById(siteConfig.siteId)
    if (!site) {
      return {
        success: false,
        pageName,
        blocksImported: 0,
        errors: [`Site with ID "${siteConfig.siteId}" not found`]
      }
    }

    // Get all blocks for this site
    const siteBlocks = await Block.find({ site_id: siteConfig.siteId })
    const blockMap = new Map<string, { _id: string; fields: DbField[] }>()
    for (const block of siteBlocks) {
      blockMap.set(block.name.toLowerCase(), {
        _id: block._id.toString(),
        fields: block.fields || []
      })
    }

    // Process each page block
    const pageBlocks: { block_id: string; content: Record<string, unknown> }[] = []

    for (const pageBlock of page.blocks) {
      const dbBlock = blockMap.get(pageBlock.block.toLowerCase())

      if (!dbBlock) {
        errors.push(`Block "${pageBlock.block}" not found in database`)
        continue
      }

      const fieldMap = buildFieldMap(dbBlock.fields)
      const resolvedContent = resolveContent(
        pageBlock.content || {},
        fieldMap,
        dbBlock.fields
      )

      pageBlocks.push({
        block_id: dbBlock._id,
        content: resolvedContent
      })
    }

    if (errors.length > 0 && pageBlocks.length === 0) {
      return {
        success: false,
        pageName: page.name,
        blocksImported: 0,
        errors
      }
    }

    // Create the page
    const newPage = new Page({
      name: page.name,
      site_id: siteConfig.siteId,
      settings: page.settings || {},
      blocks: pageBlocks
    })

    await newPage.save()

    // Add page to site's pages array
    await Site.findByIdAndUpdate(siteConfig.siteId, {
      $push: { pages: { _id: newPage._id, name: page.name } }
    })

    return {
      success: true,
      pageId: newPage._id.toString(),
      pageName: page.name,
      blocksImported: pageBlocks.length,
      errors
    }
  } finally {
    await disconnect()
  }
}
