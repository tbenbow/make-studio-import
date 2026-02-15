# Spotlight Theme Conversion Guide

## Theme Overview

- **Source:** Spotlight Next.js personal portfolio/blog (Tailwind UI)
- **Built with:** Next.js 13+ (App Router), Tailwind CSS, Headless UI
- **Status:** Converted (12 blocks, 1 partial)

## Color Mapping (zinc/teal → 10-color system)

### Text Colors
| Original Class | Theme Class | Usage |
|----------------|-------------|-------|
| `text-zinc-800`, `text-zinc-900` | `text-fg` | Primary text |
| `text-zinc-100` (dark) | `text-fg` | Primary text (dark mode) |
| `text-zinc-600` | `text-fg-muted` | Secondary/muted text |
| `text-zinc-400`, `text-zinc-500` | `text-fg-alt` | Tertiary/hint text |
| `text-teal-500`, `text-teal-400` | `text-brand` | Accent/link text |
| `text-zinc-100` (on dark bg) | `text-on-brand` | Text on brand buttons |

### Background Colors
| Original Class | Theme Class | Usage |
|----------------|-------------|-------|
| `bg-white` | `bg-base` | Main page background |
| `bg-zinc-50` | `bg-base-muted` | Subtle section backgrounds |
| `bg-zinc-100`, `bg-zinc-800/50` (dark) | `bg-panel` | Card hover backgrounds |
| `bg-zinc-800`, `bg-zinc-700` | `bg-brand` | Primary buttons |
| `hover:bg-zinc-700`, `hover:bg-zinc-600` | `hover:bg-base-alt` | Button hover states |

### Border Colors
| Original Class | Theme Class | Usage |
|----------------|-------------|-------|
| `border-zinc-100` | `border-border` | Standard borders |
| `border-zinc-200` | `border-border` | Decorative borders |
| `border-zinc-700/40` (dark) | `border-border` | Dark mode borders |

### Remove
| Original Class | Action |
|----------------|--------|
| `dark:*` variants | Remove entirely - theme handles dark mode |

## Typography Mapping

| Original Classes | Theme Class | Notes |
|------------------|-------------|-------|
| `text-4xl`/`text-5xl` + font-bold tracking-tight | `heading-xl` | Page headlines |
| `text-base` body text | `body-md` | Standard body text |
| `text-sm` | `body-sm` | Small text, labels, eyebrows |

## Icon Mapping

| Spotlight Icon | Phosphor Name |
|----------------|---------------|
| XIcon (social) | `x-logo` |
| InstagramIcon | `instagram-logo` |
| GitHubIcon | `github-logo` |
| LinkedInIcon | `linkedin-logo` |
| ChevronRightIcon | `caret-right` |
| MailIcon | `envelope` |
| BriefcaseIcon | `briefcase` |
| ArrowDownIcon | `arrow-down` |
| LinkIcon | `link` |

## Container Pattern

Original Spotlight Container (nested):
```jsx
<ContainerOuter className="sm:px-8">
  <div className="mx-auto w-full max-w-7xl lg:px-8">
    <ContainerInner className="relative px-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-2xl lg:max-w-5xl">
```

Converted (inline):
```html
<div class="sm:px-8">
  <div class="mx-auto w-full max-w-7xl lg:px-8">
    <div class="relative px-4 sm:px-8 lg:px-12">
      <div class="mx-auto max-w-2xl lg:max-w-5xl">
```

## Block Background

Every block's root element includes `bg-base` to ensure blocks are self-contained. The original Spotlight source relies on `<body class="bg-zinc-50">` and leaves sections transparent — but in Make Studio, blocks must define their own background so text remains readable regardless of page context or dark mode.

## Card Hover Pattern

Spotlight uses a distinctive hover effect on cards — a background scales up on hover:
```html
<div class="absolute -inset-x-4 -inset-y-6 z-0 scale-95 bg-panel opacity-0 transition group-hover:scale-100 group-hover:opacity-100 sm:-inset-x-6 sm:rounded-2xl"></div>
```

## Converted Components

**Partials:**
- `partials/Button` - Primary/secondary button with link or submit

**Blocks:**
- `blocks/Navbar` - Navigation with avatar pill and centered links
- `blocks/Footer` - Simple centered footer with nav links and copyright
- `blocks/HeroIntro` - Left-aligned hero with headline, description, social icons
- `blocks/PhotoStrip` - Tilted photo gallery strip (5 photos)
- `blocks/Newsletter` - Email signup card with icon
- `blocks/Resume` - Work history card with company logos
- `blocks/ArticlesRecent` - Recent blog posts (compact, for homepage)
- `blocks/ArticlesList` - Full articles listing with dates (for articles page)
- `blocks/ProjectsGrid` - Three-column project cards with logos and links
- `blocks/AboutWithPhoto` - Bio with portrait photo and social links
- `blocks/SpeakingSections` - Grouped speaking appearances
- `blocks/ToolsSections` - Grouped tool/software recommendations
- `blocks/ThankYou` - Simple confirmation/thank-you message

## Page Composition

| Page | Blocks |
|------|--------|
| Home | Navbar → HeroIntro → PhotoStrip → ArticlesRecent → Newsletter → Resume → Footer |
| About | Navbar → AboutWithPhoto → Footer |
| Articles | Navbar → ArticlesList → Footer |
| Projects | Navbar → ProjectsGrid → Footer |
| Speaking | Navbar → SpeakingSections → Footer |
| Uses | Navbar → ToolsSections → Footer |
| Thank You | Navbar → ThankYou → Footer |
