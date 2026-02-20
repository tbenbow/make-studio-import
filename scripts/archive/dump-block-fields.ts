/**
 * Dump all fields for the Resource detail block.
 */
import dotenv from 'dotenv'
dotenv.config()

const BASE = process.env.MAKE_STUDIO_URL!
const TOKEN = process.env.MAKE_STUDIO_TOKEN!

async function main() {
  const res = await fetch(`${BASE}/blocks/699548e6cb6e382590895b1b`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  })
  const blocks = await res.json()
  const block = blocks[0]

  console.log('Block name:', block.name)
  console.log('Fields:')
  for (const f of block.fields) {
    console.log(`  ${f.id} → "${f.name}" (type: ${f.type})`)
  }

  // Now check a post's content to see which field IDs have values
  console.log('\n--- Chain Reaction Machines content ---')
  const pageRes = await fetch(`${BASE}/pages/6996160f5c1f48ab0bad5091`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  })
  const page = await pageRes.json()
  const blockContent = page.content?.['699548e6cb6e382590895b1b']
  if (blockContent) {
    for (const [fieldId, data] of Object.entries(blockContent) as any) {
      const fieldName = block.fields.find((f: any) => f.id === fieldId)?.name || 'UNKNOWN'
      const val = typeof data.value === 'string' ? data.value.substring(0, 100) : JSON.stringify(data.value).substring(0, 100)
      console.log(`  "${fieldName}" (${fieldId}): ${val || '(empty)'}`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
