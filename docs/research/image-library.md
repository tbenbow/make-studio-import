# Curated Image Library Research

Building a categorized, taste-filtered image library that the AI draws from when building sites. No more Chinese fishermen on a Texas bass fishing tournament website.

---

## The Problem

When the AI builds a site, it needs images. Current options:

1. **Pexels search** — Fast, free, but quality is hit-or-miss. Search "fishing" and you get stock photos from every culture, context, and quality level. The AI can't tell that a photo of fly fishing in Montana fits a Southern bass tournament but a photo of ice fishing in Siberia doesn't.

2. **AI-generated images** — DALL-E/Midjourney. Can be on-brand but often looks obviously AI-generated. Slow. Costs money per image. Hard to get right in one shot.

3. **No images** — Placeholder boxes. Looks unfinished. Hard for the client to visualize the site.

The core issue: **image selection requires cultural context and aesthetic judgment** that keyword search doesn't capture. "Wedding" returns 50,000 images on Pexels, but only a fraction match the vibe of a specific wedding photography site — rustic barn weddings vs. black-tie ballroom vs. beach elopement vs. South Asian ceremony.

## The Idea

Build a **curated image library** organized by categories and sub-categories. Each category is a collection of images that have been:

1. **Harvested** — AI searches Pexels (and potentially other free sources) for a category
2. **AI-filtered** — AI reviews the contact sheet and removes obvious misfits (wrong culture, low quality, off-topic, watermarked, overly staged)
3. **Human-reviewed** — You scroll through and remove anything that doesn't fit. Fast: just click the bad ones.
4. **Stored** — Images saved to our own storage (cheap) with metadata: category, subcategory, mood, colors, orientation, source URL

When the AI builds a site, instead of searching Pexels in real-time, it pulls from the curated library. The images are pre-vetted. They fit.

---

## Category Structure

Categories should map to the business types and content needs we identified in the functional systems research. Each category has subcategories that capture different vibes within the same topic.

### Tier 1: Business Type Categories

These map directly to the intake interview — when the AI knows the business type, it knows which image categories to pull from.

#### Wedding & Events
- `wedding/ceremony` — Ceremonies, vows, altar shots, officiant
- `wedding/reception` — Receptions, tables, dancing, toasts, cake
- `wedding/portraits` — Couple portraits, bridal, groom prep
- `wedding/details` — Rings, flowers, invitations, shoes, decor
- `wedding/venue` — Venues, barns, churches, gardens, ballrooms
- `wedding/candid` — Candid moments, laughter, tears, embraces

#### Food & Restaurant
- `restaurant/interior` — Restaurant interiors, ambiance, decor, lighting
- `restaurant/plated` — Plated dishes, food photography, overhead shots
- `restaurant/cooking` — Kitchen, chefs, cooking process, flames
- `restaurant/drinks` — Cocktails, wine, coffee, bar shots
- `restaurant/exterior` — Storefronts, patios, signage, street view
- `restaurant/people` — Diners, servers, communal dining, celebrations

#### Fitness & Wellness
- `fitness/training` — Gym workouts, lifting, running, group classes
- `fitness/yoga` — Yoga poses, studios, meditation, mindfulness
- `fitness/outdoor` — Outdoor fitness, hiking, trail running, cycling
- `fitness/portraits` — Trainer portraits, athlete shots, action poses
- `fitness/equipment` — Equipment, gym interiors, studio spaces
- `fitness/nutrition` — Healthy food, meal prep, smoothies

#### Technology & SaaS
- `tech/workspace` — Modern offices, desks, monitors, keyboards
- `tech/team` — Tech teams collaborating, whiteboard sessions, standups
- `tech/abstract` — Abstract tech imagery, circuits, data visualization, networks
- `tech/devices` — Laptops, phones, tablets in context
- `tech/code` — Code on screens, IDE shots, terminal
- `tech/product` — Product screenshots, dashboards, UI mockups

#### Real Estate & Architecture
- `realestate/exterior` — House exteriors, buildings, street views
- `realestate/interior` — Living rooms, kitchens, bedrooms, bathrooms
- `realestate/luxury` — High-end properties, pools, views, penthouses
- `realestate/commercial` — Office spaces, retail, warehouses
- `realestate/aerial` — Drone shots, neighborhood views, cityscapes
- `realestate/details` — Hardware, fixtures, finishes, materials

#### Outdoor & Adventure
- `outdoor/fishing` — Bass fishing, fly fishing, lake/river scenes, boats, catches
- `outdoor/hunting` — Hunting, wildlife, camouflage, dawn/dusk landscapes
- `outdoor/camping` — Campfires, tents, starry skies, forest
- `outdoor/water` — Kayaking, surfing, sailing, beaches, ocean
- `outdoor/mountain` — Hiking, climbing, mountain vistas, trails
- `outdoor/winter` — Skiing, snowboarding, snow landscapes, lodges

#### Creative & Design
- `creative/studio` — Design studios, art supplies, workspaces
- `creative/process` — Sketching, painting, crafting, hands at work
- `creative/typography` — Letterpress, signage, type specimens
- `creative/photography` — Cameras, darkrooms, editing, behind the scenes
- `creative/portfolio` — Flat lays, mockups, presentation contexts
- `creative/abstract` — Textures, patterns, color studies, abstract art

#### Professional Services
- `professional/office` — Law offices, consulting rooms, conference tables
- `professional/meeting` — Client meetings, handshakes, presentations
- `professional/team` — Professional headshots, team photos, group shots
- `professional/documents` — Contracts, paperwork, signing, legal
- `professional/cityscape` — City skylines, downtown, financial districts

#### Education & Nonprofit
- `education/classroom` — Classrooms, lectures, workshops, whiteboards
- `education/students` — Students studying, campus life, graduation
- `education/books` — Libraries, books, reading, learning
- `nonprofit/community` — Community events, volunteering, charity
- `nonprofit/nature` — Environmental, sustainability, green initiatives
- `nonprofit/people` — Diverse people, stories, portraits of impact

#### Beauty & Fashion
- `beauty/portraits` — Beauty shots, makeup, skincare, close-ups
- `beauty/products` — Product flat lays, packaging, bottles, swatches
- `beauty/salon` — Salon interiors, styling, treatments
- `fashion/editorial` — Editorial fashion photography, poses, styling
- `fashion/street` — Street style, casual fashion, urban context
- `fashion/retail` — Retail spaces, racks, displays, shopping

### Tier 2: Functional Categories

These aren't business-specific — they're content-type-specific. Every business might need some of these.

#### People
- `people/headshots` — Professional headshots, neutral backgrounds
- `people/casual` — Casual portraits, environmental portraits
- `people/diverse-group` — Groups of diverse people, teams, communities
- `people/working` — People at work, various industries
- `people/lifestyle` — Lifestyle shots, daily life, authentic moments

#### Backgrounds & Textures
- `bg/nature` — Nature backgrounds suitable for text overlay
- `bg/abstract` — Abstract textures, gradients, blurs
- `bg/urban` — Urban textures, walls, concrete, architecture
- `bg/paper` — Paper textures, fabric, natural materials
- `bg/dark` — Dark backgrounds for light text overlay
- `bg/aerial` — Aerial/drone shots suitable for backgrounds

#### Icons & Objects
- `objects/tech` — Gadgets, devices, flat lay arrangements
- `objects/food` — Ingredients, single items, overhead shots
- `objects/tools` — Tools, equipment, workshop items
- `objects/nature` — Plants, flowers, leaves, stones, natural objects
- `objects/stationery` — Pens, notebooks, desk items, branding mockups

---

## The Harvesting Loop

### Phase 1: AI Harvests

The AI searches Pexels for a category. It uses multiple search queries per subcategory to get variety:

```
Category: outdoor/fishing
Queries:
  - "bass fishing lake"
  - "fishing boat river"
  - "caught fish trophy"
  - "fisherman casting rod"
  - "fishing tournament"
  - "dawn lake fishing"
  - "fishing tackle bait"
  - "largemouth bass"
```

For each query, fetch 20-40 results. Deduplicate by Pexels photo ID. Download medium-resolution versions (not full-res — save bandwidth, we can always fetch full-res later via the Pexels URL).

Target: **80-150 raw images per subcategory** before filtering.

### Phase 2: AI Self-Review (Contact Sheet Analysis)

Before the human sees anything, the AI reviews the batch. This is a vision task — show the AI a grid of thumbnails (contact sheet) and ask it to flag images that don't belong.

```
Prompt: "You are reviewing images for the category 'outdoor/fishing'
for use on American bass fishing tournament websites.

Flag any images that:
- Show a clearly different cultural context than American recreational fishing
- Are low quality, blurry, or poorly composed
- Are obviously watermarked or have text overlays
- Show a different activity (not fishing)
- Are too generic/stocky (obviously posed, white background)
- Are duplicates or near-duplicates of other images in the set

For each flagged image, give a one-line reason."
```

The AI can do this efficiently because it's reviewing a contact sheet (grid of thumbnails), not individual images. 20-30 images per sheet. The AI flags 20-40% as misfits.

**Important:** The AI reviews the contact sheet as a *composed image* — it sees all thumbnails at once, which lets it judge relative fit. An image that looks fine in isolation might look obviously wrong when you see it next to 20 other fishing images that are all American bass fishing and this one is deep-sea tuna fishing.

### Phase 3: Human Review

You see the remaining images (post-AI-filter) in a scrollable gallery. Click to remove. No forms, no ratings — just remove the ones that don't fit.

```
┌─────────────────────────────────────────────────────┐
│  Image Harvest Review — outdoor/fishing              │
│  67 images (AI removed 43 of 110)                    │
│                                                      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │
│  │    │ │    │ │ ██ │ │    │ │    │ │ ██ │ │    │ │
│  │    │ │    │ │ ██ │ │    │ │    │ │ ██ │ │    │ │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │
│  │    │ │    │ │    │ │    │ │ ██ │ │    │ │    │ │
│  │    │ │    │ │    │ │    │ │ ██ │ │    │ │    │ │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ │
│                                                      │
│  Click to remove · [Save] when done                  │
│  ██ = removed (3 so far)                             │
└─────────────────────────────────────────────────────┘
```

Removed images go into a `rejected` list — this becomes training data for the AI's next harvest. "You rejected these last time — here's what they look like. Don't fetch similar ones."

### Phase 4: Store & Index

Approved images are stored with metadata:

```json
{
  "id": "img_a1b2c3d4",
  "source": "pexels",
  "sourceId": "12345678",
  "sourceUrl": "https://www.pexels.com/photo/12345678/",
  "downloadUrl": "https://images.pexels.com/photos/12345678/pexels-photo-12345678.jpeg",
  "category": "outdoor/fishing",
  "orientation": "landscape",
  "dominantColors": ["#2d5016", "#8b7355", "#4a7c9b"],
  "mood": "energetic",
  "width": 4000,
  "height": 2667,
  "photographer": "John Doe",
  "license": "pexels",
  "addedAt": "2026-03-10",
  "harvestBatch": "fishing-mar10"
}
```

### Storage Strategy

Two options:

**Option A: Reference-only (cheapest)**
Store only the metadata + Pexels URL. When the AI builds a site, it uses the Pexels download URL directly (or uploads to R2 at that point). No storage cost. Risk: Pexels could remove the image.

**Option B: Cache locally (more reliable)**
Download and store medium-res versions (~200KB each). 300 images per subcategory × 50 subcategories = 15,000 images × 200KB = ~3GB. Trivial storage cost. Full-res fetched from Pexels URL when actually used on a site.

**Recommendation: Option B.** 3GB is nothing. Having the images locally means the contact sheet review works offline, the AI can re-analyze them anytime, and we don't depend on Pexels availability. When an image is actually used on a site, fetch full-res from Pexels and upload to R2 via the existing `uploadFilesFromUrls` pipeline.

---

## How the AI Uses the Library

When building a site, the AI doesn't search Pexels. It queries the curated library:

```
Business: Bass fishing tournament in East Texas
Category: outdoor/fishing
Subcategories: prioritize bass-specific, lake scenes, tournament vibes
Mood: energetic, competitive, American
Orientation: need 1 landscape (hero), 3 landscape (features), 4 any (gallery)

Library returns: 12 best-fit images, ranked by relevance
AI selects: 8 for the site
```

The selection criteria:
1. **Category match** — Must be in the right category
2. **Color harmony** — Image dominant colors should complement the site's theme colors
3. **Orientation** — Hero needs landscape, grid might want mixed
4. **Variety** — Don't use 8 images that all look the same
5. **Mood match** — Energetic brand gets action shots, luxury brand gets serene shots

### Image-to-Site Color Matching

This is a powerful idea: the AI can match images to the site's color palette. If the site uses deep greens and browns (outdoor brand), it selects images with matching dominant colors. If the site is bright and modern (tech brand), it selects crisp, high-contrast images.

The `dominantColors` metadata (extracted during harvesting with a simple canvas color analysis) makes this a fast lookup rather than a vision task.

---

## The Feedback Loop

Same pattern as the block R&D taste loop — human feedback compounds over time.

### Per-Category Learning

Each category accumulates a `harvest-notes.md`:

```markdown
# outdoor/fishing — Harvest Notes

## What works
- American bass fishing in lakes/rivers — core audience
- Dawn/dusk lighting — creates mood
- Action shots (casting, reeling, fighting a fish) — energy
- Trophy catches held up by the angler — aspirational
- Boats on calm water — versatile background/hero images
- Tackle close-ups — great for detail sections

## What doesn't work
- Deep sea / ocean fishing — different sport entirely
- Ice fishing — wrong climate for bass
- Asian/European fishing contexts — cultural mismatch for US tournaments
- Overly posed stock (white background, fake smile) — feels inauthentic
- Fly fishing (usually) — different subculture from bass fishing
- Dead fish on cutting boards — unappetizing, wrong vibe

## Search queries that work well
- "bass fishing lake morning"
- "tournament fishing weigh-in"
- "fishing boat sunrise lake"
- "largemouth bass caught"

## Search queries that produce junk
- "fishing" (too generic)
- "fish" (returns sushi, aquariums, pet fish)
- "fishing competition" (returns lots of kids' fishing derbies)
```

This document is both human-readable and AI-readable. The AI reads it before the next harvest and adjusts its search queries and filtering. Over time, each category's harvest gets more efficient — fewer misses, fewer human removals.

### Cross-Category Patterns

Some patterns emerge across categories:
- "Stock photo on white background" is almost always wrong for every category
- Dawn/dusk lighting works for most outdoor categories
- Overhead/flat-lay shots work for food, products, and stationery
- Candid > posed for people-centric categories
- Action > static for sports/fitness categories

These promote into a global `harvest-guidelines.md` that all category harvests reference.

---

## Scaling the Library

### Phase 1: Core Categories (start here)
Build 10-15 categories that cover the most common business types:
- Wedding (6 subcategories)
- Restaurant (6)
- Tech/SaaS (6)
- Fitness (6)
- Outdoor/Adventure (6)
- People (5)
- Backgrounds (6)

~300 images per category after filtering = ~4,500 images total.

### Phase 2: Expand Coverage
Add categories based on actual client requests. When the AI builds a site and can't find good images in the library, that's a signal to harvest a new category.

Track "library misses":
```
2026-03-15: Built a dental practice site. No "dental/clinic" category.
            Used "professional/office" as fallback — OK but not great.
            → Harvest "dental" category next.
```

### Phase 3: Sub-Vibe Classification
Within a category, images serve different vibes. A wedding image library might tag:
- `vibe:rustic` — Barn weddings, wildflowers, wood, warm tones
- `vibe:elegant` — Ballroom, chandeliers, black tie, cool tones
- `vibe:bohemian` — Outdoor, flowy dresses, macramé, earth tones
- `vibe:modern` — Minimalist, urban, geometric, clean lines
- `vibe:tropical` — Beach, palm trees, sunset, bright colors

The AI selects images not just by category but by vibe, matching the site's aesthetic. The wedding photographer who shoots rustic barn weddings gets rustic images, not ballroom images.

This vibe tagging could be AI-assisted: after the human approves the base set, the AI classifies each image by vibe based on visual characteristics.

### Phase 4: Beyond Pexels

Other free/cheap image sources to harvest:
- **Unsplash** — Higher quality on average, good API
- **Pixabay** — Large library, variable quality
- **StockSnap** — Curated, CC0
- **Burst (Shopify)** — E-commerce focused, high quality
- **Generated** — DALL-E/Midjourney for categories where stock is weak (specific products, abstract backgrounds, illustrations)

Each source gets its own harvest pipeline but feeds into the same category structure.

---

## Technical Implementation

### Storage Structure

```
image-library/
  catalog.json                     # Master index of all images
  harvest-guidelines.md            # Global harvest rules
  categories/
    outdoor-fishing/
      harvest-notes.md             # Category-specific notes
      images.json                  # Image metadata for this category
      thumbs/                      # 400px thumbnails for contact sheets
        img_a1b2c3d4.jpg
        img_e5f6g7h8.jpg
      rejected.json                # Rejected images (training data)
    wedding-ceremony/
      ...
    restaurant-plated/
      ...
```

### Scripts

```bash
# Harvest a new category
npx tsx scripts/harvest-images.ts --category="outdoor/fishing" --queries="bass fishing lake,tournament fishing,largemouth bass" --count=100

# AI self-review (generates contact sheet, runs vision analysis)
npx tsx scripts/review-harvest.ts --category="outdoor/fishing" --auto

# Human review (opens gallery in browser)
npx tsx scripts/review-harvest.ts --category="outdoor/fishing" --human

# Query the library (what the site-building AI calls)
npx tsx scripts/query-images.ts --category="outdoor/fishing" --mood="energetic" --orientation="landscape" --count=8 --theme-colors="#2d5016,#8b7355"
```

### Contact Sheet Generation

For AI self-review, generate a contact sheet image (grid of thumbnails):

```typescript
// Generate a 5×4 grid of 400px thumbnails = 2000×1600px contact sheet
// AI reviews this single image and flags indices: [3, 7, 12, 15, 19]
// Much more efficient than reviewing 20 individual images
```

For human review, serve a web gallery (similar to the block review tool):

```bash
npx tsx scripts/review-harvest.ts --category="outdoor/fishing" --human
# Opens http://localhost:3457
# Lazy-loading grid, click to remove, save when done
```

---

## Integration with Site Building

### During Compose/Generate

```typescript
// In the compose workflow, after block selection:

const siteContext = {
  businessType: "bass fishing tournament",
  location: "East Texas",
  vibe: "energetic, competitive, American",
  themeColors: ["#2d5016", "#8b7355", "#4a7c9b"]
}

// Query the curated library instead of Pexels
const images = await queryImageLibrary({
  categories: ["outdoor/fishing"],
  mood: "energetic",
  orientations: { landscape: 4, portrait: 2, any: 2 },
  avoidColors: ["#ff69b4"], // no pink for a fishing tournament
  matchColors: siteContext.themeColors,
  count: 8
})

// Falls back to Pexels search if library doesn't have enough
if (images.length < 8) {
  const pexelsResults = await searchPexels("bass fishing lake", 8 - images.length)
  images.push(...pexelsResults)
}

// Upload to R2 (fetch full-res from Pexels URL)
const cdnUrls = await client.uploadFilesFromUrls(siteId,
  images.map(img => ({ url: img.downloadUrl, fileName: img.id + '.jpg' }))
)
```

### The Fallback Chain

1. **Curated library** (best quality, pre-vetted)
2. **Pexels real-time search** (good, but needs luck)
3. **AI-generated** (custom, but potentially uncanny)
4. **Placeholder** (last resort — `placehold.co` with descriptive text)

The library doesn't need to cover everything. It just needs to cover the common cases well enough that the fallback to Pexels is rare.

---

## Automated Color Harmonization

Stock images have the right subject but the wrong palette. A gorgeous fishing photo shot at golden hour is warm amber. The site's brand is cool slate blue and forest green. The image fights the theme instead of reinforcing it.

AI-generated images don't have this problem — you can specify the palette in the prompt. But stock images are usually better (more authentic, higher resolution, no uncanny valley). So: **what if we could automatically retouch stock images to harmonize with the site's palette?**

There's a spectrum of approaches, from trivial CSS to full AI retouching.

### Layer 1: CSS Filters (Zero Cost, Instant, Reversible)

CSS filters apply at render time — no image processing, no storage, no latency. The AI sets filter values as part of the block configuration.

```css
/* Cool down a warm image */
img { filter: saturate(0.85) hue-rotate(-15deg) brightness(1.05); }

/* Warm up a cool image */
img { filter: saturate(1.1) hue-rotate(10deg) sepia(0.1); }

/* Brand tint: desaturate then overlay with brand color via blend mode */
.image-wrapper {
  background-color: var(--color-brand);
}
.image-wrapper img {
  mix-blend-mode: luminosity;
  opacity: 0.9;
}
```

**What the AI can control:**
- `filter: saturate()` — dial color intensity up or down
- `filter: hue-rotate()` — shift the overall color temperature
- `filter: brightness()` / `contrast()` — match exposure levels across images
- `filter: sepia()` — add warmth
- `filter: grayscale()` — partial or full desaturation
- `mix-blend-mode` — overlay brand colors onto the image

**Pros:**
- Zero processing cost — it's just CSS
- Reversible — the original image is untouched
- The AI can adjust filters per-image, per-block, or site-wide
- Works immediately — no pipeline, no waiting
- Can be exposed as block handles (Warmth, Saturation, Tint)

**Cons:**
- Coarse — you can't selectively adjust sky vs. subject
- `hue-rotate` affects everything uniformly — can make skin tones look unnatural
- Limited to what CSS filters can do (no selective color replacement)

**Best for:** Subtle adjustments — warming/cooling, matching exposure across a gallery, creating a consistent mood. The 80% solution.

**Implementation:**

Each image block gets optional color treatment handles:

```json
{
  "type": "group",
  "name": "Image Treatment",
  "config": {
    "fields": [
      { "type": "select", "name": "Treatment", "config": {
        "selectOptions": [
          { "key": "none", "value": "None" },
          { "key": "warm", "value": "Warm" },
          { "key": "cool", "value": "Cool" },
          { "key": "desaturated", "value": "Desaturated" },
          { "key": "brand-tint", "value": "Brand Tint" },
          { "key": "duotone", "value": "Duotone" },
          { "key": "custom", "value": "Custom" }
        ]
      }},
      { "type": "number", "name": "Intensity" }
    ]
  },
  "default": { "treatment": "none", "intensity": 0.5 }
}
```

The template maps presets to CSS:

```handlebars
{{#if (eq image-treatment.treatment "warm")}}
  style="filter: saturate(1.1) sepia({{multiply image-treatment.intensity 0.2}}) brightness(1.02)"
{{/if}}
{{#if (eq image-treatment.treatment "duotone")}}
  style="filter: grayscale(1) contrast(1.1); mix-blend-mode: multiply"
  {{!-- parent div has background: var(--color-brand) --}}
{{/if}}
```

The AI sets the treatment based on the gap between the image's dominant colors and the site's palette:
- Image is warm, site is cool → apply "cool" treatment
- Image is saturated, site is muted → apply "desaturated"
- Image colors are all wrong → apply "duotone" (strips color entirely, replaces with brand)

### Layer 2: CSS Duotone & Color Overlay (Zero Cost, Dramatic)

Duotone is the nuclear option in CSS: strip the image to grayscale, then map shadows to one color and highlights to another. It's dramatic — every image looks like it belongs together because they all use the same two colors.

```css
/* Duotone: brand shadows, light highlights */
.duotone {
  position: relative;
  background: var(--color-brand);
}
.duotone img {
  filter: grayscale(1) contrast(1.2);
  mix-blend-mode: multiply;
}
.duotone::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--color-base);
  mix-blend-mode: lighten;
}
```

**Best for:** When the images are from different sources, different lighting conditions, different cameras — but you need them to feel like a cohesive set. Duotone unifies everything. Very editorial, very Spotify-era. The AI applies this when color harmony can't be achieved with subtle filters.

The `MeshHeroDuotone` block from the hero catalog already does this — but it should be available as a treatment on ANY image block, not just heroes.

### Layer 3: Server-Side Color Grading with Sharp (Low Cost, Higher Quality)

[Sharp](https://sharp.pixelplumbing.com/) (already a common Node dependency) can do image processing at upload time:

```typescript
import sharp from 'sharp'

async function harmonizeImage(inputBuffer: Buffer, targetPalette: string[]) {
  // Extract dominant color of source image
  const { dominant } = await sharp(inputBuffer).stats()

  // Calculate the hue shift needed
  const sourceHue = rgbToHsl(dominant.r, dominant.g, dominant.b).h
  const targetHue = rgbToHsl(hexToRgb(targetPalette[0])).h
  const hueShift = targetHue - sourceHue

  // Apply color adjustments
  return sharp(inputBuffer)
    .modulate({
      hue: hueShift,           // Shift hue toward brand
      saturation: 0.9,         // Slightly desaturate for cohesion
      brightness: 1.0,
    })
    .tint(hexToRgb(targetPalette[0]))  // Subtle tint toward brand color
    .toBuffer()
}
```

**What Sharp can do:**
- `modulate({ hue, saturation, brightness })` — Global HSB adjustments
- `tint(rgb)` — Apply a color tint (like an Instagram filter)
- `recomb(matrix)` — 3×3 color matrix transform (full color remapping)
- `linear(a, b)` — Per-channel adjustment (curves-like)
- `clahe()` — Adaptive contrast enhancement
- `gamma()` — Gamma correction

**The `recomb` matrix is the power move.** A 3×3 matrix that transforms every pixel's RGB values. You can create a "color grade" that shifts an image's palette toward any target:

```typescript
// Warm grade: boost reds, reduce blues
const warmGrade = [
  [1.2, 0.1, 0.0],
  [0.0, 1.0, 0.0],
  [0.0, 0.0, 0.8],
]

// Cool grade: reduce reds, boost blues
const coolGrade = [
  [0.8, 0.0, 0.0],
  [0.0, 1.0, 0.1],
  [0.0, 0.1, 1.2],
]

// Brand-specific grade: computed from source → target palette mapping
const brandGrade = computeColorMatrix(sourcePalette, targetPalette)

await sharp(input).recomb(brandGrade).toBuffer()
```

**Pros:**
- Higher quality than CSS filters — can do selective adjustments
- Runs once at upload time, result is cached
- The `recomb` matrix can map any source palette toward any target
- Can preserve skin tones while shifting background colors (with masking, but that's Layer 4)

**Cons:**
- Processing cost (~100-500ms per image, negligible)
- Creates a new image file (storage cost, but trivial)
- Not reversible without re-processing from original
- Global transforms — can't selectively adjust "just the sky" or "just the background"

**Best for:** When CSS filters aren't enough but you don't need AI-level intelligence. Processing the 8-12 images for a site at build time takes a few seconds total.

**Implementation:**

Add a color grading step to the image upload pipeline:

```typescript
// In compose workflow, after image selection:
for (const image of selectedImages) {
  const original = await fetchImage(image.downloadUrl)

  // Compute color grade based on image colors → site palette
  const grade = computeHarmonizationGrade(
    image.dominantColors,
    site.theme.systemColors
  )

  // Apply grade
  const harmonized = await sharp(original)
    .recomb(grade.matrix)
    .modulate({ saturation: grade.saturation })
    .toBuffer()

  // Upload harmonized version to R2
  await client.uploadFile(siteId, harmonized, image.id + '.jpg', 'image/jpeg')
}
```

### Layer 4: AI-Powered Selective Retouching (Higher Cost, Highest Quality)

This is where it gets interesting. AI image editing APIs can do things that CSS and Sharp can't:

- **Change the sky color** without affecting the subject
- **Shift background colors** while preserving skin tones
- **Replace or adjust specific elements** (e.g., change a red car to blue)
- **Add or modify atmospheric effects** (fog, warm light, golden hour)
- **Inpaint regions** — replace parts of the image entirely

**Available APIs:**

| API | Capability | Cost | Quality |
|-----|-----------|------|---------|
| **OpenAI GPT-image-1** | Full image editing from text prompts | ~$0.02-0.05/image | High, but unpredictable |
| **Stability AI** | img2img (style transfer), inpainting, outpainting | ~$0.01-0.03/image | Good for style transfer |
| **Clipdrop (Stability)** | Recolor, re-light, background removal | ~$0.01/image | Good, purpose-built |
| **Runway ML** | Video + image editing, style transfer | Higher | Very high quality |
| **Replicate** | Run open-source models (ControlNet, IP-Adapter) | ~$0.01-0.05/image | Varies |

**The most practical approach: Stability's "recolor" or ControlNet style transfer.**

Style transfer preserves the composition and structure of the source image but applies the color palette and mood of a reference image (or color specification). This is exactly what we want — same photo, different vibe.

```typescript
// Pseudocode: recolor a fishing photo to match site palette
const result = await stabilityApi.imageToImage({
  image: fishingPhoto,
  prompt: "same scene, same composition, color graded with deep forest green and warm brown tones, muted saturation, golden hour lighting",
  strength: 0.3,  // Low strength = preserve most of original, just adjust colors
})
```

**The strength parameter is key.** At 0.1-0.3, the AI adjusts colors and mood without changing the content. At 0.5+, it starts reinterpreting the scene. We want the low end — color grading, not reimagining.

**Pros:**
- Can do what no CSS or Sharp filter can — selective, intelligent adjustments
- Understands "warm" and "cool" and "muted" as aesthetic concepts, not just number shifts
- Can harmonize radically different images into a cohesive set
- Can preserve skin tones while shifting everything else

**Cons:**
- Costs money per image (~$0.02-0.05)
- Latency (1-5 seconds per image)
- Unpredictable — sometimes the AI changes too much or too little
- Needs quality checking (another review step)
- API dependency

**Best for:** High-value sites where image cohesion really matters. Not for every site, but when the client is paying for a premium result.

### Layer 5: LUT-Based Color Grading (Precomputed, Instant)

A **Look-Up Table (LUT)** is how Hollywood does color grading. It's a precomputed 3D color mapping — for every possible input color, the LUT says what the output color should be. Applied in one pass, no AI, no computation.

The idea: **generate a small set of brand-specific LUTs** (warm-forest, cool-ocean, muted-luxury, bold-neon, etc.) and apply them to images at upload time via Sharp.

```typescript
// Apply a LUT to an image
import { applyLUT } from './lut-engine'

const graded = await applyLUT(imageBuffer, 'warm-forest.cube')
```

Sharp doesn't natively support 3D LUTs, but the `recomb` matrix is a simplified version. For full LUT support, you'd either:
- Use a LUT library (e.g., `lut-pipeline` or custom Canvas2D implementation)
- Pre-generate the `recomb` matrix approximation for each LUT

**The AI's role:** Instead of computing color adjustments per-image, the AI selects a LUT for the site based on the brand vibe:

```
Meditation app → "muted-sage" LUT (desaturated greens, soft contrast)
Gaming brand → "electric-night" LUT (high contrast, boosted blues/purples)
Bakery → "golden-warmth" LUT (warm highlights, creamy midtones)
Law firm → "neutral-authority" LUT (slightly desaturated, cool shadows)
```

Every image on the site gets the same LUT. Instant cohesion. The LUT is the "Instagram filter" for the whole site.

**LUTs we should create (or have the R&D agents create):**

| LUT Name | Mood | Color Shifts |
|----------|------|-------------|
| `warm-golden` | Inviting, friendly | Warm highlights, amber midtones |
| `cool-slate` | Professional, tech | Cool shadows, desaturated midtones |
| `muted-sage` | Calm, wellness | Desaturated greens, soft contrast |
| `bold-contrast` | Energetic, startup | Boosted saturation, high contrast |
| `vintage-film` | Creative, editorial | Lifted blacks, warm shadows, faded |
| `dark-moody` | Luxury, nightlife | Deep shadows, selective highlights |
| `clean-bright` | Fresh, modern | Bright highlights, neutral midtones |
| `earth-tones` | Outdoor, natural | Warm browns, muted greens |
| `electric-neon` | Gaming, nightlife | Boosted blues/purples, high saturation |
| `pastel-soft` | Feminine, gentle | Reduced contrast, lifted pastels |

These LUTs could be generated algorithmically from the site's theme colors, or pre-built as a curated set the AI selects from.

### Recommended Approach: Stack the Layers

Don't pick one — use them in combination:

```
EVERY SITE (zero cost):
  Layer 1: CSS filter presets applied by the AI
  → Handles on image blocks: Warmth, Saturation, Tint
  → AI sets these based on source image colors vs. site palette

MOST SITES (negligible cost):
  Layer 3: Sharp color grading at upload time
  → recomb matrix computed from source palette → target palette
  → Applied automatically during the image upload pipeline
  → Cached as the CDN version of the image

PREMIUM SITES (when client pays for it):
  Layer 4: AI selective retouching
  → For hero images, key portfolio shots
  → Stability/OpenAI API for intelligent color grading
  → Human review of the result before finalizing

SITE-WIDE COHESION (one-time):
  Layer 5: Brand LUT applied to all images
  → AI selects or generates a LUT based on brand vibe
  → Every image gets the same treatment
  → Instant visual cohesion, like a magazine's editorial color grade
```

The layers compound: a stock photo goes through Sharp's recomb matrix at upload (Layer 3), then gets CSS fine-tuning per-block at render time (Layer 1), and the whole site has a cohesive LUT applied (Layer 5). Three passes, each adding refinement, total cost near zero.

### What This Means for the Image Library

When we harvest images for the library, we store them **unmodified**. The color harmonization happens at site-creation time based on the specific site's palette. This means the same fishing photo can look cool and muted on a corporate fishing tournament site, or warm and golden on a rustic fishing lodge site.

The image library stores the raw material. The color pipeline processes it to fit.

This also means the dominant color metadata we extract during harvest is used for **selection** (pick images whose natural colors are close to the target), while the color grading handles the **gap** between "close enough" and "perfectly on-brand."

---

## Why This Compounds

1. **Each harvest makes the category better.** First harvest: 40% removal rate. Fifth harvest: 10% removal rate. The `harvest-notes.md` guides the AI to better queries.

2. **Rejections are training data.** Every image you click to remove teaches the AI what doesn't fit. "You removed 8 images from outdoor/fishing — 6 were ocean fishing, 2 were low quality. Next time: exclude ocean, prioritize higher resolution."

3. **Cross-site learning.** When the AI uses images from the library on a real site and the client keeps them (doesn't replace them), that's a positive signal. When the client replaces a library image, that's a negative signal. Over time, the most-kept images rise to the top.

4. **The library becomes a competitive moat.** A curated library of 15,000+ images across 50 categories, pre-vetted for cultural fit and quality, with mood/color metadata — nobody else building website tools has this. It's not a feature you can copy quickly. It's accumulated taste.

---

## Discussion Log

- **2026-03-10**: Initial research. Defined category structure (business types + functional categories), harvesting loop (AI search → AI filter → human review → store), storage strategy (local cache + Pexels URLs), feedback loop (harvest-notes.md per category, rejection training data), scaling phases, and integration with site building workflow. Added automated color harmonization: 5-layer approach from CSS filters (free/instant) through Sharp recomb matrices (negligible cost) to AI selective retouching (premium) and LUT-based grading (site-wide cohesion).
