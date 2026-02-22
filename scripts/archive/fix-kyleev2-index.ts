/**
 * Fix: Delete "Home" page and use the Index page instead.
 * - Finds the Index page (site's default)
 * - Adds Hero + RecentPosts blocks to it
 * - Sets the homepage content on it
 * - Deletes the duplicate "Home" page
 */
import { MakeStudioClient } from '../../src/api.js'
import * as crypto from 'crypto'
import dotenv from 'dotenv'
dotenv.config()

const BASE_URL = process.env.MAKE_STUDIO_URL || 'http://localhost:3001'
const TOKEN = process.env.MAKE_STUDIO_TOKEN!
const SITE_ID = process.env.MAKE_STUDIO_SITE!

async function main() {
  const client = new MakeStudioClient(BASE_URL, TOKEN)

  const [pages, blocks, layouts] = await Promise.all([
    client.getPages(SITE_ID),
    client.getBlocks(SITE_ID),
    client.getLayouts(SITE_ID)
  ])

  const blocksByName = new Map(blocks.map((b: any) => [b.name, b]))
  const homePage = pages.find((p: any) => p.name === 'Home')
  let indexPage = pages.find((p: any) => p.name === 'Index')

  // If there's no Index page, the seed page was deleted — recreate it
  // Actually, check if Home page exists but no Index page. In that case
  // we can just rename Home to Index.
  if (!indexPage && homePage) {
    console.log('No Index page found. Renaming "Home" to "Index"...')
    const heroBlock = blocksByName.get('Hero')
    const recentPostsBlock = blocksByName.get('RecentPosts')
    const pageBlocks = [heroBlock, recentPostsBlock].filter(Boolean).map((b: any) => ({
      id: crypto.randomUUID(),
      blockId: b._id,
      name: b.name
    }))

    // Find the Default layout
    const defaultLayout = layouts.find((l: any) => l.name === 'Default')

    await client.updatePage(homePage._id, {
      name: 'Index',
      blocks: pageBlocks,
      settings: {
        ...homePage.settings,
        slug: '',
        ...(defaultLayout ? { layoutId: defaultLayout._id } : {})
      }
    })
    console.log(`Renamed Home (${homePage._id}) to Index`)

    // Re-set the content
    console.log('Setting content on Index page...')
    await client.setPageContent(homePage._id, {
      "Hero": {
        "Headline": "Kylee Leonetti",
        "Subheadline": "Welcome To My Online Writing Sanctuary",
        "Intro": "<p>Have a seat right here next to me, on the chair if the floor is bad for your knees. Let\u2019s talk about everything, plans, ideas and dreams, firm-to-shaky faiths and hard realities; this is the stuff that makes us human, after all. I\u2019ve chewed my cuticles down thinking about my own doubts, so you know yours are safe here with me! Let\u2019s go deep. I\u2019m so glad you\u2019re here.</p>"
      },
      "RecentPosts": {
        "Heading": "Explore My Writing",
        "Posts": [
          {
            "title": "What the Minneapolis Teacher\u2019s Strike Taught Me About Living in Uncertainty",
            "date": "April 16, 2022",
            "excerpt": "It happened last month while I sat surrounded by baskets of unfolded laundry as a warm spring rain poured outside my windows. There was a book open beside me, but also the Netflix tab on my iPad, and a journal on my lap\u2026",
            "category": "Faith, Home Life",
            "url": "/writing",
            "image": ""
          },
          {
            "title": "Pray for Discernment.",
            "date": "February 16, 2022",
            "excerpt": "True to my hibernation inclination, I read four books in January and hardly wrote a word. This month I\u2019ve been back to work, and I will say it feels so good to be serving my clients\u2026",
            "category": "Faith",
            "url": "#",
            "image": ""
          },
          {
            "title": "Write in erasable ink.",
            "date": "January 13, 2022",
            "excerpt": "It\u2019s a new year, but I haven\u2019t felt very ceremonious about it (anyone else?). I\u2019m the same me\u2026and honestly, I\u2019ve been pretty sad\u2026",
            "category": "",
            "url": "#",
            "image": ""
          }
        ],
        "CTA Label": "Read All Posts",
        "CTA Link": "/writing"
      }
    })
    console.log('Index content set.')
  } else if (indexPage && homePage) {
    // Both exist — update Index, delete Home
    console.log(`Both Index (${indexPage._id}) and Home (${homePage._id}) found.`)
    console.log('Updating Index page with blocks and content...')

    const heroBlock = blocksByName.get('Hero')
    const recentPostsBlock = blocksByName.get('RecentPosts')
    const pageBlocks = [heroBlock, recentPostsBlock].filter(Boolean).map((b: any) => ({
      id: crypto.randomUUID(),
      blockId: b._id,
      name: b.name
    }))

    const defaultLayout = layouts.find((l: any) => l.name === 'Default')
    await client.updatePage(indexPage._id, {
      blocks: pageBlocks,
      settings: {
        ...indexPage.settings,
        ...(defaultLayout ? { layoutId: defaultLayout._id } : {})
      }
    })

    await client.setPageContent(indexPage._id, {
      "Hero": {
        "Headline": "Kylee Leonetti",
        "Subheadline": "Welcome To My Online Writing Sanctuary",
        "Intro": "<p>Have a seat right here next to me, on the chair if the floor is bad for your knees. Let\u2019s talk about everything, plans, ideas and dreams, firm-to-shaky faiths and hard realities; this is the stuff that makes us human, after all. I\u2019ve chewed my cuticles down thinking about my own doubts, so you know yours are safe here with me! Let\u2019s go deep. I\u2019m so glad you\u2019re here.</p>"
      },
      "RecentPosts": {
        "Heading": "Explore My Writing",
        "Posts": [
          {
            "title": "What the Minneapolis Teacher\u2019s Strike Taught Me About Living in Uncertainty",
            "date": "April 16, 2022",
            "excerpt": "It happened last month while I sat surrounded by baskets of unfolded laundry as a warm spring rain poured outside my windows. There was a book open beside me, but also the Netflix tab on my iPad, and a journal on my lap\u2026",
            "category": "Faith, Home Life",
            "url": "/writing",
            "image": ""
          },
          {
            "title": "Pray for Discernment.",
            "date": "February 16, 2022",
            "excerpt": "True to my hibernation inclination, I read four books in January and hardly wrote a word. This month I\u2019ve been back to work, and I will say it feels so good to be serving my clients\u2026",
            "category": "Faith",
            "url": "#",
            "image": ""
          },
          {
            "title": "Write in erasable ink.",
            "date": "January 13, 2022",
            "excerpt": "It\u2019s a new year, but I haven\u2019t felt very ceremonious about it (anyone else?). I\u2019m the same me\u2026and honestly, I\u2019ve been pretty sad\u2026",
            "category": "",
            "url": "#",
            "image": ""
          }
        ],
        "CTA Label": "Read All Posts",
        "CTA Link": "/writing"
      }
    })
    console.log('Index content set.')

    console.log(`Deleting duplicate Home page (${homePage._id})...`)
    await client.deletePage(homePage._id)
    console.log('Home page deleted.')
  } else if (indexPage) {
    console.log('Index page found, no Home page. Nothing to fix.')
  } else {
    console.error('Neither Index nor Home page found!')
    process.exit(1)
  }

  // Verify final state
  const finalPages = await client.getPages(SITE_ID)
  console.log('\nFinal pages:')
  for (const p of finalPages) {
    console.log(`  - ${p.name} (${p._id}) slug=${(p as any).settings?.slug ?? '(default)'}`)
  }
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
