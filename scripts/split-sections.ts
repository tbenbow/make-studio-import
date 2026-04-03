/**
 * Split a live website into per-section screenshots.
 *
 * Uses Playwright to hide all sections except the target, then screenshots
 * each one at its natural dimensions. Falls back to clip-based approach if
 * sections can't be identified.
 *
 * Usage:
 *   npx tsx scripts/split-sections.ts --url=https://example.com --output=themes/<name>/screenshots/sections
 *   npx tsx scripts/split-sections.ts --url=https://example.com/about --output=themes/<name>/screenshots/sections --prefix=about
 */

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { parseArgs } from '../src/utils/args.js'

const args = parseArgs(process.argv.slice(2))
const url = args.url as string
const outputDir = args.output as string
const prefix = (args.prefix as string) || 'section'
const viewport = parseInt(args.viewport as string || '1440', 10)

if (!url || !outputDir) {
  console.log('Usage: npx tsx scripts/split-sections.ts --url=<url> --output=<dir> [--prefix=<name>] [--viewport=1440]')
  process.exit(1)
}

interface SectionInfo {
  index: number
  selector: string
  tag: string
  id: string | null
  className: string
  textPreview: string
  height: number
}

async function main() {
  await mkdir(outputDir, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: viewport, height: 900 }, deviceScaleFactor: 2 })

  console.log(`Loading ${url}...`)
  await page.goto(url, { waitUntil: 'networkidle' })

  // Scroll to trigger lazy loading
  const pageHeight = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < pageHeight; y += 400) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y)
    await page.waitForTimeout(200)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(500)

  // Also take a full-page screenshot for reference
  const fullPath = join(outputDir, `${prefix}-full.png`)
  await page.screenshot({ path: fullPath, fullPage: true })
  console.log(`Full page: ${fullPath}`)

  // Identify top-level sections
  const sections: SectionInfo[] = await page.evaluate(() => {
    // Try common section selectors in order of specificity
    const selectors = [
      'main > section, main > header, main > footer, main > div > section',
      'body > header, body > main > section, body > section, body > footer',
      '[data-section-id]',
      'section',
    ]

    let elements: Element[] = []
    for (const sel of selectors) {
      const found = Array.from(document.querySelectorAll(sel))
      // Filter to only direct-ish children (not deeply nested sections)
      const topLevel = found.filter(el => {
        let count = 0
        let parent = el.parentElement
        while (parent) {
          if (parent.tagName === 'SECTION') count++
          parent = parent.parentElement
        }
        return count <= 1
      })
      if (topLevel.length >= 2) {
        elements = topLevel
        break
      }
    }

    // Also grab header and footer if not already included
    const header = document.querySelector('body > header, #header, [role="banner"]')
    const footer = document.querySelector('body > footer, #footer, [role="contentinfo"]')
    const all = new Set(elements)
    if (header) all.add(header)
    if (footer) all.add(footer)

    // Sort by DOM position
    const sorted = Array.from(all).sort((a, b) => {
      const pos = a.compareDocumentPosition(b)
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    })

    return sorted.map((el, i) => ({
      index: i,
      selector: `[data-split-id="${i}"]`,
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      className: el.className?.toString().slice(0, 100) || '',
      textPreview: el.textContent?.trim().slice(0, 80) || '',
      height: el.getBoundingClientRect().height,
    }))
  })

  if (sections.length === 0) {
    console.log('No sections found. Taking full-page screenshot only.')
    await browser.close()
    return
  }

  // Tag each section with a data attribute for targeting
  await page.evaluate((sectionCount) => {
    const selectors = [
      'main > section, main > header, main > footer, main > div > section',
      'body > header, body > main > section, body > section, body > footer',
      '[data-section-id]',
      'section',
    ]

    let elements: Element[] = []
    for (const sel of selectors) {
      const found = Array.from(document.querySelectorAll(sel))
      const topLevel = found.filter(el => {
        let count = 0
        let parent = el.parentElement
        while (parent) {
          if (parent.tagName === 'SECTION') count++
          parent = parent.parentElement
        }
        return count <= 1
      })
      if (topLevel.length >= 2) {
        elements = topLevel
        break
      }
    }

    const header = document.querySelector('body > header, #header, [role="banner"]')
    const footer = document.querySelector('body > footer, #footer, [role="contentinfo"]')
    const all = new Set(elements)
    if (header) all.add(header)
    if (footer) all.add(footer)

    const sorted = Array.from(all).sort((a, b) => {
      const pos = a.compareDocumentPosition(b)
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    })

    sorted.forEach((el, i) => {
      el.setAttribute('data-split-id', String(i))
    })
  }, sections.length)

  console.log(`Found ${sections.length} sections:`)
  sections.forEach((s) => {
    const label = s.id || s.textPreview.slice(0, 40) || s.tag
    console.log(`  ${s.index}: <${s.tag}> ${label} (${Math.round(s.height)}px)`)
  })

  // Screenshot each section by hiding all others
  for (const section of sections) {
    if (section.height < 10) continue // skip invisible sections

    // Get the section's bounding rect (absolute position on page)
    const rect = await page.evaluate((idx) => {
      const el = document.querySelector(`[data-split-id="${idx}"]`)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        x: 0,
        y: r.top + window.scrollY,
        width: r.width,
        height: r.height,
      }
    }, section.index)

    if (!rect || rect.height < 10) continue

    const label = section.id || `${section.index}`
    const filename = `${prefix}-${label.replace(/[^a-zA-Z0-9-]/g, '-')}.png`
    const filepath = join(outputDir, filename)

    await page.screenshot({
      path: filepath,
      fullPage: true,
      clip: { x: 0, y: rect.y, width: viewport, height: rect.height },
    })
    console.log(`  ✓ ${filename} (${Math.round(rect.height)}px)`)
  }

  // Output section manifest
  const manifest = sections.map(s => ({
    index: s.index,
    tag: s.tag,
    id: s.id,
    textPreview: s.textPreview.slice(0, 80),
    height: Math.round(s.height),
    filename: `${prefix}-${(s.id || `${s.index}`).replace(/[^a-zA-Z0-9-]/g, '-')}.png`,
  }))

  const manifestPath = join(outputDir, `${prefix}-manifest.json`)
  const { writeFile } = await import('node:fs/promises')
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`\nManifest: ${manifestPath}`)

  await browser.close()
  console.log('Done!')
}

main().catch(console.error)
