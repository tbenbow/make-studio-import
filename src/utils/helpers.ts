/**
 * Shared helper functions.
 */

/**
 * Index an array of named items into a Map keyed by name.
 */
export function indexByName<T extends { name: string }>(items: T[]): Map<string, T> {
  return new Map(items.map(item => [item.name, item]))
}

/**
 * Group items by their `type` property.
 */
export function groupByType<T extends { type: string }>(items: T[]): Record<string, T[]> {
  const result: Record<string, T[]> = {}
  for (const item of items) {
    (result[item.type] ??= []).push(item)
  }
  return result
}
