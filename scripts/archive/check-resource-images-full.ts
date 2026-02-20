/**
 * Full investigation of resource post images:
 * 1. Check all resource posts for image field values
 * 2. Check the LessonDetail block field definitions to understand the mapping
 * 3. Check what (posts "resources") actually returns
 */
import dotenv from 'dotenv'
dotenv.config()

const BASE = process.env.MAKE_STUDIO_URL!
const TOKEN = process.env.MAKE_STUDIO_TOKEN!
const SITE_ID = process.env.MAKE_STUDIO_SITE!

async function api(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  })
  if (!res.ok) throw new Error(`${path}: ${res.status}`)
  return res.json()
}

async function main() {
  const site = await api(`/sites/${SITE_ID}`)

  // 1. Check the LessonDetail block field definitions
  console.log('=== LessonDetail Block Fields ===')
  const block = await api(`/blocks/699548e6cb6e382590895b1b`)
  if (block.fields) {
    for (const f of block.fields) {
      console.log(`  ${f.id} → "${f.name}" (type: ${f.type})`)
    }
  }

  // 2. Check all resource posts for image values
  console.log('\n=== Resource Post Image Values ===')
  const imageFieldId = block.fields?.find((f: any) => f.name?.toLowerCase() === 'image')?.id
  console.log(`Image field ID: ${imageFieldId}\n`)

  for (const p of site.pages) {
    const page = await api(`/pages/${p._id}`)
    if (!page.postTypeId) continue

    const blockContent = page.content?.['699548e6cb6e382590895b1b']
    if (!blockContent) {
      console.log(`${page.name}: NO block content`)
      continue
    }

    // Check all fields for anything that looks like an image URL
    let imageVal = 'not found'
    let videoVal = ''
    for (const [fieldId, fieldData] of Object.entries(blockContent) as any) {
      const fname = block.fields?.find((f: any) => f.id === fieldId)?.name || fieldId
      if (fname.toLowerCase() === 'image') {
        imageVal = fieldData.value || '(empty)'
      }
      if (fname.toLowerCase().includes('video')) {
        videoVal = fieldData.value || ''
      }
    }
    console.log(`${page.name}: image="${imageVal}" ${videoVal ? `video="${videoVal}"` : ''}`)
  }

  // 3. Check the resources index page to see what block it uses
  console.log('\n=== Resources Index Page ===')
  const indexPage = await api(`/pages/69960f5fcb6e3825908a004d`)
  console.log(`Name: ${indexPage.name}`)
  if (indexPage.blocks) {
    for (const b of indexPage.blocks) {
      console.log(`  Block: ${b.name} (blockId: ${b.blockId})`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
