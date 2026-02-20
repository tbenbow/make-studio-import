import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto('https://okgosandbox.org/lessons', { waitUntil: 'networkidle' })

  const lessonLinks = await page.$$eval('a[href]', anchors => {
    const seen = new Set<string>()
    return anchors
      .map(a => ({ href: a.getAttribute('href') || '', text: a.textContent?.trim() || '' }))
      .filter(a => {
        const match = a.href.match(/^\/([a-z0-9-]+)$/)
        if (match == null) return false
        const skip = ['lessons', 'more', 'about', 'ask-ok-go', 'home']
        if (skip.includes(match[1])) return false
        if (seen.has(a.href)) return false
        seen.add(a.href)
        return true
      })
  })

  console.log('Found lesson links:', JSON.stringify(lessonLinks, null, 2))

  const lessons: any[] = []

  for (const link of lessonLinks) {
    const url = `https://okgosandbox.org${link.href}`
    console.log(`\nScraping: ${url}`)
    await page.goto(url, { waitUntil: 'networkidle' })

    const data = await page.evaluate(() => {
      const h1 = document.querySelector('h1')
      const title = h1?.textContent?.trim() || ''

      const iframe = document.querySelector('iframe[src*="youtube"]')
      const videoUrl = iframe?.getAttribute('src') || ''

      const images = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.getAttribute('src') || '',
        alt: img.getAttribute('alt') || '',
      }))

      const paragraphs = Array.from(document.querySelectorAll('p'))
        .map(p => p.textContent?.trim() || '')
        .filter(t => t.length > 20)

      // Resource cards linking to child pages
      const resourceCards = Array.from(document.querySelectorAll('a')).filter(a => {
        const href = a.getAttribute('href') || ''
        return href.split('/').filter(Boolean).length === 2
      }).map(a => {
        const card = a.closest('[class*="card"]') || a.closest('li') || a
        const img = card?.querySelector('img')
        const titleEl = card?.querySelector('h2, h3, h4')
        const descEl = card?.querySelector('p')
        return {
          href: a.getAttribute('href') || '',
          title: titleEl?.textContent?.trim() || a.textContent?.trim() || '',
          image: img?.getAttribute('src') || '',
          imageAlt: img?.getAttribute('alt') || '',
          description: descEl?.textContent?.trim() || '',
        }
      })

      // Deduplicate resource cards by href
      const seen = new Set<string>()
      const uniqueCards = resourceCards.filter(c => {
        if (seen.has(c.href)) return false
        seen.add(c.href)
        return true
      })

      return { title, videoUrl, images, paragraphs, resourceCards: uniqueCards }
    })

    lessons.push({
      slug: link.href.replace(/^\//, ''),
      url: link.href,
      ...data,
    })
  }

  const fs = await import('fs')
  fs.writeFileSync('/tmp/scrape-lessons-output.json', JSON.stringify(lessons, null, 2))
  console.log('\n\nWrote results to /tmp/scrape-lessons-output.json')
  console.log(`Scraped ${lessons.length} lesson pages`)

  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
