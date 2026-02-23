/**
 * Fix wellness studio:
 * 1. Remove Navbar + FooterNewsletter from page blocks
 * 2. Populate items fields (Features, Testimonials, Stats)
 */
import { MakeStudioClient } from '../src/api'
import dotenv from 'dotenv'
dotenv.config()

const baseUrl = process.env.MAKE_STUDIO_URL!
const apiToken = 'mst_c4f353076125a5acbf2a7a7494c06c76d21edfea1b44d9a8dee3f6aa2c8725ab'
const siteId = '699bd7cb00338801ad93eb30'
const pageId = '699bd7cb00338801ad93eb53'

const R2_DOMAIN = 'makestudio.site'
const cdnBase = `https://${R2_DOMAIN}/${siteId}`

const img = {
  studio: `${cdnBase}/candlelit-yoga-studio-dim-warm-2.webp`,
  class: `${cdnBase}/yoga-class-group-serene-beauti-1.webp`,
  attire: `${cdnBase}/fitness-attire-activewear-disp-1.webp`,
  portrait1: `${cdnBase}/woman-portrait-natural-calm-we-1.webp`,
  portrait2: `${cdnBase}/woman-portrait-natural-calm-we-2.webp`,
  portrait3: `${cdnBase}/woman-portrait-natural-calm-we-3.webp`,
}

async function main() {
  const client = new MakeStudioClient(baseUrl, apiToken)

  // 1. Get current page state
  const page = await client.getPage(pageId)
  console.log('Current blocks:', page.blocks.map((b: any) => b.name).join(', '))

  // 2. Remove Navbar and FooterNewsletter from page blocks
  const contentBlocks = page.blocks.filter((b: any) =>
    b.name !== 'Navbar' && b.name !== 'FooterNewsletter'
  )
  console.log('Keeping blocks:', contentBlocks.map((b: any) => b.name).join(', '))

  await client.updatePage(pageId, { blocks: contentBlocks })
  console.log('Page blocks updated (navbar/footer removed).')

  // 3. Set items content using setPageContent with the correct field names
  // Items fields use the field name (e.g., "Features"), not "items"
  // Sub-field keys use slug format (lowercase, spaces→dashes)
  console.log('\n=== Setting Items Content ===')

  const itemsContent = {
    'Features Triple': {
      'Features': [
        {
          'title': 'The Space',
          'description': 'Warm wood floors, candlelight, and floor-to-ceiling windows overlooking the warehouse district. Every detail designed for calm.',
          'image': img.studio,
        },
        {
          'title': 'The Community',
          'description': 'From early-morning flow to Friday candlelit sessions, our classes bring together people who value presence and connection.',
          'image': img.class,
        },
        {
          'title': 'The Shop',
          'description': 'Curated fitness attire and wellness essentials. Look as good outside the studio as you feel inside it.',
          'image': img.attire,
        },
      ],
    },
    'Testimonials Grid': {
      'Testimonials': [
        {
          'quote': '<p>Walking into North Loop Yoga feels like the whole city quiets down. The candlelit classes changed my entire week.</p>',
          'photo': img.portrait1,
          'name': 'Maya Chen',
          'byline': 'Member since 2023',
        },
        {
          'quote': '<p>I came for the yoga, but I stayed for the people. This studio has the warmest community I\u2019ve ever been part of.</p>',
          'photo': img.portrait2,
          'name': 'Ava Lindström',
          'byline': 'Member since 2024',
        },
        {
          'quote': '<p>The space is absolutely stunning. Every class feels intentional — the lighting, the music, the energy. It\u2019s my favorite hour of the day.</p>',
          'photo': img.portrait3,
          'name': 'Jordan Reeves',
          'byline': 'Member since 2022',
        },
      ],
    },
    'Stats': {
      'Stats': [
        { 'stat': '5+', 'text': 'Years in the North Loop neighborhood' },
        { 'stat': '30+', 'text': 'Classes offered every week' },
        { 'stat': '1,200', 'text': 'Members in our community' },
        { 'stat': '4.9★', 'text': 'Average class rating' },
      ],
    },
  }

  await client.setPageContent(pageId, itemsContent)
  console.log('Items content set.')

  // 4. Also set navbar items (Links) in the layout
  console.log('\n=== Setting Navbar Links ===')
  const navbarItems = {
    'Navbar': {
      'Links': [
        { 'label': 'Classes', 'url': '/schedule' },
        { 'label': 'Studio', 'url': '/about' },
        { 'label': 'Shop', 'url': '/shop' },
        { 'label': 'Community', 'url': '/community' },
      ],
    },
  }
  try {
    await client.setPageContent(pageId, navbarItems)
    console.log('Navbar links set.')
  } catch (e: any) {
    console.log(`Navbar links skipped: ${e.message}`)
  }

  // 5. Set footer items (Categories, Social Links)
  console.log('\n=== Setting Footer Items ===')
  const footerItems = {
    'FooterNewsletter': {
      'Categories': [
        {
          'title': 'Studio',
          'links': '<a href="/schedule">Class Schedule</a>\n<a href="/about">Our Space</a>\n<a href="/teachers">Teachers</a>',
        },
        {
          'title': 'Shop',
          'links': '<a href="/shop">Attire</a>\n<a href="/shop/accessories">Accessories</a>\n<a href="/shop/gift-cards">Gift Cards</a>',
        },
        {
          'title': 'Connect',
          'links': '<a href="/contact">Contact Us</a>\n<a href="/community">Community</a>\n<a href="/faq">FAQ</a>',
        },
      ],
      'Social Links': [
        { 'icon': 'instagram-logo', 'url': '#', 'label': 'Instagram' },
        { 'icon': 'facebook-logo', 'url': '#', 'label': 'Facebook' },
        { 'icon': 'youtube-logo', 'url': '#', 'label': 'YouTube' },
      ],
    },
  }
  try {
    await client.setPageContent(pageId, footerItems)
    console.log('Footer items set.')
  } catch (e: any) {
    console.log(`Footer items skipped: ${e.message}`)
  }

  // 6. Re-deploy preview
  console.log('\n=== Deploying Preview ===')
  const preview = await client.deployPreview(siteId)
  console.log(`Preview: ${JSON.stringify(preview)}`)

  // 7. Verify page state
  const updatedPage = await client.getPage(pageId)
  console.log('\nFinal blocks:', updatedPage.blocks.map((b: any) => b.name).join(', '))
}

main().catch(e => {
  console.error('\nFATAL:', e)
  process.exit(1)
})
