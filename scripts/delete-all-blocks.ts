import { MakeStudioClient } from '../src/api'
import dotenv from 'dotenv'
dotenv.config()

const client = new MakeStudioClient(process.env.MAKE_STUDIO_URL, process.env.MAKE_STUDIO_TOKEN)
const siteId = process.env.MAKE_STUDIO_SITE

async function main() {
  const blocks = await client.getBlocks(siteId)
  console.log('Found', blocks.length, 'blocks to delete')
  for (const block of blocks) {
    try {
      console.log('Deleting:', block.name, block._id)
      await client.deleteBlock(block._id)
    } catch (e) {
      console.log('  Failed:', e.message)
    }
  }
  const { partials } = await client.getPartials(siteId)
  console.log('Found', partials.length, 'partials to delete')
  for (const p of partials) {
    try {
      console.log('Deleting partial:', p.name, p._id)
      await client.deletePartial(p._id)
    } catch (e) {
      console.log('  Failed:', e.message)
    }
  }
  console.log('Done — site is clean')
}
main().catch(e => console.error(e))
