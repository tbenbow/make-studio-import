import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { validate } from './validate.js'

function createTempTheme(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ms-validate-'))
  fs.mkdirSync(path.join(dir, 'converted', 'blocks'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'converted', 'partials'), { recursive: true })
  return dir
}

function writeBlock(themePath: string, name: string, html: string, json: object) {
  const blocksDir = path.join(themePath, 'converted', 'blocks')
  fs.writeFileSync(path.join(blocksDir, `${name}.html`), html)
  fs.writeFileSync(path.join(blocksDir, `${name}.json`), JSON.stringify(json))
}

function writePartial(themePath: string, name: string, html: string) {
  const partialsDir = path.join(themePath, 'converted', 'partials')
  fs.writeFileSync(path.join(partialsDir, `${name}.html`), html)
}

describe('validate', () => {
  let themePath: string

  beforeEach(() => {
    themePath = createTempTheme()
  })

  afterEach(() => {
    fs.rmSync(themePath, { recursive: true, force: true })
  })

  it('returns valid for a correct theme', () => {
    writeBlock(themePath, 'Hero', '<section>{{title}}</section>', {
      fields: [{ type: 'text', name: 'title' }]
    })
    writePartial(themePath, 'Button', '<button>{{label}}</button>')

    const result = validate(themePath)
    assert.equal(result.valid, true)
    assert.equal(result.components.blocks, 1)
    assert.equal(result.components.partials, 1)
    assert.equal(result.errors.length, 0)
  })

  it('errors on empty HTML template', () => {
    writeBlock(themePath, 'Empty', '', {
      fields: [{ type: 'text', name: 'title' }]
    })

    const result = validate(themePath)
    assert.equal(result.valid, false)
    assert.ok(result.errors.some(e => e.message === 'Template is empty'))
  })

  it('errors on missing JSON file', () => {
    const blocksDir = path.join(themePath, 'converted', 'blocks')
    fs.writeFileSync(path.join(blocksDir, 'NoJson.html'), '<div>hello</div>')

    const result = validate(themePath)
    assert.equal(result.valid, false)
    assert.ok(result.errors.some(e => e.message === 'Missing .json file'))
  })

  it('errors on invalid JSON', () => {
    const blocksDir = path.join(themePath, 'converted', 'blocks')
    fs.writeFileSync(path.join(blocksDir, 'Bad.html'), '<div>hello</div>')
    fs.writeFileSync(path.join(blocksDir, 'Bad.json'), '{ invalid json }')

    const result = validate(themePath)
    assert.equal(result.valid, false)
    assert.ok(result.errors.some(e => e.message.startsWith('Invalid JSON:')))
  })

  it('errors on missing fields array', () => {
    writeBlock(themePath, 'NoFields', '<div>hello</div>', { description: 'test' })

    const result = validate(themePath)
    assert.equal(result.valid, false)
    assert.ok(result.errors.some(e => e.message === 'Missing or invalid fields array'))
  })

  it('errors on invalid field type', () => {
    writeBlock(themePath, 'BadType', '<div>hello</div>', {
      fields: [{ type: 'nonexistent', name: 'title' }]
    })

    const result = validate(themePath)
    assert.equal(result.valid, false)
    assert.ok(result.errors.some(e => e.message.includes("invalid type 'nonexistent'")))
  })

  it('errors on field missing name', () => {
    writeBlock(themePath, 'NoName', '<div>hello</div>', {
      fields: [{ type: 'text' }]
    })

    const result = validate(themePath)
    assert.equal(result.valid, false)
    assert.ok(result.errors.some(e => e.message.includes("missing 'name'")))
  })

  it('validates nested fields in items/repeater', () => {
    writeBlock(themePath, 'Nested', '<div>hello</div>', {
      fields: [{
        type: 'items',
        name: 'links',
        config: {
          fields: [{ type: 'badtype', name: 'url' }]
        }
      }]
    })

    const result = validate(themePath)
    assert.equal(result.valid, false)
    assert.ok(result.errors.some(e => e.message.includes("invalid type 'badtype'")))
  })

  it('warns on missing blocks directory', () => {
    const emptyTheme = fs.mkdtempSync(path.join(os.tmpdir(), 'ms-validate-empty-'))
    const result = validate(emptyTheme)
    assert.ok(result.warnings.some(w => w.file === 'converted/blocks'))
    fs.rmSync(emptyTheme, { recursive: true, force: true })
  })

  it('errors on empty partial template', () => {
    writePartial(themePath, 'Empty', '')

    const result = validate(themePath)
    assert.equal(result.valid, false)
    assert.ok(result.errors.some(e => e.file.includes('partials/') && e.message === 'Template is empty'))
  })

  it('warns on missing makeStudioFields flag', () => {
    writeBlock(themePath, 'NoFlag', '<div>hello</div>', {
      fields: [{ type: 'text', name: 'title' }]
    })

    const result = validate(themePath)
    assert.ok(result.warnings.some(w => w.message.includes('makeStudioFields')))
  })
})
