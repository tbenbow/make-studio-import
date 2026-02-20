import dotenv from 'dotenv'
dotenv.config()
const BASE = process.env.MAKE_STUDIO_URL!
const TOKEN = process.env.MAKE_STUDIO_TOKEN!
const SITE_ID = process.env.MAKE_STUDIO_SITE!

async function main() {
  const res = await fetch(`${BASE}/sites/${SITE_ID}`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  })
  const site = await res.json()
  for (const ds of site.dataStores || []) {
    console.log(`"${ds.name}" → slug: "${ds.slug}" (id: ${ds._id})`)
  }
}
main().catch(e => { console.error(e); process.exit(1) })
