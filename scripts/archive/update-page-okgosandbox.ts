import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteId = '69952211cb6e382590893367'
  const CDN = 'https://makestudio.site/' + siteId

  // Find or create the Index page
  const indexPageId = '69952211cb6e38259089338a'
  let page = await db.collection('pages').findOne({ _id: new mongoose.Types.ObjectId(indexPageId) })

  if (page == null) {
    // Create the Index page
    console.log('Creating Index page...')
    await db.collection('pages').insertOne({
      _id: new mongoose.Types.ObjectId(indexPageId),
      name: 'Index',
      slug: '',
      site_id: siteId,
      blocks: [],
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    page = await db.collection('pages').findOne({ _id: new mongoose.Types.ObjectId(indexPageId) })
  }

  console.log('Using page:', page?._id.toString(), page?.name)

  // Get all blocks
  const blocks = await db.collection('blocks').find({ site_id: siteId }).toArray()
  console.log('Found blocks:', blocks.map(b => b.name).join(', '))
  const blockMap = new Map(blocks.map(b => [b.name, b]))

  // Helper: build content keyed by field UUIDs
  function buildContent(block: any, values: Record<string, any>) {
    const content: Record<string, { value: any }> = {}
    for (const field of (block.fields || [])) {
      const key = field.name.toLowerCase().replace(/\s+/g, '-')
      if (values[key] !== undefined) {
        content[field.id] = { value: values[key] }
      } else if (field.value !== undefined) {
        content[field.id] = { value: field.value }
      }
    }
    return content
  }

  // Helper: build items with IDs
  function buildItems(items: Record<string, any>[]) {
    return items.map(item => {
      const resolved: Record<string, any> = { id: uuidv4() }
      for (const [key, val] of Object.entries(item)) {
        resolved[key] = val
      }
      return resolved
    })
  }

  const navbar = blockMap.get('Navbar')
  const hero = blockMap.get('Hero')
  const lessonCards = blockMap.get('LessonCards')
  const footer = blockMap.get('Footer')

  if (navbar == null || hero == null || lessonCards == null || footer == null) {
    const missing = [
      navbar == null && 'Navbar',
      hero == null && 'Hero',
      lessonCards == null && 'LessonCards',
      footer == null && 'Footer'
    ].filter(Boolean)
    throw new Error('Missing blocks: ' + missing.join(', '))
  }

  const pageBlocks = [
    {
      id: uuidv4(),
      blockId: navbar._id.toString(),
      name: 'Navbar',
      description: navbar.description || '',
      content: buildContent(navbar, {
        'cta-label': 'Filter Resources',
        'cta-link': '#',
        'email': 'hello@okgosandbox.org',
        'nav-links': buildItems([
          { label: 'Home', url: '/' },
          { label: 'Lessons', url: '/lessons' },
          { label: 'More', url: '/more' },
          { label: 'About', url: '/about' },
          { label: 'Ask Ok Go', url: '/ask-ok-go' },
        ])
      })
    },
    {
      id: uuidv4(),
      blockId: hero._id.toString(),
      name: 'Hero',
      description: hero.description || '',
      content: buildContent(hero, {
        'image': `${CDN}/home-intro.webp`,
        'image-alt': 'OK Go band members',
        'headline': 'Inspiring Tools for Playful Learning.',
        'subheadline': "Helping students learn through the joy, wonder, and fun of OK Go's music videos.",
        'buttons': buildItems([
          { label: 'Explore the Lessons', link: '#lessons', style: 'ghost' }
        ])
      })
    },
    {
      id: uuidv4(),
      blockId: lessonCards._id.toString(),
      name: 'LessonCards',
      description: lessonCards.description || '',
      content: buildContent(lessonCards, {
        'items': buildItems([
          {
            image: `${CDN}/teaser-ttsp.webp`,
            'image-alt': 'This Too Shall Pass music video still',
            title: 'This Too Shall Pass',
            description: 'OK Go created this video by connecting a series of simple machines together, to create a single chain reaction machine, timed perfectly to their song. So perfectly in fact, that one section of the machine actually plays a part of the song itself.',
            link: '/this-too-shall-pass',
            'button-label': 'View Lessons',
            topics: 'Simple Machines, Chain Reactions, Pitch',
          },
          {
            image: `${CDN}/teaser-t1m.webp`,
            'image-alt': 'The One Moment music video still',
            title: 'The One Moment',
            description: 'This video was actually shot in 4 seconds, but when played back in slow motion, it stays in sync with the music. How did they do it?! A lot of math and physics is how.',
            link: '/the-one-moment',
            'button-label': 'View Lessons',
            topics: 'Math, Physics, Flip Books',
          },
          {
            image: `${CDN}/guys-paint.webp`,
            'image-alt': "The Writing's On The Wall music video still",
            title: "The Writing's On The Wall",
            description: "Everything is not what it seems in this video! See how OK Go used art and perspective to trick your brain into seeing something that isn't actually there.",
            link: '/the-writings-on-the-wall',
            'button-label': 'View Lessons',
            topics: 'Optical Illusions, Neuroscience, Perception',
          },
          {
            image: `${CDN}/udio-bg.webp`,
            'image-alt': 'Upside Down & Inside Out music video still',
            title: 'Upside Down & Inside Out',
            description: 'Making this video took OK Go to new heights in learning! Through the joy of experimentation, they learned how the rules of physics apply in microgravity.',
            link: '/upside-down-inside-out',
            'button-label': 'View Lessons',
            topics: 'Physics, Parabolas, Art',
          },
          {
            image: `${CDN}/teaser-ng.webp`,
            'image-alt': 'Needing/Getting music video still',
            title: 'Needing/Getting',
            description: 'OK Go wanted to find out if they could play their song using a car and everyday objects. Turns out they could!',
            link: '/needing-getting',
            'button-label': 'View Lessons',
            topics: 'Music, Found Instruments, Sensors',
          },
          {
            image: `${CDN}/teaser-together.webp`,
            'image-alt': 'All Together Now music video still',
            title: 'All Together Now',
            description: 'Inspired by virtual togetherness during the COVID-19 pandemic, OK Go worked together (apart) to create this music video.',
            link: '/all-together-now',
            'button-label': 'View Lessons',
            topics: 'Art, Collaboration',
          },
          {
            image: `${CDN}/this_thumbnail.webp`,
            'image-alt': 'This music video still',
            title: 'This',
            description: "It doesn't get better than this! OK Go created this visualizer using a pottery wheel and a lot of paint, proving that learning can sometimes be messy.",
            link: '/this',
            'button-label': 'View Lessons',
            topics: 'Art, Collaboration',
          },
        ])
      })
    },
    {
      id: uuidv4(),
      blockId: footer._id.toString(),
      name: 'Footer',
      description: footer.description || '',
      content: buildContent(footer, {
        'sponsors-label': 'Sponsored By:',
        'copyright': '\u00a9 2026 OK Go Sandbox',
        'fineprint': '<p>OK Go Sandbox Challenges by the <a href="https://playfullearninglab.org">Playful Learning Lab</a> at the <a href="https://stthomas.edu">University of St. Thomas</a> is licensed under a <a href="http://creativecommons.org/licenses/by-nc/4.0/">Creative Commons Attribution-NonCommercial 4.0 International License</a>.</p>',
        'colophon': '<p>A collaboration between <a href="https://okgo.net">OK Go</a> and the <a href="https://playfullearninglab.org">Playful Learning Lab</a> at the <a href="https://stthomas.edu">University of St. Thomas</a></p>',
        'sponsors': buildItems([
          { name: 'Google', link: 'https://google.com' },
          { name: 'Morton Salt', link: 'https://mortonsalt.com' },
          { name: 'Cognizant', link: 'https://cognizant.com' },
        ]),
        'social-links': buildItems([
          { label: 'Instagram', icon: 'instagram-logo', url: 'https://instagram.com/okgosandbox' },
          { label: 'Facebook', icon: 'facebook-logo', url: 'https://facebook.com/OKGoSandbox' },
          { label: 'Twitter', icon: 'twitter-logo', url: 'https://twitter.com/OKGoSandbox' },
        ]),
      })
    },
  ]

  const result = await db.collection('pages').updateOne(
    { _id: new mongoose.Types.ObjectId(indexPageId) },
    {
      $set: {
        blocks: pageBlocks,
        updatedAt: new Date(),
      }
    },
    { upsert: true }
  )

  console.log('Updated page:', result.modifiedCount || result.upsertedCount, 'docs')
  console.log('Block order:', pageBlocks.map(b => b.name).join(' > '))

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
