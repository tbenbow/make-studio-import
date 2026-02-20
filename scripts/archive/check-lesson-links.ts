import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteId = '69952211cb6e382590893367'

  // Get all pages for this site (try both string and ObjectId)
  const pages = await db.collection('pages').find({
    $or: [
      { site_id: siteId },
      { site_id: new mongoose.Types.ObjectId(siteId) },
    ]
  }).toArray()

  console.log(`Total pages: ${pages.length}`)

  for (const p of pages) {
    if (!p.content) continue
    const content = JSON.stringify(p.content)
    // Find all link values
    const links = content.match(/"link":\{?"value":"[^"]*"/g) || content.match(/"link":"[^"]+"/g)
    if (!links) continue

    const hasResource = links.some(l => l.includes('/') && !l.includes('/resources/') && !l.includes('http') && !l.includes('#'))
    if (hasResource) {
      console.log(`\n${p.name} (slug: ${p.slug}, postTypeId: ${p.postTypeId || 'none'}):`)
      for (const l of links) {
        if (l.includes('/') && !l.includes('http')) console.log(`  ${l}`)
      }
    }
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
