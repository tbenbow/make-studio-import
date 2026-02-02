import fs from 'fs'
import path from 'path'
import type { ValidationResult, SourceField } from './types.js'

const VALID_FIELD_TYPES = ['text', 'textarea', 'wysiwyg', 'richText', 'image', 'items', 'repeater', 'select', 'toggle', 'group', 'number', 'date']

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
        result.errors.push({ file: `blocks/${name}.json`, message: `Invalid JSON: ${e}` })
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
      }
    }
  }

  return result
}
