/**
 * Screenshot all HTML variations in a theme's source/ directory.
 *
 * Usage: npm run preview-generations -- --theme=<name>
 *
 * Starts a local HTTP server, uses Playwright to capture full-page
 * screenshots of each .html file, saves .png alongside the HTML.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { readFile, readdir, stat } from "node:fs/promises"
import { join, extname, resolve } from "node:path"
import { chromium } from "playwright"

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
}

async function main() {
  // Args
  const args = process.argv.slice(2)
  const themeArg = args.find((a) => a.startsWith("--theme="))
  if (!themeArg) {
    console.error("Usage: npm run preview-generations -- --theme=<name>")
    process.exit(1)
  }
  const themeName = themeArg.split("=")[1]
  const sourceDir = resolve(`themes/${themeName}/source`)

  // Verify source directory exists
  try {
    const s = await stat(sourceDir)
    if (!s.isDirectory()) throw new Error()
  } catch {
    console.error(`Source directory not found: ${sourceDir}`)
    process.exit(1)
  }

  // Collect HTML files
  const files = (await readdir(sourceDir)).filter((f) => f.endsWith(".html")).sort()

  if (files.length === 0) {
    console.error(`No .html files found in ${sourceDir}`)
    process.exit(1)
  }

  console.log(`Found ${files.length} HTML file(s) in ${sourceDir}`)

  // Static file server
  function serveStatic(req: IncomingMessage, res: ServerResponse) {
    const url = req.url === "/" ? "/index.html" : req.url || "/"
    const filePath = join(sourceDir, decodeURIComponent(url))

    readFile(filePath)
      .then((data) => {
        const ext = extname(filePath)
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" })
        res.end(data)
      })
      .catch(() => {
        res.writeHead(404)
        res.end("Not found")
      })
  }

  const server = createServer(serveStatic)

  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r))
  const port = (server.address() as { port: number }).port
  console.log(`Server running on http://127.0.0.1:${port}`)

  // Screenshots
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })

  const screenshotPaths: string[] = []

  for (const file of files) {
    const page = await context.newPage()
    const url = `http://127.0.0.1:${port}/${encodeURIComponent(file)}`
    console.log(`Screenshotting ${file}...`)

    await page.goto(url, { waitUntil: "networkidle" })

    const pngPath = join(sourceDir, file.replace(/\.html$/, ".png"))
    await page.screenshot({ path: pngPath, fullPage: true })
    screenshotPaths.push(pngPath)

    await page.close()
  }

  // Cleanup
  await browser.close()
  server.close()

  console.log(`\nScreenshots saved:`)
  for (const p of screenshotPaths) {
    console.log(`  ${p}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
