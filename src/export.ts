import fs from 'fs'
import path from 'path'
import { connect, disconnect } from './db.js'

interface DbField {
  id: string
  type: string
  name: string
  value: unknown
  config?: Record<string, unknown>
}

interface SourceField {
  type: string
  name: string
  default: unknown
  config?: Record<string, unknown>
}

function stripIds(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => {
      if (item && typeof item === 'object') {
        const { id, ...rest } = item as Record<string, unknown>
        const cleaned: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(rest)) {
          cleaned[k] = v
        }
        return cleaned
      }
      return item
    })
  }
  return value
}

function dbFieldToSource(field: DbField): SourceField {
  const source: SourceField = {
    type: field.type,
    name: field.name,
    default: field.type === 'items' ? stripIds(field.value) : field.value
  }

  if (field.config && Object.keys(field.config).length > 0) {
    const config: Record<string, unknown> = { ...field.config }
    if (config.fields && Array.isArray(config.fields)) {
      config.fields = (config.fields as DbField[]).map(f => {
        const nested: Record<string, unknown> = {
          type: f.type,
          name: f.name
        }
        if (f.config && Object.keys(f.config).length > 0) {
          nested.config = f.config
        }
        return nested
      })
    }
    source.config = config
  }

  return source
}

export interface ExportResult {
  success: boolean
  theme: boolean
  blocks: string[]
  partials: string[]
  errors: string[]
}

export async function exportSite(
  siteId: string,
  themePath: string,
  mongoUri: string
): Promise<ExportResult> {
  const { Site, Block, Partial } = await connect(mongoUri)

  const result: ExportResult = {
    success: true,
    theme: false,
    blocks: [],
    partials: [],
    errors: []
  }

  const site = await Site.findById(siteId)
  if (!site) {
    await disconnect()
    result.success = false
    result.errors.push(`Site ${siteId} not found`)
    return result
  }

  const blocksDir = path.join(themePath, 'converted', 'blocks')
  const partialsDir = path.join(themePath, 'converted', 'partials')

  // Clean and recreate directories
  if (fs.existsSync(blocksDir)) fs.rmSync(blocksDir, { recursive: true })
  if (fs.existsSync(partialsDir)) fs.rmSync(partialsDir, { recursive: true })
  fs.mkdirSync(blocksDir, { recursive: true })
  fs.mkdirSync(partialsDir, { recursive: true })

  // Export theme
  if (site.theme) {
    fs.writeFileSync(
      path.join(themePath, 'theme.json'),
      JSON.stringify(site.theme, null, 2) + '\n'
    )
    result.theme = true
  }

  // Export blocks
  const blocks = await Block.find({ site_id: siteId })
  for (const block of blocks) {
    try {
      const name = block.name as string

      if (block.template) {
        fs.writeFileSync(path.join(blocksDir, `${name}.html`), block.template)
      }

      const fields = (block.fields || []) as DbField[]
      const sourceFields = fields.map(dbFieldToSource)

      const json: Record<string, unknown> = {
        makeStudioFields: true,
        version: 1
      }

      if (block.description) json.description = block.description
      if (block.thumbnailType) json.thumbnailType = block.thumbnailType
      json.fields = sourceFields

      fs.writeFileSync(
        path.join(blocksDir, `${name}.json`),
        JSON.stringify(json, null, 2) + '\n'
      )

      result.blocks.push(name)
    } catch (err) {
      result.errors.push(`Block ${block.name}: ${err}`)
    }
  }

  // Export partials
  const partials = await Partial.find({ site_id: siteId })
  for (const partial of partials) {
    try {
      const name = partial.name as string
      if (partial.template) {
        fs.writeFileSync(path.join(partialsDir, `${name}.html`), partial.template)
      }
      result.partials.push(name)
    } catch (err) {
      result.errors.push(`Partial ${partial.name}: ${err}`)
    }
  }

  await disconnect()
  return result
}
