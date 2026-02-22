import { MakeStudioClient } from '../src/api'
import dotenv from 'dotenv'
dotenv.config()

const client = new MakeStudioClient(process.env.MAKE_STUDIO_URL!, process.env.MAKE_STUDIO_TOKEN!)
const siteId = process.env.MAKE_STUDIO_SITE!

async function main() {
  console.log(`Deploying preview for site ${siteId}...`)
  const result = await client.deployPreview(siteId)
  console.log(JSON.stringify(result, null, 2))
}

main().catch(console.error)
