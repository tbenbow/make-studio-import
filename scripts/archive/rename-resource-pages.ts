/**
 * Rename 6 resource pages via the API so their names produce correct URL slugs.
 * The deployment derives slugs using: name → lowercase → strip non-alphanumeric → hyphens
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

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

// Pages that need renaming: current name → new name
// New name must produce the slug used in our links
const renames: { currentName: string; newName: string; expectedSlug: string }[] = [
  {
    currentName: 'Behind-The-Scenes: Anamorphic Illusions',
    newName: 'Anamorphic',
    expectedSlug: 'anamorphic',
  },
  {
    currentName: 'Behind-The-Scenes: The Camera',
    newName: 'The Camera',
    expectedSlug: 'the-camera',
  },
  {
    currentName: "Behind-The-Scenes: Tim's Face",
    newName: 'Tims Face',
    expectedSlug: 'tims-face',
  },
  {
    currentName: 'Behind-The-Scenes: The Finale',
    newName: 'Finale',
    expectedSlug: 'finale',
  },
  {
    // Smart quotes + slash + zero-width space
    currentName: 'Making \u201cNeeding/\u200bGetting\u201d',
    newName: 'Making Needing Getting',
    expectedSlug: 'making-needing-getting',
  },
  {
    currentName: 'Art of Circular Motion',
    newName: 'Circular Motion',
    expectedSlug: 'circular-motion',
  },
]

async function main() {
  // Get all pages
  const site = await apiRequest('GET', `/sites/${SITE_ID}`)
  console.log(`Site has ${site.pages.length} pages\n`)

  for (const rename of renames) {
    // Find the page by name
    let found = false
    for (const pageSummary of site.pages) {
      const page = await apiRequest('GET', `/pages/${pageSummary._id}`)
      if (page.name === rename.currentName) {
        const newSlug = slugify(rename.newName)
        console.log(`  "${rename.currentName}" → "${rename.newName}" (slug: ${newSlug})`)
        if (newSlug !== rename.expectedSlug) {
          console.log(`    ⚠ SLUG MISMATCH: expected "${rename.expectedSlug}", got "${newSlug}"`)
        }
        await apiRequest('PATCH', `/pages/${pageSummary._id}`, { name: rename.newName })
        console.log(`    ✓ Renamed`)
        found = true
        break
      }
    }
    if (!found) {
      console.log(`  ✗ Not found: "${rename.currentName}"`)
    }
  }

  console.log('\nDone')
}

main().catch(e => { console.error(e); process.exit(1) })
