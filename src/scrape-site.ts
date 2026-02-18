import fs from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'

// ─── Types ───

interface SectionInfo {
  type: string
  name: string
  element: cheerio.Element
  heading: string
  subheading: string
}

interface ColorMap {
  base: string
  fg: string
  brand: string
  'on-brand': string
  'base-muted': string
  'base-alt': string
  panel: string
  'fg-muted': string
  'fg-alt': string
  border: string
}

interface FontInfo {
  heading: string
  body: string
}

interface BlockFile {
  name: string
  html: string
  json: Record<string, unknown>
}

interface ScrapeSiteResult {
  blocks: string[]
  partials: string[]
  themeJson: string
  outputDir: string
}

// ─── Color utilities ───

function hexToRgb(hex: string): [number, number, number] | null {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  if (hex.length !== 6) return null
  const n = parseInt(hex, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
}

function parseColor(color: string): string | null {
  color = color.trim().toLowerCase()
  if (color.startsWith('#')) {
    const rgb = hexToRgb(color)
    return rgb ? rgbToHex(...rgb) : null
  }
  if (color.startsWith('rgb')) {
    const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (m) return rgbToHex(+m[1], +m[2], +m[3])
  }
  const named: Record<string, string> = {
    white: '#ffffff', black: '#000000', transparent: 'transparent'
  }
  return named[color] || null
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255
}

function saturation(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const [r, g, b] = rgb.map(c => c / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  if (max === 0) return 0
  return (max - min) / max
}

// ─── 1. Fetch page ───

async function fetchPage(url: string): Promise<{ html: string; $: cheerio.CheerioAPI; cssText: string }> {
  console.log(`Fetching ${url}...`)
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml'
    },
    redirect: 'follow'
  })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  // Fetch external stylesheets
  let cssText = ''
  const styleLinks: string[] = []
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href')
    if (href) {
      const abs = href.startsWith('http') ? href : new URL(href, url).toString()
      styleLinks.push(abs)
    }
  })

  // Collect inline styles
  $('style').each((_, el) => {
    cssText += $(el).html() + '\n'
  })

  // Fetch external CSS (limit to first 5 to avoid excessive requests)
  for (const link of styleLinks.slice(0, 5)) {
    try {
      console.log(`  Fetching CSS: ${link.slice(0, 80)}...`)
      const cssRes = await fetch(link, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (cssRes.ok) cssText += await cssRes.text() + '\n'
    } catch {
      // Skip failed CSS fetches
    }
  }

  console.log(`  Fetched ${html.length} bytes HTML, ${cssText.length} bytes CSS`)
  return { html, $, cssText }
}

// ─── 2. Detect sections ───

function detectSections(html: string, $: cheerio.CheerioAPI): SectionInfo[] {
  const sections: SectionInfo[] = []

  // Find top-level structural elements
  const candidates: cheerio.Element[] = []

  // Try <main> children first
  const main = $('main')
  if (main.length) {
    main.children('section, div, header, footer').each((_, el) => candidates.push(el))
  }

  // Also check body > section/header/footer
  if (candidates.length === 0) {
    $('body > section, body > header, body > footer, body > div > section, body > div > header, body > div > footer').each((_, el) => {
      candidates.push(el)
    })
  }

  // Also try Nuxt app root patterns
  if (candidates.length === 0) {
    $('#__nuxt section, #__nuxt > div > section, #app section, [id*="app"] section').each((_, el) => {
      candidates.push(el)
    })
  }

  // Fallback: all top-level sections anywhere
  if (candidates.length === 0) {
    $('section').each((_, el) => candidates.push(el))
  }

  // Also grab nav and footer if not already included
  const nav = $('nav').first()
  const footer = $('footer').first()

  // Dedupe: skip very small elements (< 100 chars inner text)
  const seen = new Set<cheerio.Element>()

  // Add nav as first if it exists
  if (nav.length) {
    const el = nav.get(0)!
    seen.add(el)
    sections.push({
      type: 'navbar',
      name: 'Navbar',
      element: el,
      heading: '',
      subheading: ''
    })
  }

  for (const el of candidates) {
    if (seen.has(el)) continue
    const $el = $(el)

    // Skip nav and footer (handled separately)
    if (el.tagName === 'nav' || el.tagName === 'footer') continue
    if ($el.find('nav').length && $el.children().length <= 2 && !$el.find('h1, h2').length) continue

    const text = $el.text().trim()
    if (text.length < 50) continue

    seen.add(el)

    const h1 = $el.find('h1').first().text().trim()
    const h2 = $el.find('h2').first().text().trim()
    const h3 = $el.find('h3').first().text().trim()
    const heading = h1 || h2 || h3 || ''

    // Try to find an eyebrow/label text (short text before heading, often in a span or small p)
    const eyebrow = $el.find('span.eyebrow, [class*="eyebrow"]').first().text().trim() ||
                    $el.find('span[class*="uppercase"]').first().text().trim()
    const subheading = $el.find('p').first().text().trim().slice(0, 120)

    const type = classifySection($el, $, heading)
    const name = generateBlockName(type, heading, sections, eyebrow)

    sections.push({ type, name, element: el, heading, subheading })
  }

  // Add footer
  if (footer.length) {
    const el = footer.get(0)!
    if (!seen.has(el)) {
      sections.push({
        type: 'footer',
        name: 'Footer',
        element: el,
        heading: '',
        subheading: ''
      })
    }
  }

  return sections
}

function classifySection($el: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI, heading: string): string {
  const html = $el.html() || ''
  const text = $el.text().toLowerCase()
  const tag = $el.get(0)?.tagName || ''

  // Check for hero (h1, large height, first section)
  if ($el.find('h1').length > 0) return 'hero'

  // CTA: form or prominent buttons with action words — check early since CTA sections
  // can contain other patterns too
  if ((text.includes('start now') || text.includes('get started') || text.includes('start training')) &&
      $el.find('form, input, button, a[class*="btn"]').length) return 'cta'

  // Marquee/branding — check early since it's very distinctive
  if (html.includes('animate-marquee') || html.includes('marquee')) return 'marquee'

  // Process: ordered steps (01, 02, 03...) — check before about since process sections
  // may mention "coach" but the numbered steps are the stronger signal
  const stepNumbers = text.match(/(?:^|\s|[^0-9])0[1-9](?=$|\s|[^0-9])/g)
  const elId = $el.attr('id') || ''
  if (stepNumbers && stepNumbers.length >= 3) {
    if (text.includes('phase') || text.includes('step') || text.includes('process') ||
        elId === 'process' || stepNumbers.length >= 4) return 'process'
  }

  // Coach/about: single image with bio text
  if (text.includes('coach') || text.includes('meet your') || text.includes('been there')) return 'about'

  // Features/services: card grid with images or icons and action-oriented content
  const cards = $el.find('[class*="grid"] > div, [class*="grid"] > article').length
  if (cards >= 3 && (text.includes('deliver') || text.includes('service') || text.includes('feature') ||
      text.includes('training') || text.includes('analytics') || text.includes('conditioning') ||
      $el.find('[class*="grid"] img').length >= 2)) return 'features'

  // Stats: grid of numbers
  const hasNumbers = ($el.find('h3, h2, p, [class*="display"], [class*="heading"]').toArray() || [])
    .filter(el => /^\d/.test($(el).text().trim())).length >= 3
  if (hasNumbers) return 'stats'

  // Testimonial: blockquotes, or "results"/"word"/"testimonial" with quotes/avatars
  if (html.includes('<blockquote') || text.includes('testimonial') ||
      ((text.includes('results') || text.includes("don't take") || text.includes('word')) &&
       $el.find('img[class*="rounded"], blockquote').length)) return 'testimonial'

  // Content sections with numbered items
  if (stepNumbers && stepNumbers.length >= 2) return 'content'

  // Features fallback: card grid without specific keywords
  if (cards >= 3) return 'features'

  return 'content'
}

function generateBlockName(type: string, heading: string, existing: SectionInfo[], eyebrow?: string): string {
  const typeMap: Record<string, string> = {
    hero: 'Hero',
    stats: 'Stats',
    testimonial: 'Testimonials',
    cta: 'CTA',
    footer: 'Footer',
    features: 'Features',
    process: 'Process',
    content: 'Content',
    about: 'About',
    navbar: 'Navbar',
    marquee: 'Marquee'
  }

  let name = typeMap[type] || 'Section'

  // Add suffix if there are duplicates of this type
  const existingOfType = existing.filter(s => s.type === type).length
  if (existingOfType > 0) {
    // Try to extract a meaningful keyword from the heading
    // Try eyebrow first (often descriptive like "What we deliver", "The process")
    const source = eyebrow || heading
    const stopWords = new Set(['the','and','for','with','your','our','not','are','was','has','its','but','get','got','don','take','stop','hard','start','been','who','there','right','zero','that','from','will','won','you','can','all','just','more','most','what','how','why','when','this','into','over','than','then','them','than','also','very','just','only','each','every','much','many','both','some','any','few','new','old','big','own','way','let','set','try','top','now','run','use','two','one','out','off','make','come'])
    const words = source.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()))
      .slice(0, 2)
    const suffix = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
    name += suffix || String(existingOfType + 1)
  }

  return name
}

// ─── 3. Extract colors ───

function extractColors(html: string, $: cheerio.CheerioAPI, cssText: string): { colors: ColorMap; allColors: Map<string, number>; cssColorMap: Map<string, string> } {
  const colorCounts = new Map<string, number>()
  const bgColors = new Map<string, number>()
  const textColors = new Map<string, number>()
  const cssColorMap = new Map<string, string>() // custom-name → hex

  // Parse CSS custom color definitions
  // Tailwind v3 uses: .bg-coal { background-color: rgb(10 10 10 / var(--tw-bg-opacity)) }
  // Also look for: --color-coal: 10 10 10; or --color-coal: #0a0a0a;
  // And: .text-coal { color: rgb(10 10 10 / ...) }

  // First, look for CSS variable definitions: --color-name: R G B;
  const cssVarRegex = /--color-([\w-]+)\s*:\s*(\d+)\s+(\d+)\s+(\d+)/g
  let m
  while ((m = cssVarRegex.exec(cssText)) !== null) {
    cssColorMap.set(m[1], rgbToHex(+m[2], +m[3], +m[4]))
  }

  // Then parse class-based color definitions
  // Match both .bg-coal and .text-coal blocks
  const cssBlockRegex = /\.(bg|text|border)-([\w-]+)\s*\{([^}]+)\}/g
  while ((m = cssBlockRegex.exec(cssText)) !== null) {
    const name = m[2]
    const body = m[3]
    // Skip already-mapped names and Tailwind utility modifiers
    if (cssColorMap.has(name)) continue
    if (/^(center|left|right|top|bottom|none|auto|clip|wrap|ellipsis|inherit|current|transparent)$/.test(name)) continue

    // Parse rgb(R G B / ...) — Tailwind v3 space-separated RGB
    const spaceRgb = body.match(/(?:background-color|color|border-color)\s*:\s*rgb\w?\(\s*(\d+)\s+(\d+)\s+(\d+)/)
    if (spaceRgb) {
      cssColorMap.set(name, rgbToHex(+spaceRgb[1], +spaceRgb[2], +spaceRgb[3]))
      continue
    }
    // Parse rgb(R, G, B)
    const commaRgb = body.match(/(?:background-color|color|border-color)\s*:\s*rgb\w?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (commaRgb) {
      cssColorMap.set(name, rgbToHex(+commaRgb[1], +commaRgb[2], +commaRgb[3]))
      continue
    }
    // Parse hex
    const hexMatch = body.match(/(?:background-color|color|border-color)\s*:\s*(#[0-9a-fA-F]{3,8})/)
    if (hexMatch) {
      const parsed = parseColor(hexMatch[1])
      if (parsed && parsed !== 'transparent') cssColorMap.set(name, parsed)
    }
  }

  // Also try to extract from Tailwind's @theme or :root variable patterns
  const rootVarRegex = /--(?:tw-)?(?:color-)?([\w-]+)\s*:\s*(?:(\d+)\s+(\d+)\s+(\d+)|#([0-9a-fA-F]{3,8}))/g
  while ((m = rootVarRegex.exec(cssText)) !== null) {
    const name = m[1]
    if (cssColorMap.has(name)) continue
    if (m[2]) {
      cssColorMap.set(name, rgbToHex(+m[2], +m[3], +m[4]))
    } else if (m[5]) {
      const hex = parseColor('#' + m[5])
      if (hex && hex !== 'transparent') cssColorMap.set(name, hex)
    }
  }

  // Extract from Tailwind arbitrary value classes: bg-[#xxx], text-[#xxx]
  const arbRegex = /(?:bg|text|border)-\[#([0-9a-fA-F]{3,8})\]/g
  while ((m = arbRegex.exec(html)) !== null) {
    const hex = parseColor('#' + m[1])
    if (hex && hex !== 'transparent') {
      colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1)
      if (m[0].startsWith('bg-')) bgColors.set(hex, (bgColors.get(hex) || 0) + 1)
      if (m[0].startsWith('text-')) textColors.set(hex, (textColors.get(hex) || 0) + 1)
    }
  }

  // Count Tailwind named color classes in HTML
  // Match patterns like bg-coal, text-volt, border-coal-700, bg-coal/95
  const namedColorRegex = /\b(bg|text|border)-([\w]+(?:-\d+)?)(?=[\/\s"';)])/g
  while ((m = namedColorRegex.exec(html)) !== null) {
    const prefix = m[1]
    const name = m[2]
    const hex = cssColorMap.get(name)
    if (hex) {
      colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1)
      if (prefix === 'bg') bgColors.set(hex, (bgColors.get(hex) || 0) + 1)
      if (prefix === 'text') textColors.set(hex, (textColors.get(hex) || 0) + 1)
    }
  }

  // Also check body/html and root container classes for the base bg
  // Try body, then common app root containers (#__nuxt, #app, #__app, body > div)
  const rootSelectors = ['body', '#__nuxt', '#app', '#__app', 'body > div:first-child']
  for (const sel of rootSelectors) {
    const rootClasses = $(sel).attr('class') || ''
    const rootBgMatch = rootClasses.match(/\bbg-([\w]+(?:-\d+)?)/)
    if (rootBgMatch) {
      const rootBgHex = cssColorMap.get(rootBgMatch[1])
      if (rootBgHex) {
        bgColors.set(rootBgHex, (bgColors.get(rootBgHex) || 0) + 100)
        colorCounts.set(rootBgHex, (colorCounts.get(rootBgHex) || 0) + 100)
      }
    }
    const rootTextMatch = rootClasses.match(/\btext-([\w]+(?:-\d+)?)/)
    if (rootTextMatch) {
      const hex = cssColorMap.get(rootTextMatch[1]) || (rootTextMatch[1] === 'white' ? '#ffffff' : null)
      if (hex) {
        textColors.set(hex, (textColors.get(hex) || 0) + 100)
        colorCounts.set(hex, (colorCounts.get(hex) || 0) + 100)
      }
    }
  }

  // Also look for base background in CSS: body, html, #__nuxt definitions
  const rootCssRegex = /(?:body|html|#__nuxt|#app)\s*\{[^}]*background(?:-color)?\s*:\s*([^;}]+)/gi
  while ((m = rootCssRegex.exec(cssText)) !== null) {
    const hex = parseColor(m[1])
    if (hex && hex !== 'transparent') {
      bgColors.set(hex, (bgColors.get(hex) || 0) + 100)
      colorCounts.set(hex, (colorCounts.get(hex) || 0) + 100)
    }
  }

  // Heuristic: if the most-used bg color is very saturated (like a brand color),
  // and there's a very dark color with fewer uses, the dark one is probably the real base.
  // A page base color should be near-black/white, not a saturated accent.
  const sortedBgPre = [...bgColors.entries()].sort((a, b) => b[1] - a[1])
  if (sortedBgPre.length >= 2) {
    const topBg = sortedBgPre[0][0]
    const topBgSat = saturation(topBg)
    if (topBgSat > 0.3) {
      // Top bg is saturated — likely a brand color, not a base.
      // Find the darkest or lightest color with reasonable usage as the real base.
      const baseCandidates = sortedBgPre.filter(([hex]) =>
        saturation(hex) < 0.2 && (luminance(hex) < 0.1 || luminance(hex) > 0.9)
      )
      if (baseCandidates.length) {
        // Boost the real base candidate
        const realBase = baseCandidates[0][0]
        bgColors.set(realBase, (bgColors.get(realBase) || 0) + 200)
      }
    }
  }

  // Also count text-white, bg-black etc
  const knownTw: Record<string, string> = {
    white: '#ffffff', black: '#000000'
  }
  for (const [name, hex] of Object.entries(knownTw)) {
    const bgCount = (html.match(new RegExp(`bg-${name}(?:\\s|"|'|\\/)`, 'g')) || []).length
    const textCount = (html.match(new RegExp(`text-${name}(?:\\s|"|'|\\/)`, 'g')) || []).length
    if (bgCount) bgColors.set(hex, (bgColors.get(hex) || 0) + bgCount)
    if (textCount) textColors.set(hex, (textColors.get(hex) || 0) + textCount)
    if (bgCount + textCount > 0) colorCounts.set(hex, (colorCounts.get(hex) || 0) + bgCount + textCount)
  }

  // Inline style colors
  const inlineRegex = /(?:background-color|color|border-color)\s*:\s*([^;"]+)/gi
  while ((m = inlineRegex.exec(html)) !== null) {
    const hex = parseColor(m[1])
    if (hex && hex !== 'transparent') {
      colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1)
    }
  }

  // Build color map
  const allSorted = [...colorCounts.entries()].sort((a, b) => b[1] - a[1])

  // Determine base (dominant bg), fg (dominant text), brand (most saturated non-bg/fg)
  const sortedBg = [...bgColors.entries()].sort((a, b) => b[1] - a[1])
  const sortedText = [...textColors.entries()].sort((a, b) => b[1] - a[1])

  const base = sortedBg[0]?.[0] || allSorted.find(([hex]) => luminance(hex) < 0.15)?.[0] || '#0a0a0a'
  const fg = sortedText[0]?.[0] || '#ffffff'

  // Brand = most saturated color that isn't base or fg
  const brandCandidates = allSorted
    .filter(([hex]) => hex !== base && hex !== fg)
    .sort((a, b) => saturation(b[0]) - saturation(a[0]))
  const brand = brandCandidates[0]?.[0] || '#c8ff00'

  // Determine on-brand: if brand is light, on-brand is dark, vice versa
  const onBrand = luminance(brand) > 0.5 ? base : fg

  // Fill remaining colors by luminance sorting of all unique colors
  const allUnique = [...new Set(allSorted.map(([hex]) => hex))]
    .filter(h => h !== 'transparent')
    .sort((a, b) => luminance(a) - luminance(b))

  // Darks to lights for panel, base-muted, border, fg-alt, fg-muted, base-alt
  const darks = allUnique.filter(h => luminance(h) < 0.2 && h !== base)
  const mids = allUnique.filter(h => luminance(h) >= 0.2 && luminance(h) < 0.6)
  const lights = allUnique.filter(h => luminance(h) >= 0.6 && h !== fg)

  const colors: ColorMap = {
    base,
    fg,
    brand,
    'on-brand': onBrand,
    'base-muted': darks[0] || shiftColor(base, 0.05),
    panel: darks[1] || darks[0] || shiftColor(base, 0.03),
    'base-alt': lights[0] || shiftColor(fg, -0.1),
    'fg-muted': mids[0] || shiftColor(fg, -0.3),
    'fg-alt': mids[1] || mids[0] || shiftColor(fg, -0.5),
    border: mids[2] || darks[darks.length - 1] || shiftColor(base, 0.15)
  }

  return { colors, allColors: colorCounts, cssColorMap }
}

function shiftColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const shift = Math.round(amount * 255)
  return rgbToHex(
    Math.max(0, Math.min(255, rgb[0] + shift)),
    Math.max(0, Math.min(255, rgb[1] + shift)),
    Math.max(0, Math.min(255, rgb[2] + shift))
  )
}

// ─── 4. Extract typography ───

function extractTypography($: cheerio.CheerioAPI, cssText: string): FontInfo {
  const fonts = new Set<string>()

  // Google Fonts links
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const familyMatch = href.match(/family=([^:&]+)/g)
    if (familyMatch) {
      for (const f of familyMatch) {
        fonts.add(f.replace('family=', '').replace(/\+/g, ' '))
      }
    }
  })

  // @font-face in CSS
  const fontFaceRegex = /font-family\s*:\s*['"]?([^'";\n}]+)/gi
  let m
  while ((m = fontFaceRegex.exec(cssText)) !== null) {
    const family = m[1].trim().replace(/['"]/g, '')
    if (!family.match(/^(inherit|initial|unset|system-ui|sans-serif|serif|monospace|cursive|fantasy|ui-)/) && family.length > 1) {
      fonts.add(family)
    }
  }

  // Check font classes in HTML
  const fontClassRegex = /font-(?:display|heading|body|sans|serif|mono)\b/g
  const htmlStr = $.html()
  const fontClasses = new Set<string>()
  while ((m = fontClassRegex.exec(htmlStr)) !== null) {
    fontClasses.add(m[0])
  }

  // Heuristic: display/heading font vs body font
  // Look for font-family declarations associated with display/heading classes
  const displayFontRegex = /\.(?:font-display|text-display)[^{]*\{[^}]*font-family\s*:\s*['"]?([^'",;}\n]+)/gi
  let headingFont = ''
  while ((m = displayFontRegex.exec(cssText)) !== null) {
    headingFont = m[1].trim()
  }

  // Body font from body or base styles
  const bodyFontRegex = /(?:body|\.font-sans|html)[^{]*\{[^}]*font-family\s*:\s*['"]?([^'",;}\n]+)/gi
  let bodyFont = ''
  while ((m = bodyFontRegex.exec(cssText)) !== null) {
    bodyFont = m[1].trim()
  }

  // Fallback: use the detected font list
  const fontList = [...fonts]
  if (!headingFont && fontList.length > 0) {
    // First non-body font is likely display
    headingFont = fontList.find(f => f !== 'Inter' && f !== 'system-ui') || fontList[0]
  }
  if (!bodyFont) {
    bodyFont = fontList.find(f => f === 'Inter') || fontList[fontList.length - 1] || 'Inter'
  }

  if (!headingFont) headingFont = bodyFont || 'Inter'

  return { heading: headingFont, body: bodyFont }
}

// ─── 5. Generate block HTML ───

function generateBlock(
  section: SectionInfo,
  colors: ColorMap,
  cssColorMap: Map<string, string>,
  $: cheerio.CheerioAPI
): BlockFile {
  const $el = $(section.element).clone()

  // Build color replacement map: Tailwind class → semantic class
  const colorReplacements = buildColorReplacements(colors, cssColorMap)

  // Process the HTML
  let html = $.html($el)

  // Remove script tags and data attributes
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  html = html.replace(/\s+data-[\w-]+="[^"]*"/g, '')
  html = html.replace(/\s+data-v-[\w]+/g, '')

  // Replace color classes with semantic tokens
  for (const [from, to] of colorReplacements) {
    html = html.replace(new RegExp(escapeRegex(from), 'g'), to)
  }

  // Replace typography classes
  html = replaceTypography(html)

  // Remove noise/overlay divs
  html = html.replace(/<div[^>]*class="[^"]*noise[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')

  // Clean up empty class attributes
  html = html.replace(/\s+class=""/g, '')

  // Extract fields and generate Handlebars template
  let { template, fields } = extractFields(html, section, $)

  // Build JSON
  const json: Record<string, unknown> = {
    makeStudioFields: true,
    version: 1,
    description: section.type.charAt(0).toUpperCase() + section.type.slice(1),
    fields
  }

  // Fix cheerio HTML encoding of Handlebars expressions
  // Cheerio encodes > inside text nodes, but we need it for {{> Partial}} and {{#if (length x)}}
  template = template.replace(/\{\{(&gt;|&amp;gt;)\s*/g, '{{> ')
  template = template.replace(/\{\{#(\w+)\s*\((\w+)\s+(\w+)\)(&gt;|&amp;gt;)\}\}/g, '{{#$1 ($2 $3)}}')

  return { name: section.name, html: template, json }
}

function buildColorReplacements(colors: ColorMap, cssColorMap: Map<string, string>): [string, string][] {
  const replacements: [string, string][] = []

  // Map CSS custom color names to semantic tokens
  const semanticMap: [string, keyof ColorMap][] = [
    ['base', 'base'],
    ['fg', 'fg'],
    ['brand', 'brand'],
    ['on-brand', 'on-brand'],
    ['base-muted', 'base-muted'],
    ['panel', 'panel'],
    ['base-alt', 'base-alt'],
    ['fg-muted', 'fg-muted'],
    ['fg-alt', 'fg-alt'],
    ['border', 'border'],
  ]

  // Build hex → semantic name lookup
  // Priority: base, fg, brand should win over on-brand, base-muted, etc.
  // So we iterate in reverse priority order (least important first)
  const hexToSemantic = new Map<string, string>()
  const priorityOrder: [string, keyof ColorMap][] = [
    ...semanticMap.filter(([s]) => !['base', 'fg', 'brand'].includes(s)),
    ['brand', 'brand'],
    ['fg', 'fg'],
    ['base', 'base'],
  ]
  for (const [semantic, key] of priorityOrder) {
    hexToSemantic.set(colors[key].toLowerCase(), semantic)
  }

  // Replace custom Tailwind color classes (e.g., bg-coal → bg-base, text-volt → text-brand)
  for (const [name, hex] of cssColorMap) {
    const semantic = hexToSemantic.get(hex.toLowerCase())
    if (semantic) {
      // bg-coal → bg-base, text-coal → text-base, border-coal → border-base
      for (const prefix of ['bg-', 'text-', 'border-', 'from-', 'via-', 'to-']) {
        replacements.push([`${prefix}${name}`, `${prefix}${semantic}`])
      }
    }
  }

  // Replace well-known Tailwind colors
  const fgIsWhite = colors.fg === '#ffffff'
  const baseIsDark = luminance(colors.base) < 0.2
  if (fgIsWhite) {
    replacements.push(['text-white', 'text-fg'])
  }
  if (baseIsDark) {
    replacements.push(['text-black', 'text-base'])
  }

  // Replace gradient color stops that use custom names
  for (const [name, hex] of cssColorMap) {
    const semantic = hexToSemantic.get(hex.toLowerCase())
    if (semantic) {
      // Also match opacity variants: bg-coal/95, from-coal/60, etc.
      for (const prefix of ['bg-', 'text-', 'border-', 'from-', 'via-', 'to-']) {
        // Exact match (no opacity modifier)
        if (!replacements.some(([f]) => f === `${prefix}${name}`)) {
          replacements.push([`${prefix}${name}`, `${prefix}${semantic}`])
        }
      }
    }
  }

  // Replace arbitrary hex values: bg-[#0a0a0a] → bg-base
  for (const [hex, semantic] of hexToSemantic) {
    replacements.push([`bg-[${hex}]`, `bg-${semantic}`])
    replacements.push([`text-[${hex}]`, `text-${semantic}`])
    replacements.push([`border-[${hex}]`, `border-${semantic}`])
  }

  // Sort by length (longest first) to avoid partial replacements
  replacements.sort((a, b) => b[0].length - a[0].length)

  return replacements
}

function replaceTypography(html: string): string {
  // Replace display/heading size classes with semantic typography classes
  const typoReplacements: [string | RegExp, string][] = [
    // Display sizes → heading tiers
    ['text-display-xl', 'heading-xl'],
    ['text-display-lg', 'heading-lg'],
    ['text-display-md', 'heading-md'],
    ['text-display-sm', 'heading-sm'],
    // Standard Tailwind text sizes for headings
    ['text-7xl', 'heading-xl'],
    ['text-6xl', 'heading-xl'],
    ['text-5xl', 'heading-lg'],
    ['text-4xl', 'heading-lg'],
    ['text-3xl', 'heading-md'],
    ['text-2xl', 'heading-md'],
    ['text-xl', 'heading-sm'],
    ['text-lg', 'body-lg'],
    ['text-base', 'body-md'],
    ['text-sm', 'body-sm'],
    ['text-xs', 'body-sm'],
  ]

  for (const [from, to] of typoReplacements) {
    if (typeof from === 'string') {
      html = html.replace(new RegExp(`\\b${escapeRegex(from)}\\b`, 'g'), to)
    }
  }

  // Remove font-display class (replaced by heading tier which sets the font)
  html = html.replace(/\s*\bfont-display\b/g, '')

  // Remove leading/tracking classes that are now handled by the typography system
  // but keep ones that are clearly intentional overrides
  html = html.replace(/\s*\bleading-\[[\d.]+\]\b/g, '')
  html = html.replace(/\s*\btracking-\[[\d.em-]+\]\b/g, '')
  html = html.replace(/\s*\bleading-none\b/g, '')
  html = html.replace(/\s*\bleading-tight\b/g, '')

  return html
}

function extractFields(html: string, section: SectionInfo, $: cheerio.CheerioAPI): { template: string; fields: Record<string, unknown>[] } {
  const fields: Record<string, unknown>[] = []
  let template = html

  // Load the section HTML into its own cheerio instance for field extraction
  const $sec = cheerio.load(html)
  const root = $sec.root()

  // Extract based on section type
  switch (section.type) {
    case 'hero':
      template = extractHeroFields(template, section, fields)
      break
    case 'stats':
      template = extractStatsFields(template, section, fields, $sec)
      break
    case 'features':
      template = extractFeaturesFields(template, section, fields, $sec)
      break
    case 'process':
      template = extractProcessFields(template, section, fields, $sec)
      break
    case 'testimonial':
      template = extractTestimonialFields(template, section, fields, $sec)
      break
    case 'cta':
      template = extractCTAFields(template, section, fields)
      break
    case 'about':
      template = extractAboutFields(template, section, fields, $sec)
      break
    case 'footer':
      template = extractFooterFields(template, section, fields, $sec)
      break
    case 'navbar':
      template = extractNavbarFields(template, section, fields, $sec)
      break
    default:
      template = extractContentFields(template, section, fields)
      break
  }

  // Standardize section wrapper
  template = standardizeWrapper(template, section)

  // Clean up whitespace
  template = cleanWhitespace(template)

  return { template, fields }
}

function extractHeroFields(html: string, section: SectionInfo, fields: Record<string, unknown>[]): string {
  const $ = cheerio.load(html)

  // Find eyebrow (small text before h1)
  const h1 = $('h1')
  const eyebrowEl = h1.prevAll('span, p').first()
  if (eyebrowEl.length) {
    const eyebrowText = eyebrowEl.text().trim()
    if (eyebrowText && eyebrowText.length < 50) {
      fields.push({ type: 'text', name: 'Eyebrow', default: eyebrowText })
      eyebrowEl.replaceWith('{{#if eyebrow}}\n      <p class="body-sm font-semibold text-brand uppercase tracking-widest">{{eyebrow}}</p>\n    {{/if}}')
    }
  }

  // H1 → headline
  if (h1.length) {
    const text = h1.text().trim()
    fields.push({ type: 'text', name: 'Headline', default: text })
    h1.empty().append('{{headline}}')
  }

  // First paragraph/subtitle
  const subtitle = $('p').not('[class*="eyebrow"]').first()
  if (subtitle.length && subtitle.text().trim().length > 20) {
    const text = subtitle.text().trim()
    fields.push({ type: 'wysiwyg', name: 'Subheadline', default: `<p>${text}</p>` })
    subtitle.replaceWith('<div class="body-lg text-fg-muted max-w-xl text-center">\n      {{{subheadline}}}\n    </div>')
  }

  // Buttons
  const buttons = $('a[class*="btn"], button[class*="btn"], a[class*="inline-flex"], button[class*="inline-flex"]')
    .filter((_, el) => {
      // Only match actual CTA buttons, not nav links
      const text = $(el).text().trim()
      return text.length > 0 && text.length < 40
    })
  if (buttons.length) {
    const buttonDefaults: Record<string, unknown>[] = []
    buttons.each((i, el) => {
      const label = $(el).text().trim()
      const href = $(el).attr('href') || '#'
      const style = $(el).attr('class')?.includes('outline') || $(el).attr('class')?.includes('ghost') ? 'ghost' : 'primary'
      buttonDefaults.push({ label, link: href, style })
    })

    fields.push({
      type: 'items',
      name: 'Buttons',
      default: buttonDefaults,
      config: {
        fields: [
          { type: 'text', name: 'Label' },
          { type: 'text', name: 'Link' },
          { type: 'select', name: 'Style', config: { selectOptions: [
            { key: 'Primary', value: 'primary' },
            { key: 'Secondary', value: 'secondary' },
            { key: 'Ghost', value: 'ghost' }
          ]}}
        ]
      }
    })

    // Replace buttons with {{#each buttons}}
    const firstButton = buttons.first()
    const buttonContainer = firstButton.parent()
    buttonContainer.empty().append('\n        {{#each buttons}}\n          {{> Button}}\n        {{/each}}\n      ')
    // Wrap in {{#if}}
    const containerHtml = $.html(buttonContainer)
    const wrappedButtons = `{{#if (length buttons)}}\n      <div class="flex flex-wrap items-center justify-center gap-4 mt-2">\n        {{#each buttons}}\n          {{> Button}}\n        {{/each}}\n      </div>\n    {{/if}}`
    buttonContainer.replaceWith(wrappedButtons)
  }

  // Image
  const img = $('img').first()
  if (img.length) {
    const src = img.attr('src') || ''
    const alt = img.attr('alt') || ''
    fields.push({ type: 'image', name: 'Image', default: src })
    img.attr('src', '{{image}}')
    img.attr('alt', '{{headline}}')
  }

  return $.html()
}

function extractStatsFields(html: string, section: SectionInfo, fields: Record<string, unknown>[], $sec: cheerio.CheerioAPI): string {
  const $ = cheerio.load(html)

  // Find heading
  const h2 = $('h2, h3').first()
  if (h2.length && !/^\d/.test(h2.text().trim())) {
    fields.push({ type: 'text', name: 'Headline', default: h2.text().trim() })
    h2.empty().append('{{headline}}')
  }

  // Find the grid of stats
  const grid = $('[class*="grid"]').first()
  if (grid.length) {
    const items = grid.children()
    const statDefaults: Record<string, unknown>[] = []

    items.each((_, el) => {
      const $item = $(el)
      // The stat number is usually in a heading or prominent element
      const statEl = $item.find('h3, h2, [class*="heading"], [class*="display"]').first()
      const stat = statEl.length ? statEl.text().trim() : $item.contents().first().text().trim()
      // The label is usually in a p or smaller text
      const label = $item.find('p, span').first().text().trim() || $item.text().replace(stat, '').trim()
      if (stat) statDefaults.push({ stat, text: label })
    })

    if (statDefaults.length) {
      fields.push({
        type: 'items',
        name: 'Stats',
        default: statDefaults,
        config: {
          fields: [
            { type: 'text', name: 'Stat' },
            { type: 'text', name: 'Text' }
          ]
        }
      })

      // Replace grid content with {{#each}}
      grid.empty().append('\n        {{#each stats}}\n          <div class="rounded-xl bg-panel p-6">\n            <div class="heading-md text-fg">{{stat}}</div>\n            <p class="mt-2 body-sm text-fg-muted">{{text}}</p>\n          </div>\n        {{/each}}\n      ')
    }
  }

  return $.html()
}

function extractFeaturesFields(html: string, section: SectionInfo, fields: Record<string, unknown>[], $sec: cheerio.CheerioAPI): string {
  const $ = cheerio.load(html)

  // Section heading
  const sectionHeading = $('h2, h3').first()
  if (sectionHeading.length && !sectionHeading.closest('[class*="grid"] > *').length) {
    const headingText = sectionHeading.text().trim()
    if (headingText.length < 80) {
      fields.push({ type: 'text', name: 'Headline', default: headingText })
      sectionHeading.empty().append('{{headline}}')
    }
  }

  // Subheading
  const subP = $('p').first()
  if (subP.length && !subP.closest('[class*="grid"] > *').length) {
    const subText = subP.text().trim()
    if (subText.length > 20 && subText.length < 200) {
      fields.push({ type: 'wysiwyg', name: 'Subheadline', default: `<p>${subText}</p>` })
      subP.replaceWith('<div class="body-md text-fg-muted text-pretty">{{{subheadline}}}</div>')
    }
  }

  // Find the card grid
  const grid = $('[class*="grid"]').first()
  if (grid.length) {
    const cards = grid.children()
    const featureDefaults: Record<string, unknown>[] = []

    cards.each((_, el) => {
      const $card = $(el)
      const title = $card.find('h3, h4').first().text().trim()
      const desc = $card.find('p').first().text().trim()
      const img = $card.find('img').first()
      const imgSrc = img.attr('src') || ''

      const item: Record<string, unknown> = { headline: title, description: `<p>${desc}</p>` }
      if (imgSrc) item.image = imgSrc

      featureDefaults.push(item)
    })

    if (featureDefaults.length) {
      const hasImages = featureDefaults.some(f => f.image)
      const configFields: Record<string, unknown>[] = [
        { type: 'text', name: 'Headline' },
        { type: 'wysiwyg', name: 'Description' }
      ]
      if (hasImages) configFields.push({ type: 'image', name: 'Image' })

      fields.push({
        type: 'items',
        name: 'Features',
        default: featureDefaults,
        config: { fields: configFields }
      })

      // Replace with {{#each}}
      const cardTemplate = hasImages
        ? `<div class="flex flex-col gap-4">
            {{#if image}}
              <div class="aspect-[4/3] overflow-hidden rounded-lg">
                <img src="{{image}}" alt="{{headline}}" class="size-full object-cover" />
              </div>
            {{/if}}
            <h3 class="heading-sm text-fg font-semibold">{{headline}}</h3>
            <div class="body-sm text-fg-muted">{{{description}}}</div>
          </div>`
        : `<div class="flex flex-col gap-2">
            <h3 class="heading-sm text-fg font-semibold">{{headline}}</h3>
            <div class="body-sm text-fg-muted">{{{description}}}</div>
          </div>`

      grid.empty().append(`\n        {{#each features}}\n          ${cardTemplate}\n        {{/each}}\n      `)
    }
  }

  return $.html()
}

function extractProcessFields(html: string, section: SectionInfo, fields: Record<string, unknown>[], $sec: cheerio.CheerioAPI): string {
  const $ = cheerio.load(html)

  // Section heading
  const sectionHeading = $('h2, h3').first()
  if (sectionHeading.length) {
    const headingText = sectionHeading.text().trim()
    if (headingText.length < 80 && !/^\d/.test(headingText)) {
      fields.push({ type: 'text', name: 'Headline', default: headingText })
      sectionHeading.empty().append('{{headline}}')
    }
  }

  // Find steps - typically in a grid or flex container
  const grid = $('[class*="grid"], [class*="flex"]').filter((_, el) => {
    return $(el).children().length >= 3
  }).first()

  if (grid.length) {
    const steps = grid.children()
    const stepDefaults: Record<string, unknown>[] = []

    steps.each((i, el) => {
      const $step = $(el)
      const title = $step.find('h3, h4').first().text().trim()
      const desc = $step.find('p').first().text().trim()
      stepDefaults.push({
        number: String(i + 1).padStart(2, '0'),
        headline: title,
        description: `<p>${desc}</p>`
      })
    })

    if (stepDefaults.length >= 2) {
      fields.push({
        type: 'items',
        name: 'Steps',
        default: stepDefaults,
        config: {
          fields: [
            { type: 'text', name: 'Number' },
            { type: 'text', name: 'Headline' },
            { type: 'wysiwyg', name: 'Description' }
          ]
        }
      })

      grid.empty().append(`\n        {{#each steps}}
          <div class="flex flex-col gap-3">
            <div class="body-sm text-brand font-semibold">{{number}}</div>
            <h3 class="heading-sm text-fg font-semibold">{{headline}}</h3>
            <div class="body-sm text-fg-muted">{{{description}}}</div>
          </div>
        {{/each}}\n      `)
    }
  }

  return $.html()
}

function extractTestimonialFields(html: string, section: SectionInfo, fields: Record<string, unknown>[], $sec: cheerio.CheerioAPI): string {
  const $ = cheerio.load(html)

  // Section heading
  const sectionHeading = $('h2, h3').first()
  if (sectionHeading.length) {
    const headingText = sectionHeading.text().trim()
    if (headingText.length < 80) {
      fields.push({ type: 'text', name: 'Headline', default: headingText })
      sectionHeading.empty().append('{{headline}}')
    }
  }

  // Find testimonial items
  const quotes: Record<string, unknown>[] = []
  $('blockquote, [class*="testimonial"], [class*="quote"]').each((_, el) => {
    const $q = $(el)
    const quote = $q.text().trim()
    quotes.push({ quote: `<p>${quote}</p>` })
  })

  // Find attribution cards with avatars
  const avatarCards = $('img[class*="rounded"]').closest('div')
  if (avatarCards.length) {
    const testimonialDefaults: Record<string, unknown>[] = []
    avatarCards.each((_, el) => {
      const $card = $(el)
      const img = $card.find('img').first()
      const name = $card.find('h4, strong, [class*="font-semibold"], [class*="font-bold"]').first().text().trim()
      const role = $card.find('p, span').last().text().trim()
      const quote = $card.find('p').first().text().trim()

      testimonialDefaults.push({
        name: name || 'Name',
        role: role || 'Title',
        image: img.attr('src') || '',
        quote: `<p>${quote || 'Testimonial text'}</p>`
      })
    })

    if (testimonialDefaults.length) {
      fields.push({
        type: 'items',
        name: 'Testimonials',
        default: testimonialDefaults,
        config: {
          fields: [
            { type: 'text', name: 'Name' },
            { type: 'text', name: 'Role' },
            { type: 'image', name: 'Image' },
            { type: 'wysiwyg', name: 'Quote' }
          ]
        }
      })
    }
  } else if (quotes.length === 1) {
    // Single testimonial
    fields.push({ type: 'wysiwyg', name: 'Quote', default: quotes[0].quote })
    fields.push({ type: 'text', name: 'Name', default: '' })
    fields.push({ type: 'text', name: 'Role', default: '' })
    fields.push({ type: 'image', name: 'Image', default: '' })
  }

  return $.html()
}

function extractCTAFields(html: string, section: SectionInfo, fields: Record<string, unknown>[]): string {
  const $ = cheerio.load(html)

  const h2 = $('h2, h3').first()
  if (h2.length) {
    fields.push({ type: 'text', name: 'Headline', default: h2.text().trim() })
    h2.empty().append('{{headline}}')
  }

  const p = $('p').first()
  if (p.length && p.text().trim().length > 20) {
    fields.push({ type: 'wysiwyg', name: 'Subheadline', default: `<p>${p.text().trim()}</p>` })
    p.replaceWith('<div class="body-md text-fg-muted max-w-3xl text-center text-pretty">{{{subheadline}}}</div>')
  }

  // Buttons
  const ctaButtons = $('a[class*="btn"], button[class*="btn"]').filter((_, el) => {
    const text = $(el).text().trim()
    return text.length > 0 && text.length < 40
  })
  if (ctaButtons.length) {
    const buttonDefaults: Record<string, unknown>[] = []
    ctaButtons.each((_, el) => {
      const label = $(el).text().trim()
      const href = $(el).attr('href') || '#'
      const style = $(el).attr('class')?.includes('outline') || $(el).attr('class')?.includes('ghost') ? 'ghost' : 'primary'
      buttonDefaults.push({ label, link: href, style })
    })

    fields.push({
      type: 'items',
      name: 'Buttons',
      default: buttonDefaults,
      config: {
        fields: [
          { type: 'text', name: 'Label' },
          { type: 'text', name: 'Link' },
          { type: 'select', name: 'Style', config: { selectOptions: [
            { key: 'Primary', value: 'primary' },
            { key: 'Secondary', value: 'secondary' },
            { key: 'Ghost', value: 'ghost' }
          ]}}
        ]
      }
    })

    const firstButton = ctaButtons.first()
    const container = firstButton.parent()
    container.replaceWith(`{{#if (length buttons)}}
      <div class="flex flex-wrap items-center justify-center gap-4">
        {{#each buttons}}
          {{> Button}}
        {{/each}}
      </div>
    {{/if}}`)
  }

  return $.html()
}

function extractAboutFields(html: string, section: SectionInfo, fields: Record<string, unknown>[], $sec: cheerio.CheerioAPI): string {
  const $ = cheerio.load(html)

  const h2 = $('h2, h3').first()
  if (h2.length) {
    fields.push({ type: 'text', name: 'Headline', default: h2.text().trim() })
    h2.empty().append('{{headline}}')
  }

  // Description paragraphs
  const paragraphs = $('p')
  const descriptions: string[] = []
  paragraphs.each((_, el) => {
    const text = $(el).text().trim()
    if (text.length > 30) descriptions.push(text)
  })
  if (descriptions.length) {
    fields.push({ type: 'wysiwyg', name: 'Description', default: descriptions.map(d => `<p>${d}</p>`).join('\n') })
  }

  // Image
  const img = $('img').first()
  if (img.length) {
    fields.push({ type: 'image', name: 'Image', default: img.attr('src') || '' })
    img.attr('src', '{{image}}')
  }

  return $.html()
}

function extractFooterFields(html: string, section: SectionInfo, fields: Record<string, unknown>[], $sec: cheerio.CheerioAPI): string {
  const $ = cheerio.load(html)

  // Tagline/description
  const tagline = $('p').first()
  if (tagline.length && tagline.text().trim().length > 20) {
    fields.push({ type: 'text', name: 'Tagline', default: tagline.text().trim() })
    tagline.empty().append('{{tagline}}')
  }

  // Copyright/fineprint
  const copyright = $('p').filter((_, el) => $(el).text().includes('©') || $(el).text().includes('copyright')).first()
  if (copyright.length) {
    fields.push({ type: 'text', name: 'Fineprint', default: copyright.text().trim() })
    copyright.empty().append('{{{fineprint}}}')
  }

  // Nav links
  const links: Record<string, unknown>[] = []
  $('a').each((_, el) => {
    const label = $(el).text().trim()
    const url = $(el).attr('href') || '#'
    if (label && label.length < 30 && !url.startsWith('mailto:')) {
      links.push({ label, url })
    }
  })

  if (links.length) {
    fields.push({
      type: 'items',
      name: 'Links',
      default: links.slice(0, 8),
      config: {
        fields: [
          { type: 'text', name: 'Label' },
          { type: 'text', name: 'Url' }
        ]
      }
    })
  }

  return $.html()
}

function extractNavbarFields(html: string, section: SectionInfo, fields: Record<string, unknown>[], $sec: cheerio.CheerioAPI): string {
  const $ = cheerio.load(html)

  // Logo/brand text
  const logo = $('a').first()
  if (logo.length) {
    const logoText = logo.text().trim()
    if (logoText) {
      fields.push({ type: 'text', name: 'Logo', default: logoText })
    }
  }

  // Nav links
  const links: Record<string, unknown>[] = []
  $('a').each((i, el) => {
    if (i === 0) return // skip logo
    const label = $(el).text().trim()
    const url = $(el).attr('href') || '#'
    if (label && label.length < 30) {
      links.push({ label, url })
    }
  })

  if (links.length) {
    fields.push({
      type: 'items',
      name: 'Links',
      default: links,
      config: {
        fields: [
          { type: 'text', name: 'Label' },
          { type: 'text', name: 'Url' }
        ]
      }
    })
  }

  return $.html()
}

function extractContentFields(html: string, section: SectionInfo, fields: Record<string, unknown>[]): string {
  const $ = cheerio.load(html)

  const h2 = $('h2, h3').first()
  if (h2.length) {
    fields.push({ type: 'text', name: 'Headline', default: h2.text().trim() })
    h2.empty().append('{{headline}}')
  }

  // Find subheading
  const h3 = $('h2, h3').eq(1)
  if (h3.length && h3.text().trim() !== h2?.text().trim()) {
    fields.push({ type: 'text', name: 'Subheading', default: h3.text().trim() })
    h3.empty().append('{{subheading}}')
  }

  // Paragraphs as description
  const paras: string[] = []
  $('p').each((_, el) => {
    const text = $(el).text().trim()
    if (text.length > 20) paras.push(text)
  })
  if (paras.length) {
    fields.push({ type: 'wysiwyg', name: 'Description', default: paras.map(p => `<p>${p}</p>`).join('\n') })
  }

  // Image
  const img = $('img').first()
  if (img.length) {
    fields.push({ type: 'image', name: 'Image', default: img.attr('src') || '' })
    img.attr('src', '{{image}}')
  }

  // Look for repeating children
  const containers = $('[class*="grid"], [class*="flex"]').filter((_, el) => $(el).children().length >= 3)
  if (containers.length) {
    const container = containers.first()
    const children = container.children()
    const itemDefaults: Record<string, unknown>[] = []

    children.each((i, el) => {
      const $child = $(el)
      const title = $child.find('h3, h4, strong').first().text().trim()
      const desc = $child.find('p').first().text().trim()
      if (title || desc) {
        itemDefaults.push({ headline: title, description: `<p>${desc}</p>` })
      }
    })

    if (itemDefaults.length >= 3) {
      fields.push({
        type: 'items',
        name: 'Items',
        default: itemDefaults,
        config: {
          fields: [
            { type: 'text', name: 'Headline' },
            { type: 'wysiwyg', name: 'Description' }
          ]
        }
      })

      container.empty().append(`\n        {{#each items}}
          <div class="flex flex-col gap-2">
            <h3 class="heading-sm text-fg font-semibold">{{headline}}</h3>
            <div class="body-sm text-fg-muted">{{{description}}}</div>
          </div>
        {{/each}}\n      `)
    }
  }

  return $.html()
}

function standardizeWrapper(html: string, section: SectionInfo): string {
  const $ = cheerio.load(html, { xml: false })

  // For navbar/footer, keep their own tag
  if (section.type === 'navbar' || section.type === 'footer') {
    return $.html()
  }

  // For other sections, ensure they're wrapped in a <section> with standard classes
  const root = $('body').children().first()
  if (!root.length) return html

  const tag = root.get(0)?.tagName
  if (tag === 'section') {
    // Ensure it has bg-base and py-16
    const cls = root.attr('class') || ''
    if (!cls.includes('bg-base') && !cls.includes('bg-panel') && !cls.includes('bg-brand')) {
      root.addClass('bg-base')
    }
    if (!cls.includes('py-')) {
      root.addClass('py-16')
    }
  }

  return $.html('body > *')
}

function cleanWhitespace(html: string): string {
  // Normalize excessive blank lines
  html = html.replace(/\n{3,}/g, '\n\n')
  // Trim trailing whitespace on lines
  html = html.split('\n').map(l => l.trimEnd()).join('\n')
  // Ensure final newline
  if (!html.endsWith('\n')) html += '\n'
  return html
}

// ─── 6. Detect partials ───

function detectPartials(blocks: BlockFile[]): BlockFile[] {
  // Check if any blocks use {{> Button}} — if so, generate a Button partial
  const hasButtons = blocks.some(b => b.html.includes('{{> Button}}'))
  const partials: BlockFile[] = []

  if (hasButtons) {
    partials.push({
      name: 'Button',
      html: `{{#switch style}}
  {{#case "secondary"}}
    <a href="{{link}}" class="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-brand/10 text-fg px-5 py-2.5 body-sm font-bold uppercase tracking-wider hover:bg-brand/15 transition">
      {{default label "Click Here"}}
    </a>
  {{/case}}
  {{#case "ghost"}}
    <a href="{{link}}" class="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-fg text-fg px-5 py-2.5 body-sm font-bold uppercase tracking-wider hover:bg-fg hover:text-base transition">
      {{default label "Click Here"}}
    </a>
  {{/case}}
  {{#otherwise}}
    <a href="{{link}}" class="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-brand text-on-brand px-5 py-2.5 body-sm font-bold uppercase tracking-wider hover:bg-base-alt transition">
      {{default label "Click Here"}}
    </a>
  {{/otherwise}}
{{/switch}}
`,
      json: {
        makeStudioFields: true,
        version: 1,
        fields: [
          { type: 'text', name: 'Label', default: 'Click Here' },
          { type: 'text', name: 'Link', default: '#' },
          {
            type: 'select', name: 'Style', default: 'primary',
            config: {
              selectOptions: [
                { key: 'Primary', value: 'primary' },
                { key: 'Secondary', value: 'secondary' },
                { key: 'Ghost', value: 'ghost' }
              ]
            }
          }
        ]
      }
    })
  }

  return partials
}

// ─── 7. Write theme files ───

function writeThemeFiles(
  outputDir: string,
  themeName: string,
  blocks: BlockFile[],
  partials: BlockFile[],
  colors: ColorMap,
  fonts: FontInfo
) {
  const blocksDir = path.join(outputDir, 'converted', 'blocks')
  const partialsDir = path.join(outputDir, 'converted', 'partials')

  fs.mkdirSync(blocksDir, { recursive: true })
  fs.mkdirSync(partialsDir, { recursive: true })

  // Write blocks
  for (const block of blocks) {
    fs.writeFileSync(path.join(blocksDir, `${block.name}.html`), block.html)
    fs.writeFileSync(path.join(blocksDir, `${block.name}.json`), JSON.stringify(block.json, null, 2) + '\n')
  }

  // Write partials
  for (const partial of partials) {
    fs.writeFileSync(path.join(partialsDir, `${partial.name}.html`), partial.html)
    fs.writeFileSync(path.join(partialsDir, `${partial.name}.json`), JSON.stringify(partial.json, null, 2) + '\n')
  }

  // Write theme.json
  const themeJson = buildThemeJson(colors, fonts)
  fs.writeFileSync(path.join(outputDir, 'theme.json'), JSON.stringify(themeJson, null, 2) + '\n')
}

function buildThemeJson(colors: ColorMap, fonts: FontInfo): Record<string, unknown> {
  const headingFont = fonts.heading
  const bodyFont = fonts.body

  // Build font list
  const fontEntries: Record<string, unknown>[] = [
    { family: headingFont, weight: 400, style: 'normal' },
    { family: bodyFont, weight: 400, style: 'normal' },
    { family: bodyFont, weight: 500, style: 'normal' },
    { family: bodyFont, weight: 600, style: 'normal' }
  ]

  // Build palette from colors
  const allColorValues = Object.values(colors).filter(c => c !== 'transparent')
  const sorted = [...new Set(allColorValues)].sort((a, b) => luminance(a) - luminance(b))

  return {
    fonts: fontEntries,
    systemColors: { ...colors },
    customColors: [],
    palette: {
      primary: {
        label: 'primary',
        colors: buildPaletteRow(colors.brand)
      },
      grays: {
        label: 'gray',
        colors: [
          colors['base-alt'],
          colors['fg-muted'],
          colors['fg-alt'],
          colors.border,
          colors['base-muted']
        ]
      }
    },
    headingTypography: {
      'heading-xl': {
        fontFamily: headingFont,
        fontWeight: 400,
        fontSize: 80,
        lineHeight: 80,
        letterSpacing: -2,
        mobileFontSize: 48,
        mobileLineHeight: 48
      },
      'heading-lg': {
        fontFamily: headingFont,
        fontWeight: 400,
        fontSize: 48,
        lineHeight: 48,
        letterSpacing: -1.2,
        mobileFontSize: 36,
        mobileLineHeight: 36
      },
      'heading-md': {
        fontFamily: headingFont,
        fontWeight: 400,
        fontSize: 36,
        lineHeight: 40,
        letterSpacing: -0.8,
        mobileFontSize: 28,
        mobileLineHeight: 32
      },
      'heading-sm': {
        fontFamily: bodyFont,
        fontWeight: 600,
        fontSize: 20,
        lineHeight: 28,
        letterSpacing: -0.3,
        mobileFontSize: 18,
        mobileLineHeight: 24
      },
      'heading-xs': {
        fontFamily: bodyFont,
        fontWeight: 600,
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: 0,
        mobileFontSize: 14,
        mobileLineHeight: 20
      }
    },
    bodyTypography: {
      'body-lg': {
        fontFamily: bodyFont,
        fontWeight: 400,
        fontSize: 18,
        lineHeight: 32,
        letterSpacing: 0
      },
      'body-md': {
        fontFamily: bodyFont,
        fontWeight: 400,
        fontSize: 16,
        lineHeight: 28,
        letterSpacing: 0
      },
      'body-sm': {
        fontFamily: bodyFont,
        fontWeight: 400,
        fontSize: 14,
        lineHeight: 24,
        letterSpacing: 0
      }
    },
    prose: {
      elements: {
        h1: { typographyClass: 'heading-xl', marginBottom: 1.5 },
        h2: { typographyClass: 'heading-lg', marginBottom: 1.25 },
        h3: { typographyClass: 'heading-md', marginBottom: 1 },
        h4: { typographyClass: 'heading-sm', marginBottom: 0.75 },
        h5: { typographyClass: 'heading-xs', marginBottom: 0.5 },
        h6: { typographyClass: 'heading-xs', marginBottom: 0.5 },
        p: { typographyClass: 'body-md', marginBottom: 1.25 },
        ul: { typographyClass: 'body-md', marginBottom: 1.25 },
        ol: { typographyClass: 'body-md', marginBottom: 1.25 }
      },
      lists: {
        listStyleType: 'disc',
        indent: 1.5,
        itemSpacing: 0.5,
        nestedIndent: 1.5
      },
      links: {
        color: 'accent',
        hoverColor: 'primary',
        underline: 'always'
      }
    }
  }
}

function buildPaletteRow(baseColor: string): string[] {
  const rgb = hexToRgb(baseColor)
  if (!rgb) return [baseColor, baseColor, baseColor, baseColor, baseColor]

  return [
    lighten(rgb, 0.3),
    lighten(rgb, 0.15),
    baseColor,
    darken(rgb, 0.3),
    darken(rgb, 0.5)
  ]
}

function lighten([r, g, b]: [number, number, number], amount: number): string {
  return rgbToHex(
    Math.min(255, Math.round(r + (255 - r) * amount)),
    Math.min(255, Math.round(g + (255 - g) * amount)),
    Math.min(255, Math.round(b + (255 - b) * amount))
  )
}

function darken([r, g, b]: [number, number, number], amount: number): string {
  return rgbToHex(
    Math.max(0, Math.round(r * (1 - amount))),
    Math.max(0, Math.round(g * (1 - amount))),
    Math.max(0, Math.round(b * (1 - amount)))
  )
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ─── Main export ───

export async function scrapeSite(options: {
  url: string
  themeName: string
  outputDir: string
}): Promise<ScrapeSiteResult> {
  const { url, themeName, outputDir } = options

  console.log(`\nScraping ${url} → theme "${themeName}"`)
  console.log('─'.repeat(60))

  // 1. Fetch
  const { html, $, cssText } = await fetchPage(url)

  // 2. Extract colors
  console.log('\nExtracting colors...')
  const { colors, allColors, cssColorMap } = extractColors(html, $, cssText)
  console.log(`  System colors:`)
  for (const [key, val] of Object.entries(colors)) {
    console.log(`    ${key}: ${val}`)
  }
  console.log(`  CSS color classes mapped: ${cssColorMap.size}`)

  // 3. Extract typography
  console.log('\nExtracting typography...')
  const fonts = extractTypography($, cssText)
  console.log(`  Heading font: ${fonts.heading}`)
  console.log(`  Body font: ${fonts.body}`)

  // 4. Detect sections
  console.log('\nDetecting sections...')
  const sections = detectSections(html, $)
  for (const s of sections) {
    console.log(`  ${s.name} (${s.type})${s.heading ? ': ' + s.heading.slice(0, 50) : ''}`)
  }

  // 5. Generate blocks
  console.log('\nGenerating blocks...')
  const blocks: BlockFile[] = []
  for (const section of sections) {
    const block = generateBlock(section, colors, cssColorMap, $)
    blocks.push(block)
    console.log(`  ${block.name}: ${block.json.fields ? (block.json.fields as unknown[]).length : 0} fields`)
  }

  // 6. Detect partials
  console.log('\nDetecting partials...')
  const partials = detectPartials(blocks)
  for (const p of partials) {
    console.log(`  ${p.name}`)
  }

  // 7. Write files
  console.log('\nWriting files...')
  writeThemeFiles(outputDir, themeName, blocks, partials, colors, fonts)

  const result: ScrapeSiteResult = {
    blocks: blocks.map(b => b.name),
    partials: partials.map(p => p.name),
    themeJson: path.join(outputDir, 'theme.json'),
    outputDir
  }

  console.log(`\nDone! Generated:`)
  console.log(`  ${blocks.length} blocks in ${path.join(outputDir, 'converted', 'blocks')}`)
  console.log(`  ${partials.length} partials in ${path.join(outputDir, 'converted', 'partials')}`)
  console.log(`  theme.json`)

  return result
}
