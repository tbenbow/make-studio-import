# Trend Radar: Autonomous Web Design Intelligence

A research agent that runs continuously, scanning the web design landscape and distilling what's changing into actionable intelligence. No code output — just knowledge that keeps the platform's taste current.

---

## The Problem

Web design moves fast. What looked cutting-edge 18 months ago looks dated today. Gradients are in, then out, then back. Brutalism spikes. Bento grids appear everywhere. Neomorphism has a moment then dies. Scroll-driven animations become possible in CSS and suddenly every award-winning site uses them.

Right now, staying current requires a human (you) to browse Awwwards, follow design Twitter, read blog posts, notice patterns, and manually update the generation prompts and block library. That's a bottleneck. You have other things to do.

The idea: **an autonomous research agent that monitors the web design landscape and produces trend reports.** It doesn't write code. It writes intelligence. The intelligence informs which blocks to build, which effects to prioritize, which patterns to add to the generation prompts, and which aesthetic choices feel fresh vs. stale.

---

## What the Agent Monitors

### Source Tier 1: Award Sites (Highest Signal)

These sites curate the best of the best. What wins here today shows up in mainstream templates in 6-12 months.

- **Awwwards** — Site of the Day, Honorable Mentions, Developer Awards
  - `https://www.awwwards.com/websites/` — Latest winners
  - `https://www.awwwards.com/awwwards/collections/` — Curated collections by trend
- **CSS Design Awards** — Similar curation, slightly different taste
  - `https://www.cssdesignawards.com/`
- **FWA** — Favours experimental/interactive work
  - `https://thefwa.com/`
- **Godly** — Curated gallery, strong editorial taste
  - `https://godly.website/`
- **Minimal Gallery** — Minimalist design specifically
  - `https://minimal.gallery/`
- **Lapa.ninja** — Landing page inspiration
  - `https://www.lapa.ninja/`
- **Land-book** — Landing pages, organized by type
  - `https://land-book.com/`
- **One Page Love** — Single-page sites
  - `https://onepagelove.com/`
- **SaaS Landing Page** — SaaS specifically
  - `https://saaslandingpage.com/`

### Source Tier 2: Design Publications (Analysis & Context)

These explain the "why" behind trends, not just the "what."

- **Codrops** — CSS/JS techniques with tutorials
  - `https://tympanus.net/codrops/`
- **Smashing Magazine** — In-depth design and development articles
  - `https://www.smashingmagazine.com/`
- **CSS-Tricks (now DigitalOcean)** — CSS techniques and patterns
- **Designmodo** — Design trends and resources
- **The Verge / Fast Company Design** — Mainstream design coverage (signals when a trend hits mass awareness)

### Source Tier 3: Social & Community (Fastest Signal)

Trends surface here first, often weeks before they hit award sites.

- **Twitter/X** — Design Twitter (`#webdesign`, `#uidesign`, key accounts)
- **Dribbble** — Shot trends, popular styles
  - `https://dribbble.com/shots/popular`
- **Behance** — Longer-form project showcases
- **Reddit** — r/web_design, r/UI_Design, r/Frontend
- **Threads / Bluesky** — Emerging design community
- **YouTube** — Design channel trends (Juxtopposed, DesignCourse, Kevin Powell)

### Source Tier 4: Technology Signals (What Becomes Possible)

New CSS features and browser APIs create new design possibilities. When `scroll-timeline` ships in all browsers, scroll-driven animation goes from "Three.js hack" to "CSS one-liner."

- **Can I Use** — Browser support tables for new features
  - `https://caniuse.com/`
- **Chrome Developer Blog** — New platform features
  - `https://developer.chrome.com/blog/`
- **Web.dev** — Google's web platform guidance
- **MDN Web Docs** — New API documentation
- **State of CSS Survey** — Annual survey of CSS feature adoption
  - `https://stateofcss.com/`
- **State of JS Survey** — Same for JavaScript
  - `https://stateofjs.com/`

---

## What the Agent Produces

### 1. Weekly Trend Digest

A short, opinionated summary of what the agent noticed this week. Not a link dump — synthesized intelligence.

```markdown
# Trend Digest — Week of March 10, 2026

## Hot Right Now
- **Scroll-driven text reveals** are everywhere. 4 of 7 Awwwards SOTDs
  this week used CSS `scroll-timeline` for headline animations. This has
  crossed from experimental to expected.
- **Warm, analog color palettes** continue to dominate. Creamy backgrounds
  (#faf5ef range), hand-drawn accents, film grain overlays. The anti-
  digital aesthetic is peaking.

## Emerging
- **View Transitions API** starting to appear on production sites (not
  just demos). Shared-element transitions between pages without JS
  frameworks. Chrome + Safari now support it. Firefox behind flag.
- **Oversized cursor interactions** — custom cursors that are themselves
  design elements (large circles, text labels following cursor, magnetic
  snap to buttons). Saw 3 new examples this week.

## Declining
- **Glassmorphism** — the frosted glass card is now so common it reads
  as "2023 template." Award sites are moving away.
- **Dark mode as default** — seeing more light/warm defaults with dark
  mode as optional toggle rather than primary.

## Actionable for Us
- PRIORITY: Build a scroll-driven text reveal hero block. CSS-only
  version possible now. → Add to Text Effect Heroes catalog.
- CONSIDER: Add warm/analog color presets to theme generation. The
  AI should sometimes generate sites with cream backgrounds instead
  of always defaulting to pure white or dark.
- WATCH: View Transitions API — when Firefox ships support, we should
  explore page transitions in Make Studio.
- DEPRIORITIZE: Don't build more glassmorphism blocks. What we have
  is enough.
```

### 2. Monthly Trend Report

A deeper analysis — what shifted this month, what's accelerating, what's decelerating. Includes visual references (URLs to example sites).

```markdown
# Trend Report — March 2026

## Macro Trends

### The "Return to Craft" Movement
Handmade aesthetics continue to gain ground. Custom illustrations over
stock photos. Hand-lettered headlines. Irregular shapes. Paper textures.
This is a reaction to the AI-generated-everything era — sites that feel
human-made signal authenticity.

Evidence:
- Awwwards SOTD Mar 3: [example.com] — hand-drawn SVG illustrations
- Awwwards SOTD Mar 8: [example2.com] — custom brush script headline
- Godly featured: [example3.com] — torn paper edge dividers

Implication for us:
- Our hero catalog should include a "hand-drawn" category
- Theme generation should have a "craft" preset (warm colors, textured
  backgrounds, serif + handwritten font pairings)
- Icon compositions could use hand-drawn style icons (Phosphor has a
  "duotone" variant that reads as more organic)

### Scroll as Interaction Medium
The scroll bar is becoming the primary interaction mechanism, not just
navigation. Sites are designing experiences where scroll position
controls animations, reveals, transitions, and even 3D camera movement.

CSS scroll-timeline support: Chrome 115+, Safari 18.2+, Firefox flag.
~78% global browser coverage.

Evidence: [5 examples with URLs]

Implication for us:
- Scroll-driven heroes should be a priority category
- Our KineticHeroExpand and ScrollHeroReveal blocks are well-positioned
- Should add: scroll-driven progress indicators, scroll-linked parallax
  using pure CSS (no JS), scroll-triggered video playback

### [more sections...]

## Block Library Gap Analysis

Based on what's winning awards right now, here's what we're missing:

| Trend | We Have | We Need |
|-------|---------|---------|
| Scroll-driven text | TextHeroStagger (JS-based) | CSS scroll-timeline version |
| Custom cursors | Nothing | CursorEffect component (partial?) |
| Bento grids | BentoAsymmetric | More variants, animated bento |
| Horizontal scroll sections | Nothing | HorizontalScrollGallery block |
| Marquee/ticker text | KineticHeroMarquee | Need it for non-hero contexts too |
| Noise/grain textures | MeshHeroGrain | Should be a site-wide option, not just hero |

## Theme Generation Updates

Adjustments to recommend for the generation prompts:

- Default background: shift from pure #ffffff toward #fafaf8 or #f5f2ed
  (warmer, more contemporary)
- Font pairings: increase weight of serif + sans-serif combinations
  (currently over-indexing on all-sans)
- Button styles: rounded corners trending larger (16-24px border-radius,
  not 4-8px). Some sites going full pill shape.
- Section spacing: trending larger. py-24 lg:py-40 instead of py-16 lg:py-24.
  More breathing room.
```

### 3. Quarterly Technology Brief

What's newly possible in browsers that we should build for.

```markdown
# Technology Brief — Q1 2026

## Now Shippable (>80% browser support)
- CSS `scroll-timeline` — scroll-driven animations without JS
- CSS `@starting-style` — animate element entry (replaces x-intersect for simple cases)
- View Transitions API (Level 1) — cross-document transitions
- CSS `text-wrap: balance` — balanced text wrapping (already using this)
- `popover` attribute — native popovers without JS

## Almost There (60-80% support)
- CSS `anchor()` positioning — position elements relative to other elements
- CSS `@scope` — scoped styles without shadow DOM
- Speculation Rules API — prerender likely navigation targets

## Watch List (<60% support)
- CSS `@function` — user-defined CSS functions
- CSS Mixins (`@mixin`, `@apply`) — still in discussion
- CSS `sibling-count()` / `sibling-index()` — style based on sibling position

## Implications for Block Library
1. **Scroll-timeline is ready.** Every scroll-driven block should have a
   CSS-only implementation path now. Remove JS scroll listeners where possible.
2. **@starting-style replaces simple x-intersect.** For fade-in-on-entry
   animations, pure CSS is now sufficient. Reserve Alpine.js x-intersect
   for complex choreographed sequences.
3. **View Transitions could transform page navigation.** When a user clicks
   from the portfolio grid to a project detail page, the image could morph
   from grid thumbnail to hero. This is a Make Studio platform feature, not
   just a block feature.
```

---

## The Agent Loop

Adapted from the autoresearch pattern — but the agent produces documents, not code.

```
SETUP:
1. Agent reads trend-program.md (research instructions + source list)
2. Agent reads previous digests/reports (builds on existing knowledge)
3. Agent reads current block catalog + theme capabilities (knows what we have)

WEEKLY LOOP:
1. Scan Tier 1 sources (Awwwards, Godly, etc.) — what won awards this week?
2. Scan Tier 3 sources (Twitter, Dribbble) — what's getting attention?
3. Scan Tier 4 sources (Can I Use, Chrome blog) — any new capabilities?
4. Cross-reference with previous weeks — what's accelerating? decelerating?
5. Write the weekly digest
6. Flag anything that's directly actionable for the block catalog
7. Update the running trend database

MONTHLY (first week of month):
1. Synthesize weekly digests into monthly report
2. Identify macro trends (multi-week patterns)
3. Perform block library gap analysis
4. Recommend theme generation prompt updates
5. Recommend priority changes for block R&D agents

QUARTERLY (first month of quarter):
1. Technology brief — what's newly shippable
2. Major trend shifts (what peaked, what's emerging, what died)
3. Competitive analysis — what are other builders doing?
4. Strategic recommendations for the next quarter's block R&D
```

### trend-program.md

```markdown
# Trend Radar — Agent Instructions

## Your Role
You are a web design trend analyst. You scan the design landscape
and produce intelligence that keeps the Make Studio platform current.
You do NOT write code. You write analysis, observations, and
recommendations.

## What You're Looking For

### Visual Patterns
- Color palettes (what's popular, what's fading)
- Typography trends (font pairings, sizes, weights, effects)
- Layout patterns (grid styles, spacing, section structures)
- Image treatments (duotone, grain, masks, blend modes)
- Animation patterns (scroll-driven, micro-interactions, transitions)
- Texture and depth (shadows, gradients, noise, glassmorphism)

### Interaction Patterns
- Navigation styles (sticky, hidden, hamburger trends)
- Scroll behaviors (parallax, horizontal, snap, driven animations)
- Cursor effects (custom cursors, magnetic buttons, hover reveals)
- Loading and transition patterns
- Mobile-specific interactions (swipe, pull-to-refresh, bottom nav)

### Structural Patterns
- Hero section trends (what's winning: video, text-only, split, etc.)
- Social proof presentation (testimonials, logos, stats, case studies)
- CTA patterns (placement, style, urgency)
- Footer evolution
- Single-page vs. multi-page vs. hybrid

### Technology Shifts
- New CSS features gaining adoption
- New JS APIs becoming usable
- Framework trends that affect design patterns
- Performance expectations changing
- Accessibility requirements evolving

## How to Evaluate

For each trend you identify, assess:
1. **Signal strength** — How many sources show this? One award site or everywhere?
2. **Trajectory** — Emerging, peaking, or declining?
3. **Relevance** — Does this matter for the types of sites we build?
4. **Actionability** — Can we do something about it? New block? Theme update? Prompt change?
5. **Effort** — How hard would it be to implement?

## Output Format
- Weekly digest: Short, punchy, opinionated. 4 sections: Hot, Emerging, Declining, Actionable.
- Monthly report: Deeper analysis, visual references, gap analysis, recommendations.
- Quarterly brief: Technology focus, strategic recommendations.

## What You Know About Our Platform
[Link to block catalog, theme capabilities, generation prompts, current limitations]

## Previous Reports
[Link to archive of past digests and reports]
```

---

## How Intelligence Flows Into the Platform

The trend reports don't just sit in a folder. They feed into every part of the system:

```
Trend Agent produces intelligence
        │
        ├──→ Block R&D agents read trends before generating
        │    "Scroll-driven text reveals are hot → prioritize ScrollHeroReveal"
        │
        ├──→ Theme generation prompts updated
        │    "Default bg shifting warmer → change #ffffff to #fafaf8"
        │    "Pill-shaped buttons trending → increase default border-radius"
        │
        ├──→ Block catalog priorities reshuffled
        │    "Horizontal scroll sections are a gap → add to build queue"
        │    "Glassmorphism is declining → deprioritize glass effects"
        │
        ├──→ Image library harvest informed
        │    "Analog/film aesthetic trending → harvest more grain/texture images"
        │    "Warm color palettes → add 'warm-analog' LUT to the grading set"
        │
        ├──→ Human reads weekly digest over coffee
        │    Quick scan, maybe adds a note: "Agree on scroll-driven priority"
        │    or "I don't think custom cursors fit our market"
        │
        └──→ Compound: taste evolves over time
             The platform doesn't just stay current — it anticipates.
             When a trend is "emerging" for 3 weeks, the block R&D agents
             are already building for it. By the time it's "hot," we have
             the blocks ready.
```

### The Anticipation Advantage

Most website builders are reactive — they add bento grids after bento grids have been everywhere for a year. By then, bento grids are already starting to feel dated to design-savvy users.

With the trend radar:
- Week 1-3: Trend agent notices bento grids appearing on award sites ("emerging")
- Week 4-6: Block R&D agent builds 3-4 bento block variants
- Week 8: Trend goes mainstream. We already have polished bento blocks in the library.
- Month 6: Trend is everywhere. Other builders are scrambling to add it. We've had it for months.
- Month 12: Trend is declining. Trend agent flags it. We stop promoting bento blocks, start promoting whatever's next.

This is a **6-month lead** over reactive builders. That's the competitive advantage of autonomous research.

---

## What This Doesn't Replace

The trend radar is intelligence, not taste. It tells you **what's happening** in web design, not **what we should do about it**. The human still makes the strategic calls:

- "Yes, pursue scroll-driven animations — they fit our market"
- "No, skip custom cursors — too niche for small business sites"
- "Interesting that brutalism is trending, but our users want polished, not raw"

The agent informs. The human decides. The block R&D agents execute.

The weekly digest should take 2-3 minutes to read. If it takes longer, it's too verbose. The agent's job is to compress a week of design landscape into a page of signal.

---

## Implementation

### Phase 1: Manual Research (Now)

Before building the agent, do the loop manually for 2-3 weeks to validate the format and sources:
1. Spend 30 minutes scanning Awwwards + Godly + Dribbble
2. Write a quick digest by hand
3. See if it actually changes your priorities
4. Iterate on the format until it's useful

### Phase 2: Agent-Assisted Research

Build the agent loop using Claude Code:
1. Agent fetches recent award winners (WebFetch on Awwwards/Godly pages)
2. Agent summarizes what it sees in the screenshots/descriptions
3. Agent cross-references with previous digests
4. Agent drafts the weekly digest
5. Human reviews and edits (5 minutes)

### Phase 3: Autonomous Research

Agent runs on a schedule (weekly cron or triggered manually):
1. Full source scan (Tier 1-4)
2. Digest generation
3. Published to `docs/research/trends/` archive
4. Actionable items automatically added to `docs/review/pending.md` for human review

### Storage

```
docs/research/trends/
  trend-program.md              # Agent instructions
  weekly/
    2026-W11.md                 # Weekly digest
    2026-W12.md
    ...
  monthly/
    2026-03.md                  # Monthly report
    2026-04.md
    ...
  quarterly/
    2026-Q1.md                  # Quarterly tech brief
    ...
  trend-db.json                 # Running database of identified trends
                                # with trajectory (emerging/hot/declining/dead)
```

---

## Discussion Log

- **2026-03-10**: Initial research. Defined source tiers (award sites, publications, social, technology), output formats (weekly digest, monthly report, quarterly brief), agent loop structure, intelligence flow into platform, and the anticipation advantage model.
