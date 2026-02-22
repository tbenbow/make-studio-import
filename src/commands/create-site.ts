import fs from 'fs'
import path from 'path'
import { type CommandContext, output, MakeStudioClient } from './context.js'

export async function createSiteCommand(ctx: CommandContext): Promise<void> {
  const { args, rootDir } = ctx

  const siteName = args.name
  if (!siteName) {
    output({ error: '--name is required' })
    process.exit(1)
  }
  const baseUrl = process.env.MAKE_STUDIO_URL
  const createToken = process.env.MAKE_STUDIO_CREATE_TOKEN
  if (!baseUrl || !createToken) {
    output({ error: 'MAKE_STUDIO_URL and MAKE_STUDIO_CREATE_TOKEN environment variables are required' })
    process.exit(1)
  }
  const createClient = new MakeStudioClient(baseUrl, createToken)
  console.log(`Creating site "${siteName}"...`)
  const newSite = await createClient.createSite(siteName)
  const newSiteId = newSite._id
  const siteToken = newSite.apiToken

  if (siteToken) {
    const envPath = path.join(rootDir, '.env')
    let envContent = fs.readFileSync(envPath, 'utf-8')
    envContent = envContent.replace(/^MAKE_STUDIO_TOKEN=.*$/m, `MAKE_STUDIO_TOKEN=${siteToken}`)
    envContent = envContent.replace(/^MAKE_STUDIO_SITE=.*$/m, `MAKE_STUDIO_SITE=${newSiteId}`)
    fs.writeFileSync(envPath, envContent)
    console.log(`Site created: ${newSiteId}`)
    console.log(`Site token saved to .env`)
    console.log(`MAKE_STUDIO_SITE=${newSiteId}`)
  } else {
    console.log(`Site created: ${newSiteId}`)
    console.log('Warning: No API token returned (not using account token?)')
  }
  output({ success: true, siteId: newSiteId, hasToken: !!siteToken })
  process.exit(0)
}
