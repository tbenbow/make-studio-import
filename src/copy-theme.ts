import { connect, disconnect } from './db.js'

export interface CopyThemeResult {
  success: boolean
  error?: string
}

export async function copyTheme(
  fromSiteId: string,
  toSiteId: string,
  mongoUri: string
): Promise<CopyThemeResult> {
  const { Site } = await connect(mongoUri)

  const sourceSite = await Site.findById(fromSiteId)
  if (!sourceSite) {
    await disconnect()
    return { success: false, error: `Source site ${fromSiteId} not found` }
  }

  if (!sourceSite.theme) {
    await disconnect()
    return { success: false, error: 'Source site has no theme' }
  }

  const target = await Site.findByIdAndUpdate(
    toSiteId,
    { theme: sourceSite.theme },
    { new: true }
  )

  if (!target) {
    await disconnect()
    return { success: false, error: `Target site ${toSiteId} not found` }
  }

  await disconnect()
  return { success: true }
}
