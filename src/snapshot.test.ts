import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { saveSnapshot, listSnapshots, loadSnapshot, type Snapshot } from './snapshot.js'

function createTempTheme(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ms-snapshot-'))
}

function makeSnapshot(overrides?: Partial<Snapshot>): Snapshot {
  return {
    siteId: 'site-123',
    capturedAt: new Date().toISOString(),
    theme: { colors: { primary: '#000' } },
    blocks: [
      {
        _id: 'block-1',
        name: 'Hero',
        template: '<section>{{title}}</section>',
        fields: [{ id: 'f1', type: 'text', name: 'title', value: '' }]
      }
    ],
    partials: [
      { _id: 'partial-1', name: 'Button', template: '<button>{{label}}</button>' }
    ],
    ...overrides
  }
}

describe('saveSnapshot', () => {
  let themePath: string

  beforeEach(() => { themePath = createTempTheme() })
  afterEach(() => { fs.rmSync(themePath, { recursive: true, force: true }) })

  it('creates snapshots directory if missing', () => {
    const snapshot = makeSnapshot()
    const filepath = saveSnapshot(themePath, snapshot)
    assert.ok(fs.existsSync(filepath))
    assert.ok(filepath.endsWith('.json'))
  })

  it('saves snapshot data as valid JSON', () => {
    const snapshot = makeSnapshot()
    const filepath = saveSnapshot(themePath, snapshot)
    const loaded = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
    assert.equal(loaded.siteId, 'site-123')
    assert.equal(loaded.blocks.length, 1)
    assert.equal(loaded.blocks[0].name, 'Hero')
  })

  it('creates unique filenames for multiple snapshots', async () => {
    const s1 = saveSnapshot(themePath, makeSnapshot())
    // Wait to ensure different timestamp in filename
    await new Promise(resolve => setTimeout(resolve, 10))
    const s2 = saveSnapshot(themePath, makeSnapshot())
    assert.notEqual(s1, s2)
  })
})

describe('listSnapshots', () => {
  let themePath: string

  beforeEach(() => { themePath = createTempTheme() })
  afterEach(() => { fs.rmSync(themePath, { recursive: true, force: true }) })

  it('returns empty array when no snapshots directory', () => {
    const result = listSnapshots(themePath)
    assert.deepEqual(result, [])
  })

  it('returns snapshot filenames in reverse order (newest first)', async () => {
    saveSnapshot(themePath, makeSnapshot())
    // Wait a tick to ensure different timestamp in filename
    await new Promise(resolve => setTimeout(resolve, 10))
    saveSnapshot(themePath, makeSnapshot())

    const list = listSnapshots(themePath)
    assert.equal(list.length, 2)
    assert.ok(list.every(f => f.endsWith('.json')))
    // Newest should be first (reverse sorted)
    assert.ok(list[0] >= list[1])
  })

  it('ignores non-JSON files', () => {
    saveSnapshot(themePath, makeSnapshot())
    fs.writeFileSync(path.join(themePath, 'snapshots', 'notes.txt'), 'ignore me')

    const list = listSnapshots(themePath)
    assert.equal(list.length, 1)
    assert.ok(list[0].endsWith('.json'))
  })
})

describe('loadSnapshot', () => {
  let themePath: string

  beforeEach(() => { themePath = createTempTheme() })
  afterEach(() => { fs.rmSync(themePath, { recursive: true, force: true }) })

  it('loads a saved snapshot correctly', () => {
    const original = makeSnapshot()
    saveSnapshot(themePath, original)

    const list = listSnapshots(themePath)
    const loaded = loadSnapshot(themePath, list[0])

    assert.equal(loaded.siteId, original.siteId)
    assert.equal(loaded.blocks.length, 1)
    assert.equal(loaded.blocks[0].name, 'Hero')
    assert.equal(loaded.partials.length, 1)
    assert.equal(loaded.partials[0].name, 'Button')
  })

  it('throws on missing snapshot file', () => {
    assert.throws(() => loadSnapshot(themePath, 'nonexistent.json'))
  })
})
