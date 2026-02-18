import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (!db) throw new Error('No db')

  const collections = await db.listCollections().toArray()
  console.log('Collections:', collections.map(c => c.name).join(', '))

  // Check media collection
  try {
    const media = await db.collection('media').find({}).limit(2).toArray()
    console.log('\nMedia count:', await db.collection('media').countDocuments())
    if (media.length > 0) {
      console.log('Media sample keys:', Object.keys(media[0]))
      console.log('Media sample:', JSON.stringify(media[0], null, 2).substring(0, 500))
    }
  } catch (e) {
    console.log('No media collection')
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
