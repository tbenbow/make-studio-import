/**
 * Check which pages have content overrides for Lesson Cards and Navbar blocks.
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
  console.log(`Site has ${site.pages.length} pages\n`)

  for (const p of site.pages) {
    const page = await api(`/pages/${p._id}`)
    if (!page.blocks) continue

    for (const b of page.blocks) {
      if (b.name === 'Lesson Cards' || b.name === 'LessonCards' || b.name === 'Navbar') {
        const hasContent = b.content && Object.keys(b.content).length > 0
        if (hasContent) {
          console.log(`=== ${page.name} → ${b.name} (blockId: ${b.blockId}) ===`)
          console.log(JSON.stringify(b.content, null, 2).substring(0, 1000))
          console.log()
        }
      }
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
