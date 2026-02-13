import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/make-studio'
const SITE_ID = '69865a04b6ff1329e6878d76'
const THEME_PATH = path.join(import.meta.dirname, '..', 'themes', 'oatmeal')

// oklch to hex conversion
function oklchToHex(L: number, C: number, h: number): string {
  // L is 0-1, C is chroma, h is hue in degrees
  // Step 1: OKLab from OKLCH
  const hRad = (h * Math.PI) / 180
  const a = C * Math.cos(hRad)
  const b = C * Math.sin(hRad)

  // Step 2: OKLab to linear sRGB via LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  // LMS to linear sRGB
  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bVal = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

  // Linear to sRGB gamma
  function gammaEncode(x: number): number {
    if (x <= 0.0031308) return 12.92 * x
    return 1.055 * Math.pow(x, 1 / 2.4) - 0.055
  }

  const toHex = (v: number) => {
    const clamped = Math.max(0, Math.min(1, gammaEncode(v)))
    return Math.round(clamped * 255).toString(16).padStart(2, '0')
  }

  return `#${toHex(r)}${toHex(g)}${toHex(bVal)}`
}

// Mist palette from oatmeal tailwind.css
const mist = {
  50:  oklchToHex(0.987, 0.002, 197.1),
  100: oklchToHex(0.963, 0.002, 197.1),
  200: oklchToHex(0.925, 0.005, 214.3),
  300: oklchToHex(0.872, 0.007, 219.6),
  400: oklchToHex(0.723, 0.014, 214.4),
  500: oklchToHex(0.560, 0.021, 213.5),
  600: oklchToHex(0.450, 0.017, 213.2),
  700: oklchToHex(0.378, 0.015, 216.0),
  800: oklchToHex(0.275, 0.011, 216.9),
  900: oklchToHex(0.218, 0.008, 223.9),
  950: oklchToHex(0.148, 0.004, 228.8),
}

console.log('Mist palette:')
for (const [key, val] of Object.entries(mist)) {
  console.log(`  ${key}: ${val}`)
}

// Build the theme object matching Make Studio format
const theme = {
  fonts: [
    { family: 'Instrument Serif', weight: 400, style: 'normal' },
    { family: 'Inter', weight: 400, style: 'normal' },
    { family: 'Inter', weight: 500, style: 'normal' },
    { family: 'Inter', weight: 600, style: 'normal' },
  ],
  systemColors: {
    'brand': mist[950],        // mist-950: primary buttons, dark accents
    'brand-hover': mist[800],  // mist-800: button hover
    'on-brand': '#ffffff',     // white text on brand
    'base': '#ffffff',         // white: main page background
    'base-muted': mist[50],    // mist-50: subtle section backgrounds
    'base-panel': mist[100],   // mist-100: card/panel backgrounds
    'fg': mist[950],           // mist-950: primary text
    'fg-muted': mist[600],     // mist-600: secondary/muted text
    'fg-subtle': mist[400],    // mist-400: subtle/hint text
    'border': mist[200],       // mist-200: standard borders
  },
  customColors: [],
  palette: {
    primary: {
      label: 'primary',
      colors: [mist[100], mist[300], mist[500], mist[700], mist[950]]
    },
    accent1: {
      label: 'accent-1',
      colors: [
        'rgb(206, 250, 254)',
        'rgb(103, 232, 249)',
        'rgb(7, 182, 212)',
        'rgb(13, 116, 144)',
        'rgb(22, 78, 99)'
      ]
    },
    accent2: {
      label: 'accent-2',
      colors: [
        'rgb(209, 250, 229)',
        'rgb(110, 231, 183)',
        'rgb(18, 185, 129)',
        'rgb(4, 120, 87)',
        'rgb(18, 78, 74)'
      ]
    },
    accent3: {
      label: 'accent-3',
      colors: [
        'rgb(254, 243, 199)',
        'rgb(251, 211, 76)',
        'rgb(245, 158, 12)',
        'rgb(180, 83, 10)',
        'rgb(120, 53, 15)'
      ]
    },
    grays: {
      label: 'gray',
      colors: [mist[100], mist[300], mist[500], mist[700], mist[900]]
    }
  },
  headingTypography: {
    'heading-xl': {
      fontFamily: 'Instrument Serif',
      fontWeight: 400,
      fontSize: 80,          // text-[5rem] = 80px
      lineHeight: 80,        // /20 = 5rem = 80px
      letterSpacing: -2,     // tracking-tight
      mobileFontSize: 48,    // text-5xl = 3rem = 48px
      mobileLineHeight: 48,  // /12 = 3rem = 48px
    },
    'heading-lg': {
      fontFamily: 'Instrument Serif',
      fontWeight: 400,
      fontSize: 36,           // text-4xl = 2.25rem ≈ 36px
      lineHeight: 44,
      letterSpacing: -1.2,
      mobileFontSize: 30,     // text-3xl = 1.875rem = 30px
      mobileLineHeight: 36,
    },
    'heading-md': {
      fontFamily: 'Instrument Serif',
      fontWeight: 400,
      fontSize: 30,           // text-3xl
      lineHeight: 36,
      letterSpacing: -0.8,
      mobileFontSize: 24,
      mobileLineHeight: 32,
    },
    'heading-sm': {
      fontFamily: 'Inter',
      fontWeight: 600,
      fontSize: 20,           // text-xl
      lineHeight: 28,
      letterSpacing: -0.3,
      mobileFontSize: 18,
      mobileLineHeight: 24,
    },
    'heading-xs': {
      fontFamily: 'Inter',
      fontWeight: 600,
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      mobileFontSize: 14,
      mobileLineHeight: 20,
    }
  },
  bodyTypography: {
    'body-lg': {
      fontFamily: 'Inter',
      fontWeight: 400,
      fontSize: 18,     // text-lg
      lineHeight: 32,   // /8 = 2rem = 32px
      letterSpacing: 0,
    },
    'body-md': {
      fontFamily: 'Inter',
      fontWeight: 400,
      fontSize: 16,     // text-base
      lineHeight: 28,   // /7 = 1.75rem = 28px
      letterSpacing: 0,
    },
    'body-sm': {
      fontFamily: 'Inter',
      fontWeight: 400,
      fontSize: 14,     // text-sm
      lineHeight: 24,
      letterSpacing: 0,
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
      ol: { typographyClass: 'body-md', marginBottom: 1.25 },
    },
    lists: {
      listStyleType: 'disc',
      indent: 1.5,
      itemSpacing: 0.5,
      nestedIndent: 1.5,
    },
    links: {
      color: 'accent',
      hoverColor: 'primary',
      underline: 'always',
    },
    customCSS: `blockquote {
  border-left: 3px solid ${mist[300]};
  padding-left: 1.5rem;
  margin: 1.5rem 0;
  font-style: italic;
  color: ${mist[600]};
}

pre {
  background: ${mist[100]};
  padding: 1rem;
  border-radius: 6px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.9em;
  overflow-x: auto;
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  border: 1px solid ${mist[200]};
}

pre code {
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
}

code:not(pre code) {
  background: ${mist[100]};
  padding: 0.15em 0.4em;
  border-radius: 3px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.9em;
}`
  },
  customCSS: `.prose {
  color: ${mist[600]};
}
.prose h1,
.prose h2,
.prose h3,
.prose h4 {
  color: ${mist[950]};
}`
}

async function main() {
  // Write theme.json to oatmeal theme directory
  const themeJsonPath = path.join(THEME_PATH, 'theme.json')
  fs.writeFileSync(themeJsonPath, JSON.stringify(theme, null, 2))
  console.log(`\nWrote ${themeJsonPath}`)

  // Update site in MongoDB
  await mongoose.connect(MONGO_URI)
  const Site = mongoose.models.Site || mongoose.model('Site', new mongoose.Schema({ theme: mongoose.Schema.Types.Mixed }))

  const result = await Site.findByIdAndUpdate(SITE_ID, { theme }, { new: true })
  if (result) {
    console.log(`\nUpdated site ${SITE_ID} theme`)
    console.log(`  Fonts: ${theme.fonts.map(f => f.family).join(', ')}`)
    console.log(`  Colors: ${Object.entries(theme.systemColors).map(([k, v]) => `${k}=${v}`).join(', ')}`)
  } else {
    console.error(`Site ${SITE_ID} not found`)
  }

  await mongoose.disconnect()
}

main().catch(console.error)
