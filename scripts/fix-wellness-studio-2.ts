/**
 * Fix: remove Navbar + FooterNewsletter from page blocks AFTER all setPageContent calls,
 * then redeploy.
 */
import { MakeStudioClient } from '../src/api'
import dotenv from 'dotenv'
dotenv.config()

const baseUrl = process.env.MAKE_STUDIO_URL!
const apiToken = 'mst_c4f353076125a5acbf2a7a7494c06c76d21edfea1b44d9a8dee3f6aa2c8725ab'
const siteId = '699bd7cb00338801ad93eb30'
const pageId = '699bd7cb00338801ad93eb53'

async function main() {
  const client = new MakeStudioClient(baseUrl, apiToken)

  // Get current page
  const page = await client.getPage(pageId)
  console.log('Current blocks:', page.blocks.map((b: any) => b.name).join(', '))

  // Keep only content blocks
  const contentBlocks = page.blocks.filter((b: any) =>
    b.name !== 'Navbar' && b.name !== 'FooterNewsletter'
  )
  console.log('Keeping:', contentBlocks.map((b: any) => b.name).join(', '))

  await client.updatePage(pageId, { blocks: contentBlocks })

  // Verify
  const updated = await client.getPage(pageId)
  console.log('After update:', updated.blocks.map((b: any) => b.name).join(', '))

  // Redeploy
  const preview = await client.deployPreview(siteId)
  console.log('Deployed:', (preview as any).previewUrl)
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
