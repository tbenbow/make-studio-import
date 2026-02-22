/**
 * Configuration file support.
 * Reads .make-studio.json for multi-environment site configs.
 */
import fs from 'fs'
import path from 'path'

export interface SiteConfig {
  url: string
  token: string
  siteId: string
}

export interface StudioConfig {
  sites: Record<string, SiteConfig>
  defaultSite?: string
}

/**
 * Load configuration from .make-studio.json if it exists.
 * Returns null if no config file found.
 */
export function loadConfig(rootDir: string): StudioConfig | null {
  const configPath = path.join(rootDir, '.make-studio.json')
  if (!fs.existsSync(configPath)) return null

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } catch {
    return null
  }
}

/**
 * Resolve API config from --env flag, .make-studio.json, or environment variables.
 * Priority: --env flag → config file defaultSite → env vars.
 */
export function resolveApiConfig(
  rootDir: string,
  envName?: string
): { baseUrl: string; token: string; siteId: string } | null {
  const config = loadConfig(rootDir)
  if (!config) return null

  const siteName = envName || config.defaultSite
  if (!siteName) return null

  const site = config.sites[siteName]
  if (!site) return null

  return {
    baseUrl: site.url,
    token: site.token,
    siteId: site.siteId
  }
}
