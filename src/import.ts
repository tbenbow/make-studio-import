import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import mongoose from 'mongoose'
import type { SourceField, DbField, Manifest, ImportResult } from './types.js'

// Field type mapping
const TYPE_MAP: Record<string, string> = {
  text: 'text',
  textarea: 'textarea',
  wysiwyg: 'wysiwyg',
  richText: 'wysiwyg',
  image: 'image',
  items: 'items',
  repeater: 'items',
  select: 'select',
  toggle: 'select',
  group: 'group',
  number: 'number',
  date: 'date'
}

function getDefaultValue(field: SourceField, dbType: string): unknown {
  // Use explicit default if provided
  if (field.default !== undefined) {
    // For items/repeater fields, transform nested field defaults
    if (dbType === 'items' && Array.isArray(field.default)) {
      return field.default.map((item: Record<string, unknown>) => {
        const transformedItem: Record<string, unknown> = { id: randomUUID() }
        // Map each key in the item to kebab-case as expected by templates
        for (const [key, value] of Object.entries(item)) {
          transformedItem[key] = value
        }
        return transformedItem
      })
    }
    return field.default
  }
  
  // Fallback defaults by type
  switch (dbType) {
    case 'items':
      return []
    case 'number':
      return 0
    default:
      return ''
  }
}

function transformField(field: SourceField): DbField {
  const dbType = TYPE_MAP[field.type] || 'text'

  const transformed: DbField = {
    id: randomUUID(),
    type: dbType,
    name: field.name,
    value: getDefaultValue(field, dbType),
    config: {}
  }

  if (field.config) {
    transformed.config = { ...field.config }
    if (field.config.fields) {
      transformed.config.fields = field.config.fields.map(transformField)
    }
  }

  return transformed
}

function readComponent(dir: string, name: string) {
  const htmlPath = path.join(dir, `${name}.html`)
  const jsonPath = path.join(dir, `${name}.json`)

  const template = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf-8') : ''

  let fields: DbField[] = []
  if (fs.existsSync(jsonPath)) {
    try {
      const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      if (json.fields && Array.isArray(json.fields)) {
        fields = json.fields.map(transformField)
      }
    } catch {
      // Skip invalid JSON
    }
  }

  return { template, fields }
}

function getComponentNames(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''))
}

function loadManifest(themePath: string): Manifest {
  const manifestPath = path.join(themePath, 'manifest.json')
  if (fs.existsSync(manifestPath)) {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  }
  return {
    siteId: '',
    lastImport: '',
    components: { blocks: {}, partials: {} }
  }
}

function saveManifest(themePath: string, manifest: Manifest) {
  const manifestPath = path.join(themePath, 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
}

export async function importTheme(
  themePath: string,
  siteId: string,
  mongoUri: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    created: { blocks: [], partials: [] },
    updated: { blocks: [], partials: [] },
    skipped: { blocks: [], partials: [] },
    errors: []
  }

  // Connect to MongoDB
  await mongoose.connect(mongoUri)

  // Define schemas
  const partialSchema = new mongoose.Schema({
    name: String,
    site_id: String,
    template: String
  }, { timestamps: true })

  const blockSchema = new mongoose.Schema({
    name: String,
    site_id: String,
    template: String,
    fields: [mongoose.Schema.Types.Mixed]
  }, { timestamps: true })

  const siteSchema = new mongoose.Schema({
    partials: [{ _id: mongoose.Schema.Types.Mixed, name: String }],
    blocks: [{ _id: mongoose.Schema.Types.Mixed, name: String }]
  })

  const Partial = mongoose.models.Partial || mongoose.model('Partial', partialSchema)
  const Block = mongoose.models.Block || mongoose.model('Block', blockSchema)
  const Site = mongoose.models.Site || mongoose.model('Site', siteSchema)

  // Verify site exists
  const site = await Site.findById(siteId)
  if (!site) {
    await mongoose.disconnect()
    result.success = false
    result.errors.push({ component: '', type: 'site', error: `Site ${siteId} not found` })
    return result
  }

  const blocksDir = path.join(themePath, 'converted', 'blocks')
  const partialsDir = path.join(themePath, 'converted', 'partials')

  const partialNames = getComponentNames(partialsDir)
  const blockNames = getComponentNames(blocksDir)

  // Load manifest for tracking
  const manifest = loadManifest(themePath)
  manifest.siteId = siteId

  // Import partials
  for (const name of partialNames) {
    try {
      const existing = await Partial.findOne({ name, site_id: siteId })
      const { template } = readComponent(partialsDir, name)

      if (existing) {
        // Update existing
        existing.template = template
        await existing.save()
        result.updated.partials.push(name)
        manifest.components.partials[name] = {
          status: 'updated',
          id: existing._id.toString(),
          updatedAt: new Date().toISOString()
        }
      } else {
        // Create new
        const partial = new Partial({ name, site_id: siteId, template })
        await partial.save()

        await Site.findByIdAndUpdate(siteId, {
          $push: { partials: { _id: partial._id, name } }
        })

        result.created.partials.push(name)
        manifest.components.partials[name] = {
          status: 'created',
          id: partial._id.toString(),
          updatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      result.errors.push({ component: name, type: 'partial', error: String(error) })
      result.success = false
    }
  }

  // Import blocks
  for (const name of blockNames) {
    try {
      const existing = await Block.findOne({ name, site_id: siteId })
      const { template, fields } = readComponent(blocksDir, name)

      if (existing) {
        // Update existing
        existing.template = template
        existing.fields = fields
        await existing.save()
        result.updated.blocks.push(name)
        manifest.components.blocks[name] = {
          status: 'updated',
          id: existing._id.toString(),
          updatedAt: new Date().toISOString()
        }
      } else {
        // Create new
        const block = new Block({ name, site_id: siteId, template, fields })
        await block.save()

        await Site.findByIdAndUpdate(siteId, {
          $push: { blocks: { _id: block._id, name } }
        })

        result.created.blocks.push(name)
        manifest.components.blocks[name] = {
          status: 'created',
          id: block._id.toString(),
          updatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      result.errors.push({ component: name, type: 'block', error: String(error) })
      result.success = false
    }
  }

  // Save manifest
  manifest.lastImport = new Date().toISOString()
  saveManifest(themePath, manifest)

  await mongoose.disconnect()
  return result
}
