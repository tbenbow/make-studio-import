import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve('.','.env') })
import { MakeStudioClient } from '../src/api.js'

const client = new MakeStudioClient(process.env.MAKE_STUDIO_URL!, process.env.MAKE_STUDIO_TOKEN!)
const siteId = process.env.MAKE_STUDIO_SITE!

async function main() {
  console.log(`Deploying preview for site ${siteId}...`)
  const result = await client.deployPreview(siteId)
  console.log(JSON.stringify(result, null, 2))
}

main().catch(console.error)
