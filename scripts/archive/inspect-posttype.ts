import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteId = '69952211cb6e382590893367'
  const postType = await db.collection('posttypes').findOne({ site_id: siteId })
  if (postType == null) throw new Error('No post type found')

  console.log('PostType:', postType.name, postType._id.toString())

  // Detail page with all blocks
  const detailPage = await db.collection('pages').findOne({
    _id: new mongoose.Types.ObjectId(postType.detailPageId)
  })
  if (detailPage == null) throw new Error('No detail page')

  console.log('\nDetail page:', detailPage.name, '- blocks:', detailPage.blocks.length)
  for (const b of detailPage.blocks) {
    console.log('\n--- Block:', b.name, '---')
    console.log('blockId:', b.blockId)

    // Get the block to see its fields
    const block = await db.collection('blocks').findOne({ _id: new mongoose.Types.ObjectId(b.blockId) })
    if (block) {
      console.log('Fields:')
      for (const f of (block.fields || [])) {
        console.log(' ', f.id, '|', f.name, '|', f.type)
      }
    }

    // Show the content mapping
    if (b.content) {
      console.log('Content (from detail page):')
      for (const [fieldId, val] of Object.entries(b.content)) {
        const value = (val as any).value
        const preview = typeof value === 'string' ? value.slice(0, 80) : JSON.stringify(value).slice(0, 80)
        console.log(' ', fieldId, '=', preview)
      }
    }
  }

  // Check the existing post
  if (postType.postIds && postType.postIds.length > 0) {
    const post = await db.collection('pages').findOne({
      _id: new mongoose.Types.ObjectId(postType.postIds[0])
    })
    if (post) {
      console.log('\n=== Existing post:', post.name, '===')
      console.log('Keys:', Object.keys(post))
      console.log('postTypeId:', post.postTypeId)
      console.log('blocks:', JSON.stringify(post.blocks, null, 2).slice(0, 200))
      console.log('content:', JSON.stringify(post.content, null, 2).slice(0, 500))
      console.log('settings:', JSON.stringify(post.settings, null, 2))
    }
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
