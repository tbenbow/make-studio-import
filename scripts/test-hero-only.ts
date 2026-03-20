/**
 * Experiment: Generate ONLY a hero section via Claude API.
 * Measures how fast we can go from intake → single block HTML.
 *
 * Usage:
 *   npx tsx scripts/test-hero-only.ts --business="Octowash" --what="octopus-themed express car wash" --who="busy professionals"
 */

import Anthropic from "@anthropic-ai/sdk"
import { config } from "dotenv"
import { writeFileSync, mkdirSync } from "fs"
import { resolve } from "path"

config()

const DESIGN_BRIEF_PROMPT = `You are an elite web designer creating a design brief. Given business context, produce a specific aesthetic direction.

Return a JSON object with:
- aesthetic: 2-3 sentence visual direction
- fonts: { heading, body } — Google Font names. NEVER Inter, Roboto, Arial.
- colors: { primary, background, accent, text } — hex values
- heroConept: One sentence describing the hero section's creative approach

Return ONLY valid JSON. No markdown fences.`

const HERO_PROMPT = `You create distinctive, production-grade hero sections. Avoid generic AI aesthetics.

Generate a SINGLE self-contained HTML file with ONLY:
1. A <head> with Tailwind CDN, Google Fonts, and Tailwind config for custom colors/fonts
2. A <section id="hero"> — the hero block

Rules:
- Tailwind CDN via <script src="https://cdn.tailwindcss.com"></script>
- Google Fonts via <link> tags
- Keep it concise — aim for 2-4KB total
- Real content, not lorem ipsum
- Responsive: mobile-first with sm:, md:, lg: breakpoints
- Images: use https://placehold.co/WxH
- Include 1-2 buttons

Return ONLY the HTML. No explanation, no markdown fences.`

interface Intake {
  businessName: string
  whatYouDo: string
  whoItsFor: string
  cta?: string
}

async function main() {
  const args = process.argv.slice(2)
  const parsed: Record<string, string> = {}
  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.+)$/)
    if (match) parsed[match[1]] = match[2]
  }

  if (!parsed.business || !parsed.what || !parsed.who) {
    console.error("Usage: npx tsx scripts/test-hero-only.ts --business=Name --what=Description --who=Audience")
    process.exit(1)
  }

  const intake: Intake = {
    businessName: parsed.business,
    whatYouDo: parsed.what,
    whoItsFor: parsed.who,
    cta: parsed.cta,
  }

  const client = new Anthropic()
  const totalStart = Date.now()

  // Step 1: Design brief
  console.log("\n--- Step 1: Design Brief ---")
  const briefStart = Date.now()

  const briefChunks: string[] = []
  const briefStream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: DESIGN_BRIEF_PROMPT,
    messages: [{
      role: "user",
      content: `Business: ${intake.businessName}\nWhat: ${intake.whatYouDo}\nAudience: ${intake.whoItsFor}\nCTA: ${intake.cta || "Get started"}`,
    }],
  })

  for await (const event of briefStream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      briefChunks.push(event.delta.text)
    }
  }

  const briefMsg = await briefStream.finalMessage()
  const briefTime = Date.now() - briefStart
  const briefText = briefChunks.join("").replace(/^```json?\n?/m, "").replace(/\n?```$/m, "")
  const brief = JSON.parse(briefText)

  console.log(`  Time: ${briefTime}ms`)
  console.log(`  Tokens: ${briefMsg.usage.input_tokens}in / ${briefMsg.usage.output_tokens}out`)
  console.log(`  Aesthetic: ${brief.aesthetic}`)
  console.log(`  Fonts: ${brief.fonts.heading} / ${brief.fonts.body}`)
  console.log(`  Colors: ${JSON.stringify(brief.colors)}`)

  // Step 2: Generate hero HTML
  console.log("\n--- Step 2: Hero HTML ---")
  const heroStart = Date.now()

  const heroChunks: string[] = []
  const heroStream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: HERO_PROMPT,
    messages: [{
      role: "user",
      content: `Build a hero section for:

**${intake.businessName}** — ${intake.whatYouDo}
**Audience**: ${intake.whoItsFor}
**CTA**: ${intake.cta || "Get started"}

**Aesthetic**: ${brief.aesthetic}
**Fonts**: Heading: ${brief.fonts.heading}, Body: ${brief.fonts.body}
**Colors**: Primary: ${brief.colors.primary}, Background: ${brief.colors.background}, Accent: ${brief.colors.accent}
**Hero concept**: ${brief.heroConcept || "Bold, striking, memorable"}`,
    }],
  })

  // Track first token time
  let firstTokenTime: number | null = null
  for await (const event of heroStream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      if (!firstTokenTime) {
        firstTokenTime = Date.now() - heroStart
      }
      heroChunks.push(event.delta.text)
    }
  }

  const heroMsg = await heroStream.finalMessage()
  const heroTime = Date.now() - heroStart

  let heroHtml = heroChunks.join("")
  heroHtml = heroHtml.replace(/^```html?\n?/m, "").replace(/\n?```$/m, "")

  console.log(`  Time to first token: ${firstTokenTime}ms`)
  console.log(`  Total time: ${heroTime}ms`)
  console.log(`  Tokens: ${heroMsg.usage.input_tokens}in / ${heroMsg.usage.output_tokens}out`)
  console.log(`  HTML size: ${heroHtml.length} chars`)

  // Write output
  const outDir = resolve("output", "hero-experiment")
  mkdirSync(outDir, { recursive: true })
  writeFileSync(resolve(outDir, "brief.json"), JSON.stringify(brief, null, 2))
  writeFileSync(resolve(outDir, "hero.html"), heroHtml)

  // Summary
  const totalTime = Date.now() - totalStart
  const totalIn = briefMsg.usage.input_tokens + heroMsg.usage.input_tokens
  const totalOut = briefMsg.usage.output_tokens + heroMsg.usage.output_tokens

  console.log("\n--- Summary ---")
  console.log(`  Total time: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`)
  console.log(`  Total tokens: ${totalIn}in / ${totalOut}out (${totalIn + totalOut} total)`)
  console.log(`  Output: ${outDir}/hero.html`)
  console.log(`  Open: file://${resolve(outDir, "hero.html")}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
