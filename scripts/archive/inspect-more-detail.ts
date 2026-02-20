import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const morePage = await db.collection('pages').findOne({ _id: new mongoose.Types.ObjectId('69960dbfcb6e38259089fe03') })
  if (morePage == null) throw new Error('No More page')

  // Show VideoGrid block content in full
  const vgBlock = morePage.blocks.find((b: any) => b.name === 'VideoGrid')
  if (vgBlock) {
    console.log('=== VideoGrid block content ===')
    for (const [fid, val] of Object.entries(vgBlock.content)) {
      const v = (val as any).value
      console.log('\nField:', fid)
      console.log('Value:', JSON.stringify(v, null, 2))
    }
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
