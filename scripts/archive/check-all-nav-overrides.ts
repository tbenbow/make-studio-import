/**
 * Check all pages for Navbar content overrides and any link issues.
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

  for (const p of site.pages) {
    const page = await api(`/pages/${p._id}`)
    if (!page.blocks) continue

    for (const b of page.blocks) {
      if (b.name !== 'Navbar') continue
      if (!b.content || Object.keys(b.content).length === 0) continue

      console.log(`=== ${page.name} (${page._id}) → Navbar ===`)
      for (const [fieldId, field] of Object.entries(b.content) as any) {
        if (field.value) {
          try {
            const parsed = JSON.parse(field.value)
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                console.log(`  ${item.label || item.text}: ${item.url || item.link}`)
              }
            } else {
              console.log(`  ${fieldId}: ${field.value.substring(0, 200)}`)
            }
          } catch {
            console.log(`  ${fieldId}: ${field.value.substring(0, 200)}`)
          }
        }
      }
      console.log()
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
