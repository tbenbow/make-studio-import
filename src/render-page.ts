/**
 * Local Page Renderer
 *
 * Compiles a full page (header blocks + body blocks + footer blocks)
 * from local theme files and captures a Playwright screenshot.
 * No API or deployment needed.
 *
 * Usage:
 *   npx tsx src/render-page.ts --theme=<name> --page=<pageName>
 *   npx tsx src/render-page.ts --theme=<name> --page=index --data=content.json
 *   npx tsx src/render-page.ts --theme=<name> --all
 */

import Handlebars from 'handlebars'
import { readFile, readdir, mkdir } from 'node:fs/promises'
import { writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { chromium, type Browser } from 'playwright'
import { generateThemeCSS } from './theme-css.js'
import type { SourceField } from './types.js'

// ── Shared with render-block.ts ──────────────────────────────────────

function fieldToSlug(name: string): string {
  if (!name) return ''
  return name.replace(/_/g, ' ').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

function extractDefaults(fields: SourceField[]): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const field of fields) {
    const key = fieldToSlug(field.name)
    if (!key) continue
    if (field.default !== undefined) {
      data[key] = field.default
    } else if (field.type === 'items' && field.config?.fields) {
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

function registerHelpers(hbs: typeof Handlebars): void {
  hbs.registerHelper('default', function (value: unknown, fallback: unknown) {
    if (value !== undefined && value !== null && value !== '') return value
    return fallback
  })
  hbs.registerHelper('icon', function (name: string, options: Handlebars.HelperOptions) {
    const size = options.hash?.size || '24'
    return new Handlebars.SafeString(
      `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">` +
      `<circle cx="${Number(size) / 2}" cy="${Number(size) / 2}" r="${Number(size) / 2 - 1}" stroke="currentColor" stroke-width="1.5"/>` +
      `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="currentColor" font-size="${Math.max(6, Number(size) / 4)}">${name || '?'}</text>` +
      `</svg>`
    )
  })
  hbs.registerHelper('eq', function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
    return a === b ? options.fn(this) : options.inverse(this)
  })
  hbs.registerHelper('ne', function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
    return a !== b ? options.fn(this) : options.inverse(this)
  })
  hbs.registerHelper('concat', function (...args: unknown[]) {
    return args.slice(0, -1).join('')
  })
  hbs.registerHelper('truncate', function (str: string, len: number) {
    if (!str || str.length <= len) return str
    return str.slice(0, len) + '...'
  })
  hbs.registerHelper('formatDate', function (date: string) {
    try {
      return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch { return date }
  })
  hbs.registerHelper('math', function (a: number, op: string, b: number) {
    switch (op) {
      case '+': return a + b; case '-': return a - b
      case '*': return a * b; case '/': return b !== 0 ? a / b : 0
      default: return a
    }
  })
  hbs.registerHelper('switch', function (this: unknown, value: unknown, options: Handlebars.HelperOptions) {
    const data = Handlebars.createFrame(options.data || {})
    data._switchValue = value; data._switchMatched = false
    return options.fn(this, { data })
  })
  hbs.registerHelper('case', function (this: unknown, value: unknown, options: Handlebars.HelperOptions) {
    if (value === options.data?._switchValue) { options.data._switchMatched = true; return options.fn(this) }
    return ''
  })
  hbs.registerHelper('otherwise', function (this: unknown, options: Handlebars.HelperOptions) {
    if (!options.data?._switchMatched) return options.fn(this)
    return ''
  })
  hbs.registerHelper('gt', function (this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
    return a > b ? options.fn(this) : options.inverse(this)
  })
  hbs.registerHelper('lt', function (this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
    return a < b ? options.fn(this) : options.inverse(this)
  })
}

function generateFontLinks(theme: Record<string, unknown>): string {
  const fonts = (theme.fonts || []) as Array<{ family: string; weight: number; source?: string; kitId?: string }>
  const links: string[] = []
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
      links.push(`<link href="https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:wght@${Array.from(weights).sort().join(';')}&display=swap" rel="stylesheet">`)
    }
  }
  const kitIds = new Set<string>()
  for (const f of fonts) {
    if (f.source === 'typekit' && f.kitId) kitIds.add(f.kitId)
  }
  for (const kitId of kitIds) {
    links.push(`<link rel="stylesheet" href="https://use.typekit.net/${kitId}.css">`)
  }
  return links.join('\n  ')
}

// ── Types ─────────────────────────────────────────────────────────────

interface PagesJson {
  layouts: Array<{
    name: string
    headerBlocks: string[]
    footerBlocks: string[]
    isDefault?: boolean
  }>
  pages: Array<{
    name: string
    layout: string
    blocks: string[]
  }>
}

// ── Core ──────────────────────────────────────────────────────────────

async function compileBlock(
  hbs: typeof Handlebars,
  blocksDir: string,
  blockName: string,
  dataOverrides?: Record<string, unknown>
): Promise<string> {
  try {
    const template = await readFile(join(blocksDir, `${blockName}.html`), 'utf-8')
    const fieldsDef = JSON.parse(await readFile(join(blocksDir, `${blockName}.json`), 'utf-8'))
    const fields: SourceField[] = fieldsDef.fields || []
    const compiled = hbs.compile(template, { strict: false })
    const defaults = extractDefaults(fields)
    return compiled({ ...defaults, ...dataOverrides })
  } catch (err) {
    return `<!-- Block ${blockName} failed: ${(err as Error).message} -->`
  }
}

async function renderPage(opts: {
  themePath: string
  pageName: string
  contentData?: Record<string, Record<string, unknown>>
  viewport?: number
}): Promise<{ screenshot: string; html: string }> {
  const { themePath, pageName, contentData = {}, viewport = 1440 } = opts
  const blocksDir = join(themePath, 'converted', 'blocks')

  // Read pages.json
  const pagesJson: PagesJson = JSON.parse(await readFile(join(themePath, 'pages.json'), 'utf-8'))
  const pageConfig = pagesJson.pages.find(p => p.name === pageName)
  if (!pageConfig) throw new Error(`Page "${pageName}" not found in pages.json`)

  const layoutConfig = pagesJson.layouts.find(l => l.name === pageConfig.layout)

  // Read theme
  const themeJson = JSON.parse(await readFile(join(themePath, 'theme.json'), 'utf-8'))
  const themeCSS = generateThemeCSS(themeJson)
  const fontLinks = generateFontLinks(themeJson)

  // Set up Handlebars
  const hbs = Handlebars.create()
  registerHelpers(hbs)

  // Register partials
  const partialsDir = join(themePath, 'converted', 'partials')
  try {
    const partialFiles = await readdir(partialsDir)
    for (const file of partialFiles) {
      if (file.endsWith('.html')) {
        hbs.registerPartial(file.replace('.html', ''), await readFile(join(partialsDir, file), 'utf-8'))
      }
    }
  } catch { /* no partials */ }

  // Compile all blocks in order: header → body → footer
  const headerBlocks = layoutConfig?.headerBlocks || []
  const bodyBlocks = pageConfig.blocks
  const footerBlocks = layoutConfig?.footerBlocks || []
  const allBlocks = [...headerBlocks, ...bodyBlocks, ...footerBlocks]

  const blockHTMLs: string[] = []
  for (const blockName of allBlocks) {
    const overrides = contentData[blockName]
    blockHTMLs.push(await compileBlock(hbs, blocksDir, blockName, overrides))
  }

  // Build full HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${fontLinks}
  <style>${themeCSS}</style>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { corePlugins: { preflight: false } }</script>
  <style>[x-cloak] { display: none !important; }</style>
</head>
<body>
${blockHTMLs.join('\n')}
</body>
</html>`

  // Screenshot
  const outputDir = join(themePath, 'preview')
  await mkdir(outputDir, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: viewport, height: 900 }, deviceScaleFactor: 2 })
  await page.setContent(html, { waitUntil: 'networkidle' })
  // Scroll to load lazy images
  const pageHeight = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < pageHeight; y += 400) {
    await page.evaluate(s => window.scrollTo(0, s), y)
    await page.waitForTimeout(100)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)

  const filepath = join(outputDir, `${pageName}.png`)
  await page.screenshot({ path: filepath, fullPage: true })
  await browser.close()

  // Also save HTML for debugging
  await writeFile(join(outputDir, `${pageName}.html`), html)

  return { screenshot: filepath, html }
}

// ── CLI ───────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  let theme = '', pageName = '', dataFile = '', all = false

  for (const arg of args) {
    if (arg.startsWith('--theme=')) theme = arg.slice(8)
    else if (arg.startsWith('--page=')) pageName = arg.slice(7)
    else if (arg.startsWith('--data=')) dataFile = arg.slice(7)
    else if (arg === '--all') all = true
  }

  if (!theme || (!pageName && !all)) {
    console.error('Usage: npx tsx src/render-page.ts --theme=<name> --page=<pageName> [--data=content.json]')
    console.error('       npx tsx src/render-page.ts --theme=<name> --all')
    process.exit(1)
  }

  const themePath = join(process.cwd(), 'themes', theme)

  // Load content overrides if provided
  let contentData: Record<string, Record<string, Record<string, unknown>>> = {}
  if (dataFile) {
    contentData = JSON.parse(await readFile(resolve(dataFile), 'utf-8'))
  }

  if (all) {
    const pagesJson: PagesJson = JSON.parse(await readFile(join(themePath, 'pages.json'), 'utf-8'))
    console.log(`Rendering ${pagesJson.pages.length} pages...`)
    for (const page of pagesJson.pages) {
      const result = await renderPage({
        themePath,
        pageName: page.name,
        contentData: contentData[page.name] || {},
      })
      console.log(`  ✓ ${page.name} → ${result.screenshot}`)
    }
  } else {
    console.log(`Rendering ${pageName}...`)
    const result = await renderPage({
      themePath,
      pageName,
      contentData: contentData[pageName] || {},
    })
    console.log(`  ✓ ${result.screenshot}`)
  }
}

export { renderPage }
