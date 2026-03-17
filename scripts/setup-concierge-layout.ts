import { MakeStudioClient } from '../src/api'
import dotenv from 'dotenv'
import crypto from 'crypto'
dotenv.config()

const client = new MakeStudioClient(process.env.MAKE_STUDIO_URL, process.env.MAKE_STUDIO_TOKEN)
const siteId = process.env.MAKE_STUDIO_SITE

async function main() {
  const blocks = await client.getBlocks(siteId)
  const navbar = blocks.find(b => b.name === 'Navbar')
  const footer = blocks.find(b => b.name === 'Footer')
  if (!navbar || !footer) throw new Error('Navbar or Footer block not found')

  // 1. Update the default layout with header/footer blocks
  const layouts = await client.getLayouts(siteId)
  const layout = layouts.find(l => l.isDefault) || layouts[0]
  console.log('Updating layout:', layout.name, layout._id)

  await client.updateLayout(layout._id, {
    headerBlocks: [{ id: crypto.randomUUID(), blockId: navbar._id, name: 'Navbar' }],
    footerBlocks: [{ id: crypto.randomUUID(), blockId: footer._id, name: 'Footer' }]
  })
  console.log('Layout updated with Navbar (header) and Footer (footer)')

  // 2. Set layout content via setPageContent-like approach for layout
  // Layouts don't use setPageContent — content comes from block defaults or page overrides
  // But we need to remove Navbar and Footer from the page's block list

  const pages = await client.getPages(siteId)
  const indexPage = pages.find(p => p.name === 'Index')
  if (!indexPage) throw new Error('Index page not found')

  // Get current page blocks and filter out Navbar and Footer
  const pageBlocks = indexPage.blocks || []
  const filteredBlocks = pageBlocks.filter(
    (b: any) => b.name !== 'Navbar' && b.name !== 'Footer'
  )
  console.log('Page blocks before:', pageBlocks.map((b: any) => b.name).join(', '))
  console.log('Page blocks after:', filteredBlocks.map((b: any) => b.name).join(', '))

  await client.updatePage(indexPage._id, { blocks: filteredBlocks })
  console.log('Updated Index page — removed Navbar and Footer from body')

  // 3. Deploy
  console.log('Deploying preview...')
  const result = await client.deployPreview(siteId)
  console.log('Preview deployed:', result.previewUrl)
}

main().catch(e => console.error(e))
