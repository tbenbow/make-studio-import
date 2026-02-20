/**
 * Fix page name typos via the API.
 */
import dotenv from 'dotenv'
dotenv.config()

const BASE = process.env.MAKE_STUDIO_URL!
const TOKEN = process.env.MAKE_STUDIO_TOKEN!

async function api(method: string, path: string, body?: any) {
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
    throw new Error(`${method} ${path}: ${res.status} ${JSON.stringify(err)}`)
  }
  return res.json()
}

const renames = [
  {
    pageId: '69960ed6cb6e38259089ff65',
    currentName: 'All Togehter Now',
    newName: 'All Together Now',
  },
]

async function main() {
  for (const r of renames) {
    const page = await api('GET', `/pages/${r.pageId}`)
    console.log(`Current name: "${page.name}"`)
    if (page.name !== r.currentName) {
      console.log(`  ⚠ Expected "${r.currentName}" but got "${page.name}" - skipping`)
      continue
    }
    await api('PATCH', `/pages/${r.pageId}`, { name: r.newName })
    console.log(`  → Renamed to "${r.newName}"`)
  }
  console.log('\nDone')
}

main().catch(e => { console.error(e); process.exit(1) })
