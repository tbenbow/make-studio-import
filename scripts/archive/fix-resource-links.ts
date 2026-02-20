import mongoose from 'mongoose'

const siteId = '69952211cb6e382590893367'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteOid = new mongoose.Types.ObjectId(siteId)

  // Get the Resources post type
  const postType = await db.collection('posttypes').findOne({ site_id: siteId })
  if (postType == null) throw new Error('No post type')

  // Get all resource posts
  const resourcePosts = await db.collection('pages').find({ postTypeId: postType._id }).toArray()
  console.log(`Found ${resourcePosts.length} resource posts`)

  // Fix RelatedResources links in each resource post
  let fixedRelated = 0
  for (const post of resourcePosts) {
    if (!post.content) continue
    let changed = false

    for (const [blockId, fields] of Object.entries(post.content) as any) {
      for (const [fieldId, fieldData] of Object.entries(fields) as any) {
        if (!Array.isArray(fieldData?.value)) continue
        for (const item of fieldData.value) {
          if (item.link && !item.link.startsWith('/resources/')) {
            // Extract slug from the old link (last segment)
            const slug = item.link.split('/').pop()
            item.link = `/resources/${slug}.html`
            changed = true
          }
        }
      }
    }

    if (changed) {
      await db.collection('pages').updateOne(
        { _id: post._id },
        { $set: { content: post.content } }
      )
      fixedRelated++
    }
  }
  console.log(`Fixed RelatedResources links in ${fixedRelated} resource posts`)

  // Fix ResourceCards links in lesson pages (non-postType pages)
  const lessonPages = await db.collection('pages').find({
    site_id: siteOid,
    postTypeId: { $exists: false },
  }).toArray()
  console.log(`Found ${lessonPages.length} non-resource pages`)

  let fixedLessons = 0
  for (const page of lessonPages) {
    if (!page.content) continue
    let changed = false

    for (const [blockId, fields] of Object.entries(page.content) as any) {
      for (const [fieldId, fieldData] of Object.entries(fields) as any) {
        if (!Array.isArray(fieldData?.value)) continue
        for (const item of fieldData.value) {
          if (item.link && typeof item.link === 'string' && item.link.match(/^\/[^/]+\/[^/]+$/) && !item.link.startsWith('/resources/')) {
            const slug = item.link.split('/').pop()
            item.link = `/resources/${slug}.html`
            changed = true
          }
        }
      }
    }

    if (changed) {
      await db.collection('pages').updateOne(
        { _id: page._id },
        { $set: { content: page.content } }
      )
      fixedLessons++
    }
  }
  console.log(`Fixed ResourceCards links in ${fixedLessons} lesson pages`)

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
