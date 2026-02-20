/**
 * Check the More page's current blocks and content.
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

  for (const p of site.pages) {
    const page = await api(`/pages/${p._id}`)
    if (page.name !== 'More') continue

    console.log(`=== More page (${page._id}) ===`)
    console.log(`Blocks: ${page.blocks?.length || 0}`)

    for (const b of page.blocks || []) {
      console.log(`\n--- ${b.name} (blockId: ${b.blockId}, id: ${b.id}) ---`)
      if (b.content) {
        for (const [fieldId, field] of Object.entries(b.content) as any) {
          const val = typeof field.value === 'string' ? field.value.substring(0, 200) : JSON.stringify(field.value)?.substring(0, 200)
          console.log(`  ${fieldId}: ${val}`)
        }
      } else {
        console.log('  (no content overrides)')
      }
    }
    break
  }
}

main().catch(e => { console.error(e); process.exit(1) })
