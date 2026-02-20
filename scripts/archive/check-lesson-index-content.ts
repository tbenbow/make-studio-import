/**
 * Check the lesson index page content for link values.
 */
import dotenv from 'dotenv'
dotenv.config()

const BASE = process.env.MAKE_STUDIO_URL!
const TOKEN = process.env.MAKE_STUDIO_TOKEN!

async function main() {
  const res = await fetch(`${BASE}/pages/69962174cb6e3825908a15a5`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  })
  const page = await res.json()

  for (const b of page.blocks) {
    if (b.name !== 'LessonCards' && b.name !== 'Lesson Cards') continue
    if (!b.content) continue
    for (const [, field] of Object.entries(b.content) as any) {
      if (!field.value) continue
      const items = JSON.parse(field.value)
      for (const item of items) {
        console.log(`${item.title}: ${item.link}`)
      }
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
