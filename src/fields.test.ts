import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { TYPE_MAP, getDefaultValue, transformField, reverseField } from './fields.js'
import type { SourceField } from './types.js'

describe('TYPE_MAP', () => {
  it('maps standard types', () => {
    assert.equal(TYPE_MAP['text'], 'text')
    assert.equal(TYPE_MAP['image'], 'image')
    assert.equal(TYPE_MAP['items'], 'items')
    assert.equal(TYPE_MAP['number'], 'number')
  })

  it('maps aliases', () => {
    assert.equal(TYPE_MAP['richText'], 'wysiwyg')
    assert.equal(TYPE_MAP['repeater'], 'items')
    assert.equal(TYPE_MAP['toggle'], 'select')
  })
})

describe('getDefaultValue', () => {
  it('returns explicit default for text', () => {
    const field: SourceField = { type: 'text', name: 'title', default: 'Hello' }
    assert.equal(getDefaultValue(field, 'text'), 'Hello')
  })

  it('returns empty string for text with no default', () => {
    const field: SourceField = { type: 'text', name: 'title' }
    assert.equal(getDefaultValue(field, 'text'), '')
  })

  it('returns 0 for number with no default', () => {
    const field: SourceField = { type: 'number', name: 'count' }
    assert.equal(getDefaultValue(field, 'number'), 0)
  })

  it('returns empty array for items with no default', () => {
    const field: SourceField = { type: 'items', name: 'list' }
    assert.deepEqual(getDefaultValue(field, 'items'), [])
  })

  it('adds UUIDs to items defaults', () => {
    const field: SourceField = {
      type: 'items',
      name: 'list',
      default: [{ title: 'A' }, { title: 'B' }]
    }
    const result = getDefaultValue(field, 'items') as Record<string, unknown>[]
    assert.equal(result.length, 2)
    assert.equal(result[0].title, 'A')
    assert.equal(result[1].title, 'B')
    assert.ok(typeof result[0].id === 'string')
    assert.ok(typeof result[1].id === 'string')
    assert.notEqual(result[0].id, result[1].id)
  })
})

describe('transformField', () => {
  it('transforms a basic text field', () => {
    const field: SourceField = { type: 'text', name: 'heading' }
    const result = transformField(field) as Record<string, unknown>
    assert.equal(result.type, 'text')
    assert.equal(result.name, 'heading')
    assert.equal(result.value, '')
    assert.ok(typeof result.id === 'string')
    assert.deepEqual(result.config, {})
  })

  it('transforms an image field', () => {
    const field: SourceField = { type: 'image', name: 'photo', default: '/img.jpg' }
    const result = transformField(field) as Record<string, unknown>
    assert.equal(result.type, 'image')
    assert.equal(result.value, '/img.jpg')
  })

  it('transforms items/repeater with config.fields', () => {
    const field: SourceField = {
      type: 'items',
      name: 'cards',
      config: {
        fields: [
          { type: 'text', name: 'title' },
          { type: 'image', name: 'icon' }
        ]
      }
    }
    const result = transformField(field) as Record<string, unknown>
    assert.equal(result.type, 'items')
    const config = result.config as Record<string, unknown>
    const fields = config.fields as Record<string, unknown>[]
    assert.equal(fields.length, 2)
    assert.equal(fields[0].name, 'title')
    assert.equal(fields[1].name, 'icon')
  })

  it('falls back to text for unknown type', () => {
    const field: SourceField = { type: 'unknown_type', name: 'mystery' }
    const result = transformField(field) as Record<string, unknown>
    assert.equal(result.type, 'text')
  })

  it('preserves non-fields config keys', () => {
    const field: SourceField = {
      type: 'select',
      name: 'color',
      config: { selectOptions: [{ key: 'red', value: 'Red' }] }
    }
    const result = transformField(field) as Record<string, unknown>
    const config = result.config as Record<string, unknown>
    assert.deepEqual(config.selectOptions, [{ key: 'red', value: 'Red' }])
  })
})

describe('reverseField', () => {
  it('reverses a text field', () => {
    const apiField = { id: '123', type: 'text', name: 'heading', value: 'Hello', config: {} }
    const result = reverseField(apiField)
    assert.equal(result.type, 'text')
    assert.equal(result.name, 'heading')
    assert.equal(result.default, 'Hello')
  })

  it('omits default for empty string value', () => {
    const apiField = { id: '123', type: 'text', name: 'heading', value: '', config: {} }
    const result = reverseField(apiField)
    assert.equal(result.default, undefined)
  })

  it('reverses an items field with nested config.fields', () => {
    const apiField = {
      id: '123',
      type: 'items',
      name: 'cards',
      value: [
        { id: 'a', _id: 'b', title: 'Card 1' },
        { id: 'c', title: 'Card 2' }
      ],
      config: {
        fields: [
          { id: 'f1', type: 'text', name: 'title', value: '', config: {} }
        ]
      }
    }
    const result = reverseField(apiField)
    assert.equal(result.type, 'items')
    // Default items should have IDs stripped
    const defaults = result.default as Record<string, unknown>[]
    assert.equal(defaults.length, 2)
    assert.equal(defaults[0].id, undefined)
    assert.equal(defaults[0]._id, undefined)
    assert.equal(defaults[0].title, 'Card 1')
    // Config fields should be reversed recursively
    const config = result.config as Record<string, unknown>
    const fields = config.fields as Record<string, unknown>[]
    assert.equal(fields.length, 1)
    assert.equal(fields[0].type, 'text')
    assert.equal(fields[0].name, 'title')
  })

  it('preserves non-empty config on non-items fields', () => {
    const apiField = {
      id: '123',
      type: 'select',
      name: 'color',
      value: 'red',
      config: { selectOptions: [{ key: 'red', value: 'Red' }] }
    }
    const result = reverseField(apiField)
    assert.deepEqual(result.config, { selectOptions: [{ key: 'red', value: 'Red' }] })
  })

  it('omits empty config', () => {
    const apiField = { id: '123', type: 'text', name: 'heading', value: 'Hi', config: {} }
    const result = reverseField(apiField)
    assert.equal(result.config, undefined)
  })
})

describe('round-trip: transformField → reverseField', () => {
  it('preserves structure for a text field', () => {
    const source: SourceField = { type: 'text', name: 'heading', default: 'Hello World' }
    const transformed = transformField(source) as Record<string, unknown>
    const reversed = reverseField(transformed)
    assert.equal(reversed.type, 'text')
    assert.equal(reversed.name, 'heading')
    assert.equal(reversed.default, 'Hello World')
  })

  it('preserves structure for items with config.fields', () => {
    const source: SourceField = {
      type: 'items',
      name: 'features',
      default: [{ title: 'Fast' }],
      config: {
        fields: [{ type: 'text', name: 'title' }]
      }
    }
    const transformed = transformField(source) as Record<string, unknown>
    const reversed = reverseField(transformed)
    assert.equal(reversed.type, 'items')
    assert.equal(reversed.name, 'features')
    const defaults = reversed.default as Record<string, unknown>[]
    assert.equal(defaults[0].title, 'Fast')
    const config = reversed.config as Record<string, unknown>
    const fields = config.fields as Record<string, unknown>[]
    assert.equal(fields[0].type, 'text')
    assert.equal(fields[0].name, 'title')
  })
})
