/**
 * Fix the Upside Down link on the lesson index page content override.
 * /lessons/upside-down-inside-out.html → /lessons/upside-down-and-inside-out.html
 */
import dotenv from 'dotenv'
dotenv.config()

const BASE = process.env.MAKE_STUDIO_URL!
const TOKEN = process.env.MAKE_STUDIO_TOKEN!

async function api(method: string, path: string, body?: any) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`${method} ${path}: ${res.status} ${JSON.stringify(err)}`)
  }
  return res.json()
}

async function main() {
  const pageId = '69962174cb6e3825908a15a5'
  const page = await api('GET', `/pages/${pageId}`)

  const updatedBlocks = page.blocks.map((b: any) => {
    if (b.name !== 'LessonCards' && b.name !== 'Lesson Cards') return b
    if (!b.content) return b

    const updatedContent: any = {}
    for (const [fieldId, field] of Object.entries(b.content) as any) {
      if (!field.value) { updatedContent[fieldId] = field; continue }
      try {
        const items = JSON.parse(field.value)
        for (const item of items) {
          if (item.link === '/lessons/upside-down-inside-out.html') {
            console.log(`Fixing: ${item.link} → /lessons/upside-down-and-inside-out.html`)
            item.link = '/lessons/upside-down-and-inside-out.html'
          }
        }
        updatedContent[fieldId] = { ...field, value: JSON.stringify(items) }
      } catch {
        updatedContent[fieldId] = field
      }
    }
    return { ...b, content: updatedContent }
  })

  await api('PATCH', `/pages/${pageId}`, { blocks: updatedBlocks })
  console.log('✓ Updated')
}

main().catch(e => { console.error(e); process.exit(1) })
