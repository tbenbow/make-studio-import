import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const indexPageId = '69952211cb6e38259089338a'
  const lessonsPageId = '69962174cb6e3825908a15a5'

  // Get the homepage
  const homePage = await db.collection('pages').findOne({ _id: new mongoose.Types.ObjectId(indexPageId) })
  if (homePage == null) throw new Error('No home page')

  console.log('Home page blocks:')
  for (const b of (homePage.blocks || [])) {
    console.log('  -', b.name)
  }

  // Copy all blocks except Hero
  const blocks = (homePage.blocks || [])
    .filter((b: any) => b.name !== 'Hero')
    .map((b: any) => ({ ...b, id: uuidv4() }))

  console.log('\nCopying to lessons page:')
  for (const b of blocks) {
    console.log('  -', b.name)
  }

  const result = await db.collection('pages').updateOne(
    { _id: new mongoose.Types.ObjectId(lessonsPageId) },
    {
      $set: {
        blocks,
        updatedAt: new Date(),
      },
    }
  )

  console.log('\nUpdated lessons page:', result.modifiedCount, 'doc')

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
