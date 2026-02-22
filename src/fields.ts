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

/**
 * Compute the default/initial value for a field.
 *
 * - If an explicit `default` is set on the source field, use it.
 *   For `items` type with array defaults, each item gets a fresh UUID `id`.
 * - Otherwise: `items` → `[]`, `number` → `0`, everything else → `''`.
 *
 * @example
 *   getDefaultValue({ type: 'text', name: 'title' }, 'text')  // ''
 *   getDefaultValue({ type: 'text', name: 'title', default: 'Hello' }, 'text')  // 'Hello'
 *   getDefaultValue({ type: 'items', name: 'links', default: [{ url: '/' }] }, 'items')
 *   // [{ id: '<uuid>', url: '/' }]
 */
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

/**
 * Transform a source field definition (from JSON files) to API/database format.
 *
 * Source format (what developers write):
 *   `{ type: 'richText', name: 'body', default: '<p>Hello</p>' }`
 *
 * API format (what the database stores):
 *   `{ id: '<uuid>', type: 'wysiwyg', name: 'body', value: '<p>Hello</p>', config: {} }`
 *
 * Type aliases are resolved via TYPE_MAP (e.g. `richText` → `wysiwyg`, `repeater` → `items`).
 * Nested `config.fields` (for items/repeater) are recursively transformed.
 *
 * @example
 *   transformField({ type: 'text', name: 'heading' })
 *   // { id: '<uuid>', type: 'text', name: 'heading', value: '', config: {} }
 *
 *   transformField({ type: 'items', name: 'links', config: { fields: [{ type: 'text', name: 'url' }] } })
 *   // { id: '<uuid>', type: 'items', name: 'links', value: [], config: { fields: [<transformed>] } }
 */
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

/**
 * Reverse-transform an API/database field back to source format (for `pull`).
 *
 * API format (input):
 *   `{ id: '<uuid>', type: 'wysiwyg', name: 'body', value: '<p>Hello</p>', config: {} }`
 *
 * Source format (output):
 *   `{ type: 'wysiwyg', name: 'body', default: '<p>Hello</p>' }`
 *
 * - The `id` and `_id` are stripped (volatile, regenerated each transform).
 * - `value` becomes `default` (omitted if empty string or undefined).
 * - For `items` type: `id`/`_id` are stripped from each value item,
 *   and `config.fields` are recursively reversed.
 * - Empty `config` objects are omitted entirely.
 *
 * @example
 *   reverseField({ id: 'abc', type: 'text', name: 'heading', value: 'Hello', config: {} })
 *   // { type: 'text', name: 'heading', default: 'Hello' }
 *
 *   reverseField({ id: 'abc', type: 'items', name: 'links', value: [{ id: 'x', url: '/' }], config: { fields: [...] } })
 *   // { type: 'items', name: 'links', default: [{ url: '/' }], config: { fields: [<reversed>] } }
 */
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
