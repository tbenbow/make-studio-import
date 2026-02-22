import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseArgs } from './args.js'

describe('parseArgs', () => {
  it('parses --key=value pairs', () => {
    const args = parseArgs(['--theme=pirate-golf', '--apply=true'])
    assert.equal(args.theme, 'pirate-golf')
    assert.equal(args.apply, 'true')
  })

  it('parses bare --flag as true', () => {
    const args = parseArgs(['--apply', '--force'])
    assert.equal(args.apply, 'true')
    assert.equal(args.force, 'true')
  })

  it('handles values with equals signs', () => {
    const args = parseArgs(['--url=https://example.com/path?key=val'])
    assert.equal(args.url, 'https://example.com/path?key=val')
  })

  it('ignores non-flag arguments', () => {
    const args = parseArgs(['sync', '--theme=test', 'extra'])
    assert.equal(args.theme, 'test')
    assert.equal(args.sync, undefined)
    assert.equal(args.extra, undefined)
  })

  it('returns empty object for no arguments', () => {
    const args = parseArgs([])
    assert.deepEqual(args, {})
  })
})
