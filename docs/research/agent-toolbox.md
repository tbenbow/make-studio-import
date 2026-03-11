# Agent Toolbox: Infrastructure for Block R&D

Everything the block-building agents need to do their work. What exists, what's missing, and what we should build.

The principle: **agents should have access to the same tools a skilled web developer would have on their machine.** Screenshot a block, process an image, generate a video thumbnail, analyze colors, compress assets, run a local dev server, check browser compatibility. If a human developer would reach for a tool to solve a problem, the agent should be able to reach for it too.

---

## What Exists Today

### Core Pipeline (Working)

| Tool | What It Does | How Agents Use It |
|------|-------------|-------------------|
| `block-screenshot.ts` | Sync → deploy → Playwright screenshot | Visual iteration loop. The heartbeat of block R&D. |
| `npm run sync` | Push local blocks/theme to API | Deploy changes after every edit |
| `npm run pull` | Download remote blocks to local files | Get canonical server-normalized templates |
| `npm run validate` | Check block structure + Handlebars syntax | Catch errors before syncing |
| `compose-site.ts` | 13-step site assembly from config | End-to-end site creation |
| `MakeStudioClient` | Full API for all Make Studio operations | Everything: blocks, pages, themes, deploys |

### Image Tools (Working)

| Tool | What It Does | How Agents Use It |
|------|-------------|-------------------|
| `search-pexels.ts` | Search + download stock images | Source images for sites |
| `generate-image.ts` | OpenAI gpt-image-1 generation | Custom images from prompts |
| `uploadFilesFromUrls` | Batch upload to R2, auto-WebP, auto-resize | Get images onto CDN |
| `sharp` (dependency) | Image resize, crop, format conversion | Available but underused |
| `playwright` (dependency) | Browser automation, screenshots | Screenshots, HTML-to-image |

### Reference & Documentation (Working)

| Tool | What It Does | How Agents Use It |
|------|-------------|-------------------|
| `docs/references/` | Gold-standard block examples | Template for new blocks |
| `docs/capabilities/*/guide.md` | Workflow guides | Step-by-step instructions |
| `docs/capabilities/*/learnings.md` | Accumulated knowledge | Avoid past mistakes |
| `docs/capabilities/blocks/checklist.md` | Block quality checklist | Pre-sync validation |

---

## What's Missing: The Gaps

### Gap 1: Image Processing Pipeline

Sharp is installed but agents only use it indirectly (via `uploadFilesFromUrls` which resizes to 2000px). There's no standalone image processing toolkit agents can call for:

**Color analysis** — Extract dominant colors, color palette, average brightness/contrast from an image. Critical for the image library color-matching and for the color harmonization pipeline.

**Color grading** — Apply `recomb` matrices, hue shifts, tint, LUTs to images. The entire Layer 3 from the image library research.

**Thumbnail generation** — Create contact sheets, thumbnail grids, resized variants. Needed for the image harvest review workflow.

**Format conversion** — WebP, AVIF, optimized JPEG/PNG at specific quality levels.

**Metadata extraction** — EXIF data, dimensions, aspect ratio, file size.

**What to build:**

```bash
# Extract dominant colors from an image
npx tsx scripts/image-tools.ts colors --input=photo.jpg
# Output: { dominant: "#2d5016", palette: ["#2d5016", "#8b7355", "#4a7c9b", "#f5f2ed", "#1a1a1a"], brightness: 0.42, contrast: 0.68 }

# Apply color grading
npx tsx scripts/image-tools.ts grade --input=photo.jpg --output=graded.jpg --target-palette="#2d5016,#8b7355" --intensity=0.6

# Generate contact sheet (grid of thumbnails)
npx tsx scripts/image-tools.ts contact-sheet --input=images/*.jpg --output=sheet.jpg --columns=5 --thumb-size=400

# Resize + optimize
npx tsx scripts/image-tools.ts optimize --input=photo.jpg --output=photo.webp --width=1200 --quality=85

# Batch process a directory
npx tsx scripts/image-tools.ts batch-grade --input=images/ --output=graded/ --target-palette="#2d5016,#8b7355"
```

**Implementation:** All of this is Sharp. No new dependencies needed. Just a script that wraps Sharp operations into agent-callable commands.

```typescript
// Color extraction with Sharp
const { dominant, channels } = await sharp(input).stats()
// dominant = { r, g, b } — most common color
// channels = [{ mean, stdev, min, max }] for R, G, B

// Color grading with recomb matrix
await sharp(input)
  .recomb([
    [1.1, 0.05, 0.0],   // boost reds slightly
    [0.0, 1.0, 0.0],    // greens unchanged
    [0.0, 0.05, 0.9],   // reduce blues
  ])
  .modulate({ saturation: 0.9, brightness: 1.02 })
  .toFile(output)

// Contact sheet
const thumbs = await Promise.all(
  files.map(f => sharp(f).resize(400, 400, { fit: 'cover' }).toBuffer())
)
await sharp({ create: { width: cols * 400, height: rows * 400, channels: 3 } })
  .composite(thumbs.map((t, i) => ({
    input: t,
    left: (i % cols) * 400,
    top: Math.floor(i / cols) * 400,
  })))
  .toFile(output)
```

---

### Gap 2: FFmpeg — Video & Animation Processing

FFmpeg is the Swiss army knife of media processing. It's not installed as a project dependency, but it's commonly available on dev machines (and trivially installable via Homebrew). For the block R&D agents, FFmpeg unlocks:

**Video thumbnail extraction** — Grab a frame from a video for preview/contact sheets. Essential for the video hero blocks.

**Video format conversion** — Convert to web-optimized MP4 (H.264/H.265), WebM (VP9/AV1). Compress stock videos for fast loading.

**GIF/animation creation** — Convert a sequence of screenshots into an animated GIF or MP4. Agents could capture 3-5 seconds of a block's animation and produce a preview clip. Way more useful than a static screenshot for evaluating animation quality.

**Video trimming** — Cut stock videos to the right length for hero backgrounds (5-15 second loops).

**Audio stripping** — Remove audio track from stock videos (hero videos must be silent).

**Poster frame generation** — Extract the best frame from a video for the `poster` attribute (what shows before autoplay kicks in).

**What to build:**

```bash
# Extract thumbnail from video
npx tsx scripts/video-tools.ts thumbnail --input=hero.mp4 --output=thumb.jpg --time=2.5

# Convert + compress for web
npx tsx scripts/video-tools.ts optimize --input=stock.mp4 --output=hero.mp4 --codec=h264 --quality=28 --max-width=1920

# Create animated preview of a block (capture 4 seconds of the deployed preview)
npx tsx scripts/video-tools.ts capture-animation --url=https://preview.makestudio.cc/... --output=preview.gif --duration=4 --fps=15

# Trim video to loop length
npx tsx scripts/video-tools.ts trim --input=stock.mp4 --output=loop.mp4 --start=5 --duration=10

# Strip audio
npx tsx scripts/video-tools.ts mute --input=stock.mp4 --output=silent.mp4

# Generate poster frame (best frame by sharpness/composition)
npx tsx scripts/video-tools.ts poster --input=hero.mp4 --output=poster.jpg
```

**The animation capture is the big one.** Right now, agents evaluate blocks from static screenshots. But the whole point of our hero blocks is animation — flow fields, glitch effects, scroll behaviors. A static screenshot can't show if the animation is smooth, if the timing is right, if the easing feels good.

With FFmpeg + Playwright:
1. Navigate to the deployed preview
2. Record the viewport for 4 seconds (Playwright can do screen recording)
3. FFmpeg converts to a compressed GIF or MP4
4. Agent (or human) reviews the animation clip instead of a still frame

This is a massive quality improvement for the R&D feedback loop.

**Implementation:**

```typescript
// Playwright screen recording
const page = await browser.newPage()
await page.goto(previewUrl)
await page.waitForTimeout(1000) // let animations start
const video = await page.video() // Playwright's built-in recording
await page.waitForTimeout(4000) // capture 4 seconds
await page.close()
const videoPath = await video.path()

// FFmpeg: convert to GIF for quick review
exec(`ffmpeg -i ${videoPath} -vf "fps=15,scale=800:-1" -loop 0 ${outputGif}`)

// FFmpeg: convert to optimized MP4 for storage
exec(`ffmpeg -i ${videoPath} -c:v libx264 -crf 28 -preset fast -an ${outputMp4}`)
```

**Pexels video integration:**

Pexels also has a video API. The `search-pexels.ts` script currently only handles photos. Extending it to search and download videos would unlock the video hero blocks:

```bash
# Search Pexels for stock videos
npx tsx scripts/search-pexels.ts --query="ocean waves aerial" --type=video --out=videos/ --count=3
```

---

### Gap 3: Local Design & Generation Tools

These are tools the AI can run locally to generate or manipulate design assets without calling external APIs. Zero cost, zero latency, no API keys needed.

#### SVG Generation & Manipulation

Agents building geometric heroes, icon compositions, and generative art blocks need to create and manipulate SVGs programmatically.

**What's available:** Node.js can generate SVG as strings (it's just XML). No library strictly needed, but helpers would speed things up.

**What to build:**

```bash
# Generate a pattern SVG (dots, lines, grid, waves, topography)
npx tsx scripts/svg-tools.ts pattern --type=dot-grid --width=1200 --height=800 --dot-size=3 --spacing=40 --color="#2d5016" --output=pattern.svg

# Generate a noise/flow field SVG
npx tsx scripts/svg-tools.ts noise --width=1200 --height=800 --scale=0.005 --octaves=4 --output=noise.svg

# Optimize SVG (remove unnecessary attributes, minify)
npx tsx scripts/svg-tools.ts optimize --input=raw.svg --output=clean.svg

# Convert SVG to PNG at specific resolution (Sharp handles this)
npx tsx scripts/image-tools.ts rasterize --input=pattern.svg --output=pattern.png --width=2400
```

Libraries to consider:
- **svg.js** or just string templates — SVG generation
- **simplex-noise** — Perlin/simplex noise for generative patterns
- **SVGO** — SVG optimization (strip metadata, minify paths)

#### CSS/HTML to Image

Sometimes agents need to render an HTML/CSS snippet to an image without deploying to Make Studio. For testing a CSS gradient, checking a font pairing, previewing a color palette.

**Already possible with Playwright:**

```typescript
// Render arbitrary HTML to image
const page = await browser.newPage()
await page.setContent(`
  <div style="width: 1200px; height: 600px; background: linear-gradient(135deg, #2d5016, #8b7355);">
    <h1 style="font-family: 'Space Grotesk'; color: white; font-size: 64px; padding: 80px;">
      Test Headline
    </h1>
  </div>
`)
await page.screenshot({ path: 'test.png' })
```

**What to build:**

```bash
# Render an HTML snippet to image (for quick visual testing)
npx tsx scripts/render-html.ts --input=test.html --output=test.png --width=1200 --height=800

# Render a color palette preview
npx tsx scripts/render-html.ts --palette="#2d5016,#8b7355,#4a7c9b,#f5f2ed,#1a1a1a" --output=palette.png

# Render a font preview
npx tsx scripts/render-html.ts --font="Space Grotesk" --text="The Quick Brown Fox" --output=font-preview.png

# Render a block template locally (with sample data, no deploy needed)
npx tsx scripts/render-block.ts --theme=block-ingress --block=HeroV2 --output=local-render.png
```

The last one — **local block rendering** — is huge. Right now the iteration loop is: edit → sync to API → deploy preview → screenshot. That's ~2 minutes. A local render that compiles the Handlebars template with the theme's CSS and renders via Playwright would take ~5 seconds. The API deploy step would only be needed for final verification.

```typescript
// Local block render
const template = readFileSync('BlockName.html', 'utf-8')
const fields = JSON.parse(readFileSync('BlockName.json', 'utf-8'))
const theme = JSON.parse(readFileSync('theme.json', 'utf-8'))

// Compile Handlebars with defaults
const compiled = Handlebars.compile(template)
const html = compiled(extractDefaults(fields))

// Wrap in full page with theme CSS
const fullPage = wrapWithTheme(html, theme) // generates CSS from theme tokens

// Render with Playwright
await page.setContent(fullPage)
await page.screenshot({ path: 'render.png' })
```

This would **10x the iteration speed** for block R&D agents. 30 experiments/hour becomes 300.

#### Font Tools

Agents generating themes need to select and preview fonts. Google Fonts has 1,500+ families. The AI needs to:

- **Browse/search fonts** by category (serif, sans-serif, display, handwriting, monospace)
- **Preview font pairings** — render a heading + body combo to an image
- **Check font weights** — does this font family have the weights we need (400, 500, 700)?
- **Download fonts locally** — for local rendering (Playwright can load Google Fonts via URL)

```bash
# Search Google Fonts
npx tsx scripts/font-tools.ts search --query="geometric sans-serif" --count=10
# Output: Space Grotesk, Inter, Outfit, Plus Jakarta Sans, ...

# Preview a font pairing
npx tsx scripts/font-tools.ts preview --heading="Space Grotesk:700" --body="Inter:400" --output=pairing.png

# List available weights for a font
npx tsx scripts/font-tools.ts weights --font="Space Grotesk"
# Output: 300, 400, 500, 600, 700

# Download a font for local use
npx tsx scripts/font-tools.ts download --font="Space Grotesk" --weights=400,500,700 --output=fonts/
```

The Google Fonts API is free and doesn't require authentication. The font metadata (categories, weights, popularity) can be cached locally.

#### Color Tools

Agents need color manipulation beyond what Sharp provides for images. Theme generation, palette creation, contrast checking, color harmony.

```bash
# Generate a palette from a base color
npx tsx scripts/color-tools.ts palette --base="#2d5016" --mode=analogous --count=5
# Output: #2d5016, #3d6b1f, #1a3b0d, #4a7c2d, #5b8f3e

# Check contrast ratio (WCAG)
npx tsx scripts/color-tools.ts contrast --fg="#ffffff" --bg="#2d5016"
# Output: 7.2:1 (AAA pass)

# Generate theme system colors from a brand color
npx tsx scripts/color-tools.ts theme --brand="#2d5016" --mode=light
# Output: { base: "#fafaf8", fg: "#1a1a1a", brand: "#2d5016", ... }

# Extract palette from an image
npx tsx scripts/color-tools.ts extract --input=reference.jpg --count=6
# Output: ["#2d5016", "#8b7355", "#4a7c9b", "#f5f2ed", "#1a1a1a", "#c4a882"]

# Map source colors to target palette (for color grading)
npx tsx scripts/color-tools.ts map --source="#ff6b35,#004e98,#ffd166" --target="#2d5016,#8b7355,#f5f2ed"
# Output: recomb matrix + modulate params for Sharp
```

Libraries:
- **chroma.js** — Color manipulation, palette generation, contrast calculation
- **culori** — Modern alternative, smaller, more features
- Pure math works too — HSL conversion, WCAG contrast formula

---

### Gap 4: Browser & Compatibility Testing

Agents build blocks that need to work across browsers and devices. Currently, screenshots are desktop-only at 1440×900.

**What to build:**

```bash
# Screenshot at multiple viewport sizes
npx tsx scripts/block-screenshot.ts --theme=block-ingress --block=HeroV2 --viewports=mobile,tablet,desktop
# Outputs: render-N-mobile.png (375x812), render-N-tablet.png (768x1024), render-N-desktop.png (1440x900)

# Check for CSS feature support requirements
npx tsx scripts/compat-check.ts --block=HeroV2
# Output: "Uses scroll-timeline (78% support), mix-blend-mode (97% support), backdrop-filter (95% support)"
# "Recommendation: add fallback for scroll-timeline"
```

Multi-viewport screenshots are the quick win. The agent builds a hero block, screenshots at 3 sizes, and can immediately see if mobile is broken. Right now it deploys, checks desktop, and mobile bugs only surface during human review.

**Playwright already supports this** — just need to call `page.setViewportSize()` before the screenshot:

```typescript
const viewports = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
}

for (const [name, size] of Object.entries(viewports)) {
  await page.setViewportSize(size)
  await page.screenshot({ path: `render-${name}.png` })
}
```

---

### Gap 5: Performance & Quality Analysis

Agents should be able to measure the quality of what they've built, not just see it.

```bash
# Measure block performance (load time, paint metrics, JS execution time)
npx tsx scripts/perf-check.ts --url=https://preview.makestudio.cc/... --block=HeroV2
# Output: { firstPaint: 120, lcp: 340, cls: 0.02, jsExecTime: 45, totalTransfer: 280 }
# "Block loads in 340ms, 280KB total transfer. JS execution: 45ms. CLS: 0.02 (good)."

# Check accessibility basics
npx tsx scripts/a11y-check.ts --url=https://preview.makestudio.cc/...
# Output: { contrastIssues: 2, missingAlt: 0, missingLabels: 1, headingOrder: "ok" }

# Bundle size analysis (for blocks that load external libraries)
npx tsx scripts/bundle-check.ts --libs="three@0.160.0,embla-carousel@8.0.0"
# Output: { "three": "614KB (187KB gzipped)", "embla-carousel": "12KB (3.8KB gzipped)" }
```

Playwright has built-in performance APIs:

```typescript
const metrics = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0]
  const paint = performance.getEntriesByType('paint')
  return {
    domContentLoaded: nav.domContentLoadedEventEnd,
    firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
    transferSize: nav.transferSize,
  }
})
```

---

### Gap 6: Animation Recording & Review

This is the big one from the FFmpeg section that deserves its own focus. Static screenshots fundamentally can't evaluate animated blocks. The R&D agents need to see motion.

**The dream workflow:**

```
1. Agent edits CanvasHeroFlowField template
2. Agent runs: npx tsx scripts/block-record.ts --theme=block-ingress --block=CanvasHeroFlowField --duration=5
3. Script:
   a. Syncs block to API
   b. Deploys preview
   c. Opens Playwright browser
   d. Waits 1s for initialization
   e. Records 5 seconds of viewport video
   f. Converts to GIF (for quick review) + MP4 (for archival)
   g. Also captures a static screenshot at the 2-second mark (best frame)
4. Agent reviews the GIF — can see if particles are flowing, if speed is right,
   if the animation is smooth or janky
5. Human reviews the GIF too — way faster than opening a preview URL
```

This changes the feedback signal from "does it look good in a still frame?" to "does it *feel* good in motion?" That's the difference between a block that looks interesting and a block that actually delivers the wow factor.

**For the human review tool (from taste loop research):**
Instead of showing a static screenshot in the CLI or web gallery, show an auto-playing GIF. The reviewer sees the animation, reacts in 3 seconds, hits `y` or `n`. Same fast review loop, but 10x more information per review.

---

### Gap 7: Template Authoring Helpers

Agents write a lot of Handlebars templates. Some common tasks could be automated.

```bash
# Scaffold a new block from a category template
npx tsx scripts/scaffold-block.ts --category=hero --variant=centered --name=HeroV3
# Creates: HeroV3.html (template with standard structure) + HeroV3.json (fields with defaults)

# Validate Handlebars syntax without deploying
npx tsx scripts/check-template.ts --file=themes/block-ingress/converted/blocks/HeroV2.html
# Output: "Valid. References: {{headline}}, {{subheadline}}, {{#each buttons}}, {{> Button}}"
# "Warning: {{description}} used but no field with slug 'description' found in HeroV2.json"

# List all field references in a template (what the template expects)
npx tsx scripts/check-template.ts --file=HeroV2.html --list-fields
# Output: headline (text), subheadline (wysiwyg), buttons (items: label, link, style), badge (text, optional)

# Diff a block's template against the server-normalized version
npx tsx scripts/check-template.ts --file=HeroV2.html --compare-server --theme=block-ingress
```

The template-field cross-validation is particularly useful. The #1 bug in block construction is a mismatch between the template variables and the field definitions — the template references `{{description}}` but the field is named "Body" (which becomes `{{body}}`). Catching this before sync saves a full iteration cycle.

---

### Gap 8: AI Vision Analysis

Agents currently evaluate blocks by looking at screenshots. But the agent's vision evaluation could be structured and cached.

```bash
# Analyze a block screenshot for quality issues
npx tsx scripts/analyze-block.ts --render=iterations/HeroV2/render-1.png --source=iterations/HeroV2/source.png
# Output: {
#   textReadability: "good" | "poor" — is the headline readable over the effect?
#   colorHarmony: "good" | "off" — do the colors match the theme?
#   layoutBalance: "good" | "cramped" | "empty" — is the spacing right?
#   mobileReadiness: "likely-ok" | "needs-check" — any obvious desktop-only patterns?
#   fidelityScore: 0.82 — how close to the source screenshot (if converting)
#   issues: ["headline contrast low over gradient", "bottom padding too tight"]
# }
```

This isn't a replacement for human taste, but it's a filter. If the automated analysis says "headline contrast low," the agent can fix it before the human ever sees it. That means fewer obvious failures in the review queue, which means the human spends time on taste judgments, not catching basic errors.

**Implementation:** Call the Claude API with the screenshot(s) and a structured evaluation prompt. Cache the result alongside the screenshot.

---

## Tool Priority: What to Build First

| Priority | Tool | Impact | Effort |
|----------|------|--------|--------|
| **1** | **Local block rendering** | 10x iteration speed (bypass deploy) | Medium — Handlebars compile + theme CSS + Playwright |
| **2** | **Multi-viewport screenshots** | Catch mobile bugs early | Easy — already in Playwright, just viewport sizes |
| **3** | **Animation recording** | Evaluate motion, not just stills | Medium — Playwright recording + FFmpeg conversion |
| **4** | **Image color analysis** | Powers the image library + color matching | Easy — Sharp `.stats()` + palette extraction |
| **5** | **Color tools** | Theme generation, contrast checking, palette creation | Easy — pure math or chroma.js |
| **6** | **Contact sheet generation** | Image harvest review workflow | Easy — Sharp composite |
| **7** | **Template-field validation** | Catch mismatches before sync | Easy — Handlebars parse + field name comparison |
| **8** | **Video tools (FFmpeg)** | Video hero blocks, stock video processing | Medium — FFmpeg wrapper |
| **9** | **SVG generation** | Geometric/generative hero blocks | Medium — templates + noise library |
| **10** | **Font search/preview** | Theme generation | Easy — Google Fonts API + Playwright render |
| **11** | **AI vision analysis** | Automated quality filter | Medium — Claude API integration |
| **12** | **Performance analysis** | Ensure blocks are fast | Easy — Playwright performance API |

### The Big Three

If we build only three things, build these:

1. **Local block rendering** — Cuts the iteration cycle from ~2 minutes (sync → deploy → screenshot) to ~5 seconds (compile → render → screenshot). At 300 iterations/hour instead of 30, the R&D agents produce 10x more experiments per session.

2. **Animation recording** — The blocks we're most excited about (generative art, glitch effects, scroll-driven heroes) are ALL about motion. You can't evaluate them from a still frame. GIF recording turns the review workflow from "guess if the animation is good" to "see if the animation is good."

3. **Multi-viewport screenshots** — Mobile breakage is the #1 source of "discard" in the review loop. Catching it at screenshot time means fewer wasted iterations and fewer disappointing human reviews.

Everything else is valuable but these three fundamentally change the R&D velocity.

---

## Infrastructure Setup

### What's Already Installed

```json
// package.json dependencies (relevant ones)
{
  "sharp": "^0.34.5",           // Image processing ✓
  "playwright": "^1.58.2",      // Browser automation ✓
  "@anthropic-ai/sdk": "^0.78", // Claude API ✓
  "openai": "^6.22.0",          // Image generation ✓
  "@aws-sdk/client-s3": "^3.993" // R2 upload ✓
}
```

### What Needs Installing

```bash
# FFmpeg (system-level, not npm)
brew install ffmpeg

# Optional: font tools
# Google Fonts metadata can be fetched via API, no dependency needed

# Optional: color manipulation
npm install chroma-js
# OR: implement the handful of color functions we need (HSL conversion,
# contrast ratio, palette generation) — they're each ~20 lines of math

# Optional: SVG optimization
npm install svgo

# Optional: noise generation for generative art
npm install simplex-noise

# Optional: Handlebars (for local rendering — may already be available
# if Make Studio's compiler can be imported)
npm install handlebars
```

### Environment Variables (Already Set)

```bash
MAKE_STUDIO_URL=       # API endpoint ✓
MAKE_STUDIO_TOKEN=     # Auth token ✓
MAKE_STUDIO_SITE=      # Target site ID ✓
PEXELS_API_KEY=        # Image search ✓
OPENAI_API_KEY=        # Image generation ✓
```

### What Might Be Needed

```bash
# Google Fonts API key (free, for font metadata)
GOOGLE_FONTS_API_KEY=

# Stability AI (for advanced image retouching, Layer 4)
STABILITY_API_KEY=
```

---

## The Agent's Ideal Workflow

With all tools in place, the block R&D agent's iteration loop looks like this:

```
1. EDIT block template + fields (5 seconds)

2. LOCAL RENDER (5 seconds)
   npx tsx scripts/render-block.ts --theme=block-ingress --block=HeroV2 \
     --viewports=desktop,mobile --output=iterations/HeroV2/

   → desktop.png + mobile.png (no deploy, no API calls)

3. SELF-EVALUATE (3 seconds)
   Agent looks at the renders:
   - Desktop: headline readable? Colors right? Effect visible?
   - Mobile: layout intact? Fallback working? Not broken?

4. If obvious issues → fix and go back to step 1 (10-second loop)

5. FULL DEPLOY + RECORD (when self-eval passes, ~90 seconds)
   npx tsx scripts/block-record.ts --theme=block-ingress --block=HeroV2 \
     --duration=4 --viewports=desktop,mobile

   → deploy to API
   → desktop-animation.gif + mobile-animation.gif
   → desktop-screenshot.png + mobile-screenshot.png

6. LOG to results.tsv as "pending-review"

7. NEXT EXPERIMENT (don't wait for human)
```

Steps 1-4 are a **10-second inner loop** — the agent can try 360 variations per hour on local rendering alone. Step 5 is the expensive outer loop (~90 seconds) that produces the artifacts for human review.

The agent self-selects which experiments make it to the outer loop. Maybe it tries 20 local variations and only promotes 3 to full deploy+record. The human only sees the best 3.

---

## Discussion Log

- **2026-03-10**: Initial research. Inventoried existing tools, identified 8 gaps (image processing, FFmpeg, local design tools, browser testing, performance analysis, animation recording, template helpers, AI vision). Prioritized local block rendering + animation recording + multi-viewport screenshots as the Big Three. Defined the 10-second inner loop / 90-second outer loop agent workflow.
