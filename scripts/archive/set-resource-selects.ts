/**
 * Set Music Video, Subject, and Grade Level select fields on each resource post.
 * Values come from the original okgosandbox.org site.
 * For multi-value fields, we pick the first one (select only supports single).
 */
import dotenv from 'dotenv'
dotenv.config()

const BASE = process.env.MAKE_STUDIO_URL!
const TOKEN = process.env.MAKE_STUDIO_TOKEN!
const SITE_ID = process.env.MAKE_STUDIO_SITE!

const DETAIL_BLOCK_ID = '699548e6cb6e382590895b1b'

// Field IDs on the Resource block
const MUSIC_VIDEO_FIELD = '46251d5e-3ba7-43d6-b832-af494801edcb'
const SUBJECTS_FIELD = 'e74ea5a6-dc5f-41d0-b48a-58fadb9f77cc'
const GRADE_LEVEL_FIELD = '2b53cdc7-cd12-4657-9b08-95367546b5fd'

// Data store: Music Videos (6996388c1a153506bd4085fe)
const musicVideos: Record<string, string> = {
  'This Too Shall Pass': 'f62c9258-3f04-44b5-b151-3d389d840596',
  'The One Moment': 'c0a4efcf-4a7a-4597-b399-17a5cf341d45',
  "The Writing's On The Wall": '274e8e0d-6552-4736-a6c7-70e598a50d3e',
  'Upside Down & Inside Out': '1bb547a1-a15b-4748-b9bd-714c20ce70ad',
  'Needing/Getting': '0ef8103e-f33f-4b12-a680-50d05de62cae',
  'All Together Now': '475d7a3b-5d8f-459d-8d68-28c31c4705d1',
  'This': '5049d159-4c23-4843-9570-abe51a90a4ef',
}

// Data store: Subjects (6996389cff22adb3652d8366)
const subjects: Record<string, string> = {
  'Acceleration': 'bb8eba9d-6dfb-43c7-9fdc-f30c543f8ae0',
  'Artistic Control': '296710c5-abde-4fde-8bfd-7058c3152ec9',
  'Arts': '45ae77e6-f74f-4fc6-aa04-68a7d31a588b',
  'Design Process': '5387280b-0b2d-42ca-8d26-99efca7a4c6d',
  'Engineering': '577504a1-3f24-4123-9ad4-fb356453eb3b',
  'Force': 'dd133cd0-8ead-4a84-a93e-60b74afa25ab',
  'Math': '106b97c1-77ff-4ee4-8b8a-e4d7388da749',
  'Music': '737f7680-3ba3-4a32-9321-2a704105e4f5',
  'Physics': '34ae76f0-5dcb-435d-9300-463a7389f9f8',
  'Science': 'af54af1a-6a7d-4c32-b83a-1c7694334384',
  'Uniform Circular Motion': '607ef5ac-9272-45f3-813c-0fb43f3953bb',
  'Velocity': '7ee08d31-3074-4dac-a504-062bce7de71b',
  'Viscosity': '55066223-9319-4fa4-8f60-95c9607ffafa',
}

// Data store: Grade Level (699638a5e38fe6395deb6b24)
const gradeLevels: Record<string, string> = {
  'K-2': '35d684ac-8ba6-40e4-92ee-2427fb3fafdf',
  '3-5': 'e30d07a4-bbe6-4280-bcf1-50c4ddf9009a',
  '6-8': '8fc98806-2664-4fa5-9237-ca47a67a370c',
  '9-12': 'b2f1b1ed-9963-40b7-88a9-23b4b777d957',
}

// Resource metadata from the original site
// music video is inferred from breadcrumb label
// subject = first subject tag, grade = first grade level tag
const resourceMeta: Record<string, { musicVideo: string; subject: string; grade: string }> = {
  // This Too Shall Pass resources
  'Chain Reaction Machines': {
    musicVideo: 'This Too Shall Pass',
    subject: 'Engineering',
    grade: '3-5',
  },
  'Making "This Too Shall Pass"': {
    musicVideo: 'This Too Shall Pass',
    subject: 'Engineering',
    grade: '3-5',  // not specified on card, using reasonable default
  },
  'Hit the Note': {
    musicVideo: 'This Too Shall Pass',
    subject: 'Math',
    grade: 'K-2',
  },
  'Simple Machines Scavenger Hunt': {
    musicVideo: 'This Too Shall Pass',
    subject: 'Engineering',
    grade: '3-5',
  },

  // The One Moment resources
  'Making "The One Moment"': {
    musicVideo: 'The One Moment',
    subject: 'Math',
    grade: '3-5',
  },
  'The One Moment of Math': {
    musicVideo: 'The One Moment',
    subject: 'Math',
    grade: '9-12',
  },
  'Timing Is Everything': {
    musicVideo: 'The One Moment',
    subject: 'Physics',
    grade: 'K-2',
  },
  'Flip Book Challenge': {
    musicVideo: 'The One Moment',
    subject: 'Arts',
    grade: 'K-2',
  },

  // The Writing's On The Wall resources
  'Illusions': {
    musicVideo: "The Writing's On The Wall",
    subject: 'Arts',
    grade: '6-8',
  },
  'Cube': {
    musicVideo: "The Writing's On The Wall",
    subject: 'Arts',
    grade: 'K-2',
  },
  'Triangle': {
    musicVideo: "The Writing's On The Wall",
    subject: 'Arts',
    grade: 'K-2',
  },
  'Anamorphic': {
    musicVideo: "The Writing's On The Wall",
    subject: 'Arts',
    grade: '3-5',
  },
  'The Camera': {
    musicVideo: "The Writing's On The Wall",
    subject: 'Arts',
    grade: '6-8',
  },
  'Tims Face': {
    musicVideo: "The Writing's On The Wall",
    subject: 'Arts',
    grade: '3-5',
  },
  'Finale': {
    musicVideo: "The Writing's On The Wall",
    subject: 'Arts',
    grade: '3-5',
  },

  // Upside Down & Inside Out resources
  'Making Upside Down & Inside Out': {
    musicVideo: 'Upside Down & Inside Out',
    subject: 'Science',
    grade: '6-8',
  },
  'How Parabolas Work': {
    musicVideo: 'Upside Down & Inside Out',
    subject: 'Math',
    grade: '3-5',
  },
  'Art in Microgravity': {
    musicVideo: 'Upside Down & Inside Out',
    subject: 'Arts',
    grade: '3-5',  // not specified, reasonable default
  },
  'Art of Experimentation': {
    musicVideo: 'Upside Down & Inside Out',
    subject: 'Science',
    grade: '3-5',
  },

  // Needing/Getting resources
  'Making Needing Getting': {
    musicVideo: 'Needing/Getting',
    subject: 'Engineering',
    grade: '3-5',  // not specified, reasonable default
  },
  'Surrounding Sounds': {
    musicVideo: 'Needing/Getting',
    subject: 'Physics',
    grade: '3-5',  // not specified, reasonable default
  },

  // All Together Now resources
  'Art Together Now': {
    musicVideo: 'All Together Now',
    subject: 'Arts',
    grade: '3-5',
  },

  // This resources
  'Spin Art': {
    musicVideo: 'This',
    subject: 'Artistic Control',
    grade: '3-5',
  },
  'Circular Motion': {
    musicVideo: 'This',
    subject: 'Uniform Circular Motion',
    grade: '3-5',
  },
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
  let skipped = 0

  for (const p of site.pages) {
    const page = await api('GET', `/pages/${p._id}`)
    if (!page.postTypeId) continue

    const meta = resourceMeta[page.name]
    if (!meta) {
      console.log(`  ? No metadata for "${page.name}"`)
      skipped++
      continue
    }

    const mvId = musicVideos[meta.musicVideo]
    const subId = subjects[meta.subject]
    const grId = gradeLevels[meta.grade]

    if (!mvId) { console.log(`  ✗ Unknown music video: "${meta.musicVideo}"`); skipped++; continue }
    if (!subId) { console.log(`  ✗ Unknown subject: "${meta.subject}"`); skipped++; continue }
    if (!grId) { console.log(`  ✗ Unknown grade: "${meta.grade}"`); skipped++; continue }

    // Update the content
    const blockContent = page.content?.[DETAIL_BLOCK_ID] || {}
    const updatedBlockContent = {
      ...blockContent,
      [MUSIC_VIDEO_FIELD]: { value: mvId },
      [SUBJECTS_FIELD]: { value: subId },
      [GRADE_LEVEL_FIELD]: { value: grId },
    }

    const updatedContent = {
      ...page.content,
      [DETAIL_BLOCK_ID]: updatedBlockContent,
    }

    await api('PATCH', `/pages/${page._id}`, { content: updatedContent })
    console.log(`  ✓ ${page.name}: ${meta.musicVideo} | ${meta.subject} | ${meta.grade}`)
    updated++
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`)
}

main().catch(e => { console.error(e); process.exit(1) })
