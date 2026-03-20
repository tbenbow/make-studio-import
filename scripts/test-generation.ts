/**
 * Test direct site generation via Claude API.
 *
 * Simulates wizard intake → Claude generates sectioned Tailwind HTML.
 * Outputs self-contained HTML files for visual review.
 *
 * Usage:
 *   npx tsx scripts/test-generation.ts --business="Coastal Coffee" --what="specialty coffee roastery and cafe" --who="coffee enthusiasts and remote workers" --cta="Order Beans"
 *   npx tsx scripts/test-generation.ts --business="Luna Pilates" --what="reformer pilates studio" --who="women 25-45 looking for low-impact fitness" --cta="Book a Class"
 *   npx tsx scripts/test-generation.ts --business="Apex Consulting" --what="management consulting for tech startups" --who="seed to series B founders" --cta="Get Started"
 */

import Anthropic from "@anthropic-ai/sdk"
import { config } from "dotenv"
import { writeFileSync, mkdirSync } from "fs"
import { resolve } from "path"

config()

const DESIGN_PROMPT = `You create distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics.

## Design Thinking

Before coding, commit to a BOLD aesthetic direction:
- **Tone**: Pick an extreme: brutally minimal, maximalist, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian. Use these for inspiration but design one that is true to the business.
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

## Aesthetic Guidelines

- **Typography**: Choose fonts that are beautiful, unique, and interesting. NEVER use Inter, Roboto, Arial, or system fonts. Pair a distinctive display font with a refined body font. Use Google Fonts only.
- **Color & Theme**: Commit to a cohesive aesthetic. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use CSS animations for high-impact moments — one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Grid-breaking elements. Generous negative space OR controlled density.
- **Visual Details**: Create atmosphere and depth. Gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, grain overlays.

NEVER use generic AI aesthetics: overused fonts, purple gradients on white, predictable layouts, cookie-cutter design. Every generation should feel different. Vary themes, fonts, aesthetics.

Match complexity to vision — maximalist designs need elaborate code; minimal designs need restraint and precision.

## Output Format

Generate a single self-contained HTML file with these rules:

- Tailwind CDN via \`<script src="https://cdn.tailwindcss.com"></script>\`
- Google Fonts via \`<link>\` tags
- Tailwind config overrides in a \`<script>\` block for custom colors/fonts
- Every section gets a descriptive \`id\` attribute (kebab-case)
- Structure: \`<nav id="navbar">\`, \`<section id="hero">\`, \`<section id="features">\`, etc., \`<footer id="footer">\`
- Real, realistic content — NEVER lorem ipsum
- Responsive: mobile-first with sm:, md:, lg: breakpoints
- Images: use \`https://placehold.co/WxH\` with appropriate dimensions
- No JS frameworks — CSS animations only, plus Alpine.js for interactive elements if needed
- The HTML must be complete and renderable by opening the file in a browser`

interface Intake {
  businessName: string
  whatYouDo: string
  whoItsFor: string
  cta: string
  differentiator?: string
  vibe?: string
}

function buildUserPrompt(intake: Intake): string {
  return `Create a homepage for this business:

**Business**: ${intake.businessName}
**What they do**: ${intake.whatYouDo}
**Target audience**: ${intake.whoItsFor}
**Primary CTA**: ${intake.cta}${intake.differentiator ? `\n**What makes them different**: ${intake.differentiator}` : ""}${intake.vibe ? `\n\n**AESTHETIC DIRECTION — follow this closely**: ${intake.vibe}` : ""}

Generate a complete, visually striking homepage with these sections:
1. **Navbar** — Logo/name + navigation links + CTA button
2. **Hero** — Bold headline, supporting text, CTA, compelling visual element
3. **Features/Services** — 3-4 key offerings or features
4. **Social Proof** — Testimonials, stats, or trust indicators
5. **CTA** — Final conversion section
6. **Footer** — Links, contact info, copyright

The design MUST reflect the business personality. Read the brief carefully — if the brand is weird, the site should be weird. If the brand is extreme, the site should be extreme. Don't sanitize the personality into something generic.

Return ONLY the HTML — no explanation, no markdown fences.`
}

async function generate(intake: Intake): Promise<string> {
  const client = new Anthropic()

  const chunks: string[] = []
  const stream = await client.messages.stream({
    model: "claude-opus-4-20250514",
    max_tokens: 16000,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(intake),
      },
    ],
    system: DESIGN_PROMPT,
  })

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      chunks.push(event.delta.text)
      process.stdout.write(".")
    }
  }
  console.log()

  const text = chunks.join("")
  // Strip markdown fences if present
  return text.replace(/^```html?\n?/m, "").replace(/\n?```$/m, "")
}

function parseArgs(): Intake {
  const args = process.argv.slice(2)
  const parsed: Record<string, string> = {}

  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.+)$/)
    if (match) {
      parsed[match[1]] = match[2]
    }
  }

  if (!parsed.business || !parsed.what || !parsed.who || !parsed.cta) {
    console.error(
      "Usage: npx tsx scripts/test-generation.ts --business=Name --what=Description --who=Audience --cta=Action"
    )
    process.exit(1)
  }

  return {
    businessName: parsed.business,
    whatYouDo: parsed.what,
    whoItsFor: parsed.who,
    cta: parsed.cta,
    differentiator: parsed.diff,
    vibe: parsed.vibe,
  }
}

async function main() {
  const intake = parseArgs()
  const slug = intake.businessName.toLowerCase().replace(/\s+/g, "-")
  const outDir = resolve("output", slug)
  mkdirSync(outDir, { recursive: true })

  console.log(`\nGenerating homepage for ${intake.businessName}...`)
  console.log(`  What: ${intake.whatYouDo}`)
  console.log(`  Who: ${intake.whoItsFor}`)
  console.log(`  CTA: ${intake.cta}`)
  if (intake.differentiator) console.log(`  Diff: ${intake.differentiator}`)
  console.log()

  const html = await generate(intake)

  const outPath = resolve(outDir, "index.html")
  writeFileSync(outPath, html)
  console.log(`Written to ${outPath}`)
  console.log(`Open in browser: file://${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
