/**
 * Fix select field values on resource posts.
 * Select fields store the entry VALUE (slug string), not the entry ID.
 */
import dotenv from 'dotenv'
dotenv.config()

const BASE = process.env.MAKE_STUDIO_URL!
const TOKEN = process.env.MAKE_STUDIO_TOKEN!
const SITE_ID = process.env.MAKE_STUDIO_SITE!

const DETAIL_BLOCK_ID = '699548e6cb6e382590895b1b'
const MUSIC_VIDEO_FIELD = '46251d5e-3ba7-43d6-b832-af494801edcb'
const SUBJECTS_FIELD = 'e74ea5a6-dc5f-41d0-b48a-58fadb9f77cc'
const GRADE_LEVEL_FIELD = '2b53cdc7-cd12-4657-9b08-95367546b5fd'

// Values are the slugs from the data store entries
const resourceMeta: Record<string, { musicVideo: string; subject: string; grade: string }> = {
  'Chain Reaction Machines':          { musicVideo: 'this-too-shall-pass',      subject: 'engineering',             grade: '3-5' },
  'Making "This Too Shall Pass"':     { musicVideo: 'this-too-shall-pass',      subject: 'engineering',             grade: '3-5' },
  'Hit the Note':                     { musicVideo: 'this-too-shall-pass',      subject: 'math',                    grade: 'k-2' },
  'Simple Machines Scavenger Hunt':   { musicVideo: 'this-too-shall-pass',      subject: 'engineering',             grade: '3-5' },
  'Making "The One Moment"':          { musicVideo: 'the-one-moment',           subject: 'math',                    grade: '3-5' },
  'The One Moment of Math':           { musicVideo: 'the-one-moment',           subject: 'math',                    grade: '9-12' },
  'Timing Is Everything':             { musicVideo: 'the-one-moment',           subject: 'physics',                 grade: 'k-2' },
  'Flip Book Challenge':              { musicVideo: 'the-one-moment',           subject: 'arts',                    grade: 'k-2' },
  'Illusions':                        { musicVideo: 'the-writings-on-the-wall', subject: 'arts',                    grade: '6-8' },
  'Cube':                             { musicVideo: 'the-writings-on-the-wall', subject: 'arts',                    grade: 'k-2' },
  'Triangle':                         { musicVideo: 'the-writings-on-the-wall', subject: 'arts',                    grade: 'k-2' },
  'Anamorphic':                       { musicVideo: 'the-writings-on-the-wall', subject: 'arts',                    grade: '3-5' },
  'The Camera':                       { musicVideo: 'the-writings-on-the-wall', subject: 'arts',                    grade: '6-8' },
  'Tims Face':                        { musicVideo: 'the-writings-on-the-wall', subject: 'arts',                    grade: '3-5' },
  'Finale':                           { musicVideo: 'the-writings-on-the-wall', subject: 'arts',                    grade: '3-5' },
  'Making Upside Down & Inside Out':  { musicVideo: 'upside-down-inside-out',   subject: 'science',                 grade: '6-8' },
  'How Parabolas Work':               { musicVideo: 'upside-down-inside-out',   subject: 'math',                    grade: '3-5' },
  'Art in Microgravity':              { musicVideo: 'upside-down-inside-out',   subject: 'arts',                    grade: '3-5' },
  'Art of Experimentation':           { musicVideo: 'upside-down-inside-out',   subject: 'science',                 grade: '3-5' },
  'Making Needing Getting':           { musicVideo: 'needinggetting',           subject: 'engineering',             grade: '3-5' },
  'Surrounding Sounds':               { musicVideo: 'needinggetting',           subject: 'physics',                 grade: '3-5' },
  'Art Together Now':                 { musicVideo: 'all-together-now',         subject: 'arts',                    grade: '3-5' },
  'Spin Art':                         { musicVideo: 'this',                     subject: 'artistic-control',        grade: '3-5' },
  'Circular Motion':                  { musicVideo: 'this',                     subject: 'uniform-circular-motion', grade: '3-5' },
}

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

async function main() {
  const site = await api('GET', `/sites/${SITE_ID}`)
  let updated = 0

  for (const p of site.pages) {
    const page = await api('GET', `/pages/${p._id}`)
    if (!page.postTypeId) continue

    const meta = resourceMeta[page.name]
    if (!meta) { console.log(`  ? No metadata for "${page.name}"`); continue }

    const blockContent = page.content?.[DETAIL_BLOCK_ID] || {}
    const updatedBlockContent = {
      ...blockContent,
      [MUSIC_VIDEO_FIELD]: { value: meta.musicVideo },
      [SUBJECTS_FIELD]: { value: meta.subject },
      [GRADE_LEVEL_FIELD]: { value: meta.grade },
    }

    const updatedContent = {
      ...page.content,
      [DETAIL_BLOCK_ID]: updatedBlockContent,
    }

    await api('PATCH', `/pages/${page._id}`, { content: updatedContent })
    console.log(`  ✓ ${page.name}: ${meta.musicVideo} | ${meta.subject} | ${meta.grade}`)
    updated++
  }

  console.log(`\nDone: ${updated} updated`)
}

main().catch(e => { console.error(e); process.exit(1) })
