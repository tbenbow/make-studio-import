/**
 * Crawl the deployed preview site and find broken links.
 * Starts from a seed URL and follows all internal links.
 */

import { chromium } from 'playwright'

const BASE = 'https://preview-ok-go-sandbox.makestudio.site'
const SEED = process.argv[2] || `${BASE}/lessons/this-too-shall-pass.html`

interface LinkResult {
  url: string
  status: number | 'error'
  foundOn: string[]
  linkText?: string
}

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext()

  const visited = new Map<string, LinkResult>()
  const queue: { url: string; foundOn: string }[] = [{ url: SEED, foundOn: 'seed' }]

  // Also seed key pages
  const seedPages = [
    '/',
    '/lessons',
    '/more',
    '/about',
    '/ask-ok-go',
  ]
  for (const p of seedPages) {
    queue.push({ url: `${BASE}${p}`, foundOn: 'seed' })
  }

  while (queue.length > 0) {
    const { url, foundOn } = queue.shift()!

    // Normalize URL
    const normalized = url.split('#')[0].split('?')[0]
    if (!normalized.startsWith(BASE)) continue

    if (visited.has(normalized)) {
      visited.get(normalized)!.foundOn.push(foundOn)
      continue
    }

    const result: LinkResult = { url: normalized, status: 0, foundOn: [foundOn] }
    visited.set(normalized, result)

    try {
      const page = await context.newPage()
      const response = await page.goto(normalized, { waitUntil: 'domcontentloaded', timeout: 15000 })
      result.status = response?.status() || 0

      if (response?.ok()) {
        // Extract all links on this page
        const links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a[href]')).map(a => ({
            href: (a as HTMLAnchorElement).href,
            text: (a as HTMLAnchorElement).textContent?.trim().slice(0, 50) || '',
          }))
        })

        for (const link of links) {
          const href = link.href.split('#')[0].split('?')[0]
          if (!href) continue
          if (href.startsWith(BASE)) {
            if (!visited.has(href)) {
              queue.push({ url: href, foundOn: normalized })
            } else {
              visited.get(href)!.foundOn.push(normalized)
            }
          }
        }
      }

      await page.close()
    } catch (err: any) {
      result.status = 'error'
    }

    const path = normalized.replace(BASE, '')
    const statusIcon = result.status === 200 ? '✓' : result.status === 404 ? '✗' : '?'
    process.stdout.write(`${statusIcon} ${result.status} ${path}\n`)
  }

  await browser.close()

  // Summary
  const all = [...visited.values()]
  const ok = all.filter(r => r.status === 200)
  const notFound = all.filter(r => r.status === 404)
  const errors = all.filter(r => r.status !== 200 && r.status !== 404)

  console.log(`\n=== SUMMARY ===`)
  console.log(`OK (200): ${ok.length}`)
  console.log(`Not Found (404): ${notFound.length}`)
  console.log(`Other errors: ${errors.length}`)

  if (notFound.length > 0) {
    console.log(`\n=== 404 NOT FOUND ===\n`)
    for (const r of notFound) {
      const path = r.url.replace(BASE, '')
      console.log(`${path}`)
      const uniqueFoundOn = [...new Set(r.foundOn)].slice(0, 5)
      for (const f of uniqueFoundOn) {
        console.log(`  linked from: ${f.replace(BASE, '') || '/'}`)
      }
    }
  }

  if (errors.length > 0) {
    console.log(`\n=== OTHER ERRORS ===\n`)
    for (const r of errors) {
      console.log(`${r.status} ${r.url.replace(BASE, '')}`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
