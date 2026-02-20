import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeTemplate,
  isDifferent,
  stripFieldVolatile,
  diffBlocks,
  diffPartials,
  computeChangeset
} from './diff.js'
import type { ApiBlock, ApiPartial } from './api.js'
import type { LocalBlock, LocalPartial } from './diff.js'

describe('normalizeTemplate', () => {
  it('normalizes self-closing tags', () => {
    assert.equal(normalizeTemplate('<img src="a" />'), '<img src="a">')
    assert.equal(normalizeTemplate('<br />'), '<br>')
  })

  it('trims trailing whitespace per line', () => {
    assert.equal(normalizeTemplate('hello   \nworld  '), 'hello\nworld')
  })

  it('normalizes CRLF to LF', () => {
    assert.equal(normalizeTemplate('a\r\nb'), 'a\nb')
  })

  it('decodes HTML entities', () => {
    assert.equal(normalizeTemplate('&ldquo;hello&rdquo;'), '\u201chello\u201d')
    assert.equal(normalizeTemplate('&lsquo;hi&rsquo;'), '\u2018hi\u2019')
    assert.equal(normalizeTemplate('one &mdash; two'), 'one \u2014 two')
    assert.equal(normalizeTemplate('one &ndash; two'), 'one \u2013 two')
    assert.equal(normalizeTemplate('a &amp; b'), 'a & b')
  })

  it('collapses empty elements', () => {
    assert.equal(normalizeTemplate('<div class="foo"></div>'), '<div class="foo">')
  })

  it('trims surrounding whitespace', () => {
    assert.equal(normalizeTemplate('  <p>hello</p>  '), '<p>hello</p>')
  })
})

describe('isDifferent', () => {
  it('returns false for identical primitives', () => {
    assert.equal(isDifferent('a', 'a'), false)
    assert.equal(isDifferent(1, 1), false)
    assert.equal(isDifferent(true, true), false)
    assert.equal(isDifferent(null, null), false)
    assert.equal(isDifferent(undefined, undefined), false)
  })

  it('returns true for different primitives', () => {
    assert.equal(isDifferent('a', 'b'), true)
    assert.equal(isDifferent(1, 2), true)
    assert.equal(isDifferent(null, undefined), true)
  })

  it('returns true for different types', () => {
    assert.equal(isDifferent('1', 1), true)
    assert.equal(isDifferent(null, ''), true)
  })

  it('compares objects by JSON equality', () => {
    assert.equal(isDifferent({ a: 1 }, { a: 1 }), false)
    assert.equal(isDifferent({ a: 1 }, { a: 2 }), true)
    assert.equal(isDifferent({ a: 1 }, { a: 1, b: 2 }), true)
  })

  it('compares arrays by JSON equality', () => {
    assert.equal(isDifferent([1, 2], [1, 2]), false)
    assert.equal(isDifferent([1, 2], [2, 1]), true)
    assert.equal(isDifferent([1], [1, 2]), true)
  })
})

describe('stripFieldVolatile', () => {
  it('strips id and _id from fields', () => {
    const fields = [
      { id: 'abc', _id: 'def', type: 'text', name: 'title', value: 'Hello' }
    ]
    const result = stripFieldVolatile(fields) as Record<string, unknown>[]
    assert.equal(result[0].id, undefined)
    assert.equal(result[0]._id, undefined)
    assert.equal(result[0].name, 'title')
    assert.equal(result[0].value, 'Hello')
  })

  it('strips ids from items-type value arrays', () => {
    const fields = [
      { id: 'abc', type: 'items', name: 'list', value: [{ id: 'x', title: 'A' }], config: {} }
    ]
    const result = stripFieldVolatile(fields) as Record<string, unknown>[]
    const value = result[0].value as Record<string, unknown>[]
    assert.equal(value[0].id, undefined)
    assert.equal(value[0].title, 'A')
  })

  it('strips empty config objects', () => {
    const fields = [
      { id: 'abc', type: 'text', name: 'title', value: '', config: {} }
    ]
    const result = stripFieldVolatile(fields) as Record<string, unknown>[]
    assert.equal(result[0].config, undefined)
  })

  it('recurses into config.fields', () => {
    const fields = [
      {
        id: 'abc', type: 'items', name: 'cards', value: [],
        config: {
          fields: [
            { id: 'nested', type: 'text', name: 'title', value: '', config: {} }
          ]
        }
      }
    ]
    const result = stripFieldVolatile(fields) as Record<string, unknown>[]
    const config = result[0].config as Record<string, unknown>
    const nestedFields = config.fields as Record<string, unknown>[]
    assert.equal(nestedFields[0].id, undefined)
    assert.equal(nestedFields[0].name, 'title')
    // Nested empty config should also be stripped
    assert.equal(nestedFields[0].config, undefined)
  })
})

describe('diffBlocks', () => {
  const makeRemote = (overrides: Partial<ApiBlock> = {}): ApiBlock => ({
    _id: 'remote-1',
    name: 'Hero',
    template: '<div>hero</div>',
    fields: [],
    ...overrides
  })

  const makeLocal = (overrides: Partial<LocalBlock> = {}): LocalBlock => ({
    name: 'Hero',
    template: '<div>hero</div>',
    fields: [],
    ...overrides
  })

  it('detects create (local only)', () => {
    const changes = diffBlocks([makeLocal({ name: 'NewBlock' })], [])
    assert.equal(changes.length, 1)
    assert.equal(changes[0].type, 'create')
    assert.equal(changes[0].name, 'NewBlock')
  })

  it('detects delete (remote only)', () => {
    const changes = diffBlocks([], [makeRemote({ name: 'OldBlock' })])
    assert.equal(changes.length, 1)
    assert.equal(changes[0].type, 'delete')
    assert.equal(changes[0].name, 'OldBlock')
  })

  it('detects no changes when identical', () => {
    const changes = diffBlocks([makeLocal()], [makeRemote()])
    assert.equal(changes.length, 0)
  })

  it('detects template change', () => {
    const changes = diffBlocks(
      [makeLocal({ template: '<div>new</div>' })],
      [makeRemote({ template: '<div>old</div>' })]
    )
    assert.equal(changes.length, 1)
    assert.equal(changes[0].type, 'update')
    assert.ok(changes[0].changes!.includes('template'))
  })

  it('detects field change', () => {
    const changes = diffBlocks(
      [makeLocal({ fields: [{ type: 'text', name: 'title', value: '', config: {} }] })],
      [makeRemote({ fields: [{ id: 'x', type: 'text', name: 'heading', value: '', config: {} }] })]
    )
    assert.equal(changes.length, 1)
    assert.equal(changes[0].type, 'update')
    assert.ok(changes[0].changes!.includes('fields'))
  })

  it('detects description change', () => {
    const changes = diffBlocks(
      [makeLocal({ description: 'New desc' })],
      [makeRemote({ description: 'Old desc' })]
    )
    assert.equal(changes.length, 1)
    assert.ok(changes[0].changes!.includes('description'))
  })
})

describe('diffPartials', () => {
  it('detects create, update, delete', () => {
    const local: LocalPartial[] = [
      { name: 'Button', template: '<button>NEW</button>' },
      { name: 'NewPartial', template: '<span>new</span>' }
    ]
    const remote: ApiPartial[] = [
      { _id: 'r1', name: 'Button', template: '<button>OLD</button>' },
      { _id: 'r2', name: 'OldPartial', template: '<span>old</span>' }
    ]
    const changes = diffPartials(local, remote)
    const create = changes.find(c => c.type === 'create')
    const update = changes.find(c => c.type === 'update')
    const del = changes.find(c => c.type === 'delete')
    assert.equal(create!.name, 'NewPartial')
    assert.equal(update!.name, 'Button')
    assert.equal(del!.name, 'OldPartial')
  })
})

describe('computeChangeset', () => {
  it('combines blocks, partials, and theme changes', () => {
    const changeset = computeChangeset(
      [{ name: 'Hero', template: '<div>', fields: [] }],
      [],
      [{ name: 'Button', template: '<btn>' }],
      [],
      { colors: { primary: '#000' } },
      { colors: { primary: '#fff' } }
    )
    assert.equal(changeset.blocks.length, 1)
    assert.equal(changeset.blocks[0].type, 'create')
    assert.equal(changeset.partials.length, 1)
    assert.equal(changeset.partials[0].type, 'create')
    assert.ok(changeset.themeChanges.length > 0)
  })

  it('returns empty themeChanges when themes are null', () => {
    const changeset = computeChangeset([], [], [], [], null, null)
    assert.deepEqual(changeset.themeChanges, [])
  })
})
