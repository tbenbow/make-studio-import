import dotenv from 'dotenv'
dotenv.config()
import { MakeStudioClient } from '../../src/api.js'

async function main() {
  const client = new MakeStudioClient(process.env.MAKE_STUDIO_URL!, process.env.MAKE_STUDIO_TOKEN!)
  const siteId = process.env.MAKE_STUDIO_SITE!
  console.log(`Deploying preview for site ${siteId}...`)
  const result = await client.deployPreview(siteId)
  console.log('Preview deploy result:', JSON.stringify(result, null, 2))
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
