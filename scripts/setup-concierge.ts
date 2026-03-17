import { MakeStudioClient } from '../src/api'
import dotenv from 'dotenv'
import crypto from 'crypto'
dotenv.config()

const client = new MakeStudioClient(process.env.MAKE_STUDIO_URL, process.env.MAKE_STUDIO_TOKEN)
const siteId = process.env.MAKE_STUDIO_SITE

async function main() {
  // 1. Get all blocks
  const blocks = await client.getBlocks(siteId)
  console.log('Blocks:', blocks.map(b => b.name).join(', '))

  // 2. Get pages
  const pages = await client.getPages(siteId)
  console.log('Pages:', pages.map(p => `${p.name} (${p._id})`).join(', '))

  // Find or use the Index page
  let indexPage = pages.find(p => p.name === 'Index' || p.name === 'Home')
  if (!indexPage) {
    console.log('No Index page found, using first page')
    indexPage = pages[0]
  }
  console.log('Using page:', indexPage.name, indexPage._id)

  // 3. Get layouts and assign one
  const layouts = await client.getLayouts(siteId)
  console.log('Layouts:', layouts.map(l => `${l.name} (${l._id})`).join(', '))
  const layout = layouts.find(l => l.isDefault) || layouts[0]
  if (layout) {
    await client.updatePage(indexPage._id, { settings: { layoutId: layout._id } })
    console.log('Assigned layout:', layout.name)
  }

  // 4. Set block order on the page
  const blockOrder = ['Navbar', 'Hero', 'WhoItsFor', 'HowItWorks', 'MakeStudio', 'Pricing', 'About', 'CTA', 'Footer']
  const blockRefs = blockOrder.map(name => {
    const block = blocks.find(b => b.name === name)
    if (!block) {
      console.log('WARNING: Block not found:', name)
      return null
    }
    return { id: crypto.randomUUID(), blockId: block._id, name: block.name }
  }).filter(Boolean)

  await client.updatePage(indexPage._id, { blocks: blockRefs })
  console.log('Set block order:', blockRefs.map(b => b.name).join(' → '))

  // 5. Deploy preview
  console.log('Deploying preview...')
  const result = await client.deployPreview(siteId)
  console.log('Preview deployed:', result)
}

main().catch(e => console.error(e))
