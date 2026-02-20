import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto('https://okgosandbox.org/more', { waitUntil: 'networkidle' })

  // Get all video sections with their headings and video data
  const sections = await page.evaluate(() => {
    const results: { heading: string; videos: { title: string; videoId: string }[] }[] = []

    // The page has sections with h2 headings and video grids beneath them
    // Look for all section headings and the videos within each
    const allH2s = document.querySelectorAll('h2')

    for (const h2 of allH2s) {
      const heading = h2.textContent?.trim() || ''
      if (heading === '' || heading === 'Filter Resources') continue

      // Find the video container - usually the next sibling or parent section
      const section = h2.closest('section') || h2.parentElement
      if (section == null) continue

      // Get all video items in this section
      const videoItems: { title: string; videoId: string }[] = []

      // Look for video thumbnails/links with YouTube IDs
      const items = section.querySelectorAll('[data-video-id], [data-youtube-id], a[href*="youtube"], img[src*="youtube"], iframe[src*="youtube"]')

      // Also check for custom video elements or data attributes
      const allElements = section.querySelectorAll('*')
      for (const el of allElements) {
        // Check for YouTube image thumbnails
        const img = el.querySelector('img[src*="img.youtube.com"]') || (el.tagName === 'IMG' && (el as HTMLImageElement).src.includes('img.youtube.com') ? el : null)
        if (img) {
          const src = (img as HTMLImageElement).src || img.getAttribute('src') || ''
          const match = src.match(/\/vi\/([a-zA-Z0-9_-]+)\//)
          if (match) {
            const videoId = match[1]
            // Get title from nearby text
            const titleEl = el.querySelector('h3, h4, p, span') || el.closest('li')?.querySelector('h3, h4, p, span')
            const title = titleEl?.textContent?.trim() || ''
            if (videoItems.every(v => v.videoId !== videoId)) {
              videoItems.push({ title, videoId })
            }
          }
        }
      }

      if (videoItems.length > 0) {
        results.push({ heading, videos: videoItems })
      }
    }

    return results
  })

  if (sections.length === 0) {
    console.log('No sections found with h2 approach. Trying alternative...')

    // Try a different approach - look for all YouTube thumbnails and group by section
    const allVideos = await page.evaluate(() => {
      const videos: { videoId: string; title: string; sectionText: string }[] = []
      const imgs = document.querySelectorAll('img[src*="img.youtube.com"]')
      for (const img of imgs) {
        const src = img.getAttribute('src') || ''
        const match = src.match(/\/vi\/([a-zA-Z0-9_-]+)\//)
        if (match == null) continue

        // Walk up to find section heading
        let el: Element | null = img
        let heading = ''
        while (el && el !== document.body) {
          const h2 = el.querySelector('h2')
          if (h2) {
            heading = h2.textContent?.trim() || ''
            break
          }
          // Check previous siblings for h2
          let prev = el.previousElementSibling
          while (prev) {
            if (prev.tagName === 'H2') {
              heading = prev.textContent?.trim() || ''
              break
            }
            prev = prev.previousElementSibling
          }
          if (heading) break
          el = el.parentElement
        }

        // Get title near the image
        const parent = img.closest('li') || img.closest('a') || img.parentElement
        const titleEl = parent?.querySelector('h3, h4, [class*="title"]')
        const title = titleEl?.textContent?.trim() || ''

        videos.push({ videoId: match[1], title, sectionText: heading })
      }
      return videos
    })

    console.log('All videos found:', JSON.stringify(allVideos, null, 2))
  } else {
    console.log(JSON.stringify(sections, null, 2))
  }

  // Also try getting the raw HTML structure to understand the layout
  const structure = await page.evaluate(() => {
    const main = document.querySelector('main') || document.querySelector('[role="main"]') || document.body
    // Get all h2 headings and count of nearby YouTube thumbnails
    const h2s = main.querySelectorAll('h2')
    const result: { heading: string; videoCount: number; nearbyYoutubeIds: string[] }[] = []
    for (const h2 of h2s) {
      const heading = h2.textContent?.trim() || ''
      // Find the containing section/div
      let container = h2.parentElement
      // Walk up to find a reasonable container
      for (let i = 0; i < 3 && container; i++) {
        const imgs = container.querySelectorAll('img[src*="img.youtube.com"]')
        if (imgs.length > 0) {
          const ids = Array.from(imgs).map(img => {
            const m = (img.getAttribute('src') || '').match(/\/vi\/([a-zA-Z0-9_-]+)\//)
            return m ? m[1] : ''
          }).filter(Boolean)
          result.push({ heading, videoCount: ids.length, nearbyYoutubeIds: ids })
          break
        }
        container = container.parentElement
      }
    }
    return result
  })

  console.log('\n\nSection structure:')
  console.log(JSON.stringify(structure, null, 2))

  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
