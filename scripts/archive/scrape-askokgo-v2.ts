import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto('https://okgosandbox.org/ask-ok-go', { waitUntil: 'networkidle' })

  // Get the full HTML structure of the video section to understand layout
  const data = await page.evaluate(() => {
    // Find all video items - they're likely in a grid/list
    // Each has a YouTube thumbnail and a question text
    const results: { videoId: string; question: string; nearbyText: string[] }[] = []

    // Try finding by the repeated structure pattern
    // Look at all elements with YouTube thumbnails
    const allImgs = document.querySelectorAll('img[src*="img.youtube.com"]')

    for (const img of allImgs) {
      const src = img.getAttribute('src') || ''
      const match = src.match(/\/vi\/([a-zA-Z0-9_-]+)\//)
      if (match == null) continue

      // Walk up through parents to find text content
      let el: Element | null = img
      const nearbyText: string[] = []

      // Check up to 5 levels of parents
      for (let i = 0; i < 6 && el; i++) {
        el = el.parentElement
        if (el == null) break

        // Get direct text children and heading/paragraph text
        for (const child of el.children) {
          const text = child.textContent?.trim() || ''
          if (text.length > 3 && text.length < 200 && text !== 'Video Player is loading.' && !text.includes('img.youtube.com')) {
            nearbyText.push(`[${child.tagName}] ${text}`)
          }
        }

        // If we found text, stop looking further up
        if (nearbyText.length > 0) break
      }

      results.push({
        videoId: match[1],
        question: '',
        nearbyText,
      })
    }

    // Also get all heading elements on the page for context
    const headings: string[] = []
    for (const h of document.querySelectorAll('h1, h2, h3, h4, h5')) {
      headings.push(`${h.tagName}: ${h.textContent?.trim()}`)
    }

    // Get the main content area HTML structure (first 10000 chars)
    const main = document.querySelector('main') || document.body
    const html = main.innerHTML

    return { results, headings, htmlLength: html.length, htmlSnippet: html.slice(0, 8000) }
  })

  console.log('Headings:', JSON.stringify(data.headings, null, 2))
  console.log('\nVideos:')
  for (const r of data.results) {
    console.log(`  ${r.videoId}: ${r.nearbyText.join(' | ')}`)
  }

  // Print HTML snippet to understand structure
  console.log('\n\nHTML snippet (first 8000 chars):')
  console.log(data.htmlSnippet)

  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
