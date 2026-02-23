import 'dotenv/config'
import { MakeStudioClient } from '../src/api.js'

const client = new MakeStudioClient(
  process.env.MAKE_STUDIO_URL!,
  process.env.SEED_SITE_API_TOKEN!
)

const seedSiteId = process.env.SEED_SITE_ID!

const blocks = await client.getBlocks(seedSiteId)
const { partials } = await client.getPartials(seedSiteId)

console.log('=== BLOCKS ===')
console.log(JSON.stringify(blocks.map(b => ({
  name: b.name,
  _id: b._id,
  category: b.category,
  thumbnailType: b.thumbnailType,
  description: b.description,
  fields: b.fields?.map((f: any) => ({ name: f.name, type: f.type, items: f.items?.map((i: any) => ({ name: i.name, type: i.type })) }))
})), null, 2))

console.log('\n=== PARTIALS ===')
console.log(JSON.stringify(partials.map((p: any) => ({ name: p.name, _id: p._id })), null, 2))
