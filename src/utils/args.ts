/**
 * Shared argument parsing for CLI and scripts.
 */

export function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=')
      if (eq > -1) {
        result[arg.slice(2, eq)] = arg.slice(eq + 1)
      } else {
        result[arg.slice(2)] = 'true'
      }
    }
  }
  return result
}
