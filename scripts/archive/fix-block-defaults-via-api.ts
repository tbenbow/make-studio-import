/**
 * Fix broken link defaults in the OLD block definitions that pages reference.
 * Uses the Make Studio API (no direct DB writes).
 */
import dotenv from 'dotenv'
dotenv.config()

const BASE = process.env.MAKE_STUDIO_URL!
const TOKEN = process.env.MAKE_STUDIO_TOKEN!
const SITE_ID = process.env.MAKE_STUDIO_SITE!

async function apiRequest(method: string, path: string, body?: any) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`${method} ${path}: ${res.status} ${err.message || ''}`)
  }
  return res.json()
}

// Lesson link fix map
const lessonLinkFixes: Record<string, string> = {
  '/this-too-shall-pass': '/lessons/this-too-shall-pass.html',
  '/the-one-moment': '/lessons/the-one-moment.html',
  '/the-writings-on-the-wall': '/lessons/the-writings-on-the-wall.html',
  '/upside-down-inside-out': '/lessons/upside-down-and-inside-out.html',
  '/needing-getting': '/lessons/needing-getting.html',
  '/all-together-now': '/lessons/all-together-now.html',
  '/this': '/lessons/this.html',
}

async function main() {
  // Get all blocks
  const blocks: any[] = await apiRequest('GET', `/blocks?site_id=${SITE_ID}`)

  // 1. Fix "Lesson Cards" block (69952413cb6e382590893547)
  const lessonCards = blocks.find(b => b._id === '69952413cb6e382590893547')
  if (lessonCards) {
    console.log('=== Fixing Lesson Cards block defaults ===')
    const fields = lessonCards.fields
    let fixes = 0
    for (const field of fields) {
      if (field.type === 'items' && Array.isArray(field.value)) {
        for (const item of field.value) {
          if (item.link && lessonLinkFixes[item.link]) {
            console.log(`  ${item.link} → ${lessonLinkFixes[item.link]}`)
            item.link = lessonLinkFixes[item.link]
            fixes++
          }
        }
      }
    }
    if (fixes > 0) {
      await apiRequest('PATCH', `/blocks/${lessonCards._id}`, { fields })
      console.log(`  Updated ${fixes} links\n`)
    }
  }

  // 2. Fix "Resource Cards" block (69952e20cb6e382590894bb1)
  const resourceCards = blocks.find(b => b._id === '69952e20cb6e382590894bb1')
  if (resourceCards) {
    console.log('=== Fixing Resource Cards block defaults ===')
    const fields = resourceCards.fields
    let fixes = 0
    for (const field of fields) {
      if (field.type === 'items' && Array.isArray(field.value)) {
        for (const item of field.value) {
          if (item.link && !item.link.startsWith('/resources/')) {
            // Extract slug from /{parent}/{slug} format
            const parts = item.link.split('/')
            const slug = parts[parts.length - 1]
            const newLink = `/resources/${slug}.html`
            console.log(`  ${item.link} → ${newLink}`)
            item.link = newLink
            fixes++
          }
        }
      }
    }
    if (fixes > 0) {
      await apiRequest('PATCH', `/blocks/${resourceCards._id}`, { fields })
      console.log(`  Updated ${fixes} links\n`)
    }
  }

  // 3. Fix page-level content across all pages
  console.log('=== Fixing page-level content ===')
  const site = await apiRequest('GET', `/sites/${SITE_ID}`)
  let totalPageFixes = 0

  for (const pageSummary of site.pages) {
    const page = await apiRequest('GET', `/pages/${pageSummary._id}`)
    let pageFixes = 0
    let needsUpdate = false
    const updates: any = {}

    // Fix blocks[].content
    if (Array.isArray(page.blocks)) {
      for (const block of page.blocks) {
        if (!block.content) continue
        const fixCount = fixContentObject(block.content)
        if (fixCount > 0) {
          pageFixes += fixCount
          needsUpdate = true
        }
      }
      if (needsUpdate) updates.blocks = page.blocks
    }

    // Fix page.content (post type pages)
    if (page.content && typeof page.content === 'object' && Object.keys(page.content).length > 0) {
      const fixCount = fixContentObject(page.content)
      if (fixCount > 0) {
        pageFixes += fixCount
        updates.content = page.content
      }
    }

    if (pageFixes > 0) {
      await apiRequest('PATCH', `/pages/${pageSummary._id}`, updates)
      console.log(`  ✓ ${page.name} (${page.slug || '?'}): ${pageFixes} fixes`)
      totalPageFixes += pageFixes
    }
  }

  console.log(`\nTotal page-level fixes: ${totalPageFixes}`)

  // 4. Delete the duplicate new LessonCards block
  const newLessonCards = blocks.find(b => b._id === '69974e5a1dd4931a1404fcf1')
  if (newLessonCards) {
    console.log('\nDeleting duplicate LessonCards block (69974e5a1dd4931a1404fcf1)')
    await apiRequest('DELETE', `/blocks/${newLessonCards._id}`)
    console.log('  Deleted')
  }
}

function fixContentObject(obj: any): number {
  let fixes = 0
  if (!obj || typeof obj !== 'object') return 0

  for (const [key, val] of Object.entries(obj)) {
    const v = val as any
    if (!v) continue

    // Field with value wrapper: { value: ... }
    if (v.value !== undefined) {
      if (typeof v.value === 'string') {
        const fixed = fixLink(v.value)
        if (fixed !== v.value) {
          v.value = fixed
          fixes++
        }
      } else if (Array.isArray(v.value)) {
        for (const item of v.value) {
          if (item && typeof item === 'object') {
            for (const [ik, iv] of Object.entries(item)) {
              if (typeof iv === 'string') {
                const fixed = fixLink(iv as string)
                if (fixed !== iv) {
                  (item as any)[ik] = fixed
                  fixes++
                }
              }
            }
          }
        }
      }
    }
  }
  return fixes
}

function fixLink(val: string): string {
  // Nav link fixes
  const navFixes: Record<string, string> = {
    '/more': '/more.html',
    '/about': '/about.html',
    '/ask-ok-go': '/ask-ok-go.html',
  }
  if (navFixes[val]) return navFixes[val]

  // Lesson link fixes
  if (lessonLinkFixes[val]) return lessonLinkFixes[val]

  // Resource link fixes: /{parent}/{slug} → /resources/{slug}.html
  const resourcePattern = /^\/[a-z-]+\/([a-z0-9-]+)$/
  const match = val.match(resourcePattern)
  if (match && !val.startsWith('/lessons/') && !val.startsWith('/resources/')) {
    return `/resources/${match[1]}.html`
  }

  return val
}

main().catch(e => { console.error(e); process.exit(1) })
