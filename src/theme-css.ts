/**
 * Theme CSS Generator
 *
 * Converts a Make Studio theme.json into CSS that matches the platform's
 * rendering. Used for local block preview without deploying to the API.
 */

// ── Types ──────────────────────────────────────────────────────────────

interface ThemeFont {
  family: string
  weight: number
  style: string
}

interface TypographyTier {
  fontFamily: string
  fontWeight: number
  fontSize: number
  lineHeight: number
  letterSpacing: number
  mobileFontSize?: number
  mobileLineHeight?: number
}

interface ButtonSize {
  fontSize: number
  letterSpacing: number
  opticalYOffset: number
  paddingTop: number
  paddingBottom: number
  paddingLeft: number
  paddingRight: number
  borderRadius: number
}

interface ButtonVariant {
  backgroundColor: string
  textColor: string
  borderColor: string
  borderWidth: number
  hoverPreset: string
}

interface ProseElements {
  [tag: string]: {
    typographyClass: string
    marginBottom: number
  }
}

interface ThemeJson {
  fonts: ThemeFont[]
  systemColors: Record<string, string>
  customColors?: Array<{ name: string; value: string }>
  headingTypography: Record<string, TypographyTier>
  bodyTypography: Record<string, TypographyTier>
  prose?: {
    elements?: ProseElements
    lists?: {
      listStyleType: string
      indent: number
      itemSpacing: number
      nestedIndent: number
    }
    links?: {
      color: string
      hoverColor: string
      underline: string
    }
  }
  buttons: {
    global: {
      fontFamily: string
      fontWeight: number
      uppercase: boolean
      sizes: Record<string, ButtonSize>
    }
    variants: Record<string, ButtonVariant>
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

/** Convert hex color to RGB components for opacity variants */
function hexToRgb(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
}

/** Resolve `system:brand` → the actual hex from systemColors */
function resolveColor(ref: string, systemColors: Record<string, string>): string {
  if (ref.startsWith('system:')) {
    const key = ref.slice(7)
    return systemColors[key] || ref
  }
  return ref
}

/** Build Google Fonts import URL from font list */
function buildFontImport(fonts: ThemeFont[]): string {
  // Group weights by family
  const families = new Map<string, Set<number>>()
  for (const font of fonts) {
    if (!families.has(font.family)) families.set(font.family, new Set())
    families.get(font.family)!.add(font.weight)
  }

  const params = Array.from(families.entries())
    .map(([family, weights]) => {
      const sortedWeights = Array.from(weights).sort((a, b) => a - b).join(';')
      return `family=${family.replace(/ /g, '+')}:wght@${sortedWeights}`
    })
    .join('&')

  return `@import url('https://fonts.googleapis.com/css2?${params}&display=swap');`
}

// ── Main Generator ─────────────────────────────────────────────────────

export function generateThemeCSS(theme: ThemeJson): string {
  const sections: string[] = []

  // 1. Google Fonts import
  if (theme.fonts.length > 0) {
    sections.push(buildFontImport(theme.fonts))
  }

  // 2. CSS custom properties on :root
  const props: string[] = []

  // System colors as custom properties + RGB variants for opacity
  for (const [name, hex] of Object.entries(theme.systemColors)) {
    props.push(`  --color-${name}: ${hex};`)
    const rgb = hexToRgb(hex)
    if (rgb) props.push(`  --color-${name}-rgb: ${rgb};`)
  }

  // Custom colors
  if (theme.customColors) {
    for (const { name, value } of theme.customColors) {
      props.push(`  --color-${name}: ${value};`)
      const rgb = hexToRgb(value)
      if (rgb) props.push(`  --color-${name}-rgb: ${rgb};`)
    }
  }

  // Font family
  const primaryFont = theme.fonts[0]?.family || 'sans-serif'
  props.push(`  --font-primary: '${primaryFont}', sans-serif;`)

  sections.push(`:root {\n${props.join('\n')}\n}`)

  // 3. Base reset + defaults
  sections.push(`*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--font-primary);
  color: var(--color-fg);
  background-color: var(--color-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
img { max-width: 100%; height: auto; display: block; }
a { color: inherit; text-decoration: none; }`)

  // 4. System color utility classes
  const colorClasses: string[] = []
  const allColors = { ...theme.systemColors }
  if (theme.customColors) {
    for (const { name, value } of theme.customColors) {
      allColors[name] = value
    }
  }

  for (const name of Object.keys(allColors)) {
    // bg-{color}, text-{color}, border-{color}
    colorClasses.push(`.bg-${name} { background-color: var(--color-${name}); }`)
    colorClasses.push(`.text-${name} { color: var(--color-${name}); }`)
    colorClasses.push(`.border-${name} { border-color: var(--color-${name}); }`)
    // Opacity variants: bg-{color}/50 etc.
    for (const opacity of [10, 20, 30, 50, 70, 80, 90]) {
      colorClasses.push(`.bg-${name}\\/${opacity} { background-color: rgba(var(--color-${name}-rgb), ${opacity / 100}); }`)
    }
  }
  sections.push(colorClasses.join('\n'))

  // 5. Typography classes (heading + body)
  const typoClasses: string[] = []
  const allTypo = { ...theme.headingTypography, ...theme.bodyTypography }

  for (const [className, tier] of Object.entries(allTypo)) {
    const lines = [
      `  font-family: '${tier.fontFamily}', sans-serif;`,
      `  font-weight: ${tier.fontWeight};`,
      `  font-size: ${tier.fontSize}px;`,
      `  line-height: ${tier.lineHeight}px;`,
    ]
    if (tier.letterSpacing !== 0) {
      lines.push(`  letter-spacing: ${tier.letterSpacing}px;`)
    }
    typoClasses.push(`.${className} {\n${lines.join('\n')}\n}`)

    // Mobile responsive override
    if (tier.mobileFontSize) {
      typoClasses.push(`@media (max-width: 767px) {\n  .${className} {\n    font-size: ${tier.mobileFontSize}px;\n    line-height: ${tier.mobileLineHeight || tier.mobileFontSize + 4}px;\n  }\n}`)
    }
  }
  sections.push(typoClasses.join('\n'))

  // 6. Button system
  const btnClasses: string[] = []
  const btn = theme.buttons

  // Base button styles
  btnClasses.push(`.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: '${btn.global.fontFamily}', sans-serif;
  font-weight: ${btn.global.fontWeight};
  ${btn.global.uppercase ? 'text-transform: uppercase;' : ''}
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
  border: 0 solid transparent;
}`)

  // Size classes
  for (const [size, s] of Object.entries(btn.global.sizes)) {
    btnClasses.push(`.btn-${size} {
  font-size: ${s.fontSize}px;
  padding: ${s.paddingTop}px ${s.paddingRight}px ${s.paddingBottom}px ${s.paddingLeft}px;
  border-radius: ${s.borderRadius}px;
  ${s.letterSpacing ? `letter-spacing: ${s.letterSpacing}px;` : ''}
}`)
  }

  // Variant classes
  for (const [variant, v] of Object.entries(btn.variants)) {
    const bg = resolveColor(v.backgroundColor, theme.systemColors)
    const text = resolveColor(v.textColor, theme.systemColors)
    const border = resolveColor(v.borderColor, theme.systemColors)

    const lines = [
      `  background-color: ${bg};`,
      `  color: ${text};`,
    ]
    if (v.borderWidth > 0) {
      lines.push(`  border: ${v.borderWidth}px solid ${border};`)
    }

    // Hover presets
    let hoverBlock = ''
    switch (v.hoverPreset) {
      case 'darken':
        hoverBlock = `  filter: brightness(0.9);`
        break
      case 'lighten':
        hoverBlock = `  filter: brightness(1.15);`
        break
      case 'fill':
        hoverBlock = `  background-color: ${resolveColor(v.borderColor || v.textColor, theme.systemColors)};\n  color: ${resolveColor(v.backgroundColor === 'transparent' ? 'system:base' : v.backgroundColor, theme.systemColors)};`
        break
    }

    btnClasses.push(`.btn-${variant} {\n${lines.join('\n')}\n}`)
    if (hoverBlock) {
      btnClasses.push(`.btn-${variant}:hover {\n${hoverBlock}\n}`)
    }
  }

  sections.push(btnClasses.join('\n'))

  // 7. Prose styles
  if (theme.prose?.elements) {
    const proseLines: string[] = []
    for (const [tag, config] of Object.entries(theme.prose.elements)) {
      proseLines.push(`.prose ${tag} {
  margin-bottom: ${config.marginBottom}em;
}`)
    }

    if (theme.prose.links) {
      const linkColor = resolveColor(`system:${theme.prose.links.color}`, theme.systemColors)
      proseLines.push(`.prose a {
  color: ${linkColor};
  ${theme.prose.links.underline === 'always' ? 'text-decoration: underline;' : ''}
}`)
    }

    if (theme.prose.lists) {
      const l = theme.prose.lists
      proseLines.push(`.prose ul, .prose ol {
  padding-left: ${l.indent}em;
  list-style-type: ${l.listStyleType};
}
.prose li + li {
  margin-top: ${l.itemSpacing}em;
}`)
    }

    sections.push(proseLines.join('\n'))
  }

  return sections.join('\n\n')
}

// ── CLI entry point ────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import('fs')
  const path = await import('path')

  const themePath = process.argv[2]
  if (!themePath) {
    console.error('Usage: npx tsx src/theme-css.ts <path/to/theme.json>')
    process.exit(1)
  }

  const raw = fs.readFileSync(path.resolve(themePath), 'utf-8')
  const theme = JSON.parse(raw) as ThemeJson
  const css = generateThemeCSS(theme)
  console.log(css)
}
