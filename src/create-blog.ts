import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const SITE_ID = '69865a04b6ff1329e6878d76'

const BLOG_INDEX_TEMPLATE = `<section class="py-16 bg-base">
  <div class="mx-auto w-full max-w-2xl px-6 md:max-w-3xl lg:max-w-7xl lg:px-10 flex flex-col gap-10">
    <div class="flex flex-col gap-2">
      <h1 class="heading-lg text-fg text-pretty">{{headline}}</h1>
      {{#if subheadline}}
        <p class="body-md text-fg-muted text-balance">{{subheadline}}</p>
      {{/if}}
    </div>

    <div class="flex flex-col gap-8">
      <div class="text-fg flex space-x-2" data-posts-filter="category">
        <button class="body-sm font-semibold px-3 py-1.5 rounded-full bg-brand text-on-brand" data-filter-all>All</button>
        {{#each (postFieldValues "blog" "category")}}
          <button class="body-sm font-semibold px-3 py-1.5 rounded-full bg-base-muted text-fg-muted hover:text-fg transition">{{this}}</button>
        {{/each}}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-posts="blog" data-paginate="{{paginate}}" data-per-page="{{posts_per_page}}">
        {{#each (posts "blog")}}
          <a href="{{url}}" class="group flex flex-col gap-4" data-post>
            {{#if photo}}
              <div class="aspect-[3/2] overflow-hidden rounded-lg">
                <img src="{{photo}}" alt="{{title}}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              </div>
            {{/if}}
            <div class="flex flex-col gap-1">
              <span class="body-sm text-fg-muted" data-field="category">{{category}}</span>
              <h3 class="body-lg font-semibold text-fg group-hover:text-brand transition">{{title}}</h3>
              {{#if subheadline}}
                <p class="body-sm text-fg-muted line-clamp-2">{{subheadline}}</p>
              {{/if}}
            </div>
          </a>
        {{/each}}
      </div>
    </div>
  </div>
</section>`

const BLOG_POSTS = [
  { name: 'The Art of Minimal Design', category: 'Design', subheadline: 'Less is more — how constraints lead to better creative work', content: '<h2>Embracing Constraints</h2><p>Minimal design isn\'t about removing things until nothing is left. It\'s about removing things until only the essential remains. Every element must earn its place.</p><h2>The Power of White Space</h2><p>White space isn\'t empty space — it\'s breathing room. It gives your content hierarchy and lets the eye rest between elements. The best minimal designs use space as actively as they use content.</p><h2>Starting Minimal</h2><p>Begin with nothing and add only what\'s necessary. Question every color, every border, every shadow. If removing it doesn\'t break the design, it probably shouldn\'t be there.</p>' },
  { name: 'Building Design Systems That Scale', category: 'Engineering', subheadline: 'Lessons from creating component libraries for growing teams', content: '<h2>Why Design Systems Matter</h2><p>A design system is more than a component library. It\'s a shared language between designers and developers that ensures consistency across every surface of your product.</p><h2>Tokens First</h2><p>Start with design tokens — colors, spacing, typography. These are the atoms of your system. Get them right and everything built on top inherits consistency for free.</p><h2>Document Everything</h2><p>The best design system is one people actually use. That means clear documentation, live examples, and guidelines for when to use each component.</p>' },
  { name: 'On Creative Block', category: 'Process', subheadline: 'Breaking through when inspiration runs dry', content: '<h2>It Happens to Everyone</h2><p>Creative block isn\'t a sign of failure. It\'s a natural part of the creative process. The key is having strategies to work through it rather than waiting for inspiration to strike.</p><h2>Change Your Environment</h2><p>Sometimes all you need is a change of scenery. Work from a different room, take a walk, or visit a museum. New inputs create new outputs.</p><h2>Start Ugly</h2><p>Give yourself permission to create something terrible. The act of making — even making badly — breaks the paralysis of perfectionism.</p>' },
  { name: 'Typography on the Web in 2026', category: 'Design', subheadline: 'Variable fonts, fluid type, and the future of web typography', content: '<h2>Variable Fonts Are the Standard</h2><p>Variable fonts have gone from novelty to necessity. A single font file that covers every weight, width, and style means better performance and more creative freedom.</p><h2>Fluid Typography</h2><p>Using clamp() for font sizes means your type scales smoothly across every viewport. No more jarring jumps between breakpoints.</p><h2>Readability First</h2><p>For all the exciting possibilities, the fundamentals haven\'t changed. Line length, line height, and contrast still matter more than any fancy technique.</p>' },
  { name: 'Why I Switched to Tailwind CSS', category: 'Engineering', subheadline: 'A skeptic\'s journey to utility-first CSS', content: '<h2>Initial Skepticism</h2><p>I resisted Tailwind for years. "Inline styles with extra steps," I\'d say. Then I actually tried it on a real project and everything changed.</p><h2>Speed of Development</h2><p>The biggest win is velocity. No more context-switching between HTML and CSS files. No more naming things. You just describe what you want, right where you want it.</p><h2>Consistency by Default</h2><p>Tailwind\'s constrained design tokens mean your spacing, colors, and typography are consistent without thinking about it. The utility classes are the design system.</p>' },
  { name: 'Designing for Dark Mode', category: 'Design', subheadline: 'More than just inverting colors', content: '<h2>It\'s Not Just Black</h2><p>Good dark mode design uses dark grays, not pure black. Pure black creates too much contrast and causes eye strain. A dark gray surface feels more natural and comfortable.</p><h2>Rethink Your Palette</h2><p>Colors that look great on a light background often need adjustment for dark mode. Saturated colors can feel overwhelming, so consider desaturating slightly.</p><h2>Elevation Through Lightness</h2><p>In dark mode, higher surfaces should be lighter, not darker. This mimics how light naturally works — surfaces closer to you catch more light.</p>' },
  { name: 'Lessons from Five Years of Freelancing', category: 'Career', subheadline: 'What I wish I knew before going independent', content: '<h2>Pricing Is Psychology</h2><p>The hardest lesson was learning to price my work. Charging more often leads to better clients, better projects, and more respect for your time.</p><h2>Systems Over Motivation</h2><p>Motivation is unreliable. Build systems instead. Consistent hours, a dedicated workspace, and a morning routine matter more than feeling inspired.</p><h2>Say No More Often</h2><p>Every project you say yes to means saying no to something else. Be intentional about what you take on. Your best work comes from projects that genuinely excite you.</p>' },
  { name: 'The Case for Server-Side Rendering', category: 'Engineering', subheadline: 'Performance, SEO, and the user experience case for SSR', content: '<h2>First Paint Matters</h2><p>Users form an impression in milliseconds. Server-side rendering gets content on screen immediately, while client-side apps show a blank page or spinner.</p><h2>SEO Without Compromise</h2><p>Search engines have improved at indexing JavaScript, but SSR removes the uncertainty entirely. Your content is in the HTML, ready to be crawled.</p><h2>The Hybrid Approach</h2><p>Modern frameworks let you mix SSR with client-side interactivity. Render the initial page on the server, then hydrate for dynamic behavior. Best of both worlds.</p>' },
  { name: 'Color Theory for Developers', category: 'Design', subheadline: 'A practical guide to choosing colors that work', content: '<h2>Start with One Color</h2><p>Pick your brand color first. Everything else flows from there. Use HSL to create variations — adjust lightness for tints and shades, saturation for muted alternatives.</p><h2>The 60-30-10 Rule</h2><p>60% neutral, 30% secondary, 10% accent. This ratio creates visual harmony without thinking too hard about it. Your accent color should be reserved for actions and highlights.</p><h2>Test for Accessibility</h2><p>Beautiful colors mean nothing if people can\'t read your text. Check contrast ratios early and often. WCAG AA requires at least 4.5:1 for normal text.</p>' },
  { name: 'Accessibility Is Not Optional', category: 'Design', subheadline: 'Building inclusive products from the ground up', content: '<h2>It\'s About People</h2><p>Accessibility isn\'t a checklist or a compliance requirement. It\'s about making sure real people can use what you build. One billion people worldwide live with some form of disability.</p><h2>Start with Semantics</h2><p>Use the right HTML elements. Buttons for actions, links for navigation, headings for hierarchy. Semantic HTML gives you accessibility features for free.</p><h2>Test with Real Users</h2><p>Automated tools catch about 30% of accessibility issues. The rest require manual testing — keyboard navigation, screen reader testing, and ideally, feedback from disabled users.</p>' },
  { name: 'Learning in Public', category: 'Process', subheadline: 'Why sharing your journey accelerates your growth', content: '<h2>Write About What You Learn</h2><p>Teaching is the best way to learn. When you write about a concept, you discover the gaps in your understanding and fill them.</p><h2>It\'s Okay to Be Wrong</h2><p>Sharing work in progress feels vulnerable. But the feedback you get — corrections, suggestions, alternative approaches — is invaluable and free.</p><h2>Build Your Network</h2><p>People who learn in public attract others doing the same. The connections you make through shared learning become your professional network over time.</p>' },
  { name: 'The Underrated Power of CSS Grid', category: 'Engineering', subheadline: 'Going beyond basic layouts with modern CSS', content: '<h2>Beyond 12 Columns</h2><p>CSS Grid freed us from the 12-column mental model. You can create any layout you can imagine — asymmetric, overlapping, responsive — all in pure CSS.</p><h2>Named Grid Areas</h2><p>The grid-template-areas property lets you define layouts visually in your code. It\'s like ASCII art that actually works, and it makes responsive changes trivial.</p><h2>Subgrid Changes Everything</h2><p>Subgrid lets nested elements align to the parent grid. This solves the age-old problem of aligning content across sibling cards without JavaScript.</p>' },
  { name: 'Photographing Your Work', category: 'Process', subheadline: 'Simple tips for better project documentation', content: '<h2>Natural Light Is Your Friend</h2><p>You don\'t need expensive studio lighting. Position your work near a large window for soft, even light. Overcast days are perfect for reducing harsh shadows.</p><h2>Show Context</h2><p>Don\'t just screenshot the final product. Show it in use — on a real device, in a real environment. Context helps people understand the scale and purpose of your work.</p><h2>Consistency Matters</h2><p>Use the same lighting, angles, and editing style across your portfolio. Consistency makes your body of work feel cohesive and professional.</p>' },
  { name: 'Why I Design in the Browser', category: 'Process', subheadline: 'Skipping the mockup phase for faster, better results', content: '<h2>Real Constraints</h2><p>Designing in the browser means working with real typography, real responsive behavior, and real performance from day one. No more "pixel-perfect" mockups that can\'t be built.</p><h2>Faster Iteration</h2><p>Changes are instant and cumulative. No re-exporting, no handoff document, no "it looked different in Figma" conversations.</p><h2>When Mockups Still Make Sense</h2><p>Browser-first doesn\'t mean never mocking up. Complex illustrations, brand explorations, and stakeholder presentations still benefit from design tools.</p>' },
  { name: 'The Psychology of White Space', category: 'Design', subheadline: 'How empty space shapes perception and behavior', content: '<h2>Luxury Loves Space</h2><p>Premium brands use generous white space because it signals confidence. When you don\'t fill every pixel, you\'re saying the content that remains is worth the space around it.</p><h2>Comprehension and Retention</h2><p>Research shows that white space between paragraphs and in margins increases comprehension by up to 20%. Crowded layouts literally make content harder to understand.</p><h2>Guiding Attention</h2><p>White space is a directional tool. Isolate an element with space around it and the eye goes straight there. No arrows or animations needed.</p>' },
  { name: 'Animation with Purpose', category: 'Design', subheadline: 'When motion design helps and when it hurts', content: '<h2>Feedback, Not Decoration</h2><p>The best animations communicate something — a button was pressed, content is loading, an item was added. If your animation doesn\'t answer "what just happened?", reconsider it.</p><h2>Performance Budget</h2><p>Animations should feel effortless. If they cause jank or delay interaction, they\'re hurting the experience. Stick to transform and opacity for smooth 60fps animations.</p><h2>Respect Preferences</h2><p>Always honor prefers-reduced-motion. Some users experience motion sickness from animations. Provide the same information without the movement.</p>' },
  { name: 'Choosing the Right Tech Stack', category: 'Engineering', subheadline: 'A framework for making technology decisions', content: '<h2>Boring Is Good</h2><p>The most productive tech stack is the one your team already knows. New and exciting technologies come with learning curves, immature ecosystems, and unknown failure modes.</p><h2>Optimize for Hiring</h2><p>If you\'re building a team, consider the talent pool. A brilliant but obscure language means a smaller hiring pool and harder onboarding.</p><h2>Reversibility</h2><p>Prefer decisions that are easy to reverse. Microservices can be merged. Monoliths can be split. But a full rewrite in a new language is a multi-year commitment.</p>' },
  { name: 'Client Communication That Works', category: 'Career', subheadline: 'Setting expectations and building trust through clear communication', content: '<h2>Set Expectations Early</h2><p>The first week of a project defines the relationship. Be explicit about timelines, process, communication cadence, and what you need from them.</p><h2>Show, Don\'t Tell</h2><p>Clients struggle with abstract descriptions. Show progress early and often — even rough work. A quick prototype communicates more than a detailed specification.</p><h2>Document Decisions</h2><p>Follow up every call with a brief summary email. This prevents "I thought we agreed on..." conversations later. Written records protect both parties.</p>' },
  { name: 'Responsive Design Beyond Breakpoints', category: 'Engineering', subheadline: 'Container queries, fluid layouts, and intrinsic design', content: '<h2>Container Queries Are Here</h2><p>Components that respond to their container size instead of the viewport solve the reusability problem. A card that works in a sidebar and a full-width grid, automatically.</p><h2>Fluid Everything</h2><p>With clamp(), min(), and max(), you can make spacing, font sizes, and layout dimensions fluid. Fewer breakpoints, smoother transitions, less code.</p><h2>Intrinsic Design</h2><p>Let content determine layout. Use min-content, max-content, and auto-fill to create layouts that adapt to their content rather than arbitrary breakpoints.</p>' },
  { name: 'Finding Inspiration Without Copying', category: 'Process', subheadline: 'How to be influenced by others while staying original', content: '<h2>Collect Widely</h2><p>Look beyond your industry. Architecture, fashion, nature, industrial design — the best ideas come from cross-pollination between disciplines.</p><h2>Analyze, Don\'t Replicate</h2><p>When you see something you love, ask why it works. Is it the color contrast? The rhythm? The hierarchy? Understanding principles transfers better than copying solutions.</p><h2>Transform Through Combination</h2><p>Originality comes from combining existing ideas in new ways. Take the typography approach from one site, the layout philosophy from another, and the color strategy from a third.</p>' },
  { name: 'Performance as a Feature', category: 'Engineering', subheadline: 'Why speed is your most important product feature', content: '<h2>Every Second Counts</h2><p>A one-second delay in page load reduces conversions by 7%. Performance isn\'t a technical concern — it\'s a business concern.</p><h2>Measure What Matters</h2><p>Core Web Vitals give you a framework: LCP for loading, FID for interactivity, CLS for visual stability. Measure these in the field, not just in lab conditions.</p><h2>The Performance Budget</h2><p>Set a budget and enforce it. Total page weight, JavaScript bundle size, time to interactive. Make it part of your CI pipeline so it never silently regresses.</p>' },
  { name: 'The Value of Side Projects', category: 'Career', subheadline: 'Why building things for fun makes you better at your job', content: '<h2>Freedom to Experiment</h2><p>Side projects have no stakeholders, no deadlines, and no requirements. This freedom lets you try technologies and approaches that would be too risky at work.</p><h2>Proof of Curiosity</h2><p>In interviews, side projects demonstrate passion better than any resume bullet point. They show you build things because you love building, not just because you\'re paid to.</p><h2>Unexpected Opportunities</h2><p>Some of the best career opportunities come from side projects. A tool you built for fun might become a product, attract collaborators, or catch the eye of a future employer.</p>' },
  { name: 'Writing Better CSS', category: 'Engineering', subheadline: 'Practical patterns for maintainable stylesheets', content: '<h2>Custom Properties Everywhere</h2><p>CSS custom properties aren\'t just for theming. Use them for component-level configuration, responsive values, and reducing magic numbers.</p><h2>Logical Properties</h2><p>Replace left/right with inline-start/inline-end. Your layouts automatically support RTL languages, and the code better describes its intent.</p><h2>Layer Your Styles</h2><p>CSS @layer gives you explicit control over cascade order. No more specificity wars or !important hacks. Define your layers upfront and styles fall into place.</p>' },
  { name: 'Designing for Content First', category: 'Design', subheadline: 'Why real content should drive your design process', content: '<h2>Lorem Ipsum Lies</h2><p>Placeholder text creates a false sense of order. Real content is messy — names are different lengths, descriptions vary wildly, and edge cases are everywhere.</p><h2>Content Shapes Layout</h2><p>Start with the content you\'ll actually have. Interview stakeholders, audit existing content, and write draft copy before opening your design tool.</p><h2>Design for the Extremes</h2><p>What happens with a one-word title? A 200-word description? An image in portrait orientation? Designing for edge cases first creates more resilient layouts.</p>' },
  { name: 'Reflections on a Decade of Web Design', category: 'Career', subheadline: 'How the industry has changed and what stays the same', content: '<h2>Tools Change, Principles Don\'t</h2><p>I\'ve gone from Photoshop to Sketch to Figma to designing in the browser. The tools don\'t matter as much as understanding hierarchy, typography, and user needs.</p><h2>The Web Got Better</h2><p>CSS Grid, variable fonts, container queries, view transitions. The platform itself is now more capable than most frameworks. The gap between what designers imagine and what browsers can do has nearly closed.</p><h2>Community Matters Most</h2><p>The people I\'ve learned from, collaborated with, and mentored have shaped my career more than any technology or trend. Invest in relationships as much as skills.</p>' }
]

async function main() {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) { console.log('MONGODB_URI not set'); process.exit(1) }

  await mongoose.connect(mongoUri)
  const db = mongoose.connection.db!

  const blocksCol = db.collection('blocks')
  const pagesCol = db.collection('pages')
  const postTypesCol = db.collection('posttypes')
  const sitesCol = db.collection('sites')

  // 1. Get the Content block
  const contentBlock = await blocksCol.findOne({ name: 'Content', site_id: SITE_ID })
  if (!contentBlock) { console.log('Content block not found!'); process.exit(1) }
  console.log(`Content block: ${contentBlock._id}`)

  const contentFields = contentBlock.fields as { id: string; name: string; type: string }[]
  const headlineField = contentFields.find(f => f.name === 'Headline')!
  const eyebrowField = contentFields.find(f => f.name.toLowerCase() === 'eyebrow')!
  const subheadlineField = contentFields.find(f => f.name === 'Subheadline')!
  const contentField = contentFields.find(f => f.name === 'Content')!

  console.log(`  Headline: ${headlineField.id}`)
  console.log(`  eyebrow: ${eyebrowField.id}`)
  console.log(`  Subheadline: ${subheadlineField.id}`)
  console.log(`  Content: ${contentField.id}`)

  // 2. Rename eyebrow -> Category in the Content block
  console.log('\nRenaming eyebrow -> Category...')
  eyebrowField.name = 'Category'
  await blocksCol.updateOne(
    { _id: contentBlock._id },
    { $set: { fields: contentFields } }
  )

  // 3. Update Content block template
  const contentTemplate = contentBlock.template as string
  const newContentTemplate = contentTemplate
    .replace(/\{\{eyebrow\}\}/g, '{{category}}')
    .replace(/\{\{#if eyebrow\}\}/g, '{{#if category}}')
  await blocksCol.updateOne(
    { _id: contentBlock._id },
    { $set: { template: newContentTemplate } }
  )

  // 4. Create Blog Index block
  console.log('Creating Blog Index block...')
  const blogIndexFields = [
    { id: randomUUID(), type: 'text', name: 'headline', value: 'Blog', config: {} },
    { id: randomUUID(), type: 'text', name: 'Subheadline', value: 'Latest posts and thoughts', config: {} },
    { id: randomUUID(), type: 'select', name: 'Paginate', value: 'true', config: {
      selectOptions: [
        { key: 'Yes', value: 'true' },
        { key: 'No', value: 'false' }
      ]
    }},
    { id: randomUUID(), type: 'number', name: 'Posts Per Page', value: 9, config: {} }
  ]

  const blogIndexBlock = await blocksCol.insertOne({
    name: 'Blog Index',
    description: 'Post listing with filters',
    thumbnailType: 'blog-index',
    site_id: SITE_ID,
    template: BLOG_INDEX_TEMPLATE,
    fields: blogIndexFields,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  console.log(`  Blog Index block: ${blogIndexBlock.insertedId}`)

  // Add Blog Index to site's blocks array
  await sitesCol.updateOne(
    { _id: new mongoose.Types.ObjectId(SITE_ID) },
    { $push: { blocks: { _id: blogIndexBlock.insertedId, name: 'Blog Index' } } as any }
  )

  // 5. Create Detail page (template for individual posts)
  console.log('Creating Detail page...')
  const detailPage = await pagesCol.insertOne({
    name: 'Detail',
    site_id: new mongoose.Types.ObjectId(SITE_ID),
    blocks: [{
      id: randomUUID(),
      blockId: contentBlock._id.toString(),
      name: 'Content',
      content: {}
    }],
    content: {},
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date()
  })
  console.log(`  Detail page: ${detailPage.insertedId}`)

  // 6. Create Index page
  console.log('Creating Index page...')
  const indexPage = await pagesCol.insertOne({
    name: 'Index',
    site_id: new mongoose.Types.ObjectId(SITE_ID),
    blocks: [{
      id: randomUUID(),
      blockId: blogIndexBlock.insertedId.toString(),
      name: 'Blog Index',
      content: {}
    }],
    content: {},
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date()
  })
  console.log(`  Index page: ${indexPage.insertedId}`)

  // 7. Create 25 blog posts
  console.log('\nCreating 25 blog posts...')
  const postIds: string[] = []

  for (const post of BLOG_POSTS) {
    const postPage = await pagesCol.insertOne({
      name: post.name,
      site_id: new mongoose.Types.ObjectId(SITE_ID),
      postTypeId: null, // Will be set after PostType is created
      blocks: [],
      content: {
        [contentBlock._id.toString()]: {
          [headlineField.id]: { value: post.name },
          [eyebrowField.id]: { value: post.category },
          [subheadlineField.id]: { value: post.subheadline },
          [contentField.id]: { value: post.content }
        }
      },
      settings: {
        title: post.name
      },
      createdAt: new Date(),
      updatedAt: new Date()
    })
    postIds.push(postPage.insertedId.toString())
    console.log(`  ${post.name} (${post.category})`)
  }

  // 8. Create PostType
  console.log('\nCreating Blog post type...')
  const postType = await postTypesCol.insertOne({
    name: 'Blog',
    site_id: SITE_ID,
    detailPageId: detailPage.insertedId.toString(),
    postIds,
    indexPageId: indexPage.insertedId.toString()
  })
  console.log(`  PostType: ${postType.insertedId}`)

  // 9. Update posts with postTypeId
  const postObjectIds = postIds.map(id => new mongoose.Types.ObjectId(id))
  await pagesCol.updateMany(
    { _id: { $in: postObjectIds } },
    { $set: { postTypeId: postType.insertedId } }
  )

  console.log('\nDone!')
  console.log(`  Blog Index block: ${blogIndexBlock.insertedId}`)
  console.log(`  Detail page: ${detailPage.insertedId}`)
  console.log(`  Index page: ${indexPage.insertedId}`)
  console.log(`  PostType: ${postType.insertedId}`)
  console.log(`  Posts created: ${postIds.length}`)

  await mongoose.disconnect()
}

main().catch(console.error)
