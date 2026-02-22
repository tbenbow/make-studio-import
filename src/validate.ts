import fs from 'fs'
import path from 'path'
import type { ValidationResult, SourceField } from './types.js'

const VALID_FIELD_TYPES = ['text', 'textarea', 'wysiwyg', 'richText', 'image', 'items', 'repeater', 'select', 'toggle', 'group', 'number', 'date']

/**
 * Lint a Handlebars template for common syntax issues.
 * Returns an array of warning messages.
 */
export function lintTemplate(template: string): string[] {
  const warnings: string[] = []

  // Check for unmatched opening/closing block helpers
  const openBlocks = template.match(/\{\{#(\w+)/g) || []
  const closeBlocks = template.match(/\{\{\/(\w+)/g) || []

  const openCounts: Record<string, number> = {}
  const closeCounts: Record<string, number> = {}

  for (const m of openBlocks) {
    const name = m.replace('{{#', '')
    openCounts[name] = (openCounts[name] || 0) + 1
  }
  for (const m of closeBlocks) {
    const name = m.replace('{{/', '')
    closeCounts[name] = (closeCounts[name] || 0) + 1
  }

  for (const name of new Set([...Object.keys(openCounts), ...Object.keys(closeCounts)])) {
    const opens = openCounts[name] || 0
    const closes = closeCounts[name] || 0
    if (opens > closes) {
      warnings.push(`Unclosed {{#${name}}} block (${opens} opens, ${closes} closes)`)
    } else if (closes > opens) {
      warnings.push(`Extra {{/${name}}} without matching {{#${name}}} (${opens} opens, ${closes} closes)`)
    }
  }

  // Check for unclosed expressions ({{ without }})
  const unclosed = template.match(/\{\{(?![\s\S]*?\}\})/g)
  if (unclosed) {
    warnings.push('Possibly unclosed Handlebars expression ({{ without matching }})')
  }

  return warnings
}

/**
 * Find all blocks that reference a given partial via {{> partialName}}.
 */
export function findPartialReferences(blocksDir: string, partialName: string): string[] {
  const references: string[] = []
  if (!fs.existsSync(blocksDir)) return references

  for (const file of fs.readdirSync(blocksDir).filter(f => f.endsWith('.html'))) {
    const blockName = file.replace('.html', '')
    const template = fs.readFileSync(path.join(blocksDir, file), 'utf-8')
    if (template.includes(`{{> ${partialName}}}`) || template.includes(`{{>${partialName}}`)) {
      references.push(blockName)
    }
  }
  return references
}

/**
 * Build a dependency map: partial name → list of blocks that use it.
 */
export function buildPartialDependencyMap(blocksDir: string, partialsDir: string): Map<string, string[]> {
  const map = new Map<string, string[]>()
  if (!fs.existsSync(partialsDir)) return map

  const partialNames = fs.readdirSync(partialsDir)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''))

  for (const partialName of partialNames) {
    const refs = findPartialReferences(blocksDir, partialName)
    if (refs.length > 0) {
      map.set(partialName, refs)
    }
  }
  return map
}

function validateFieldSchema(fields: SourceField[], filePath: string): string[] {
  const errors: string[] = []

  for (const field of fields) {
    if (!field.name) {
      errors.push(`Field missing 'name' property`)
    }
    if (!field.type) {
      errors.push(`Field '${field.name}' missing 'type' property`)
    } else if (!VALID_FIELD_TYPES.includes(field.type)) {
      errors.push(`Field '${field.name}' has invalid type '${field.type}'`)
    }

    // Check nested fields for items/repeater
    if ((field.type === 'items' || field.type === 'repeater') && field.config?.fields) {
      errors.push(...validateFieldSchema(field.config.fields, filePath))
    }
  }

  return errors
}

export function validate(themePath: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    components: { blocks: 0, partials: 0 },
    errors: [],
    warnings: []
  }

  const blocksDir = path.join(themePath, 'converted', 'blocks')
  const partialsDir = path.join(themePath, 'converted', 'partials')

  // Check directories exist
  if (!fs.existsSync(blocksDir)) {
    result.warnings.push({ file: 'converted/blocks', message: 'Directory does not exist' })
  }
  if (!fs.existsSync(partialsDir)) {
    result.warnings.push({ file: 'converted/partials', message: 'Directory does not exist' })
  }

  // Validate blocks
  if (fs.existsSync(blocksDir)) {
    const htmlFiles = fs.readdirSync(blocksDir).filter(f => f.endsWith('.html'))
    result.components.blocks = htmlFiles.length

    for (const htmlFile of htmlFiles) {
      const name = htmlFile.replace('.html', '')
      const jsonPath = path.join(blocksDir, `${name}.json`)
      const htmlPath = path.join(blocksDir, htmlFile)

      // Check HTML exists and is not empty
      const htmlContent = fs.readFileSync(htmlPath, 'utf-8')
      if (!htmlContent.trim()) {
        result.errors.push({ file: `blocks/${htmlFile}`, message: 'Template is empty' })
        result.valid = false
      } else {
        // Lint Handlebars syntax
        const templateWarnings = lintTemplate(htmlContent)
        for (const w of templateWarnings) {
          result.warnings.push({ file: `blocks/${htmlFile}`, message: w })
        }
      }

      // Check JSON exists
      if (!fs.existsSync(jsonPath)) {
        result.errors.push({ file: `blocks/${name}`, message: 'Missing .json file' })
        result.valid = false
        continue
      }

      // Validate JSON
      try {
        const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

        if (!json.makeStudioFields) {
          result.warnings.push({ file: `blocks/${name}.json`, message: 'Missing makeStudioFields: true' })
        }

        if (!json.fields || !Array.isArray(json.fields)) {
          result.errors.push({ file: `blocks/${name}.json`, message: 'Missing or invalid fields array' })
          result.valid = false
        } else {
          const fieldErrors = validateFieldSchema(json.fields, `blocks/${name}.json`)
          for (const err of fieldErrors) {
            result.errors.push({ file: `blocks/${name}.json`, message: err })
            result.valid = false
          }
        }
      } catch (e) {
        result.errors.push({ file: `blocks/${name}.json`, message: `Invalid JSON: ${(e as Error).message}` })
        result.valid = false
      }
    }
  }

  // Validate partials (simpler - just need HTML)
  if (fs.existsSync(partialsDir)) {
    const htmlFiles = fs.readdirSync(partialsDir).filter(f => f.endsWith('.html'))
    result.components.partials = htmlFiles.length

    for (const htmlFile of htmlFiles) {
      const htmlPath = path.join(partialsDir, htmlFile)
      const htmlContent = fs.readFileSync(htmlPath, 'utf-8')

      if (!htmlContent.trim()) {
        result.errors.push({ file: `partials/${htmlFile}`, message: 'Template is empty' })
        result.valid = false
      } else {
        const templateWarnings = lintTemplate(htmlContent)
        for (const w of templateWarnings) {
          result.warnings.push({ file: `partials/${htmlFile}`, message: w })
        }
      }
    }
  }

  return result
}
