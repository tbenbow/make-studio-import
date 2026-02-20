import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')
  const siteId = '69952211cb6e382590893367'

  // The populated TTSP page
  const ttsp = await db.collection('pages').findOne({ _id: new mongoose.Types.ObjectId('69952e556e6cf186929bbc2a') })
  if (ttsp == null) throw new Error('No page')

  // Show ResourceCards content in full
  const rcBlock = ttsp.blocks.find((b: any) => b.name === 'ResourceCards')
  if (rcBlock) {
    console.log('=== ResourceCards block ===')
    console.log('blockId:', rcBlock.blockId)
    for (const [fid, val] of Object.entries(rcBlock.content)) {
      const v = (val as any).value
      console.log('\nField:', fid)
      console.log('Value:', JSON.stringify(v, null, 2))
    }
  }

  // Show VideoHero content in full
  const vhBlock = ttsp.blocks.find((b: any) => b.name === 'VideoHero')
  if (vhBlock) {
    console.log('\n=== VideoHero block ===')
    console.log('blockId:', vhBlock.blockId)
    for (const [fid, val] of Object.entries(vhBlock.content)) {
      const v = (val as any).value
      console.log('\nField:', fid)
      console.log('Value:', JSON.stringify(v, null, 2))
    }
  }

  // Get the block field definitions for VideoHero and ResourceCards
  const videoHeroBlock = await db.collection('blocks').findOne({ _id: new mongoose.Types.ObjectId('69952e20cb6e382590894bcb') })
  const resourceCardsBlock = await db.collection('blocks').findOne({ _id: new mongoose.Types.ObjectId('69952e20cb6e382590894bb1') })

  if (videoHeroBlock) {
    console.log('\n=== VideoHero field defs ===')
    for (const f of videoHeroBlock.fields || []) {
      console.log(f.id, '|', f.name, '|', f.type)
    }
  }

  if (resourceCardsBlock) {
    console.log('\n=== ResourceCards field defs ===')
    for (const f of resourceCardsBlock.fields || []) {
      console.log(f.id, '|', f.name, '|', f.type)
    }
  }

  // Check the blank lesson pages — which ones have blocks assigned already?
  const blankLessons = ['69960e6bcb6e38259089fe4a', '69960e8bcb6e38259089febd', '69960e9dcb6e38259089fee7', '69960eb9cb6e38259089ff11', '69960ecacb6e38259089ff3b', '69960ed6cb6e38259089ff65', '69960ee4cb6e38259089ff8f']
  for (const id of blankLessons) {
    const p = await db.collection('pages').findOne({ _id: new mongoose.Types.ObjectId(id) })
    if (p) {
      console.log('\n---', p.name, '---')
      console.log('slug:', p.slug)
      console.log('blocks:', JSON.stringify(p.blocks, null, 2).slice(0, 300))
    }
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
