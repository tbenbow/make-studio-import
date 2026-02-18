# Radiant Theme Conversion Guide

## Theme Overview

- **Source:** Radiant Next.js SaaS marketing site (Tailwind UI)
- **Built with:** Next.js 15, Tailwind CSS 4, Framer Motion, Headless UI
- **Status:** Converted (16 blocks, 1 partial)

## Color Mapping (gray/gradient → 10-color system)

### Text Colors
| Original Class | Theme Class | Usage |
|----------------|-------------|-------|
| `text-gray-950` | `text-fg` | Primary text |
| `text-gray-700`, `text-gray-600` | `text-fg-muted` | Secondary text |
| `text-gray-500`, `text-gray-400` | `text-fg-alt` | Tertiary/hint text |
| `text-white` (on dark bg) | `text-on-brand` | Text on brand buttons/dark sections |

### Background Colors
| Original Class | Theme Class | Usage |
|----------------|-------------|-------|
| `bg-white` | `bg-base` | Main page background |
| `bg-gray-50` | `bg-base-muted` | Subtle section backgrounds |
| `bg-gray-100` | `bg-panel` | Card backgrounds |
| `bg-gray-950` | `bg-brand` | Primary buttons |
| `bg-gray-900` | `bg-brand` | Dark sections |
| `hover:bg-gray-800` | `hover:bg-base-alt` | Button hover states |

### Border Colors
| Original Class | Theme Class | Usage |
|----------------|-------------|-------|
| `border-gray-200` | `border-border` | Standard borders |
| `border-gray-100` | `border-border` | Light borders |
| `border-dotted border-gray-200` | `border-dotted border-border` | Dotted dividers |

### Brand Gradient (preserved as custom CSS)
| Original | Converted |
|----------|-----------|
| `bg-linear-115 from-[#fff1be] from-28% via-[#ee87cb] via-70% to-[#b060ff]` | `bg-gradient-to-br from-[#fff1be] from-28% via-[#ee87cb] via-70% to-[#b060ff]` |

The gradient is Radiant's signature visual — yellow → pink → purple. It cannot be mapped to a single color token, so it's preserved as inline gradient classes.

### Remove
| Original Class | Action |
|----------------|--------|
| `dark:*` variants | Remove entirely |
| `data-dark:*` variants | Remove or convert to static dark styles |

## Typography Mapping

| Original Classes | Theme Class | Notes |
|------------------|-------------|-------|
| `text-4xl font-medium tracking-tighter sm:text-6xl` | `heading-xl` | Heading component |
| `text-2xl font-medium tracking-tight` | `heading-md` | Section subheadings |
| `font-mono text-xs/5 font-semibold tracking-widest uppercase` | *(inline)* | Subheading/eyebrow — kept as inline mono classes |
| `text-2xl font-medium text-gray-500` | body-lg + text-fg-alt | Lead component |
| `text-base/7` | `body-md` | Standard body text |
| `text-sm/6` | `body-sm` | Small text, labels |

**Note:** The mono uppercase eyebrow (Subheading component) is a distinctive Radiant pattern. It's kept as inline classes rather than mapped to a heading class.

## Icon Mapping

| Radiant Icon | Phosphor Name |
|--------------|---------------|
| Bars2Icon | `list` |
| ChevronRightIcon | `caret-right` |
| ChevronLeftIcon | `caret-left` |
| CheckIcon | `check` |
| ChevronUpDownIcon | `caret-up-down` |
| RssIcon | `rss` |
| MinusIcon | `minus` |
| ArrowLongRightIcon | `arrow-right` |
| XIcon (social) | `x-logo` |
| Facebook (social) | `facebook-logo` |
| LinkedIn (social) | `linkedin-logo` |

## Container Pattern

Original Radiant Container:
```jsx
<Container className="...">
```

Converted (inline):
```html
<div class="px-6 lg:px-8">
  <div class="mx-auto max-w-2xl lg:max-w-7xl">
```

## Block Background

Every block's root element includes `bg-base` to ensure blocks are self-contained. The original Radiant source uses page-level background classes — in Make Studio, blocks define their own background.

## Brand Gradient Usage

The gradient appears in several contexts:
- **HeroGradient**: Background behind the hero section
- **Footer**: Background behind the CTA and sitemap
- **PricingCards**: Background behind the card row
- **Testimonials**: Gradient text for the person's title/company
- **LoginForm**: Blurred gradient blob in the background

In templates, the gradient is expressed as:
```html
bg-gradient-to-br from-[#fff1be] from-28% via-[#ee87cb] via-70% to-[#b060ff]
```

## Animation Handling

Radiant heavily uses Framer Motion for:
- Scroll-based opacity on testimonial cards
- Hover animations on bento cards
- Animated counters (AnimatedNumber)
- Mobile nav entrance animations

These are all simplified to static HTML in the conversion. The visual layout is preserved but without animation.

## Converted Components

**Partials:**
- `partials/Button` - Primary/secondary/outline button (rounded-full)

**Blocks:**
- `blocks/Navbar` - Logo + horizontal nav links
- `blocks/HeroGradient` - Large hero with gradient bg, oversized h1, 2 CTAs
- `blocks/LogoCloud` - Row of partner/client logos
- `blocks/FeatureScreenshot` - Section heading + large screenshot
- `blocks/BentoGrid` - 5-card bento feature grid (light)
- `blocks/BentoGridDark` - 4-card bento grid on dark background
- `blocks/Testimonials` - Scrollable testimonial cards with photos
- `blocks/Footer` - CTA + 4-column sitemap + social links + copyright
- `blocks/PageHeader` - Generic eyebrow + heading + lead
- `blocks/CompanyHeader` - Company intro with mission text, photos, stats
- `blocks/TeamSection` - Team photo + about text + member grid
- `blocks/InvestorsSection` - VC firms + individual investor grid
- `blocks/CareersSection` - Job listings table + testimonial sidebar
- `blocks/PricingCards` - 3-tier pricing cards on gradient
- `blocks/TestimonialDark` - Dark bg testimonial with large photo
- `blocks/FAQ` - Question/answer list
- `blocks/BlogFeatured` - Featured posts in 3-column cards
- `blocks/BlogList` - Blog post listing with dates
- `blocks/LoginForm` - Centered login card with gradient blur

## Page Composition

| Page | Blocks |
|------|--------|
| Home | Navbar → HeroGradient → LogoCloud → FeatureScreenshot → BentoGrid → BentoGridDark → Testimonials → Footer |
| Company | Navbar → CompanyHeader → TeamSection → InvestorsSection → CareersSection → Footer |
| Pricing | Navbar → PageHeader → PricingCards → TestimonialDark → FAQ → Footer |
| Blog | Navbar → PageHeader → BlogFeatured → BlogList → Footer |
| Login | LoginForm |
