/**
 * Fix lesson card links on the lessons index page.
 * The page has content overrides with old-format links like /this-too-shall-pass
 * that need to be /lessons/this-too-shall-pass.html
 */
import dotenv from 'dotenv'
dotenv.config()

const BASE = process.env.MAKE_STUDIO_URL!
const TOKEN = process.env.MAKE_STUDIO_TOKEN!
const SITE_ID = process.env.MAKE_STUDIO_SITE!

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
  const site = await api('GET', `/sites/${SITE_ID}`)

  // Find the lessons index page (lowercase "index" with LessonCards block that has wrong links)
  for (const p of site.pages) {
    const page = await api('GET', `/pages/${p._id}`)
    if (!page.blocks) continue

    for (const b of page.blocks) {
      if (b.name !== 'LessonCards' && b.name !== 'Lesson Cards') continue
      if (!b.content) continue

      for (const [fieldId, field] of Object.entries(b.content) as any) {
        if (!field.value) continue
        let items: any[]
        try {
          items = JSON.parse(field.value)
        } catch { continue }

        // Check if any links need fixing
        const needsFix = items.some((item: any) =>
          item.link && !item.link.startsWith('/lessons/') && item.link !== '/'
        )

        if (!needsFix) {
          console.log(`  ${page.name}: links already correct`)
          continue
        }

        console.log(`\n=== Fixing ${page.name} (${page._id}) ===`)
        for (const item of items) {
          if (item.link && !item.link.startsWith('/lessons/')) {
            const slug = item.link.replace(/^\//, '').replace(/\.html$/, '')
            const newLink = `/lessons/${slug}.html`
            console.log(`  "${item.title}": ${item.link} → ${newLink}`)
            item.link = newLink
          }
        }

        // Update the page
        const updatedContent = {
          ...b.content,
          [fieldId]: { ...field, value: JSON.stringify(items) }
        }

        const updatedBlocks = page.blocks.map((block: any) => {
          if (block.blockId === b.blockId && block.content === b.content) {
            return { ...block, content: updatedContent }
          }
          return block
        })

        console.log(`\n  Updating page...`)
        await api('PATCH', `/pages/${page._id}`, { blocks: updatedBlocks })
        console.log(`  ✓ Done`)
      }
    }
  }

  console.log('\nComplete')
}

main().catch(e => { console.error(e); process.exit(1) })
