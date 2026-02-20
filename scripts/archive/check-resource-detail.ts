/**
 * Deep check of resource pages - blocks, content, and what individual pages look like.
 */
import dotenv from 'dotenv'
dotenv.config()

const BASE = process.env.MAKE_STUDIO_URL!
const TOKEN = process.env.MAKE_STUDIO_TOKEN!
const SITE_ID = process.env.MAKE_STUDIO_SITE!

async function api(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  })
  if (!res.ok) throw new Error(`${path}: ${res.status}`)
  return res.json()
}

async function main() {
  const site = await api(`/sites/${SITE_ID}`)

  // Check the Detail template page fully
  console.log('=== Detail template page (full) ===')
  const detailPage = await api(`/pages/69960f5fcb6e3825908a0049`)
  console.log(JSON.stringify(detailPage, null, 2).substring(0, 3000))

  // Check first 3 resource posts fully
  console.log('\n\n=== First 3 resource posts (full) ===')
  let count = 0
  for (const p of site.pages) {
    const page = await api(`/pages/${p._id}`)
    if (!page.postTypeId) continue
    if (count >= 3) break
    count++
    console.log(`\n--- ${page.name} ---`)
    console.log(JSON.stringify(page, null, 2).substring(0, 2000))
  }

  // Check a resource detail page live to see if it has images
  console.log('\n\n=== Check live resource page ===')
  try {
    const liveRes = await fetch('https://preview-ok-go-sandbox.makestudio.site/resources/chain-reaction-machines.html')
    console.log(`chain-reaction-machines.html: ${liveRes.status}`)
    const html = await liveRes.text()
    // Find img tags
    const imgMatches = html.match(/<img[^>]*src="([^"]*)"[^>]*>/g) || []
    for (const img of imgMatches) {
      console.log(`  ${img.substring(0, 200)}`)
    }
  } catch (e: any) {
    console.log(`Error: ${e.message}`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
