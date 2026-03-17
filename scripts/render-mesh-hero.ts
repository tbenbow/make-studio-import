/**
 * Render mesh gradient hero variations.
 *
 * Generates a hero block with a mesh gradient background using the
 * mesh-gradient generator, writes it to disk, and renders a screenshot.
 *
 * Usage:
 *   npx tsx scripts/render-mesh-hero.ts --hue=220 --preset=dark-rich
 *   npx tsx scripts/render-mesh-hero.ts --hue=15 --preset=vivid-noise
 *   npx tsx scripts/render-mesh-hero.ts --all   # Render all presets at hue=220
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { generateMeshGradient, meshPresets, type MeshConfig } from '../src/mesh-gradient.js'
import { renderBlock } from '../src/render-block.js'

const THEME_PATH = join(process.cwd(), 'themes', 'block-ingress')
const BLOCKS_DIR = join(THEME_PATH, 'converted', 'blocks')

function buildHeroHTML(meshStyle: string, meshKeyframes: string, textMode: 'light' | 'dark'): string {
  const textColor = textMode === 'light' ? 'white' : 'gray-900'
  const mutedColor = textMode === 'light' ? 'white/60' : 'gray-500'
  const badgeBg = textMode === 'light' ? 'white/10' : 'gray-900/5'
  const badgeBorder = textMode === 'light' ? 'white/20' : 'gray-900/10'
  const badgeText = textMode === 'light' ? 'white' : 'gray-700'
  const badgeDot = textMode === 'light' ? 'emerald-400' : 'violet-500'
  const primaryBg = textMode === 'light' ? 'white' : 'gray-900'
  const primaryText = textMode === 'light' ? 'gray-900' : 'white'
  const secondaryBg = textMode === 'light' ? 'white/10' : 'gray-900/5'
  const secondaryBorder = textMode === 'light' ? 'white/20' : 'gray-200'
  const secondaryText = textMode === 'light' ? 'white' : 'gray-700'

  return `<section class="relative min-h-[700px] flex items-center justify-center overflow-hidden">
  <div class="absolute inset-0" style="${meshStyle}"></div>
  <div class="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center py-24 lg:py-32">
    {{#if [Show Badge]}}
    <div class="mb-6">
      <span class="inline-flex items-center gap-2 rounded-full bg-${badgeBg} backdrop-blur-sm border border-${badgeBorder} px-4 py-1.5 text-sm text-${badgeText} font-medium">
        <span class="w-1.5 h-1.5 rounded-full bg-${badgeDot}"></span>
        {{Badge}}
      </span>
    </div>
    {{/if}}
    <h1 class="heading-xl text-${textColor}">{{Heading}}</h1>
    <p class="text-lg text-${mutedColor} mt-6 max-w-2xl mx-auto leading-relaxed">{{Subheading}}</p>
    <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
      <a href="{{[Primary Button Link]}}" class="inline-flex items-center justify-center gap-2 bg-${primaryBg} text-${primaryText} font-medium text-base px-8 py-3.5 rounded-lg transition shadow-lg">{{[Primary Button Label]}}</a>
      <a href="{{[Secondary Button Link]}}" class="inline-flex items-center justify-center gap-2 bg-${secondaryBg} backdrop-blur-sm border border-${secondaryBorder} text-${secondaryText} font-medium text-base px-8 py-3.5 rounded-lg transition">{{[Secondary Button Label]}}</a>
    </div>
  </div>
  ${meshKeyframes ? `<style>${meshKeyframes}</style>` : ''}
</section>`
}

const FIELDS_JSON = JSON.stringify({
  description: 'Mesh gradient hero (generated)',
  fields: [
    { type: 'toggle', name: 'Show Badge', default: true },
    { type: 'text', name: 'Badge', default: 'Now in Beta' },
    { type: 'text', name: 'Heading', default: 'Build Beautiful Websites Without the Complexity' },
    { type: 'textarea', name: 'Subheading', default: 'Create stunning, professional websites in minutes. No coding required, no design skills needed — just your vision brought to life.' },
    { type: 'text', name: 'Primary Button Label', default: 'Get Started Free' },
    { type: 'link', name: 'Primary Button Link', default: '#' },
    { type: 'text', name: 'Secondary Button Label', default: 'See How It Works' },
    { type: 'link', name: 'Secondary Button Link', default: '#' },
  ]
}, null, 2)

async function renderVariation(hue: number, presetName: string) {
  const preset = meshPresets[presetName]
  if (!preset) throw new Error(`Unknown preset: ${presetName}`)

  const config: MeshConfig = { brandHue: hue, ...preset }
  const mesh = generateMeshGradient(config)

  const blockName = `HeroMeshGen_${presetName}_${hue}`
  const html = buildHeroHTML(mesh.style, mesh.keyframes, mesh.textMode)

  // Write block files
  await writeFile(join(BLOCKS_DIR, `${blockName}.html`), html)
  await writeFile(join(BLOCKS_DIR, `${blockName}.json`), FIELDS_JSON)

  // Render
  const result = await renderBlock({
    themePath: THEME_PATH,
    blockName,
    viewports: [1440],
    fullPage: true,
  })

  console.log(`  ✓ hue=${hue} preset=${presetName} → ${result.screenshots[0]}`)
  return result.screenshots[0]
}

async function main() {
  const args = process.argv.slice(2)
  let hue = 220
  let preset = ''
  let all = false

  for (const arg of args) {
    if (arg.startsWith('--hue=')) hue = parseInt(arg.slice(6))
    if (arg.startsWith('--preset=')) preset = arg.slice(9)
    if (arg === '--all') all = true
  }

  console.log('\nMesh Gradient Hero Generator\n')

  const screenshots: string[] = []

  if (all) {
    // Render every preset at the given hue
    for (const name of Object.keys(meshPresets)) {
      const path = await renderVariation(hue, name)
      screenshots.push(path)
    }
    // Test the best presets across multiple hues
    for (const h of [15, 120, 280, 340]) {
      for (const p of ['dark-rich', 'dark-valley', 'dark-valley-vivid']) {
        const path = await renderVariation(h, p)
        screenshots.push(path)
      }
    }
  } else if (preset) {
    const path = await renderVariation(hue, preset)
    screenshots.push(path)
  } else {
    console.error('Usage: --preset=<name> or --all')
    console.error(`Presets: ${Object.keys(meshPresets).join(', ')}`)
    process.exit(1)
  }

  // Open all screenshots
  const { execSync } = await import('child_process')
  execSync(`open ${screenshots.map(s => `"${s}"`).join(' ')}`)
}

main().catch(err => {
  console.error(err.message || err)
  process.exit(1)
})
