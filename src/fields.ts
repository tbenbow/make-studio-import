/**
 * Field Transform / Reverse Logic
 * Converts between source format (JSON files) and API format (database fields).
 */
import { randomUUID } from 'crypto'
import type { SourceField } from './types.js'

// ─── Field type mapping ───

export const TYPE_MAP: Record<string, string> = {
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

export function getDefaultValue(field: SourceField, dbType: string): unknown {
  if (field.default !== undefined) {
    if (dbType === 'items' && Array.isArray(field.default)) {
      return (field.default as Record<string, unknown>[]).map((item) => {
        const transformedItem: Record<string, unknown> = { id: randomUUID() }
        for (const [key, value] of Object.entries(item)) {
          transformedItem[key] = value
        }
        return transformedItem
      })
    }
    return field.default
  }
  switch (dbType) {
    case 'items': return []
    case 'number': return 0
    default: return ''
  }
}

export function transformField(field: SourceField): unknown {
  const dbType = TYPE_MAP[field.type] || 'text'
  const transformed: Record<string, unknown> = {
    id: randomUUID(),
    type: dbType,
    name: field.name,
    value: getDefaultValue(field, dbType),
    config: {}
  }
  if (field.config) {
    transformed.config = { ...field.config }
    if (field.config.fields) {
      (transformed.config as Record<string, unknown>).fields = field.config.fields.map(transformField)
    }
  }
  return transformed
}

// ─── Reverse field mapping (API → source format for pull) ───

export function reverseField(field: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    type: field.type as string,
    name: field.name as string
  }

  const value = field.value
  if (field.type === 'items' && Array.isArray(value)) {
    // Convert items value — strip volatile ids from items
    result.default = (value as Record<string, unknown>[]).map(item => {
      const { id, _id, ...rest } = item
      return rest
    })
    // Convert config.fields back to source format, preserve other config keys
    const config = field.config as Record<string, unknown> | undefined
    if (config?.fields && Array.isArray(config.fields)) {
      const { fields: configFields, ...otherConfig } = config
      result.config = {
        ...otherConfig,
        fields: (configFields as Record<string, unknown>[]).map(f => reverseField(f))
      }
    }
  } else {
    if (value !== undefined && value !== '') {
      result.default = value
    }
    // Preserve non-empty config (selectOptions, image settings, etc.)
    const config = field.config as Record<string, unknown> | undefined
    if (config && Object.keys(config).length > 0) {
      result.config = config
    }
  }

  return result
}
