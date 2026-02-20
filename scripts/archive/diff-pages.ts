import mongoose from 'mongoose'

const siteId = '69952211cb6e382590893367'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const postType = await db.collection('posttypes').findOne({ site_id: siteId })

  // Working resource page
  const working = await db.collection('pages').findOne({ slug: 'chain-reaction-machines', postTypeId: postType?._id })
  // Broken resource page
  const broken = await db.collection('pages').findOne({ slug: 'making-this-too-shall-pass', postTypeId: postType?._id })
  // First resource (created via API?)
  const first = await db.collection('pages').findOne({ _id: new mongoose.Types.ObjectId('69960f5fcb6e3825908a004b') })

  console.log('=== WORKING: chain-reaction-machines ===')
  console.log(JSON.stringify(working, null, 2))

  console.log('\n=== BROKEN: making-this-too-shall-pass ===')
  console.log(JSON.stringify(broken, null, 2))

  console.log('\n=== FIRST RESOURCE (possibly API-created): ===')
  if (first) console.log(JSON.stringify(first, null, 2).slice(0, 3000))

  // Also compare a working lesson page vs broken all-together-now
  const workingLesson = await db.collection('pages').findOne({
    slug: 'this-too-shall-pass',
    postTypeId: { $exists: false },
    $or: [{ site_id: siteId }, { site_id: new mongoose.Types.ObjectId(siteId) }],
  })
  const brokenLesson = await db.collection('pages').findOne({
    slug: 'all-together-now',
    postTypeId: { $exists: false },
    $or: [{ site_id: siteId }, { site_id: new mongoose.Types.ObjectId(siteId) }],
  })

  // Just compare top-level keys
  console.log('\n=== WORKING LESSON: this-too-shall-pass ===')
  if (workingLesson) {
    const { content, blocks, ...rest } = workingLesson
    console.log('Keys:', Object.keys(workingLesson).sort())
    console.log('Top-level (without content/blocks):', JSON.stringify(rest, null, 2))
    console.log('blocks count:', blocks?.length)
    console.log('site_id type:', typeof workingLesson.site_id, workingLesson.site_id?.constructor?.name)
  }

  console.log('\n=== BROKEN LESSON: all-together-now ===')
  if (brokenLesson) {
    const { content, blocks, ...rest } = brokenLesson
    console.log('Keys:', Object.keys(brokenLesson).sort())
    console.log('Top-level (without content/blocks):', JSON.stringify(rest, null, 2))
    console.log('blocks count:', blocks?.length)
    console.log('site_id type:', typeof brokenLesson.site_id, brokenLesson.site_id?.constructor?.name)
  }

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
