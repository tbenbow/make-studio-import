import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { indexByName, groupByType } from './helpers.js'

describe('indexByName', () => {
  it('creates a Map keyed by name', () => {
    const items = [{ name: 'Hero', _id: '1' }, { name: 'Footer', _id: '2' }]
    const map = indexByName(items)
    assert.equal(map.size, 2)
    assert.equal(map.get('Hero')?._id, '1')
    assert.equal(map.get('Footer')?._id, '2')
  })

  it('returns empty Map for empty array', () => {
    const map = indexByName([])
    assert.equal(map.size, 0)
  })

  it('last item wins for duplicate names', () => {
    const items = [{ name: 'Hero', version: 1 }, { name: 'Hero', version: 2 }]
    const map = indexByName(items)
    assert.equal(map.size, 1)
    assert.equal((map.get('Hero') as { version: number }).version, 2)
  })
})

describe('groupByType', () => {
  it('groups items by their type property', () => {
    const items = [
      { type: 'create', name: 'A' },
      { type: 'update', name: 'B' },
      { type: 'create', name: 'C' },
      { type: 'delete', name: 'D' }
    ]
    const grouped = groupByType(items)
    assert.equal(grouped.create.length, 2)
    assert.equal(grouped.update.length, 1)
    assert.equal(grouped.delete.length, 1)
  })

  it('returns empty object for empty array', () => {
    const grouped = groupByType([])
    assert.deepEqual(grouped, {})
  })
})
