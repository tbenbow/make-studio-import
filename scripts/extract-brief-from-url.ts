/**
 * Extract a design brief from a website screenshot.
 *
 * Takes a URL, screenshots it with Playwright, and has Claude analyze
 * the visual design to produce a reusable design brief.
 *
 * Usage:
 *   npx tsx scripts/extract-brief-from-url.ts --url=https://example.com
 *   npx tsx scripts/extract-brief-from-url.ts --url=https://example.com --categories=service-provider,local-business
 *   npx tsx scripts/extract-brief-from-url.ts --urls=urls.txt --out=briefs/
 *
 * urls.txt format (one per line):
 *   https://example.com  service-provider,portfolio
 *   https://another.com  local-business
 */

import Anthropic from "@anthropic-ai/sdk"
import { chromium } from "playwright"
import { config } from "dotenv"
import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { resolve } from "path"

config()

const BRIEF_SYSTEM_PROMPT = `You are an elite web designer analyzing a website screenshot to extract its design DNA into a reusable brief.

Your job: distill the site's visual identity into a brief that could recreate this aesthetic for a DIFFERENT business.

Return a JSON object with:
- aesthetic: 2-3 sentence description of the visual style. Be specific — reference design movements, eras, or visual metaphors. Evocative enough to recreate the vibe without seeing the original.
- fonts: { heading, body, accent? } — recommend Google Fonts that match what you see in the screenshot. Match the CHARACTER of the typography (weight, style, mood), not necessarily the exact font.
- colors: { primary, background, accent?, text? } — hex values for the core palette as seen in the screenshot
- effects: Array of 2-4 CSS effects/techniques visible (e.g., "grain texture overlay", "staggered reveal animations", "glass morphism cards", "diagonal section dividers")
- vibe: Array of 3-5 single-word descriptors (e.g., ["warm", "premium", "editorial", "organic", "refined"])
- suitableFor: Array of business types this aesthetic would work well for

CRITICAL FONT RULES:
- NEVER recommend Inter, Roboto, Arial, Open Sans, Lato, or system fonts. These are banned.
- NEVER recommend Space Grotesk — it's overused in AI output.
- Look at the VISUAL CHARACTER of the typography in the screenshot and find a distinctive Google Font match.
- For clean geometric sans: try Outfit, Plus Jakarta Sans, General Sans, Sora, or Urbanist
- For humanist sans: try Source Sans Pro, Nunito Sans, or DM Sans
- For strong display: try Clash Display, Satoshi, Cabinet Grotesk, or Instrument Sans
- For serif headings: try Fraunces, Playfair Display, Lora, or DM Serif Display
- For monospace accents: try JetBrains Mono, Fira Code, or Space Mono
- Always pair a distinctive heading font with a readable body font

Focus on what's TRANSFERABLE — the font pairing mood, color strategy, spatial composition, and visual techniques. Ignore business-specific content.

Return ONLY valid JSON. No markdown fences.`

async function screenshotUrl(url: string): Promise<Buffer> {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
  await page.waitForTimeout(3000)

  // Capture first ~3 viewport heights — enough to see the design language
  const screenshot = await page.screenshot({
    type: "jpeg",
    quality: 70,
    clip: { x: 0, y: 0, width: 1440, height: 4000 },
  })

  await browser.close()
  return screenshot
}

async function analyzeSite(
  client: Anthropic,
  url: string,
  screenshot: Buffer,
  categories?: string[]
): Promise<any> {
  const userPrompt = `Analyze this website screenshot from ${url}.${categories ? `\nSuggested categories: ${categories.join(", ")}` : ""}

Extract the design brief — focus on the visual aesthetic, typography character, color palette, and design techniques.`

  const chunks: string[] = []
  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: BRIEF_SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: screenshot.toString("base64") },
        },
        { type: "text", text: userPrompt },
      ],
    }],
  })

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      chunks.push(event.delta.text)
    }
  }

  const finalMessage = await stream.finalMessage()
  let text = chunks.join("")
  text = text.replace(/^```json?\n?/m, "").replace(/\n?```$/m, "")

  const brief = JSON.parse(text)
  return {
    ...brief,
    sourceUrl: url,
    extractedAt: new Date().toISOString(),
    tokens: {
      input: finalMessage.usage?.input_tokens || 0,
      output: finalMessage.usage?.output_tokens || 0,
    },
  }
}

function parseArgs() {
  const args = process.argv.slice(2)
  const parsed: Record<string, string> = {}
  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.+)$/)
    if (match) parsed[match[1]] = match[2]
  }
  return parsed
}

async function main() {
  const args = parseArgs()
  const outDir = args.out || "output/briefs"
  mkdirSync(outDir, { recursive: true })

  // Build URL list
  const urls: Array<{ url: string; categories?: string[] }> = []

  if (args.url) {
    urls.push({
      url: args.url,
      categories: args.categories?.split(","),
    })
  } else if (args.urls) {
    const lines = readFileSync(args.urls, "utf-8").split("\n").filter(l => l.trim())
    for (const line of lines) {
      const [url, cats] = line.trim().split(/\s+/)
      urls.push({ url, categories: cats?.split(",") })
    }
  } else {
    console.error("Usage: npx tsx scripts/extract-brief-from-url.ts --url=https://example.com")
    console.error("       npx tsx scripts/extract-brief-from-url.ts --urls=urls.txt")
    process.exit(1)
  }

  const client = new Anthropic()
  const allBriefs: any[] = []

  for (const { url, categories } of urls) {
    const slug = new URL(url).hostname.replace(/\./g, "-")
    console.log(`\n--- ${url} ---`)

    try {
      console.log("  Screenshotting...")
      const screenshot = await screenshotUrl(url)
      writeFileSync(resolve(outDir, `${slug}.jpg`), screenshot)

      console.log("  Analyzing...")
      const brief = await analyzeSite(client, url, screenshot, categories)

      writeFileSync(resolve(outDir, `${slug}.json`), JSON.stringify(brief, null, 2))
      allBriefs.push(brief)

      console.log(`  Aesthetic: ${brief.aesthetic}`)
      console.log(`  Fonts: ${brief.fonts.heading} / ${brief.fonts.body}`)
      console.log(`  Colors: primary=${brief.colors.primary} bg=${brief.colors.background}`)
      console.log(`  Vibe: ${brief.vibe?.join(", ")}`)
      console.log(`  Tokens: ${brief.tokens.input}in / ${brief.tokens.output}out`)
    } catch (err) {
      console.error(`  Failed: ${err instanceof Error ? err.message : err}`)
    }
  }

  // Write combined library
  if (allBriefs.length > 0) {
    writeFileSync(resolve(outDir, "_library.json"), JSON.stringify(allBriefs, null, 2))
    console.log(`\n=== Done: ${allBriefs.length} briefs saved to ${outDir}/ ===`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
