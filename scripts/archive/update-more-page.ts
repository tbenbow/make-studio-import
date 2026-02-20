import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

// All video sections scraped from okgosandbox.org/more
const videoSections = [
  {
    heading: 'Upside Down & Inside Out',
    videos: [
      { title: 'Music Video', videoId: 'LWGJA9i18Co' },
      { title: 'How We Did It', videoId: 'pnTqZ68fI7Q' },
      { title: 'How Parabolas Work', videoId: 'bMrX014HTgU' },
      { title: 'Behind the Scenes', videoId: 'Gsnyqu7xq9c' },
    ],
  },
  {
    heading: "The Writing's On the Wall",
    videos: [
      { title: 'Music Video', videoId: 'm86ae_e_ptU' },
      { title: 'Video Teaser', videoId: 'ucSihoHZV8o' },
      { title: 'How to Make an OK Go Video', videoId: 'k0gNtIWz92A' },
      { title: "Pre-Visualization for The Writing's On the Wall", videoId: 'yYYD6rTOKBs' },
      { title: "From the Trenches of The Writing's On the Wall", videoId: 'U3RSoSnStNw' },
    ],
  },
  {
    heading: 'White Knuckles',
    videos: [
      { title: 'Music Video', videoId: 'nHlJODYBLKs' },
      { title: 'Outtakes', videoId: 'oV4FLlzCrlc' },
      { title: 'Can We Do It? Yes We Can.', videoId: 'i2wG1pzbYR0' },
      { title: 'The Beginnings', videoId: 'JCIDJy4Ijf8' },
      { title: 'Counting Lessons', videoId: 'qZxxzNNXuiw' },
      { title: 'One Giant Step for Everyone', videoId: 'ErXMKtfi8DU' },
      { title: 'Goats are Good Dancers', videoId: 'fJSF5FWPAFg' },
      { title: 'Bunny the Swamp Creature', videoId: 'zRtvmRo6x5s' },
      { title: 'Full Take', videoId: 'T5DE84TmdyE' },
      { title: 'Outtakes + 4 Angles', videoId: 'CXJflIGDE-o' },
    ],
  },
  {
    heading: 'The One Moment',
    videos: [
      { title: 'Music Video', videoId: 'QvW61K2s0tA' },
      { title: 'The One Math', videoId: 'v8nc5wBl0dM' },
      { title: 'Spray Paint Test', videoId: 'KZmnnn1FB5U' },
      { title: 'Alternate', videoId: '9lIIdjCrMmM' },
      { title: 'Behind the Scenes', videoId: '2dFdNUz2cQc' },
    ],
  },
  {
    heading: 'All Is Not Lost',
    videos: [
      { title: 'Music Video', videoId: 'ur-y7oOto14' },
      { title: 'A Message for Japan (with subtitles)', videoId: 'akyxuKZgy7Q' },
      { title: 'The Collaboration', videoId: 'E4J5SUpvjc0' },
      { title: 'Pilobolus', videoId: 'WdfLhueuaVg' },
      { title: '3D Filming', videoId: '-CUAqbsvQ98' },
      { title: 'The Dance', videoId: '1bp21wN-1J4' },
      { title: 'A Message for Japan', videoId: 'tFpGjFqnyXc' },
      { title: 'Katakana', videoId: 'XNbZFjF5exk' },
    ],
  },
  {
    heading: 'Needing/Getting',
    videos: [
      { title: 'Music Video', videoId: 'MejbOFk7H6c' },
      { title: 'Tuning A Track', videoId: '75aqU54CaYE' },
      { title: 'Process of Play', videoId: 'tsK8TSx1Sbk' },
      { title: 'Overview', videoId: 'qae4gAbXOZ8' },
      { title: 'Trailer', videoId: '9Op9owJiujY' },
    ],
  },
  {
    heading: 'Obsession',
    videos: [
      { title: 'Music Video', videoId: 'LgmxMuW6Fsc' },
      { title: 'Choreography', videoId: 'iZ4rs7V7DNY' },
      { title: 'Testing', videoId: 'NLbFN2iLw2I' },
      { title: 'Paper Mapping', videoId: '4ipSN3qT_Wk' },
      { title: 'Technology', videoId: 'bKc4R1ImZAY' },
      { title: 'Shooting', videoId: 'H_AcLvGOQ18' },
      { title: 'Q&A with Damian', videoId: 'KX_zAJVGI6g' },
    ],
  },
  {
    heading: 'The Muppet Show Theme Song',
    videos: [
      { title: 'Music Video', videoId: 'oiMZa8flyYY' },
      { title: 'Damian Kulash and Kermit the Frog', videoId: 'GPGCNrFXUt4' },
      { title: 'Trailer', videoId: 'baTnoMX-QaI' },
      { title: 'Danimal vs Animal', videoId: 'yHK0JVAqQgE' },
      { title: 'On Set With OK Go & The Muppets', videoId: 'oQZTn61PFJc' },
    ],
  },
  {
    heading: 'More Music Videos',
    videos: [
      { title: '3 Primary Colors', videoId: 'yu44JRTIxSQ' },
      { title: 'A Million Ways', videoId: 'M1_CLW-NNwc' },
      { title: 'Here It Goes Again', videoId: 'dTAAsCNK7RA' },
      { title: 'Invincible', videoId: 'mItuZ8i4wH8' },
      { title: 'Do What You Want', videoId: 'i00GDT9FuFM' },
      { title: 'End Love', videoId: 'V2fpgpanZAw' },
      { title: 'Last Leaf', videoId: 'IkYfB1C0Zgc' },
      { title: 'Back from Kathmandu', videoId: 'YtMSzGZH5q0' },
      { title: 'Skyscrapers', videoId: 'Rb4lgOiHBZo' },
      { title: "I Won't Let You Down", videoId: 'u1ZB_rGFyeU' },
      { title: 'NPR', videoId: 'Wm63LibDiFk' },
    ],
  },
]

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteId = '69952211cb6e382590893367'
  const morePageId = '69960dbfcb6e38259089fe03'

  // Get the current page
  const morePage = await db.collection('pages').findOne({ _id: new mongoose.Types.ObjectId(morePageId) })
  if (morePage == null) throw new Error('No More page')

  // Get block definitions
  const blocks = await db.collection('blocks').find({ site_id: siteId }).toArray()
  const blockMap = new Map(blocks.map(b => [b.name, b]))

  const videoGrid = blockMap.get('VideoGrid')
  if (videoGrid == null) throw new Error('Missing VideoGrid block')

  // Helper: build content keyed by field UUIDs
  function buildContent(block: any, values: Record<string, any>) {
    const content: Record<string, { value: any }> = {}
    for (const field of (block.fields || [])) {
      const key = field.name.toLowerCase().replace(/\s+/g, '-')
      if (values[key] !== undefined) {
        content[field.id] = { value: values[key] }
      }
    }
    return content
  }

  // Keep existing PageHeader block, replace VideoGrid blocks
  const existingBlocks = (morePage.blocks || []).filter((b: any) => b.name !== 'VideoGrid')

  // Build VideoGrid blocks for each section
  const newVideoGridBlocks = videoSections.map(section => ({
    id: uuidv4(),
    blockId: videoGrid._id.toString(),
    name: 'VideoGrid',
    description: videoGrid.description || '',
    content: buildContent(videoGrid, {
      'heading': section.heading,
      'videos': section.videos.map(v => ({
        id: uuidv4(),
        thumbnail: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
        title: v.title,
        url: `https://www.youtube.com/embed/${v.videoId}?rel=0`,
      })),
    }),
  }))

  const allBlocks = [...existingBlocks, ...newVideoGridBlocks]

  const result = await db.collection('pages').updateOne(
    { _id: new mongoose.Types.ObjectId(morePageId) },
    {
      $set: {
        blocks: allBlocks,
        slug: 'more',
        updatedAt: new Date(),
      },
    }
  )

  console.log(`Updated More page: ${result.modifiedCount} doc`)
  console.log(`Blocks: ${existingBlocks.length} existing + ${newVideoGridBlocks.length} VideoGrid = ${allBlocks.length} total`)
  for (const section of videoSections) {
    console.log(`  ${section.heading}: ${section.videos.length} videos`)
  }
  console.log(`Total videos: ${videoSections.reduce((sum, s) => sum + s.videos.length, 0)}`)

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
