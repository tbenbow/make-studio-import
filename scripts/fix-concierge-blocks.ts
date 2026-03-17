import { MakeStudioClient } from '../src/api'
import dotenv from 'dotenv'
import crypto from 'crypto'
dotenv.config()

const client = new MakeStudioClient(process.env.MAKE_STUDIO_URL, process.env.MAKE_STUDIO_TOKEN)
const siteId = process.env.MAKE_STUDIO_SITE

async function main() {
  const blocks = await client.getBlocks(siteId)
  const pages = await client.getPages(siteId)
  const indexPage = pages.find(p => p.name === 'Index')

  // Body blocks only (no Navbar, no Footer)
  const bodyOrder = ['Hero', 'WhoItsFor', 'HowItWorks', 'MakeStudio', 'Pricing', 'About', 'CTA']
  const blockRefs = bodyOrder.map(name => {
    const block = blocks.find(b => b.name === name)
    if (!block) { console.log('Missing:', name); return null }
    return { id: crypto.randomUUID(), blockId: block._id, name: block.name }
  }).filter(Boolean)

  await client.updatePage(indexPage._id, { blocks: blockRefs })
  console.log('Set body blocks:', blockRefs.map(b => b.name).join(' → '))

  // Re-set content for all blocks including layout ones
  await client.setPageContent(indexPage._id, {
    Navbar: {
      "Logo Text": "Concierge",
      "Logo Link": "/",
      Links: [
        { label: "How it works", link: "#how" },
        { label: "Pricing", link: "#pricing" },
        { label: "About", link: "#about" },
        { label: "Get started", link: "#contact" }
      ]
    },
    Footer: {
      "Left Text": "Concierge — A website service by Jamey & Tom",
      "Right Text": "Built on Make Studio"
    }
  })
  console.log('Set layout block content')

  console.log('Deploying preview...')
  const result = await client.deployPreview(siteId)
  console.log('Done:', result.previewUrl)
}
main().catch(e => console.error(e))
