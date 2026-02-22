/**
 * Plugin System
 * Loads custom workflow plugins from ./plugins/ or ~/.make-studio/plugins/.
 */
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import type { CommandContext } from './commands/context.js'

export interface Plugin {
  name: string
  commands: Record<string, (ctx: CommandContext) => Promise<void>>
}

/**
 * Discover and load plugins from known directories.
 * Each plugin is a directory with an index.ts/index.js that exports a Plugin.
 */
export async function loadPlugins(rootDir: string): Promise<Plugin[]> {
  const plugins: Plugin[] = []
  const pluginDirs = [
    path.join(rootDir, 'plugins'),
    path.join(process.env.HOME || '~', '.make-studio', 'plugins')
  ]

  for (const dir of pluginDirs) {
    if (!fs.existsSync(dir)) continue

    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const pluginDir = path.join(dir, entry.name)
      const indexFile = fs.existsSync(path.join(pluginDir, 'index.ts'))
        ? path.join(pluginDir, 'index.ts')
        : fs.existsSync(path.join(pluginDir, 'index.js'))
          ? path.join(pluginDir, 'index.js')
          : null

      if (!indexFile) continue

      try {
        const mod = await import(pathToFileURL(indexFile).href)
        const plugin = mod.default as Plugin
        if (plugin?.name && plugin?.commands) {
          plugins.push(plugin)
        }
      } catch (err) {
        console.warn(`Failed to load plugin "${entry.name}":`, (err as Error).message)
      }
    }
  }

  return plugins
}

/**
 * Get all commands from loaded plugins, prefixed with plugin name.
 */
export function getPluginCommands(plugins: Plugin[]): Record<string, (ctx: CommandContext) => Promise<void>> {
  const commands: Record<string, (ctx: CommandContext) => Promise<void>> = {}
  for (const plugin of plugins) {
    for (const [name, handler] of Object.entries(plugin.commands)) {
      commands[`${plugin.name}:${name}`] = handler
      // Also register without prefix if no conflict
      if (!commands[name]) {
        commands[name] = handler
      }
    }
  }
  return commands
}
