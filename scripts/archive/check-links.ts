import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')
  const siteOid = new mongoose.Types.ObjectId('69952211cb6e382590893367')

  const pages = await db.collection('pages').find({ site_id: siteOid }).toArray()
  for (const p of pages) {
    const content = JSON.stringify(p.content || {})
    const links = content.match(/"link":"[^"]+"/g)
    if (!links) continue
    const bad = links.filter(l => !l.includes('/resources/') && l.match(/\/[a-z].*\/[a-z]/))
    if (bad.length > 0) {
      console.log(`${p.name} (${p.slug}):`)
      for (const l of bad) console.log(`  ${l}`)
    }
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
