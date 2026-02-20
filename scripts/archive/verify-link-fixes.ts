/**
 * Quick verification: check nav links on homepage and lesson links on /lessons
 */
import { chromium } from 'playwright'

const BASE = 'https://preview-ok-go-sandbox.makestudio.site'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Check homepage nav links
  console.log('=== HOMEPAGE NAV LINKS ===')
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  const homeLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]')).map(a => ({
      href: (a as HTMLAnchorElement).getAttribute('href') || '',
      text: (a as HTMLAnchorElement).textContent?.trim().slice(0, 40) || '',
    }))
  })
  const navLinks = homeLinks.filter(l => ['/more', '/about', '/ask-ok-go', '/more.html', '/about.html', '/ask-ok-go.html'].includes(l.href))
  for (const l of navLinks) {
    const ok = l.href.endsWith('.html') || l.href === '/' || l.href === '/lessons'
    console.log(`  ${ok ? '✓' : '✗'} "${l.text}" → ${l.href}`)
  }

  // Check lessons page links
  console.log('\n=== LESSONS PAGE LINKS ===')
  await page.goto(`${BASE}/lessons`, { waitUntil: 'domcontentloaded' })
  const lessonsLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]')).map(a => ({
      href: (a as HTMLAnchorElement).getAttribute('href') || '',
      text: (a as HTMLAnchorElement).textContent?.trim().slice(0, 40) || '',
    }))
  })
  const lessonPageLinks = lessonsLinks.filter(l => l.text === 'View Lessons' || (l.href.includes('/lessons/') && !l.href.includes('.html') === false))
  for (const l of lessonPageLinks) {
    const ok = l.href.startsWith('/lessons/') && l.href.endsWith('.html')
    console.log(`  ${ok ? '✓' : '✗'} "${l.text}" → ${l.href}`)
  }

  // Check all broken links from the original crawl
  console.log('\n=== LESSON INDEX CARD LINKS ===')
  const cardLinks = lessonsLinks.filter(l =>
    l.href && l.href !== '/' && l.href !== '#' && !l.href.startsWith('mailto:') &&
    !l.href.startsWith('/more') && !l.href.startsWith('/about') && !l.href.startsWith('/ask-ok-go') &&
    l.href !== '/lessons' && !l.href.startsWith('http')
  )
  for (const l of cardLinks) {
    console.log(`  "${l.text}" → ${l.href}`)
  }

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
