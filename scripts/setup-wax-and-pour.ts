/**
 * Complete setup for Wax & Pour (compose workflow):
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
import sharp from 'sharp'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
dotenv.config()

// ─── Config ───
const baseUrl = process.env.MAKE_STUDIO_URL
const createToken = process.env.MAKE_STUDIO_CREATE_TOKEN
const seedToken = process.env.SEED_SITE_API_TOKEN
const seedSiteId = process.env.SEED_SITE_ID
const imagesDir = path.resolve(import.meta.dirname, '../themes/wax-and-pour/source/images')

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

// Theme from variation-1.json
const theme = {
  fonts: [
    { family: 'DM Serif Display', weight: 400, style: 'normal' },
    { family: 'DM Sans', weight: 400, style: 'normal' },
    { family: 'DM Sans', weight: 500, style: 'normal' },
    { family: 'DM Sans', weight: 600, style: 'normal' },
  ],
  systemColors: {
    'brand': '#c8956c',
    'on-brand': '#1a1412',
    'base': '#1a1412',
    'base-muted': '#221c19',
    'base-alt': '#2d2520',
    'panel': '#2d2520',
    'border': '#3d332c',
    'fg': '#f2ece6',
    'fg-muted': '#b8a99a',
    'fg-alt': '#8a7b6e',
  },
  customColors: [],
  palette: {
    primary: { label: 'primary', colors: ['rgb(56,43,34)', 'rgb(120,86,62)', 'rgb(200,149,108)', 'rgb(224,190,160)', 'rgb(242,228,214)'] },
    accent1: { label: 'accent-1', colors: ['rgb(42,32,28)', 'rgb(102,58,38)', 'rgb(168,92,52)', 'rgb(210,140,90)', 'rgb(236,192,156)'] },
    accent2: { label: 'accent-2', colors: ['rgb(34,38,42)', 'rgb(52,72,88)', 'rgb(76,108,132)', 'rgb(120,156,180)', 'rgb(180,210,228)'] },
    accent3: { label: 'accent-3', colors: ['rgb(38,34,28)', 'rgb(82,72,52)', 'rgb(128,112,78)', 'rgb(176,160,128)', 'rgb(216,206,186)'] },
    grays: { label: 'gray', colors: ['rgb(26,20,18)', 'rgb(45,37,32)', 'rgb(80,68,60)', 'rgb(138,123,110)', 'rgb(184,169,154)'] },
  },
  headingTypography: {
    'heading-xl': { fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 64, lineHeight: 70, letterSpacing: -1.5, mobileFontSize: 38, mobileLineHeight: 44 },
    'heading-lg': { fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 48, lineHeight: 54, letterSpacing: -1, mobileFontSize: 30, mobileLineHeight: 36 },
    'heading-md': { fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 32, lineHeight: 38, letterSpacing: -0.5, mobileFontSize: 24, mobileLineHeight: 30 },
    'heading-sm': { fontFamily: 'DM Sans', fontWeight: 600, fontSize: 22, lineHeight: 30, letterSpacing: -0.2, mobileFontSize: 18, mobileLineHeight: 24 },
    'heading-xs': { fontFamily: 'DM Sans', fontWeight: 600, fontSize: 18, lineHeight: 25, letterSpacing: 0, mobileFontSize: 16, mobileLineHeight: 22 },
  },
  bodyTypography: {
    'body-lg': { fontFamily: 'DM Sans', fontWeight: 400, fontSize: 18, lineHeight: 32, letterSpacing: 0 },
    'body-md': { fontFamily: 'DM Sans', fontWeight: 400, fontSize: 16, lineHeight: 28, letterSpacing: 0 },
    'body-sm': { fontFamily: 'DM Sans', fontWeight: 400, fontSize: 14, lineHeight: 22, letterSpacing: 0 },
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
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 600,
      uppercase: false,
      sizes: {
        lg: { fontSize: 16, letterSpacing: 0.5, opticalYOffset: 0, paddingTop: 14, paddingBottom: 14, paddingLeft: 28, paddingRight: 28, borderRadius: 4 },
        md: { fontSize: 14, letterSpacing: 0.3, opticalYOffset: 0, paddingTop: 11, paddingBottom: 11, paddingLeft: 22, paddingRight: 22, borderRadius: 4 },
        sm: { fontSize: 12, letterSpacing: 0.2, opticalYOffset: 0, paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, borderRadius: 4 },
      },
    },
    variants: {
      primary: { backgroundColor: 'system:brand', textColor: 'system:on-brand', borderColor: 'transparent', borderWidth: 1, hoverPreset: 'scale' },
      secondary: { backgroundColor: 'system:base-alt', textColor: 'system:fg', borderColor: 'transparent', borderWidth: 1, hoverPreset: 'darken' },
      outline: { backgroundColor: 'transparent', textColor: 'system:brand', borderColor: 'system:brand', borderWidth: 1, hoverPreset: 'fill' },
      ghost: { backgroundColor: 'transparent', textColor: 'system:fg', borderColor: 'transparent', borderWidth: 1, hoverPreset: 'darken' },
    },
  },
}

const selectedBlockNames = ['Navbar', 'Hero', 'Features Triple', 'Testimonial Large', 'Stats', 'FAQ', 'CTA', 'FooterNewsletter']

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
  // 1. Create new site
  console.log('=== Creating Site ===')
  const createClient = new MakeStudioClient(baseUrl, createToken)
  const siteResult = await createClient.createSite('Wax & Pour') as any
  const siteId = siteResult._id
  const apiToken = siteResult.apiToken
  console.log(`  Site ID: ${siteId}`)
  console.log(`  API Token: ${apiToken}`)

  const client = new MakeStudioClient(baseUrl, apiToken)

  // 2. Upload images to R2
  console.log('\n=== Uploading Images ===')
  const imageUrls: Record<string, string> = {}
  const localFiles = fs.readdirSync(imagesDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  for (const file of localFiles) {
    const localPath = path.join(imagesDir, file)
    const url = await uploadImage(localPath, file, siteId)
    imageUrls[file] = url
    console.log(`  Uploaded: ${file} → ${url}`)
  }

  // Register in media library
  const fileEntries = Object.entries(imageUrls).map(([name, url]) => ({ url, name: sanitize(name) }))
  await client.uploadFilesFromUrls(siteId, fileEntries)
  console.log(`  Registered ${fileEntries.length} files in media library.`)

  // 3. Push theme
  console.log('\n=== Pushing Theme ===')
  await client.updateSiteTheme(siteId, theme)
  console.log('  Theme applied.')

  // 4. Fetch seed blocks + partials
  console.log('\n=== Fetching Seed Blocks ===')
  const seedClient = new MakeStudioClient(baseUrl, seedToken)
  const seedBlocks = await seedClient.getBlocks(seedSiteId)
  const { partials: seedPartials } = await seedClient.getPartials(seedSiteId)
  console.log(`  Found ${seedBlocks.length} seed blocks, ${seedPartials.length} partials.`)

  // 5. Copy partials
  console.log('\n=== Copying Partials ===')
  const { partials: existingPartials } = await client.getPartials(siteId)
  for (const partialName of ['Button', 'Field']) {
    if (existingPartials.find((p: any) => p.name === partialName)) {
      console.log(`  ${partialName} already exists.`)
      continue
    }
    const seedPartial = seedPartials.find((p: any) => p.name === partialName)
    if (seedPartial) {
      await client.createPartial({ name: partialName, site_id: siteId, template: seedPartial.template })
      console.log(`  Created: ${partialName}`)
    }
  }

  // 6. Delete default blocks
  console.log('\n=== Cleaning Default Blocks ===')
  const existingBlocks = await client.getBlocks(siteId)
  for (const block of existingBlocks) {
    if (selectedBlockNames.indexOf(block.name) === -1) {
      await client.deleteBlock(block._id)
      console.log(`  Deleted default: ${block.name}`)
    }
  }

  // 7. Create selected blocks from seed
  console.log('\n=== Creating Blocks ===')
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
    if (seedBlock) {
      const created = await client.createBlock({
        name: seedBlock.name,
        site_id: siteId,
        template: seedBlock.template,
        fields: seedBlock.fields,
        category: seedBlock.category,
      })
      createdBlocks[blockName] = created
      console.log(`  Created: ${blockName} (${(created as any)._id})`)
    } else {
      console.log(`  WARN: Seed block "${blockName}" not found`)
    }
  }

  // 8. Update default layout with Navbar + FooterNewsletter
  console.log('\n=== Updating Layout ===')
  const navbarBlock = createdBlocks['Navbar']
  const footerBlock = createdBlocks['FooterNewsletter']
  const existingLayouts = await client.getLayouts(siteId)
  const defaultLayout = existingLayouts.find((l: any) => l.isDefault) || existingLayouts[0]
  await client.updateLayout(defaultLayout._id, {
    name: 'Main',
    headerBlocks: [{ blockId: navbarBlock._id, id: uuidv4(), name: navbarBlock.name }],
    footerBlocks: [{ blockId: footerBlock._id, id: uuidv4(), name: footerBlock.name }],
  })
  console.log(`  Layout updated: ${defaultLayout._id}`)

  // 9. Set up Index page
  console.log('\n=== Setting Up Index Page ===')
  const pages = await client.getPages(siteId)
  const indexPage = pages.find((p: any) => p.name === 'Index' || p.slug === '/')
  if (!indexPage) {
    console.log('  ERROR: No Index page found')
    return
  }

  // Content blocks (navbar and footer are in the layout)
  const contentBlockNames = ['Hero', 'Features Triple', 'Testimonial Large', 'Stats', 'FAQ', 'CTA']
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

  const img = {
    hero: imageUrls['vinyl-record-player-bar-warm-a-1.jpg'],
    vinyl: imageUrls['vinyl-record-collection-close--1.jpg'],
    cocktail: imageUrls['craft-cocktail-dark-bar-moody-1.jpg'],
    lounge: imageUrls['private-lounge-cozy-dim-elegan-1.jpg'],
    portrait: imageUrls['portrait-person-enjoying-music-1.jpg'],
    logo: imageUrls['logo.png'],
  }

  // Set all page content blocks
  const pageContent = {
    'Hero': {
      'Eyebrow': 'Now Open — Northeast Minneapolis',
      'Headline': 'Where vinyl meets the pour',
      'Subheadline': '<p>A listening bar for analog souls. Curated vinyl sessions, craft cocktails, and a room designed to make music sound the way it should.</p>',
      'Photo': img.hero,
      'align': 'items-start text-left',
    },
    'Features Triple': {
      'Eyebrow': 'The Experience',
      'Headline': 'Three ways to listen',
      'Subheadline': '<p>Every night at Wax & Pour is different. Here\'s what you\'ll find.</p>',
      'items': [
        {
          'title': 'Vinyl Sessions',
          'description': 'Our resident selectors spin deep cuts across jazz, soul, funk, ambient, and more. No requests — just trust the groove.',
          'image': img.vinyl,
        },
        {
          'title': 'Craft Cocktails',
          'description': 'A menu inspired by the records on the wall. Smoky old-fashioneds, citrus highballs, and rotating seasonal pours.',
          'image': img.cocktail,
        },
        {
          'title': 'Private Listening',
          'description': 'Book our hi-fi lounge for an intimate session. Bring your own records or choose from our library of 3,000+.',
          'image': img.lounge,
        },
      ],
    },
    'Testimonial Large': {
      'Quote': '<p>I\'ve been to listening bars in Tokyo and Berlin, and Wax & Pour holds its own. The room, the system, the drinks — it\'s the real thing. This is the bar Minneapolis didn\'t know it needed.</p>',
      'Name': 'Marcus Aldridge',
      'Byline': 'Music journalist, The Current',
      'Photo': img.portrait,
    },
    'Stats': {
      'Eyebrow': 'By the Numbers',
      'Headline': 'Built for sound',
      'Subheadline': '<p>We obsess over every detail so you can just sit back and listen.</p>',
      'items': [
        { 'stat': '3,000+', 'text': 'Records in our library' },
        { 'stat': '42', 'text': 'Craft cocktails on the menu' },
        { 'stat': '5', 'text': 'Nights of live DJ sessions weekly' },
        { 'stat': '1', 'text': 'Custom-built hi-fi sound system' },
      ],
    },
    'FAQ': {
      'Headline': 'Good questions',
      'Subheadline': '<p>Everything you need to know before your first visit.</p>',
      'items': [
        { 'question': 'Do I need a reservation?', 'answer': '<p>Walk-ins are welcome for the main bar. Our private listening lounge requires a reservation, which you can book online or by calling us.</p>' },
        { 'question': 'Can I bring my own records?', 'answer': '<p>Absolutely. Our private lounge sessions encourage it. Just let us know when you book, and we\'ll have the turntable warmed up for you.</p>' },
        { 'question': 'What kind of music do you play?', 'answer': '<p>Our selectors spin across genres — jazz, soul, funk, ambient, dub, Afrobeat, and more. Each night has a different vibe. Check our schedule for themed sessions.</p>' },
        { 'question': 'Is there a cover charge?', 'answer': '<p>No cover for the main bar. Private lounge sessions start at $75 per group for a 2-hour block, which includes a welcome round of drinks.</p>' },
        { 'question': 'Do you serve food?', 'answer': '<p>We offer a small menu of shareable plates — charcuterie, flatbreads, and seasonal snacks designed to pair with our cocktails. Nothing too loud for the room.</p>' },
      ],
    },
    'CTA': {
      'Eyebrow': 'Visit Us',
      'Headline': 'Come hear the difference',
      'Subheadline': '<p>Open Wednesday through Sunday, 5pm to midnight. Walk in or reserve the private lounge.</p>',
      'Align': 'items-center text-center',
    },
  }

  await client.setPageContent(indexPage._id, pageContent)
  console.log('  Page content set.')

  // Set navbar content
  console.log('\n=== Setting Navbar Content ===')
  await client.setPageContent(indexPage._id, {
    'Navbar': {
      'Logo': img.logo,
      'Logo Text': 'Wax & Pour',
      'Logo Link': '/',
      'Button Label': 'Reserve',
      'Button Link': '/reserve',
      'items': [
        { 'label': 'Menu', 'url': '/menu' },
        { 'label': 'Sessions', 'url': '/sessions' },
        { 'label': 'Private Lounge', 'url': '/lounge' },
        { 'label': 'About', 'url': '/about' },
      ],
    },
  })
  console.log('  Navbar content set.')

  // Set footer content
  console.log('\n=== Setting Footer Content ===')
  await client.setPageContent(indexPage._id, {
    'FooterNewsletter': {
      'Newsletter Headline': 'Stay in the groove',
      'Newsletter Text': '<p>New records, guest selectors, and secret sessions — straight to your inbox.</p>',
      'Copyright': `<p>&copy; ${new Date().getFullYear()} Wax & Pour. Minneapolis, MN.</p>`,
      'items': [
        {
          'title': 'Visit',
          'links': '<a href="/menu">Cocktail Menu</a>\n<a href="/sessions">Session Schedule</a>\n<a href="/lounge">Private Lounge</a>',
        },
        {
          'title': 'Learn',
          'links': '<a href="/about">Our Story</a>\n<a href="/system">The Sound System</a>\n<a href="/faq">FAQ</a>',
        },
        {
          'title': 'Connect',
          'links': '<a href="/contact">Contact</a>\n<a href="https://instagram.com">Instagram</a>\n<a href="/careers">Careers</a>',
        },
      ],
    },
  })
  console.log('  Footer content set.')

  // Remove navbar + footer from page blocks (they belong in the layout only)
  console.log('\n=== Cleaning Page Blocks ===')
  const updatedPage = await client.getPage(indexPage._id) as any
  const contentOnly = updatedPage.blocks.filter((b: any) =>
    b.name !== 'Navbar' && b.name !== 'FooterNewsletter'
  )
  await client.updatePage(indexPage._id, { blocks: contentOnly })
  console.log(`  Removed layout blocks from page. ${contentOnly.length} content blocks remain.`)

  // 11. Deploy preview
  console.log('\n=== Deploying Preview ===')
  const preview = await client.deployPreview(siteId) as any
  console.log(`  Preview deployed!`)
  console.log(`  URL: ${preview.url || JSON.stringify(preview)}`)

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
