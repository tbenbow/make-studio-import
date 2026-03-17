/**
 * Generate app/brand names with available domains.
 *
 * Usage:
 *   npx tsx scripts/name-app.ts --prompt="woodsy sounding feminine name"
 *   npx tsx scripts/name-app.ts --prompt="short punchy SaaS name" --tlds=com,io,co --count=20
 *   npx tsx scripts/name-app.ts --name="Base Studio" --tlds=com,co,io,app,dev --count=30
 *
 * Options:
 *   --prompt    Describe the vibe/style of name you want (generates new names)
 *   --name      Find creative domains for an existing name
 *   --count     Number of domain ideas to generate (default: 20)
 *   --tlds      Comma-separated TLDs to check (default: com,co,io,app,dev)
 */

import Anthropic from "@anthropic-ai/sdk"
import { config } from "dotenv"
import chalk from "chalk"
import ora from "ora"

config()

interface DomainStatus {
  domain: string
  zone: string
  status: string
  tags?: string
}

async function checkDomain(domain: string): Promise<boolean> {
  const token = process.env.FASTLY_API_TOKEN
  const res = await fetch(
    `https://api.fastly.com/domain-management/v1/tools/status?domain=${domain}`,
    { headers: { "Fastly-Key": token! } }
  )
  if (!res.ok) {
    console.error(`Fastly API error for ${domain}: ${res.status}`)
    return false
  }
  const data = (await res.json()) as DomainStatus
  // "inactive" in the status means available for registration
  return data.status.includes("inactive")
}

async function generateNames(
  prompt: string,
  count: number
): Promise<string[]> {
  const client = new Anthropic()

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate exactly ${count} brand/app name ideas based on this description: "${prompt}"

Rules:
- Names should work as domain names (single word or two short words, no spaces)
- Keep them short (ideally under 12 characters)
- Be creative — don't just combine obvious words
- No hyphens or numbers
- Output ONLY the names, one per line, nothing else. No numbering, no explanations.`,
      },
    ],
  })

  const text =
    response.content[0].type === "text" ? response.content[0].text : ""
  return text
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line && !line.includes(" ") && !line.includes("."))
}

async function generateDomainIdeas(
  name: string,
  count: number
): Promise<string[]> {
  const client = new Anthropic()

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `I have an app called "${name}". Generate exactly ${count} creative domain name ideas for it.

Think creatively:
- Combine the words: basestudio, studiobase
- Abbreviations: basestd, bstudio
- Prefixes/suffixes: getbasestudio, basestudiohq, usebasestudio, trybasestudio
- Word play, portmanteaus, or phonetic twists on the name
- Drop vowels: bsstudio, bsdio
- Acronyms or initials mixed with words
- Short memorable variations that still evoke the brand

Rules:
- Each idea should be a single string with no spaces (the domain name without the TLD)
- Keep them short when possible
- Be creative and diverse in your approaches
- Output ONLY the domain names, one per line, nothing else. No numbering, no explanations.`,
      },
    ],
  })

  const text =
    response.content[0].type === "text" ? response.content[0].text : ""
  return text
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line && !line.includes(" ") && !line.includes("."))
}

async function main() {
  const args = process.argv.slice(2)

  const promptArg = args.find((a) => a.startsWith("--prompt="))
  const nameArg = args.find((a) => a.startsWith("--name="))
  const countArg = args.find((a) => a.startsWith("--count="))
  const tldsArg = args.find((a) => a.startsWith("--tlds="))

  if (!promptArg && !nameArg) {
    console.error(
      'Usage:\n  npx tsx scripts/name-app.ts --prompt="woodsy feminine name"\n  npx tsx scripts/name-app.ts --name="Base Studio"'
    )
    process.exit(1)
  }

  const count = parseInt(countArg?.split("=")[1] || "30")
  const tlds = (tldsArg?.split("=")[1] || "com,co,io,app,dev").split(",")

  let names: string[]

  if (nameArg) {
    const name = nameArg.split("=").slice(1).join("=")
    const spinner = ora(`Generating domain ideas for "${name}"...`).start()
    names = await generateDomainIdeas(name, count)
    // Deduplicate
    names = [...new Set(names)]
    spinner.succeed(`Generated ${names.length} domain ideas`)
  } else {
    const prompt = promptArg!.split("=").slice(1).join("=")
    const spinner = ora("Generating name ideas...").start()
    names = await generateNames(prompt, count)
    spinner.succeed(`Generated ${names.length} name ideas`)
  }

  console.log(
    chalk.dim(`\nChecking domains across: ${tlds.map((t) => `.${t}`).join(", ")}\n`)
  )

  if (!process.env.FASTLY_API_TOKEN) {
    console.error("FASTLY_API_TOKEN not set in .env")
    process.exit(1)
  }

  // Step 2: Check domains via Domainr API
  const checkSpinner = ora("Checking domain availability...").start()
  const results: { name: string; available: string[] }[] = []

  // Build all domain checks
  const allChecks = names.map((name) => ({
    name,
    domains: tlds.map((tld) => `${name}.${tld}`),
  }))

  // Run in batches of 10 to be respectful of rate limits
  for (let i = 0; i < allChecks.length; i += 10) {
    const batch = allChecks.slice(i, i + 10)
    const batchResults = await Promise.all(
      batch.map(async ({ name, domains }) => {
        const tldResults = await Promise.all(
          domains.map(async (domain) => {
            const available = await checkDomain(domain)
            return { domain, available }
          })
        )
        const available = tldResults
          .filter((r) => r.available)
          .map((r) => r.domain)
        return { name, available }
      })
    )
    results.push(...batchResults)
    checkSpinner.text = `Checking domain availability... (${Math.min(i + 10, names.length)}/${names.length})`
  }

  checkSpinner.succeed("Domain checks complete")

  // Step 3: Display results
  const withDomains = results.filter((r) => r.available.length > 0)

  if (withDomains.length === 0) {
    console.log(chalk.yellow("\nNo names found with available domains. Try a different prompt or more names."))
    return
  }

  console.log(
    chalk.bold(`\n✨ ${withDomains.length} names with available domains:\n`)
  )

  for (const { name, available } of withDomains) {
    const domains = available.map((d) => chalk.green(d)).join("  ")
    console.log(`  ${chalk.bold(name)}  →  ${domains}`)
  }

  console.log()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
