# Make Studio — Marketing Site Content

## Status: Feature discovery complete. Page structure defined. Ready to write copy.

---

## Features List

Each feature will be discussed individually to determine messaging, priority, and how to present it.

| # | Feature | Status | Priority | Notes |
|---|---------|--------|----------|-------|
| 1 | Block-based development | Pending | — | — |
| 2 | Content editing for non-devs | Pending | — | — |
| 3 | ~~Live preview~~ | Bundled with #2 | — | — |
| 4 | One-click static deploy | Pending | — | — |
| 5 | Theme system (colors, typography, fonts) | Pending | — | — |
| 6 | Posts & blog system | Pending | — | — |
| 7 | ~~Partials & layouts~~ | Bundled with #1 | — | — |
| 8 | AI block generation | Grouped into AI Workflow | — | Combined with #17 + page generation |
| 9 | Custom domains & SSL | Table stakes | — | Checkbox item, not a featured section |
| 10 | Media library (auto-optimization) | Pending | — | — |
| 11 | Ecommerce (Stripe) | Mention | — | Lightweight Stripe checkout — not a full Shopify. Worth a mention, not a headline. |
| 12 | Roles & permissions | Pending | — | — |
| 13 | Handlebars + Tailwind templating | Pending | — | — |
| 14 | ~~Interactivity (Alpine.js + HTMX)~~ | Bundled with #13 | — | — |
| 15 | ~~Data stores~~ | Bundled with #6 | — | — |
| 16 | ~~Snapshots (backups)~~ | Bundled with #4 | — | — |
| 17 | ~~API tokens~~ | Grouped into AI Workflow | — | Combined with #8 + page generation |
| 18 | ~~Drag-and-drop page building~~ | Bundled with #2 | — | — |

---

## Feature Details

### 1. Block-based development
- **Key message:** Modular, reusable blocks that inherit a theme — shareable across projects
- **Secondary message:** It's just HTML (Handlebars + Tailwind) — familiar, easy to work with
- **Best shown via:** Demo or short GIF (the simplicity of the code is immediately apparent when you see it)
- **Priority:** —
- **Notes:** The "it's just HTML" aspect is hard to convey in copy alone — needs visual support

### 2. Content editing for non-devs
- **Key message:** The workflow is instantly intuitive — see a block on a page, edit its content in a form, done
- **Secondary message:** No training needed. Publishers never see code.
- **Best shown via:** Demo/GIF of adding a block to a page and editing its fields — that single interaction is the "aha" moment
- **Priority:** —
- **Notes:** This is a top selling point for developers because it means clients can self-serve without hand-holding

### 4. One-click static deploy
- **Key message:** No DevOps. Click deploy, site is live on a global CDN.
- **Secondary messages:**
  - Static output = fast and secure by default
  - Publish requests — publishers can request deploys, developers/owners approve
  - Snapshots — backup and restore before major changes
  - Partial deploys with permissions — control who can deploy what
- **Priority:** —
- **Notes:** The deploy workflow (permissions, backups, recovery) is a set of features people have specifically asked for. Worth highlighting as a trust/safety story for teams.

### 5. Theme system (colors, typography, fonts)
- **Key message:** The theme is what makes blocks portable. Use the semantic tokens and your blocks work on any project — they become permanent assets you build up over time.
- **Secondary message:** Carefully curated set of design tokens (10 colors, 8 type styles, button system) that's easy to manage from both a design and development perspective. Not too many, not too few.
- **Why it matters:** Developers accumulate a library of blocks that adapt to any client's brand just by changing the theme. Every project makes you faster.
- **Priority:** —
- **Notes:** This is a BIG feature. The theme is the foundation that enables the reusability story. Should be positioned prominently — not as a checkbox feature but as a core differentiator.

### 6. Posts & blog system
- **Key message:** Not just blogs — a flexible content system. Posts can be anything: blog articles, products, team members, events, franchise mini-sites.
- **Secondary messages:**
  - Data stores let you link related data (e.g., author details to blog posts)
  - Built-in search and filtering via generated JSON indexes
  - Same block-based workflow — define a template, publishers create posts
- **Why it matters:** "You can build anything with this." It's an open-ended system, not a rigid blog feature.
- **Priority:** —
- **Notes:** Worth showing diverse examples (blog, product catalog, team directory) to make the flexibility concrete

### AI Workflow (combines #8, #17, + page generation)

**Three AI capabilities:**

**a) Block generation (screenshot or prompt → working CMS block)**
- Screenshot in, working CMS block out. Generates layout, template code, theme styles, AND the content editing sidebar.
- Best shown via side-by-side: input screenshot → generated block (un-retouched). Results speak for themselves.

**b) Page generation (compose full pages from existing blocks)**
- AI assembles full pages by composing blocks from your site's library and writing copy that fits.
- Reinforces the theme/block reusability payoff: the more blocks you build, the faster this gets.

**c) API-driven workflows (Claude Code as a collaborator)**
- Entire app driven by a REST API. AI tools can create sites, compose from existing blocks, deploy previews, and iterate.
- Scoped API tokens limit what AI can do (only edit blocks, only create pages, etc.)
- AI can enforce consistency across blocks (markup patterns, copy updates across all instances)
- Deploy previews so AI can see and iterate on what it's building

- **Key message:** Make Studio is AI-native by architecture. Not a chatbot bolted on — the same API developers use is the API AI uses.
- **Why it matters:** Three levels of AI acceleration — generate individual blocks, compose full pages, or let AI build and iterate on entire sites programmatically.
- **Priority:** —
- **Notes:** Each capability builds on the last. Block gen is the flashiest demo. Page gen shows compounding value. API workflow is the deepest integration.

### 10. Media library
- **Key message:** Images are optimized before upload (WebP, resized, sensible defaults) — zero giant images on your site by accident.
- **Secondary message:** Your site is fully portable. Download everything (HTML + optimized images) as a ZIP and host it anywhere. No CDN dependency.
- **Why it matters:** Sites are truly self-contained. You're not locked in — you own your output.
- **Priority:** —
- **Notes:** Portability angle is a differentiator rooted in a philosophical stance (founder's IPFS/Protocol Labs background). Worth framing as "you own your site" rather than just a technical detail.

### 12. Roles & permissions
- **Key message:** Developers control exactly what editors can change. Design integrity stays intact — clients can edit content but can't break the design.
- **Why it matters:** The sidebar IS the editing interface. Developers define the fields, so they define the boundaries. No rogue font changes, no layout-breaking edits.
- **Priority:** —
- **Notes:** Frame as developer control / design protection, not as a generic "roles" feature. Bundle with the content editing story (#2).

### 13. Handlebars + Tailwind templating
- **Key message:** Pragmatic, lightweight tools that aren't fussy. Handlebars, Tailwind, Alpine.js, HTMX — all optional except Handlebars.
- **Secondary messages:**
  - No proprietary framework to learn. If you know HTML, you're 90% there.
  - Write `<script>` or `<style>` tags directly in blocks if you want — no restrictions.
  - Global stylesheet + layout-specific stylesheets for custom CSS when needed.
- **Why it matters:** Low learning curve, no lock-in to a proprietary templating language. Developers can use what they already know.
- **Priority:** —
- **Notes:** The "only Handlebars is required, everything else is optional" message is important — it signals flexibility and low friction.

_(#17 merged into AI Workflow section above)_

---

## Page Structure (Conceptual Groupings)

### 1. Hero
- **Headline:** "A block-based platform for static sites. Build components once, reuse them forever."
- **Subheadline:** "Every block you build works on your next project. Spend less time rebuilding and more time on what makes your projects great."
- **Primary CTA:** "Try it free" → signup → onboarding
- **Secondary CTA:** TBD

### 2. Build

**Visual:** Animated block editor (Tailwind-style). Show a block being built step by step:
1. Fields added on the left sidebar
2. Handlebars + Tailwind template written in the code panel
3. Preview rendering in real-time on the right
This is the first thing visitors see after the hero — immediately communicates the core workflow.

**Copy (draft):**
"Blocks are the building blocks of your site. Each one combines a Handlebars template, Tailwind styling, and a set of fields — the fields become the editing interface your clients see."

**Templating subsection:**
"It's just HTML. Blocks are Handlebars templates styled with Tailwind. If you know HTML, you already know how to build blocks. Alpine.js and HTMX are included for interactivity but nothing is required beyond Handlebars — you can write plain `<script>` and `<style>` tags if you prefer."

**Theme subsection:**
Interactive playground — visitors can change color tokens and typography, and it affects the actual page section (not just an isolated preview). Bold, memorable, shareable. Says "our theme system is real — try it." Include a reset button to snap back to default. The "aha" moment: change the brand color, the section transforms → this is why blocks are portable across projects.

### 4. Edit
Content editing experience for non-devs, roles & permissions, design integrity.
- Features: #2 (includes live preview, drag-and-drop), #12

**Visual:** GIF/video — show a block being added to a page, then its fields edited in the sidebar with the preview updating live. Minimal copy, let the UI speak.

**Copy (draft, keep short):**
Something like: "Hand it off. Your clients edit content through simple forms. They never see code. They can't break your design."

**Design protection angle (brief):**
"You define the fields. That's the editing interface. No rogue font changes, no layout-breaking edits."

### 5. Ship
One-click deploy, no DevOps, publish requests, snapshots, custom domains, media optimization, site portability.
- Features: #4, #10, #9 (checkbox), #11 (mention)

**Tone:** Reassuring. Many web devs are anxious about deploy/hosting/DevOps. This section should feel like relief.

**Copy (draft):**
"Click deploy. That's it. Your site is live on a global CDN in seconds. No build pipeline, no server config, no DevOps."

**Supporting points (brief, checklist-style):**
- Custom domains with automatic SSL
- Snapshots — back up before big changes, restore if needed
- Publish requests — publishers request, developers approve
- Images optimized before upload — no giant files by accident
- Download your site as a ZIP and host it anywhere — you own your output
- Lightweight Stripe checkout if you need it

### 6. AI (final section — ends on a high)
Block generation, page generation, API-driven workflows. Three escalating levels.
- Features: AI Workflow section (combines #8, #17, page gen)

**Structure:** Lead with the flashiest, build up to the deepest.

**1. Block generation (the hook)**
Screenshot or prompt → working CMS block with fields, template, and theme styles. Side-by-side before/after. Un-retouched results. Let it speak for itself.

**2. Page generation (the differentiator vs Lovable)**
AI composes full pages from your existing block library and writes fitting copy. Not throwaway generated pages — real pages built from your reusable components. The more blocks you have, the better it gets.

**3. API-driven workflows (the deep cut)**
The entire app is a REST API. Tools like Claude Code or Open Claw can create sites, edit blocks, compose pages, deploy previews, and iterate — all programmatically. Scoped API tokens let you limit what AI can do (only edit blocks, only create pages, etc.). Safe by design.

**Copy (draft):**
Lead: "Screenshot in, working block out." (then show it)
Bridge: "Or let AI compose full pages from your block library."
Deep: "The entire app is an API. Give Claude Code or Open Claw scoped access and let them build, iterate, and deploy."

### 3. Content System (bento grid, right after Build)
Posts as a flexible content system — presented as a visual bento grid showing diverse use cases rather than a deep dive. Keeps the momentum going toward Edit/Ship/AI.
- Features: #6

**Format:** Bento-style grid with compact cards. Each card shows a use case:
- Blog with filtering/search
- Product catalog
- Team directory
- Events
- Franchise mini-sites
- Data stores (link author to posts, global nav, etc.)

**Copy (brief intro):**
Something like: "Posts aren't just for blogs. Define any content type — products, team members, events — with the same block-based workflow. Searchable, filterable, endlessly flexible."

---

## Positioning & Messaging

**What it is:** A platform for building and managing static HTML sites.

**Why it wins:** Genuine reuse of components across projects + a dramatically faster, simpler workflow than current tools.

**Differentiator vs SSGs (Astro/Hugo/11ty):** Those tools are project-scoped. Blocks in Make Studio are portable — build once, reuse across every client project, forever.

**Differentiator vs CMSs (Storyblok/Contentful):** Those are headless — you still need to build a frontend. Make Studio includes the dev environment, the CMS, and the deploy pipeline.

**Competitors:**
- **Storyblok/Next.js** — Same CMS + dev experience but without the framework complexity. It's just HTML. No build pipeline to manage, no React hydration, no SSR config.
- **Lovable** — Make Studio has AI generation too, but with a real dev workflow underneath. Blocks are reusable, theme-aware, and accumulate as permanent assets — not throwaway generated pages.

**Tone:**
- Direct and confident, not salesy
- Personal — feels like a person built this and stands behind it, not an anonymous company
- Reference: Tailwind docs. You sense Adam wrote them. Approachable, opinionated, would email you back.
- No corporate filler. Say what it does, show how it works.

**Hero messaging (draft):**
- **Headline:** "A block-based platform for static sites. Build components once, reuse them forever."
- **Subheadline:** "Every block you build works on your next project. Spend less time rebuilding and more time on what makes your projects great."
- **Primary CTA:** "Try it free" → signup → onboarding (start from a starter site or generate one with AI)
- **Secondary CTA:** _TBD (demo video? docs? "See how it works"?)_

---

## Target Audience

**Primary:** Developers (freelancers, agency devs, solo devs building client sites)
**Key angle:** The content editing experience is so simple that clients/publishers can manage their own content without touching code — this is a major selling point *to* developers because it reduces ongoing support burden.
