import 'dotenv/config'
import { MakeStudioClient } from '../src/api.js'

const client = new MakeStudioClient(
  process.env.MAKE_STUDIO_URL!,
  process.env.SEED_SITE_API_TOKEN!
)

const seedSiteId = process.env.SEED_SITE_ID!
const blocks = await client.getBlocks(seedSiteId)

const selected = ['Split', 'Features Triple', 'Testimonials Grid', 'Stats', 'FooterNewsletter', 'Navbar']
for (const name of selected) {
  const block = blocks.find((b: any) => b.name === name)
  if (!block) { console.log(`NOT FOUND: ${name}`); continue }
  console.log(`\n=== ${block.name} ===`)
  console.log('Fields:', JSON.stringify(block.fields, null, 2))
}
