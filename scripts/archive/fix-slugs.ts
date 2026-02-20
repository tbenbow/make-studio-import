import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const fixes = [
    { id: '69962174cb6e3825908a15a5', name: 'Lessons', slug: 'lessons' },
    { id: '69960358cb6e38259089e45a', name: 'About', slug: 'about' },
  ]

  for (const fix of fixes) {
    const result = await db.collection('pages').updateOne(
      { _id: new mongoose.Types.ObjectId(fix.id) },
      { $set: { slug: fix.slug, updatedAt: new Date() } }
    )
    console.log(`Set "${fix.name}" slug to "${fix.slug}" — ${result.modifiedCount} doc`)
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
