# Direct Site Generation Research

Tracking document for evolving the site generation workflow from HTML-first to direct Make Studio composition.

## Problem Statement

The current **Generate** workflow yields the highest creative quality but requires a painful 7-phase HTML→blocks conversion. The **Compose** workflow is fast and automated but constrained by the seed library. We want the creative quality of generation with the speed of composition — and access to interactive blocks (carousels, maps, forms) that AI can't easily generate from scratch.

## Current Workflows

| Workflow | Creative Quality | Effort | Interactive Blocks |
|----------|-----------------|--------|--------------------|
| Generate | Highest | High (7 phases, manual conversion) | No |
| Convert | High | Medium (section-by-section) | No |
| Compose | Medium | Low (automated 13-step script) | Yes |

## Architecture Options

### Option A: Hybrid — Generate + Library Selection
AI generates custom blocks for creative sections (hero, features) while selecting pre-built blocks for interactive/complex ones (carousels, maps, forms). Uses Make Studio's `/blocks/generate-template` endpoint for custom blocks + compose-style selection for library blocks.

### Option B: Server-Side Page Generation
Use Make Studio's existing `/page-generation/sites/:siteId/generate-page` streaming endpoint. Already does block selection + content generation. Fast to implement but creative quality limited to existing blocks.

### Option C: Claude-Driven Direct Composition
Claude produces Make Studio artifacts directly (theme.json + block templates + fields + content) without HTML intermediary. Uses the API client to push everything. Can mix generated + library blocks.

---

## Hero Blocks: Making Them Great

Heroes are the first thing visitors see and the biggest opportunity for visual impact. Below are 10 approaches ranked from easiest to hardest for AI to execute.

### Existing Hero Inventory

We have ~20 hero variants across themes:
- **Centered** — vertical stack, centered text, optional badge
- **Split** — 2-column grid, text left / image right
- **Background Image** — full-bleed image with text overlay
- **Diagonal** — SVG polygon separator between text and image
- **Gallery** — staggered multi-image layout
- **With Demo** — screenshot/product mockup below text
- **Stats** — inline metrics alongside headline
- **Video** — video background (OkGoSandbox)

### 10 Ways to Make Great Heroes (Least → Most Difficult for AI)

#### 1. Bold Typography + Color Contrast (Trivial)
No images needed. Oversized headline with `heading-xl`, strong color contrast (light text on `bg-brand` or `bg-base-alt`), generous whitespace. Maybe a gradient text effect via custom CSS.

**Why it's easy:** Pure theme tokens. AI just picks the right color combination and lets the typography system do the work. Already supported — just needs confident design choices.

**Make Studio implementation:** Standard centered hero block with `bg-base-alt` or `bg-brand` background, no image fields. Theme handles everything.

---

#### 2. Curated Stock Photography (Easy)
Split or background hero with a high-quality stock photo from Pexels. The image does the heavy lifting.

**Why it's easy:** Pexels API integration already exists (`scripts/search-pexels.ts`). AI picks a good search query, selects from results. Upload to R2, done.

**Make Studio implementation:** HeroSplitImage or HeroBgImage block + Pexels sourcing. Already works in compose workflow.

---

#### 3. Video Backgrounds (Easy-Medium)
Looping ambient video behind hero text. Stock video from Pexels (they serve video too) or a curated library. Autoplaying, muted, looped.

**Why it's easy:** The HTML is straightforward — a `<video>` tag with `autoplay muted loop playsinline` behind an absolute-positioned text overlay. The creative challenge is finding the right video, not building the block.

**Make Studio implementation:** Needs a `video` field type (already supported) + a VideoHero block template. One block template covers all cases. The hard part is sourcing good ambient video — Pexels has a video API we could integrate.

**Template sketch:**
```handlebars
<section class="relative overflow-hidden min-h-[80vh] flex items-center">
  <video class="absolute inset-0 w-full h-full object-cover" autoplay muted loop playsinline>
    <source src="{{background-video}}" type="video/mp4">
  </video>
  <div class="absolute inset-0 bg-black/50"></div>
  <div class="relative z-10 max-w-7xl mx-auto px-6 text-center">
    <h1 class="heading-xl text-white">{{headline}}</h1>
    <p class="body-lg text-white/80">{{subheadline}}</p>
  </div>
</section>
```

---

#### 4. Geometric / Abstract Backgrounds (Easy-Medium)
CSS-only patterns, gradients, or SVG shapes behind text. Mesh gradients, radial gradients, grid patterns, dot patterns. No external assets needed.

**Why it's easy:** Pure CSS/SVG — no image generation or sourcing. AI can produce interesting gradients and patterns procedurally. Tailwind's gradient utilities help.

**Make Studio implementation:** Custom CSS in the block template. Could offer a `select` field for pattern type (gradient, mesh, dots, grid) or just bake in a good default. The diagonal hero (HeroSplitDiagonal) already uses SVG shapes — this extends that idea.

---

#### 5. Illustration / Icon Compositions (Medium)
Hero with a composed arrangement of Phosphor icons or simple SVG illustrations instead of photography. Clean, modern, works great for SaaS/tech.

**Why it's easy-ish:** Phosphor icons already integrated via `{{icon "name"}}` helper. AI can arrange a grid or scattered layout of relevant icons. No external assets.

**Why it's harder:** Composing icons into a visually appealing arrangement requires spatial design sense. A floating/scattered layout is harder than a grid. Animation (icons floating in) adds complexity.

**Make Studio implementation:** Items field for icons (name, size, position?), or a curated set of icon composition layouts. Could also use a group field for fixed icon positions.

---

#### 6. Text Effects + Animation (Medium)
Animated text reveals, typewriter effects, gradient text, text with image masks, staggered word animations. Makes the typography itself the visual centerpiece.

**Why it's medium:** Requires Alpine.js for animation (already used for `x-intersect`) and custom CSS for text effects. AI needs to write working animation code, not just static HTML.

**Make Studio implementation:** Alpine.js `x-data` + `x-init` for typewriter/staggered reveals. CSS `background-clip: text` for gradient text. Custom CSS field or baked into template variants.

---

#### 7. AI-Generated Hero Images (Medium-Hard)
DALL-E or similar generates a custom hero image matching the site's brand and content. Abstract backgrounds, lifestyle scenes, product concepts.

**Why it's medium:** Image generation API already integrated (`scripts/generate-image.ts`). The hard part is prompt engineering — getting an image that:
- Matches the site's color palette
- Leaves space for text overlay (if background image)
- Looks professional, not "AI-generated"
- Works at hero aspect ratios (wide, not square)

**Make Studio implementation:** Same as stock photo heroes but with generated images. The challenge is entirely in prompt quality and image selection. Could generate 3-4 options and let user pick.

---

#### 8. Parallax / Depth Layers (Medium-Hard)
Multiple layered images or elements that move at different scroll speeds, creating depth. Foreground text, midground elements, background image.

**Why it's harder:** Requires JavaScript scroll listeners or CSS `perspective` + `transform`. Multiple image layers need to be sourced or generated. Performance considerations (requestAnimationFrame, will-change).

**Make Studio implementation:** Would need a specialized block template with scroll-driven animation. Multiple image fields for layers. Alpine.js or vanilla JS for scroll handling. Could simplify to 2 layers (background slow, foreground normal) for an easier version.

---

#### 9. Interactive / 3D Elements (Hard)
WebGL backgrounds, Three.js particle fields, interactive mouse-following effects, 3D product renders. The "wow factor" approach.

**Why it's hard:** Requires external libraries (Three.js, GSAP), significant JavaScript, and careful performance optimization. AI can write basic Three.js but debugging 3D scenes is complex. Loading external scripts in Make Studio blocks needs testing.

**Make Studio implementation:** Would likely need a `customCSS` or `customJS` field, or a specialized block that loads Three.js from CDN. Simpler version: CSS-only 3D transforms with `perspective` and `rotateX/Y` on hover.

---

#### 10. Dynamic Data-Driven Heroes (Hard)
Hero content that changes based on time of day, user location, scroll position, or real-time data. "Good morning" greetings, weather-aware imagery, live counters.

**Why it's hardest:** Requires client-side JavaScript, potentially external API calls, and graceful fallbacks. Personalization logic is complex. Also raises caching/CDN concerns for static sites.

**Make Studio implementation:** Would need Alpine.js `x-data` with `fetch()` calls or `Date` logic. Fallback content essential. Could start simple: time-of-day greeting + a rotating headline from an items field.

---

### Moonshots: 5 Wild Hero Ideas

These are the "how did they do that?" heroes — the kind that get shared on Twitter, win Awwwards, and make every other website builder jealous. They range from ambitious to borderline irresponsible.

#### 11. Generative Art Heroes (Ambitious)
A unique piece of generative art rendered on every page load. Think Sol LeWitt meets the web — algorithmic compositions using the site's brand colors. Canvas or SVG-based. Every visitor sees a slightly different hero. Could be flow fields, voronoi diagrams, recursive shapes, or organic noise patterns.

**Why it's wild:** The hero IS the brand. No stock photos, no AI-generated images — a living, mathematical artwork that's always on-brand because it draws from the theme's color tokens. Nobody else's site looks like yours because the seed is different.

**What makes it hard:** Requires a canvas/SVG rendering pipeline in the block. The AI needs to write generative algorithms that produce consistently beautiful results across random seeds — not just "sometimes cool, sometimes garbage." Performance on mobile matters. But the core algorithms (Perlin noise, voronoi, flow fields) are well-documented and Claude can write them.

**Make Studio angle:** A handful of generative "algorithms" as select options (flow-field, voronoi, circles, waves), pulling colors directly from CSS custom properties. The block is self-contained — no external dependencies, just `<canvas>` + vanilla JS. Users get a unique hero with zero creative effort.

---

#### 12. Scroll-Reactive Storytelling Heroes (Very Ambitious)
The hero is a full-viewport narrative experience. As you scroll, elements animate in sequence — text reveals, images slide, counters tick up, backgrounds shift. Not just "fade in on scroll" but a choreographed sequence where scroll position is the playhead. Think Apple product pages.

**Why it's wild:** It turns the hero from a static banner into a 5-10 second experience. The scroll becomes the interaction. Users feel like they're "discovering" the content rather than just reading it. This is the kind of thing agencies charge $50k+ to build.

**What makes it hard:** Scroll-driven choreography requires precise timing, easing, and sequencing across multiple elements. Every element needs a scroll trigger range, a transform, and an easing curve. Testing across devices/scroll behaviors (trackpad vs. touch vs. mouse wheel) is painful. The AI needs to produce a timeline, not just a layout.

**Make Studio angle:** Alpine.js + `IntersectionObserver` or the new CSS `scroll-timeline` (progressive enhancement). An items field defines the "story beats" — each with text, optional image, and animation type. The block handles sequencing. Could offer 2-3 choreography presets (fade-sequence, slide-deck, zoom-through).

---

#### 13. AI-Composed Collage Heroes (Very Ambitious)
AI doesn't just pick one hero image — it composes a multi-layered collage. Foreground product shot with transparent background, midground texture/pattern, background color from theme. Think editorial magazine covers or fashion lookbooks. Multiple images composited with CSS `mix-blend-mode`, masks, and layering.

**Why it's wild:** Stock photo sites give you a flat image. This gives you a *composition*. The AI sources 3-4 images (product, texture, accent element, background), then layers them with blend modes and CSS masks to create something that looks art-directed. Each site gets a unique visual identity that goes way beyond "hero image."

**What makes it hard:** Composition is taste. Getting blend modes, opacity, and positioning to look intentional rather than chaotic requires design judgment. AI image generation for transparent-background elements is unreliable. The AI needs to understand which image is foreground vs. texture vs. accent — that's a creative direction decision, not a technical one.

**Make Studio angle:** A collage hero block with 3-4 image fields (foreground, texture, accent, background) plus select fields for blend mode and composition style. AI sources and assigns images to layers. Could have preset compositions (editorial, tech-minimal, organic-overlap) that handle the positioning. The hard part is making the presets flexible enough to look good with arbitrary images.

---

#### 14. Live Camera / Environment-Aware Heroes (Unhinged)
The hero incorporates the visitor's real environment. Camera feed as a background (with permission), ambient light detection to shift color temperature, device orientation to parallax elements, or even audio-reactive visualizations from the device microphone. The website *responds* to the person viewing it.

**Why it's wild:** Nobody does this. It collapses the boundary between the website and the physical world. A restaurant site where the hero shifts warm/cool based on time of day AND your ambient light. A music site where the hero pulses to the sound in your room. A portfolio where tilting your phone tilts the hero.

**What makes it hard:** Permissions (camera, microphone, sensors) kill the experience for most users. Every feature needs a beautiful fallback. Privacy concerns are real. Browser support varies. And the "wow" only works if the fallback is also great — you can't have a broken hero for the 80% who deny permissions.

**Make Studio angle:** Progressive enhancement is everything. Start with a gorgeous static hero (bold typography, good image). Layer on `DeviceOrientationEvent` for subtle parallax (no permission needed on most devices). Offer camera/audio as opt-in "experiences" triggered by a button, not on load. The block works at every permission level. Alpine.js handles the enhancement layers.

---

#### 15. Bespoke Typographic Heroes — AI Type Design (Completely Unhinged)
The AI generates a custom display typeface for the hero headline. Not picking from Google Fonts — actually designing letterforms that embody the brand's personality. Chunky rounded letters for a playful brand, sharp angular forms for tech, flowing scripts for luxury. Rendered as SVG paths so every headline is a piece of type design.

**Why it's wild:** Custom type design is one of the highest-signal brand investments. It's what separates a $500 website from a $50,000 brand identity. If AI could generate even passable custom display type, it would be genuinely unprecedented in the website builder space. Every site gets a bespoke typographic identity.

**What makes it hard:** Type design is one of the hardest design disciplines. Letterforms need optical consistency, proper spacing (kerning), and aesthetic coherence across an entire character set. AI can generate individual letters but making them feel like they belong to the same typeface is a massive unsolved problem. SVG path generation for text is technically feasible but quality control is brutal — one bad letter ruins the whole word.

**Make Studio angle:** Scope it down: generate SVG lettering for the headline only (5-15 characters), not a full font. Use a style-transfer approach — take an existing font's structure and warp/stylize it. Render as inline SVG in the hero template. Fallback to a Google Font for body text and non-hero contexts. Could cache the generated SVG as a "logo mark" that persists across pages.

---

#### 16. WebGL 3D Environment Heroes (Unhinged + Libraries)
A fully rendered 3D scene as the hero background — floating geometric objects, an abstract landscape, a product orbiting in space, or a miniature world the user peers into. Built with Three.js or OGL. The scene is alive: objects rotate, lights shift, fog drifts. Mouse movement controls the camera or subtly tilts the scene, giving the visitor a sense of presence.

**Why it's wild:** This is the territory of studios like Active Theory and Immersive Garden — the sites that win FWA/Awwwards Site of the Day. A 3D hero immediately signals "this is not a template." The scene can be thematic: a SaaS product floating in a particle cloud, a restaurant with a slowly rotating dish, an architecture firm with a wireframe building that solidifies on scroll.

**What makes it hard:** Three.js is a 600KB library with a steep learning curve. Scene composition (lighting, camera, materials, geometry) requires 3D art direction — bad lighting makes everything look like a CS homework assignment. Performance varies wildly across devices; a scene that's butter on an M3 MacBook can choke a mid-range Android. Mobile fallback is essential. And the AI needs to write working Three.js code that initializes, renders, and cleans up properly — memory leaks from un-disposed scenes are a classic footgun.

**Feasibility for AI:** Surprisingly decent for scoped scenes. Claude can write solid Three.js boilerplate — a rotating torus knot with bloom postprocessing, a particle field that responds to mouse position, a grid of cubes with wave animation. The trick is constraining to a library of proven scene "recipes" rather than asking for open-ended 3D art direction.

**Make Studio implementation:**
- Load Three.js from CDN (`<script src="https://unpkg.com/three@0.160.0/build/three.module.js" type="module">`)
- Block template has a `<canvas>` element + inline `<script type="module">` for the scene
- Select field for scene type: `particles`, `floating-geometry`, `terrain`, `product-orbit`, `abstract-landscape`
- Theme colors feed into material colors via CSS custom property extraction
- Mouse tracking via `pointermove` → camera/object subtle rotation (damped with lerp)
- Mobile: reduce particle count, disable postprocessing, fall back to static render or CSS-only background
- Key performance pattern: `requestAnimationFrame` loop with `IntersectionObserver` to pause when off-screen

**Scene recipe examples:**
- **Particle field:** 2000-5000 particles in a sphere distribution, brand-colored, drift slowly, mouse moves camera. Minimal geometry, maximum vibes.
- **Floating geometry:** 5-10 abstract shapes (torus, icosahedron, octahedron) with glass/metallic materials, floating in a void with soft ambient light. Mouse tilts the group.
- **Terrain:** A low-poly landscape generated with Perlin noise displacement, viewed from above at an angle. Fog fades to the theme's background color. Slow camera drift.
- **Grid wave:** A flat grid of points/cubes that ripple in a sine wave emanating from the mouse position. Clean, geometric, very SaaS.

---

#### 17. Glitch / Distortion Typography Heroes (Ambitious + Libraries)
The headline itself is the spectacle. Text rendered into a WebGL plane and subjected to real-time distortion effects — glitch artifacts, RGB channel splitting, noise displacement, liquid warping, magnetic repulsion from the cursor. The text is readable but *alive*. Mouse movement drives the intensity: idle is subtle, movement triggers chaos, then it settles back.

**Why it's wild:** Typography distortion is the signature of high-end creative studios and music/fashion brands. It takes the most basic element of a website — the headline — and makes it feel dangerous and electric. When the text literally bends away from your cursor or shatters into RGB fragments on hover, it creates a visceral response that no stock photo can match.

**What makes it hard:** Requires rendering text to a texture (Canvas2D → WebGL texture), then applying fragment shaders for the effects. GLSL shader programming is a niche skill — the AI needs to write working vertex/fragment shaders that produce aesthetically pleasing distortion, not just random noise. Text readability must survive the effect; too much distortion and it's unreadable, too little and it's boring. The balance point is narrow.

**Library options:**
- **Three.js + custom shaders** — Most flexible but most code. Text rendered to `CanvasTexture`, applied to a `PlaneGeometry`, custom `ShaderMaterial` with uniforms for mouse position, time, and intensity.
- **OGL** — Lighter than Three.js (~30KB), built for exactly this kind of 2D-in-WebGL work. Better for text planes.
- **PixiJS** — 2D WebGL renderer with displacement filters built in. Easier API but less shader control.
- **Theatre.js** — Animation sequencing on top of Three.js, good for choreographed glitch → settle transitions.

**Effect recipes:**
- **RGB split:** Offset R, G, B channels by different amounts based on mouse velocity. Classic glitch look. Simple fragment shader — 3 texture samples with offset UVs.
- **Noise displacement:** Perlin/simplex noise displaces UV coordinates. Mouse proximity increases noise amplitude. Text warps like heat haze.
- **Liquid/elastic:** Text plane deforms like a rubber sheet. Mouse pushes create a bulge that ripples outward and settles. Vertex shader displacement with spring physics.
- **Scanline glitch:** Horizontal slices of the text offset randomly for a few frames, then snap back. Triggered by mouse movement exceeding a velocity threshold. Fragment shader with `step()` and random offset per scanline.
- **Magnetic repulsion:** Text fragments (individual letters or horizontal strips) push away from the cursor position like magnets. Vertex displacement based on distance to mouse. Letters return to position with easing when mouse moves away.

**Make Studio implementation:**
- Load OGL or Three.js from CDN
- Block renders headline into a hidden `<canvas>` element using Canvas2D (respects theme font from CSS)
- WebGL scene samples that canvas as a texture on a screen-space quad
- Select field for effect type: `rgb-split`, `noise-warp`, `liquid`, `scanline-glitch`, `magnetic`
- Number field for intensity (0.1 – 1.0)
- Toggle for mouse-reactive vs. auto-animated
- Mouse tracking with damped lerp (smooth, not jittery)
- Fallback: if WebGL unavailable, show the plain HTML headline with a CSS `text-shadow` glitch animation (pure CSS, no JS)
- Performance: effects run only when hero is in viewport (`IntersectionObserver`), pause on mobile or offer reduced-motion alternative

**The secret sauce:** The text content stays editable in Make Studio's CMS. The user types their headline into a regular text field, and the block renders it through the distortion pipeline. Change the headline, the effect updates. No re-exporting, no SVG regeneration. It's a *lens* over the content, not a replacement for it.

---

---

## Block R&D Pipeline: Specialist Agent Loops

### The Idea

Instead of trying to generate these complex hero blocks on the fly during site creation, we build them in advance through a **specialist agent loop**. Each agent focuses on one narrow domain, iterates with human feedback, and produces a library of production-ready blocks with meaningful configurable handles. The site-building AI then *selects and tunes* these blocks rather than generating them from scratch.

This is a fundamentally different paradigm:
- **Current:** AI generates everything at site-creation time (high creativity, low reliability)
- **Proposed:** Specialist agents do R&D in advance → site-building AI selects and configures (high reliability, high creativity from the library)

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                  BLOCK R&D LAYER                     │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Generative  │  │   WebGL      │  │  Scroll    │ │
│  │  Art Agent   │  │  Glitch Agent│  │  Story Agent│ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                 │                 │        │
│         ▼                 ▼                 ▼        │
│  ┌─────────────────────────────────────────────────┐ │
│  │           Block Ingress Site                     │ │
│  │   Sync → Deploy → Screenshot → Human Feedback   │ │
│  └─────────────────────────────────────────────────┘ │
│         │                 │                 │        │
│         ▼                 ▼                 ▼        │
│  ┌─────────────────────────────────────────────────┐ │
│  │        Graduated Block Library                   │ │
│  │   Blocks with handles, aiDescription, tags       │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              SITE CREATION LAYER                     │
│                                                      │
│  User: "Build me a site for a meditation app"        │
│                                                      │
│  AI selects: GenerativeHeroFlowField                 │
│  AI configures handles:                              │
│    speed: 0.2 (slow, mellow)                         │
│    particle-count: 800 (sparse, calm)                │
│    palette: "brand, brand/30, base-muted"            │
│    headline: "Find Your Stillness"                   │
│                                                      │
│  AI selects: GlitchHeroRGBSplit                      │
│  AI configures handles:                              │
│    speed: 2.0 (fast, aggressive)                     │
│    intensity: 0.8 (heavy distortion)                 │
│    trigger: "mouse-velocity"                         │
│    headline: "BREAK THE META"                        │
└─────────────────────────────────────────────────────┘
```

### Specialist Agents

Each agent has a narrow focus and runs in a loop: generate → sync → screenshot → compare → iterate. The existing block ingress pipeline (`block-screenshot.ts`) already supports this.

#### Agent: Generative Art Heroes
**Focus:** Canvas/SVG algorithmic art backgrounds
**Loop produces:** Flow fields, voronoi, recursive shapes, noise patterns, wave functions
**Iteration target:** Visual beauty + theme color integration + performance

**Example blocks it might produce:**
- `GenerativeHeroFlowField` — Perlin noise flow field with brand-colored particles
- `GenerativeHeroVoronoi` — Voronoi cells with gradient fills from palette
- `GenerativeHeroCircles` — Recursive circle packing in brand colors
- `GenerativeHeroWaves` — Sine wave composition, layered, slow-moving
- `GenerativeHeroGrid` — Dot grid with proximity-based size/color shift

#### Agent: WebGL Effects Heroes
**Focus:** Three.js/OGL scenes, glitch shaders, distortion effects
**Loop produces:** 3D environments, text distortion, particle systems
**Iteration target:** Visual impact + readability + mobile fallback + performance

**Example blocks:**
- `GlitchHeroRGBSplit` — Headline with RGB channel separation on mouse move
- `GlitchHeroNoise` — Headline with noise displacement, settles when idle
- `WebGLHeroParticles` — 3D particle field, mouse controls camera
- `WebGLHeroTerrain` — Low-poly landscape with fog
- `WebGLHeroFloatingGeo` — Abstract shapes with glass materials

#### Agent: Scroll & Animation Heroes
**Focus:** Scroll-driven choreography, text animation, entrance sequences
**Loop produces:** Staggered reveals, parallax layers, scroll timelines
**Iteration target:** Timing + easing + scroll behavior across devices

**Example blocks:**
- `ScrollHeroReveal` — Words reveal one at a time on scroll
- `ScrollHeroParallax` — 3-layer depth with independent scroll speeds
- `ScrollHeroPinned` — Hero stays pinned while content animates through
- `AnimatedHeroTypewriter` — Headline types out character by character
- `AnimatedHeroStagger` — Elements cascade in with staggered delays

#### Agent: Video & Media Heroes
**Focus:** Video backgrounds, image treatments, blend modes
**Loop produces:** Video heroes, collage compositions, duotone/halftone effects
**Iteration target:** Media quality + loading performance + text readability over media

**Example blocks:**
- `VideoHeroAmbient` — Looping background video with overlay
- `VideoHeroSplit` — Video on one side, text on other
- `CollageHeroEditorial` — Multi-layer image composition with blend modes
- `DuotoneHero` — CSS duotone filter over hero image in brand colors
- `HalftoneHero` — SVG halftone dot pattern over image

### Handles: The Configurable Surface

The key insight is that each block exposes **meaningful handles** — not just content fields (headline, subheadline) but *behavioral parameters* that let the site-building AI tune the block's personality to match a brand.

Handles fall into three categories:

#### Mood Handles (how it feels)
These map directly to brand personality. The site-building AI's primary tool for matching a block to a vibe.

| Handle | Field Type | Range | Low End | High End |
|--------|-----------|-------|---------|----------|
| `Speed` | `number` | 0.1 – 3.0 | Meditation app, luxury | Gaming, energy drink |
| `Intensity` | `number` | 0.1 – 1.0 | Subtle accent | In your face |
| `Density` | `number` | 0.1 – 1.0 | Minimal, airy | Rich, complex |
| `Chaos` | `number` | 0.0 – 1.0 | Orderly, geometric | Organic, unpredictable |

#### Visual Handles (how it looks)
Map to design decisions. AI sets these based on the theme and desired aesthetic.

| Handle | Field Type | Options/Range | Purpose |
|--------|-----------|---------------|---------|
| `Palette Mode` | `select` | `brand`, `monochrome`, `accent`, `gradient` | Which theme colors feed the effect |
| `Particle Size` | `number` | 1 – 20 | Scale of visual elements |
| `Particle Count` | `number` | 100 – 5000 | Complexity (auto-reduced on mobile) |
| `Background Opacity` | `number` | 0.0 – 1.0 | How much effect shows vs. solid bg |
| `Blur` | `number` | 0 – 20 | Softness of the effect |
| `Effect Style` | `select` | per-block options | Variant within the block type |

#### Interaction Handles (how it responds)
Control the relationship between user input and the effect.

| Handle | Field Type | Options | Purpose |
|--------|-----------|---------|---------|
| `Trigger` | `select` | `mouse-position`, `mouse-velocity`, `scroll`, `auto`, `hover-only` | What drives the effect |
| `Reactivity` | `number` | 0.0 – 1.0 | How much input affects the output |
| `Settle Time` | `number` | 0.5 – 5.0 | Seconds to return to rest state |
| `Mobile Behavior` | `select` | `auto-animate`, `static`, `reduced`, `gyroscope` | Fallback when no mouse |

### How the Site-Building AI Uses Handles

The `aiDescription` on each block tells the site-building AI when and how to use it:

```json
{
  "aiDescription": "Animated particle flow field hero. Slow speed + low density = calm/luxury. Fast speed + high density = energy/tech. Always readable. Use for brands that want to feel alive and modern without being aggressive.",
  "tags": ["hero", "generative", "animated", "canvas", "particles"]
}
```

When composing a site, the AI reads these descriptions and sets handles in the content:

```json
{
  "GenerativeHeroFlowField": {
    "Headline": "Find Your Stillness",
    "Subheadline": "Guided meditation for the modern mind",
    "Speed": 0.2,
    "Intensity": 0.3,
    "Density": 0.3,
    "Chaos": 0.1,
    "Palette Mode": "monochrome",
    "Particle Size": 3,
    "Trigger": "auto",
    "Mobile Behavior": "auto-animate"
  }
}
```

vs. for a gaming brand:

```json
{
  "GenerativeHeroFlowField": {
    "Headline": "BREAK THE META",
    "Subheadline": "Season 4 drops Friday",
    "Speed": 2.5,
    "Intensity": 0.9,
    "Density": 0.8,
    "Chaos": 0.7,
    "Palette Mode": "accent",
    "Particle Size": 1,
    "Trigger": "mouse-velocity",
    "Mobile Behavior": "gyroscope"
  }
}
```

Same block. Completely different personality. The block R&D agents already figured out the hard part (making the effect work, look good, perform well). The site-building AI just turns the knobs.

### The Agent Loop in Practice — Informed by autoresearch

Karpathy's [autoresearch](https://github.com/karpathy/autoresearch) establishes a clean pattern for autonomous agent experimentation: one file to modify, one metric to optimize, a keep/discard loop, a results ledger, and a `program.md` that programs the agent's behavior. The agent runs indefinitely until interrupted.

Our block R&D loop adapts this pattern. The key differences: our "metric" requires human judgment (visual quality isn't a single number), and our experiments produce artifacts (blocks) rather than optimizing a single file. But the structural patterns map cleanly.

#### autoresearch → Block R&D Mapping

| autoresearch | Block R&D | Notes |
|-------------|-----------|-------|
| `train.py` (one file agent edits) | `BlockName.html` + `BlockName.json` (template + fields) | Scoped modification surface |
| `val_bpb` (automated metric) | Screenshot + human feedback | Our biggest gap — no automated quality metric |
| `program.md` (human programs the agent) | `block-program.md` per specialist | Category-specific instructions, references, quality criteria |
| `results.tsv` (experiment ledger) | `results.tsv` per agent run | Track every attempt: commit, status, description, feedback |
| 5-minute time budget | Sync + deploy + screenshot cycle (~2 min) | Fixed iteration cost |
| `autoresearch/<tag>` branch | `block-rnd/<category>/<tag>` branch | Isolation per run |
| keep/discard (git reset if worse) | keep/discard (advance or revert) | Same — but "worse" requires human judgment |
| **NEVER STOP** | **NEVER STOP** (until human interrupts) | Agent generates blocks continuously overnight |
| Simplicity criterion | Simplicity criterion | Fewer fields, cleaner template = better, all else equal |

#### The Loop

```
SETUP:
1. Human selects category + starting block (e.g. "icon heroes", start with IconHeroScatter)
2. Agent reads its block-program.md (category-specific instructions)
3. Agent reads reference blocks in docs/references/
4. git checkout -b block-rnd/icon-heroes/mar10
5. Initialize results.tsv with header row
6. Confirm setup, then GO

LOOP FOREVER:
1. Read results.tsv — what's been tried, what worked, what failed
2. Decide next experiment:
   - New block variant (IconHeroOrbit)
   - Iteration on current block (adjust animation, add handle, fix mobile)
   - Port a pattern from a successful block to a new one
3. Write/edit BlockName.html + BlockName.json
4. git commit -m "experiment: [description]"
5. Sync + deploy + screenshot:
   npm run sync -- --theme=block-ingress --apply --only=BlockName
   npx tsx scripts/block-screenshot.ts --theme=block-ingress --block=BlockName
6. Self-evaluate the screenshot:
   - Does it render without errors?
   - Is the headline readable over the effect?
   - Do theme colors come through?
   - Does it look like a custom build or a generic template?
   - Is the animation smooth (check for jank indicators)?
7. If self-evaluation passes → log to results.tsv as "pending-review"
   If self-evaluation fails → fix and retry (up to 3 attempts), then log as "discard"
8. Move to next experiment — do NOT wait for human feedback
9. NEVER STOP — keep generating blocks until interrupted

HUMAN REVIEW (async, whenever human checks in):
- Human reviews pending-review blocks: screenshot + preview URL
- Feedback recorded in results.tsv description column
- "keep" → block stays on the branch, agent can build on it
- "iterate" → agent incorporates feedback in next loop iteration
- "discard" → agent reverts and moves on
- "graduate" → block moves to seed library with aiDescription + tags + handles
```

#### block-program.md Structure

Each specialist agent gets a `block-program.md` (analogous to autoresearch's `program.md`). The human iterates on this file over time to steer agent behavior.

```markdown
# Block R&D: [Category Name]

## Focus
[What this agent builds — e.g. "Canvas-based generative art hero blocks"]

## Quality Criteria
- Headline must be readable (contrast ratio, no competing visual weight)
- Effect must use theme colors (read from CSS custom properties)
- Mobile must not break (graceful fallback, no jank)
- Animation must be smooth (requestAnimationFrame, no layout thrashing)
- Block must be self-contained (no external dependencies beyond CDN libs listed below)

## Allowed Dependencies
[e.g. "Canvas2D only, no external libraries" or "Three.js from CDN, OGL from CDN"]

## Reference Blocks
[Links to existing blocks that exemplify quality in this category]

## Handle Vocabulary
[Standard handles for this category with ranges and semantic meaning]

## Anti-Patterns
- Never hardcode colors — always use CSS custom properties or field values
- Never use setTimeout for animation — use requestAnimationFrame
- Never exceed 3 items fields per block — keep it simple
- Never skip mobile fallback

## Previous Feedback Patterns
[Accumulated from human reviews — agent learns what "good" means]
- "particles too uniform" → add size/speed variation
- "text fighting the effect" → increase overlay opacity or reduce effect near text
- "feels like a template" → add asymmetry, remove perfect centering
```

#### results.tsv Format

```
commit	block	val	status	description	feedback
a1b2c3d	IconHeroScatter	-	pending-review	baseline scatter with 20 icons, staggered fade-in
b2c3d4e	IconHeroScatter	-	iterate	add mouse proximity repel effect	"repel is good but too aggressive, tone down radius"
c3d4e5f	IconHeroScatter	-	keep	reduce repel radius to 100px, add spring easing	"nice, this is solid"
d4e5f6g	IconHeroOrbit	-	discard	orbiting icons, but animation janky on mobile
e5f6g7h	IconHeroOrbit	-	pending-review	orbit with reduced motion on mobile, CSS fallback
f6g7h8i	IconHeroGrid	-	crash	grid layout, but template compilation failed
```

The `val` column is reserved for if/when we get an automated visual quality metric (screenshot analysis, layout heuristics, etc.). For now it's blank — human judgment is the metric.

#### Key Insight from autoresearch: NEVER STOP

The most important pattern is **continuous autonomous operation**. The agent doesn't pause after each block to ask "should I keep going?" The human might be asleep. The agent generates 5-10 blocks overnight, the human reviews them in the morning over coffee, marks some as keep/iterate/discard/graduate, and the agent incorporates that feedback in the next session.

At ~2 minutes per sync+screenshot cycle, that's roughly **30 experiments per hour**, or **240 overnight**. Even with a high discard rate, that's potentially dozens of viable blocks per sleep cycle.

#### Key Insight from autoresearch: program.md Is the Product

Karpathy's key realization: "you're not touching any of the Python files like you normally would. Instead, you are programming the `program.md` Markdown files that provide context to the AI agents." The human's job shifts from writing code to **programming the agent's taste and judgment**.

For us: the `block-program.md` files are the product. As we review blocks and give feedback, we're not just fixing individual blocks — we're training the program. "Particles too uniform" becomes an anti-pattern in the program. "This aurora effect is gorgeous" becomes a reference example. Over time, the program accumulates taste, and the agent's output quality rises.

#### Differences from autoresearch We Should Respect

1. **No automated metric.** autoresearch has `val_bpb` — a single number that's unambiguously better or worse. We don't have that. Our "metric" is visual quality, which requires human eyes. This means the agent can't do keep/discard autonomously — it can only self-evaluate for obvious failures (crash, broken render, unreadable text) and flag everything else for human review.

2. **Multiple output files.** autoresearch modifies one file. We produce two files per block (template + fields) and potentially iterate on multiple blocks per session. The branch management needs to handle this cleanly.

3. **Artifacts persist.** In autoresearch, a discarded experiment is just a reverted commit. For us, a discarded block might still have a good animation pattern or handle design worth salvaging. The results.tsv descriptions become a knowledge base.

4. **Visual evaluation could partially automate.** Future opportunity: run the screenshot through vision AI to check basic quality (text readability, color contrast, layout balance, mobile rendering). Not a replacement for human taste, but could filter out obvious failures before human review. This would get us closer to autoresearch's automated loop.

### Scaling: The Agent Team

Start with one agent, one domain (generative art — lowest external dependencies). Once the loop is proven:

| Phase | Agents | Focus | Expected Output |
|-------|--------|-------|-----------------|
| 1 | 1 | Generative art heroes | 5-8 canvas-based blocks |
| 2 | 2 | + WebGL/glitch effects | 5-8 shader-based blocks |
| 3 | 3 | + Scroll/animation | 5-8 choreographed blocks |
| 4 | 4 | + Video/media | 5-8 media-treatment blocks |
| 5 | Expand to non-hero blocks | Features, CTAs, testimonials with effects | Whole-site wow factor |

Each phase builds on learnings from the previous one. The human feedback loop gets faster as the agent learns patterns ("readable over effects," "always needs a mobile fallback," "brand colors must be prominent").

### Why This Works

1. **Hard problems solved once.** Getting a WebGL particle system to look good, perform well, and fall back gracefully is hard. But once it's done, it's done. The site-building AI never has to solve it again.

2. **Human taste in the loop.** The agent iterates with a human until the block is genuinely good. No "hope it works" at site-creation time.

3. **Handles preserve creative range.** A block with 6 meaningful handles isn't a rigid template — it's a design space. Speed 0.2 and speed 2.5 are completely different experiences. The AI navigates that space per-brand.

4. **Compounds over time.** Every graduated block makes the site-building AI more capable. After 6 months of R&D loops, the block library has 30-40 effect blocks covering a huge range of brand vibes. No other website builder has this.

5. **Infrastructure already exists.** Block ingress site, screenshot pipeline, sync/deploy, `aiDescription` + `tags`, compose workflow with block selection + content population. The pieces are all here.

---

## Pre-Built Hero Block Catalog

These are blocks we should build ahead of time through the R&D pipeline. Each one is a self-contained block with content fields (headline, subheadline, buttons) plus behavioral handles. They ship ready to use — the site-building AI just selects one and fills in the content + handle values.

Every block in this catalog should include:
- **Entrance animation** — Elements animate in on load or scroll-into-view (Alpine.js `x-intersect`)
- **Content fields** — Headline, subheadline, buttons (items), optional eyebrow/badge
- **Behavioral handles** — Numbered/select fields the AI tunes per-brand
- **Mobile fallback** — Graceful degradation, never broken on phones
- **Theme integration** — Reads brand/accent colors from CSS custom properties or field values

---

### Category 1: Icon Composition Heroes

Phosphor icons are already integrated. These blocks arrange icons into visual compositions behind or alongside the headline. No images needed, instant loading, always on-brand.

| # | Block Name | Description | Key Handles | Animation |
|---|-----------|-------------|-------------|-----------|
| 1 | `IconHeroScatter` | 15-30 icons scattered across the background at various sizes and opacities. Feels like a branded texture. | Icon Count (10-40), Size Range (16-64), Opacity Range (0.05-0.3), Layout (random / grid-drift / radial) | Icons fade in with staggered delays, subtle continuous drift on hover |
| 2 | `IconHeroOrbit` | Icons orbit around the headline in concentric rings, like electrons around a nucleus. | Ring Count (1-3), Speed (slow orbit to fast), Icon Size, Direction (cw/ccw/mixed) | Rings rotate continuously at different speeds, pause on hover |
| 3 | `IconHeroGrid` | Clean grid of icons behind the text, some highlighted in brand color, others muted. Almost like a periodic table of capabilities. | Columns (4-8), Icon Size, Highlight Count (how many get brand color), Gap | Grid fades in row by row, highlighted icons pulse subtly |
| 4 | `IconHeroCluster` | Icons clustered in an organic cloud shape to one side, text on the other. Split layout. | Cluster Density, Cluster Position (left/right), Size Variation (uniform to wild), Color Mode (mono/brand/accent) | Icons pop in from center of cluster outward, magnetic repel on mouse proximity |
| 5 | `IconHeroRising` | Icons float upward continuously from the bottom, like bubbles or sparks. Creates a sense of energy and momentum. | Spawn Rate (icons/sec), Speed, Size Range, Fade Distance | Continuous upward drift, slight horizontal wobble, fade out near top |
| 6 | `IconHeroMosaic` | Icons tightly packed in a mosaic/collage filling one half of the hero, with subtle depth via size and opacity variation. | Density (tight to loose), Depth Layers (2-4), Color Layers (mono to full palette) | Tiles flip/rotate in on load with staggered timing, hover reveals icon names as tooltips |

**Shared handles for all icon heroes:**
- `Icons` (items field) — List of icon names. AI picks relevant ones (e.g., "cloud-arrow-up", "lock-simple", "database" for a SaaS).
- `Color Mode` (select) — `brand` (all brand color), `monochrome` (fg at various opacities), `accent-mix` (brand + accent1 + accent2), `muted` (fg-muted/fg-alt only)

---

### Category 2: Mesh & Gradient Heroes

CSS and SVG-based gradient effects. No canvas, no JS dependencies for the base effect. Pure CSS mesh gradients, animated gradient shifts, aurora effects. Lightweight and universally supported.

| # | Block Name | Description | Key Handles | Animation |
|---|-----------|-------------|-------------|-----------|
| 7 | `MeshHeroAurora` | Soft, flowing aurora borealis effect behind text. Multiple translucent gradient blobs that drift and morph. | Blob Count (3-6), Blur (40-120px), Speed (drift speed), Color Source (brand-only / palette / custom) | Blobs drift continuously with CSS keyframe animation, slow morphing of border-radius |
| 8 | `MeshHeroSpotlight` | Single large radial gradient that follows the mouse cursor, like a spotlight on a dark stage. Text illuminated where the light falls. | Spotlight Size (200-800px), Falloff (sharp to soft), Color, Background (dark/brand/base-alt) | Smooth mouse tracking with lerp, optional pulse on idle |
| 9 | `MeshHeroGrain` | Flat color or subtle gradient with an animated film grain overlay. Editorial, magazine-like. Sophisticated and understated. | Grain Intensity (0.02-0.15), Grain Speed (static/slow/fast), Base Style (solid/gradient/split), Color | Grain animates via CSS background-position shift on a noise SVG filter, headline fades up on load |
| 10 | `MeshHeroDuotone` | Background image processed through a CSS duotone filter using two brand colors. Striking, editorial. | Light Color (brand/accent1/base), Dark Color (base-alt/fg/brand), Contrast, Blend Mode | Image fades in with the duotone applied, optional ken burns (slow zoom) |
| 11 | `MeshHeroBlobs` | 2-3 large colored blobs with heavy blur, overlapping to create organic color mixing. Glassmorphism vibes. | Blob Colors (3 color fields), Blur Amount, Blob Size, Movement Speed | Blobs animate position on a slow loop, creating constantly shifting color combinations |
| 12 | `MeshHeroGradientText` | Headline itself has an animated gradient fill. Background is clean/minimal — the text IS the visual. | Gradient Colors (2-3 fields), Angle, Animation Speed, Background Style | Gradient shifts across the text continuously via `background-size: 200%` animation |

**Shared handles for all mesh heroes:**
- `Saturation` (number 0.5-1.5) — Dial back for muted/luxury, crank up for bold/playful
- `Overlay Opacity` (number 0-0.8) — Darkening overlay for text readability control

---

### Category 3: Geometric & Pattern Heroes

SVG and CSS patterns that create structured visual interest. Grids, lines, shapes, tessellations. Clean and modern — works for tech, architecture, finance, design studios.

| # | Block Name | Description | Key Handles | Animation |
|---|-----------|-------------|-------------|-----------|
| 13 | `GeoHeroDotGrid` | Regular dot grid covering the background. Dots near the mouse grow larger or change color, creating a proximity ripple. | Dot Size (2-6px), Spacing (20-60px), Proximity Radius (100-300px), Reactive Color | Dots scale up near cursor with spring easing, subtle entrance animation (dots fade in from center outward) |
| 14 | `GeoHeroLineGrid` | Fine grid lines across the background, with intersections highlighted. Clean, architectural, blueprint feel. | Line Weight (0.5-2px), Grid Size (40-100px), Line Color, Intersection Dots (on/off) | Lines draw in from edges on load, optional slow rotation (1-2 degrees) |
| 15 | `GeoHeroCircles` | Concentric circles radiating from a point (behind text or to one side). Radar/sonar/target aesthetic. | Ring Count (5-15), Ring Spacing, Line Style (solid/dashed/dotted), Origin Position (center/left/right) | Rings expand outward from origin on load, optional continuous pulse (outermost ring fades and resets) |
| 16 | `GeoHeroDiagonal` | Bold diagonal stripes or chevron pattern. High energy, sporty, dynamic. | Stripe Width (20-80px), Angle (30-60°), Contrast (subtle to bold), Pattern (stripes/chevron/zigzag) | Stripes slide in from the angle direction on load, optional slow continuous drift |
| 17 | `GeoHeroIsometric` | Isometric grid or cube pattern. 3D without any 3D libraries. Tech-forward, modern. | Cube Size, Depth Shading (flat to deep), Fill Mode (outline/filled/mixed), Highlighted Cubes (count) | Cubes build up on load like stacking blocks, highlighted cubes pulse with brand color |
| 18 | `GeoHeroTopography` | Topographic contour lines. Organic but structured — nature meets data visualization. | Line Density, Curve Complexity (smooth to jagged), Line Weight, Color Mode (mono/gradient) | Lines draw themselves on load (SVG `stroke-dashoffset` animation), mouse creates a "hill" distortion in nearby lines |

---

### Category 4: Text Effect Heroes

The headline IS the hero. No background effects needed — the typography itself creates the visual impact. These pair well with minimal/clean designs.

| # | Block Name | Description | Key Handles | Animation |
|---|-----------|-------------|-------------|-----------|
| 19 | `TextHeroTypewriter` | Headline types out character by character with a blinking cursor. Classic, engaging, draws the eye. | Speed (chars/sec), Cursor Style (block/line/underscore), Delete & Retype (toggle — types, deletes, types next line from items field) | Typing animation on load or scroll-into-view |
| 20 | `TextHeroStagger` | Each word (or letter) of the headline animates in separately — sliding up, fading in, or flipping. Cinematic. | Unit (word/letter), Direction (up/down/left/right), Stagger Delay (50-200ms), Easing (ease-out/spring/bounce) | Letters/words cascade in on load, optional exit animation on scroll-out |
| 21 | `TextHeroHighlight` | Headline with one or two key words highlighted — underline that draws itself, background color that wipes in, or a circle/scribble annotation. | Highlight Style (underline/background/circle/scribble), Highlight Color, Highlight Word (which word index), Animation Delay | Highlight animates in after headline appears, SVG scribble draws with `stroke-dashoffset` |
| 22 | `TextHeroRotate` | One word in the headline rotates through alternatives. "We build [websites / brands / futures]". Vertical slide or fade transition. | Rotation Speed (seconds per word), Transition (slide-up/fade/flip), Rotating Words (items field) | Words cycle continuously, optional pause-and-resume on hover |
| 23 | `TextHeroSplit` | Headline split into two sizes — first line massive (heading-xl or larger), second line smaller (heading-md). Creates visual hierarchy within the headline itself. | Size Ratio (how much bigger line 1 is), Line 1 Color, Line 2 Color, Alignment (left/center) | Line 1 slides in from left, line 2 from right (or stagger up together) |
| 24 | `TextHeroOutline` | Headline rendered as outline/stroke text (transparent fill, colored border). Bold, editorial, fashion-forward. | Stroke Width (1-4px), Stroke Color, Fill On Hover (toggle — fills with color on mouse enter), Stagger Fill (letters fill one by one) | Letters draw their outlines on load (`stroke-dashoffset`), optional hover fill transition |

---

### Category 5: Image Treatment Heroes

These take a standard hero image and apply CSS/SVG treatments that make it feel custom and art-directed. The image is user-supplied (or AI-sourced), but the treatment is the differentiator.

| # | Block Name | Description | Key Handles | Animation |
|---|-----------|-------------|-------------|-----------|
| 25 | `ImageHeroMask` | Hero image revealed through a shaped SVG mask — circle, diagonal cut, organic blob, or custom shape. | Mask Shape (circle/diagonal/blob/arch/diamond), Mask Position (center/left/right), Image Position (cover/contain) | Mask scales up on load, revealing the image. Optional slow ken burns on the image itself |
| 26 | `ImageHeroParallax` | Hero image moves at a different speed than the text on scroll. Simple but effective depth. | Parallax Intensity (0.1-0.5), Image Position, Overlay Color, Overlay Opacity | Image shifts on scroll via `transform: translateY`, text layer fixed or inverse parallax |
| 27 | `ImageHeroReveal` | Image starts fully covered by a solid brand-color block, which wipes away to reveal the photo. | Reveal Direction (left/right/up/down/center), Reveal Trigger (load/scroll), Reveal Speed (0.5-2s), Cover Color | Color block slides or scales away on trigger, image underneath with optional slight zoom |
| 28 | `ImageHeroSplit` | Image split into 2-4 panels with subtle gaps between them. Each panel can shift slightly on hover for a fragmented look. | Panel Count (2-4), Gap Width (2-8px), Split Direction (vertical/horizontal/grid), Hover Shift (px) | Panels slide into position from offset on load, hover shifts individual panels |
| 29 | `ImageHeroGlitch` | Static image with a CSS glitch effect — brief RGB-split flickers at random intervals. Edgy, techy. | Glitch Frequency (rare/occasional/frequent), Glitch Intensity (subtle/medium/heavy), Glitch Duration (50-200ms) | Random glitch bursts via CSS keyframes with random-feeling intervals (actually cyclic but long period) |
| 30 | `ImageHeroClip` | Text used as a clipping mask over the image — the image shows through the letterforms. Rest of the hero is solid background. | Text Size (massive — 15-30vw), Text Weight (bold/black), Fallback Background, Image Position | Text scales up from 0 on load, image Ken Burns behind the text mask |

---

### Category 6: Canvas Generative Heroes

Lightweight `<canvas>` effects — no WebGL, just Canvas2D. Fast, well-supported, and Claude can reliably write these algorithms. The sweet spot between "just CSS" and "full 3D."

| # | Block Name | Description | Key Handles | Animation |
|---|-----------|-------------|-------------|-----------|
| 31 | `CanvasHeroFlowField` | Perlin noise flow field with particles tracing the field lines. Brand-colored particles on dark background. | Particle Count (500-3000), Speed, Field Scale (zoom of noise), Color Mode, Particle Size, Trail Length (fade rate) | Continuous animation, field slowly evolves over time. Mouse creates a disturbance in the flow |
| 32 | `CanvasHeroConstellations` | Dots connected by lines when near each other, forming constellation-like networks. Classic but effective. | Node Count (50-200), Connection Distance (80-200px), Node Speed, Line Opacity, Node Color | Continuous drift, mouse attracts nearby nodes (gravity well) |
| 33 | `CanvasHeroWaves` | Layered sine waves across the bottom or full background. Organic, flowing, calming. | Wave Count (2-5), Amplitude (height), Frequency (wave density), Speed, Color Mode (gradient layers) | Continuous wave motion, layers at different speeds create depth |
| 34 | `CanvasHeroNoise` | Full-screen animated Perlin noise texture. Lava lamp, smoke, or cloud-like. Hypnotic. | Scale (zoom level), Speed, Octaves (detail level), Color Map (mono/brand/heat), Contrast | Continuous slow evolution, mouse distorts nearby noise values |
| 35 | `CanvasHeroMatrix` | Falling characters/symbols in columns, Matrix-style. Can use brand-relevant characters (numbers for finance, code for dev tools, kanji for style). | Fall Speed, Character Set (alpha/numeric/code/symbols/custom), Density, Color, Fade Length | Continuous rain, columns at independent speeds, mouse creates a void/ripple |
| 36 | `CanvasHeroFireflies` | Small glowing particles that drift, pulse, and wander organically. Warm, magical, nighttime feel. | Firefly Count (20-100), Glow Size (5-30px), Pulse Speed, Drift Speed, Color (warm yellow / brand / cool blue) | Fireflies wander with Brownian motion, glow pulses independently, mouse gently attracts nearby fireflies |

---

### Category 7: Kinetic Layout Heroes

These aren't about background effects — they're about the layout itself being dynamic. Elements move, shift, and rearrange in response to scroll or interaction.

| # | Block Name | Description | Key Handles | Animation |
|---|-----------|-------------|-------------|-----------|
| 37 | `KineticHeroExpand` | Hero starts compressed (headline + subheadline tight together), then expands to full height as user scrolls, with elements spreading out and image/background revealing. | Compressed Height (40-60vh), Expanded Height (80-100vh), Expansion Trigger (scroll/auto) | Elements spring apart as hero expands, satisfying decompression feeling |
| 38 | `KineticHeroCards` | Hero content presented on overlapping cards that fan out on load, like a hand of playing cards. Each card holds different content (headline on one, stats on another, image on another). | Card Count (3-5), Fan Angle (10-30°), Fan Direction, Card Style (shadow/border/glass) | Cards fan out from stacked on load, hover lifts individual cards, click could flip |
| 39 | `KineticHeroMarquee` | Secondary content (client logos, key stats, or tagline) scrolls horizontally in a continuous marquee below the headline. | Marquee Speed, Marquee Content (items), Marquee Direction (left/right), Pause On Hover (toggle) | Continuous CSS marquee animation, headline animates in normally above |
| 40 | `KineticHeroCounter` | Hero with animated number counters — "10,000+ customers", "99.9% uptime". Numbers count up from 0 when the hero enters viewport. | Counter Items (items field with value + label), Count Duration (1-3s), Easing (linear/ease-out/spring), Format (commas/abbreviated) | Numbers count up with easing on scroll-into-view, optional suffix animation (+, %, etc.) |

---

### Summary: 40 Pre-Built Hero Blocks

| Category | Count | Dependencies | Difficulty |
|----------|-------|-------------|------------|
| Icon Compositions | 6 | Phosphor icons (already integrated) | Easy |
| Mesh & Gradient | 6 | CSS only (+ optional SVG filter) | Easy |
| Geometric Patterns | 6 | CSS + SVG + light JS for mouse tracking | Easy-Medium |
| Text Effects | 6 | CSS + Alpine.js | Easy-Medium |
| Image Treatments | 6 | CSS + SVG masks + light JS | Medium |
| Canvas Generative | 6 | Canvas2D + vanilla JS | Medium |
| Kinetic Layout | 4 | CSS + Alpine.js + scroll observers | Medium |
| **Total** | **40** | | |

### Build Priority

Recommended order based on effort-to-impact ratio:

1. **Text Effects** (#19-24) — Pure CSS/Alpine, highest differentiation per line of code, every site needs a headline
2. **Mesh & Gradient** (#7-12) — CSS-only, zero dependencies, instant visual upgrade
3. **Icon Compositions** (#1-6) — Phosphor already works, icons are free, loads fast
4. **Geometric Patterns** (#13-18) — SVG + light JS, clean and modern, broad appeal
5. **Image Treatments** (#25-30) — Makes stock photos feel custom, huge value for compose workflow
6. **Canvas Generative** (#31-36) — The wow-factor tier, more complex but proven algorithms
7. **Kinetic Layout** (#37-40) — Most complex, but unique — nobody else has these in a block library

---

## Quick Wins to Pursue

Based on the ranking above, the highest-impact, lowest-effort improvements are:

1. **Video backgrounds (#3)** — One new block template + Pexels video API integration. Massive visual impact for minimal work.
2. **Bold typography choices (#1)** — No new blocks needed, just better theme generation with more adventurous color/type combinations.
3. **Geometric backgrounds (#4)** — CSS-only, no external dependencies. A few template variants cover many use cases.
4. **AI-generated images (#7)** — Infrastructure exists. Needs better prompt engineering for hero-specific images (wide aspect ratio, text-safe areas).
5. **Block R&D pipeline (Phase 1)** — Start one generative art agent loop. Prove the loop, graduate 5 blocks, validate handle-based composition.

## Human Taste Loop

### The Problem

The R&D agents can generate blocks all night, but the bottleneck is human review. If reviewing requires opening a preview, inspecting on mobile, toggling handles, writing detailed feedback — the human becomes the slowest part of the system. The feedback loop collapses.

What we need: a review experience so fast and frictionless that you can blow through 50 blocks in 10 minutes. Tinder for blocks.

### Design Principles

1. **Binary + note.** The core gesture is thumbs up / thumbs down + optional short note. That's it. No forms, no checkboxes, no rating scales.
2. **Visual-first.** You're looking at screenshots, not reading code. The block is either good or it's not. Your eye knows in 2 seconds.
3. **Notes are for training.** When you say "the particles are too uniform" — that's not a bug report, it's a taste signal. The system captures it and feeds it back into the agent's `block-program.md`. Over time, the notes become the agent's design education.
4. **Async by default.** You review when you want. The agents don't wait for you. You could review once a day or ten times a day.
5. **Batch-oriented.** Don't show one block at a time and ask after each one. Show me 20 and let me fly through them.

### The Review Interface

#### Option 1: CLI Swipe (simplest, build first)

A terminal-based review tool. Agent queues blocks as `pending-review` in results.tsv. Human runs a command, sees blocks one at a time, reacts fast.

```bash
npx tsx scripts/review.ts --run=block-rnd/icon-heroes/mar10
```

The flow:
```
┌─────────────────────────────────────────────┐
│                                             │
│  [screenshot displayed in terminal/iTerm2]  │
│                                             │
│  IconHeroScatter v3                         │
│  "20 icons, staggered fade, mouse repel"    │
│                                             │
│  Preview: https://preview.makestudio.cc/... │
│                                             │
│  [y] keep  [n] discard  [i] iterate  [g] graduate │
│  [o] open preview  [space] skip for now     │
│                                             │
│  Note (optional, press enter to skip):      │
│  > particles too uniform, needs size variance│
│                                             │
└─────────────────────────────────────────────┘
```

Keypresses: `y`, `n`, `i`, `g`, `o`, `space`. One keystroke per block (plus optional note). You could review 50 blocks in 5-10 minutes.

The screenshot displays inline in iTerm2/Kitty (both support inline images via escape sequences). For terminals that don't support it, fall back to opening the image in Preview.app.

#### Option 2: Web Gallery (richer, build second)

A local web page served by a dev server. Shows all pending blocks as a grid of screenshots. Click to expand, keyboard shortcuts to rate.

```bash
npx tsx scripts/review-server.ts --run=block-rnd/icon-heroes/mar10
# Opens http://localhost:3456
```

```
┌──────────────────────────────────────────────────────────┐
│  Block R&D Review — icon-heroes/mar10                    │
│  12 pending · 8 kept · 3 discarded · 2 graduated        │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │          │  │          │  │          │  │         │ │
│  │ [screen] │  │ [screen] │  │ [screen] │  │ [screen]│ │
│  │          │  │          │  │          │  │         │ │
│  │ Scatter  │  │  Orbit   │  │  Grid    │  │ Cluster │ │
│  │   v3     │  │   v1     │  │   v2     │  │   v1    │ │
│  │          │  │          │  │          │  │         │ │
│  │ [👍][👎] │  │ [👍][👎] │  │ [👍][👎] │  │ [👍][👎]│ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                          │
│  Expanded: IconHeroScatter v3                            │
│  ┌────────────────────────────────────────┐              │
│  │                                        │              │
│  │        [large screenshot]              │              │
│  │                                        │              │
│  │  [iframe: live preview]                │              │
│  │                                        │              │
│  └────────────────────────────────────────┘              │
│                                                          │
│  [y] keep  [n] discard  [i] iterate  [g] graduate       │
│  Note: [__________________________________]  [→ next]    │
│                                                          │
│  History:                                                │
│  v1: "baseline" → discard ("too boring")                 │
│  v2: "added mouse repel" → iterate ("repel too strong")  │
│  v3: "toned down repel, spring easing" → pending         │
└──────────────────────────────────────────────────────────┘
```

Features beyond CLI:
- Grid overview — see all pending blocks at a glance, spot patterns
- Live preview iframe — see the animation, not just a screenshot
- Version history — see how the block evolved, what feedback was given
- Side-by-side — compare two blocks (A/B test between variants)
- Filter by category, status, date

#### Option 3: Mobile Review (stretch goal)

Push notifications to your phone. Review blocks while walking the dog. Swipe right to keep, swipe left to discard, tap to add a note. The ultimate low-friction review.

This could be as simple as a PWA version of the web gallery optimized for touch.

### How Feedback Flows Back

The real value isn't the keep/discard decision — it's the **notes**. Here's how they flow back into the system:

```
Human reviews block:
  "n" (discard) + "particles too uniform, needs size and speed variance"
       │
       ▼
results.tsv updated:
  commit  block           status   feedback
  c3d4e5f IconHeroScatter discard  "particles too uniform, needs size and speed variance"
       │
       ▼
Agent reads results.tsv on next loop iteration:
  - Sees feedback on previous attempt
  - Applies fix: adds randomized size (0.5x-2x) and speed (0.7x-1.3x) per particle
  - Commits new experiment
       │
       ▼
After multiple feedback rounds, patterns emerge:
  - "too uniform" appeared 4 times across different blocks
  - "text readability" appeared 6 times
  - "love the spring easing" appeared 3 times
       │
       ▼
Periodic: promote recurring feedback into block-program.md:
  ## Accumulated Taste (from human review)
  - ALWAYS add size/speed variance to particle systems (never uniform)
  - ALWAYS ensure text contrast ratio > 4.5:1 over effects
  - Spring easing is strongly preferred over linear for mouse reactions
  - Organic movement > mechanical movement for most brands
  - Less is more — 60% of "too much" is usually right
```

The last step is the key one: **feedback promotes into the program**. Individual notes fix individual blocks, but pattern recognition across notes trains the agent permanently. This is the compound loop — every review session makes every future block better.

### Taste Dimensions

Over time, we'll accumulate enough feedback to identify recurring dimensions of taste. These aren't handles on individual blocks — they're meta-preferences that inform how the AI configures ANY block:

| Dimension | Spectrum | Signal Phrases |
|-----------|----------|---------------|
| **Density** | sparse ↔ rich | "too busy", "needs more", "overwhelming", "too empty" |
| **Motion** | still ↔ kinetic | "too much movement", "feels static", "distracting", "dead" |
| **Contrast** | subtle ↔ dramatic | "too loud", "too quiet", "needs punch", "calm it down" |
| **Geometry** | organic ↔ structured | "too rigid", "too chaotic", "needs order", "too grid-like" |
| **Temperature** | cool ↔ warm | "feels cold", "too clinical", "cozy", "sterile" |
| **Confidence** | understated ↔ bold | "too shy", "too aggressive", "needs presence", "dial it back" |

These dimensions emerge from the notes. We don't define them upfront — we discover them. Once identified, they become part of how the site-building AI thinks about matching blocks to brands:

*"This is a luxury spa brand → cool temperature, understated confidence, sparse density, organic geometry, still-to-subtle motion."*

### The Feedback Flywheel

```
Agents generate blocks
       │
       ▼
Human reviews (fast: y/n + note)
       │
       ▼
Notes accumulate in results.tsv
       │
       ▼
Patterns promote into block-program.md
       │
       ▼
Agents generate better blocks
       │
       ▼
Human reviews faster (fewer rejects)
       │
       ▼
Notes get more nuanced (not "this is bad" but "the timing is 200ms too slow")
       │
       ▼
Program gets more refined
       │
       ▼
Blocks approach human taste asymptotically
```

The flywheel accelerates: early sessions are mostly "no, no, no, yes, no." Later sessions are mostly "yes, yes, tweak this, yes, graduate this." The agent's hit rate climbs because the program accumulates your taste.

### What About Multiple Reviewers?

For now, it's just you. But the system is designed so that multiple humans could review, and their taste signals could be tagged:

```
commit  block           status   reviewer  feedback
c3d4e5f IconHeroScatter keep     tom       "love the spring easing"
c3d4e5f IconHeroScatter discard  sarah     "too playful for enterprise clients"
```

Different reviewers might have different taste profiles. That's fine — it means the block library can serve different market segments. Tom's "keep" becomes a tag: `vibe: playful`. Sarah's "discard with reason" becomes: `not-for: enterprise`. The site-building AI uses these signals when matching blocks to client briefs.

But that's future. For now: one human, fast feedback, compound learning.

### Implementation Priority

1. **CLI review tool** — `scripts/review.ts`. Inline images in iTerm2, keystroke-based. Ship this first, use it immediately with the first R&D agent run.
2. **Feedback-to-program promotion** — Script or agent task that reads results.tsv, identifies recurring patterns (3+ similar notes), and proposes additions to `block-program.md` for human approval.
3. **Web gallery** — Build when the CLI feels too limiting (probably once we have 50+ blocks to review at once).
4. **Mobile PWA** — Build if/when the review queue grows large enough that you want to review on the go.

---

## Open Questions

- **Handle granularity:** How many handles is too many? If a block has 12 number fields, the site-building AI needs strong guidance on what combinations work. Should we constrain to presets ("calm", "energetic", "aggressive") that map to handle bundles?
- **Performance budgets:** Should blocks declare a performance tier (lightweight / medium / heavy) so the site-building AI can factor in target audience devices?
- **Theme color extraction:** WebGL/canvas blocks need to read CSS custom properties at runtime. Is `getComputedStyle()` reliable in the Make Studio rendering context, or do we need to pass colors as field values?
- **Library site vs. seed site:** Should graduated blocks live on a dedicated "effects library" site separate from the existing seed site (which has simpler blocks)?
- **Non-hero expansion:** When do we start applying this to other block types? A Features section with generative backgrounds, a CTA with glitch text, a testimonial carousel with particle transitions?
- **Taste convergence:** How many review sessions until the agent's hit rate is high enough that review feels like curation rather than quality control? 10 sessions? 50?
- **Negative examples:** Should the program store "bad" examples too? "Here's what a 'too uniform' particle field looks like" with a screenshot. Visual anti-patterns alongside visual references.

## Discussion Log

- **2026-03-10**: Initial research complete. Identified 3 architecture options for direct generation. Catalogued 10 hero approaches ranked by AI difficulty. Added 5 moonshot hero ideas (#11-15). Added WebGL 3D environments (#16) and glitch/distortion typography (#17). Designed Block R&D Pipeline with specialist agent loops, handle system, and graduation workflow. Added Pre-Built Hero Block Catalog: 40 blocks across 7 categories (icons, mesh, geometric, text, image treatments, canvas generative, kinetic layout). Studied Karpathy's autoresearch pattern — adapted loop structure, results.tsv ledger, block-program.md per specialist, NEVER STOP philosophy, and keep/discard branching model. Designed Human Taste Loop: CLI swipe review tool, feedback-to-program promotion pipeline, taste dimensions that emerge from notes, and the compound flywheel where review sessions permanently improve agent output.
