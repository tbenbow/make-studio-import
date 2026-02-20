import mongoose from 'mongoose'

const siteId = '69952211cb6e382590893367'

const broken404s = [
  // Regular pages
  { path: '/more', type: 'page' },
  { path: '/about', type: 'page' },
  { path: '/ask-ok-go', type: 'page' },
  // Lesson pages
  { path: '/lessons/all-together-now.html', slug: 'all-together-now', type: 'lesson' },
  // Resource pages
  { path: '/resources/making-this-too-shall-pass.html', slug: 'making-this-too-shall-pass', type: 'resource' },
  { path: '/resources/making-the-one-moment.html', slug: 'making-the-one-moment', type: 'resource' },
  { path: '/resources/anamorphic.html', slug: 'anamorphic', type: 'resource' },
  { path: '/resources/the-camera.html', slug: 'the-camera', type: 'resource' },
  { path: '/resources/tims-face.html', slug: 'tims-face', type: 'resource' },
  { path: '/resources/finale.html', slug: 'finale', type: 'resource' },
  { path: '/resources/making-upside-down-inside-out.html', slug: 'making-upside-down-inside-out', type: 'resource' },
  { path: '/resources/making-needing-getting.html', slug: 'making-needing-getting', type: 'resource' },
  { path: '/resources/circular-motion.html', slug: 'circular-motion', type: 'resource' },
  // Breadcrumb links (lesson pages without /lessons/ prefix)
  { path: '/this-too-shall-pass', slug: 'this-too-shall-pass', type: 'breadcrumb' },
  { path: '/the-one-moment', slug: 'the-one-moment', type: 'breadcrumb' },
  { path: '/the-writings-on-the-wall', slug: 'the-writings-on-the-wall', type: 'breadcrumb' },
  { path: '/upside-down-inside-out', slug: 'upside-down-inside-out', type: 'breadcrumb' },
  { path: '/needing-getting', slug: 'needing-getting', type: 'breadcrumb' },
  { path: '/all-together-now', slug: 'all-together-now', type: 'breadcrumb' },
  { path: '/this', slug: 'this', type: 'breadcrumb' },
]

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteOid = new mongoose.Types.ObjectId(siteId)

  // Get post type
  const postType = await db.collection('posttypes').findOne({ site_id: siteId })
  console.log('PostType:', postType?.name, 'path:', postType?.path, 'slug:', postType?.slug)
  console.log('PostType postIds count:', postType?.postIds?.length)

  // Get all layouts
  const layouts = await db.collection('layouts').find({
    $or: [{ site_id: siteId }, { site_id: siteOid }]
  }).toArray()
  console.log('\nLayouts:')
  for (const l of layouts) {
    console.log(`  ${l.name} (slug: ${l.slug}) - pages: ${l.pageIds?.length || 0}`)
    // Show associated page slugs
    if (l.pageIds?.length) {
      const lpages = await db.collection('pages').find({ _id: { $in: l.pageIds.map((id: any) => new mongoose.Types.ObjectId(id)) } }).toArray()
      for (const p of lpages) {
        console.log(`    - ${p.name} (${p.slug})`)
      }
    }
  }

  // Check site.pages array
  const site = await db.collection('sites').findOne({ _id: siteOid })
  console.log('\nSite pages array:', site?.pages?.length)
  if (site?.pages) {
    for (const p of site.pages) {
      console.log(`  ${p.name} (${p._id})`)
    }
  }

  console.log('\n=== DIAGNOSING 404s ===\n')

  // Check regular pages
  for (const item of broken404s.filter(b => b.type === 'page')) {
    const slug = item.path.replace('/', '').replace('.html', '')
    const page = await db.collection('pages').findOne({
      slug,
      $or: [{ site_id: siteId }, { site_id: siteOid }],
    })
    console.log(`${item.path}: ${page ? `EXISTS (id: ${page._id}, name: ${page.name})` : 'NOT FOUND IN DB'}`)
  }

  // Check resource pages
  for (const item of broken404s.filter(b => b.type === 'resource')) {
    const page = await db.collection('pages').findOne({
      slug: item.slug,
      postTypeId: postType?._id,
    })
    const inPostIds = postType?.postIds?.some((id: any) => id.toString() === page?._id.toString())
    console.log(`${item.path}: ${page ? `EXISTS (id: ${page._id})` : 'NOT FOUND'} ${page ? (inPostIds ? '✓ in postIds' : '✗ NOT in postIds') : ''}`)
  }

  // Check lesson pages
  for (const item of broken404s.filter(b => b.type === 'lesson')) {
    const page = await db.collection('pages').findOne({
      slug: item.slug,
      $or: [{ site_id: siteId }, { site_id: siteOid }],
      postTypeId: { $exists: false },
    })
    console.log(`${item.path}: ${page ? `EXISTS (id: ${page._id}, name: ${page.name})` : 'NOT FOUND'}`)
    if (page) {
      // Check if it's in the lessons layout
      const inLayout = layouts.some(l => l.pageIds?.some((id: any) => id.toString() === page._id.toString()))
      console.log(`  In a layout: ${inLayout}`)
    }
  }

  // Check breadcrumb links — what are the actual valid paths for lesson pages?
  console.log('\n=== LESSON PAGE URL STRUCTURE ===')
  console.log('Working lesson URL example: /lessons/this-too-shall-pass.html')
  console.log('Broken breadcrumb example: /this-too-shall-pass')
  console.log('These breadcrumb links need to be /lessons/{slug}.html')

  await mongoose.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
