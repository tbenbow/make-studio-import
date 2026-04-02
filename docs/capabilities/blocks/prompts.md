# Block Generation Prompts

Layout-focused prompts for the app's block generator. Each prompt targets a distinct layout pattern. Keep them open-ended enough that the generator can make creative choices about styling, color, and detail.

## Conventions

Append these instructions to every prompt sent to the generator:

> Use the `{{> Button}}` partial for all buttons (never inline button HTML). Use `card card-{style}` classes for card elements — styles: `flat`, `bordered`, `elevated`, `filled`, `glass`. Include a `Background` select field as the last field with options: base, base-muted, base-alt, panel, brand, fg. Apply it as `bg-{{background}}` on the outer section element.

## Available Libraries

These are available globally on every page — use them freely in prompts:

- **Alpine.js** — reactive state, toggles, tabs, accordions, dropdowns, modals, show/hide, transitions. Use `x-data`, `x-show`, `x-on`, `x-transition`, etc.
- **Embla Carousel** — lightweight carousel/slider. Use for testimonial sliders, image carousels, logo tickers, product galleries, and any horizontal scrolling content.

## Testimonials

1. Single centered pull quote with author avatar, name, and role. Large quotation marks. Lots of whitespace.
2. Three testimonial cards in a row. Each card has a star rating, quote, and author with avatar.
3. One large featured testimonial taking two-thirds width, two smaller ones stacked in the remaining third.
4. A single testimonial displayed at a time with dot navigation. Dark background, light text, company logo above the quote.
5. Masonry grid of six or more short testimonials at varying lengths, like a wall of tweets. Avatars and names only.
6. Video testimonial block — large video thumbnail with play button, pull quote underneath, author and company logo.
7. Testimonial paired with a large highlighted metric number. Quote explains the result, stat makes it scannable.
8. Row of company logos along the top, featured quote below from one of the companies. Minimal and corporate.
9. Two-column split — oversized quotation mark and quote text on the left, author photo with name and short bio on the right.
10. Rating summary header (average score, star bar, review count) with three individual review cards below.

## Heroes

1. Full-bleed background image with centered headline, subtext, and two buttons. Text over a dark overlay.
2. Split half — headline and body text on the left, large product screenshot on the right. CTA button below the text.
3. Centered headline with an animated gradient background. Subheadline and a single call-to-action. No image.
4. Video background hero with bold white headline, short tagline, and a play button to watch the full video.
5. Hero with a product screenshot floating in a device mockup, headline above, trust logos in a row below.
6. Stacked centered — small eyebrow tag, large headline, paragraph, two buttons, then a full-width screenshot below.
7. Asymmetric layout — text block offset to the left with a rotated or overlapping image collage on the right.
8. Minimal hero with just a single large headline, one line of body text, and an email capture input with button.
9. Split hero with a colored background on one half and a photo on the other. Text overlays the colored side.
10. Hero with headline, subtext, and a row of three small feature callouts with icons beneath the CTA.

## Features

1. Three-column icon grid. Each cell has an icon, heading, and short description. Clean and even.
2. Alternating rows — image left / text right, then image right / text left. Two or three rows.
3. Large centered heading with a tabbed interface below. Each tab reveals a different feature with image and text.
4. Bento grid layout — one large feature card spanning two rows, surrounded by smaller feature cards.
5. Single feature spotlight — big screenshot on one side, heading, description, and bullet list on the other.
6. Feature comparison — two columns (e.g., "without us" vs. "with us") showing the contrast. Visual and punchy.
7. Numbered steps. Three or four steps in a horizontal row, connected by a line or arrows. Icon, title, description.
8. Features with a vertical sidebar navigation on the left and the feature detail area on the right.
9. Icon grid with hover cards — a tight grid of icons that expand into detail cards on interaction.
10. Centered heading, then a two-row grid of six features. Each has a small illustration, bold title, and one-liner.

## CTAs

1. Full-width banner with bold headline, short body text, and a single prominent button. Solid brand color background.
2. Split CTA — left side has text and button, right side has a relevant photo or illustration.
3. CTA with an email signup form — headline, subtext, and an inline input field with submit button.
4. Minimal centered CTA — just a headline question and a button. Tons of whitespace.
5. CTA card floating over a full-width background image. Card has headline, text, and button.
6. Two-option CTA — side-by-side cards, each with a different plan or path and its own button.
7. CTA with social proof — headline and button on top, row of avatars and "Join 10,000+ users" below.
8. Dark-mode CTA with a gradient background, large headline, and a glowing button.
9. CTA with a countdown or urgency element — headline, timer or "limited spots" badge, and button.
10. Stacked CTA — small eyebrow text, large headline, paragraph, button, then a trust badge row underneath.

## Pricing

1. Three-column pricing table. Each column has a plan name, price, feature list, and CTA button. Middle plan highlighted.
2. Two-tier toggle — monthly vs. annual toggle at the top, two plan cards below.
3. Single plan spotlight — one large card with price, feature list, and button. "Most popular" badge. No comparison.
4. Comparison table — features listed as rows, plans as columns, checkmarks and x marks in cells.
5. Pricing cards with a free tier on the left, fading to premium on the right. Progressive feature reveals.
6. Enterprise-focused pricing — two public plans and a third "Contact us" card with custom pricing.
7. Minimal pricing — headline, single price in large text, short bullet list, and button. No cards.
8. Pricing with testimonial — pricing cards on top, a relevant customer quote pinned below.
9. Horizontal pricing — plans arranged in a single row of compact cards, each with price and top three features only.
10. Feature-grouped pricing — features organized into categories (basics, advanced, premium) with plan coverage shown.

## Stats

1. Four big numbers in a row — each with a large stat, label, and optional icon. Simple and bold.
2. Stats over a background image — three or four key metrics with a dark overlay behind the numbers.
3. Two-column — large descriptive paragraph on the left, three stacked stats on the right.
4. Stats with progress bars or radial progress indicators for each metric.
5. Single hero stat — one massive number centered, with a headline above and context below.
6. Stats ticker — horizontal scrolling or animated row of stats with labels.
7. Stats inside cards — three cards, each with an icon, stat, label, and a short supporting sentence.
8. Before/after stats — two columns showing "then" and "now" with contrasting numbers.
9. Stats with a background pattern or subtle grid. Numbers arranged in an offset two-row layout.
10. Logo bar with stats — company logos above, then key metrics below showing combined impact.

## FAQs

1. Classic accordion — list of questions that expand to show answers on click. Clean dividers between items.
2. Two-column FAQ — questions and answers split across two columns to reduce vertical scrolling.
3. FAQ with categories — tabbed or segmented nav at top (General, Billing, Technical), filtered list below.
4. FAQ with a sidebar — category links on the left, scrollable Q&A list on the right.
5. Minimal FAQ — simple list of questions with inline answers, no accordion. All visible at once.
6. FAQ with a search bar at the top. Full list below, filterable by keyword.
7. FAQ with a contact CTA at the bottom — "Still have questions? Reach out."
8. Card-based FAQ — each Q&A is its own card in a grid layout. Two or three columns.
9. FAQ with icons — each question has a small relevant icon to the left of the question text.
10. Split FAQ — big heading and description on the left, accordion list on the right.

## Footers

1. Four-column footer — logo and tagline in the first column, three columns of nav links. Copyright bar below.
2. Minimal centered footer — logo, one row of links, social icons, copyright. All centered.
3. Two-column footer — newsletter signup on the left, nav links on the right. Dark background.
4. Big footer — large heading ("Ready to get started?") with CTA button, then link columns and copyright below.
5. Footer with a sitemap feel — many columns of categorized links, fine print, and legal links at the bottom.
6. Compact single-row footer — logo left, key links center, social icons right. One line.
7. Footer with app download badges — link columns plus iOS/Android store buttons.
8. Dark gradient footer — logo, links in two columns, social icons, and a subtle background pattern.
9. Footer with a newsletter form — email input and subscribe button prominently placed above the link columns.
10. Mega footer — top section with logo, description, and contact info, then three-column links, then copyright bar.

## Navbars

1. Logo on the left, nav links center, CTA button on the right. Clean and standard.
2. Logo left, nav links right, no button. Minimal.
3. Transparent navbar overlaying a hero — logo and links in white, blending with the hero image.
4. Navbar with a dropdown mega menu — top-level links that expand into rich panels with columns.
5. Centered logo navbar — links split evenly on either side of a centered logo.
6. Sticky navbar that changes from transparent to solid background on scroll.
7. Navbar with a top announcement bar — colored bar with a dismissible message above the main nav.
8. Dark navbar — dark background, light text, logo left, links and button right.
9. Navbar with search — logo left, nav links center, search icon and button right.
10. Minimal navbar — just logo left and a hamburger menu icon right, even on desktop.

## Content / Blog

1. Three-column blog card grid — image, category tag, title, excerpt, author avatar and date.
2. Featured post hero — large image with title overlay, then a grid of smaller post cards below.
3. List layout — each post is a horizontal row: thumbnail left, title and excerpt right, date far right.
4. Magazine layout — one large featured post spanning full width, four smaller posts in a 2x2 grid beside or below.
5. Minimal blog list — no images, just titles, dates, and short excerpts. Clean and text-focused.
6. Blog with sidebar — post grid on the left, category list and newsletter signup on the right.
7. Card grid with category filter tabs along the top. Click a tab to filter visible posts.
8. Single-column centered blog — each post card is full-width, stacked vertically, with large images.
9. Blog with author focus — author card at top with photo and bio, their posts listed below.
10. Timeline blog layout — posts arranged along a vertical timeline with dates as markers.

## Team

1. Three-column card grid — photo, name, role, and social links on each card.
2. Two-row grid with larger cards — photo, name, role, and a short bio paragraph.
3. Single row with circular avatar photos, names, and roles beneath. Compact.
4. Featured team member spotlight — one large card with photo, bio, and links. Grid of others below.
5. Team with department filters — tabs for Engineering, Design, Marketing. Filtered card grid.
6. Minimal team list — no photos, just names, roles, and one-line bios in a clean list.
7. Team with hover effect — photos shown normally, hovering reveals name, role, and social links.
8. Alternating team rows — photo left / text right, then photo right / text left for each member.
9. Small circular avatars in a cluster or overlapping row, with a count ("Meet our 20+ team members") and a CTA.
10. Card grid where each card has a colored background that matches the brand, with a cutout photo and details.

## Logos / Trust

1. Single row of grayscale client logos, evenly spaced. Simple heading above.
2. Logo marquee — continuously scrolling horizontal row of logos. No heading.
3. Two rows of logos — staggered or evenly distributed, with a "Trusted by" heading.
4. Logos inside cards or rounded rectangles — grid of logo badges on a contrasting background.
5. Logo wall — large grid of many logos (12+), tightly packed, with a short description above.

## Newsletter

1. Centered card with heading, subtext, and an email input with button. Floating over a subtle background.
2. Full-width banner — bold heading left, email input and button right. Single-row layout.
3. Newsletter with a small image or illustration beside the form. Two-column split.
4. Minimal inline — just a heading and an input/button row. No card, no background. Ultra-clean.
5. Newsletter with social proof — signup form plus "Join 5,000+ subscribers" and a row of avatars.

## 404 / Error

1. Centered "404" in huge display text, with a heading, short message, and a "Go home" button below.
2. 404 with an illustration or fun graphic. Playful tone, heading, message, and button.
3. Minimal 404 — just the number, one sentence, and a link back home. Nothing else.
4. 404 with search — "Page not found" heading, a search input, and suggested links below.
5. Split 404 — illustration on one side, message and navigation options on the other.

## Gallery / Portfolio

1. Three-column image grid with lightbox — click to expand. Caption and category tag on each.
2. Masonry layout with mixed aspect ratios. Images fill naturally, no cropping. Hover reveals title.
3. Filterable gallery — category tabs along the top, grid of thumbnails below that filters on click.
4. Full-width carousel — one large image at a time with arrow navigation and thumbnail strip below.
5. Portfolio case study cards — image, project title, client name, and a short description. Two-column grid.
6. Before/after slider — two images with a draggable divider to compare. Label on each side.
7. Fullscreen hero gallery — large background image that cycles, with a small caption and dot navigation in the corner.
8. Grid with alternating large and small tiles — one image spans two columns, the next two are single column. Repeating pattern.
9. Minimal portfolio list — project name, year, and category in a clean table-like layout. Image appears on hover.
10. Stacked full-width images — each project is a full-width image with title and description overlaid at the bottom.

## Contact

1. Split layout — contact form on the left, address, phone, email, and map on the right.
2. Centered contact form — heading, subtext, name/email/message fields, and a submit button. Simple card.
3. Three contact method cards in a row — email, phone, location — each with an icon, label, and value.
4. Contact with office locations — a grid of office cards, each with city, address, phone, and a small map image.
5. Minimal contact — just an email address in large text, a short sentence, and a link. Nothing else.
6. Full-width map background with a floating contact form card overlaid on top.
7. Contact with department routing — tabs or buttons for Sales, Support, General. Each shows different contact info and form.
8. Two-column — large heading and a short paragraph on the left, compact form on the right.

## Banners / Announcements

1. Top announcement bar — colored background, short text, and a link. Dismissible with an X button.
2. Full-width promo banner — bold headline, discount code or offer, and a CTA button. Eye-catching background.
3. Cookie consent bar — fixed to bottom, short privacy message, accept and settings buttons.
4. App download banner — "Get the app" message with iOS and Android badge buttons. Dismissible.
5. Maintenance / status banner — warning-colored bar with an icon, status message, and a link to a status page.
6. Split announcement — text on the left, countdown timer or date on the right. Event or launch focused.
7. Floating notification card — small card in the corner with an icon, message, and action button. Non-intrusive.
8. Gradient banner with animated text — scrolling or typing headline with a CTA. Attention-grabbing.

## How It Works / Process

1. Three numbered steps in a horizontal row, connected by a dashed line. Icon, title, and description per step.
2. Vertical timeline — steps stacked vertically with alternating left/right content and a connecting line down the center.
3. Large numbered cards — big number in the background, title and description in the foreground. Three or four columns.
4. Icon journey — a winding path connecting step icons, with labels and short descriptions at each stop.
5. Tabbed process — each tab is a step. Click to see a detailed description and image for that step.
6. Minimal steps — just three short sentences with bold step numbers. No cards, no icons. Ultra-clean.
7. Split process — steps listed on the left with a large illustration or screenshot on the right that changes per step.
8. Circular diagram — steps arranged in a circle or semi-circle with arrows connecting them. Visual and compact.
9. Accordion process — each step is an expandable row. Click to reveal details, image, and a CTA.
10. Before/during/after — three columns showing the state at each phase. Visual contrast between them.

## Events / Schedule

1. Upcoming event hero — large event image, title, date, location, and a registration button.
2. Event card grid — three or four event cards with image, date badge, title, location, and a link.
3. Agenda timeline — vertical schedule with time slots on the left, session titles and speakers on the right.
4. Speaker grid — photo, name, title, and talk topic on each card. Three or four columns.
5. Single event countdown — large countdown timer (days/hours/minutes), event name, date, and CTA.
6. Calendar-style list — events grouped by month with date, title, and location on each row.
7. Featured event + upcoming list — one large hero event at the top, a compact list of future events below.
8. Multi-track schedule — tabbed or columned view with parallel tracks (e.g., Track A, Track B). Time-based rows.

## Comparison

1. Side-by-side two-column — "Us vs. Them" with feature rows and check/x icons in each column.
2. Before/after split — left column shows the old way (problems), right column shows the new way (solutions). Visual contrast.
3. Product comparison table — three or four products as columns, feature rows with values or checkmarks.
4. Stacked comparison cards — each card shows a plan or option with key differentiators highlighted.
5. Toggle comparison — a switch to flip between two views (e.g., monthly/annual, basic/pro) with the details updating.
6. Visual comparison — two side-by-side screenshots or images with annotated callouts pointing out differences.

## Carousels / Sliders (Embla)

1. Testimonial slider — one quote visible at a time, avatar and name below, dot navigation. Auto-advances.
2. Image carousel with thumbnails — large main image, row of clickable thumbnails below. Arrows on the main image.
3. Logo ticker — continuous auto-scrolling row of logos. No controls, infinite loop.
4. Card carousel — three cards visible at once, arrows to scroll. Partial next card peeking at the edge.
5. Full-width hero slider — full-bleed images with text overlay, auto-advancing with progress bar or dots.
6. Product gallery — main image with left/right arrows, thumbnail strip that scrolls in sync.
7. Multi-row carousel — two rows of cards that scroll together. Good for large collections.
8. Centered carousel — active slide is larger and centered, adjacent slides are smaller and faded.

## Tabs / Interactive (Alpine.js)

1. Feature tabs — horizontal tab bar, each tab reveals an image and description below. Smooth transition.
2. Vertical tabs — tab labels stacked on the left, content panel on the right. Desktop-focused.
3. Accordion — expandable rows with plus/minus toggle. Only one open at a time.
4. Multi-open accordion — same as above but multiple can be open simultaneously.
5. Modal / lightbox trigger — a grid of cards where clicking opens a modal with full details.
6. Toggle content — a switch that flips between two states (e.g., monthly/annual pricing, grid/list view).
7. Dropdown filter — select dropdown that filters visible cards by category. Smooth show/hide transitions.
8. Tabbed cards — each tab shows a different set of cards (e.g., Popular, Recent, Featured).
9. Expandable text — "Read more" truncation that expands to show full content on click.
10. Notification dismiss — a banner or card with a close button that smoothly removes it from the page.
