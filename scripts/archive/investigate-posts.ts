/**
 * Read-only: deep investigation of why resource posts aren't deploying.
 */
import mongoose from 'mongoose'

const siteId = '69952211cb6e382590893367'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (!db) throw new Error('No db')

  const postType = await db.collection('posttypes').findOne({
    $or: [{ site_id: siteId }, { site_id: new mongoose.Types.ObjectId(siteId) }],
  })
  if (!postType) { console.log('No post type found!'); return }

  console.log('=== POST TYPE ===')
  console.log(`  name: ${postType.name}`)
  console.log(`  _id: ${postType._id}`)
  console.log(`  detailPageId: ${postType.detailPageId} (type: ${typeof postType.detailPageId})`)
  console.log(`  indexPageId: ${postType.indexPageId} (type: ${typeof postType.indexPageId})`)
  console.log(`  postIds: ${postType.postIds?.length} entries`)
  console.log(`  postIds types: ${postType.postIds?.slice(0, 3).map((id: any) => typeof id)}`)

  // Check detail page exists and has content
  const detailPage = await db.collection('pages').findOne({
    _id: new mongoose.Types.ObjectId(postType.detailPageId)
  })
  console.log(`\n=== DETAIL PAGE (template) ===`)
  if (detailPage) {
    console.log(`  name: ${detailPage.name}`)
    console.log(`  slug: ${detailPage.slug || 'none'}`)
    console.log(`  site_id: ${detailPage.site_id} (type: ${detailPage.site_id?.constructor?.name})`)
    console.log(`  blocks: ${detailPage.blocks?.length || 0}`)
    if (detailPage.blocks) {
      for (const b of detailPage.blocks) {
        console.log(`    ${b.name} (blockId: ${b.blockId})`)
      }
    }
  } else {
    console.log('  NOT FOUND!')
    // Try string ID
    const detailPage2 = await db.collection('pages').findOne({ _id: postType.detailPageId })
    console.log(`  Try with raw ID: ${detailPage2 ? 'FOUND' : 'NOT FOUND'}`)
  }

  // Check index page
  const indexPage = await db.collection('pages').findOne({
    _id: new mongoose.Types.ObjectId(postType.indexPageId)
  })
  console.log(`\n=== INDEX PAGE ===`)
  if (indexPage) {
    console.log(`  name: ${indexPage.name}`)
    console.log(`  slug: ${indexPage.slug || 'none'}`)
    console.log(`  blocks: ${indexPage.blocks?.length || 0}`)
  } else {
    console.log('  NOT FOUND!')
  }

  // Check if postIds match actual resource pages
  const resourcePages = await db.collection('pages').find({
    postTypeId: postType._id
  }).toArray()

  console.log(`\n=== POST ID MATCHING ===`)
  console.log(`  postType.postIds: ${postType.postIds?.length} entries`)
  console.log(`  Actual pages with postTypeId: ${resourcePages.length}`)

  // Check which postIds actually resolve to pages
  let matchCount = 0
  let missingFromPostIds = 0
  const postIdStrings = new Set(postType.postIds?.map((id: any) => String(id)) || [])

  for (const page of resourcePages) {
    const pageIdStr = String(page._id)
    if (postIdStrings.has(pageIdStr)) {
      matchCount++
    } else {
      console.log(`  Page ${page.name} (${pageIdStr}) NOT in postType.postIds`)
      missingFromPostIds++
    }
  }
  console.log(`  Matched: ${matchCount}`)
  console.log(`  In DB but not in postIds: ${missingFromPostIds}`)

  // Check for postIds that don't have corresponding pages
  const pageIdSet = new Set(resourcePages.map(p => String(p._id)))
  let orphanedIds = 0
  for (const postId of (postType.postIds || [])) {
    if (!pageIdSet.has(String(postId))) {
      const orphanPage = await db.collection('pages').findOne({ _id: new mongoose.Types.ObjectId(String(postId)) })
      console.log(`  postId ${postId} → ${orphanPage ? `page "${orphanPage.name}" (postTypeId: ${orphanPage.postTypeId})` : 'NO PAGE FOUND'}`)
      orphanedIds++
    }
  }
  if (orphanedIds > 0) console.log(`  Orphaned postIds: ${orphanedIds}`)

  // Check what slugs the deployment would generate from page names
  console.log(`\n=== SLUG DERIVATION FROM NAMES ===`)
  console.log(`  (deployment does: name.toLowerCase().replace(/\\s+/g, '-'))`)
  for (const p of resourcePages.slice(0, 10)) {
    const derivedSlug = p.name?.toLowerCase().replace(/\s+/g, '-')
    const storedSlug = p.slug
    const match = derivedSlug === storedSlug
    console.log(`  "${p.name}"`)
    console.log(`    derived: ${derivedSlug}`)
    console.log(`    stored:  ${storedSlug || 'none'}`)
    if (storedSlug && !match) console.log(`    ⚠ MISMATCH`)
  }

  // Check the site.pages array for post type pages
  const site = await db.collection('sites').findOne({ _id: new mongoose.Types.ObjectId(siteId) })
  const sitePageIds = new Set((site?.pages || []).map((p: any) => String(p._id)))
  console.log(`\n=== SITE.PAGES ARRAY CHECK ===`)
  console.log(`  site.pages count: ${site?.pages?.length || 0}`)
  let inSitePages = 0
  let notInSitePages = 0
  for (const p of resourcePages) {
    if (sitePageIds.has(String(p._id))) {
      inSitePages++
    } else {
      console.log(`  MISSING from site.pages: ${p.name} (${p._id})`)
      notInSitePages++
    }
  }
  console.log(`  Resource pages in site.pages: ${inSitePages}`)
  console.log(`  Resource pages NOT in site.pages: ${notInSitePages}`)

  // Check the deployment code's page categorization logic
  // It skips pages named "Detail", "First Post", "Example Post"
  console.log(`\n=== PAGES THAT DEPLOYMENT WOULD SKIP ===`)
  const skipNames = ['Detail', 'First Post', 'Example Post']
  for (const p of await db.collection('pages').find({
    $or: [{ site_id: siteId }, { site_id: new mongoose.Types.ObjectId(siteId) }],
    name: { $in: skipNames }
  }).toArray()) {
    console.log(`  "${p.name}" (_id: ${p._id}, postTypeId: ${p.postTypeId || 'none'})`)
  }

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
