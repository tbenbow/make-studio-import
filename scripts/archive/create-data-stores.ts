import mongoose from 'mongoose'
import { randomUUID } from 'crypto'

const siteId = '69952211cb6e382590893367'

const dataStores = [
  {
    name: 'Music Videos',
    slug: 'music-videos',
    entries: [
      'This Too Shall Pass',
      'The One Moment',
      "The Writing's On The Wall",
      'Upside Down & Inside Out',
      'Needing/Getting',
      'All Together Now',
      'This',
    ],
  },
  {
    name: 'Subjects',
    slug: 'subjects',
    entries: [
      'Acceleration',
      'Artistic Control',
      'Arts',
      'Collaboration',
      'Design Process',
      'Engineering',
      'Gravity',
      'Illusions',
      'Math',
      'Music',
      'Physics',
      'Science',
      'Simple Machines',
    ],
  },
  {
    name: 'Grade Levels',
    slug: 'grade-levels',
    entries: ['K-2', '3-5', '6-8', '9-12'],
  },
]

function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const stores = dataStores.map((ds) => ({
    id: randomUUID(),
    name: ds.name,
    slug: ds.slug,
    entries: ds.entries.map((label) => ({
      id: randomUUID(),
      key: label,
      value: toSlug(label),
    })),
  }))

  const result = await db.collection('sites').updateOne(
    { _id: new mongoose.Types.ObjectId(siteId) },
    { $push: { dataStores: { $each: stores } } as any }
  )

  console.log(`Updated ${result.modifiedCount} site document`)
  for (const store of stores) {
    console.log(`  ${store.name} (${store.slug}): ${store.entries.length} entries`)
  }

  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
