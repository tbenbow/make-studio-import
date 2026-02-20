/**
 * Read-only diagnostic: deeper investigation of 404 causes.
 */
import mongoose from 'mongoose'

const siteId = '69952211cb6e382590893367'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (!db) throw new Error('No db')

  // 1. Post type details
  const postType = await db.collection('posttypes').findOne({
    $or: [{ site_id: siteId }, { site_id: new mongoose.Types.ObjectId(siteId) }],
  })
  console.log('=== POST TYPE ===')
  if (postType) {
    const { _id, name, slug, path, site_id, ...rest } = postType
    console.log(JSON.stringify({ _id, name, slug, path, site_id_type: typeof site_id, otherKeys: Object.keys(rest) }, null, 2))
  }

  // 2. Check parentId for lesson pages (why do they appear under /lessons/?)
  const pages = await db.collection('pages').find({
    $or: [{ site_id: siteId }, { site_id: new mongoose.Types.ObjectId(siteId) }],
  }).toArray()

  const lessonSlugs = ['this-too-shall-pass', 'the-one-moment', 'the-writings-on-the-wall',
    'upside-down-inside-out', 'needing-getting', 'all-together-now', 'this']

  console.log('\n=== LESSON PAGES parentId CHECK ===')
  for (const slug of lessonSlugs) {
    const p = pages.find(pg => pg.slug === slug && !pg.postTypeId)
    if (p) {
      console.log(`  ${slug}: parentId=${p.parentId || 'none'} _id=${p._id}`)
    } else {
      console.log(`  ${slug}: NOT FOUND`)
    }
  }

  // 3. Check folders
  const folders = await db.collection('folders').find({
    $or: [{ site_id: siteId }, { site_id: new mongoose.Types.ObjectId(siteId) }],
  }).toArray()
  console.log(`\n=== FOLDERS (${folders.length}) ===`)
  for (const f of folders) {
    console.log(`  ${f.name} (${f.slug}) _id=${f._id}`)
  }

  // 4. Check layouts
  const layouts = await db.collection('layouts').find({
    $or: [{ site_id: siteId }, { site_id: new mongoose.Types.ObjectId(siteId) }],
  }).toArray()
  console.log(`\n=== LAYOUTS (${layouts.length}) ===`)
  for (const l of layouts) {
    console.log(`  ${l.name} _id=${l._id}`)
  }

  // 5. Nav links on ALL pages (find which have broken links)
  console.log('\n=== NAV LINKS BY PAGE ===')
  for (const p of pages) {
    if (!p.blocks) continue
    const navBlock = p.blocks.find((b: any) => b.name === 'Navbar')
    if (!navBlock?.content) continue
    for (const [key, val] of Object.entries(navBlock.content)) {
      const v = val as any
      if (Array.isArray(v?.value) && v.value.length > 0 && v.value[0]?.url !== undefined) {
        const brokenLinks = v.value.filter((item: any) =>
          ['/more', '/about', '/ask-ok-go'].includes(item.url)
        )
        if (brokenLinks.length > 0) {
          console.log(`  BROKEN on "${p.name}" (${p.slug}): ${brokenLinks.map((l: any) => l.url).join(', ')}`)
        }
      }
    }
  }

  // 6. LessonCards links (from pages that have LessonCards blocks)
  console.log('\n=== LESSONCARDS LINKS ===')
  for (const p of pages) {
    if (!p.blocks) continue
    const lcBlock = p.blocks.find((b: any) => b.name === 'LessonCards')
    if (!lcBlock?.content) continue
    for (const [key, val] of Object.entries(lcBlock.content)) {
      const v = val as any
      if (Array.isArray(v?.value) && v.value.length > 0) {
        for (const item of v.value) {
          if (item.link) {
            const broken = !item.link.startsWith('/lessons/') && item.link !== '/' && item.link !== '#'
            console.log(`  ${broken ? 'BROKEN' : 'ok'} "${item.title}" → ${item.link}`)
          }
        }
      }
    }
  }

  // 7. ResourceCards links (from lesson detail pages)
  console.log('\n=== RESOURCECARDS LINKS ===')
  for (const p of pages) {
    if (!p.blocks) continue
    const rcBlock = p.blocks.find((b: any) => b.name === 'ResourceCards')
    if (!rcBlock?.content) continue
    console.log(`  Page: ${p.name} (${p.slug})`)
    for (const [key, val] of Object.entries(rcBlock.content)) {
      const v = val as any
      if (Array.isArray(v?.value) && v.value.length > 0) {
        for (const item of v.value) {
          if (item.link) {
            const ok = item.link.startsWith('/resources/')
            console.log(`    ${ok ? 'ok' : 'BROKEN'} "${item.title}" → ${item.link}`)
          }
        }
      }
    }
  }

  // 8. Check a sample resource page's postTypeId value
  const sampleResource = pages.find(p => p.slug === 'chain-reaction-machines')
  if (sampleResource) {
    console.log('\n=== SAMPLE RESOURCE PAGE (chain-reaction-machines) ===')
    console.log(`  postTypeId value: ${sampleResource.postTypeId}`)
    console.log(`  postTypeId type: ${sampleResource.postTypeId?.constructor?.name}`)
    console.log(`  Expected postType _id: ${postType?._id}`)
    console.log(`  Match (string): ${String(sampleResource.postTypeId) === String(postType?._id)}`)
  }

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
