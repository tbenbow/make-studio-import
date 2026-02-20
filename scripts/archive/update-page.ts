import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteId = process.argv[2] || '6994e2c7072d25dd9abb7c00'

  // Find pages for this site
  const pages = await db.collection('pages').find({ site_id: siteId }).toArray()
  if (pages.length === 0) {
    // Try with ObjectId
    const pages2 = await db.collection('pages').find({ site_id: new mongoose.Types.ObjectId(siteId) }).toArray()
    if (pages2.length === 0) {
      // List all pages to debug
      const allPages = await db.collection('pages').find({}).limit(5).toArray()
      console.log('No pages found. Sample pages:', allPages.map(p => ({ id: p._id.toString(), name: p.name, site_id: p.site_id })))
      throw new Error('No pages found for site ' + siteId)
    }
    pages.push(...pages2)
  }
  console.log('Pages:', pages.map(p => p.name || p.title || 'unnamed').join(', '))
  const page = pages.find(p => p.name === 'Index') || pages[0]
  const pageId = page._id.toString()
  console.log('Using page:', pageId, page.name)

  const blocks = await db.collection('blocks').find({ site_id: siteId }).toArray()
  console.log('Found blocks:', blocks.map(b => b.name).join(', '))
  const blockMap = new Map(blocks.map(b => [b.name, b]))

  const blockOrder = ['Navbar', 'Hero', 'PainPoints', 'Features', 'Process', 'Testimonial', 'About', 'CTA', 'Footer']

  const pageBlocks = blockOrder.map(name => {
    const block = blockMap.get(name)
    if (block == null) { console.log('Missing block:', name); return null }
    return {
      _id: new mongoose.Types.ObjectId(),
      blockId: block._id.toString(),
      blockName: block.name,
      fields: block.fields || []
    }
  }).filter(Boolean)

  const result = await db.collection('pages').updateOne(
    { _id: new mongoose.Types.ObjectId(pageId) },
    { $set: { blocks: pageBlocks } }
  )

  console.log('Updated page:', result.modifiedCount, 'blocks:', pageBlocks.length)
  console.log('Block order:', pageBlocks.map((b: any) => b.blockName).join(' > '))

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
