import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createLogger } from './logger.js'

describe('createLogger', () => {
  it('creates a logger with all methods', () => {
    const log = createLogger()
    assert.equal(typeof log.debug, 'function')
    assert.equal(typeof log.info, 'function')
    assert.equal(typeof log.warn, 'function')
    assert.equal(typeof log.error, 'function')
  })

  it('does not throw when logging', () => {
    const log = createLogger()
    assert.doesNotThrow(() => log.info('test'))
    assert.doesNotThrow(() => log.warn('test', { key: 'value' }))
    assert.doesNotThrow(() => log.error('test', { err: 'something' }))
  })

  it('creates verbose logger without error', () => {
    const log = createLogger({ verbose: true })
    assert.doesNotThrow(() => log.debug('debug message', { detail: 'x' }))
    assert.doesNotThrow(() => log.info('info', { data: [1, 2, 3] }))
  })
})
