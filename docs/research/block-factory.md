# The Block Factory

A dedicated system — running on its own machine — that produces the building blocks for Make Studio's onboarding. Blocks, images, themes, typography, palettes. All reviewed, all tested, all ready to compose into sites at onboarding time with zero generation.

---

## The Two Projects

### Project 1: Make Studio Onboarding (The Consumer)

A chat-based flow inside Make Studio. User describes their business, AI asks a few questions, AI composes a site from pre-built blocks. No generation. No iteration. No screenshots. Just selection + configuration + content population.

This is fast, cheap, and reliable because everything it uses has already been built and tested. The quality ceiling is determined entirely by the quality of the library it draws from.

**What it needs from us:**
- A deep block library with enough variety that any business type gets a great result
- Blocks categorized and tagged so the AI can select intelligently
- Trusted image sets per category so image selection is instant and appropriate
- Proven theme presets (palettes, font pairings, typography scales) that work
- Post type recipes so functional systems (blog, portfolio, events) spin up instantly

### Project 2: The Block Factory (What We're Building)

A dedicated machine that runs agents overnight. Its only job is to produce assets for the library. Agents build blocks, harvest images, test font pairings, create palettes. A human checks in periodically — via Slack or a review interface — to approve, reject, and give taste feedback. The feedback compounds into the agents' instructions over time.

**What it produces:**
- Blocks (templates + fields + defaults + handles + aiDescription + tags)
- Curated image sets per category
- Theme presets (palettes, font pairings, typography scales)
- Animation/interaction patterns that work across the block library

**What it does NOT do:**
- Build sites for end users
- Run during onboarding
- Require real-time performance

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│            THE BLOCK FACTORY (laptop)             │
│                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │ Block R&D   │  │ Image        │  │ Theme   │ │
│  │ Agents      │  │ Harvest      │  │ Presets │ │
│  │             │  │ Agent        │  │ Agent   │ │
│  └──────┬──────┘  └──────┬───────┘  └────┬────┘ │
│         │                │               │       │
│         ▼                ▼               ▼       │
│  ┌─────────────────────────────────────────────┐ │
│  │              Review Queue                    │ │
│  │  (Slack notifications + web gallery)         │ │
│  └──────────────────┬──────────────────────────┘ │
│                     │                             │
│              Human reviews                        │
│              (y/n + note)                          │
│                     │                             │
│                     ▼                             │
│  ┌─────────────────────────────────────────────┐ │
│  │           Graduated Library                  │ │
│  │  Blocks + Images + Themes + Recipes          │ │
│  └──────────────────┬──────────────────────────┘ │
└─────────────────────┼────────────────────────────┘
                      │
                      │ Push to Make Studio
                      ▼
┌──────────────────────────────────────────────────┐
│          MAKE STUDIO (production)                 │
│                                                   │
│  Block Library ← graduated blocks                 │
│  Image Library ← curated images                   │
│  Theme Presets ← tested palettes + typography     │
│  Post Type Recipes ← blog, portfolio, events...   │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │         Onboarding Chat                      │ │
│  │                                              │ │
│  │  "Tell me about your business"               │ │
│  │  → selects blocks from library               │ │
│  │  → picks images from curated set             │ │
│  │  → applies theme preset                      │ │
│  │  → provisions post types from recipes        │ │
│  │  → populates content                         │ │
│  │  → deploys                                   │ │
│  │                                              │ │
│  │  Fast. Cheap. No generation.                 │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## What the Factory Produces

### 1. Blocks

The core output. Each graduated block includes:

```
BlockName.html          — Handlebars template (Tailwind + theme tokens)
BlockName.json          — Field definitions with defaults
BlockName.meta.json     — Factory metadata:
  {
    "aiDescription": "...",       — How the onboarding AI should use it
    "tags": ["hero", "animated"], — For selection/filtering
    "category": "section",        — header | section | footer
    "blockCategory": "hero",      — hero | features | cta | testimonials | ...
    "handles": { ... },           — Behavioral parameters with ranges
    "vibes": ["energetic", "modern"], — Which brand vibes it suits
    "dependencies": [],           — External libraries (CDN URLs)
    "performance": "lightweight", — lightweight | medium | heavy
    "preview": "block.gif",       — Animation preview
    "screenshots": {
      "desktop": "desktop.png",
      "mobile": "mobile.png"
    }
  }
```

**Target library size by category:**

| Category | Block Count | Purpose |
|----------|------------|---------|
| **Heroes** | 40-60 | First impression. Mix of static, animated, video, generative. |
| **Features** | 20-30 | Capability showcases. Grids, lists, tabs, icon-based. |
| **Testimonials** | 10-15 | Social proof. Carousels, grids, single-quote, video. |
| **CTAs** | 10-15 | Conversion sections. Simple, card, split, full-bleed. |
| **Pricing** | 5-8 | Plan comparison. Toggle, table, cards. |
| **FAQ** | 5-8 | Expandable questions. Accordion, columns, numbered. |
| **Stats** | 5-8 | Animated numbers. Counter, flip, slot-machine. |
| **Team** | 5-8 | People grids. Cards, minimal, detailed. |
| **Logos** | 5-8 | Client/partner logos. Marquee, grid, carousel. |
| **Portfolios** | 8-12 | Work showcase. Masonry, grid, showcase, case study. |
| **Blog/Posts** | 8-12 | Post listings + detail blocks. Grids, cards, featured. |
| **Maps** | 5-8 | Location blocks. Hero map, multi-location, route. |
| **Contact/Forms** | 5-8 | Forms, contact info, multi-step. |
| **Navbars** | 8-12 | Navigation headers. Minimal, mega-menu, transparent, sticky. |
| **Footers** | 8-12 | Page footers. Columns, minimal, CTA footer, mega. |
| **Content** | 10-15 | General content. Text + image, split, full-width, timeline. |
| **Galleries** | 5-8 | Image presentation. Lightbox, masonry, carousel, before/after. |
| **Interactive** | 10-15 | Calculators, quizzes, product viewers, code playgrounds. |
| **Total** | **~180-260** | |

### 2. Curated Image Sets

Per-category image collections, pre-vetted for cultural fit and quality.

```
image-library/
  categories/
    wedding-ceremony/
      images.json       — Metadata: source, colors, mood, orientation
      thumbs/           — 400px thumbnails
      harvest-notes.md  — What works/doesn't for this category
    restaurant-plated/
    tech-workspace/
    outdoor-fishing/
    ...
```

**Target:** 50+ subcategories, 100-300 images each, with dominant colors and mood tags. The onboarding AI queries by category + color affinity + mood + orientation.

### 3. Theme Presets

Tested combinations of palette + typography + button styles. Not full themes — composable pieces that the onboarding AI mixes and matches.

#### Palettes (tested color systems)

Each palette is a complete set of 10 system colors that work together. Tested for contrast ratios, readability, and aesthetic cohesion.

```json
{
  "name": "Forest & Cream",
  "vibe": ["natural", "warm", "organic"],
  "systemColors": {
    "base": "#faf8f4",
    "base-muted": "#f0ece4",
    "base-alt": "#1a2e1a",
    "panel": "#ffffff",
    "fg": "#1a1a1a",
    "fg-muted": "#5c5c5c",
    "fg-alt": "#8a8a8a",
    "brand": "#2d5016",
    "on-brand": "#ffffff",
    "border": "#e0dbd2"
  }
}
```

**Target:** 30-50 palettes covering warm, cool, dark, light, bold, muted, earthy, techy, luxury, playful.

#### Font Pairings (tested combinations)

Heading + body combinations that look great together. Tested at multiple sizes, verified that all needed weights exist on Google Fonts.

```json
{
  "name": "Geometric Modern",
  "vibe": ["tech", "clean", "modern"],
  "heading": { "family": "Space Grotesk", "weights": [500, 700] },
  "body": { "family": "Inter", "weights": [400, 500] },
  "compatibility": "universal"
}
```

**Target:** 30-50 pairings. Categories: modern sans, editorial serif, mixed serif+sans, display, monospace accent.

#### Typography Scales (tested sizing)

Pre-tuned heading/body sizes that work at mobile and desktop. Not every font pairing works at every size — these are verified combinations.

```json
{
  "name": "Bold & Spacious",
  "headingTypography": {
    "heading-xl": { "fontSize": 72, "lineHeight": 1.1, "letterSpacing": -0.02, "mobileFontSize": 40, "mobileLineHeight": 1.15 },
    "heading-lg": { "fontSize": 48, "lineHeight": 1.15, "letterSpacing": -0.01, "mobileFontSize": 32, "mobileLineHeight": 1.2 }
  },
  "bodyTypography": {
    "body-lg": { "fontSize": 20, "lineHeight": 1.6 },
    "body-md": { "fontSize": 16, "lineHeight": 1.6 },
    "body-sm": { "fontSize": 14, "lineHeight": 1.5 }
  }
}
```

**Target:** 10-15 scales. Compact, standard, spacious, editorial, bold.

### 4. Post Type Recipes

Pre-built configurations for common content systems.

```json
{
  "name": "Blog",
  "triggers": ["blog", "articles", "news", "updates", "journal", "insights"],
  "postTypeName": "Blog",
  "detailBlocks": ["PostHeader", "PostBody", "PostAuthor", "RelatedPosts"],
  "indexBlocks": ["BlogGrid"],
  "homepageIntegration": { "block": "LatestPosts", "config": { "count": 3 } },
  "samplePostCount": 3,
  "categories": ["Company News", "Insights", "Tutorials"]
}
```

**Target:** 8-10 recipes: Blog, Portfolio, Team, Events, Products/Services, Testimonials, Locations, FAQ, Resources/Docs, Jobs/Careers.

---

## The Agent System

### How It Runs

The factory runs on a dedicated laptop. It's a long-running Claude Code session (or multiple sessions) that operate autonomously. The agents share the same codebase and tools but focus on different domains.

**Option A: Single Claude Code session, sequential agents**
One session runs the block agent, then the image agent, then the theme agent. Simple, but can only do one thing at a time.

**Option B: Multiple Claude Code sessions in parallel**
Each agent type gets its own terminal session. Block agents run in one, image harvest in another, theme testing in a third. More throughput, more complexity.

**Option C: Orchestrator + workers**
A lightweight orchestrator script manages the queue. It decides what to work on next (based on priorities and what's been reviewed), launches the appropriate agent, and collects results. This is the cleanest architecture but requires building the orchestrator.

**Recommendation: Start with Option A, evolve to Option C.** A single session running one agent at a time is the fastest path to producing blocks. Once the workflow is proven and the review pipeline works, add parallelism.

### Agent Types

#### Block Builder Agent

**Focus:** Build new blocks and iterate on them.
**Input:** Block specification from the catalog (name, category, description, key handles).
**Output:** `.html` + `.json` + `.meta.json` + screenshots + animation GIF.
**Loop:**

```
1. Read block-program.md for its category
2. Read the block specification (what to build)
3. Read reference blocks (docs/references/)
4. Write template + fields + defaults
5. Local render → self-evaluate → fix (inner loop, 10 seconds)
6. Deploy + record animation → log as pending-review (outer loop, 90 seconds)
7. If previous feedback exists for this block, incorporate it
8. Move to next block in the queue
```

#### Image Harvest Agent

**Focus:** Build up the curated image library.
**Input:** Category to harvest (e.g., "outdoor/fishing").
**Output:** Curated image set with metadata.
**Loop:**

```
1. Read harvest-notes.md for the category (if exists)
2. Generate search queries
3. Search Pexels, download candidates
4. Generate contact sheet
5. Self-review: flag obvious misfits (vision analysis)
6. Remove flagged images
7. Log remaining as pending-human-review
8. Move to next category
```

#### Theme Preset Agent

**Focus:** Create and test palettes, font pairings, typography scales.
**Input:** Target vibe (e.g., "warm luxury", "bold tech").
**Output:** Palette JSON + font pairing JSON + preview image.
**Loop:**

```
1. Generate a palette for the target vibe
2. Generate 3-5 font pairings that fit the vibe
3. Render preview images (headline + body + buttons + colors)
4. Self-evaluate: contrast ratios, readability, aesthetic coherence
5. Log as pending-review
6. Move to next vibe
```

### The Queue

A simple JSON file tracks what needs to be built, what's in progress, and what's done.

```json
{
  "blocks": [
    { "name": "TextHeroTypewriter", "category": "hero", "status": "pending", "priority": 1 },
    { "name": "TextHeroStagger", "category": "hero", "status": "in-progress", "priority": 1 },
    { "name": "MeshHeroAurora", "category": "hero", "status": "pending-review", "priority": 2 },
    { "name": "CarouselTestimonials", "category": "testimonials", "status": "graduated", "priority": 1 }
  ],
  "images": [
    { "category": "wedding/ceremony", "status": "pending", "priority": 2 },
    { "category": "restaurant/plated", "status": "harvested", "priority": 1 }
  ],
  "themes": [
    { "vibe": "warm-luxury", "status": "pending", "priority": 3 },
    { "vibe": "bold-tech", "status": "pending-review", "priority": 2 }
  ]
}
```

The agent reads the queue, picks the highest-priority pending item, and works on it. When it finishes, it updates the status and moves on.

### Slack Integration

The human doesn't sit at the factory laptop. They check in via Slack.

**Agent → Slack:**
- "Built 5 new blocks overnight. 3 pending review." + thumbnail grid
- "Harvested 120 images for `wedding/ceremony`. 78 passed AI filter. Ready for your review."
- "Theme preset `warm-luxury` ready for review." + preview image

**Human → Slack:**
- Quick reactions on the thumbnails (though the real review happens in the web gallery)
- "Focus on testimonial blocks next" → agent reprioritizes the queue
- "That aurora hero is 🔥, graduate it" → status updated

**How to implement:** The simplest path is a Slack webhook. The agent posts messages with images attached. No bot framework needed — just HTTP POST to a webhook URL.

```typescript
async function notifySlack(message: string, imageUrl?: string) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: message,
      ...(imageUrl && { attachments: [{ image_url: imageUrl }] })
    })
  })
}
```

### The Review Interface

Two tiers:

**Quick review (Slack):** See thumbnails/GIFs in Slack, react with emoji or short reply. Good for "yes this direction is right" or "no, stop making glass effects."

**Full review (web gallery):** A local web server on the factory laptop (or hosted). Shows all pending items with screenshots, animation GIFs, live preview links. Keyboard-driven: `y/n/i/g` + optional note. This is where the real taste feedback happens.

```bash
# Start the review server
npx tsx scripts/review-server.ts --port=3456
# Accessible at http://factory-laptop.local:3456 from any device on the network
```

---

## What We Need to Build

Organized by what to build first, second, third.

### Phase 1: The Core Loop (Get blocks flowing)

Build the minimum infrastructure to run one block agent and produce reviewed blocks.

| Item | What | Why First |
|------|------|-----------|
| `block-program.md` | Agent instructions for block building | The agent needs instructions |
| `factory-queue.json` | Work queue (blocks to build, status tracking) | Agent needs to know what to work on |
| `render-block.ts` | Local block rendering (Handlebars + theme CSS + Playwright) | 10x iteration speed |
| Multi-viewport screenshots | Add `--viewports` flag to `block-screenshot.ts` | Catch mobile issues early |
| `results.tsv` per run | Experiment logging (commit, block, status, feedback) | Track what's been tried |
| `review.ts` (CLI) | Terminal-based review: show screenshot, y/n/i/g + note | Human feedback path |
| Block catalog seed | Initial list of blocks to build (from hero + interactive research) | The queue needs items |

**Output of Phase 1:** Agent can build blocks, log them, and a human can review them from the terminal. Blocks that pass review accumulate in the library.

### Phase 2: Image & Theme Pipeline (Support the blocks)

| Item | What | Why Second |
|------|------|------------|
| `image-tools.ts` | Sharp wrappers: color extraction, contact sheets, grading | Image library needs processing |
| `harvest-images.ts` | Pexels search + download + AI filter + human review | Build image library |
| `color-tools.ts` | Palette generation, contrast checking, theme derivation | Theme presets need validation |
| `font-tools.ts` | Google Fonts search, pairing preview, weight checking | Font pairings need testing |
| Theme preset format | JSON schema for palettes + pairings + scales | Standardize theme output |
| Pexels video support | Extend `search-pexels.ts` for video search + download | Video hero blocks need content |

**Output of Phase 2:** Image library building, theme preset creation, and video support for hero blocks.

### Phase 3: Automation & Scale (Let it run overnight)

| Item | What | Why Third |
|------|------|-----------|
| `block-record.ts` | FFmpeg animation capture (GIF + MP4) | Evaluate animated blocks properly |
| Slack notifications | Webhook integration for progress updates | Human doesn't need to sit at the laptop |
| `review-server.ts` | Web gallery for batch review | Scale beyond CLI for large review queues |
| Orchestrator | Script that reads queue, launches appropriate agent, collects results | Multi-agent coordination |
| Feedback → program | Script that reads results.tsv, identifies patterns, proposes program updates | Compound learning |
| `analyze-block.ts` | AI vision analysis (contrast, readability, layout) | Automated quality filter |

**Output of Phase 3:** The factory runs autonomously overnight. Human reviews via Slack + web gallery. Feedback compounds into agent instructions.

### Phase 4: Library Management & Export (Ship to Make Studio)

| Item | What | Why Fourth |
|------|------|------------|
| Library format | Standard format for graduated blocks + images + themes | Make Studio needs to consume this |
| Export script | Package library for import into Make Studio | Bridge between factory and production |
| Block dedup/versioning | Handle block iterations, versioning, deprecation | Library maintenance |
| Post type recipes | Package detail/index blocks + sample content | Functional systems |
| Trend radar agent | Weekly scans of award sites + tech landscape | Keep the library current |

**Output of Phase 4:** A shipping pipeline from factory → Make Studio production. The onboarding chat can draw from a growing, curated, trend-aware library.

---

## The Factory Machine

### Hardware

A dedicated laptop. Doesn't need to be powerful — the heavy lifting is API calls (Make Studio, Pexels, Claude) and Playwright (lightweight). An older MacBook is fine.

### Software Setup

```bash
# Core (already in the project)
node 18+
npm / bun
playwright
sharp

# Additional
brew install ffmpeg          # Video processing
npm install handlebars       # Local template compilation
npm install chroma-js        # Color manipulation (or pure math)
npm install simplex-noise    # Generative patterns
npm install svgo             # SVG optimization

# Environment
MAKE_STUDIO_URL=https://api.makestudio.cc
MAKE_STUDIO_TOKEN=<block-ingress-site-token>
MAKE_STUDIO_SITE=699a31ac451f939b5bab64d2   # Block ingress site
PEXELS_API_KEY=<key>
OPENAI_API_KEY=<key>
SLACK_WEBHOOK_URL=<webhook>
```

### Running It

```bash
# Start the factory (Phase 1: single agent, sequential)
npx tsx scripts/factory.ts --agent=block-builder

# The agent reads factory-queue.json, picks the next block, builds it.
# When it needs human review, it logs to results.tsv and moves on.
# It runs until interrupted or the queue is empty.

# In another terminal (or from another machine):
npx tsx scripts/review.ts --pending
# Shows all pending-review items. Keystroke review.

# Later (Phase 3):
npx tsx scripts/factory.ts --agent=all --notify-slack
# Runs all agents, sends Slack updates, runs overnight.
```

---

## Success Metrics

How do we know the factory is working?

| Metric | Target | Why |
|--------|--------|-----|
| Blocks graduated per week | 10-15 | Library growth rate |
| Human review time per block | < 30 seconds | Friction check — if review is slow, the UX is wrong |
| Agent hit rate (% kept on first try) | > 40% (improving over time) | Agent quality / program quality |
| Block library coverage | All 18 categories have 5+ blocks | Onboarding can handle any business type |
| Image library coverage | 30+ subcategories, 100+ images each | Images available for common business types |
| Theme presets | 20+ palettes, 20+ font pairings | Enough variety for diverse brands |
| Time from "start factory" to "first graduated block" | < 1 day | Proves the pipeline works |

---

## Relationship to Existing Research

The five research docs feed into this plan:

| Research Doc | What It Contributes |
|-------------|-------------------|
| `direct-generation.md` | Hero block catalog (40 blocks), R&D agent loop design, handle system, taste loop design |
| `interactive-blocks.md` | Interactive block catalog (29 blocks), post type recipes, functional systems, handle philosophy |
| `image-library.md` | Image category structure, harvesting loop, color harmonization pipeline |
| `trend-radar.md` | Ongoing intelligence to reprioritize the build queue |
| `agent-toolbox.md` | Tool inventory and gaps, the Big Three (local render, animation recording, multi-viewport) |

Those docs are the research. This doc is the plan.

---

## What Happens When the Library Is Big Enough

At some point — maybe 150+ blocks, 30+ image categories, 20+ theme presets — the onboarding chat in Make Studio becomes genuinely great. It can handle a wedding photographer, a SaaS startup, a restaurant, a law firm, a fitness studio, a musician, all from the same library.

At that point, the factory shifts from "build new blocks" to:
- **Refining existing blocks** based on usage data (which blocks get kept vs. replaced by users)
- **Trend-driven updates** (new block styles based on the trend radar)
- **Expanding to new niches** (dentists, real estate, nonprofits — categories we didn't cover initially)
- **Testing block combinations** (do these 8 blocks look good together on a page?)
- **A/B testing handles** (does Speed 0.2 or 0.4 work better for luxury brands?)

The factory never stops. It just shifts from building the library to curating and evolving it.

---

## Discussion Log

- **2026-03-10**: Consolidated all research into the Block Factory plan. Two projects: (1) Make Studio onboarding (consumer, composes from library) and (2) the Block Factory (producer, builds the library). Four build phases: core loop, image/theme pipeline, automation/scale, library export. Target library: ~200+ blocks, 50+ image categories, 30+ theme presets, 10 post type recipes.
