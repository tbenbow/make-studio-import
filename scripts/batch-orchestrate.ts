#!/usr/bin/env npx tsx
/**
 * Batch Site Conversion Orchestrator
 *
 * Reads batch-manifest.json, creates Make Studio sites, spawns Claude Code
 * subprocesses for each site, and monitors heartbeats.
 *
 * Usage:
 *   npx tsx scripts/batch-orchestrate.ts [--manifest=path] [--resume]
 */

import { spawn, type ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import { MakeStudioClient } from '../src/api.js'

// ─── Types ───

interface ManifestSite {
  id: string
  name: string
  sourceUrl: string
  pages: Array<{ path: string; name: string; isHome?: boolean }>
}

interface Manifest {
  concurrency: number
  stuckTimeout: number
  maxRetries: number
  sites: ManifestSite[]
}

interface SiteConfig {
  siteId: string
  apiToken: string
  name: string
  sourceUrl: string
  pages: Array<{ path: string; name: string; isHome?: boolean }>
}

interface Heartbeat {
  phase: number
  phaseName: string
  timestamp: string
  detail?: string
}

interface ManifestState {
  [siteId: string]: 'pending' | 'in-progress' | 'done' | 'failed' | 'stuck'
}

interface SiteResult {
  status: 'done' | 'failed' | 'stuck'
  previewUrl?: string
  blocks?: number
  pages?: number
  iterationCount?: number
  errors?: string[]
}

// ─── Constants ───

const STATE_DIR = path.resolve('.batch-state')
const MANIFEST_STATE_FILE = path.join(STATE_DIR, 'manifest-state.json')
const LEARNINGS_FILE = path.join(STATE_DIR, 'learnings.md')

// ─── Helpers ───

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

function writeJson(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

function logSite(siteId: string, msg: string): void {
  log(`[${siteId}] ${msg}`)
}

// ─── Create site via API ───

async function createSiteForManifest(client: MakeStudioClient, site: ManifestSite): Promise<SiteConfig> {
  const result = await client.createSite(`Batch: ${site.name}`)
  return {
    siteId: result._id,
    apiToken: result.apiToken || '',
    name: site.name,
    sourceUrl: site.sourceUrl,
    pages: site.pages
  }
}

// ─── Build Claude prompt ───

function buildPrompt(siteId: string): string {
  return `/ms-batch-site ${siteId}`
}

// ─── Spawn Claude subprocess ───

function spawnClaude(siteId: string): ChildProcess {
  const prompt = buildPrompt(siteId)
  logSite(siteId, `Spawning claude subprocess`)

  const child = spawn('claude', [
    '-p', prompt,
    '--allowedTools', 'Bash,Read,Write,Edit,Glob,Grep,Agent,WebFetch',
    '--max-turns', '200'
  ], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env }
  })

  child.stdout?.on('data', (data: Buffer) => {
    const lines = data.toString().trim().split('\n')
    for (const line of lines) {
      if (line.trim()) logSite(siteId, `stdout: ${line.slice(0, 200)}`)
    }
  })

  child.stderr?.on('data', (data: Buffer) => {
    const lines = data.toString().trim().split('\n')
    for (const line of lines) {
      if (line.trim()) logSite(siteId, `stderr: ${line.slice(0, 200)}`)
    }
  })

  return child
}

// ─── Heartbeat monitoring ───

function readHeartbeat(siteId: string): Heartbeat | null {
  const hbPath = path.join(STATE_DIR, siteId, 'heartbeat')
  return readJson<Heartbeat>(hbPath)
}

function checkHeartbeat(siteId: string, stuckTimeout: number): 'healthy' | 'warning' | 'stuck' | 'done' {
  const hb = readHeartbeat(siteId)
  if (!hb) return 'warning'
  if (hb.phaseName === 'done') return 'done'

  const age = Date.now() - new Date(hb.timestamp).getTime()
  const warningThreshold = stuckTimeout * 0.5 * 1000
  const stuckThreshold = stuckTimeout * 1000

  if (age > stuckThreshold) return 'stuck'
  if (age > warningThreshold) return 'warning'
  return 'healthy'
}

// ─── Semaphore for concurrency control ───

class Semaphore {
  private queue: Array<() => void> = []
  private active = 0

  constructor(private limit: number) {}

  async acquire(): Promise<void> {
    if (this.active < this.limit) {
      this.active++
      return
    }
    return new Promise<void>(resolve => {
      this.queue.push(() => {
        this.active++
        resolve()
      })
    })
  }

  release(): void {
    this.active--
    const next = this.queue.shift()
    if (next) next()
  }
}

// ─── Main orchestrator ───

async function main(): Promise<void> {
  // Parse args
  const args = process.argv.slice(2)
  const manifestArg = args.find(a => a.startsWith('--manifest='))
  const manifestPath = manifestArg
    ? manifestArg.split('=')[1]
    : 'batch-manifest.json'
  const resume = args.includes('--resume')

  // Read manifest
  const manifest = readJson<Manifest>(manifestPath)
  if (!manifest) {
    console.error(`Cannot read manifest: ${manifestPath}`)
    process.exit(1)
  }

  log(`Loaded manifest: ${manifest.sites.length} sites, concurrency=${manifest.concurrency}`)

  // Ensure state dir
  fs.mkdirSync(STATE_DIR, { recursive: true })

  // Read or create manifest state
  let state: ManifestState = {}
  if (resume) {
    state = readJson<ManifestState>(MANIFEST_STATE_FILE) || {}
    log(`Resuming: ${Object.entries(state).filter(([, s]) => s === 'done').length} already done`)
  }

  // Initialize learnings file
  if (!fs.existsSync(LEARNINGS_FILE)) {
    fs.writeFileSync(LEARNINGS_FILE, '# Batch Conversion Learnings\n\nShared learnings from all conversion runs.\n\n')
  }

  // Create API client from env
  const baseUrl = process.env.MAKE_STUDIO_URL
  const token = process.env.MAKE_STUDIO_TOKEN
  if (!baseUrl || !token) {
    console.error('MAKE_STUDIO_URL and MAKE_STUDIO_TOKEN must be set')
    process.exit(1)
  }
  const client = new MakeStudioClient(baseUrl, token)

  // Filter sites that need processing
  const sitesToProcess = manifest.sites.filter(s => {
    const existing = state[s.id]
    return !existing || existing === 'pending' || existing === 'failed' || existing === 'stuck'
  })

  log(`Sites to process: ${sitesToProcess.length}`)

  if (sitesToProcess.length === 0) {
    log('All sites already done!')
    return
  }

  // Create sites and write configs
  for (const site of sitesToProcess) {
    const siteDir = path.join(STATE_DIR, site.id)
    const configPath = path.join(siteDir, 'config.json')

    // Skip if config already exists (resume mode)
    if (fs.existsSync(configPath) && resume) {
      logSite(site.id, 'Config exists, reusing')
      continue
    }

    logSite(site.id, `Creating Make Studio site: ${site.name}`)
    try {
      const config = await createSiteForManifest(client, site)
      writeJson(configPath, config)
      logSite(site.id, `Created site ${config.siteId}`)
    } catch (err: any) {
      logSite(site.id, `Failed to create site: ${err.message}`)
      state[site.id] = 'failed'
      writeJson(MANIFEST_STATE_FILE, state)
    }
  }

  // Spawn processes with concurrency control
  const semaphore = new Semaphore(manifest.concurrency)
  const processes = new Map<string, ChildProcess>()
  const results = new Map<string, SiteResult>()

  const processSite = async (site: ManifestSite): Promise<void> => {
    await semaphore.acquire()

    const configPath = path.join(STATE_DIR, site.id, 'config.json')
    if (!fs.existsSync(configPath)) {
      logSite(site.id, 'No config file, skipping')
      semaphore.release()
      return
    }

    state[site.id] = 'in-progress'
    writeJson(MANIFEST_STATE_FILE, state)

    const child = spawnClaude(site.id)
    processes.set(site.id, child)

    return new Promise<void>((resolve) => {
      child.on('close', (code) => {
        processes.delete(site.id)
        semaphore.release()

        // Check result
        const resultPath = path.join(STATE_DIR, site.id, 'result.json')
        const result = readJson<SiteResult>(resultPath)

        if (result?.status === 'done') {
          state[site.id] = 'done'
          logSite(site.id, `Completed successfully`)
          results.set(site.id, result)
        } else {
          state[site.id] = code === 0 ? 'done' : 'failed'
          logSite(site.id, `Process exited with code ${code}`)
          results.set(site.id, result || { status: 'failed', errors: [`Exit code: ${code}`] })
        }

        writeJson(MANIFEST_STATE_FILE, state)
        resolve()
      })

      child.on('error', (err) => {
        processes.delete(site.id)
        semaphore.release()
        state[site.id] = 'failed'
        logSite(site.id, `Process error: ${err.message}`)
        writeJson(MANIFEST_STATE_FILE, state)
        resolve()
      })
    })
  }

  // Start heartbeat monitoring
  const heartbeatInterval = setInterval(() => {
    for (const [siteId, child] of processes) {
      const status = checkHeartbeat(siteId, manifest.stuckTimeout)

      if (status === 'stuck') {
        logSite(siteId, `STUCK — killing process (no heartbeat for ${manifest.stuckTimeout}s)`)
        child.kill('SIGTERM')
        setTimeout(() => {
          if (!child.killed) child.kill('SIGKILL')
        }, 5000)
        state[siteId] = 'stuck'
        writeJson(MANIFEST_STATE_FILE, state)
      } else if (status === 'warning') {
        const hb = readHeartbeat(siteId)
        logSite(siteId, `WARNING — heartbeat stale (phase: ${hb?.phaseName || 'unknown'})`)
      }
    }
  }, 30_000)

  // Process all sites
  await Promise.all(sitesToProcess.map(site => processSite(site)))

  clearInterval(heartbeatInterval)

  // Print summary
  log('\n═══ Batch Summary ═══')
  const done = Object.values(state).filter(s => s === 'done').length
  const failed = Object.values(state).filter(s => s === 'failed').length
  const stuck = Object.values(state).filter(s => s === 'stuck').length
  log(`Done: ${done} | Failed: ${failed} | Stuck: ${stuck} | Total: ${manifest.sites.length}`)

  for (const [siteId, result] of results) {
    const site = manifest.sites.find(s => s.id === siteId)
    const status = result.status === 'done' ? '✓' : '✗'
    log(`  ${status} ${site?.name || siteId}: ${result.previewUrl || result.errors?.join(', ') || result.status}`)
  }

  // Exit with error if any failed
  if (failed > 0 || stuck > 0) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Orchestrator fatal error:', err)
  process.exit(1)
})
