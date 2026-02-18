# LTA Theme Conversion Guide

## Theme Overview

- **Source:** Land Trust Alliance (LTA) Nuxt 3 + Storyblok CMS
- **Built with:** Nuxt 3, Vue 3, Tailwind CSS, Storyblok, FontAwesome
- **Components converted:** 15 blocks, 5 partials (content blocks only)
- **Skipped:** Auth, search, CMS integration, charts, user accounts

## Color Mapping (LTA → 10-color system)

### System Colors
| Token | Value | LTA Source |
|-------|-------|-----------|
| `brand` | `#58a66f` | green (accent, buttons, links) |
| `on-brand` | `#ffffff` | white |
| `base` | `#ffffff` | white |
| `base-muted` | `#f5f5f5` | subtle gray (black-100) |
| `base-alt` | `#26484c` | green-dark (dark sections) |
| `panel` | `#e6e0d5` | stone (card backgrounds) |
| `fg` | `#1a1a1a` | black |
| `fg-muted` | `#383838` | dark gray |
| `fg-alt` | `#767676` | medium gray |
| `border` | `#e4e4e4` | light gray |

### Custom Colors
- `green-dark`: `#26484c` — headings, dark section backgrounds
- `orange`: `#db8043` — accent in dark sections, expandable active state
- `yellow`: `#d9a832` — banner default accent
- `blue`: `#50abbd` — slider accent
- `stone`: `#e6e0d5` — aside/card backgrounds
- `ruby`: `#cd172f` — alert color

## Typography

### Fonts
- **lft-etica** (sans-serif): Body text, buttons, labels — weights 400, 600, 700, 800
- **ff-meta-serif-web-pro** (serif): Headings — weights 400, 800

### Scale
| Class | Size | Line Height | Font |
|-------|------|-------------|------|
| `heading-xl` | 48/35 | 55/40 | Meta Serif 800 |
| `heading-lg` | 39/27 | 45/31 | Meta Serif 800 |
| `heading-md` | 32/24 | 37/28 | Meta Serif 800 |
| `heading-sm` | 27/22 | 31/25 | Meta Serif 800 |
| `heading-xs` | 18/18 | 21/21 | Etica 700 |
| `body-lg` | 22 | 33 | Etica 400 |
| `body-md` | 18 | 27 | Etica 400 |
| `body-sm` | 16 | 24 | Etica 400 |

## Section Theming

Sections use CSS classes defined in `customCSS` that set CSS variables:

| Class | Background | Heading | Body | Accent |
|-------|-----------|---------|------|--------|
| `lta-section-white` | #ffffff | #26484c | #1a1a1a | #58a66f |
| `lta-section-dark` | #26484c | #e6e0d5 | #ffffff | #db8043 |
| `lta-section-stone` | #e6e0d5 | #26484c | #1a1a1a | #58a66f |
| `lta-section-gray` | #f5f5f5 | #26484c | #1a1a1a | #58a66f |

## Icon Mapping (FontAwesome → Phosphor)

| FontAwesome | Phosphor | Used In |
|-------------|----------|---------|
| chevron-left | caret-left | Gallery, Slider |
| chevron-right | caret-right | Gallery, Slider, Button link |
| magnifying-glass | magnifying-glass | SiteHeader |
| minus | minus | Expandable |
| plus | plus | Expandable |
| arrow-right | arrow-right | Footer, Button |
| envelope | envelope | Footer |
| hand-holding-seedling | hand-heart | Callout icons |
| circle-user | user-circle | Auth (skipped) |

## Container Pattern

LTA responsive padding preserved: `px-6 md:px-8 lg:px-12 xl:px-24`

## Partials

| Partial | Purpose | Key Fields |
|---------|---------|------------|
| **Button** | Solid/outline/link button | label, url, icon, style |
| **Edge** | Wavy SVG edge decoration | type (wavy-top/wavy-bottom) |
| **IconBlob** | Blob SVG + Phosphor icon | icon |
| **Label** | Eyebrow with brush SVG | text |
| **Heading** | Label + title + subtitle + desc | label, title, subtitle, description, align |

## Blocks

| Block | Description | Key Fields |
|-------|------------|------------|
| **Banner** | Hero with background image | label, title, subtitle, body, bg-image, size, buttons |
| **LayoutSection** | Section with background | body (wysiwyg), background (4 variants), top-edge |
| **LayoutGrid** | Multi-column grid | heading fields, columns (2/3/4), content |
| **Feature** | Content + image split | label, title, body, image, layout (default/card) |
| **Callout** | CTA with grunge texture | icon, image, title, description, button |
| **Content** | Rich text + optional sidebar | body, sidebar, sidebar-position |
| **Quote** | Blockquote with citation | quote (textarea), citation |
| **Heading** | Section heading block | label, title, subtitle, description, align, width |
| **ExpandableList** | Accordion FAQ | title, items (title + content) |
| **Slider** | Static card grid | title, description, items (image + title + body + button) |
| **List** | Icon + text list | items (icon + label + body), spacing |
| **Gallery** | Image grid | images (image + caption) |
| **Aside** | Stone card with topography header | title, body |
| **SiteHeader** | Logo + navigation | logo, nav-items, button |
| **SiteFooter** | Footer with columns | address, socials, donate, subscribe, menu-columns, copyright |

## Custom CSS Classes

- `.lta-label` — Brush SVG eyebrow label
- `.lta-section-white/dark/stone/gray` — Section theme variants
- `.lta-grunge-bg` — Grunge texture overlay (via `::before`)
- `.lta-topography-header` — Topography texture strip (via `::before`)
- `.lta-icon-blob` / `.lta-blob-lg` — Icon blob container
- `.lta-expand-title` — Expandable title (colors on `details[open]`)

## Conversion Notes

1. **Gallery/Slider** simplified to static CSS grids (no Hooper carousel JS)
2. **Expandable** uses native `<details>`/`<summary>` instead of Vue toggle
3. **Icons** mapped from FontAwesome `fal` to Phosphor via `{{icon}}` helper
4. **Section nesting** removed — LayoutSection uses wysiwyg body instead of nested blocks
5. **Textures** stored in `assets/textures/` and referenced via CSS in customCSS
6. **Edge decorations** — wavy SVGs inlined in Edge partial, texture edges omitted (CSS-only)
