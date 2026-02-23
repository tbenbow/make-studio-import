/**
 * Complete setup for Wellness Studio (compose workflow):
 * 1. Create new site
 * 2. Upload images to R2
 * 3. Push theme
 * 4. Copy Button partial + selected blocks from seed site
 * 5. Clean up default blocks/layouts
 * 6. Create layout with navbar + footer
 * 7. Assign blocks to Index page + populate content
 * 8. Deploy preview
 */
import { MakeStudioClient } from '../src/api'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import sharp from 'sharp'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
dotenv.config()

// ─── Config ───
const baseUrl = process.env.MAKE_STUDIO_URL!
const createToken = process.env.MAKE_STUDIO_CREATE_TOKEN!
const seedToken = process.env.SEED_SITE_API_TOKEN!
const seedSiteId = process.env.SEED_SITE_ID!
const imagesDir = path.resolve(import.meta.dirname, '../themes/wellness-studio/source/images')

const R2_ENDPOINT = 'https://cdb9394087febcf07876a341a9ffe487.r2.cloudflarestorage.com'
const R2_ACCESS_KEY = 'a05f0d716005045a51d010e738cadae3'
const R2_SECRET_KEY = 'cb62bed26032b39796e0212232450991dd352a718e1260e7b62d58a479710b55'
const R2_BUCKET = 'make-studio'
const R2_DOMAIN = 'makestudio.site'

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
})

// V2 theme — server format with systemColors, headingTypography, bodyTypography, buttons.global/variants
const theme = {
  fonts: [
    { family: 'Playfair Display', weight: 400, style: 'normal' },
    { family: 'Playfair Display', weight: 500, style: 'normal' },
    { family: 'Playfair Display', weight: 600, style: 'normal' },
    { family: 'Playfair Display', weight: 700, style: 'normal' },
    { family: 'Work Sans', weight: 300, style: 'normal' },
    { family: 'Work Sans', weight: 400, style: 'normal' },
    { family: 'Work Sans', weight: 500, style: 'normal' },
    { family: 'Work Sans', weight: 600, style: 'normal' },
  ],
  systemColors: {
    'brand': '#6b7f5a',
    'on-brand': '#fdfbf8',
    'base': '#fdfbf8',
    'base-muted': '#f4efe8',
    'base-alt': '#f4efe8',
    'panel': '#fdfbf8',
    'border': '#e6e0d7',
    'fg': '#1f1f1d',
    'fg-muted': '#6e6b63',
    'fg-alt': '#6e6b63',
  },
  customColors: [],
  palette: {
    primary: {
      label: 'primary',
      colors: ['rgb(214, 224, 204)', 'rgb(166, 186, 142)', 'rgb(107, 127, 90)', 'rgb(88, 109, 72)', 'rgb(60, 80, 44)'],
    },
    accent1: {
      label: 'accent-1',
      colors: ['rgb(245, 224, 223)', 'rgb(234, 195, 193)', 'rgb(222, 181, 179)', 'rgb(207, 160, 158)', 'rgb(180, 130, 128)'],
    },
    accent2: {
      label: 'accent-2',
      colors: ['rgb(244, 239, 232)', 'rgb(230, 224, 215)', 'rgb(216, 209, 198)', 'rgb(200, 192, 179)', 'rgb(170, 160, 145)'],
    },
    accent3: {
      label: 'accent-3',
      colors: ['rgb(253, 251, 248)', 'rgb(244, 239, 232)', 'rgb(230, 224, 215)', 'rgb(200, 192, 179)', 'rgb(150, 140, 125)'],
    },
    grays: {
      label: 'gray',
      colors: ['rgb(244, 239, 232)', 'rgb(216, 209, 198)', 'rgb(110, 107, 99)', 'rgb(60, 60, 55)', 'rgb(31, 31, 29)'],
    },
  },
  headingTypography: {
    'heading-xl': { fontFamily: 'Playfair Display', fontWeight: 400, fontSize: 60, lineHeight: 65, letterSpacing: -1.5, mobileFontSize: 36, mobileLineHeight: 41 },
    'heading-lg': { fontFamily: 'Playfair Display', fontWeight: 500, fontSize: 44, lineHeight: 49, letterSpacing: -1, mobileFontSize: 30, mobileLineHeight: 35 },
    'heading-md': { fontFamily: 'Playfair Display', fontWeight: 500, fontSize: 32, lineHeight: 38, letterSpacing: -0.8, mobileFontSize: 24, mobileLineHeight: 30 },
    'heading-sm': { fontFamily: 'Work Sans', fontWeight: 500, fontSize: 22, lineHeight: 30, letterSpacing: -0.3, mobileFontSize: 18, mobileLineHeight: 23 },
    'heading-xs': { fontFamily: 'Work Sans', fontWeight: 500, fontSize: 18, lineHeight: 25, letterSpacing: -0.2, mobileFontSize: 16, mobileLineHeight: 22 },
  },
  bodyTypography: {
    'body-lg': { fontFamily: 'Work Sans', fontWeight: 300, fontSize: 18, lineHeight: 32, letterSpacing: 0 },
    'body-md': { fontFamily: 'Work Sans', fontWeight: 400, fontSize: 16, lineHeight: 28, letterSpacing: 0 },
    'body-sm': { fontFamily: 'Work Sans', fontWeight: 400, fontSize: 14, lineHeight: 22, letterSpacing: 0 },
  },
  prose: {
    elements: {
      h1: { typographyClass: 'heading-xl', marginBottom: 1.5 },
      h2: { typographyClass: 'heading-lg', marginBottom: 1.25 },
      h3: { typographyClass: 'heading-md', marginBottom: 1 },
      h4: { typographyClass: 'heading-sm', marginBottom: 0.75 },
      h5: { typographyClass: 'heading-xs', marginBottom: 0.5 },
      h6: { typographyClass: 'heading-xs', marginBottom: 0.5 },
      p: { typographyClass: 'body-md', marginBottom: 1.25 },
      ul: { typographyClass: 'body-md', marginBottom: 1.25 },
      ol: { typographyClass: 'body-md', marginBottom: 1.25 },
    },
    lists: { listStyleType: 'disc', indent: 1.5, itemSpacing: 0.5, nestedIndent: 1.5 },
    links: { color: 'accent', hoverColor: 'primary', underline: 'always' },
    customCSS: '',
  },
  buttons: {
    global: {
      fontFamily: "'Work Sans', sans-serif",
      fontWeight: 500,
      uppercase: false,
      sizes: {
        lg: { fontSize: 15, letterSpacing: 0, opticalYOffset: 0, paddingTop: 12, paddingBottom: 12, paddingLeft: 28, paddingRight: 28, borderRadius: 24 },
        md: { fontSize: 14, letterSpacing: 0, opticalYOffset: 0, paddingTop: 10, paddingBottom: 10, paddingLeft: 24, paddingRight: 24, borderRadius: 20 },
        sm: { fontSize: 12, letterSpacing: 0, opticalYOffset: 0, paddingTop: 8, paddingBottom: 8, paddingLeft: 20, paddingRight: 20, borderRadius: 16 },
      },
    },
    variants: {
      primary: { backgroundColor: 'system:brand', textColor: 'system:on-brand', borderColor: 'transparent', borderWidth: 1, hoverPreset: 'scale' },
      secondary: { backgroundColor: 'system:base-muted', textColor: 'system:fg', borderColor: 'transparent', borderWidth: 1, hoverPreset: 'darken' },
      outline: { backgroundColor: 'transparent', textColor: 'system:brand', borderColor: 'system:brand', borderWidth: 1, hoverPreset: 'fill' },
      ghost: { backgroundColor: 'transparent', textColor: 'system:fg', borderColor: 'transparent', borderWidth: 1, hoverPreset: 'darken' },
    },
  },
}

// Selected blocks from V2
const selectedBlockNames = ['Navbar', 'Split', 'Features Triple', 'Testimonials Grid', 'Stats', 'FooterNewsletter']

// ─── Helpers ───
function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function uploadImage(localPath: string, filename: string, siteId: string): Promise<string> {
  const input = fs.readFileSync(localPath)
  let pipeline = sharp(input)
  const meta = await pipeline.metadata()
  if ((meta.width || 0) > 2000 || (meta.height || 0) > 2000) {
    pipeline = pipeline.resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
  }
  const buffer = await pipeline.webp({ quality: 82 }).toBuffer()
  const webpName = sanitize(filename.replace(/\.[^.]+$/, '')) + '.webp'
  const fileKey = `${siteId}/${webpName}`
  const fullPath = `https://${R2_DOMAIN}/${fileKey}`
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileKey,
    Body: buffer,
    ContentType: 'image/webp',
  }))
  return fullPath
}

// ─── Main ───
async function main() {
  // 1. Use existing site (already created)
  const siteId = '699bd7cb00338801ad93eb30'
  const apiToken = 'mst_c4f353076125a5acbf2a7a7494c06c76d21edfea1b44d9a8dee3f6aa2c8725ab'
  console.log(`=== Using Existing Site ===`)
  console.log(`  Site ID: ${siteId}`)

  const client = new MakeStudioClient(baseUrl, apiToken)

  // Images already uploaded — use CDN URLs
  const cdnBase = `https://${R2_DOMAIN}/${siteId}`
  const imageUrls: Record<string, string> = {}
  const localFiles = fs.readdirSync(imagesDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  for (const file of localFiles) {
    const webpName = sanitize(file.replace(/\.[^.]+$/, '')) + '.webp'
    imageUrls[file] = `${cdnBase}/${webpName}`
  }
  console.log(`  Using ${Object.keys(imageUrls).length} existing CDN images.`)

  // Theme already pushed, push again to be safe
  console.log('\n=== Pushing Theme ===')
  await client.updateSiteTheme(siteId, theme)
  console.log('  Theme applied.')

  // 4. Fetch seed blocks + partials
  console.log('\n=== Fetching Seed Blocks ===')
  const seedClient = new MakeStudioClient(baseUrl, seedToken)
  const seedBlocks = await seedClient.getBlocks(seedSiteId)
  const { partials: seedPartials } = await seedClient.getPartials(seedSiteId)

  // 5. Ensure partials exist
  console.log('\n=== Checking Partials ===')
  const { partials: existingPartials } = await client.getPartials(siteId)
  if (!existingPartials.find((p: any) => p.name === 'Button')) {
    const buttonPartial = seedPartials.find((p: any) => p.name === 'Button')
    if (buttonPartial) {
      await client.createPartial({ name: 'Button', site_id: siteId, template: buttonPartial.template })
      console.log('  Button partial created.')
    }
  } else {
    console.log('  Button partial already exists.')
  }
  if (!existingPartials.find((p: any) => p.name === 'Field')) {
    const fieldPartial = seedPartials.find((p: any) => p.name === 'Field')
    if (fieldPartial) {
      await client.createPartial({ name: 'Field', site_id: siteId, template: fieldPartial.template })
      console.log('  Field partial created.')
    }
  } else {
    console.log('  Field partial already exists.')
  }

  // 6. Delete any remaining non-selected blocks
  console.log('\n=== Cleaning Blocks ===')
  const existingBlocks = await client.getBlocks(siteId)
  for (const block of existingBlocks) {
    if (!selectedBlockNames.includes(block.name)) {
      await client.deleteBlock(block._id)
      console.log(`  Deleted: ${block.name}`)
    }
  }

  // 7. Create selected blocks
  console.log('\n=== Creating Blocks ===')
  // Re-fetch blocks after cleanup
  const currentBlocks = await client.getBlocks(siteId)
  const createdBlocks: Record<string, any> = {}

  for (const blockName of selectedBlockNames) {
    const existing = currentBlocks.find((b: any) => b.name === blockName)
    if (existing) {
      createdBlocks[blockName] = existing
      console.log(`  Already exists: ${blockName} (${existing._id})`)
      continue
    }
    const seedBlock = seedBlocks.find((b: any) => b.name === blockName)
    if (!seedBlock) {
      console.log(`  WARN: Seed block "${blockName}" not found!`)
      continue
    }
    const created = await client.createBlock({
      name: seedBlock.name,
      site_id: siteId,
      template: seedBlock.template,
      fields: seedBlock.fields,
      category: seedBlock.category,
    })
    createdBlocks[blockName] = created
    console.log(`  Created: ${blockName} (${(created as any)._id})`)
  }

  // 8. Update default layout with Navbar + FooterNewsletter
  console.log('\n=== Updating Layout ===')
  const navbarBlock = createdBlocks['Navbar']
  const footerBlock = createdBlocks['FooterNewsletter']
  const existingLayouts = await client.getLayouts(siteId)
  const defaultLayout = existingLayouts.find((l: any) => l.isDefault) || existingLayouts[0]
  const layout = await client.updateLayout(defaultLayout._id, {
    name: 'Main',
    headerBlocks: [{ blockId: navbarBlock._id, id: uuidv4(), name: navbarBlock.name }],
    footerBlocks: [{ blockId: footerBlock._id, id: uuidv4(), name: footerBlock.name }],
  })
  console.log(`  Layout updated: ${defaultLayout._id}`)

  // 9. Set up Index page with content blocks
  console.log('\n=== Setting Up Index Page ===')
  const pages = await client.getPages(siteId)
  const indexPage = pages.find((p: any) => p.name === 'Index' || p.slug === '/')
  if (!indexPage) {
    console.log('  ERROR: No Index page found!')
    return
  }
  console.log(`  Index page: ${indexPage._id}`)

  // Content blocks (not navbar/footer — those are in the layout)
  const contentBlockNames = ['Split', 'Features Triple', 'Testimonials Grid', 'Stats']
  const blockRefs = contentBlockNames.map(name => ({
    blockId: createdBlocks[name]._id,
    id: uuidv4(),
    name: createdBlocks[name].name,
  }))

  await client.updatePage(indexPage._id, {
    blocks: blockRefs,
    settings: { layoutId: defaultLayout._id },
  })
  console.log('  Blocks assigned + layout set.')

  // 10. Populate content
  console.log('\n=== Populating Content ===')

  // Map images to their roles
  const img = {
    hero: imageUrls['candlelit-yoga-studio-dim-warm-1.jpg'],
    studio: imageUrls['candlelit-yoga-studio-dim-warm-2.jpg'],
    class: imageUrls['yoga-class-group-serene-beauti-1.jpg'],
    attire: imageUrls['fitness-attire-activewear-disp-1.jpg'],
    portrait1: imageUrls['woman-portrait-natural-calm-we-1.jpg'],
    portrait2: imageUrls['woman-portrait-natural-calm-we-2.jpg'],
    portrait3: imageUrls['woman-portrait-natural-calm-we-3.jpg'],
  }

  const content = {
    // Navbar content is set via layout — we'll handle separately
    'Split': {
      'Logo Alt': 'North Loop Yoga',
      'Promo Text': 'New student special — your first week of unlimited classes free.',
      'Promo Link Label': 'Claim offer',
      'Promo Link URL': '/schedule',
      'Headline': 'Find your stillness in the North Loop',
      'Subheadline': 'Candlelit classes, a warm community, and a space that feels like a deep breath. Located in the heart of Minneapolis\u2019 North Loop neighborhood.',
      'Primary Button Label': 'View schedule',
      'Primary Button URL': '/schedule',
      'Secondary Button Label': 'Our studio',
      'Secondary Button URL': '/about',
      'Image': img.hero,
    },
    'Features Triple': {
      'Eyebrow': 'Experience',
      'Headline': 'More than a yoga studio',
      'Subheadline': '<p>A space for movement, beauty, and connection in the heart of the North Loop.</p>',
      'items': [
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
      'Eyebrow': 'Community',
      'Headline': 'What our members say',
      'Subheadline': '<p>We\u2019re grateful for the people who make this studio what it is.</p>',
      'items': [
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
      'Eyebrow': 'North Loop Yoga',
      'Headline': 'Rooted in Minneapolis since 2019',
      'Subheadline': '<p>A neighborhood studio with a devoted community.</p>',
      'items': [
        { 'stat': '5+', 'text': 'Years in the North Loop neighborhood' },
        { 'stat': '30+', 'text': 'Classes offered every week' },
        { 'stat': '1,200', 'text': 'Members in our community' },
        { 'stat': '4.9\u2605', 'text': 'Average class rating' },
      ],
    },
  }

  await client.setPageContent(indexPage._id, content)
  console.log('  Page content set.')

  // Set navbar content via the layout header block
  // We need to set it on the page since navbar is in the layout
  console.log('\n=== Setting Navbar Content ===')
  const navbarContent = {
    'Navbar': {
      'Logo Text': 'North Loop Yoga',
      'Logo Link': '/',
      'Button Label': 'Book a class',
      'Button Link': '/schedule',
      'items': [
        { 'label': 'Classes', 'url': '/schedule' },
        { 'label': 'Studio', 'url': '/about' },
        { 'label': 'Shop', 'url': '/shop' },
        { 'label': 'Community', 'url': '/community' },
      ],
    },
  }
  try {
    await client.setPageContent(indexPage._id, navbarContent)
    console.log('  Navbar content set.')
  } catch (e: any) {
    console.log(`  Navbar content skipped (layout block): ${e.message}`)
  }

  // Set footer content
  console.log('\n=== Setting Footer Content ===')
  const footerContent = {
    'FooterNewsletter': {
      'Newsletter Headline': 'Stay grounded',
      'Newsletter Text': '<p>Class updates, studio news, and the occasional moment of calm — delivered to your inbox.</p>',
      'Copyright': `<p>&copy; ${new Date().getFullYear()} North Loop Yoga. Minneapolis, MN.</p>`,
      'items': [
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
    },
  }
  try {
    await client.setPageContent(indexPage._id, footerContent)
    console.log('  Footer content set.')
  } catch (e: any) {
    console.log(`  Footer content skipped (layout block): ${e.message}`)
  }

  // 11. Deploy preview
  console.log('\n=== Deploying Preview ===')
  const preview = await client.deployPreview(siteId)
  console.log(`  Preview deployed!`)
  console.log(`  URL: ${(preview as any).url || JSON.stringify(preview)}`)

  // Output summary
  console.log('\n=== Summary ===')
  console.log(`  Site ID: ${siteId}`)
  console.log(`  API Token: ${apiToken}`)
  console.log(`  Blocks: ${Object.keys(createdBlocks).join(', ')}`)
  console.log(`  Images: ${Object.keys(imageUrls).length} uploaded`)
}

main().catch(e => {
  console.error('\nFATAL:', e)
  process.exit(1)
})
