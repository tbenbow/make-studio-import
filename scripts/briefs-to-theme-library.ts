/**
 * Convert extracted design briefs into Make Studio theme library entries.
 *
 * Reads briefs from a directory or _library.json, builds deterministic themes,
 * and either:
 *   - Outputs an updated themeLibrary.json
 *   - Applies a specific brief to a site via the API
 *
 * Usage:
 *   npx tsx scripts/briefs-to-theme-library.ts --briefs=output/briefs --out=output/themeLibrary.json
 *   npx tsx scripts/briefs-to-theme-library.ts --brief=output/briefs/stripe-com.json --apply --site=SITE_ID
 */

import { config } from "dotenv"
import { readFileSync, writeFileSync, readdirSync } from "fs"
import { resolve } from "path"

config()

// --- Deterministic theme builder (same logic as make-studio/server/services/directGeneration/themeBuilder.ts) ---

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "")
  if (clean.length !== 6) return null
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return "#" + [clamp(r), clamp(g), clamp(b)].map(v => v.toString(16).padStart(2, "0")).join("")
}

function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex)
  if (!rgb) return true
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 > 128
}

function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return rgbToHex(rgb.r * (1 - amount), rgb.g * (1 - amount), rgb.b * (1 - amount))
}

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return rgbToHex(rgb.r + (255 - rgb.r) * amount, rgb.g + (255 - rgb.g) * amount, rgb.b + (255 - rgb.b) * amount)
}

function mixColor(hex1: string, hex2: string, weight: number): string {
  const c1 = hexToRgb(hex1)
  const c2 = hexToRgb(hex2)
  if (!c1 || !c2) return hex1
  return rgbToHex(c1.r * (1 - weight) + c2.r * weight, c1.g * (1 - weight) + c2.g * weight, c1.b * (1 - weight) + c2.b * weight)
}

function generateShades(hex: string): string[] {
  return [darken(hex, 0.4), darken(hex, 0.2), hex, lighten(hex, 0.3), lighten(hex, 0.6)]
}

function buildTheme(brief: any) {
  const headingFont = brief.fonts.heading
  const bodyFont = brief.fonts.body
  const primary = brief.colors.primary
  const background = brief.colors.background || "#ffffff"
  const accent = brief.colors.accent || primary
  const textColor = brief.colors.text || "#111111"

  const isDarkBg = !isLightColor(background)
  const baseMuted = isDarkBg ? lighten(background, 0.05) : darken(background, 0.03)
  const baseAlt = isDarkBg ? lighten(background, 0.1) : darken(background, 0.06)
  const panel = isDarkBg ? lighten(background, 0.08) : "#ffffff"
  const fgMuted = isDarkBg ? "rgba(255,255,255,0.65)" : mixColor(textColor, background, 0.4)
  const fgAlt = isDarkBg ? "rgba(255,255,255,0.45)" : mixColor(textColor, background, 0.6)
  const border = isDarkBg ? "rgba(255,255,255,0.12)" : mixColor(textColor, background, 0.85)

  const fonts = [
    { family: headingFont, weight: 400, style: "normal" },
    { family: headingFont, weight: 500, style: "normal" },
    { family: headingFont, weight: 600, style: "normal" },
    { family: headingFont, weight: 700, style: "normal" },
    { family: bodyFont, weight: 400, style: "normal" },
    { family: bodyFont, weight: 500, style: "normal" },
  ]

  if (brief.fonts.accent && brief.fonts.accent !== headingFont && brief.fonts.accent !== bodyFont) {
    fonts.push({ family: brief.fonts.accent, weight: 400, style: "normal" })
  }

  return {
    fonts,
    systemColors: {
      brand: primary,
      "on-brand": isLightColor(primary) ? "#111111" : "#ffffff",
      base: background,
      "base-muted": baseMuted,
      "base-alt": baseAlt,
      panel,
      fg: textColor,
      "fg-muted": fgMuted,
      "fg-alt": fgAlt,
      border,
    },
    customColors: accent !== primary ? [{ id: "cc-1", name: "accent", value: accent }] : [],
    palette: {
      primary: { label: "primary", colors: generateShades(primary) },
      grays: { label: "gray", colors: generateShades(textColor) },
    },
    headingTypography: {
      "heading-xl": { fontFamily: headingFont, fontWeight: 700, fontSize: 64, lineHeight: 70, letterSpacing: -1.5, mobileFontSize: 36, mobileLineHeight: 40 },
      "heading-lg": { fontFamily: headingFont, fontWeight: 700, fontSize: 44, lineHeight: 50, letterSpacing: -0.8, mobileFontSize: 28, mobileLineHeight: 34 },
      "heading-md": { fontFamily: headingFont, fontWeight: 600, fontSize: 28, lineHeight: 36, letterSpacing: -0.3, mobileFontSize: 22, mobileLineHeight: 28 },
      "heading-sm": { fontFamily: headingFont, fontWeight: 600, fontSize: 20, lineHeight: 28, letterSpacing: 0, mobileFontSize: 18, mobileLineHeight: 24 },
      "heading-xs": { fontFamily: bodyFont, fontWeight: 500, fontSize: 16, lineHeight: 24, letterSpacing: 0, mobileFontSize: 14, mobileLineHeight: 20 },
    },
    bodyTypography: {
      "body-lg": { fontFamily: bodyFont, fontWeight: 400, fontSize: 18, lineHeight: 28, letterSpacing: 0 },
      "body-md": { fontFamily: bodyFont, fontWeight: 400, fontSize: 16, lineHeight: 26, letterSpacing: 0 },
      "body-sm": { fontFamily: bodyFont, fontWeight: 400, fontSize: 14, lineHeight: 22, letterSpacing: 0 },
    },
    prose: {
      elements: {
        h1: { typographyClass: "heading-xl", marginBottom: 1.5 },
        h2: { typographyClass: "heading-lg", marginBottom: 1.25 },
        h3: { typographyClass: "heading-md", marginBottom: 1 },
        h4: { typographyClass: "heading-sm", marginBottom: 0.75 },
        h5: { typographyClass: "heading-xs", marginBottom: 0.5 },
        h6: { typographyClass: "heading-xs", marginBottom: 0.5 },
        p: { typographyClass: "body-md", marginBottom: 1.25 },
        ul: { typographyClass: "body-md", marginBottom: 1.25 },
        ol: { typographyClass: "body-md", marginBottom: 1.25 },
      },
      lists: { listStyleType: "disc", indent: 1.5, itemSpacing: 0.5, nestedIndent: 1.5 },
      links: { color: "brand", hoverColor: "brand", underline: "always" },
    },
    buttons: {
      global: {
        fontFamily: headingFont,
        fontWeight: 500,
        uppercase: false,
        sizes: {
          lg: { fontSize: 18, letterSpacing: 0, opticalYOffset: 0, paddingTop: 14, paddingBottom: 14, paddingLeft: 28, paddingRight: 28, borderRadius: 8 },
          md: { fontSize: 16, letterSpacing: 0, opticalYOffset: 0, paddingTop: 10, paddingBottom: 10, paddingLeft: 24, paddingRight: 24, borderRadius: 8 },
          sm: { fontSize: 14, letterSpacing: 0, opticalYOffset: 0, paddingTop: 8, paddingBottom: 8, paddingLeft: 18, paddingRight: 18, borderRadius: 6 },
        },
      },
      variants: {
        primary: { backgroundColor: "system:brand", textColor: "system:on-brand", borderColor: "transparent", borderWidth: 0, hoverPreset: "darken" },
        secondary: { backgroundColor: "system:base-alt", textColor: "system:fg", borderColor: "transparent", borderWidth: 0, hoverPreset: "darken" },
        outline: { backgroundColor: "transparent", textColor: "system:fg", borderColor: "system:border", borderWidth: 1, hoverPreset: "fill" },
        ghost: { backgroundColor: "transparent", textColor: "system:fg", borderColor: "transparent", borderWidth: 0, hoverPreset: "lighten" },
      },
    },
  }
}

function briefToLibraryEntry(brief: any) {
  const slug = (brief.sourceUrl || brief.aesthetic || "unknown")
    .replace(/https?:\/\/(www\.)?/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/-+$/, "")
    .toLowerCase()
    .substring(0, 30)

  return {
    id: slug,
    name: brief.aesthetic?.split(".")[0]?.substring(0, 50) || slug,
    vibe: brief.vibe || [],
    suitableFor: brief.suitableFor || [],
    sourceUrl: brief.sourceUrl,
    theme: buildTheme(brief),
  }
}

// --- Main ---

function parseArgs() {
  const args = process.argv.slice(2)
  const parsed: Record<string, string> = {}
  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.+)$/)
    if (match) parsed[match[1]] = match[2]
  }
  return { ...parsed, apply: process.argv.includes("--apply"), import: process.argv.includes("--import") }
}

async function main() {
  const args = parseArgs()

  // Load briefs
  const briefs: any[] = []

  if (args.brief) {
    briefs.push(JSON.parse(readFileSync(resolve(args.brief), "utf-8")))
  } else if (args.briefs) {
    const dir = resolve(args.briefs)
    const files = readdirSync(dir).filter(f => f.endsWith(".json") && !f.startsWith("_"))
    for (const file of files) {
      try {
        const brief = JSON.parse(readFileSync(resolve(dir, file), "utf-8"))
        if (brief.fonts && brief.colors) briefs.push(brief)
      } catch { /* skip invalid */ }
    }
  } else {
    console.error("Usage:")
    console.error("  npx tsx scripts/briefs-to-theme-library.ts --briefs=output/briefs --out=output/themeLibrary.json")
    console.error("  npx tsx scripts/briefs-to-theme-library.ts --brief=output/briefs/stripe-com.json --apply --site=SITE_ID")
    process.exit(1)
  }

  console.log(`Loaded ${briefs.length} briefs`)

  // Convert to library entries
  const entries = briefs.map(briefToLibraryEntry)

  for (const entry of entries) {
    console.log(`  ${entry.id}: ${entry.name}`)
    console.log(`    Fonts: ${entry.theme.fonts[0].family} / ${entry.theme.fonts[4].family}`)
    console.log(`    Brand: ${entry.theme.systemColors.brand}, Base: ${entry.theme.systemColors.base}`)
    console.log(`    Vibe: ${entry.vibe.join(", ")}`)
  }

  // Apply theme directly to a site
  if (args.apply) {
    const siteId = args.site || process.env.MAKE_STUDIO_SITE
    if (!siteId) {
      console.error("No site ID — use --site=ID or set MAKE_STUDIO_SITE in .env")
      process.exit(1)
    }
    const { MakeStudioClient } = await import("../src/api.js")
    const client = new MakeStudioClient(
      process.env.MAKE_STUDIO_URL!,
      process.env.MAKE_STUDIO_TOKEN!
    )
    const entry = entries[0]
    console.log(`\nApplying "${entry.name}" to site ${siteId}...`)
    await client.updateSiteTheme(siteId, entry.theme)
    console.log("Done! Check the site preview.")
    return
  }

  // Import to theme library via API
  if (args.import) {
    const baseUrl = process.env.MAKE_STUDIO_URL!
    const token = process.env.MAKE_STUDIO_TOKEN!

    console.log(`\nImporting ${entries.length} themes to library at ${baseUrl}...`)
    for (const entry of entries) {
      try {
        const res = await fetch(`${baseUrl}/theme-library`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ name: entry.name, theme: entry.theme }),
        })
        if (!res.ok) {
          const err = await res.text()
          console.error(`  ✗ ${entry.name}: ${res.status} ${err}`)
        } else {
          console.log(`  ✓ ${entry.name}`)
        }
      } catch (err) {
        console.error(`  ✗ ${entry.name}: ${err instanceof Error ? err.message : err}`)
      }
    }
    console.log("Done! Refresh the theme library in the UI.")
    return
  }

  // Write library file
  const outPath = args.out || "output/themeLibrary.json"
  writeFileSync(resolve(outPath), JSON.stringify(entries, null, 2))
  console.log(`\nWritten ${entries.length} entries to ${outPath}`)

  // Also write in the make-studio format (append-friendly)
  console.log("\nTo add to make-studio theme library:")
  console.log(`  Copy entries from ${outPath} into server/data/themeLibrary.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
