/**
 * Mesh Gradient Generator
 *
 * Generates CSS mesh gradient backgrounds from configurable handles.
 * Designed so an AI agent can produce on-brand gradient backgrounds
 * by providing a brand color and a few parameters.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface MeshConfig {
  /** Brand hue (0-360). The primary color the gradient is built from. */
  brandHue: number

  /** Color harmony strategy */
  harmony: 'analogous' | 'complementary' | 'split-complementary' | 'triadic' | 'tetradic'

  /** Light mode (light base, dark text) or dark mode (dark base, light text) */
  mode: 'dark' | 'light'

  /** How many gradient layers (3-10). More = richer, more complex. */
  complexity: number

  /** Add SVG noise texture overlay */
  noise: boolean

  /** Overall intensity. Low = subtle washes. High = vivid, saturated. */
  intensity: 'subtle' | 'medium' | 'vivid'

  /** Positioning pattern for the gradient orbs */
  layout: 'diagonal' | 'centered' | 'scattered' | 'bottom-heavy' | 'valley' | 'balanced-diagonal'

  /** Whether to include CSS animation keyframes */
  animated: boolean
}

export interface MeshOutput {
  /** Inline style for the gradient div */
  style: string
  /** CSS keyframes block (if animated) */
  keyframes: string
  /** Whether text should be light or dark */
  textMode: 'light' | 'dark'
}

// ── Color Math ─────────────────────────────────────────────────────────

/** Wrap hue to 0-360 range */
function wrapHue(h: number): number {
  return ((h % 360) + 360) % 360
}

/** Generate harmony hues from a base hue */
function getHarmonyHues(base: number, harmony: MeshConfig['harmony']): number[] {
  switch (harmony) {
    case 'analogous':
      return [base, wrapHue(base + 25), wrapHue(base - 25), wrapHue(base + 50), wrapHue(base - 15)]
    case 'complementary':
      return [base, wrapHue(base + 180), wrapHue(base + 15), wrapHue(base + 195)]
    case 'split-complementary':
      return [base, wrapHue(base + 150), wrapHue(base + 210), wrapHue(base + 30)]
    case 'triadic':
      return [base, wrapHue(base + 120), wrapHue(base + 240), wrapHue(base + 60)]
    case 'tetradic':
      return [base, wrapHue(base + 90), wrapHue(base + 180), wrapHue(base + 270)]
  }
}

/** Build an HSLA color string */
function hsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%,${a.toFixed(2)})`
}

// ── Position Strategies ────────────────────────────────────────────────

interface OrbPosition {
  x: number  // 0-100
  y: number  // 0-100
}

function getPositions(count: number, layout: MeshConfig['layout']): OrbPosition[] {
  switch (layout) {
    case 'diagonal':
      // Colors flow from bottom-left to top-right (or reverse)
      return Array.from({ length: count }, (_, i) => ({
        x: Math.round((i / (count - 1)) * 100),
        y: Math.round(100 - (i / (count - 1)) * 100),
      }))

    case 'balanced-diagonal':
      // Diagonal flow but with orbs on BOTH sides so no single dark corner
      // Alternates between the two diagonal directions
      return Array.from({ length: count }, (_, i) => {
        const t = i / (count - 1)
        if (i % 2 === 0) {
          return { x: Math.round(t * 100), y: Math.round(100 - t * 100) }
        } else {
          return { x: Math.round(100 - t * 100), y: Math.round(t * 100) }
        }
      })

    case 'centered':
      // Colors radiate from center with some variance
      return Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2
        const radius = 20 + (i % 3) * 15
        return {
          x: Math.round(50 + Math.cos(angle) * radius),
          y: Math.round(50 + Math.sin(angle) * radius),
        }
      })

    case 'scattered':
      // Well-distributed positions across all quadrants — no dead zones
      const seeds = [
        { x: 10, y: 15 }, { x: 85, y: 80 }, { x: 80, y: 10 },
        { x: 15, y: 85 }, { x: 50, y: 45 }, { x: 95, y: 45 },
        { x: 5, y: 50 },  { x: 55, y: 95 }, { x: 40, y: 5 },
        { x: 70, y: 55 },
      ]
      return seeds.slice(0, count)

    case 'valley':
      // Bright orbs in opposing corners, creating a dark valley through the center.
      // Inspired by HeroMeshDeep — "highlights in opposing corners... very organic"
      return Array.from({ length: count }, (_, i) => {
        const cornerAnchors = [
          { x: 0, y: 0 },    // top-left
          { x: 100, y: 100 }, // bottom-right
          { x: 5, y: 10 },   // near top-left
          { x: 95, y: 90 },  // near bottom-right
          { x: 15, y: 5 },   // top-left scatter
          { x: 85, y: 95 },  // bottom-right scatter
          { x: 10, y: 30 },  // left edge
          { x: 90, y: 70 },  // right edge
          { x: 25, y: 0 },   // top spread
          { x: 75, y: 100 }, // bottom spread
        ]
        return cornerAnchors[i % cornerAnchors.length]
      })

    case 'bottom-heavy':
      // Most color weight at the bottom, fading upward — deterministic positions
      return Array.from({ length: count }, (_, i) => ({
        x: Math.round((i / (count - 1)) * 100),
        y: Math.round(65 + (i % 3) * 12),
      }))
  }
}

// ── Main Generator ─────────────────────────────────────────────────────

export function generateMeshGradient(config: MeshConfig): MeshOutput {
  const {
    brandHue,
    harmony,
    mode,
    complexity,
    noise,
    intensity,
    layout,
    animated,
  } = config

  // 1. Build the color palette
  const hues = getHarmonyHues(brandHue, harmony)
  const positions = getPositions(complexity, layout)

  // Intensity controls saturation, lightness, and opacity ranges
  // Minimums tuned so gradients are always visible (never "just white" or "just black")
  const intensityParams = {
    subtle: { satRange: [50, 75], litRange: [50, 75], alphaRange: [0.25, 0.45] },
    medium: { satRange: [65, 95], litRange: [35, 65], alphaRange: [0.35, 0.65] },
    vivid: { satRange: [85, 100], litRange: [30, 55], alphaRange: [0.50, 0.85] },
  }[intensity]

  // Mode controls the base color and adjustments
  const baseColor = mode === 'dark'
    ? hsla(brandHue, 15, 8, 1)   // Very dark, slightly tinted
    : hsla(brandHue, 10, 98, 1)  // Near-white, slightly tinted

  // Light mode: boost lightness slightly, but keep opacity high enough to see color
  const modeAdjust = mode === 'light'
    ? { litBoost: 12, alphaScale: 0.8 }
    : { litBoost: 0, alphaScale: 1.0 }

  // 2. Generate gradient layers
  const layers: string[] = []

  for (let i = 0; i < complexity; i++) {
    const hue = hues[i % hues.length]
    const pos = positions[i]

    // Vary saturation and lightness within the intensity range
    const t = i / (complexity - 1) // 0 to 1
    const sat = intensityParams.satRange[0] + t * (intensityParams.satRange[1] - intensityParams.satRange[0])
    const lit = intensityParams.litRange[0] + (1 - t) * (intensityParams.litRange[1] - intensityParams.litRange[0]) + modeAdjust.litBoost
    const alpha = (intensityParams.alphaRange[0] + (Math.sin(t * Math.PI) * (intensityParams.alphaRange[1] - intensityParams.alphaRange[0]))) * modeAdjust.alphaScale

    // Spread: earlier layers are larger (washes), later are tighter (accents)
    const spreadStart = Math.round(1 + t * 5)
    const spreadEnd = Math.round(30 + (1 - t) * 50)

    const color = hsla(hue, sat, Math.min(lit, 95), alpha)
    layers.push(`radial-gradient(circle at ${pos.x}% ${pos.y}%, ${color} ${spreadStart}%, transparent ${spreadEnd}%)`)
  }

  // 3. Add noise layer if requested
  let blendMode = layers.map(() => 'normal').join(',')
  if (noise) {
    const noiseLayer = `url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
    layers.unshift(noiseLayer)
    blendMode = 'overlay,' + layers.slice(1).map(() => 'normal').join(',')
  }

  // 4. Build the CSS
  const bgImage = layers.join(',\n      ')
  const style = `background-color: ${baseColor};
    background-image: ${bgImage};
    background-blend-mode: ${blendMode};`

  // 5. Animation keyframes (if requested)
  let keyframes = ''
  if (animated) {
    // Generate a second set of positions for the end state
    const endPositions = getPositions(complexity, layout === 'diagonal' ? 'scattered' : 'diagonal')
    const endLayers: string[] = []

    for (let i = 0; i < complexity; i++) {
      const hue = hues[(i + 2) % hues.length] // Shift colors around
      const pos = endPositions[i]
      const t = i / (complexity - 1)
      const sat = intensityParams.satRange[0] + (1 - t) * (intensityParams.satRange[1] - intensityParams.satRange[0])
      const lit = intensityParams.litRange[1] - t * (intensityParams.litRange[1] - intensityParams.litRange[0]) + modeAdjust.litBoost
      const alpha = (intensityParams.alphaRange[0] + (Math.cos(t * Math.PI) * (intensityParams.alphaRange[1] - intensityParams.alphaRange[0]))) * modeAdjust.alphaScale
      const spreadStart = Math.round(1 + (1 - t) * 5)
      const spreadEnd = Math.round(30 + t * 50)
      const color = hsla(hue, sat, Math.min(lit, 95), alpha)
      endLayers.push(`radial-gradient(circle at ${pos.x}% ${pos.y}%, ${color} ${spreadStart}%, transparent ${spreadEnd}%)`)
    }

    if (noise) endLayers.unshift(layers[0]) // Keep noise layer the same

    const endBgImage = endLayers.join(',\n        ')
    keyframes = `@keyframes meshShift {
      0% { background-image: ${bgImage}; }
      100% { background-image: ${endBgImage}; }
    }`
  }

  return {
    style: animated ? style + `\n    animation: meshShift 12s ease infinite alternate;` : style,
    keyframes,
    textMode: mode === 'dark' ? 'light' : 'dark',
  }
}

// ── Presets ─────────────────────────────────────────────────────────────

/** Quick presets for common mesh styles */
export const meshPresets: Record<string, Omit<MeshConfig, 'brandHue'>> = {
  // ── Winners (approved across all hues) ──────────────────────────────
  'dark-rich': {
    harmony: 'analogous', mode: 'dark', complexity: 8, noise: false,
    intensity: 'medium', layout: 'scattered', animated: true,
  },

  // ── New: Valley presets (inspired by HeroMeshDeep) ──────────────────
  'dark-valley': {
    harmony: 'analogous', mode: 'dark', complexity: 8, noise: false,
    intensity: 'medium', layout: 'valley', animated: true,
  },
  'dark-valley-vivid': {
    harmony: 'split-complementary', mode: 'dark', complexity: 10, noise: false,
    intensity: 'vivid', layout: 'valley', animated: true,
  },
  'dark-valley-triadic': {
    harmony: 'triadic', mode: 'dark', complexity: 8, noise: false,
    intensity: 'medium', layout: 'valley', animated: false,
  },

  // ── Fixed: was diagonal (off-balance) → now balanced-diagonal ──────
  'dark-complementary': {
    harmony: 'complementary', mode: 'dark', complexity: 7, noise: false,
    intensity: 'vivid', layout: 'balanced-diagonal', animated: false,
  },

  // ── Light presets (opacity/lit tuned so they're actually visible) ───
  'light-pastel': {
    harmony: 'triadic', mode: 'light', complexity: 6, noise: true,
    intensity: 'subtle', layout: 'scattered', animated: false,
  },
  'light-blown': {
    harmony: 'analogous', mode: 'light', complexity: 6, noise: true,
    intensity: 'medium', layout: 'scattered', animated: false,
  },

  // ── Fixed: was diagonal (all black) → balanced, higher complexity ──
  'vivid-noise': {
    harmony: 'complementary', mode: 'dark', complexity: 8, noise: true,
    intensity: 'vivid', layout: 'scattered', animated: false,
  },

  // ── Fixed: was bottom-heavy (off balance) → valley for balance ─────
  'warm-glow': {
    harmony: 'tetradic', mode: 'dark', complexity: 7, noise: false,
    intensity: 'medium', layout: 'valley', animated: true,
  },
}

// ── CLI ────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  let brandHue = 220  // Default blue
  let preset = 'dark-rich'

  for (const arg of args) {
    if (arg.startsWith('--hue=')) brandHue = parseInt(arg.slice(6))
    if (arg.startsWith('--preset=')) preset = arg.slice(9)
  }

  const presetConfig = meshPresets[preset]
  if (!presetConfig) {
    console.error(`Unknown preset: ${preset}. Available: ${Object.keys(meshPresets).join(', ')}`)
    process.exit(1)
  }

  const result = generateMeshGradient({ brandHue, ...presetConfig })

  console.log(`/* Preset: ${preset}, Brand Hue: ${brandHue}° */`)
  console.log(`/* Text: ${result.textMode} */\n`)
  console.log(`.mesh-bg {\n    ${result.style}\n}`)
  if (result.keyframes) console.log(`\n${result.keyframes}`)
}
