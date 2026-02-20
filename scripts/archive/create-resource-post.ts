import mongoose from 'mongoose'
import { randomUUID } from 'crypto'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteId = '69952211cb6e382590893367'

  // Get the Resources post type
  const postType = await db.collection('posttypes').findOne({ site_id: siteId })
  if (postType == null) throw new Error('No post type')
  console.log('PostType:', postType.name, postType._id.toString())

  // Get the block IDs from the detail page
  const lessonDetailBlock = await db.collection('blocks').findOne({ name: 'LessonDetail', site_id: siteId })
  const relatedBlock = await db.collection('blocks').findOne({ name: 'RelatedResources', site_id: siteId })
  if (lessonDetailBlock == null || relatedBlock == null) throw new Error('Missing blocks')

  // Field UUIDs for LessonDetail
  const ld: Record<string, string> = {}
  for (const f of lessonDetailBlock.fields) {
    ld[f.name.toLowerCase().replace(/\s+/g, '-')] = f.id
  }

  // Field UUIDs for RelatedResources
  const rr: Record<string, string> = {}
  for (const f of relatedBlock.fields) {
    rr[f.name.toLowerCase().replace(/\s+/g, '-')] = f.id
  }

  console.log('LessonDetail fields:', ld)
  console.log('RelatedResources fields:', rr)

  // Create the post
  const postName = 'Chain Reaction Machines'
  const postSlug = 'chain-reaction-machines'

  const content: Record<string, Record<string, { value: any }>> = {
    [lessonDetailBlock._id.toString()]: {
      [ld['breadcrumb-label']]: { value: 'This Too Shall Pass' },
      [ld['breadcrumb-link']]: { value: '/this-too-shall-pass' },
      [ld['title']]: { value: 'Chain Reaction Machines' },
      [ld['video-url']]: { value: '' },
      [ld['image']]: { value: '' },
      [ld['image-alt']]: { value: 'Chain Reaction Machines' },
      [ld['description']]: { value: 'This challenge will engage students in recognizing different simple machines and creating their own in a chain reaction machine, using the engineering design process to explore forces and motion.' },
      [ld['materials-label']]: { value: 'Materials' },
      [ld['materials']]: { value: [
        { id: randomUUID(), label: 'Educator Guide', subtitle: 'Download the Guide', url: '#', icon: 'file-pdf' },
        { id: randomUUID(), label: 'TTSP Clip - 6 sec.', subtitle: 'Download the Clip', url: '#', icon: 'play' },
        { id: randomUUID(), label: 'TTSP Clip - 15 sec.', subtitle: 'Download the Clip', url: '#', icon: 'play' },
        { id: randomUUID(), label: 'TTSP Clip - 22 sec.', subtitle: 'Download the Clip', url: '#', icon: 'play' },
      ]},
    },
    [relatedBlock._id.toString()]: {
      [rr['heading']]: { value: 'More Resources' },
      [rr['parent-label']]: { value: 'This Too Shall Pass' },
      [rr['parent-link']]: { value: '/this-too-shall-pass' },
      [rr['items']]: { value: [
        { id: randomUUID(), title: 'Making "This Too Shall Pass"', link: '/this-too-shall-pass/making-this-too-shall-pass' },
        { id: randomUUID(), title: 'Hit the Note', link: '/this-too-shall-pass/hit-the-note' },
        { id: randomUUID(), title: 'Simple Machines Scavenger Hunt', link: '/this-too-shall-pass/simple-machines-scavenger-hunt' },
      ]},
    },
  }

  const postDoc = {
    name: postName,
    slug: postSlug,
    site_id: new mongoose.Types.ObjectId(siteId),
    postTypeId: postType._id,
    blocks: [],
    content,
    settings: {
      title: postName,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection('pages').insertOne(postDoc)
  const postId = result.insertedId.toString()
  console.log('\nCreated post:', postName, postId)

  // Add post to postType.postIds
  await db.collection('posttypes').updateOne(
    { _id: postType._id },
    { $push: { postIds: postId } as any }
  )
  console.log('Added to postType.postIds')

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
