import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto('https://okgosandbox.org/ask-ok-go', { waitUntil: 'networkidle' })

  const data = await page.evaluate(() => {
    // Get all YouTube thumbnails with their titles
    const videos: { videoId: string; title: string; question: string }[] = []
    const imgs = document.querySelectorAll('img[src*="img.youtube.com"]')

    for (const img of imgs) {
      const src = img.getAttribute('src') || ''
      const match = src.match(/\/vi\/([a-zA-Z0-9_-]+)\//)
      if (match == null) continue

      // Find nearby title/question text
      const container = img.closest('li') || img.closest('article') || img.closest('div')
      const headings = container?.querySelectorAll('h2, h3, h4, p')
      let title = ''
      let question = ''
      if (headings) {
        for (const h of headings) {
          const text = h.textContent?.trim() || ''
          if (text.length > 5 && text !== 'Video Player is loading.') {
            if (title === '') title = text
            else if (question === '') question = text
          }
        }
      }

      videos.push({ videoId: match[1], title, question })
    }

    return videos
  })

  console.log(JSON.stringify(data, null, 2))
  console.log(`\nTotal videos: ${data.length}`)

  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
