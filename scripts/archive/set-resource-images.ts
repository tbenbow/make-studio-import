/**
 * Set the Image field on each resource post using original site image URLs.
 * There's no media upload API, so we reference the original site images directly.
 */
import dotenv from 'dotenv'
dotenv.config()

const BASE = process.env.MAKE_STUDIO_URL!
const TOKEN = process.env.MAKE_STUDIO_TOKEN!
const SITE_ID = process.env.MAKE_STUDIO_SITE!

const IMAGE_FIELD_ID = '32648cc9-8eac-4e2a-8870-877981a81b7d'
const DETAIL_BLOCK_ID = '699548e6cb6e382590895b1b'
const ORIGIN = 'https://www.okgosandbox.org'

// Map: page name → original site image path
const imageMap: Record<string, string> = {
  'Chain Reaction Machines': '/resources/chain-reaction-machines/poster-chain.jpg',
  'Making "This Too Shall Pass"': '/resources/making-this-too-shall-pass/poster-mttsp.jpg',
  'Hit the Note': '/resources/hit-the-note/poster-hit.jpg',
  'Simple Machines Scavenger Hunt': '/resources/simple-machines-scavenger-hunt/poster-simple.jpg',
  'Making "The One Moment"': '/resources/making-the-one-moment/poster-mt1m.jpg',
  'The One Moment of Math': '/resources/the-one-moment-of-math/poster-t1mom.jpg',
  'Timing Is Everything': '/resources/timing-is-everything/poster-timing.jpg',
  'Flip Book Challenge': '/resources/flip-book-challenge/poster-flip.jpg',
  'Illusions': '/resources/illusions/poster-illusions.jpg',
  'Cube': '/resources/cube/poster-cube.jpg',
  'Triangle': '/resources/triangle/poster-triangle.jpg',
  'Anamorphic': '/resources/anamorphic/poster-anamorphic.jpg',
  'The Camera': '/resources/the-camera/poster-camera.jpg',
  'Tims Face': '/resources/tims-face/poster-tf.jpg',
  'Finale': '/resources/finale/poster-finale.jpg',
  'Making Upside Down & Inside Out': '/resources/making-upside-down-inside-out/poster-making-udio.jpg',
  'How Parabolas Work': '/resources/the-parabolic-effect/poster-parabolic-effect.jpg',
  'Art in Microgravity': '/resources/art-in-microgravity/poster-microgravity.jpg',
  'Art of Experimentation': '/resources/art-of-experimentation/poster-experimentation.jpg',
  'Making Needing Getting': '/resources/making-needing-getting/poster-mng.jpg',
  'Surrounding Sounds': '/resources/surrounding-sounds/poster-surrounding.jpg',
  'Art Together Now': '/resources/art-together-now/art_together_now_still.jpg',
  'Spin Art': '/resources/spin-art/this_bts_thumbnail.jpg',
  'Circular Motion': '/resources/spin-art/this_bts_thumbnail.jpg',
}

async function api(method: string, path: string, body?: any) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`${method} ${path}: ${res.status} ${JSON.stringify(err)}`)
  }
  return res.json()
}

async function main() {
  // First verify the image URLs are accessible
  console.log('Verifying image URLs...')
  let allGood = true
  for (const [name, path] of Object.entries(imageMap)) {
    const res = await fetch(`${ORIGIN}${path}`, { method: 'HEAD' })
    if (!res.ok) {
      console.log(`  ✗ ${name}: ${res.status} ${ORIGIN}${path}`)
      allGood = false
    }
  }
  if (!allGood) {
    console.log('\nSome images are not accessible. Fix the URLs and retry.')
    return
  }
  console.log(`  All ${Object.keys(imageMap).length} images verified ✓\n`)

  // Get all pages
  const site = await api('GET', `/sites/${SITE_ID}`)
  let updated = 0
  let skipped = 0

  for (const p of site.pages) {
    const page = await api('GET', `/pages/${p._id}`)
    if (!page.postTypeId) continue

    const imagePath = imageMap[page.name]
    if (!imagePath) {
      console.log(`  ? No image mapping for "${page.name}"`)
      skipped++
      continue
    }

    const imageUrl = `${ORIGIN}${imagePath}`

    // Build updated content with the image field set
    const blockContent = page.content?.[DETAIL_BLOCK_ID] || {}
    const updatedBlockContent = {
      ...blockContent,
      [IMAGE_FIELD_ID]: { value: imageUrl },
    }

    const updatedContent = {
      ...page.content,
      [DETAIL_BLOCK_ID]: updatedBlockContent,
    }

    await api('PATCH', `/pages/${page._id}`, { content: updatedContent })
    console.log(`  ✓ ${page.name}: ${imagePath}`)
    updated++
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`)
}

main().catch(e => { console.error(e); process.exit(1) })
