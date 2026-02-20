/**
 * Check how select field values are actually stored.
 * Look at Circular Motion's content to see what we set vs what the UI expects.
 */
import dotenv from 'dotenv'
dotenv.config()

const BASE = process.env.MAKE_STUDIO_URL!
const TOKEN = process.env.MAKE_STUDIO_TOKEN!

async function main() {
  // Check Circular Motion (699618d0c59fc5d98d85090a)
  const res = await fetch(`${BASE}/pages/699618d0c59fc5d98d85090a`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  })
  const page = await res.json()

  const blockContent = page.content?.['699548e6cb6e382590895b1b']
  if (!blockContent) { console.log('No block content'); return }

  // Show the select field values
  const selectFields = {
    'Music Video': '46251d5e-3ba7-43d6-b832-af494801edcb',
    'Subjects': 'e74ea5a6-dc5f-41d0-b48a-58fadb9f77cc',
    'Grade Level': '2b53cdc7-cd12-4657-9b08-95367546b5fd',
  }

  for (const [name, fieldId] of Object.entries(selectFields)) {
    const val = blockContent[fieldId]
    console.log(`${name} (${fieldId}):`)
    console.log(`  raw:`, JSON.stringify(val))
    console.log(`  type of value:`, typeof val?.value)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
