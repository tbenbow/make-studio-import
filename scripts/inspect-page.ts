import { MakeStudioClient } from '../src/api'
import dotenv from 'dotenv'
dotenv.config()

const client = new MakeStudioClient(process.env.MAKE_STUDIO_URL, process.env.MAKE_STUDIO_TOKEN)
const siteId = process.env.MAKE_STUDIO_SITE

async function main() {
  const pages = await client.getPages(siteId)
  const idx = pages.find(p => p.name === 'Index')
  console.log('blocks:', JSON.stringify(idx.blocks, null, 2))
  console.log('settings:', JSON.stringify(idx.settings, null, 2))

  const layouts = await client.getLayouts(siteId)
  const layout = layouts[0]
  console.log('layout headerBlocks:', JSON.stringify(layout.headerBlocks, null, 2))
  console.log('layout footerBlocks:', JSON.stringify(layout.footerBlocks, null, 2))
}
main()
