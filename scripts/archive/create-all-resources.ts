import mongoose from 'mongoose'
import { randomUUID } from 'crypto'

const resources = [
  {
    parentTitle: 'This Too Shall Pass',
    parentSlug: '/this-too-shall-pass',
    title: 'Making "This Too Shall Pass"',
    slug: 'making-this-too-shall-pass',
    description: 'From collaborating with engineers, to the lengthy testing process and many attempts it took to finally get it shot, OK Go tell the story of how "This Too Shall Pass" came to pass.',
    videoUrl: 'https://www.youtube.com/embed/11s15rmI7Qs?rel=0',
  },
  // Skip Chain Reaction Machines — already created
  {
    parentTitle: 'This Too Shall Pass',
    parentSlug: '/this-too-shall-pass',
    title: 'Hit the Note',
    slug: 'hit-the-note',
    description: 'Inspired by the tuned glasses in the music video, students will learn about pitch and musical notes through a science inquiry activity, then play a song of their choice by tuning cups.',
    videoUrl: 'https://www.youtube.com/embed/JxPa5M9Ok_Y?rel=0',
  },
  {
    parentTitle: 'This Too Shall Pass',
    parentSlug: '/this-too-shall-pass',
    title: 'Simple Machines Scavenger Hunt',
    slug: 'simple-machines-scavenger-hunt',
    description: 'A chain reaction machine is a series of simple machines — one after the next. We challenge students to discover the simple machines in OK Go\'s videos.',
    videoUrl: 'https://www.youtube.com/embed/zCxFFvKTLKE?rel=0',
  },
  {
    parentTitle: 'The One Moment',
    parentSlug: '/the-one-moment',
    title: 'Making "The One Moment"',
    slug: 'making-the-one-moment',
    description: 'OK Go discuss how bursting salt, crashing balls, flying paint and some serious calculations can make a really amazing music video.',
    videoUrl: 'https://www.youtube.com/embed/c38ifMPUwCk?rel=0',
  },
  {
    parentTitle: 'The One Moment',
    parentSlug: '/the-one-moment',
    title: 'The One Moment of Math',
    slug: 'the-one-moment-of-math',
    description: 'Lead singer Damian Kulash makes spreadsheets cool again, as he explains the math and basic physics required to create the music video.',
    videoUrl: 'https://www.youtube.com/embed/DvElCxbimxc?rel=0',
  },
  {
    parentTitle: 'The One Moment',
    parentSlug: '/the-one-moment',
    title: 'Timing Is Everything',
    slug: 'timing-is-everything',
    description: 'In this challenge, students will explore the impact gravity has on objects of different sizes and masses by dropping objects from a consistent height and recording their falls.',
    videoUrl: 'https://www.youtube.com/embed/GD3fnHzNEoU?rel=0',
  },
  {
    parentTitle: 'The One Moment',
    parentSlug: '/the-one-moment',
    title: 'Flip Book Challenge',
    slug: 'flip-book-challenge',
    description: 'Inspired by the two flip books used in "The One Moment" video, this exercise will challenge students to create their own flip book. Creating a flip book includes telling a story using art and design.',
    videoUrl: 'https://www.youtube.com/embed/yQTjlG5GjTw?rel=0',
  },
  {
    parentTitle: "The Writing's On The Wall",
    parentSlug: '/the-writings-on-the-wall',
    title: 'Illusions',
    slug: 'illusions',
    description: 'OK Go discusses the brain processes behind optical illusions to give us an understanding of how we are able to see things that aren\'t really there.',
    videoUrl: 'https://www.youtube.com/embed/vhluNMCMAlg?rel=0',
  },
  {
    parentTitle: "The Writing's On The Wall",
    parentSlug: '/the-writings-on-the-wall',
    title: 'Cube',
    slug: 'cube',
    description: 'In this challenge, students will develop their understanding of optical illusions and explore how to create illusions like those in "The Writing\'s On the Wall" music video by making a geometric shape inside of a shoebox.',
    videoUrl: 'https://www.youtube.com/embed/v4vsXSyIezI?rel=0',
  },
  {
    parentTitle: "The Writing's On The Wall",
    parentSlug: '/the-writings-on-the-wall',
    title: 'Triangle',
    slug: 'triangle',
    description: 'This challenge engages students by making a project that encourages students to create their own small-scale optical illusion: an accordion fold.',
    videoUrl: 'https://www.youtube.com/embed/CLge0S_MwO0?rel=0',
  },
  {
    parentTitle: "The Writing's On The Wall",
    parentSlug: '/the-writings-on-the-wall',
    title: 'Behind-The-Scenes: Anamorphic Illusions',
    slug: 'anamorphic',
    description: 'Lead singer Damian Kulash describes anamorphism and how anamorphic illusions were created in the music video for "The Writing\'s On the Wall."',
    videoUrl: 'https://www.youtube.com/embed/xRCZeEUP6Uk?rel=0',
  },
  {
    parentTitle: "The Writing's On The Wall",
    parentSlug: '/the-writings-on-the-wall',
    title: 'Behind-The-Scenes: The Camera',
    slug: 'the-camera',
    description: 'This video provides a closer look into the creation of the camera and the camera movements that helped make "The Writing\'s On the Wall" music video possible.',
    videoUrl: 'https://www.youtube.com/embed/Z9Lf_l7Yo7g?rel=0',
  },
  {
    parentTitle: "The Writing's On The Wall",
    parentSlug: '/the-writings-on-the-wall',
    title: "Behind-The-Scenes: Tim's Face",
    slug: 'tims-face',
    description: 'Bassist Tim Nordwind explains how they created the illusion of his face out of a collection of objects in the music video for "The Writing\'s On the Wall."',
    videoUrl: 'https://www.youtube.com/embed/VmEqeWwFAYA?rel=0',
  },
  {
    parentTitle: "The Writing's On The Wall",
    parentSlug: '/the-writings-on-the-wall',
    title: 'Behind-The-Scenes: The Finale',
    slug: 'finale',
    description: 'Art director Hannah Alpert describes the process of creating the final image of "The Writing\'s On the Wall" music video.',
    videoUrl: 'https://www.youtube.com/embed/nic21WAIJRg?rel=0',
  },
  {
    parentTitle: 'Upside Down & Inside Out',
    parentSlug: '/upside-down-inside-out',
    title: 'Making Upside Down & Inside Out',
    slug: 'making-upside-down-inside-out',
    description: 'OK Go dives right in to answering the questions everyone is asking. How were they weightless? What did it feel like? And how did they do it for an entire song?',
    videoUrl: 'https://www.youtube.com/embed/pnTqZ68fI7Q?rel=0',
  },
  {
    parentTitle: 'Upside Down & Inside Out',
    parentSlug: '/upside-down-inside-out',
    title: 'How Parabolas Work',
    slug: 'how-parabolas-work',
    description: 'OK Go explains what a parabola is and why is it so important for the creation of this video. (Hint: Microgravity)',
    videoUrl: 'https://www.youtube.com/embed/bMrX014HTgU?rel=0',
  },
  {
    parentTitle: 'Upside Down & Inside Out',
    parentSlug: '/upside-down-inside-out',
    title: 'Art in Microgravity',
    slug: 'art-in-microgravity',
    description: 'OK Go explores the rarely explored challenge creating art in microgravity. How? through play, experimentation and trial and error!',
    videoUrl: 'https://www.youtube.com/embed/f9pfFJMGx34?rel=0',
  },
  {
    parentTitle: 'Upside Down & Inside Out',
    parentSlug: '/upside-down-inside-out',
    title: 'Art of Experimentation',
    slug: 'art-of-experimentation',
    description: 'Now you try! The band will show you how to use fluid dynamics and color to experiment and create art!',
    videoUrl: 'https://www.youtube.com/embed/e40XwWWtkRM?rel=0',
  },
  {
    parentTitle: 'Needing/Getting',
    parentSlug: '/needing-getting',
    title: 'Making "Needing/\u200BGetting"',
    slug: 'making-needing-getting',
    description: 'OK Go discusses a car as a musical instrument, finding everyday objects that make music and the engineering behind the giant race track they use to play the song.',
    videoUrl: 'https://www.youtube.com/embed/GDhYmLmg87o?rel=0',
  },
  {
    parentTitle: 'Needing/Getting',
    parentSlug: '/needing-getting',
    title: 'Surrounding Sounds',
    slug: 'surrounding-sounds',
    description: 'This challenge is designed to encourage students to discover the musical qualities of various everyday objects and put them to use in making music. The world is full of sounds to explore. Anything can be a musical instrument with a little bit of creativity!',
    videoUrl: 'https://www.youtube.com/embed/jxD_QQWyhCc?rel=0',
  },
  {
    parentTitle: 'All Together Now',
    parentSlug: '/all-together-now',
    title: 'Art Together Now',
    slug: 'art-together-now',
    description: 'We challenge you to create a collaborative piece of art that shows your gratitude to someone in your community. Download the document for more details!',
    videoUrl: 'https://www.youtube.com/embed/uScwUcrJuec?rel=0',
  },
  {
    parentTitle: 'This',
    parentSlug: '/this',
    title: 'Spin Art',
    slug: 'spin-art',
    description: 'In this challenge, students will learn how different choices affect art by making spin art projects and understanding how to control the process.',
    videoUrl: 'https://www.youtube.com/embed/mnwXnOV7b3A?rel=0',
  },
  {
    parentTitle: 'This',
    parentSlug: '/this',
    title: 'Art of Circular Motion',
    slug: 'circular-motion',
    description: 'In this challenge, students will learn about the processes of uniform circular motion by exploring the process of creating spin art.',
    videoUrl: 'https://www.youtube.com/embed/mnwXnOV7b3A?rel=0',
  },
]

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteId = '69952211cb6e382590893367'

  // Get the Resources post type
  const postType = await db.collection('posttypes').findOne({ site_id: siteId })
  if (postType == null) throw new Error('No post type')
  console.log('PostType:', postType.name, postType._id.toString())

  // Get block field mappings
  const lessonDetailBlock = await db.collection('blocks').findOne({ name: 'LessonDetail', site_id: siteId })
  const relatedBlock = await db.collection('blocks').findOne({ name: 'RelatedResources', site_id: siteId })
  if (lessonDetailBlock == null || relatedBlock == null) throw new Error('Missing blocks')

  const ld: Record<string, string> = {}
  for (const f of lessonDetailBlock.fields) {
    ld[f.name.toLowerCase().replace(/\s+/g, '-')] = f.id
  }

  const rr: Record<string, string> = {}
  for (const f of relatedBlock.fields) {
    rr[f.name.toLowerCase().replace(/\s+/g, '-')] = f.id
  }

  console.log('LessonDetail fields:', ld)
  console.log('RelatedResources fields:', rr)

  // Group resources by parent for related resources
  const byParent = new Map<string, typeof resources>()
  for (const r of resources) {
    const group = byParent.get(r.parentSlug) || []
    group.push(r)
    byParent.set(r.parentSlug, group)
  }

  const createdIds: string[] = []

  for (const resource of resources) {
    // Build related resources (siblings from same parent, excluding self)
    const siblings = (byParent.get(resource.parentSlug) || []).filter(r => r.slug !== resource.slug)

    const content: Record<string, Record<string, { value: any }>> = {
      [lessonDetailBlock._id.toString()]: {
        [ld['breadcrumb-label']]: { value: resource.parentTitle },
        [ld['breadcrumb-link']]: { value: resource.parentSlug },
        [ld['title']]: { value: resource.title },
        [ld['video-url']]: { value: resource.videoUrl },
        [ld['image']]: { value: '' },
        [ld['image-alt']]: { value: resource.title },
        [ld['description']]: { value: resource.description },
        [ld['materials-label']]: { value: 'Materials' },
        [ld['materials']]: { value: [] },
      },
      [relatedBlock._id.toString()]: {
        [rr['heading']]: { value: 'More Resources' },
        [rr['parent-label']]: { value: resource.parentTitle },
        [rr['parent-link']]: { value: resource.parentSlug },
        [rr['items']]: { value: siblings.map(s => ({
          id: randomUUID(),
          title: s.title,
          link: `/resources/${s.slug}.html`,
        }))},
      },
    }

    const postDoc = {
      name: resource.title,
      slug: resource.slug,
      site_id: new mongoose.Types.ObjectId(siteId),
      postTypeId: postType._id,
      blocks: [],
      content,
      settings: {
        title: resource.title,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('pages').insertOne(postDoc)
    const postId = result.insertedId.toString()
    createdIds.push(postId)
    console.log(`Created: "${resource.title}" (${postId})`)
  }

  // Add all new postIds to the postType
  await db.collection('posttypes').updateOne(
    { _id: postType._id },
    { $push: { postIds: { $each: createdIds } } as any }
  )
  console.log(`\nAdded ${createdIds.length} posts to postType.postIds`)
  console.log('Total posts:', (postType.postIds?.length || 0) + createdIds.length)

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
