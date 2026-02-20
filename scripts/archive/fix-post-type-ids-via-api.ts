/**
 * Fix resource pages: set postTypeId via the API so Mongoose casts it to ObjectId.
 */
import dotenv from 'dotenv'
dotenv.config()

const BASE = process.env.MAKE_STUDIO_URL!
const TOKEN = process.env.MAKE_STUDIO_TOKEN!
const SITE_ID = process.env.MAKE_STUDIO_SITE!
const POST_TYPE_ID = '69960f5fcb6e3825908a004f'

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

// Resource page IDs (from our diagnostic — all pages with postTypeId as string)
const resourcePageIds = [
  '6996160f5c1f48ab0bad5091', // Chain Reaction Machines
  '699618d0c59fc5d98d8508f4', // Making "This Too Shall Pass"
  '699618d0c59fc5d98d8508f5', // Hit the Note
  '699618d0c59fc5d98d8508f6', // Simple Machines Scavenger Hunt
  '699618d0c59fc5d98d8508f7', // Making "The One Moment"
  '699618d0c59fc5d98d8508f8', // The One Moment of Math
  '699618d0c59fc5d98d8508f9', // Timing Is Everything
  '699618d0c59fc5d98d8508fa', // Flip Book Challenge
  '699618d0c59fc5d98d8508fb', // Illusions
  '699618d0c59fc5d98d8508fc', // Cube
  '699618d0c59fc5d98d8508fd', // Triangle
  '699618d0c59fc5d98d8508fe', // Anamorphic
  '699618d0c59fc5d98d8508ff', // The Camera
  '699618d0c59fc5d98d850900', // Tim's Face
  '699618d0c59fc5d98d850901', // The Finale
  '699618d0c59fc5d98d850902', // Making Upside Down & Inside Out
  '699618d0c59fc5d98d850903', // How Parabolas Work
  '699618d0c59fc5d98d850904', // Art in Microgravity
  '699618d0c59fc5d98d850905', // Art of Experimentation
  '699618d0c59fc5d98d850906', // Making "Needing/Getting"
  '699618d0c59fc5d98d850907', // Surrounding Sounds
  '699618d0c59fc5d98d850908', // Art Together Now
  '699618d0c59fc5d98d850909', // Spin Art
  '699618d0c59fc5d98d85090a', // Art of Circular Motion
]

async function main() {
  console.log(`Fixing postTypeId on ${resourcePageIds.length} resource pages\n`)

  let fixed = 0
  for (const pageId of resourcePageIds) {
    try {
      const page = await apiRequest('GET', `/pages/${pageId}`)
      await apiRequest('PATCH', `/pages/${pageId}`, { postTypeId: POST_TYPE_ID })
      console.log(`  ✓ ${page.name}`)
      fixed++
    } catch (err: any) {
      console.log(`  ✗ ${pageId}: ${err.message}`)
    }
  }

  console.log(`\nFixed ${fixed}/${resourcePageIds.length} pages`)
}

main().catch(e => { console.error(e); process.exit(1) })
