/**
 * Investigate why /lessons/all-together-now.html returns 404.
 * Read-only.
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

  // Find the "All Together Now" page
  for (const p of site.pages) {
    const page = await api(`/pages/${p._id}`)
    if (page.name?.toLowerCase().includes('all together')) {
      console.log(`Found: "${page.name}"`)
      console.log(`  _id: ${page._id}`)
      console.log(`  slug: ${page.slug || 'none'}`)
      console.log(`  parentId: ${page.parentId || 'none'}`)
      console.log(`  postTypeId: ${page.postTypeId || 'none'}`)
      console.log(`  blocks: ${page.blocks?.length || 0}`)

      // Check what the parent is
      if (page.parentId) {
        try {
          const parent = await api(`/pages/${page.parentId}`)
          console.log(`  parent name: ${parent.name}`)
          console.log(`  parent slug: ${parent.slug || 'none'}`)
        } catch (e: any) {
          console.log(`  parent: ERROR - ${e.message}`)
        }
      }
    }
  }

  // Also list all pages under the Lessons folder
  console.log('\n=== All pages with parentId (folder children) ===')
  const lessonsFolder = site.pages.find((p: any) => {
    // We need to check each page
    return false
  })

  // Find the Lessons folder
  for (const p of site.pages) {
    const page = await api(`/pages/${p._id}`)
    if (page.name === 'Lessons' && !page.parentId) {
      console.log(`\nLessons folder: ${page._id}`)
      // Find all children
      for (const p2 of site.pages) {
        const child = await api(`/pages/${p2._id}`)
        if (child.parentId === page._id || String(child.parentId) === String(page._id)) {
          console.log(`  ${child.name} (${child._id})`)
        }
      }
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
