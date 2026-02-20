/**
 * Check LessonDetail block structure to understand field mapping.
 */
import dotenv from 'dotenv'
dotenv.config()

const BASE = process.env.MAKE_STUDIO_URL!
const TOKEN = process.env.MAKE_STUDIO_TOKEN!

async function main() {
  // Check LessonDetail block
  const res = await fetch(`${BASE}/blocks/699548e6cb6e382590895b1b`, {
    headers: { 'Authorization': `Bearer ${process.env.MAKE_STUDIO_TOKEN}` },
  })
  const block = await res.json()
  console.log('=== LessonDetail Block (full) ===')
  console.log(JSON.stringify(block, null, 2).substring(0, 3000))

  // Also check the Resource Cards - Auto block
  const res2 = await fetch(`${BASE}/blocks/69962bf4cb6e3825908a1a73`, {
    headers: { 'Authorization': `Bearer ${process.env.MAKE_STUDIO_TOKEN}` },
  })
  const block2 = await res2.json()
  console.log('\n=== Resource Cards - Auto Block (full) ===')
  console.log(JSON.stringify(block2, null, 2).substring(0, 3000))
}

main().catch(e => { console.error(e); process.exit(1) })
