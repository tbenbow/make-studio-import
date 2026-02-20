import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (!db) throw new Error('No db')

  const siteId = '69952211cb6e382590893367'

  // Get all blocks
  const blocks = await db.collection('blocks').find({ site_id: siteId }).toArray()
  console.log('Found blocks:', blocks.map(b => b.name).join(', '))
  const blockMap = new Map(blocks.map(b => [b.name, b]))

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

  const navbar = blockMap.get('Navbar')!
  const videoHero = blockMap.get('VideoHero')!
  const resourceCards = blockMap.get('ResourceCards')!
  const footer = blockMap.get('Footer')!

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
      blockId: videoHero._id.toString(),
      name: 'VideoHero',
      description: 'Video hero with about card',
      content: buildContent(videoHero, {
        title: 'This Too Shall Pass',
        video_url: 'https://www.youtube.com/embed/qybUFnY7Y8w?rel=0&modestbranding=1',
        poster: `${BASE}/videos/this-too-shall-pass/poster-ttsp@2x.jpg`,
        illustration: `${BASE}/videos/this-too-shall-pass/guys@2x.png`,
        illustration_alt: 'OK Go band members illustration',
        about_heading: 'About the Music Video',
        about_text: '<p>OK Go created this video by connecting a series of simple machines together, to create a single chain reaction machine, timed perfectly to their song. So perfectly in fact, that one section of the machine actually plays a part of the song itself.</p>',
      })
    },
    {
      id: uuidv4(),
      blockId: resourceCards._id.toString(),
      name: 'ResourceCards',
      description: 'Resource cards grid',
      content: buildContent(resourceCards, {
        items: buildItems([
          {
            image: `${BASE}/resources/making-this-too-shall-pass/poster-mttsp.jpg`,
            image_alt: 'Making This Too Shall Pass',
            title: 'Making "This Too Shall Pass"',
            tags: "<span class='inline-block bg-brand/10 text-brand px-2 py-0.5 body-sm rounded'>Engineering</span> <span class='inline-block bg-brand/10 text-brand px-2 py-0.5 body-sm rounded'>Physics</span> <span class='inline-block bg-brand/10 text-brand px-2 py-0.5 body-sm rounded'>Science</span>",
            description: 'From collaborating with engineers, to the lengthy testing process and many attempts it took to finally get it shot, OK Go tell the story of how "This Too..."',
            link: '/this-too-shall-pass/making-this-too-shall-pass',
          },
          {
            image: `${BASE}/resources/chain-reaction-machines/poster-chain.jpg`,
            image_alt: 'Chain Reaction Machines',
            title: 'Chain Reaction Machines',
            tags: "<span class='inline-block bg-fg-alt/20 text-fg-muted px-2 py-0.5 body-sm rounded'>Grade 3-5</span> <span class='inline-block bg-brand/10 text-brand px-2 py-0.5 body-sm rounded'>Engineering</span> <span class='inline-block bg-brand/10 text-brand px-2 py-0.5 body-sm rounded'>Physics</span> <span class='inline-block bg-brand/10 text-brand px-2 py-0.5 body-sm rounded'>Science</span>",
            description: 'This challenge will engage students in recognizing different simple machines and creating their own in a chain reaction machine, using the engineering design process to explore forces and...',
            link: '/this-too-shall-pass/chain-reaction-machines',
          },
          {
            image: `${BASE}/resources/hit-the-note/poster-hit.jpg`,
            image_alt: 'Hit the Note',
            title: 'Hit the Note',
            tags: "<span class='inline-block bg-fg-alt/20 text-fg-muted px-2 py-0.5 body-sm rounded'>Grade K-2</span> <span class='inline-block bg-fg-alt/20 text-fg-muted px-2 py-0.5 body-sm rounded'>Grade 3-5</span> <span class='inline-block bg-fg-alt/20 text-fg-muted px-2 py-0.5 body-sm rounded'>Grade 6-8</span> <span class='inline-block bg-brand/10 text-brand px-2 py-0.5 body-sm rounded'>Math</span> <span class='inline-block bg-brand/10 text-brand px-2 py-0.5 body-sm rounded'>Physics</span> <span class='inline-block bg-brand/10 text-brand px-2 py-0.5 body-sm rounded'>Music</span>",
            description: 'Inspired by the tuned glasses in the music video, students will learn about pitch and musical notes through a science inquiry activity, then play a song of their...',
            link: '/this-too-shall-pass/hit-the-note',
          },
          {
            image: `${BASE}/resources/simple-machines-scavenger-hunt/poster-simple.jpg`,
            image_alt: 'Simple Machines Scavenger Hunt',
            title: 'Simple Machines Scavenger Hunt',
            tags: "<span class='inline-block bg-fg-alt/20 text-fg-muted px-2 py-0.5 body-sm rounded'>Grade 3-5</span> <span class='inline-block bg-brand/10 text-brand px-2 py-0.5 body-sm rounded'>Engineering</span> <span class='inline-block bg-brand/10 text-brand px-2 py-0.5 body-sm rounded'>Physics</span> <span class='inline-block bg-brand/10 text-brand px-2 py-0.5 body-sm rounded'>Science</span>",
            description: "A chain reaction machine is a series of simple machines — one after the next. We challenge students to discover the simple machines in OK Go's videos.",
            link: '/this-too-shall-pass/simple-machines-scavenger-hunt',
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

  // Check if page already exists
  let pages = await db.collection('pages').find({ site_id: siteId }).toArray()
  if (pages.length === 0) {
    pages = await db.collection('pages').find({ site_id: new mongoose.Types.ObjectId(siteId) }).toArray()
  }

  const existingPage = pages.find(p => p.name === 'This Too Shall Pass')

  if (existingPage) {
    const result = await db.collection('pages').updateOne(
      { _id: existingPage._id },
      { $set: { blocks: pageBlocks } }
    )
    console.log('Updated existing page:', result.modifiedCount)
  } else {
    // Create new page
    const newPage = {
      name: 'This Too Shall Pass',
      slug: 'this-too-shall-pass',
      site_id: siteId,
      blocks: pageBlocks,
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('pages').insertOne(newPage)
    console.log('Created page:', result.insertedId.toString())

    // Add to site pages array
    await db.collection('sites').updateOne(
      { _id: new mongoose.Types.ObjectId(siteId) },
      { $push: { pages: { _id: result.insertedId, name: 'This Too Shall Pass' } } as any }
    )
    console.log('Added page to site')
  }

  console.log('Block order:', pageBlocks.map(b => b.name).join(' > '))

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
