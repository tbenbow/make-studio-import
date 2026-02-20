/**
 * List all pages with key fields.
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
  console.log(`Site: ${site.name}, ${site.pages.length} pages\n`)

  for (const p of site.pages) {
    const page = await api(`/pages/${p._id}`)
    const parent = page.parentId ? ` (parent: ${page.parentId})` : ''
    const postType = page.postTypeId ? ` [postType: ${page.postTypeId}]` : ''
    console.log(`${page.name} | id: ${page._id}${parent}${postType}`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
