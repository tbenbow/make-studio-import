import fs from 'fs'
import path from 'path'
import type { BlockCatalog, CatalogBlock, CatalogField, SourceField } from './types.js'

// Infer category from block name prefix
function inferCategory(blockName: string): string {
  const name = blockName.toLowerCase()

  if (name.startsWith('hero')) return 'hero'
  if (name.startsWith('feature')) return 'features'
  if (name.startsWith('pricing')) return 'pricing'
  if (name.startsWith('cta')) return 'cta'
  if (name.startsWith('faq')) return 'faq'
  if (name.startsWith('testimonial')) return 'testimonials'
  if (name.startsWith('team')) return 'team'
  if (name.startsWith('stat')) return 'stats'
  if (name.startsWith('logo')) return 'logos'
  if (name.startsWith('footer')) return 'footer'
  if (name.startsWith('navbar') || name.startsWith('nav')) return 'navigation'
  if (name.startsWith('form') || name.startsWith('contact')) return 'forms'
  if (name.startsWith('content') || name.startsWith('split')) return 'content'

  return 'other'
}

// Convert source field to catalog field with flattened structure
function toCatalogField(field: SourceField): CatalogField {
  const catalogField: CatalogField = {
    name: field.name,
    type: field.type
  }

  if (field.default !== undefined) {
    catalogField.default = field.default
  }

  // Flatten select options
  if (field.type === 'select' && field.config?.selectOptions) {
    catalogField.options = field.config.selectOptions as CatalogField['options']
  }

  // Flatten items fields
  if (field.type === 'items' && field.config?.fields) {
    catalogField.itemFields = (field.config.fields as SourceField[]).map(toCatalogField)
  }

  return catalogField
}

// Read a single block JSON and convert to catalog format
function readBlockJson(filePath: string): CatalogBlock | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const json = JSON.parse(content)

    const blockName = path.basename(filePath, '.json')

    return {
      name: blockName,
      description: json.description || '',
      category: inferCategory(blockName),
      fields: (json.fields || []).map(toCatalogField)
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err)
    return null
  }
}

// Generate catalog from theme
export function generateCatalog(themePath: string): BlockCatalog {
  const blocksDir = path.join(themePath, 'converted', 'blocks')
  const themeName = path.basename(themePath)

  const blocks: CatalogBlock[] = []

  if (fs.existsSync(blocksDir)) {
    const files = fs.readdirSync(blocksDir).filter(f => f.endsWith('.json'))

    for (const file of files) {
      const block = readBlockJson(path.join(blocksDir, file))
      if (block) {
        blocks.push(block)
      }
    }
  }

  // Sort blocks by category then name
  blocks.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category)
    }
    return a.name.localeCompare(b.name)
  })

  return {
    theme: themeName,
    generatedAt: new Date().toISOString(),
    blocks
  }
}

// Write catalog to file
export function writeCatalog(themePath: string, catalog: BlockCatalog): void {
  const outputPath = path.join(themePath, 'catalog.json')
  fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2))
}
