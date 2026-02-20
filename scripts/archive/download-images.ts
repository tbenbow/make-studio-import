import fs from 'fs'
import path from 'path'

const manifestPath = 'themes/okgosandbox/source/images/manifest.json'
const outputDir = 'themes/okgosandbox/source/images'

interface ManifestEntry {
  url: string
  filename: string
  localPath?: string
  skipped?: boolean
  references: Array<{
    page: string
    pageSlug: string
    block: string
    fieldId: string
    fieldPath: string
  }>
}

async function downloadImage(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`  HTTP ${res.status} for ${url}`)
      return false
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(dest, buffer)
    return true
  } catch (e: any) {
    console.error(`  Error: ${e.message}`)
    return false
  }
}

async function main() {
  const manifest: ManifestEntry[] = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  // Filter to only okgosandbox.org images
  const toDownload = manifest.filter(e => e.url.includes('okgosandbox.org'))
  const skipped = manifest.filter(e => !e.url.includes('okgosandbox.org'))

  console.log(`Total images: ${manifest.length}`)
  console.log(`Downloading: ${toDownload.length} (okgosandbox.org)`)
  console.log(`Skipping: ${skipped.length} (YouTube thumbnails, already uploaded, etc.)\n`)

  // Build unique filenames - use path segments to avoid collisions
  // e.g. /videos/this-too-shall-pass/poster-ttsp@2x.jpg → videos--this-too-shall-pass--poster-ttsp@2x.jpg
  for (const entry of toDownload) {
    const urlPath = new URL(entry.url).pathname
    // Use last 2-3 segments for a readable unique name
    const segments = urlPath.split('/').filter(Boolean)
    const localFilename = segments.slice(-2).join('--')
    entry.localPath = path.join(outputDir, localFilename)
    entry.filename = localFilename
  }

  // Mark skipped entries
  for (const entry of skipped) {
    entry.skipped = true
  }

  // Download
  let downloaded = 0
  let failed = 0

  for (const entry of toDownload) {
    const dest = entry.localPath!
    if (fs.existsSync(dest)) {
      console.log(`  exists: ${entry.filename}`)
      downloaded++
      continue
    }
    process.stdout.write(`  downloading: ${entry.filename}...`)
    const ok = await downloadImage(entry.url, dest)
    if (ok) {
      const size = fs.statSync(dest).size
      console.log(` ${(size / 1024).toFixed(0)}KB`)
      downloaded++
    } else {
      failed++
    }
  }

  console.log(`\nDone: ${downloaded} downloaded, ${failed} failed, ${skipped.length} skipped`)

  // Write updated manifest with localPath info
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`Manifest updated with local paths`)
}

main().catch(e => { console.error(e); process.exit(1) })
