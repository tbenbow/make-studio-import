/**
 * Complete setup for Pirate Golf site:
 * 1. Upload images to R2
 * 2. Assign blocks to Index page
 * 3. Set block content (using block names, not instance IDs)
 * 4. Deploy preview
 */
import { MakeStudioClient } from '../src/api'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import sharp from 'sharp'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
dotenv.config()

const client = new MakeStudioClient(process.env.MAKE_STUDIO_URL!, process.env.MAKE_STUDIO_TOKEN!)
const siteId = process.env.MAKE_STUDIO_SITE!
const imagesDir = path.resolve(import.meta.dirname, '../themes/pirate-golf/source/images')

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

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function uploadImage(localPath: string, filename: string): Promise<string> {
  const input = fs.readFileSync(localPath)
  let pipeline = sharp(input)
  const meta = await pipeline.metadata()

  if ((meta.width || 0) > 2000 || (meta.height || 0) > 2000) {
    pipeline = pipeline.resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
  }

  const buffer = await pipeline.webp({ quality: 80 }).toBuffer()
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

async function main() {
  // ─── Step 1: Upload images ───
  console.log('=== Upload Images ===')
  const imageFiles = fs.readdirSync(imagesDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
  const imageUrls: Record<string, string> = {}

  for (const file of imageFiles) {
    const filePath = path.join(imagesDir, file)
    const size = (fs.statSync(filePath).size / 1024).toFixed(0)
    process.stdout.write(`  ${file} (${size}KB)`)
    const url = await uploadImage(filePath, file)
    imageUrls[file] = url
    console.log(` → ${url}`)
  }
  console.log(`Uploaded ${Object.keys(imageUrls).length} images.\n`)

  // Register in media library via uploadFilesFromUrls (server fetches from R2, registers in DB)
  console.log('=== Register in Media Library ===')
  const urlList = Object.entries(imageUrls).map(([fileName, url]) => ({ url, fileName }))
  try {
    const results = await client.uploadFilesFromUrls(siteId, urlList)
    for (const r of results) {
      console.log(`  ${r.url} → ${r.success ? r.fullPath : r.error}`)
    }
  } catch (e: any) {
    console.log(`  Media registration skipped: ${e.message}`)
  }

  const img = (name: string) => imageUrls[name] || ''

  // ─── Step 2: Assign blocks to Index page ───
  console.log('\n=== Page Setup ===')
  const blocks = await client.getBlocks(siteId)
  const pages = await client.getPages(siteId)

  const blocksByName = new Map<string, any>()
  for (const b of blocks) blocksByName.set(b.name, b)

  const indexPage = pages.find((p: any) => p.slug === '' || p.name === 'Index')
  if (!indexPage) { console.error('Index page not found!'); return }

  const blockOrder = ['Hero', 'Courses', 'EpicFeatures', 'Clubhouse', 'Pricing', 'InfoBar']
  const pageBlocks = blockOrder
    .map(name => blocksByName.get(name))
    .filter(Boolean)
    .map((b: any) => ({ id: crypto.randomUUID(), blockId: b._id, name: b.name }))

  // Find our layout
  const layouts = await client.getLayouts(siteId)
  const layout = layouts.find((l: any) => l.name === 'Default' && l.isDefault)
  if (layout) {
    console.log(`Assigning layout "${layout.name}" (${layout._id}) to Index...`)
    await client.updatePage(indexPage._id, { settings: { layoutId: layout._id } })
  }

  console.log(`Setting ${pageBlocks.length} blocks on Index page (${indexPage._id})...`)
  await client.updatePage(indexPage._id, { blocks: pageBlocks })
  for (const b of pageBlocks) console.log(`  ${b.name}`)

  // ─── Step 3: Set block content (using BLOCK NAMES as keys) ───
  console.log('\n=== Block Content ===')

  console.log('  Hero')
  await client.setPageContent(indexPage._id, { Hero: {
    Image: img('hero.png'),
    Eyebrow: 'Now Open — Port Harbor, FL',
    Headline: "BUCCANEER'S BLUFF",
    Subtitle: 'The Most Epic Pirate Mini Golf on the Planet',
    Body: "<p>Two jaw-dropping courses. Animatronic pirates. Towering fortresses. Real waterfalls. A clubhouse inside a pirate ship. You've never putted like this before.</p>",
    Buttons: [
      { label: 'Grab Your Putter →', link: '#prices', style: 'primary' },
      { label: 'See the Courses', link: '#courses', style: 'ghost' },
    ],
  }})

  console.log('  Courses')
  await client.setPageContent(indexPage._id, { Courses: {
    Headline: 'CHOOSE YOUR ADVENTURE',
    Subheadline: 'Two courses. Two legends. Thirty-six holes of pure pirate glory.',
    Courses: [
      { image: img('blackbeards-course.png'), badge: 'Advanced · 18 Holes', heading: "BLACKBEARD'S COURSE", description: "<p>Think you've got what it takes? Blackbeard's Course is the ultimate test. Putt through a full-scale ghost ship, dodge cannon-blast water jets, navigate fortress walls, and face the man himself — a towering animatronic Blackbeard who taunts you from his perch above the final green.</p>", tags: [{ label: 'Ghost Ship' }, { label: 'Cannon Blasts' }, { label: 'Fortress Walls' }, { label: 'Wicked Slopes' }] },
      { image: img('krakens-cove.png'), badge: 'All Ages · 18 Holes', heading: "THE KRAKEN'S COVE", description: "<p>Venture into the Kraken's underwater domain. Glowing cave passages, cascading waterfalls you putt right through, and a colossal animatronic Kraken whose tentacles sweep across the course. Friendlier fairways make it perfect for families — but nobody said the Kraken plays nice.</p>", tags: [{ label: 'Giant Kraken' }, { label: 'Waterfall Caves' }, { label: 'Glow Effects' }, { label: 'Family Fun' }] },
    ],
  }})

  console.log('  EpicFeatures')
  await client.setPageContent(indexPage._id, { EpicFeatures: {
    Headline: "THIS AIN'T YOUR AVERAGE MINI GOLF",
    Subheadline: 'We went completely overboard — in the best way possible.',
    Items: [
      { image: img('animatronic.png'), heading: '30+ ANIMATRONIC PIRATES', description: "<p>Life-size robotic buccaneers that move, talk, sing, and react to your game. Blackbeard guards the 18th hole. Captain Bones tells terrible jokes on the 7th. The parrot on hole 3 heckles everyone.</p>" },
      { image: img('waterfall-1.jpg'), heading: 'SEVEN REAL WATERFALLS', description: "<p>Not a trickle. Real, thundering waterfalls. Putt under them. Putt through them. One of them actually parts like the sea when your ball approaches. You'll get a little misty. In both senses.</p>" },
      { image: img('hero.png'), heading: 'TOWERING PIRATE STRUCTURES', description: "<p>A 40-foot fortress with real lookout towers. A full ship bow you putt through. A lighthouse you can see from the highway. These aren't decorations — they're destinations.</p>" },
      { image: img('cocktails-1.jpg'), heading: 'CINEMATIC SOUNDTRACK', description: "<p>An original score plays through 40 hidden speakers. You'll hear sea shanties in the cove, thunder on Blackbeard's course, and the Kraken's roar echoing through the caves. It's a whole production.</p>" },
    ],
  }})

  console.log('  Clubhouse')
  await client.setPageContent(indexPage._id, { Clubhouse: {
    Headline: "THE CAPTAIN'S GALLEY",
    Subtitle: 'Our clubhouse is literally inside a pirate ship.',
    Image: img('galley.png'),
    Body: "<p>Duck under timber beams, peer through porthole windows, and belly up to a bar built into the hull. The Captain's Galley serves gourmet burgers, fish tacos, tropical smoothies, craft cocktails from the Grog Bar, and the legendary treasure chest dessert — a real chocolate chest filled with gold-dusted truffles.</p>",
    Stats: [
      { value: '50+', label: 'Menu Items' },
      { value: '12', label: 'Craft Cocktails' },
      { value: '200', label: 'Seats' },
      { value: '1', label: 'Pirate Ship' },
    ],
    'CTA Label': 'See the Full Menu',
    'CTA Link': '#',
  }})

  console.log('  Pricing')
  await client.setPageContent(indexPage._id, { Pricing: {
    'Background Image': img('ocean-sunset-1.jpg'),
    Headline: 'GRAB YOUR PUTTER',
    Subheadline: 'Walk-ins welcome. Booking ahead = skip the line.',
    Tiers: [
      { name: 'SINGLE COURSE', price: '$16', unit: 'per person', features: '<ul><li>✓ 18 holes, pick your course</li><li>✓ Putter & ball included</li><li>✓ Pirate name tag</li></ul>', featured: false, 'cta-label': 'Choose Course', 'cta-link': '#', 'cta-style': 'ghost' },
      { name: 'BOTH COURSES', price: '$26', unit: 'per person', features: '<ul><li>✓ All 36 holes</li><li>✓ Putter & ball included</li><li>✓ Free drink at The Galley</li></ul>', featured: true, 'cta-label': 'Book Now!', 'cta-link': '#', 'cta-style': 'primary' },
      { name: 'PIRATE PARTY', price: '$199', unit: 'up to 10 people', features: "<ul><li>✓ Both courses, whole crew</li><li>✓ Captain's Table reserved</li><li>✓ Treasure chest dessert</li></ul>", featured: false, 'cta-label': 'Plan a Party', 'cta-link': '#', 'cta-style': 'ghost' },
    ],
  }})

  console.log('  InfoBar')
  await client.setPageContent(indexPage._id, { InfoBar: {
    Columns: [
      { heading: 'HOURS', body: '<p>Mon – Thu: 10am – 10pm</p><p>Fri – Sat: 10am – Midnight</p><p>Sun: 10am – 9pm</p>' },
      { heading: 'FIND US', body: '<p>1742 Corsair Boulevard</p><p>Port Harbor, FL 33019</p>' },
      { heading: 'CONTACT', body: '<p>(555) 742-ARGH</p><p>ahoy@buccaneersbluff.com</p>' },
    ],
  }})

  // ─── Step 4: Deploy preview ───
  console.log('\n=== Deploy ===')
  const preview = await client.deployPreview(siteId)
  console.log(`Preview: ${preview.previewUrl}`)
}

main().catch(e => { console.error(e); process.exit(1) })
