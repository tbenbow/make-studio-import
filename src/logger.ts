/**
 * Structured Logger
 * Lightweight logging with context and verbose mode support.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

export interface LogContext {
  [key: string]: unknown
}

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
}

export function createLogger(opts?: { verbose?: boolean }): Logger {
  const minLevel: LogLevel = opts?.verbose ? 'debug' : 'info'

  function log(level: LogLevel, message: string, context?: LogContext) {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return

    const prefix = level === 'info' ? '' : `[${level.toUpperCase()}] `
    const line = `${prefix}${message}`

    if (level === 'error') {
      console.error(line)
    } else if (level === 'warn') {
      console.warn(line)
    } else {
      console.log(line)
    }

    if (context && opts?.verbose) {
      for (const [key, value] of Object.entries(context)) {
        const display = typeof value === 'string' ? value : JSON.stringify(value)
        console.log(`  ${key}: ${display}`)
      }
    }
  }

  return {
    debug: (msg, ctx) => log('debug', msg, ctx),
    info: (msg, ctx) => log('info', msg, ctx),
    warn: (msg, ctx) => log('warn', msg, ctx),
    error: (msg, ctx) => log('error', msg, ctx)
  }
}
