import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteId = '69952211cb6e382590893367'
  const postType = await db.collection('posttypes').findOne({ site_id: siteId })

  // Get non-resource pages (lesson pages, home, etc.)
  const pages = await db.collection('pages').find({
    $or: [
      { site_id: siteId },
      { site_id: new mongoose.Types.ObjectId(siteId) },
    ],
    $and: [
      { $or: [
        { postTypeId: { $exists: false } },
        { postTypeId: null },
      ]}
    ]
  }).toArray()

  console.log(`Non-resource pages: ${pages.length}`)
  for (const p of pages) {
    console.log(`  - ${p.name} (${p.slug})`)
  }

  // Also check: maybe lesson pages DO have a postTypeId?
  const allPages = await db.collection('pages').find({
    $or: [
      { site_id: siteId },
      { site_id: new mongoose.Types.ObjectId(siteId) },
    ]
  }).toArray()

  console.log(`\nAll ${allPages.length} pages:`)
  for (const p of allPages) {
    const content = JSON.stringify(p.content || {})
    const allLinks: string[] = []
    // Extract all link-like values from content
    const matches = content.matchAll(/"(link|url|href|breadcrumb-link)":\s*\{?\s*"?value"?\s*:\s*"([^"]+)"/g)
    for (const m of matches) allLinks.push(`${m[1]}=${m[2]}`)
    // Also simpler format
    const simpleMatches = content.matchAll(/"(link|url|href)":\s*"([^"]+)"/g)
    for (const m of simpleMatches) allLinks.push(`${m[1]}=${m[2]}`)

    if (allLinks.length > 0) {
      const nonTrivial = allLinks.filter(l => l.includes('/') && !l.includes('http') && !l.includes('/#'))
      if (nonTrivial.length > 0) {
        console.log(`\n  ${p.name} (${p.slug}):`)
        for (const l of nonTrivial) console.log(`    ${l}`)
      }
    }
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
