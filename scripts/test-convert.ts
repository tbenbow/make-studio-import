/**
 * Phase 2: Test HTML → Make Studio block conversion via Claude API.
 *
 * Takes a generated HTML file, splits it into sections, extracts theme data,
 * and converts each section to a Handlebars template + field definitions.
 *
 * Usage:
 *   npx tsx scripts/test-convert.ts --html=output/pwned-wood/index.html
 *   npx tsx scripts/test-convert.ts --html=output/coastal-coffee/index.html --out=output/coastal-coffee/converted
 */

import Anthropic from "@anthropic-ai/sdk"
import { config } from "dotenv"
import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"

config()

// --- HTML Parsing ---

interface ParsedSection {
  id: string
  name: string
  tag: string
  html: string
}

interface ExtractedTheme {
  fonts: string[]
  fontLinks: string[]
  tailwindConfig: string | null
  colors: Record<string, string>
}

function extractTheme(html: string): ExtractedTheme {
  // Extract Google Font links
  const fontLinks: string[] = []
  const fontLinkRegex =
    /href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/g
  let match
  while ((match = fontLinkRegex.exec(html)) !== null) {
    fontLinks.push(match[1])
  }

  // Extract font family names from the links
  const fonts: string[] = []
  for (const link of fontLinks) {
    const familyMatch = link.match(/family=([^:&]+)/g)
    if (familyMatch) {
      for (const f of familyMatch) {
        fonts.push(f.replace("family=", "").replace(/\+/g, " "))
      }
    }
  }

  // Extract Tailwind config block
  let tailwindConfig: string | null = null
  const configMatch = html.match(
    /tailwind\.config\s*=\s*(\{[\s\S]*?\})\s*<\/script>/
  )
  if (configMatch) {
    tailwindConfig = configMatch[1]
  }

  // Extract color hex values from Tailwind config
  const colors: Record<string, string> = {}
  if (tailwindConfig) {
    const colorRegex = /'([^']+)':\s*'(#[0-9a-fA-F]{3,8})'/g
    while ((match = colorRegex.exec(tailwindConfig)) !== null) {
      colors[match[1]] = match[2]
    }
  }

  return { fonts, fontLinks, tailwindConfig, colors }
}

function splitSections(html: string): ParsedSection[] {
  const sections: ParsedSection[] = []

  // Extract <head> content for context (styles, config)
  const headMatch = html.match(/<head>([\s\S]*?)<\/head>/)
  const headContent = headMatch ? headMatch[1] : ""

  // Match nav, section, footer, header elements with id attributes
  const sectionRegex =
    /<(nav|section|footer|header)\s+[^>]*id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/\1>/gi
  let match

  while ((match = sectionRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase()
    const id = match[2]
    const fullHtml = match[0]

    // Convert id to PascalCase block name
    const name = id
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("")

    sections.push({ id, name, tag, html: fullHtml })
  }

  // Fallback: try without id attributes
  if (sections.length === 0) {
    const fallbackRegex =
      /<(nav|section|footer|header)[^>]*>([\s\S]*?)<\/\1>/gi
    let idx = 0
    while ((match = fallbackRegex.exec(html)) !== null) {
      const tag = match[1].toLowerCase()
      const name =
        tag === "nav"
          ? "Navbar"
          : tag === "footer"
            ? "Footer"
            : `Section${++idx}`
      sections.push({ id: name.toLowerCase(), name, tag, html: match[0] })
    }
  }

  return sections
}

// --- Conversion Prompt ---

const CONVERT_SYSTEM_PROMPT = `You convert Tailwind HTML sections into Make Studio block format. You return JSON only.

## Output Format

Return a JSON object with:
- "template": Handlebars HTML template string
- "fields": array of field definitions

## Field Types

| Type | Template | Default Format |
|------|----------|----------------|
| text | {{field-name}} | "string" |
| textarea | {{field-name}} | "string" |
| wysiwyg | {{{field-name}}} | "<p>html</p>" |
| image | {{field-name}} | "url" |
| items | {{#each field-name}} | [{...}] |
| group | {{field-name.sub-field}} | {...} |

## Rules

1. **Variable names**: kebab-case only. "Hero Title" → {{hero-title}}. NEVER underscores.
2. **Buttons**: Replace button HTML with {{> Button label=button-label link=button-link style="primary" size="md"}}. For multiple buttons, use an items field named "Buttons".
3. **Repeating elements**: Convert to {{#each items}}...{{/each}}. Items need config.fields array with sub-field definitions.
4. **Images**: Just {{field-name}}, NOT {{image field-name}}.
5. **Every field needs a default value** with realistic content from the source HTML.
6. **Items need a default array** with entries from the source. Each entry needs an "id" field (use "1", "2", "3").
7. **First sub-field in items must be text type** (it's used as the CMS list label).
8. **Strip CSS animations/JS** from the template — only keep structural Tailwind classes.
9. **Keep all Tailwind utility classes** — do NOT replace with semantic tokens (the theme system handles that later).
10. **Preserve the layout exactly** — same grid structure, spacing, responsive breakpoints.

## Field Definition Format

\`\`\`json
{
  "type": "text",
  "name": "Headline",
  "default": "The actual headline text from the source"
}
\`\`\`

Items example:
\`\`\`json
{
  "type": "items",
  "name": "Features",
  "default": [
    { "id": "1", "title": "Feature One", "description": "Description here" }
  ],
  "config": {
    "fields": [
      { "type": "text", "name": "Title" },
      { "type": "textarea", "name": "Description" }
    ]
  }
}
\`\`\`

Return ONLY valid JSON. No markdown fences. No explanation.`

function buildConvertPrompt(section: ParsedSection): string {
  return `Convert this HTML section into a Make Studio block named "${section.name}".

<html>
${section.html}
</html>

Extract all editable content into fields. Preserve the layout and Tailwind classes exactly.`
}

// --- Conversion ---

async function convertSection(
  client: Anthropic,
  section: ParsedSection
): Promise<{ template: string; fields: any[] }> {
  const chunks: string[] = []
  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: buildConvertPrompt(section),
      },
    ],
    system: CONVERT_SYSTEM_PROMPT,
  })

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      chunks.push(event.delta.text)
    }
  }

  let text = chunks.join("")
  // Strip markdown fences if present
  text = text.replace(/^```json?\n?/m, "").replace(/\n?```$/m, "")

  try {
    return JSON.parse(text)
  } catch (e) {
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error(`Failed to parse conversion output for ${section.name}: ${text.slice(0, 200)}`)
  }
}

// --- Main ---

function parseArgs(): { html: string; out: string } {
  const args = process.argv.slice(2)
  const parsed: Record<string, string> = {}

  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.+)$/)
    if (match) {
      parsed[match[1]] = match[2]
    }
  }

  if (!parsed.html) {
    console.error("Usage: npx tsx scripts/test-convert.ts --html=path/to/index.html [--out=output/dir]")
    process.exit(1)
  }

  const out = parsed.out || resolve(dirname(parsed.html), "converted")
  return { html: parsed.html, out }
}

async function main() {
  const { html: htmlPath, out: outDir } = parseArgs()
  const html = readFileSync(resolve(htmlPath), "utf-8")

  // Extract theme
  console.log("Extracting theme...")
  const theme = extractTheme(html)
  console.log(`  Fonts: ${theme.fonts.join(", ")}`)
  console.log(`  Colors: ${Object.keys(theme.colors).length} found`)

  // Split sections
  console.log("\nSplitting sections...")
  const sections = splitSections(html)
  console.log(`  Found ${sections.length} sections:`)
  for (const s of sections) {
    console.log(`    - ${s.name} (${s.tag}#${s.id}) [${s.html.length} chars]`)
  }

  if (sections.length === 0) {
    console.error("No sections found in HTML!")
    process.exit(1)
  }

  // Convert each section
  const client = new Anthropic()
  mkdirSync(resolve(outDir, "blocks"), { recursive: true })

  const results: { name: string; template: string; fields: any[] }[] = []

  for (const section of sections) {
    process.stdout.write(`\nConverting ${section.name}...`)
    try {
      const result = await convertSection(client, section)
      results.push({ name: section.name, ...result })

      // Write template
      writeFileSync(
        resolve(outDir, "blocks", `${section.name}.html`),
        result.template
      )

      // Write fields
      writeFileSync(
        resolve(outDir, "blocks", `${section.name}.json`),
        JSON.stringify(
          { makeStudioFields: true, version: 1, fields: result.fields },
          null,
          2
        )
      )

      process.stdout.write(` ✓ (${result.fields.length} fields)\n`)
    } catch (e: any) {
      process.stdout.write(` ✗ ${e.message}\n`)
    }
  }

  // Write theme summary
  writeFileSync(
    resolve(outDir, "theme-extract.json"),
    JSON.stringify(theme, null, 2)
  )

  // Summary
  console.log(`\n--- Summary ---`)
  console.log(`Sections: ${sections.length}`)
  console.log(`Converted: ${results.length}`)
  console.log(`Output: ${outDir}`)
  console.log(`\nFiles:`)
  console.log(`  ${outDir}/theme-extract.json`)
  for (const r of results) {
    console.log(`  ${outDir}/blocks/${r.name}.html (${r.fields.length} fields)`)
    console.log(`  ${outDir}/blocks/${r.name}.json`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
