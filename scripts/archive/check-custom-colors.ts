import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const site = await db.collection('sites').findOne({
    _id: new mongoose.Types.ObjectId('69952211cb6e382590893367'),
  })
  if (!site) throw new Error('No site')

  console.log('systemColors:', JSON.stringify(site.theme?.systemColors, null, 2))
  console.log('customColors:', JSON.stringify(site.theme?.customColors, null, 2))

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
