/**
 * Generate an image using OpenAI's gpt-image-1 model.
 *
 * Usage:
 *   npx tsx scripts/generate-image.ts --prompt="A pirate fortress at sunset" --out=themes/pirate-golf/source/images/hero.png
 *   npx tsx scripts/generate-image.ts --prompt="..." --out=... --size=landscape --quality=high
 *
 * Options:
 *   --prompt    Image description
 *   --out       Output file path (.png)
 *   --size      square (1024x1024), landscape (1536x1024), portrait (1024x1536) — default: landscape
 *   --quality   low, medium, high — default: high
 */

import OpenAI from "openai"
import { writeFile, mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { config } from "dotenv"

config()

const SIZES: Record<string, "1024x1024" | "1536x1024" | "1024x1536"> = {
  square: "1024x1024",
  landscape: "1536x1024",
  portrait: "1024x1536",
}

async function main() {
  const args = process.argv.slice(2)

  const promptArg = args.find((a) => a.startsWith("--prompt="))
  const outArg = args.find((a) => a.startsWith("--out="))
  const sizeArg = args.find((a) => a.startsWith("--size="))
  const qualityArg = args.find((a) => a.startsWith("--quality="))

  if (!promptArg || !outArg) {
    console.error('Usage: npx tsx scripts/generate-image.ts --prompt="..." --out=path/to/image.png [--size=landscape] [--quality=high]')
    process.exit(1)
  }

  const prompt = promptArg.split("=").slice(1).join("=")
  const outPath = resolve(outArg.split("=").slice(1).join("="))
  const sizeName = sizeArg ? sizeArg.split("=")[1] : "landscape"
  const quality = (qualityArg?.split("=")[1] || "high") as "low" | "medium" | "high"
  const size = SIZES[sizeName]

  if (!size) {
    console.error(`Unknown size "${sizeName}". Options: ${Object.keys(SIZES).join(", ")}`)
    process.exit(1)
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set in .env")
    process.exit(1)
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  console.log(`Generating image (${sizeName}: ${size}, quality: ${quality})...`)
  console.log(`Prompt: ${prompt}`)

  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size,
    quality,
  })

  const imageData = response.data?.[0]
  if (!imageData) {
    console.error("No image data in response")
    process.exit(1)
  }

  await mkdir(dirname(outPath), { recursive: true })

  if (imageData.b64_json) {
    const buffer = Buffer.from(imageData.b64_json, "base64")
    await writeFile(outPath, buffer)
    console.log(`Saved: ${outPath} (${(buffer.length / 1024).toFixed(0)} KB)`)
  } else if (imageData.url) {
    console.log(`Downloading from URL...`)
    const res = await fetch(imageData.url)
    if (!res.ok) {
      console.error(`Failed to download: ${res.status}`)
      process.exit(1)
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    await writeFile(outPath, buffer)
    console.log(`Saved: ${outPath} (${(buffer.length / 1024).toFixed(0)} KB)`)
  } else {
    console.error("No image data (b64_json or url) in response")
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
