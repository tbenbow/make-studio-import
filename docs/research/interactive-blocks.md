# Interactive Block Library Research

The blocks nobody else has. These aren't just "sections with text" — they're functional, interactive experiences that happen to live inside a CMS. The user edits fields, the block does something remarkable.

The thesis: website builders give you static layouts. We give you **interactive primitives** with CMS handles. A map block isn't a screenshot of a map — it's a real map where you edit the pins in the CMS. A carousel isn't a CSS hack — it's a buttery-smooth, swipeable, configurable component. A portfolio isn't a grid of images — it's a filterable, animated showcase.

Every block in this document follows the same principle: **the hard engineering is done once, the AI configures it per-site via handles and content fields.**

---

## Category 1: Maps

Maps are one of the highest-value interactive blocks because they're genuinely hard to build, every local business needs one, and no website builder does them well. Squarespace gives you a basic Google Maps embed. We can do dramatically better.

### The Baseline: What Everyone Else Has

- Google Maps embed iframe (ugly, branded, no customization)
- Static screenshot of a map (not interactive)
- Mapbox with default styling (better, but still generic)

### What We Should Build

#### MapHeroFullbleed
Full-viewport map as the hero section. Text overlaid on one side, map fills the rest. The map IS the hero — no stock photo needed. Perfect for restaurants, real estate, travel, event venues.

**Fields:**
- `Headline` (text) — overlaid on the map
- `Subheadline` (textarea)
- `Buttons` (items) — CTA overlay
- `Center Latitude` (number) — map center
- `Center Longitude` (number)
- `Zoom` (number, 1-20) — AI sets based on context (neighborhood = 15, city = 12, region = 8)
- `Pins` (items) — `{ latitude, longitude, label, description, icon }`
- `Map Style` (select) — `minimal-light`, `minimal-dark`, `satellite`, `terrain`, `brand-tinted`
- `Overlay Position` (select) — `left`, `right`, `bottom`
- `Overlay Width` (select) — `narrow`, `medium`, `wide`

**What makes it special:**
- Map style tinted to match brand colors (Mapbox GL style spec lets you recolor everything)
- Pins use Phosphor icons or custom SVG markers
- Smooth fly-to animation on load
- Text overlay has glassmorphism or solid panel, configurable
- Mobile: map becomes background with full-width text overlay

**AI configuration example:**
```json
{
  "MapHeroFullbleed": {
    "Headline": "Find Us in the Heart of Portland",
    "Center Latitude": 45.5231,
    "Center Longitude": -122.6765,
    "Zoom": 15,
    "Map Style": "minimal-dark",
    "Overlay Position": "left",
    "Pins": [
      { "latitude": 45.5231, "longitude": -122.6765, "label": "Our Studio", "icon": "map-pin" }
    ]
  }
}
```

**Library:** Mapbox GL JS (~200KB) or MapLibre GL JS (open-source fork, no API key needed with free tile servers).

---

#### MapLocations
Multi-location map with a sidebar list. Click a location in the list, map flies to it. Click a pin, sidebar highlights the location. The classic store locator pattern, but beautiful.

**Fields:**
- `Headline` (text)
- `Locations` (items) — `{ name, address, latitude, longitude, phone, hours, image, description }`
- `Map Style` (select)
- `Default Zoom` (number)
- `Cluster Pins` (toggle) — group nearby pins at low zoom
- `Layout` (select) — `sidebar-left`, `sidebar-right`, `list-below`

**What makes it special:**
- Locations are CMS-editable — add a new office, it appears on the map
- Fly-to animation with easing when selecting a location
- Pin clusters that expand on click
- Each location card can show image, hours, phone — real business info
- AI can geocode addresses (we'd need a geocoding step, or the user provides lat/lng)

---

#### MapRoute
An animated route on the map — a line draws itself along a path. Perfect for travel blogs, delivery services, race/marathon sites, road trip stories.

**Fields:**
- `Headline` (text)
- `Waypoints` (items) — `{ latitude, longitude, label, description, image }`
- `Route Style` (select) — `solid`, `dashed`, `dotted`, `animated-dash`
- `Route Color` (text) — defaults to brand
- `Animation Speed` (number) — how fast the line draws
- `Auto Play` (toggle) — animate on scroll-into-view vs. manual
- `Show Elevation` (toggle) — elevation profile below the map

**What makes it special:**
- The route animates like it's being drawn in real-time
- Waypoints pop up sequentially as the route reaches them
- Scroll-driven: scroll controls the route progress (the map becomes a scroll-driven story)
- Could integrate with a timeline/story below the map

---

#### MapComparison
Two maps side by side (or overlaid with a slider) showing before/after, two time periods, or two locations. Drag a slider to reveal one vs. the other.

**Fields:**
- `Headline` (text)
- `Left Map` (group) — `{ label, style, center-lat, center-lng, zoom, overlay-image }`
- `Right Map` (group) — same
- `Comparison Mode` (select) — `side-by-side`, `slider-overlay`, `toggle`

**What makes it special:**
- Satellite before/after for construction, development, environmental change
- Historical vs. current map styling
- The slider interaction is inherently engaging — people always drag it

---

#### MapHeat
Heatmap or data visualization on a map. Show density, coverage areas, influence zones. Great for analytics dashboards, market coverage, event attendance.

**Fields:**
- `Headline` (text)
- `Data Points` (items) — `{ latitude, longitude, value, label }`
- `Visualization` (select) — `heatmap`, `circles`, `choropleth`, `hexbin`
- `Color Ramp` (select) — `brand-gradient`, `heat`, `cool`, `monochrome`
- `Radius` (number) — influence radius per point
- `Opacity` (number)

**What makes it special:**
- Turn boring data into a visual story
- AI can generate sample data points that tell a compelling narrative
- Hover reveals values, click shows detail cards

---

### Map Block Shared Infrastructure

All map blocks share:
- **Mapbox GL JS / MapLibre GL JS** loaded from CDN
- **Brand-tinted map styles** — a style generator that takes theme colors and produces a Mapbox style JSON (muted roads in `fg-muted`, water in `brand/20`, buildings in `panel`, labels in `fg-alt`)
- **Responsive behavior** — maps resize cleanly, controls scale for touch
- **Lazy loading** — map initializes only when scrolled into view (heavy library)
- **No-JS fallback** — static image from Mapbox Static Images API (or just a styled `<div>` with the address as text)

### What the AI Needs to Know

The site-building AI needs guidance in `aiDescription`:
- "Use MapHeroFullbleed when the business has a physical location that matters to the brand story (restaurants, studios, venues). Not for pure online businesses."
- "Use MapLocations when the business has 2+ locations. For single location, use MapHeroFullbleed instead."
- "Use MapRoute for businesses with a journey narrative (travel, logistics, races). The waypoints tell a story."
- "Set zoom level based on context: single building = 17, neighborhood = 15, city = 12, state/region = 8, country = 5."

---

## Category 2: Carousels & Sliders

Carousels are the most requested and most butchered component on the web. Everyone has them, almost nobody does them well. The difference between a bad carousel and a great one is entirely in the interaction feel — momentum, snap points, gesture handling, easing curves.

### The Baseline: What Everyone Else Has

- CSS `overflow-x: scroll` with no snap (slides freely, feels cheap)
- jQuery plugin from 2014 (bloated, janky, not touch-optimized)
- Basic CSS `scroll-snap` (better, but no pagination, no autoplay, no API)

### What We Should Build

**Library choice:** This is critical. Options:
- **Embla Carousel** (~3KB gzipped) — lightweight, headless, composable, excellent touch physics. The clear winner.
- **Swiper** (~40KB) — feature-rich but heavy. Overkill for most cases.
- **CSS-only with `scroll-snap`** — zero JS, but limited interactivity (no autoplay, no API, no custom pagination).

Recommendation: **Embla Carousel** as the engine for all carousel blocks. One library, learned once, handles everything. CSS `scroll-snap` as the no-JS fallback.

---

#### CarouselTestimonials
The classic: customer quotes rotating through. But done beautifully — with transitions, avatars, ratings, and a sense of social proof.

**Fields:**
- `Headline` (text) — section headline above
- `Testimonials` (items) — `{ quote, author, role, company, avatar, rating }`
- `Auto Rotate` (toggle)
- `Rotate Speed` (number, seconds)
- `Transition` (select) — `slide`, `fade`, `scale`, `flip`
- `Show Rating` (toggle) — star display
- `Cards Per View` (select) — `1`, `2`, `3` (responsive: always 1 on mobile)
- `Style` (select) — `card`, `minimal`, `quote-mark`, `full-bleed`

**What makes it special:**
- Buttery touch swiping with momentum and snap
- Quote mark decoration that animates between slides
- Avatar crossfade during transitions
- Star rating with half-star support, animated fill
- The `full-bleed` style: each testimonial gets a background color/image, the whole section transforms

---

#### CarouselPortfolio
Full-width or contained image carousel for showcasing work. Each slide is a project with image, title, description, and link.

**Fields:**
- `Projects` (items) — `{ image, title, category, description, link }`
- `Layout` (select) — `full-bleed`, `contained`, `peek` (shows edges of adjacent slides)
- `Aspect Ratio` (select) — `16:9`, `4:3`, `1:1`, `auto`
- `Show Info` (select) — `overlay`, `below`, `on-hover`, `hidden`
- `Navigation` (select) — `arrows`, `dots`, `thumbnails`, `progress-bar`, `fraction`
- `Auto Play` (toggle)
- `Loop` (toggle)
- `Drag Free` (toggle) — freeform momentum scrolling vs. snap-to-slide

**What makes it special:**
- `peek` layout shows ~10% of adjacent slides — signals "there's more" without explicit navigation
- `thumbnails` navigation: filmstrip below the main carousel
- `progress-bar`: thin line that shows position within the set
- `on-hover` info: slide dims and text appears on mouse over
- Ken Burns effect on each slide (slow zoom while visible)
- Keyboard navigation (arrow keys)

---

#### CarouselBeforeAfter
Image comparison slider — drag to reveal before vs. after. Not technically a carousel but uses the same interaction pattern. Incredibly engaging.

**Fields:**
- `Slides` (items) — `{ before-image, after-image, before-label, after-label, caption }`
- `Orientation` (select) — `horizontal`, `vertical`
- `Start Position` (number, 0-100) — where the divider starts (default 50)
- `Handle Style` (select) — `line`, `circle`, `arrows`
- `Auto Animate` (toggle) — slowly sweeps back and forth to hint at interaction

**What makes it special:**
- The most engaging interaction on any website — people ALWAYS drag the slider
- Perfect for: renovations, design work, photo editing, fitness, dental, before/after anything
- Multiple slides: swipe between different comparison pairs
- The auto-animate hint teaches the interaction without instructions

---

#### CarouselLogos
Logo cloud as a smooth infinite scrolling marquee. Subtle but important for social proof. Every SaaS landing page needs one.

**Fields:**
- `Logos` (items) — `{ image, name, link }`
- `Speed` (number) — scroll speed
- `Direction` (select) — `left`, `right`
- `Pause On Hover` (toggle)
- `Grayscale` (toggle) — logos in grayscale, color on hover
- `Rows` (select) — `1`, `2` (two rows scrolling opposite directions)
- `Size` (select) — `sm`, `md`, `lg`

**What makes it special:**
- Infinite loop with no visible seam (duplicate elements for seamless wrap)
- Grayscale → color on hover is a subtle "we work with the best" signal
- Two rows going opposite directions: more visual energy, fills space
- Pure CSS animation (no JS needed), but Embla for touch swiping if user wants manual control

---

#### CarouselFeatures
Feature showcase where each slide is a feature with image/illustration, headline, and description. Like a product tour.

**Fields:**
- `Features` (items) — `{ image, headline, description, icon }`
- `Layout` (select) — `image-left`, `image-right`, `image-top`, `alternating`
- `Navigation` (select) — `tabs`, `dots`, `arrows`, `thumbnails`
- `Progress` (toggle) — auto-advance with progress bar per tab
- `Transition` (select) — `slide`, `fade`, `morph`

**What makes it special:**
- `tabs` navigation: horizontal tab bar where each tab is a feature name — click jumps to that slide
- `progress`: each tab shows a filling progress bar (like YouTube's video progress), auto-advances when full
- `morph` transition: elements that exist in both slides (like a phone mockup frame) stay in place while content morphs. Shared-element transitions.
- This IS Apple's product page feature section, as a reusable block

---

#### CarouselTimeline
Horizontal timeline that scrolls through events. Each event is a card with date, title, description, and optional image. Perfect for company history, project milestones, personal biography.

**Fields:**
- `Events` (items) — `{ date, title, description, image, icon }`
- `Style` (select) — `cards`, `minimal`, `alternating` (cards alternate above/below line)
- `Line Style` (select) — `solid`, `dashed`, `gradient`
- `Date Format` (select) — `year`, `month-year`, `full-date`
- `Scroll Behavior` (select) — `snap`, `free`, `auto-play`

**What makes it special:**
- The horizontal timeline metaphor is universally understood but rarely done well
- `alternating`: events alternate above and below the timeline line, zigzag pattern
- Active event highlighted with brand color, others muted
- Scroll-driven: the timeline dot slides along the line as you scroll/swipe
- Great for about pages, company history, product roadmaps

---

#### CarouselCards
Generic card carousel — the Swiss army knife. Configurable enough to handle team members, blog posts, products, services, anything with an image + text pattern.

**Fields:**
- `Cards` (items) — `{ image, headline, description, tag, link, link-label }`
- `Cards Per View` (select) — `1`, `2`, `3`, `4`
- `Card Style` (select) — `elevated`, `flat`, `bordered`, `glass`
- `Image Aspect` (select) — `square`, `landscape`, `portrait`, `none`
- `Show Tags` (toggle)
- `Navigation` (select) — `arrows`, `dots`, `arrows-and-dots`, `none` (scroll only)
- `Gap` (select) — `sm`, `md`, `lg`
- `Loop` (toggle)

**What makes it special:**
- The most versatile carousel — works for 10+ use cases depending on content
- AI uses this when no specialized carousel fits
- Responsive: 4 cards on desktop → 2 on tablet → 1 on mobile (automatic)
- Card hover: subtle lift + shadow increase

---

### Carousel Shared Infrastructure

All carousel blocks share:
- **Embla Carousel** loaded from CDN, initialized via Alpine.js `x-data`
- **Touch physics** — momentum, velocity-based settling, rubber-band at edges
- **Keyboard navigation** — arrow keys, tab through slides
- **Accessibility** — `role="region"`, `aria-roledescription="carousel"`, `aria-label`, live region for screen readers
- **CSS scroll-snap fallback** — works without JS, just less polished
- **Responsive slide counts** — always fewer slides visible on smaller screens
- **Lazy loading images** — only load visible + adjacent slides

---

## Category 3: Portfolios & Galleries

This is where we can truly differentiate. Portfolio presentation is the #1 reason creative professionals build websites, and every builder does it badly — generic grids with lightboxes from 2015. Great portfolio presentation requires: thoughtful layout, smooth transitions, filtering, and a sense of curation.

### The Baseline: What Everyone Else Has

- Grid of equal-size thumbnails with a basic lightbox
- Masonry layout (Pinterest-style) with a basic lightbox
- Single-column blog-style list

### What We Should Build

#### PortfolioMasonry
The gold standard masonry grid. Images at their natural aspect ratios, packed tightly, with filtering and a beautiful detail view.

**Fields:**
- `Projects` (items) — `{ image, title, category, description, link, tags }`
- `Columns` (select) — `2`, `3`, `4`, `auto` (auto-fits based on container width)
- `Gap` (number, 4-24px)
- `Filter By` (select) — `none`, `category`, `tags`
- `Click Behavior` (select) — `lightbox`, `expand-in-place`, `navigate`
- `Hover Effect` (select) — `dim-and-title`, `zoom`, `tilt`, `color-shift`, `none`
- `Load More` (toggle) — show N initially, "load more" button for the rest
- `Initial Count` (number) — how many to show before "load more"

**What makes it special:**
- True masonry layout — CSS `columns` or JS-based for equal distribution
- Animated filtering: click a category, items rearrange with smooth FLIP animations (First, Last, Invert, Play)
- `expand-in-place`: clicking a thumbnail expands it into a full-width detail card inline, pushing other items down — no modal, no page navigation
- `tilt` hover: CSS 3D tilt toward cursor position, subtle but premium
- Items animate in on scroll (staggered, from bottom)

---

#### PortfolioCaseStudy
Not a grid — a deep-dive showcase. Each project gets a full-width section with large image, detailed description, stats, and secondary images. Scroll through projects vertically, each one is a mini-story.

**Fields:**
- `Projects` (items) — `{ hero-image, title, client, year, category, description, stats, gallery, link }`
  - `stats` as sub-items: `{ label, value }` (e.g., "Revenue increase: 340%")
  - `gallery` as sub-items: `{ image, caption }`
- `Layout` (select) — `full-bleed`, `contained`, `alternating`
- `Project Spacing` (select) — `tight`, `spacious`, `section-break`
- `Show Stats` (toggle)
- `Show Gallery` (toggle)
- `Number Projects` (toggle) — "01 / 04" style numbering

**What makes it special:**
- Each project tells a story, not just shows an image
- Stats provide measurable impact (great for agencies, consultants)
- The gallery within each project can be a mini-carousel or a grid
- `alternating` layout: image left/right alternates per project
- Big, cinematic project numbering ("01") adds editorial quality
- Scroll-triggered animations per project section

---

#### PortfolioGrid
Clean, uniform grid for when masonry is too chaotic. Equal-size cells, strong visual rhythm. Works for photography, product design, architecture — anything where consistency matters.

**Fields:**
- `Projects` (items) — `{ image, title, category, overlay-color }`
- `Columns` (select) — `2`, `3`, `4`
- `Aspect Ratio` (select) — `1:1`, `4:3`, `16:9`, `3:4`
- `Gap` (select) — `none`, `sm`, `md`, `lg`
- `Hover Effect` (select) — `overlay-slide`, `zoom-and-dim`, `title-reveal`, `color-wash`
- `Click Behavior` (select) — `lightbox`, `link`, `expand`
- `Filter` (toggle)

**What makes it special:**
- `overlay-slide`: a colored overlay slides up from bottom on hover, revealing title + category
- `color-wash`: each project has a custom overlay color (from the `overlay-color` field), creating a rainbow effect on hover across the grid
- `gap: none`: edge-to-edge grid with no gaps — strong, magazine-like
- The grid itself is beautiful because of its uniformity — the constraint is the design

---

#### PortfolioShowcase
Hero-style portfolio: one project featured huge, with thumbnails or a carousel for navigation to other projects. The "selected work" pattern used by top design studios.

**Fields:**
- `Projects` (items) — `{ image, title, category, description, link }`
- `Layout` (select) — `split` (image left, info right), `stacked` (image full-width, info below), `overlay` (info over image)
- `Navigation` (select) — `thumbnails-below`, `arrows`, `project-list-sidebar`
- `Transition` (select) — `crossfade`, `slide`, `morph`, `zoom-through`
- `Auto Rotate` (toggle)
- `Show Project Count` (toggle) — "2 / 8"

**What makes it special:**
- The featured project is LARGE — this isn't a grid, it's a stage
- `zoom-through` transition: current image zooms in (like entering it) then the next project zooms out from black. Cinematic.
- `morph` transition: shared elements (like a project number or category label) morph position between slides
- `project-list-sidebar`: vertical list of project names on one side, hovering highlights and previews
- This is how Pentagram, Sagmeister, and top studios present work

---

#### PortfolioLightbox
The lightbox itself as a first-class experience. Most lightboxes are afterthoughts — ours should be as polished as the gallery.

**Fields:**
- `Images` (items) — `{ image, caption, category }`
- `Thumbnail Layout` (select) — `grid`, `masonry`, `horizontal-scroll`
- `Lightbox Style` (select) — `minimal` (image only), `cinematic` (dark bg, large), `editorial` (caption prominent)
- `Thumbnail Size` (select) — `sm`, `md`, `lg`
- `Transition` (select) — `zoom-from-thumbnail`, `crossfade`, `slide`
- `Show Counter` (toggle)
- `Show Captions` (toggle)
- `Keyboard Nav` (toggle, default true)

**What makes it special:**
- `zoom-from-thumbnail`: the image GROWS from its thumbnail position to fill the lightbox — smooth origin-aware animation. When you close, it shrinks back. This is the iOS Photos app interaction.
- Swipe between images in lightbox with Embla Carousel
- Pinch-to-zoom on mobile
- Background dims with a smooth blur transition
- Keyboard: arrow keys navigate, escape closes, F for fullscreen

---

#### PortfolioInteractive
The one nobody else has. A portfolio where projects are spatially arranged in a 2D canvas that you pan and zoom. Like a mood board or a design studio wall. Projects at various sizes, slightly rotated, overlapping. Drag to explore.

**Fields:**
- `Projects` (items) — `{ image, title, category, size, x-position, y-position, rotation }`
- `Canvas Size` (select) — `medium` (2x viewport), `large` (4x), `huge` (8x)
- `Arrangement` (select) — `scattered`, `clustered-by-category`, `spiral`, `random`
- `Interaction` (select) — `pan-and-zoom`, `scroll-driven`, `hover-to-reveal`
- `Connection Lines` (toggle) — draw lines between related projects
- `Background` (select) — `paper-texture`, `grid`, `clean`, `cork-board`

**What makes it special:**
- This is completely unlike anything any website builder offers
- It feels like exploring a physical space, not scrolling a page
- `scattered` arrangement: AI positions projects with slight rotations, overlaps, varied sizes — like photos on a desk
- `clustered-by-category`: projects cluster by category with space between clusters, like a mind map
- `spiral`: golden spiral layout, most important projects at center
- Pan with drag, zoom with scroll wheel / pinch. Minimap in corner.
- Click a project to zoom into it smoothly, click background to zoom back out
- Could use a lightweight pan/zoom library or pure CSS transforms + pointer events

---

## Category 4: Data & Content Interactives

Blocks that turn static information into interactive experiences. These are the ones that make visitors actually engage rather than skim.

#### PricingToggle
Pricing table with monthly/annual toggle, feature comparison, and highlighted "popular" plan. The most A/B-tested component on the internet.

**Fields:**
- `Plans` (items) — `{ name, monthly-price, annual-price, description, features, cta-label, cta-link, highlighted }`
  - `features` as sub-items: `{ text, included }`
- `Show Toggle` (toggle) — monthly/annual switch
- `Annual Discount Label` (text) — "Save 20%"
- `Currency` (text) — "$", "€", "£"
- `Layout` (select) — `cards-row`, `table`, `stacked`
- `Highlight Style` (select) — `border`, `scale`, `ribbon`, `glow`

**What makes it special:**
- Animated price transition: numbers count from monthly to annual (or vice versa) when toggling
- `table` layout: full feature comparison grid with checkmarks — the "enterprise" view
- `scale` highlight: popular plan is slightly larger, creating visual hierarchy
- `ribbon` highlight: diagonal "Most Popular" ribbon on the corner
- Feature tooltips: hover a feature for more detail

---

#### AccordionFAQ
Expandable FAQ section. Simple concept, but the animation quality is the differentiator.

**Fields:**
- `Headline` (text)
- `Questions` (items) — `{ question, answer }`
- `Style` (select) — `minimal`, `bordered`, `card`, `numbered`
- `Allow Multiple Open` (toggle)
- `Icon` (select) — `plus-minus`, `chevron`, `arrow`, `none`
- `Animation` (select) — `smooth-height`, `fade-in`, `slide-down`
- `Columns` (select) — `1`, `2` (two-column FAQ layout)

**What makes it special:**
- `smooth-height` animation: content height transitions with CSS `grid-template-rows: 0fr → 1fr` trick. No JS height calculation, no jank.
- Two-column layout for long FAQs — unusual, space-efficient
- `numbered` style: "01", "02" prefixes — editorial quality
- Schema.org FAQ markup automatically generated for SEO

---

#### TabsFeatures
Tabbed content — but with transitions that rival native apps. Each tab reveals different content with animated transitions.

**Fields:**
- `Tabs` (items) — `{ label, icon, headline, description, image }`
- `Tab Position` (select) — `top`, `left`, `bottom`
- `Tab Style` (select) — `underline`, `pill`, `boxed`, `minimal`
- `Transition` (select) — `slide`, `fade`, `morph`
- `Auto Rotate` (toggle)
- `Progress Bar` (toggle) — auto-advance progress indicator

**What makes it special:**
- `left` tabs with image: tab labels on the left, large image/content area on the right — the classic SaaS feature tour
- Sliding underline indicator that moves between tabs with spring physics
- `morph` transition: if two tabs share similar content structure, elements morph position rather than cutting
- Auto-rotate with progress bar: like a self-guided product tour

---

#### StatsCounter
Animated statistics. Numbers count up, charts draw in, progress bars fill. The "impressive numbers" section.

**Fields:**
- `Stats` (items) — `{ value, label, prefix, suffix, icon }`
- `Layout` (select) — `row`, `grid`, `cards`, `large-single`
- `Animation` (select) — `count-up`, `flip`, `slot-machine`
- `Trigger` (select) — `scroll-into-view`, `immediate`
- `Duration` (number, seconds)
- `Separator` (select) — `none`, `divider`, `icon`

**What makes it special:**
- `slot-machine` animation: digits roll like a slot machine to the final number. Delightful.
- `flip` animation: digits flip like an airport departure board
- Supports prefixes ("$", "#") and suffixes ("+", "%", "M") that animate in after the number lands
- `large-single`: one massive stat centered, with description below — the "10M+ users" impact statement

---

#### TimelineVertical
Vertical scrolling timeline. Events appear as you scroll down, alternating left and right.

**Fields:**
- `Events` (items) — `{ date, title, description, image, icon }`
- `Layout` (select) — `alternating`, `left-aligned`, `right-aligned`
- `Line Style` (select) — `solid`, `dashed`, `gradient`, `glow`
- `Node Style` (select) — `dot`, `icon`, `number`, `image-circle`
- `Animation` (select) — `fade-slide`, `draw-line`, `none`

**What makes it special:**
- `draw-line`: the timeline line literally draws itself as you scroll — SVG `stroke-dashoffset` driven by scroll position
- `alternating` with connecting lines: events zigzag, the eye follows the path
- Each event node can be an icon (Phosphor) that represents the event type
- Scroll-driven: events reveal precisely as the line reaches their position

---

#### FormMultiStep
Multi-step form with progress indicator, validation, and smooth transitions between steps. Contact forms, intake forms, surveys, onboarding.

**Fields:**
- `Steps` (items) — `{ title, description, fields }`
  - `fields` as sub-items: `{ label, type, placeholder, required, options }`
- `Progress Style` (select) — `bar`, `steps`, `fraction`, `dots`
- `Transition` (select) — `slide`, `fade`, `stack`
- `Submit Label` (text)
- `Submit Action` (select) — `email`, `webhook`, `custom`
- `Submit Endpoint` (text) — email address or webhook URL
- `Success Message` (text)

**What makes it special:**
- Step transitions slide horizontally like a wizard
- Progress bar fills smoothly between steps
- Field validation with inline error messages (not just "required", but format hints)
- `stack` transition: completed steps shrink and stack behind the current step, creating depth
- Confetti or checkmark animation on successful submit
- Could integrate with form backends (Formspree, Netlify Forms, custom webhooks)

**Note:** This is complex — forms require backend integration. But even as a frontend-only component that posts to a configurable endpoint, it's valuable. The AI sets up the steps and fields; the user configures where submissions go.

---

## Category 5: The "Nobody Else Has This" Tier

These are interactive blocks so unexpected that they redefine what a "website builder block" can be.

#### InteractiveProductViewer
360° product viewer. User drags to rotate the product. Built from a series of images (think: 36 photos around a product) or a 3D model.

**Fields:**
- `Images` (items) — series of images at different angles (minimum 12, ideal 36)
- `Auto Rotate` (toggle)
- `Rotation Speed` (number)
- `Zoom Enabled` (toggle)
- `Background` (select) — `transparent`, `gradient`, `studio-lighting`
- `Hotspots` (items) — `{ angle, x-position, y-position, label, description }` — clickable annotations

**What makes it special:**
- Drag interaction is immediately understood — everyone has used Google Street View
- Hotspots that appear at specific angles: "see the stitching detail" at 45°
- Works with any product: shoes, electronics, furniture, jewelry, vehicles
- The 36-image approach is way more accessible than 3D models (just photograph the product on a turntable)
- AI could potentially orchestrate the image generation for digital products

---

#### InteractiveCalculator
A configurable calculator/estimator. Mortgage calculator, ROI calculator, savings calculator, project cost estimator. Sliders and inputs that update results in real-time.

**Fields:**
- `Headline` (text)
- `Description` (textarea)
- `Inputs` (items) — `{ label, type, min, max, default, step, prefix, suffix, format }`
  - `type`: `slider`, `number`, `select`, `toggle`
- `Formula` (textarea) — JavaScript expression using input names
- `Results` (items) — `{ label, formula, prefix, suffix, format, highlight }`
- `Layout` (select) — `side-by-side`, `stacked`, `card`
- `CTA` (group) — `{ label, link, show-result-in-cta }`

**What makes it special:**
- Sliders with real-time result updates — incredibly engaging
- Results animate when inputs change (count-up transition)
- The `show-result-in-cta` option: "Get started — save $1,234/year" where the number is live
- Formula field means the AI can set up ANY calculation without custom code
- This single block serves: mortgage sites, SaaS ROI, fitness calculators, project estimators, savings tools

**AI configuration example:**
```json
{
  "InteractiveCalculator": {
    "Headline": "See Your Savings",
    "Inputs": [
      { "label": "Team Size", "type": "slider", "min": 1, "max": 100, "default": 10, "step": 1 },
      { "label": "Hours Saved Per Week", "type": "slider", "min": 1, "max": 40, "default": 5, "step": 1 },
      { "label": "Average Hourly Rate", "type": "number", "default": 75, "prefix": "$" }
    ],
    "Results": [
      { "label": "Annual Savings", "formula": "teamSize * hoursSavedPerWeek * averageHourlyRate * 52", "prefix": "$", "format": "commas", "highlight": true },
      { "label": "Hours Reclaimed", "formula": "teamSize * hoursSavedPerWeek * 52", "suffix": " hrs/year" }
    ]
  }
}
```

---

#### InteractiveQuiz
A step-through quiz that recommends a product, service, or outcome based on answers. The Buzzfeed quiz meets the product recommender.

**Fields:**
- `Title` (text)
- `Questions` (items) — `{ question, type, options }`
  - `type`: `single-choice`, `multiple-choice`, `slider`, `image-choice`
  - `options` as sub-items: `{ label, image, value, tags }`
- `Results` (items) — `{ title, description, image, cta-label, cta-link, match-tags }`
- `Style` (select) — `card`, `full-screen`, `minimal`
- `Transition` (select) — `slide`, `fade`, `stack`
- `Show Progress` (toggle)

**What makes it special:**
- `image-choice`: options are clickable images rather than radio buttons — way more engaging
- Tag-based matching: each option tags with values, result with the most matching tags wins
- Full-screen mode: each question takes the full viewport, dramatic and focused
- Result page with confetti/animation, shareable result, CTA to convert
- "What type of X are you?" — the most shared content format on the internet

---

#### InteractiveMoodboard
A pannable, zoomable canvas of images, text snippets, and color swatches. The creative agency's dream block. Clients see the vision.

**Fields:**
- `Elements` (items) — `{ type, content, image, color, x, y, width, rotation, z-index }`
  - `type`: `image`, `text`, `color-swatch`, `note`
- `Canvas Style` (select) — `clean`, `paper-texture`, `cork`, `dark`
- `Interaction` (select) — `pan-zoom`, `scroll-reveal`, `static`
- `Connection Lines` (toggle)

**What makes it special:**
- It's a spatial canvas, not a linear page — content has position, size, rotation
- Images overlap, notes are at angles, color swatches cluster — it feels art-directed
- Pan and zoom to explore — minimap in corner
- `scroll-reveal`: elements fade in as you scroll, simulating the experience of looking at a physical mood board
- The AI can generate mood board layouts for brand presentations

---

#### InteractiveCodePlayground
Live code editor with preview. Edit HTML/CSS/JS and see results in real-time. Perfect for developer documentation, coding courses, component showcases.

**Fields:**
- `Tabs` (items) — `{ label, language, code }`
- `Show Preview` (toggle)
- `Preview Position` (select) — `right`, `bottom`
- `Theme` (select) — `dark`, `light`, `brand`
- `Editable` (toggle) — viewer can modify code
- `Run Button` (toggle) — vs. auto-run

**What makes it special:**
- Live preview updates as you type — sandboxed iframe
- Syntax highlighting (could use Shiki or Prism from CDN)
- If `editable: false`, it's a beautiful code display block
- If `editable: true`, visitors can experiment — great for documentation, tutorials
- Tab between HTML, CSS, JS files
- This makes Make Studio a credible platform for developer-focused sites

---

## Summary: The Full Interactive Block Library

| Category | Blocks | Key Library | Differentiator |
|----------|--------|-------------|----------------|
| **Maps** | 5 | MapLibre GL JS | Brand-tinted maps, animated routes, heatmaps |
| **Carousels** | 7 | Embla Carousel | Touch physics, morph transitions, scroll-driven timelines |
| **Portfolios** | 6 | Custom + Embla | FLIP animations, spatial canvas, origin-aware lightbox |
| **Data/Content** | 6 | Alpine.js | Slot-machine counters, multi-step forms, scroll-drawn timelines |
| **"Nobody Has This"** | 5 | Various | 360° product viewer, live calculators, quiz builders, mood boards, code playgrounds |
| **Total** | **29** | | |

## Build Priority

| Priority | Block | Why |
|----------|-------|-----|
| 1 | CarouselTestimonials | Every site needs social proof. Easiest carousel to build and most broadly useful. |
| 2 | CarouselLogos | Dead simple (CSS-only possible), massive social proof impact. |
| 3 | AccordionFAQ | Every site needs FAQ. Simple, high-value, good SEO (schema markup). |
| 4 | PricingToggle | Every SaaS site needs pricing. High conversion impact. |
| 5 | CarouselPortfolio | Core use case for creative professionals. |
| 6 | PortfolioMasonry | The other core portfolio pattern. Filtering + FLIP animations. |
| 7 | MapHeroFullbleed | Huge impact for local businesses, restaurant, venues. |
| 8 | StatsCounter | Quick win — count-up numbers are universally impressive. |
| 9 | CarouselBeforeAfter | Unique interaction, high engagement, easy to build. |
| 10 | InteractiveCalculator | True differentiator. No other builder has configurable calculators. |
| 11 | TabsFeatures | SaaS product tours. High value for tech sites. |
| 12 | TimelineVertical | Company history, milestones. Scroll-drawn line is premium. |
| 13 | PortfolioShowcase | Studio-grade portfolio presentation. |
| 14 | InteractiveQuiz | Viral engagement. Product recommenders convert. |
| 15 | FormMultiStep | Complex but high value. Needs backend story. |

## Handle Philosophy for Interactive Blocks

Interactive blocks have a different handle profile than hero effects blocks. Heroes are about mood (speed, intensity, chaos). Interactive blocks are about **behavior and content structure**.

Three handle tiers:

### Content Handles (AI always sets these)
The items, text, images that make the block specific to the client. The AI generates this content based on the business.

### Behavior Handles (AI sets based on brand + use case)
How the block behaves. Auto-rotate vs. manual. Transition style. Navigation type. The AI chooses based on the brand's vibe and the content volume.

### Fine-Tuning Handles (user tweaks in CMS)
Gap sizes, aspect ratios, toggle options. The AI sets sensible defaults, the user adjusts if they care.

The `aiDescription` for each interactive block should guide the AI on behavior handle selection:
- "For luxury/premium brands, use `fade` transitions, `minimal` navigation, and disable auto-rotate — let the user control the pace."
- "For high-energy brands, use `slide` transitions, `auto-rotate: true`, and `progress-bar` navigation."
- "For content-heavy sites (10+ testimonials), use `cards-per-view: 3` and `arrows-and-dots` navigation."

---

## Category 6: Functional Systems — Post Types + Interactive Blocks

This is the real unlock. The blocks above are components. When you combine them with **custom post types**, they become **functional systems** — a blog, a portfolio, a team directory, an event calendar, a product catalog. The AI doesn't just pick blocks — it provisions an entire content architecture during site creation.

### Why This Matters

Claude can vibe-code a video game. But for websites, the pragmatic wins are what matter — the things that let business owners actually **do stuff** with their site after launch. A gorgeous hero is worthless if the client can't add a blog post next Tuesday.

Post types are Make Studio's secret weapon here. `createPostType()` auto-creates a detail page, an index page, and a first post. But right now those pages are **empty** — no blocks, no fields, no structure. The AI has to figure out what to put there from scratch every time.

The idea: **post type recipes** — pre-built configurations that the AI selects during intake and provisions automatically. Each recipe specifies the detail page blocks, index page blocks, sample content, and the interactive blocks that display the posts.

### How It Works: The Intake Interview

During site creation, the AI asks practical questions:

```
AI: "What does your business need this site to do?"

User: "I run a photography studio. I need to show my portfolio,
       have a blog, and let people book sessions."

AI provisions:
1. Portfolio post type (detail: hero image + gallery + description + client name)
   → PortfolioMasonry block on the Work page, pulling from posts
   → Each post = one project

2. Blog post type (detail: header + body + author + date)
   → CarouselCards block on homepage showing latest 3 posts
   → Blog index page with card grid

3. Contact page with FormMultiStep (name, email, session type, date preference)

4. Standard pages: Home (hero + services + portfolio preview + testimonials + CTA),
   About (with team block), Contact (with form + map)
```

The AI makes all of this in one shot. Post types created, detail pages populated with blocks, index pages set up, content filled in, blocks on the main pages pulling from post data.

### Post Type Recipes

Each recipe defines everything needed to provision a complete content system.

---

#### Recipe: Blog

**When to use:** User mentions blog, articles, news, updates, resources, journal, insights.

**Post type name:** `Blog` (or `Articles`, `Journal`, `News` — AI picks based on brand voice)

**Detail page blocks:**
- `PostHeader` — Title (heading-xl), date, author name, author avatar, category tag, featured image
- `PostBody` — Full wysiwyg body content, `{{{body}}}` triple-stache
- `PostFooter` — Author bio card, share links, "read next" recommendation

**Index page blocks:**
- `BlogGrid` — Card grid of all posts. Image, title, excerpt, date, category. Filterable by category. Paginated or infinite scroll.

**Homepage integration:**
- `CarouselCards` or a `LatestPosts` block showing 3 most recent posts on the homepage

**Sample content:**
- 3 sample posts with realistic titles, body text, and placeholder images
- Categories: "Company News", "Insights", "Tutorials"

**AI configuration:**
```json
{
  "postType": "Blog",
  "detailBlocks": ["PostHeader", "PostBody", "PostFooter"],
  "indexBlocks": ["BlogGrid"],
  "homepageBlock": { "block": "CarouselCards", "config": { "source": "blog", "count": 3 } },
  "samplePosts": 3,
  "fields": {
    "Title": "text",
    "Featured Image": "image",
    "Body": "wysiwyg",
    "Author": "text",
    "Category": "select",
    "Excerpt": "textarea"
  }
}
```

---

#### Recipe: Portfolio / Projects

**When to use:** User mentions portfolio, work, projects, case studies, gallery. Photographers, designers, agencies, architects, developers.

**Post type name:** `Projects` (or `Work`, `Portfolio`, `Case Studies`)

**Detail page blocks:**
- `ProjectHero` — Full-bleed hero image, project title, client name, year, category
- `ProjectGallery` — Image gallery (lightbox or masonry grid within the post)
- `ProjectDescription` — Wysiwyg body + optional sidebar with project stats
- `ProjectNav` — Previous / next project navigation

**Index page blocks:**
- `PortfolioMasonry` or `PortfolioGrid` — filterable by category, FLIP animation on filter

**Homepage integration:**
- `PortfolioShowcase` — featured projects carousel on homepage
- Or `PortfolioGrid` with `limit: 6` showing selected work

**Sample content:**
- 4-6 sample projects with realistic names, categories, placeholder images
- Categories match the user's discipline (e.g., "Branding", "Web Design", "Print" for a design studio)

---

#### Recipe: Team

**When to use:** User mentions team, staff, people, about us with team members. Agencies, companies, organizations.

**Post type name:** `Team`

**Detail page blocks:**
- `TeamMemberHero` — Large photo, name, role, bio
- `TeamMemberDetails` — Extended bio (wysiwyg), social links, contact info
- `TeamMemberProjects` — Projects this person worked on (if portfolio post type also exists)

**Index page blocks:**
- `TeamGrid` — Photo grid with name and role overlay on hover. Clean, professional.

**Homepage/about integration:**
- `TeamGrid` with `limit: 4-6` on the About page

**Sample content:**
- 4-6 team members with realistic names, roles, placeholder avatars

---

#### Recipe: Events

**When to use:** User mentions events, shows, performances, workshops, classes, meetups, conferences.

**Post type name:** `Events`

**Detail page blocks:**
- `EventHero` — Event title, date, time, location, featured image
- `EventDetails` — Description (wysiwyg), schedule/agenda, speakers
- `EventCTA` — Ticket/RSVP button, price, availability
- `MapHeroFullbleed` or `MapLocations` — venue map

**Index page blocks:**
- `EventTimeline` or `EventGrid` — upcoming events listed chronologically
- Toggle between upcoming and past events

**Homepage integration:**
- `UpcomingEvents` block — next 3 events with countdown timers

**Sample content:**
- 3 upcoming events with realistic dates (in the future), venues, descriptions

**Special:** Events have a temporal dimension — past events should render differently than upcoming ones. The index page could auto-sort by date and visually distinguish past/future.

---

#### Recipe: Products / Services

**When to use:** User mentions products, services, offerings, packages, menu items. E-commerce-lite (not full cart, but product showcase).

**Post type name:** `Products` or `Services` or `Menu`

**Detail page blocks:**
- `ProductHero` — Product image(s), name, price, description
- `ProductFeatures` — Feature list or specs table
- `ProductGallery` — Multiple product images (carousel or grid)
- `ProductCTA` — Buy/order/inquire button, pricing details

**Index page blocks:**
- `ProductGrid` — Filterable card grid with image, name, price, category
- Or `CarouselCards` for a more curated feel

**Homepage integration:**
- `FeaturedProducts` — 3-4 highlighted products on homepage

**Sample content:**
- 4-6 products with realistic names, prices, descriptions, placeholder images
- Categories match the business (e.g., "Starters", "Mains", "Desserts" for a restaurant)

---

#### Recipe: Testimonials / Reviews

**When to use:** User has client testimonials, reviews, or social proof they want to manage as content.

**Post type name:** `Testimonials`

This one is interesting because testimonials might not need their own pages — they're more of a data source for other blocks. But as a post type, each testimonial is individually editable in the CMS.

**Detail page blocks:** Minimal — maybe just the full quote with author info (most users will never visit individual testimonial pages).

**Index page blocks:** Not typically needed.

**Integration blocks:**
- `CarouselTestimonials` — pulls from testimonial posts, displays as a carousel anywhere on the site
- `TestimonialGrid` — masonry or card grid of all testimonials

**Sample content:**
- 5-8 testimonials with realistic quotes, names, roles, company names, avatars

---

#### Recipe: Locations

**When to use:** User has multiple physical locations (stores, offices, restaurants, clinics).

**Post type name:** `Locations`

**Detail page blocks:**
- `LocationHero` — Location name, address, hero image of the location
- `LocationDetails` — Hours, phone, email, parking info, directions (wysiwyg)
- `MapHeroFullbleed` — map centered on this specific location
- `LocationGallery` — Photos of the location

**Index page blocks:**
- `MapLocations` — all locations on one map with sidebar list

**Homepage integration:**
- `MapLocations` embedded on the contact page, or a `LocationCards` carousel

**Sample content:**
- 2-4 locations with realistic addresses, hours, phone numbers

---

#### Recipe: FAQ / Knowledge Base

**When to use:** User mentions FAQ, help center, knowledge base, documentation, support.

**Post type name:** `FAQ` or `Help Articles`

**Detail page blocks:** (if full articles)
- `ArticleHeader` — Title, category, last updated
- `ArticleBody` — Wysiwyg with table of contents auto-generated from headings

**Index page blocks:**
- `FAQAccordion` or `AccordionFAQ` — grouped by category, expandable
- Search bar for filtering questions

**Homepage integration:**
- `AccordionFAQ` with the top 5-10 most common questions

**Sample content:**
- 8-12 questions with realistic answers, grouped into 2-3 categories

---

### The Provisioning Flow

```
INTAKE:
  AI: "Tell me about your business."
  User: "I'm a wedding photographer in Portland."

AI DETERMINES:
  - Business type: photographer (creative professional)
  - Location: Portland (physical, local business)
  - Needs: portfolio (core), blog (likely), contact (essential),
           testimonials (valuable), location/map (yes, local)

AI PROVISIONS:
  1. Create site + theme
  2. Create post types:
     - Projects (portfolio recipe) → detail page + index page + 4 sample projects
     - Blog (blog recipe) → detail page + index page + 3 sample posts
     - Testimonials (testimonials recipe) → 6 sample testimonials
  3. Create pages:
     - Home: Hero + PortfolioShowcase (pulls from Projects) + CarouselTestimonials
            + LatestPosts (pulls from Blog) + CTA
     - Work: PortfolioMasonry (pulls from Projects, filterable by category)
     - Blog: BlogGrid (pulls from Blog posts)
     - About: Story section + TeamGrid (just the photographer, solo)
     - Contact: FormMultiStep + MapHeroFullbleed (Portland studio location)
  4. Create layout:
     - Header: Navbar with links to Home, Work, Blog, About, Contact
     - Footer: Contact info, social links, copyright
  5. Populate content:
     - Sample projects with wedding photography categories
       ("Weddings", "Engagements", "Elopements")
     - Sample blog posts about wedding photography topics
     - Sample testimonials from happy couples
     - Contact form with fields: Name, Email, Event Date, Event Type, Message
  6. Deploy preview

TIME: ~2-3 minutes
RESULT: A complete, functional wedding photography website with a working portfolio,
        blog, testimonials, and contact system. The photographer can immediately
        start replacing sample content with real content.
```

### What Makes This Different From Every Other Builder

1. **It's not just pages — it's systems.** Squarespace gives you pages. We give you a blog system, a portfolio system, an event system. Each one is a post type with a detail template, an index page, and integration blocks on other pages.

2. **The content structure is pre-built.** When the photographer adds a new project, the detail page already has the right blocks (hero image, gallery, description, client name). They just fill in the fields. No page building required for individual posts.

3. **Cross-page integration is automatic.** Adding a project automatically updates the portfolio grid on the Work page AND the featured projects carousel on the homepage. The blocks pull from the post type data.

4. **The AI understands the business.** A photographer gets a portfolio. A restaurant gets a menu. A SaaS company gets pricing + blog + FAQ. The intake interview determines the functional systems, not just the visual design.

5. **Sample content is realistic and on-brand.** Not "Lorem ipsum" — actual content that matches the business type. The photographer sees sample projects with wedding-related categories and titles. This makes the site feel real immediately, and the client understands how to maintain it.

### Post Type Blocks — The Glue

These are specialized blocks that **read from post type data** rather than hardcoded content. They're the connection between the post type system and the page layout.

| Block | Pulls From | Purpose |
|-------|-----------|---------|
| `LatestPosts` | Any post type | Show N most recent posts as cards |
| `PostGrid` | Any post type | Filterable grid of all posts |
| `PostCarousel` | Any post type | Horizontal scroll of post cards |
| `FeaturedPosts` | Any post type | Hand-picked highlighted posts |
| `PostCount` | Any post type | "127 articles and counting" stat |
| `CategoryNav` | Any post type | Category/tag filter navigation |
| `PostSearch` | Any post type | Search within a post type |

These blocks use the `PostsDataService` to access post metadata (title, date, URL, slug, featured image, excerpt). The detail page defines which fields exist; these blocks display summaries.

**Key question:** Do these blocks need to be post-type-aware at the template level, or can they use a generic `{{#each posts}}` pattern with the `dataStore` helper? The existing `{{#each (dataStore "slug")}}` pattern suggests this is already possible — the block template is generic, and the data source is configurable.

### Intake Questions → Recipe Selection

The AI doesn't need to ask "do you want a blog?" directly. It infers from context:

| User Says | AI Infers | Recipes |
|-----------|-----------|---------|
| "I'm a photographer" | Creative professional | Portfolio + Blog + Testimonials |
| "We're a restaurant" | Local business, food | Menu (products) + Events + Locations + Testimonials |
| "I run a SaaS startup" | Tech, B2B | Blog + FAQ + Pricing (not a post type, but PricingToggle block) |
| "I'm a real estate agent" | Local, listings | Properties (portfolio-style) + Blog + Testimonials + Locations |
| "We're a nonprofit" | Mission-driven | Blog (news/updates) + Events + Team + Testimonials |
| "I'm a freelance developer" | Solo creative | Portfolio + Blog + Testimonials |
| "We're a law firm" | Professional services | Team + Blog (insights) + FAQ + Testimonials |
| "I run a yoga studio" | Local, classes | Events (class schedule) + Blog + Team (instructors) + Testimonials |
| "I'm a musician" | Creative, events | Portfolio (discography/music) + Events (shows) + Blog |
| "We're an e-commerce brand" | Products | Products + Blog + FAQ + Testimonials |

The AI can confirm: *"Based on what you've told me, I'm going to set up a portfolio for your work, a blog for sharing insights, and a testimonials section. I'll also add a contact form with a map to your studio. Sound good?"*

One sentence. User says yes. AI provisions everything.

### What About Post Type Detail Page Blocks?

This is where the interactive block library meets the post type system. The detail page for each post type needs specific blocks:

**Blog detail page needs:**
- `PostHeader` — but this is really just a hero block configured for blog posts
- `PostBody` — a wysiwyg block, possibly with a table of contents sidebar
- `PostFooter` — author card + share links + related posts carousel

**Portfolio detail page needs:**
- `ProjectHero` — full-bleed image hero
- `ProjectGallery` — image gallery (lightbox or masonry)
- `ProjectInfo` — sidebar or inline stats (client, year, category, URL)
- `ProjectNav` — prev/next project links

These detail page blocks are **also pre-built blocks in the library**. The recipe says "use these blocks on the detail page" and the AI provisions them automatically.

The blocks could even be post-type-aware — a `PostHeader` block that automatically shows the date field if the post type has one, or shows a category badge if categories exist. But simpler is better: just use standard blocks and the AI configures the fields per recipe.

---

## Discussion Log

- **2026-03-10**: Initial research. Catalogued 29 interactive blocks across 5 categories. Defined handle philosophy (content / behavior / fine-tuning tiers). Prioritized build order by universal need + differentiation potential. Added Category 6: Functional Systems — post type recipes (blog, portfolio, team, events, products, testimonials, locations, FAQ), intake-to-provisioning flow, post type blocks for cross-page integration, and intake question → recipe inference table.
