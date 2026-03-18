/**
 * Catalog Blocks
 *
 * Pulls all blocks from the seed site, renders each locally with Playwright,
 * and saves screenshots + a metadata summary for review.
 *
 * Usage:
 *   npx tsx scripts/catalog-blocks.ts [--batch=0] [--batch-size=10] [--only=BlockName1,BlockName2]
 *
 * Options:
 *   --batch       Batch index to render (0-based). Default: 0
 *   --batch-size  How many blocks per batch. Default: 10
 *   --only        Comma-separated list of block names to render
 *   --list        Just list all blocks with metadata status, don't render
 *
 * Output:
 *   data/catalog/screenshots/<BlockName>.png   — 1440px screenshot of each block
 *   data/catalog/summary.json                  — metadata status for all blocks
 */

import 'dotenv/config'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import Handlebars from 'handlebars'
import { chromium } from 'playwright'
import { MakeStudioClient, type ApiBlock } from '../src/api.js'
import { generateThemeCSS } from '../src/theme-css.js'

const SEED_SITE_ID = process.env.SEED_SITE_ID || '69ae41bd212dd9e93c104e55'
const SEED_TOKEN = process.env.SEED_SITE_API_TOKEN || process.env.MAKE_STUDIO_TOKEN!
const BASE_URL = process.env.MAKE_STUDIO_URL || 'http://localhost:3001'

// ── Handlebars setup ──

function setupHandlebars(): typeof Handlebars {
  const hbs = Handlebars.create()

  hbs.registerHelper('default', (value: unknown, fallback: unknown) => {
    return (value !== undefined && value !== null && value !== '') ? value : fallback
  })

  hbs.registerHelper('icon', (name: string, options: Handlebars.HelperOptions) => {
    const size = options.hash?.size || '24'
    return new Handlebars.SafeString(
      `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">` +
      `<circle cx="${Number(size)/2}" cy="${Number(size)/2}" r="${Number(size)/2-1}" stroke="currentColor" stroke-width="1.5"/>` +
      `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="currentColor" font-size="${Math.max(6, Number(size)/4)}">${name||'?'}</text>` +
      `</svg>`
    )
  })

  hbs.registerHelper('eq', function(this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
    return a === b ? options.fn(this) : options.inverse(this)
  })
  hbs.registerHelper('ne', function(this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
    return a !== b ? options.fn(this) : options.inverse(this)
  })
  hbs.registerHelper('gt', function(this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
    return a > b ? options.fn(this) : options.inverse(this)
  })
  hbs.registerHelper('lt', function(this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
    return a < b ? options.fn(this) : options.inverse(this)
  })
  hbs.registerHelper('switch', function(this: unknown, value: unknown, options: Handlebars.HelperOptions) {
    const data = Handlebars.createFrame(options.data || {})
    data._switchValue = value
    data._switchMatched = false
    return options.fn(this, { data })
  })
  hbs.registerHelper('case', function(this: unknown, value: unknown, options: Handlebars.HelperOptions) {
    if (value === options.data?._switchValue) { options.data._switchMatched = true; return options.fn(this) }
    return ''
  })
  hbs.registerHelper('otherwise', function(this: unknown, options: Handlebars.HelperOptions) {
    return !options.data?._switchMatched ? options.fn(this) : ''
  })
  hbs.registerHelper('math', (a: number, op: string, b: number) => {
    switch(op) { case '+': return a+b; case '-': return a-b; case '*': return a*b; case '/': return b?a/b:0; default: return a }
  })
  hbs.registerHelper('concat', (...args: unknown[]) => args.slice(0,-1).join(''))
  hbs.registerHelper('truncate', (str: string, len: number) => str && str.length > len ? str.slice(0,len)+'...' : str)
  hbs.registerHelper('formatDate', (date: string) => { try { return new Date(date).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) } catch { return date } })

  return hbs
}

// ── Extract defaults from API fields ──

function extractDefaults(fields: ApiBlock['fields']): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  if (!fields) return data

  for (const field of fields) {
    const name = field.name
    if (field.value !== undefined && field.value !== null) {
      data[name] = field.value
    } else if (field.type === 'text') {
      data[name] = name
    } else if (field.type === 'textarea' || field.type === 'wysiwyg') {
      data[name] = `<p>Sample ${name} content</p>`
    } else if (field.type === 'image') {
      data[name] = `https://placehold.co/800x600/374151/9ca3af?text=${encodeURIComponent(name)}`
    } else if (field.type === 'toggle') {
      data[name] = false
    } else if (field.type === 'number') {
      data[name] = 0
    } else if (field.type === 'items') {
      data[name] = []
    } else if (field.type === 'group') {
      data[name] = {}
    }
  }
  return data
}

// ── Render a single block to HTML ──

function renderBlockHTML(
  hbs: typeof Handlebars,
  block: ApiBlock,
  themeCSS: string,
  partials: Record<string, string>
): string {
  // Register partials
  for (const [name, template] of Object.entries(partials)) {
    hbs.registerPartial(name, template)
  }

  try {
    const compiled = hbs.compile(block.template || '<div>No template</div>', { strict: false })
    const data = extractDefaults(block.fields)
    const blockHTML = compiled(data)

    return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${themeCSS}</style>
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config = { corePlugins: { preflight: false } }</script>
<style>[x-cloak]{display:none!important}</style>
</head><body>
<!-- Block: ${block.name} -->
${blockHTML}
</body></html>`
  } catch (err) {
    return `<!DOCTYPE html><html><body>
<div style="padding:40px;font-family:monospace;color:red;">
<h2>Render error: ${block.name}</h2>
<pre>${err instanceof Error ? err.message : String(err)}</pre>
</div></body></html>`
  }
}

// ── Main ──

async function main() {
  const args = process.argv.slice(2)
  const batchArg = args.find(a => a.startsWith('--batch='))
  const batchSizeArg = args.find(a => a.startsWith('--batch-size='))
  const onlyArg = args.find(a => a.startsWith('--only='))
  const listOnly = args.includes('--list')

  const batchIndex = batchArg ? parseInt(batchArg.split('=')[1]) : 0
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 10

  // 1. Pull all blocks from seed site
  const client = new MakeStudioClient(BASE_URL, SEED_TOKEN)
  const allBlocks = await client.getBlocks(SEED_SITE_ID)
  const sorted = allBlocks.sort((a, b) => a.name.localeCompare(b.name))

  console.log(`Fetched ${sorted.length} blocks from seed site`)

  // 2. Build summary
  const summary = sorted.map(b => ({
    name: b.name,
    blockCategory: b.blockCategory || null,
    description: b.description || '',
    aiDescription: b.aiDescription || '',
    tags: b.tags || [],
    fieldCount: b.fields?.length || 0,
    hasTemplate: !!b.template,
    templateLength: b.template?.length || 0
  }))

  const catalogDir = join('data', 'catalog')
  mkdirSync(join(catalogDir, 'screenshots'), { recursive: true })
  writeFileSync(join(catalogDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n')
  console.log(`Wrote summary to ${join(catalogDir, 'summary.json')}`)

  if (listOnly) {
    console.log('\n=== METADATA STATUS ===')
    const missing = { aiDescription: 0, tags: 0, description: 0 }
    for (const b of summary) {
      if (!b.aiDescription) missing.aiDescription++
      if (b.tags.length === 0) missing.tags++
      if (!b.description || b.description === b.name) missing.description++
    }
    console.log(`  Missing aiDescription: ${missing.aiDescription}/${summary.length}`)
    console.log(`  Missing tags: ${missing.tags}/${summary.length}`)
    console.log(`  Missing description: ${missing.description}/${summary.length}`)

    console.log('\n=== BY CATEGORY ===')
    const cats: Record<string, string[]> = {}
    for (const b of summary) {
      const cat = b.blockCategory || '(none)'
      if (!cats[cat]) cats[cat] = []
      cats[cat].push(b.name)
    }
    for (const [cat, names] of Object.entries(cats).sort()) {
      console.log(`  ${cat} (${names.length}): ${names.join(', ')}`)
    }
    return
  }

  // 3. Determine which blocks to render
  let blocksToRender: ApiBlock[]
  if (onlyArg) {
    const names = new Set(onlyArg.split('=')[1].split(','))
    blocksToRender = sorted.filter(b => names.has(b.name))
  } else {
    const start = batchIndex * batchSize
    blocksToRender = sorted.slice(start, start + batchSize)
  }

  if (blocksToRender.length === 0) {
    console.log('No blocks to render in this batch')
    return
  }

  console.log(`Rendering batch: ${blocksToRender.map(b => b.name).join(', ')}`)

  // 4. Get theme CSS from seed site
  const site = await client.getSite(SEED_SITE_ID)
  const themeCSS = generateThemeCSS(site.theme as Record<string, unknown>)

  // 5. Get partials
  const { partials: partialList, templateObject } = await client.getPartials(SEED_SITE_ID)
  const partials: Record<string, string> = {}
  for (const p of partialList) {
    if (p.template) partials[p.name] = p.template
  }
  // Also use templateObject if available
  if (templateObject) {
    for (const [name, template] of Object.entries(templateObject)) {
      if (!partials[name]) partials[name] = template
    }
  }

  // 6. Render and screenshot each block
  const hbs = setupHandlebars()
  const browser = await chromium.launch()

  for (const block of blocksToRender) {
    const screenshotPath = join(catalogDir, 'screenshots', `${block.name}.png`)

    // Skip if screenshot already exists
    if (existsSync(screenshotPath) && !onlyArg) {
      console.log(`  Skip ${block.name} (already exists)`)
      continue
    }

    const html = renderBlockHTML(hbs, block, themeCSS, partials)

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()

    try {
      await page.setContent(html, { waitUntil: 'networkidle', timeout: 15000 })
      await page.screenshot({ path: screenshotPath, fullPage: true })
      console.log(`  ✓ ${block.name}`)
    } catch (err) {
      console.log(`  ✗ ${block.name}: ${err instanceof Error ? err.message : err}`)
    }

    await context.close()
  }

  await browser.close()
  console.log(`\nDone. Screenshots in ${join(catalogDir, 'screenshots')}/`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
