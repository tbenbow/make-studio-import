/**
 * Read-only: check postTypeId types on resource pages vs what the Page model expects.
 */
import mongoose from 'mongoose'

const siteId = '69952211cb6e382590893367'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (!db) throw new Error('No db')

  // Get the post type
  const postType = await db.collection('posttypes').findOne({
    $or: [{ site_id: siteId }, { site_id: new mongoose.Types.ObjectId(siteId) }],
  })
  console.log('=== POST TYPE ===')
  console.log(`  _id: ${postType?._id} (type: ${postType?._id?.constructor?.name})`)
  console.log(`  name: ${postType?.name}`)
  console.log(`  site_id: ${postType?.site_id} (type: ${typeof postType?.site_id})`)
  console.log(`  postIds count: ${postType?.postIds?.length}`)

  // Get all pages for this site
  const pages = await db.collection('pages').find({
    $or: [{ site_id: siteId }, { site_id: new mongoose.Types.ObjectId(siteId) }],
  }).toArray()

  // Separate resource pages (have postTypeId) from regular pages
  const resourcePages = pages.filter(p => p.postTypeId)
  const regularPages = pages.filter(p => !p.postTypeId)

  console.log(`\n=== SUMMARY ===`)
  console.log(`  Total pages: ${pages.length}`)
  console.log(`  Regular pages: ${regularPages.length}`)
  console.log(`  Resource pages (have postTypeId): ${resourcePages.length}`)

  console.log(`\n=== RESOURCE PAGES postTypeId CHECK ===`)
  for (const p of resourcePages) {
    const ptId = p.postTypeId
    const ptIdType = ptId instanceof mongoose.Types.ObjectId ? 'ObjectId' : typeof ptId
    const matches = String(ptId) === String(postType?._id)
    console.log(`  ${p.name.padEnd(45)} postTypeId=${ptIdType.padEnd(10)} value=${ptId} matches=${matches}`)
  }

  // Test: can Mongoose Page.find({ postTypeId }) match these?
  // The Page model defines postTypeId as ObjectId.
  // If stored as string, Mongoose casts the query param to ObjectId which won't match a string value.
  console.log(`\n=== MONGOOSE QUERY TEST ===`)

  // Simulate what the deployment does: Page.find({ postTypeId: postType._id })
  // postType._id is an ObjectId
  const withObjectIdQuery = await db.collection('pages').find({
    postTypeId: postType?._id  // ObjectId query
  }).toArray()
  console.log(`  Query with ObjectId postTypeId: ${withObjectIdQuery.length} results`)

  const withStringQuery = await db.collection('pages').find({
    postTypeId: String(postType?._id)  // String query
  }).toArray()
  console.log(`  Query with String postTypeId: ${withStringQuery.length} results`)

  // Check site_id types too while we're at it
  console.log(`\n=== SITE_ID TYPE CHECK (sample) ===`)
  for (const p of pages.slice(0, 5)) {
    const sidType = p.site_id instanceof mongoose.Types.ObjectId ? 'ObjectId' : typeof p.site_id
    console.log(`  ${p.name.padEnd(30)} site_id=${sidType}`)
  }
  for (const p of resourcePages.slice(0, 3)) {
    const sidType = p.site_id instanceof mongoose.Types.ObjectId ? 'ObjectId' : typeof p.site_id
    console.log(`  ${p.name.padEnd(30)} site_id=${sidType}`)
  }

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
