/**
 * Search and download images from Pexels.
 *
 * Usage:
 *   npx tsx scripts/search-pexels.ts --query="pirate ship ocean" --out=themes/pirate-golf/source/images/ --count=3
 *   npx tsx scripts/search-pexels.ts --query="waterfall tropical" --out=... --orientation=landscape --size=large
 *
 * Options:
 *   --query         Search terms
 *   --out           Output directory
 *   --count         Number of images to download (default: 3, max: 10)
 *   --orientation   landscape, portrait, or square (default: landscape)
 *   --size          large, medium, or small (default: large)
 *   --prefix        Filename prefix (default: derived from query)
 */

import { writeFile, mkdir } from "node:fs/promises"
import { join, resolve } from "node:path"
import { config } from "dotenv"

config()

interface PexelsPhoto {
  id: number
  alt: string
  photographer: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    landscape: string
  }
}

interface PexelsResponse {
  photos: PexelsPhoto[]
  total_results: number
}

async function main() {
  const args = process.argv.slice(2)

  const queryArg = args.find((a) => a.startsWith("--query="))
  const outArg = args.find((a) => a.startsWith("--out="))
  const countArg = args.find((a) => a.startsWith("--count="))
  const orientationArg = args.find((a) => a.startsWith("--orientation="))
  const sizeArg = args.find((a) => a.startsWith("--size="))
  const prefixArg = args.find((a) => a.startsWith("--prefix="))

  if (!queryArg || !outArg) {
    console.error('Usage: npx tsx scripts/search-pexels.ts --query="pirate ship" --out=path/to/dir/ [--count=3]')
    process.exit(1)
  }

  const query = queryArg.split("=").slice(1).join("=")
  const outDir = resolve(outArg.split("=").slice(1).join("="))
  const count = Math.min(parseInt(countArg?.split("=")[1] || "3"), 10)
  const orientation = orientationArg?.split("=")[1] || "landscape"
  const size = (sizeArg?.split("=")[1] || "large") as keyof PexelsPhoto["src"]
  const prefix = prefixArg?.split("=")[1] || query.replace(/\s+/g, "-").toLowerCase().slice(0, 30)

  if (!process.env.PEXELS_API_KEY) {
    console.error("PEXELS_API_KEY not set in .env")
    process.exit(1)
  }

  await mkdir(outDir, { recursive: true })

  // Search
  const params = new URLSearchParams({
    query,
    per_page: String(count),
    orientation,
  })

  console.log(`Searching Pexels: "${query}" (${count} images, ${orientation})...`)

  const searchRes = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: process.env.PEXELS_API_KEY },
  })

  if (!searchRes.ok) {
    console.error(`Pexels API error: ${searchRes.status} ${searchRes.statusText}`)
    process.exit(1)
  }

  const data = (await searchRes.json()) as PexelsResponse
  console.log(`Found ${data.total_results} results, downloading ${Math.min(count, data.photos.length)}...`)

  // Download
  const downloaded: string[] = []

  for (let i = 0; i < Math.min(count, data.photos.length); i++) {
    const photo = data.photos[i]
    const url = photo.src[size] || photo.src.large
    const ext = url.includes(".png") ? ".png" : ".jpg"
    const filename = `${prefix}-${i + 1}${ext}`
    const filepath = join(outDir, filename)

    console.log(`  [${i + 1}/${count}] Downloading ${photo.id} by ${photo.photographer}...`)

    const imgRes = await fetch(url)
    if (!imgRes.ok) {
      console.error(`    Failed to download: ${imgRes.status}`)
      continue
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer())
    await writeFile(filepath, buffer)
    downloaded.push(filepath)
    console.log(`    Saved: ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`)
  }

  console.log(`\nDownloaded ${downloaded.length} image(s):`)
  for (const p of downloaded) {
    console.log(`  ${p}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
