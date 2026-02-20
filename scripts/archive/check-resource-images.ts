/**
 * Check how images are stored on individual resource posts.
 * Read-only investigation.
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

  // Check a few resource pages (ones with postTypeId)
  let count = 0
  for (const p of site.pages) {
    const page = await api(`/pages/${p._id}`)
    if (!page.postTypeId) continue
    if (count >= 3) break
    count++

    console.log(`\n=== ${page.name} (${page._id}) ===`)
    console.log(`  postTypeId: ${page.postTypeId}`)

    if (page.blocks) {
      for (const b of page.blocks) {
        console.log(`  Block: ${b.name} (blockId: ${b.blockId})`)
        if (b.content) {
          for (const [fieldId, field] of Object.entries(b.content) as any) {
            const val = field.value || ''
            // Check if it looks like an image URL
            if (val.includes('http') || val.includes('.webp') || val.includes('.jpg') || val.includes('.png') || fieldId.toLowerCase().includes('image')) {
              console.log(`    ${fieldId}: ${val.substring(0, 200)}`)
            }
          }
          // Show all field IDs
          console.log(`    All field IDs: ${Object.keys(b.content).join(', ')}`)
        }
      }
    }

    // Check if there's a top-level image or thumbnail field
    if (page.image) console.log(`  page.image: ${page.image}`)
    if (page.thumbnail) console.log(`  page.thumbnail: ${page.thumbnail}`)
  }

  // Also check the Detail template page to understand the field structure
  console.log('\n=== Detail template page ===')
  const detailPage = await api(`/pages/69960f5fcb6e3825908a0049`)
  console.log(`  name: ${detailPage.name}`)
  if (detailPage.blocks) {
    for (const b of detailPage.blocks) {
      console.log(`  Block: ${b.name} (blockId: ${b.blockId})`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
