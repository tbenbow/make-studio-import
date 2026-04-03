/**
 * Local Block Renderer
 *
 * Compiles a Handlebars block template with theme CSS and captures a
 * Playwright screenshot — entirely local, no API deployment needed.
 *
 * ~5s vs ~2min through the API pipeline.
 */

import Handlebars from 'handlebars'
import { readFile, readdir, mkdir } from 'node:fs/promises'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium, type Browser } from 'playwright'
import { generateThemeCSS } from './theme-css.js'
import type { SourceField } from './types.js'

// ── Types ──────────────────────────────────────────────────────────────

export interface RenderOptions {
  /** Path to theme directory (e.g. themes/block-ingress) */
  themePath: string
  /** Block name (e.g. HeroCenteredV1) */
  blockName: string
  /** Viewport widths to capture (default: [1440]) */
  viewports?: number[]
  /** Full page screenshot (default: false — captures first viewport height only) */
  fullPage?: boolean
  /** Output directory (default: themes/<name>/iterations/<block>/) */
  outputDir?: string
  /** Data overrides — merged on top of field defaults */
  data?: Record<string, unknown>
}

export interface RenderResult {
  /** Paths to the saved screenshots */
  screenshots: string[]
  /** The generated HTML (for debugging) */
  html: string
}

// ── Handlebars Helpers ─────────────────────────────────────────────────

function registerHelpers(hbs: typeof Handlebars): void {
  // {{default value fallback}} — return value if truthy, else fallback
  hbs.registerHelper('default', function (value: unknown, fallback: unknown) {
    if (value !== undefined && value !== null && value !== '') return value
    return fallback
  })

  // {{icon "name" size="24"}} — renders a Phosphor icon placeholder
  // In local render, we use a simple SVG placeholder with the icon name
  hbs.registerHelper('icon', function (name: string, options: Handlebars.HelperOptions) {
    const size = options.hash?.size || '24'
    // Render a circle placeholder — good enough for layout/spacing
    return new Handlebars.SafeString(
      `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">` +
      `<circle cx="${Number(size) / 2}" cy="${Number(size) / 2}" r="${Number(size) / 2 - 1}" stroke="currentColor" stroke-width="1.5"/>` +
      `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="currentColor" font-size="${Math.max(6, Number(size) / 4)}">${name || '?'}</text>` +
      `</svg>`
    )
  })

  // {{#switch value}} ... {{#case "x"}} ... {{/case}} ... {{#otherwise}} ... {{/otherwise}} {{/switch}}
  hbs.registerHelper('switch', function (this: unknown, value: unknown, options: Handlebars.HelperOptions) {
    // Store switch value in data for case/otherwise to read
    const data = Handlebars.createFrame(options.data || {})
    data._switchValue = value
    data._switchMatched = false
    return options.fn(this, { data })
  })

  hbs.registerHelper('case', function (this: unknown, value: unknown, options: Handlebars.HelperOptions) {
    if (value === options.data?._switchValue) {
      options.data._switchMatched = true
      return options.fn(this)
    }
    return ''
  })

  hbs.registerHelper('otherwise', function (this: unknown, options: Handlebars.HelperOptions) {
    if (!options.data?._switchMatched) {
      return options.fn(this)
    }
    return ''
  })

  // {{#eq a b}} — equality check
  hbs.registerHelper('eq', function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
    return a === b ? options.fn(this) : options.inverse(this)
  })

  // {{#ne a b}} — not-equal check
  hbs.registerHelper('ne', function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
    return a !== b ? options.fn(this) : options.inverse(this)
  })

  // {{#gt a b}} — greater than
  hbs.registerHelper('gt', function (this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
    return a > b ? options.fn(this) : options.inverse(this)
  })

  // {{#lt a b}} — less than
  hbs.registerHelper('lt', function (this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
    return a < b ? options.fn(this) : options.inverse(this)
  })

  // {{math a "+" b}} — basic math
  hbs.registerHelper('math', function (a: number, op: string, b: number) {
    switch (op) {
      case '+': return a + b
      case '-': return a - b
      case '*': return a * b
      case '/': return b !== 0 ? a / b : 0
      case '%': return a % b
      default: return a
    }
  })

  // {{concat a b c ...}} — concatenate strings
  hbs.registerHelper('concat', function (...args: unknown[]) {
    // Last arg is the Handlebars options object
    return args.slice(0, -1).join('')
  })

  // {{truncate text 100}} — truncate string
  hbs.registerHelper('truncate', function (str: string, len: number) {
    if (!str || str.length <= len) return str
    return str.slice(0, len) + '...'
  })

  // {{formatDate date "MMM D, YYYY"}} — simple date formatter
  hbs.registerHelper('formatDate', function (date: string) {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      })
    } catch {
      return date
    }
  })
}

// ── Field Defaults ─────────────────────────────────────────────────────

/** Slugify field name to match server compiler (TemplateAnalysisService.fieldToSlug) */
function fieldToSlug(name: string): string {
  if (!name) return ''
  return name.replace(/_/g, ' ').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

/** Extract default values from field definitions into a flat data object */
function extractDefaults(fields: SourceField[]): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const field of fields) {
    const key = fieldToSlug(field.name)
    if (!key) continue
    if (field.default !== undefined) {
      data[key] = field.default
    } else if (field.type === 'items' && field.config?.fields) {
      // Items with no default → empty array (blocks should have defaults though)
      data[key] = []
    } else if (field.type === 'group' && field.config?.fields) {
      data[key] = extractDefaults(field.config.fields)
    } else if (field.type === 'text') {
      data[key] = field.name
    } else if (field.type === 'textarea' || field.type === 'wysiwyg') {
      data[key] = `Sample ${field.name}`
    } else if (field.type === 'image') {
      data[key] = `https://placehold.co/800x600/333/666?text=${encodeURIComponent(field.name)}`
    } else if (field.type === 'toggle') {
      data[key] = false
    } else if (field.type === 'number') {
      data[key] = 0
    }
  }
  return data
}

// ── HTML Wrapper ───────────────────────────────────────────────────────

function generateFontLinks(theme: Record<string, unknown>): string {
  const fonts = (theme.fonts || []) as Array<{ family: string; weight: number; style: string; source?: string; kitId?: string }>
  const links: string[] = []

  // Google Fonts
  const googleFamilies = new Map<string, Set<number>>()
  for (const f of fonts) {
    if (!f.source || f.source === 'google') {
      if (!googleFamilies.has(f.family)) googleFamilies.set(f.family, new Set())
      googleFamilies.get(f.family)!.add(f.weight)
    }
  }
  if (googleFamilies.size > 0) {
    links.push('<link rel="preconnect" href="https://fonts.googleapis.com">')
    links.push('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>')
    for (const [family, weights] of googleFamilies) {
      const weightsStr = Array.from(weights).sort().join(';')
      links.push(`<link href="https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:wght@${weightsStr}&display=swap" rel="stylesheet">`)
    }
  }

  // Typekit
  const kitIds = new Set<string>()
  for (const f of fonts) {
    if (f.source === 'typekit' && f.kitId) kitIds.add(f.kitId)
  }
  for (const kitId of kitIds) {
    links.push(`<link rel="stylesheet" href="https://use.typekit.net/${kitId}.css">`)
  }

  return links.join('\n  ')
}

function wrapHTML(blockHTML: string, themeCSS: string, theme?: Record<string, unknown>): string {
  const fontLinks = theme ? generateFontLinks(theme) : ''
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${fontLinks}
  <style>${themeCSS}</style>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    // Configure Tailwind to not purge — we need all utility classes
    tailwind.config = {
      corePlugins: { preflight: false }
    }
  </script>
  <style>
    /* Alpine.js directives — hide elements that start hidden */
    [x-cloak] { display: none !important; }
    /* Don't force x-show visible — let initial state stand */
  </style>
</head>
<body>
${blockHTML}
</body>
</html>`
}

// ── Core Render Function ───────────────────────────────────────────────

export async function renderBlock(options: RenderOptions): Promise<RenderResult> {
  const {
    themePath,
    blockName,
    viewports = [1440],
    fullPage = false,
    data: dataOverrides = {},
  } = options

  // 1. Read block files
  const blocksDir = join(themePath, 'converted', 'blocks')
  const template = await readFile(join(blocksDir, `${blockName}.html`), 'utf-8')
  const fieldsDef = JSON.parse(await readFile(join(blocksDir, `${blockName}.json`), 'utf-8'))
  const fields: SourceField[] = fieldsDef.fields || []

  // 2. Read theme.json + generate CSS
  const themeJson = JSON.parse(await readFile(join(themePath, 'theme.json'), 'utf-8'))
  const themeCSS = generateThemeCSS(themeJson)

  // 3. Set up Handlebars
  const hbs = Handlebars.create()
  registerHelpers(hbs)

  // 4. Register partials
  const partialsDir = join(themePath, 'converted', 'partials')
  try {
    const partialFiles = await readdir(partialsDir)
    for (const file of partialFiles) {
      if (file.endsWith('.html')) {
        const name = file.replace('.html', '')
        const content = await readFile(join(partialsDir, file), 'utf-8')
        hbs.registerPartial(name, content)
      }
    }
  } catch {
    // No partials directory — fine
  }

  // 5. Compile template with defaults + overrides
  const compiled = hbs.compile(template, { strict: false })
  const defaults = extractDefaults(fields)
  const mergedData = { ...defaults, ...dataOverrides }
  const blockHTML = compiled(mergedData)

  // 6. Wrap in full HTML document
  const html = wrapHTML(blockHTML, themeCSS, themeJson)

  // 7. Determine output directory
  const outputDir = options.outputDir || join(themePath, 'iterations', blockName)
  await mkdir(outputDir, { recursive: true })

  // 8. Screenshot with Playwright
  const screenshots: string[] = []
  let browser: Browser | null = null

  try {
    browser = await chromium.launch()

    for (const width of viewports) {
      const context = await browser.newContext({
        viewport: { width, height: 900 }
      })
      const page = await context.newPage()

      // Load from data URI to avoid file server
      await page.setContent(html, { waitUntil: 'networkidle' })

      // Determine render number
      const renderNum = await getNextRenderNumber(outputDir, width)
      const suffix = viewports.length > 1 ? `-${width}w` : ''
      const filename = `render-${renderNum}${suffix}.png`
      const filepath = join(outputDir, filename)

      await page.screenshot({ path: filepath, fullPage })
      screenshots.push(filepath)
      await context.close()
    }
  } finally {
    if (browser) await browser.close()
  }

  return { screenshots, html }
}

/** Compile a block to HTML without screenshotting (useful for debugging) */
export async function compileBlock(
  themePath: string,
  blockName: string,
  dataOverrides?: Record<string, unknown>
): Promise<string> {
  const blocksDir = join(themePath, 'converted', 'blocks')
  const template = await readFile(join(blocksDir, `${blockName}.html`), 'utf-8')
  const fieldsDef = JSON.parse(await readFile(join(blocksDir, `${blockName}.json`), 'utf-8'))
  const fields: SourceField[] = fieldsDef.fields || []

  const themeJson = JSON.parse(await readFile(join(themePath, 'theme.json'), 'utf-8'))
  const themeCSS = generateThemeCSS(themeJson)

  const hbs = Handlebars.create()
  registerHelpers(hbs)

  const partialsDir = join(themePath, 'converted', 'partials')
  try {
    const partialFiles = await readdir(partialsDir)
    for (const file of partialFiles) {
      if (file.endsWith('.html')) {
        hbs.registerPartial(file.replace('.html', ''), await readFile(join(partialsDir, file), 'utf-8'))
      }
    }
  } catch { /* no partials */ }

  const compiled = hbs.compile(template, { strict: false })
  const defaults = extractDefaults(fields)
  const blockHTML = compiled({ ...defaults, ...dataOverrides })

  return wrapHTML(blockHTML, themeCSS, themeJson)
}

// ── Helpers ────────────────────────────────────────────────────────────

async function getNextRenderNumber(dir: string, width?: number): Promise<number> {
  try {
    const files = await readdir(dir)
    const pattern = width ? /^render-(\d+)/ : /^render-(\d+)\.png$/
    const renderFiles = files.filter(f => pattern.test(f))
    if (renderFiles.length === 0) return 1
    const numbers = renderFiles.map(f => parseInt(f.match(/render-(\d+)/)![1], 10))
    return Math.max(...numbers) + 1
  } catch {
    return 1
  }
}

// ── CLI ────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  let theme = '', block = '', viewportsArg = ''
  let fullPage = false, htmlOnly = false

  for (const arg of args) {
    if (arg.startsWith('--theme=')) theme = arg.slice(8)
    else if (arg.startsWith('--block=')) block = arg.slice(8)
    else if (arg.startsWith('--viewports=')) viewportsArg = arg.slice(12)
    else if (arg === '--full-page') fullPage = true
    else if (arg === '--html-only') htmlOnly = true
  }

  if (!theme || !block) {
    console.error('Usage: npx tsx src/render-block.ts --theme=<name> --block=<BlockName> [--viewports=1440,768,375] [--full-page] [--html-only]')
    process.exit(1)
  }

  const themePath = join(process.cwd(), 'themes', theme)
  const viewports = viewportsArg ? viewportsArg.split(',').map(Number) : [1440]

  if (htmlOnly) {
    const html = await compileBlock(themePath, block)
    console.log(html)
  } else {
    console.log(`\nRendering ${block} @ ${viewports.join(', ')}px`)
    const result = await renderBlock({ themePath, blockName: block, viewports, fullPage })
    for (const path of result.screenshots) {
      console.log(`  ✓ ${path}`)
    }
  }
}
