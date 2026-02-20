import mongoose from 'mongoose'

const siteId = '69952211cb6e382590893367'

const working = ['chain-reaction-machines', 'hit-the-note', 'simple-machines-scavenger-hunt', 'the-one-moment-of-math', 'timing-is-everything', 'flip-book-challenge', 'illusions', 'cube', 'triangle', 'how-parabolas-work', 'art-in-microgravity', 'art-of-experimentation', 'surrounding-sounds', 'spin-art']
const broken = ['making-this-too-shall-pass', 'making-the-one-moment', 'anamorphic', 'the-camera', 'tims-face', 'finale', 'making-upside-down-inside-out', 'making-needing-getting', 'circular-motion']

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const postType = await db.collection('posttypes').findOne({ site_id: siteId })
  console.log('PostType full doc:')
  console.log(JSON.stringify(postType, null, 2).slice(0, 1000))

  console.log('\n=== COMPARING WORKING vs BROKEN RESOURCES ===\n')

  for (const slug of [...working.slice(0, 2), ...broken.slice(0, 2)]) {
    const page = await db.collection('pages').findOne({ slug, postTypeId: postType?._id })
    if (page) {
      console.log(`${slug} (${working.includes(slug) ? 'WORKING' : 'BROKEN'}):`)
      console.log(`  _id: ${page._id}`)
      console.log(`  site_id: ${page.site_id} (type: ${typeof page.site_id})`)
      console.log(`  postTypeId: ${page.postTypeId} (type: ${typeof page.postTypeId})`)
      console.log(`  blocks: ${page.blocks?.length || 0}`)
      console.log(`  content keys: ${Object.keys(page.content || {}).length}`)
      console.log(`  createdAt: ${page.createdAt}`)
      console.log()
    }
  }

  // Check if there's a difference in how the IDs are stored in postIds
  console.log('=== postIds types ===')
  if (postType?.postIds) {
    for (const id of postType.postIds.slice(0, 5)) {
      console.log(`  ${id} (type: ${typeof id}, constructor: ${id?.constructor?.name})`)
    }
  }

  // Check the site.pages array — are the broken pages in there?
  const site = await db.collection('sites').findOne({ _id: new mongoose.Types.ObjectId(siteId) })
  const sitePageIds = new Set(site?.pages?.map((p: any) => p._id.toString()) || [])

  console.log('\n=== In site.pages? ===')
  for (const slug of [...working.slice(0, 3), ...broken]) {
    const page = await db.collection('pages').findOne({ slug, postTypeId: postType?._id })
    if (page) {
      console.log(`  ${slug}: ${sitePageIds.has(page._id.toString()) ? 'YES' : 'NO'} (${working.includes(slug) ? 'working' : 'BROKEN'})`)
    }
  }

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
