import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteId = '69952211cb6e382590893367'
  const objId = new mongoose.Types.ObjectId(siteId)

  // Try both string and ObjectId
  let pages = await db.collection('pages').find({ site_id: siteId }).toArray()
  if (pages.length === 0) {
    pages = await db.collection('pages').find({ site_id: objId }).toArray()
  }
  if (pages.length === 0) {
    // Try site_id as nested
    pages = await db.collection('pages').find({ 'site_id': { $in: [siteId, objId] } }).toArray()
  }
  if (pages.length === 0) {
    // Brute force - find all pages and filter
    const allPages = await db.collection('pages').find({}).limit(10).toArray()
    console.log('All pages sample:')
    allPages.forEach(p => console.log(`  ${p._id} name=${p.name} site_id=${p.site_id} type=${typeof p.site_id}`))
    await mongoose.disconnect()
    return
  }

  const page = pages.find(p => p.name === 'Index') || pages[0]
  console.log('Page:', page.name, page._id.toString())
  console.log('Page keys:', Object.keys(page))

  if (page.blocks && page.blocks.length > 0) {
    console.log('\n=== First block structure ===')
    console.log(JSON.stringify(page.blocks[0], null, 2))
    console.log('\n=== All block refs ===')
    page.blocks.forEach((b: any, i: number) => {
      console.log(`  [${i}] keys: ${Object.keys(b).join(', ')}`)
    })
  }

  // Reference: check peakperformance site
  const refPages = await db.collection('pages').find({ site_id: '6994e2c7072d25dd9abb7c00' }).toArray()
  if (refPages.length === 0) {
    const refPages2 = await db.collection('pages').find({ site_id: new mongoose.Types.ObjectId('6994e2c7072d25dd9abb7c00') }).toArray()
    refPages.push(...refPages2)
  }
  if (refPages.length > 0) {
    const refPage = refPages.find((p: any) => p.name === 'Index') || refPages[0]
    if (refPage?.blocks?.length > 0) {
      console.log('\n=== Reference block structure ===')
      console.log(JSON.stringify(refPage.blocks[0], null, 2))
    }
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
