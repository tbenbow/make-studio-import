/**
 * Check all links on specific live pages to find exactly which ones are broken.
 */
import { chromium } from 'playwright'

const BASE = 'https://preview-ok-go-sandbox.makestudio.site'

async function checkPage(url: string, browser: any) {
  const page = await browser.newPage()
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
  if (!res?.ok()) {
    console.log(`  PAGE ITSELF IS ${res?.status()}`)
    await page.close()
    return
  }

  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]')).map(a => ({
      href: (a as HTMLAnchorElement).getAttribute('href') || '',
      text: (a as HTMLAnchorElement).textContent?.trim().slice(0, 60) || '',
    }))
  })

  // Filter to internal links that don't have .html and aren't / or # or mailto
  const suspicious = links.filter(l => {
    const h = l.href
    if (!h || h === '/' || h === '#' || h.startsWith('mailto:') || h.startsWith('http')) return false
    if (h === '/lessons') return true // /lessons works, but check
    if (!h.endsWith('.html') && !h.includes('#')) return true
    return false
  })

  if (suspicious.length > 0) {
    console.log(`  Missing .html:`)
    for (const l of suspicious) {
      console.log(`    "${l.text}" → ${l.href}`)
    }
  }

  // Also check resource links that might be broken
  const resourceLinks = links.filter(l => l.href.includes('/resources/'))
  if (resourceLinks.length > 0) {
    console.log(`  Resource links (${resourceLinks.length}):`)
    for (const l of resourceLinks) {
      console.log(`    "${l.text}" → ${l.href}`)
    }
  }

  // Check lesson-path links that might be wrong
  const lessonLinks = links.filter(l => l.href.includes('/lessons/'))
  if (lessonLinks.length > 0) {
    console.log(`  Lesson links (${lessonLinks.length}):`)
    for (const l of lessonLinks) {
      console.log(`    "${l.text}" → ${l.href}`)
    }
  }

  await page.close()
}

async function main() {
  const browser = await chromium.launch()

  const pagesToCheck = [
    '/',
    '/lessons',
    '/lessons/this-too-shall-pass.html',
    '/lessons/the-one-moment.html',
    '/lessons/the-writings-on-the-wall.html',
    '/lessons/upside-down-and-inside-out.html',
    '/lessons/needing-getting.html',
    '/lessons/this.html',
  ]

  for (const url of pagesToCheck) {
    console.log(`\n=== ${url} ===`)
    await checkPage(`${BASE}${url}`, browser)
  }

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
