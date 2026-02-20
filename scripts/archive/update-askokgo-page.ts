import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const questions = [
  { question: 'How did you simulate microgravity?', videoId: 'dJo7Vnr0mpQ' },
  { question: 'What kind of math and science do you use?', videoId: 'xjoikjE_pIc' },
  { question: 'What inspired the name OK Go Sandbox?', videoId: 'BNEL11g2ibs' },
  { question: 'How many explosives do you use?', videoId: '4bKHu3Vfb8c' },
  { question: 'Is it hard to work together and how many mistakes do you make?', videoId: 'jCSOVKvCRh0' },
  { question: 'Where did you rent the dogs?', videoId: 'QDBws40HeBQ' },
  { question: 'How long have you been making videos?', videoId: 'c9izlvIx4wc' },
  { question: 'How did you meet?', videoId: 'I_ImJ1CT8J4' },
  { question: 'Did getting shot by paintballs hurt?', videoId: 'xO1YEdDj6is' },
  { question: 'Do you write your own songs?', videoId: 'CNdnimBLB00' },
  { question: 'How many takes does it take to film your videos?', videoId: 'h-3KU_nonKA' },
]

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const pageId = '69960d89cb6e38259089fdd9'
  const page = await db.collection('pages').findOne({ _id: new mongoose.Types.ObjectId(pageId) })
  if (page == null) throw new Error('No page')

  console.log('Current blocks:', (page.blocks || []).length)

  // Find the AskOkGo block
  const askBlock = (page.blocks || []).find((b: any) => b.name === 'AskOkGo')
  if (askBlock == null) throw new Error('No AskOkGo block found')

  // Get the field ID for the items field
  const siteId = '69952211cb6e382590893367'
  const blockDef = await db.collection('blocks').findOne({ name: 'AskOkGo', site_id: siteId })
  if (blockDef == null) throw new Error('No AskOkGo block def')

  console.log('AskOkGo fields:')
  for (const f of blockDef.fields || []) {
    console.log('  ', f.id, '|', f.name, '|', f.type)
  }

  // Build the items with correct video URLs
  const items = questions.map(q => ({
    id: uuidv4(),
    question: q.question,
    'video-url': `https://www.youtube.com/embed/${q.videoId}?rel=0`,
  }))

  // Update the items field in the AskOkGo block content
  // The items field ID from the block content
  const itemsFieldId = Object.keys(askBlock.content).find(fid => {
    const val = askBlock.content[fid].value
    return Array.isArray(val)
  })

  if (itemsFieldId == null) throw new Error('No items field found in content')
  console.log('Items field ID:', itemsFieldId)

  // Update just the items value
  const updatedBlocks = page.blocks.map((b: any) => {
    if (b.name !== 'AskOkGo') return b
    return {
      ...b,
      content: {
        ...b.content,
        [itemsFieldId]: { value: items },
      },
    }
  })

  const result = await db.collection('pages').updateOne(
    { _id: new mongoose.Types.ObjectId(pageId) },
    {
      $set: {
        blocks: updatedBlocks,
        slug: 'ask-ok-go',
        updatedAt: new Date(),
      },
    }
  )

  console.log(`\nUpdated Ask Ok Go page: ${result.modifiedCount} doc`)
  console.log(`${items.length} questions with video URLs`)
  for (const q of questions) {
    console.log(`  ${q.videoId} — ${q.question}`)
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
