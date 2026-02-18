import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (!db) throw new Error('No db')

  const siteId = '69952211cb6e382590893367'

  // Find the Index page
  let pages = await db.collection('pages').find({ site_id: siteId }).toArray()
  if (pages.length === 0) {
    pages = await db.collection('pages').find({ site_id: new mongoose.Types.ObjectId(siteId) }).toArray()
  }
  const page = pages.find(p => p.name === 'Index') || pages[0]
  if (!page) throw new Error('No page found')
  console.log('Using page:', page._id.toString(), page.name)

  // Get all blocks
  const blocks = await db.collection('blocks').find({ site_id: siteId }).toArray()
  console.log('Found blocks:', blocks.map(b => b.name).join(', '))
  const blockMap = new Map(blocks.map(b => [b.name, b]))

  // Helper: build content keyed by field UUIDs
  function buildContent(block: any, values: Record<string, any>) {
    const content: Record<string, { value: any }> = {}
    for (const field of (block.fields || [])) {
      const key = field.name.toLowerCase().replace(/\s+/g, '_')
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
        resolved[key.toLowerCase().replace(/\s+/g, '_')] = val
      }
      return resolved
    })
  }

  const BASE = 'https://okgosandbox.org'

  const navbar = blockMap.get('Navbar')
  const hero = blockMap.get('Hero')
  const lessonCards = blockMap.get('LessonCards')
  const footer = blockMap.get('Footer')

  if (!navbar || !hero || !lessonCards || !footer) {
    throw new Error('Missing blocks: ' + [!navbar && 'Navbar', !hero && 'Hero', !lessonCards && 'LessonCards', !footer && 'Footer'].filter(Boolean).join(', '))
  }

  const pageBlocks = [
    {
      id: uuidv4(),
      blockId: navbar._id.toString(),
      name: 'Navbar',
      description: 'Site navigation header',
      content: buildContent(navbar, {
        logo_text: 'OK Go Sandbox',
        cta_label: 'Filter Resources',
        cta_link: '#',
        nav_links: buildItems([
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
      description: 'Hero with image and headline',
      content: buildContent(hero, {
        image: `${BASE}/images/home-intro-1@2x.jpg`,
        image_alt: 'OK Go band members in colorful jumpsuits',
        headline: 'Inspiring Tools for Playful Learning.',
        subheadline: "Helping students learn through the joy, wonder, and fun of OK Go's music videos.",
        cta_label: 'Explore the Lessons',
        cta_link: '#lessons',
      })
    },
    {
      id: uuidv4(),
      blockId: lessonCards._id.toString(),
      name: 'LessonCards',
      description: 'Alternating lesson cards',
      content: buildContent(lessonCards, {
        items: buildItems([
          {
            image: `${BASE}/videos/this-too-shall-pass/teaser-ttsp@2x.jpg`,
            image_alt: 'This Too Shall Pass music video still',
            title: 'This Too Shall Pass',
            description: 'OK Go created this video by connecting a series of simple machines together, to create a single chain reaction machine, timed perfectly to their song. So perfectly in...',
            link: '/this-too-shall-pass',
            button_label: 'View Lessons',
            topics: 'Simple Machines, Chain Reactions, Pitch',
          },
          {
            image: `${BASE}/videos/the-one-moment/teaser-t1m@2x.jpg`,
            image_alt: 'The One Moment music video still',
            title: 'The One Moment',
            description: 'This video was actually shot in 4 seconds, but when played back in slow motion, it stays in sync with the music. How did they do it?! A...',
            link: '/the-one-moment',
            button_label: 'View Lessons',
            topics: 'Math, Physics, Flip Books',
          },
          {
            image: `${BASE}/videos/the-writings-on-the-wall/poster-finale@2x.jpg`,
            image_alt: "The Writing's On The Wall music video still",
            title: "The Writing's On The Wall",
            description: "Everything is not what it seems in this video! See how OK Go used art and perspective to trick your brain into seeing something that isn't actually there.",
            link: '/the-writings-on-the-wall',
            button_label: 'View Lessons',
            topics: 'Optical Illusions, Neuroscience, Perception',
          },
          {
            image: `${BASE}/videos/upside-down-inside-out/udio-bg.jpg`,
            image_alt: 'Upside Down & Inside Out music video still',
            title: 'Upside Down & Inside Out',
            description: 'Making this video took OK Go to new heights in learning! Through the joy of experimentation, they learned how the rules of physics apply in microgravity (everything floats!)...',
            link: '/upside-down-inside-out',
            button_label: 'View Lessons',
            topics: 'Physics, Parabolas, Art',
          },
          {
            image: `${BASE}/videos/needing-getting/teaser-ng@2x.jpg`,
            image_alt: 'Needing/Getting music video still',
            title: 'Needing/Getting',
            description: 'OK Go wanted to find out if they could play their song using a car and everyday objects. Turns out they could!... by stunt driving a car with...',
            link: '/needing-getting',
            button_label: 'View Lessons',
            topics: 'Music, Found Instruments, Sensors',
          },
          {
            image: `${BASE}/videos/all-together-now/teaser-together@2x.jpg`,
            image_alt: 'All Together Now music video still',
            title: 'All Together Now',
            description: 'Inspired by virtual togetherness during the COVID-19 pandemic, OK Go worked together (apart) to create this music video, ending with a special tribute to our frontline healthcare workers.',
            link: '/all-together-now',
            button_label: 'View Lessons',
            topics: 'Art, Collaboration',
          },
          {
            image: `${BASE}/videos/this/this_thumbnail.jpg`,
            image_alt: 'This music video still',
            title: 'This',
            description: "It doesn't get better than this! OK Go created this visualizer using a pottery wheel and a lot of paint, proving that learning can sometimes be messy (and...",
            link: '/this',
            button_label: 'View Lessons',
            topics: 'Art, Collaboration',
          },
        ])
      })
    },
    {
      id: uuidv4(),
      blockId: footer._id.toString(),
      name: 'Footer',
      description: 'Site footer with sponsors',
      content: buildContent(footer, {
        sponsors_label: 'Sponsored By:',
        copyright: '© 2026 OK Go Sandbox',
        fineprint: '<p>OK Go Sandbox Challenges by the <a href="https://playfullearninglab.org">Playful Learning Lab</a> at the <a href="https://stthomas.edu">University of St. Thomas</a> is licensed under a <a href="http://creativecommons.org/licenses/by-nc/4.0/">Creative Commons Attribution-NonCommercial 4.0 International License</a>.</p>',
        colophon: '<p>A collaboration between <a href="https://okgo.net">OK Go</a> and the <a href="https://playfullearninglab.org">Playful Learning Lab</a> at the <a href="https://stthomas.edu">University of St. Thomas</a></p>',
        sponsors: buildItems([
          { name: 'Google', link: 'https://google.com' },
          { name: 'Morton Salt', link: 'https://mortonsalt.com' },
          { name: 'Cognizant', link: 'https://cognizant.com' },
        ]),
        social_links: buildItems([
          { label: 'Instagram', icon: 'instagram-logo', url: 'https://instagram.com/okgosandbox' },
          { label: 'Facebook', icon: 'facebook-logo', url: 'https://facebook.com/OKGoSandbox' },
          { label: 'Twitter', icon: 'twitter-logo', url: 'https://twitter.com/OKGoSandbox' },
        ]),
      })
    },
  ]

  const result = await db.collection('pages').updateOne(
    { _id: page._id },
    { $set: { blocks: pageBlocks } }
  )

  console.log('Updated page:', result.modifiedCount)
  console.log('Block order:', pageBlocks.map(b => b.name).join(' > '))

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
