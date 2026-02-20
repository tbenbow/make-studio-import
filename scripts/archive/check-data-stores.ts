/**
 * Check the data store values for music-videos, subjects, and grade-levels.
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

  console.log('=== Data Stores ===')
  if (site.dataStores) {
    for (const ds of site.dataStores) {
      console.log(`\n${ds.name} (${ds._id}):`)
      for (const entry of ds.entries || []) {
        console.log(`  ${entry.key} → ${entry.value} (id: ${entry.id || entry._id})`)
      }
    }
  }

  // Also check the select field config to see which data store each field uses
  console.log('\n=== Select Fields on Resource Block ===')
  const blockRes = await fetch(`${BASE}/blocks/699548e6cb6e382590895b1b`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  })
  const blocks = await blockRes.json()
  const block = blocks[0]
  for (const f of block.fields) {
    if (f.type === 'select') {
      console.log(`${f.name} (${f.id}): dataStoreId=${f.config?.dataStoreId}`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
