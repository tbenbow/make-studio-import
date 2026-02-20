/**
 * Import WordPress posts into a Make Studio post type.
 *
 * Usage:
 *   npx tsx scripts/import-wp-posts.ts \
 *     --wp-url=https://kyleeleonetti.com \
 *     --theme=kyleeleonetti \
 *     [--dry-run]
 *
 * Reads the WP REST API, downloads images, creates post pages via the Make Studio API,
 * and populates block content (PostHeader + PostBody) with the post data.
 */

import dotenv from 'dotenv'
import path from 'path'
import { MakeStudioClient } from '../src/api.js'

dotenv.config({ path: path.join(import.meta.dirname, '..', '.env') })

// ─── Args ───
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, ...rest] = a.slice(2).split('=')
      return [k, rest.join('=') || 'true']
    })
)

const wpUrl = args['wp-url']
const themeName = args['theme']
const dryRun = args['dry-run'] === 'true'

if (!wpUrl || !themeName) {
  console.error('Usage: npx tsx scripts/import-wp-posts.ts --wp-url=<url> --theme=<name> [--dry-run]')
  process.exit(1)
}

const baseUrl = process.env.MAKE_STUDIO_URL!
const token = process.env.MAKE_STUDIO_TOKEN!
const siteId = process.env.MAKE_STUDIO_SITE!
const client = new MakeStudioClient(baseUrl, token)

// ─── WP Helpers ───

interface WPPost {
  id: number
  slug: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  date: string
  categories: number[]
  featured_media: number
  _embedded?: { 'wp:featuredmedia'?: Array<{ source_url: string }> }
}

interface WPCategory {
  id: number
  name: string
}

async function wpFetch<T>(endpoint: string): Promise<T> {
  const url = `${wpUrl}/wp-json/wp/v2${endpoint}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
  })
  if (!res.ok) throw new Error(`WP API ${res.status}: ${url}`)
  return res.json() as Promise<T>
}

async function getAllPosts(): Promise<WPPost[]> {
  const allPosts: WPPost[] = []
  let page = 1
  while (true) {
    const batch = await wpFetch<WPPost[]>(`/posts?per_page=100&page=${page}&_embed`)
    allPosts.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return allPosts
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#8230;/g, '\u2026')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function stripWpCruft(html: string): string {
  return html
    // Remove WordPress figure/figcaption wrappers but keep images
    .replace(/<figure[^>]*>/gi, '')
    .replace(/<\/figure>/gi, '')
    // Remove WordPress-specific classes
    .replace(/ class="wp-[^"]*"/gi, '')
    .replace(/ class="has-[^"]*"/gi, '')
    // Remove empty paragraphs
    .replace(/<p>\s*<\/p>/gi, '')
    // Remove inline styles
    .replace(/ style="[^"]*"/gi, '')
    // Trim
    .trim()
}

// ─── Main ───

async function main() {
  console.log(`Fetching posts from ${wpUrl}...`)

  const [posts, categories] = await Promise.all([
    getAllPosts(),
    wpFetch<WPCategory[]>('/categories?per_page=100')
  ])

  const catMap = new Map(categories.map(c => [c.id, c.name]))
  console.log(`Found ${posts.length} posts, ${categories.length} categories`)

  if (dryRun) {
    for (const post of posts) {
      const cats = post.categories.map(id => catMap.get(id)).filter(Boolean).join(', ')
      console.log(`  ${post.slug} | ${decodeHtmlEntities(post.title.rendered)} | ${formatDate(post.date)} | ${cats}`)
    }
    console.log('\nDry run — no changes made.')
    return
  }

  // Get post type and layout
  const [postTypes, layouts] = await Promise.all([
    client.getPostTypes(siteId),
    client.getLayouts(siteId)
  ])

  const writingPT = postTypes.find(pt => pt.name === 'Writing')
  if (!writingPT) {
    console.error('No "Writing" post type found. Create it first.')
    process.exit(1)
  }

  const defaultLayout = layouts.find(l => l.isDefault)

  // Get existing post pages so we can skip duplicates
  const existingPages = await client.getPages(siteId)
  const existingNames = new Set(existingPages.map(p => p.name))

  // Sort posts oldest-first so they appear in chronological order
  posts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let created = 0
  let skipped = 0

  for (const post of posts) {
    const title = decodeHtmlEntities(post.title.rendered)
    const cats = post.categories
      .map(id => catMap.get(id))
      .filter(c => c && c !== 'Uncategorized')
      .join(', ')
    const date = formatDate(post.date)
    const body = stripWpCruft(post.content.rendered)

    const pageName = title.length > 100 ? title.slice(0, 97) + '...' : title
    if (existingNames.has(pageName)) {
      console.log(`  Skip (exists): ${title}`)
      skipped++
      continue
    }

    console.log(`  Creating: ${title}`)

    // Create the post page
    const page = await client.createPage({
      name: pageName,
      site_id: siteId,
      postTypeId: writingPT._id,
      settings: {
        layoutId: defaultLayout?._id,
        slug: post.slug
      }
    } as any)

    // Set content using block/field names — server resolves UUIDs and instance IDs
    await client.setPageContent(page._id, {
      PostHeader: {
        Title: title,
        Category: cats,
        Author: 'Kylee Leonetti',
        Date: date
      },
      PostBody: {
        Body: body,
        'Back Label': '\u2190 Back to Writing',
        'Back Link': '/writing'
      }
    })

    created++
  }

  console.log(`\nDone: ${created} posts created, ${skipped} skipped.`)
}

main().catch(e => {
  console.error('Fatal:', e.message)
  process.exit(1)
})
