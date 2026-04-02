/**
 * Test the HTML import endpoint.
 *
 * Usage:
 *   npx tsx scripts/test-import-html.ts --html=output/pwned-wood/index.html
 *   npx tsx scripts/test-import-html.ts --html=output/coastal-coffee/index.html --name="Coastal Coffee"
 */

import { config } from "dotenv"
import { readFileSync } from "fs"
import { resolve } from "path"

config()

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

  if (!args.html) {
    console.error("Usage: npx tsx scripts/test-import-html.ts --html=path/to/index.html [--name=SiteName]")
    process.exit(1)
  }

  const html = readFileSync(resolve(args.html), "utf-8")
  const siteId = args.site || process.env.MAKE_STUDIO_SITE
  const token = process.env.MAKE_STUDIO_TOKEN
  const baseUrl = process.env.MAKE_STUDIO_URL || "http://localhost:5001"

  if (!siteId || !token) {
    console.error("Set MAKE_STUDIO_SITE and MAKE_STUDIO_TOKEN in .env")
    process.exit(1)
  }

  console.log(`Importing ${args.html} (${(html.length / 1024).toFixed(1)}KB) to site ${siteId}`)
  console.log(`Endpoint: ${baseUrl}/page-generation/sites/${siteId}/import-html`)
  console.log()

  const start = Date.now()

  const response = await fetch(
    `${baseUrl}/page-generation/sites/${siteId}/import-html`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        html,
        siteName: args.name,
      }),
    }
  )

  if (!response.ok && !response.headers.get("content-type")?.includes("ndjson")) {
    const text = await response.text()
    console.error(`Error ${response.status}: ${text}`)
    process.exit(1)
  }

  // Read NDJSON stream
  const reader = response.body?.getReader()
  if (!reader) {
    console.error("No response stream")
    process.exit(1)
  }

  const decoder = new TextDecoder()
  let buffer = ""
  let done = false

  while (!done) {
    const { done: streamDone, value } = await reader.read()
    if (streamDone) {
      done = true
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const event = JSON.parse(line)
        const elapsed = ((Date.now() - start) / 1000).toFixed(1)
        if (event.type === "progress") {
          const level = event.level === "success" ? "✓" : event.level === "warning" ? "⚠" : "→"
          console.log(`  [${elapsed}s] ${level} ${event.message}`)
        } else if (event.type === "result") {
          console.log(`  [${elapsed}s] ✓ Done! pageId=${event.pageId}`)
        } else if (event.type === "error") {
          console.log(`  [${elapsed}s] ✗ ${event.message}`)
        }
      } catch {
        // skip unparseable lines
      }
    }
  }

  const total = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`\nTotal: ${total}s`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
