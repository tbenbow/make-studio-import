import fs from 'fs'
import path from 'path'
import type { PageInterchange, BlockCatalog, PageValidationResult, CatalogBlock, CatalogField } from './types.js'

// Load catalog from theme
function loadCatalog(themePath: string): BlockCatalog | null {
  const catalogPath = path.join(themePath, 'catalog.json')
  if (!fs.existsSync(catalogPath)) {
    return null
  }
  return JSON.parse(fs.readFileSync(catalogPath, 'utf-8'))
}

// Load site config
function loadSiteConfig(sitePath: string): { siteId: string; theme: string; name: string } | null {
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

// Find a field in a block's fields (case-insensitive)
function findField(fields: CatalogField[], fieldName: string): CatalogField | undefined {
  return fields.find(f => f.name.toLowerCase() === fieldName.toLowerCase())
}

// Validate a single block's content against catalog
function validateBlockContent(
  blockName: string,
  content: Record<string, unknown>,
  catalogBlock: CatalogBlock,
  errors: PageValidationResult['errors'],
  warnings: PageValidationResult['warnings']
): void {
  // Check each provided field exists in the catalog
  for (const fieldName of Object.keys(content)) {
    const catalogField = findField(catalogBlock.fields, fieldName)

    if (!catalogField) {
      errors.push({
        block: blockName,
        field: fieldName,
        message: `Unknown field "${fieldName}". Available fields: ${catalogBlock.fields.map(f => f.name).join(', ')}`
      })
      continue
    }

    const value = content[fieldName]

    // Type validation for items fields
    if (catalogField.type === 'items') {
      if (!Array.isArray(value)) {
        errors.push({
          block: blockName,
          field: fieldName,
          message: `Field "${fieldName}" should be an array`
        })
      } else if (catalogField.itemFields) {
        // Validate each item in the array
        for (let i = 0; i < value.length; i++) {
          const item = value[i] as Record<string, unknown>
          if (typeof item !== 'object' || item === null) {
            errors.push({
              block: blockName,
              field: fieldName,
              message: `Item ${i} in "${fieldName}" should be an object`
            })
            continue
          }

          // Check item fields
          for (const itemFieldName of Object.keys(item)) {
            const itemField = findField(catalogField.itemFields, itemFieldName)
            if (!itemField) {
              warnings.push({
                block: blockName,
                field: `${fieldName}[${i}].${itemFieldName}`,
                message: `Unknown item field "${itemFieldName}". Available: ${catalogField.itemFields.map(f => f.name).join(', ')}`
              })
            }
          }
        }
      }
    }

    // Type validation for select fields
    if (catalogField.type === 'select' && catalogField.options && value !== undefined) {
      const validValues = catalogField.options.map(o => o.value)
      if (!validValues.includes(String(value))) {
        warnings.push({
          block: blockName,
          field: fieldName,
          message: `Value "${value}" not in options: ${validValues.join(', ')}`
        })
      }
    }
  }
}

// Validate page against catalog
export function validatePage(
  sitePath: string,
  pageName: string,
  themesDir: string
): PageValidationResult {
  const errors: PageValidationResult['errors'] = []
  const warnings: PageValidationResult['warnings'] = []

  // Load site config
  const siteConfig = loadSiteConfig(sitePath)
  if (!siteConfig) {
    return {
      valid: false,
      errors: [{ block: '', field: '', message: `site.json not found in ${sitePath}` }],
      warnings: []
    }
  }

  // Load catalog for theme
  const themePath = path.join(themesDir, siteConfig.theme)
  const catalog = loadCatalog(themePath)
  if (!catalog) {
    return {
      valid: false,
      errors: [{ block: '', field: '', message: `catalog.json not found for theme "${siteConfig.theme}"` }],
      warnings: []
    }
  }

  // Load page
  const page = loadPage(sitePath, pageName)
  if (!page) {
    return {
      valid: false,
      errors: [{ block: '', field: '', message: `Page "${pageName}.json" not found in ${sitePath}/pages/` }],
      warnings: []
    }
  }

  // Validate page structure
  if (!page.name) {
    errors.push({ block: '', field: 'name', message: 'Page name is required' })
  }

  if (!page.settings?.title) {
    warnings.push({ block: '', field: 'settings.title', message: 'Page title is recommended for SEO' })
  }

  if (!page.blocks || !Array.isArray(page.blocks)) {
    errors.push({ block: '', field: 'blocks', message: 'Page blocks array is required' })
    return { valid: false, errors, warnings }
  }

  // Create block lookup map
  const catalogBlocks = new Map<string, CatalogBlock>()
  for (const block of catalog.blocks) {
    catalogBlocks.set(block.name.toLowerCase(), block)
  }

  // Validate each block
  for (let i = 0; i < page.blocks.length; i++) {
    const pageBlock = page.blocks[i]
    const blockIndex = `blocks[${i}]`

    if (!pageBlock.block) {
      errors.push({
        block: blockIndex,
        field: 'block',
        message: 'Block name is required'
      })
      continue
    }

    const catalogBlock = catalogBlocks.get(pageBlock.block.toLowerCase())
    if (!catalogBlock) {
      errors.push({
        block: pageBlock.block,
        field: '',
        message: `Unknown block "${pageBlock.block}". Available blocks: ${catalog.blocks.map(b => b.name).join(', ')}`
      })
      continue
    }

    // Validate content
    if (pageBlock.content && typeof pageBlock.content === 'object') {
      validateBlockContent(pageBlock.block, pageBlock.content, catalogBlock, errors, warnings)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
