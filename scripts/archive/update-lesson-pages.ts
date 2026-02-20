import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

// Scraped lesson data (cleaned video URLs, about text, poster images)
const lessons = [
  {
    pageId: '69960e8bcb6e38259089febd',
    slug: 'the-one-moment',
    title: 'The One Moment',
    videoUrl: 'https://www.youtube.com/embed/QvW61K2s0tA?rel=0&modestbranding=1',
    posterImage: 'https://okgosandbox.org/videos/the-one-moment/poster-t1m@2x.jpg',
    aboutHeading: 'About the Music Video',
    aboutText: '<p>This video was actually shot in 4 seconds, but when played back in slow motion, it stays in sync with the music. How did they do it?! A lot of time, and a lot of math. Created by OK Go in collaboration with Morton Salt.</p>',
    resourceImages: {
      'making-the-one-moment': 'https://okgosandbox.org/resources/making-the-one-moment/poster-mt1m.jpg',
      'the-one-moment-of-math': 'https://okgosandbox.org/resources/the-one-moment-of-math/poster-t1mom.jpg',
      'timing-is-everything': 'https://okgosandbox.org/resources/timing-is-everything/poster-timing.jpg',
      'flip-book-challenge': 'https://okgosandbox.org/resources/flip-book-challenge/poster-flip.jpg',
    },
  },
  {
    pageId: '69960e9dcb6e38259089fee7',
    slug: 'the-writings-on-the-wall',
    title: "The Writing's On The Wall",
    videoUrl: 'https://www.youtube.com/embed/m86ae_e_ptU?rel=0&modestbranding=1',
    posterImage: 'https://okgosandbox.org/videos/the-writings-on-the-wall/poster-twotw@2x.jpg',
    aboutHeading: 'About the Music Video',
    aboutText: "<p>Everything is not what it seems in this video! See how OK Go used art and perspective to trick your brain into seeing something that isn't actually there.</p>",
    resourceImages: {
      'illusions': 'https://okgosandbox.org/resources/illusions/poster-illusions.jpg',
      'cube': 'https://okgosandbox.org/resources/cube/poster-cube.jpg',
      'triangle': 'https://okgosandbox.org/resources/triangle/poster-triangle.jpg',
      'anamorphic': 'https://okgosandbox.org/resources/anamorphic/poster-anamorphic.jpg',
      'the-camera': 'https://okgosandbox.org/resources/the-camera/poster-camera.jpg',
      'tims-face': 'https://okgosandbox.org/resources/tims-face/poster-tf.jpg',
      'finale': 'https://okgosandbox.org/resources/finale/poster-finale.jpg',
    },
  },
  {
    pageId: '69960eb9cb6e38259089ff11',
    slug: 'upside-down-inside-out',
    title: 'Upside Down & Inside Out',
    videoUrl: 'https://www.youtube.com/embed/LWGJA9i18Co?rel=0&modestbranding=1',
    posterImage: 'https://okgosandbox.org/videos/upside-down-inside-out/poster-udio@2x.jpg',
    aboutHeading: 'About the Music Video',
    aboutText: '<p>Making this video took OK Go to new heights in learning! Through the joy of experimentation, they learned how the rules of physics apply in microgravity (everything floats!) and how to create art in that space (everything floats!).</p>',
    resourceImages: {
      'making-upside-down-inside-out': 'https://okgosandbox.org/resources/making-upside-down-inside-out/poster-making-udio.jpg',
      'how-parabolas-work': 'https://okgosandbox.org/resources/the-parabolic-effect/poster-parabolic-effect.jpg',
      'art-in-microgravity': 'https://okgosandbox.org/resources/art-in-microgravity/poster-microgravity.jpg',
      'art-of-experimentation': 'https://okgosandbox.org/resources/art-of-experimentation/poster-experimentation.jpg',
    },
  },
  {
    pageId: '69960ecacb6e38259089ff3b',
    slug: 'needing-getting',
    title: 'Needing/Getting',
    videoUrl: 'https://www.youtube.com/embed/MejbOFk7H6c?rel=0&modestbranding=1',
    posterImage: 'https://okgosandbox.org/videos/needing-getting/poster-ng@2x.jpg',
    aboutHeading: 'About the Music Video',
    aboutText: '<p>OK Go wanted to find out if they could play their song using a car and everyday objects. Turns out they could!... by stunt driving a car with various attachments along a winding two mile track, as it strikes over 1000 instruments in sequence, creating each note of the song.</p>',
    resourceImages: {
      'making-needing-getting': 'https://okgosandbox.org/resources/making-needing-getting/poster-mng.jpg',
      'surrounding-sounds': 'https://okgosandbox.org/resources/surrounding-sounds/poster-surrounding.jpg',
    },
  },
  {
    pageId: '69960ed6cb6e38259089ff65',
    slug: 'all-together-now',
    title: 'All Together Now',
    videoUrl: 'https://www.youtube.com/embed/a5j50F4rlzA?rel=0&modestbranding=1',
    posterImage: 'https://okgosandbox.org/videos/all-together-now/poster-together@2x.jpg',
    aboutHeading: 'About the Music Video',
    aboutText: '<p>Inspired by virtual togetherness during the COVID-19 pandemic, OK Go worked together (apart) to create this music video, ending with a special tribute to our frontline healthcare workers.</p>',
    resourceImages: {
      'art-together-now': 'https://okgosandbox.org/resources/art-together-now/art_together_now_still.jpg',
    },
  },
  {
    pageId: '69960ee4cb6e38259089ff8f',
    slug: 'this',
    title: 'This',
    videoUrl: 'https://www.youtube.com/embed/RM3U6zUKRhY?rel=0&modestbranding=1',
    posterImage: 'https://okgosandbox.org/videos/this/this_thumbnail.jpg',
    aboutHeading: 'About the Music Video',
    aboutText: "<p>It doesn't get better than this! OK Go created this visualizer using a pottery wheel and a lot of paint, proving that learning can sometimes be messy (and that's OK!).</p>",
    resourceImages: {
      'spin-art': 'https://okgosandbox.org/resources/spin-art/this_bts_thumbnail.jpg',
      'circular-motion': 'https://okgosandbox.org/resources/spin-art/this_bts_thumbnail.jpg',
    },
  },
]

// Resource data from our scrape (for building ResourceCards items)
const allResources = [
  { parentSlug: '/this-too-shall-pass', title: 'Making "This Too Shall Pass"', slug: 'making-this-too-shall-pass', description: 'From collaborating with engineers, to the lengthy testing process and many attempts it took to finally get it shot, OK Go tell the story of how "This Too Shall Pass" came to pass.' },
  { parentSlug: '/this-too-shall-pass', title: 'Chain Reaction Machines', slug: 'chain-reaction-machines', description: 'This challenge will engage students in recognizing different simple machines and creating their own in a chain reaction machine, using the engineering design process to explore forces and motion.' },
  { parentSlug: '/this-too-shall-pass', title: 'Hit the Note', slug: 'hit-the-note', description: 'Inspired by the tuned glasses in the music video, students will learn about pitch and musical notes through a science inquiry activity, then play a song of their choice by tuning cups.' },
  { parentSlug: '/this-too-shall-pass', title: 'Simple Machines Scavenger Hunt', slug: 'simple-machines-scavenger-hunt', description: 'A chain reaction machine is a series of simple machines \u2014 one after the next. We challenge students to discover the simple machines in OK Go\'s videos.' },
  { parentSlug: '/the-one-moment', title: 'Making "The One Moment"', slug: 'making-the-one-moment', description: 'OK Go discuss how bursting salt, crashing balls, flying paint and some serious calculations can make a really amazing music video.' },
  { parentSlug: '/the-one-moment', title: 'The One Moment of Math', slug: 'the-one-moment-of-math', description: 'Lead singer Damian Kulash makes spreadsheets cool again, as he explains the math and basic physics required to create the music video.' },
  { parentSlug: '/the-one-moment', title: 'Timing Is Everything', slug: 'timing-is-everything', description: 'In this challenge, students will explore the impact gravity has on objects of different sizes and masses by dropping objects from a consistent height and recording their falls.' },
  { parentSlug: '/the-one-moment', title: 'Flip Book Challenge', slug: 'flip-book-challenge', description: 'Inspired by the two flip books used in "The One Moment" video, this exercise will challenge students to create their own flip book. Creating a flip book includes telling a story using art and design.' },
  { parentSlug: '/the-writings-on-the-wall', title: 'Illusions', slug: 'illusions', description: 'OK Go discusses the brain processes behind optical illusions to give us an understanding of how we are able to see things that aren\'t really there.' },
  { parentSlug: '/the-writings-on-the-wall', title: 'Cube', slug: 'cube', description: 'In this challenge, students will develop their understanding of optical illusions and explore how to create illusions like those in "The Writing\'s On the Wall" music video by making a geometric shape inside of a shoebox.' },
  { parentSlug: '/the-writings-on-the-wall', title: 'Triangle', slug: 'triangle', description: 'This challenge engages students by making a project that encourages students to create their own small-scale optical illusion: an accordion fold.' },
  { parentSlug: '/the-writings-on-the-wall', title: 'Behind-The-Scenes: Anamorphic Illusions', slug: 'anamorphic', description: 'Lead singer Damian Kulash describes anamorphism and how anamorphic illusions were created in the music video for "The Writing\'s On the Wall."' },
  { parentSlug: '/the-writings-on-the-wall', title: 'Behind-The-Scenes: The Camera', slug: 'the-camera', description: 'This video provides a closer look into the creation of the camera and the camera movements that helped make "The Writing\'s On the Wall" music video possible.' },
  { parentSlug: '/the-writings-on-the-wall', title: 'Behind-The-Scenes: Tim\'s Face', slug: 'tims-face', description: 'Bassist Tim Nordwind explains how they created the illusion of his face out of a collection of objects in the music video for "The Writing\'s On the Wall."' },
  { parentSlug: '/the-writings-on-the-wall', title: 'Behind-The-Scenes: The Finale', slug: 'finale', description: 'Art director Hannah Alpert describes the process of creating the final image of "The Writing\'s On the Wall" music video.' },
  { parentSlug: '/upside-down-inside-out', title: 'Making Upside Down & Inside Out', slug: 'making-upside-down-inside-out', description: 'OK Go dives right in to answering the questions everyone is asking. How were they weightless? What did it feel like? And how did they do it for an entire song?' },
  { parentSlug: '/upside-down-inside-out', title: 'How Parabolas Work', slug: 'how-parabolas-work', description: 'OK Go explains what a parabola is and why is it so important for the creation of this video. (Hint: Microgravity)' },
  { parentSlug: '/upside-down-inside-out', title: 'Art in Microgravity', slug: 'art-in-microgravity', description: 'OK Go explores the rarely explored challenge creating art in microgravity. How? through play, experimentation and trial and error!' },
  { parentSlug: '/upside-down-inside-out', title: 'Art of Experimentation', slug: 'art-of-experimentation', description: 'Now you try! The band will show you how to use fluid dynamics and color to experiment and create art!' },
  { parentSlug: '/needing-getting', title: 'Making "Needing/\u200BGetting"', slug: 'making-needing-getting', description: 'OK Go discusses a car as a musical instrument, finding everyday objects that make music and the engineering behind the giant race track they use to play the song.' },
  { parentSlug: '/needing-getting', title: 'Surrounding Sounds', slug: 'surrounding-sounds', description: 'This challenge is designed to encourage students to discover the musical qualities of various everyday objects and put them to use in making music. The world is full of sounds to explore. Anything can be a musical instrument with a little bit of creativity!' },
  { parentSlug: '/all-together-now', title: 'Art Together Now', slug: 'art-together-now', description: 'We challenge you to create a collaborative piece of art that shows your gratitude to someone in your community. Download the document for more details!' },
  { parentSlug: '/this', title: 'Spin Art', slug: 'spin-art', description: 'In this challenge, students will learn how different choices affect art by making spin art projects and understanding how to control the process.' },
  { parentSlug: '/this', title: 'Art of Circular Motion', slug: 'circular-motion', description: 'In this challenge, students will learn about the processes of uniform circular motion by exploring the process of creating spin art.' },
]

async function main() {
  await mongoose.connect('mongodb://localhost:27017/webstir')
  const db = mongoose.connection.db
  if (db == null) throw new Error('No db')

  const siteId = '69952211cb6e382590893367'

  // Get all blocks
  const blocks = await db.collection('blocks').find({ site_id: siteId }).toArray()
  console.log('Found blocks:', blocks.map(b => b.name).join(', '))
  const blockMap = new Map(blocks.map(b => [b.name, b]))

  // Helper: build content keyed by field UUIDs
  function buildContent(block: any, values: Record<string, any>) {
    const content: Record<string, { value: any }> = {}
    for (const field of (block.fields || [])) {
      const key = field.name.toLowerCase().replace(/\s+/g, '-')
      if (values[key] !== undefined) {
        content[field.id] = { value: values[key] }
      } else if (field.value !== undefined) {
        content[field.id] = { value: field.value }
      }
    }
    return content
  }

  const navbar = blockMap.get('Navbar')
  const videoHero = blockMap.get('VideoHero')
  const resourceCards = blockMap.get('ResourceCards')
  const footer = blockMap.get('Footer')

  if (navbar == null || videoHero == null || resourceCards == null || footer == null) {
    const missing = [
      navbar == null && 'Navbar',
      videoHero == null && 'VideoHero',
      resourceCards == null && 'ResourceCards',
      footer == null && 'Footer',
    ].filter(Boolean)
    throw new Error('Missing blocks: ' + missing.join(', '))
  }

  // Get resource posts so we can link them
  const postType = await db.collection('posttypes').findOne({ site_id: siteId })
  if (postType == null) throw new Error('No post type')

  const resourcePosts = await db.collection('pages').find({
    postTypeId: postType._id,
  }).toArray()
  console.log('Found resource posts:', resourcePosts.length)

  // Map slug → post for linking
  const postBySlug = new Map(resourcePosts.map(p => [p.slug, p]))

  // Shared Navbar content
  const navbarContent = buildContent(navbar, {
    'cta-label': 'Filter Resources',
    'cta-link': '#',
    'email': 'hello@okgosandbox.org',
    'nav-links': [
      { id: uuidv4(), label: 'Home', url: '/' },
      { id: uuidv4(), label: 'Lessons', url: '/lessons' },
      { id: uuidv4(), label: 'More', url: '/more' },
      { id: uuidv4(), label: 'About', url: '/about' },
      { id: uuidv4(), label: 'Ask Ok Go', url: '/ask-ok-go' },
    ],
  })

  // Shared Footer content
  const footerContent = buildContent(footer, {
    'sponsors-label': 'Sponsored By:',
    'copyright': '\u00a9 2026 OK Go Sandbox',
    'fineprint': '<p>OK Go Sandbox Challenges by the <a href="https://playfullearninglab.org">Playful Learning Lab</a> at the <a href="https://stthomas.edu">University of St. Thomas</a> is licensed under a <a href="http://creativecommons.org/licenses/by-nc/4.0/">Creative Commons Attribution-NonCommercial 4.0 International License</a>.</p>',
    'colophon': '<p>A collaboration between <a href="https://okgo.net">OK Go</a> and the <a href="https://playfullearninglab.org">Playful Learning Lab</a> at the <a href="https://stthomas.edu">University of St. Thomas</a></p>',
    'sponsors': [
      { id: uuidv4(), name: 'Google', link: 'https://google.com' },
      { id: uuidv4(), name: 'Morton Salt', link: 'https://mortonsalt.com' },
      { id: uuidv4(), name: 'Cognizant', link: 'https://cognizant.com' },
    ],
    'social-links': [
      { id: uuidv4(), label: 'Instagram', icon: 'instagram-logo', url: 'https://instagram.com/okgosandbox' },
      { id: uuidv4(), label: 'Facebook', icon: 'facebook-logo', url: 'https://facebook.com/OKGoSandbox' },
      { id: uuidv4(), label: 'Twitter', icon: 'twitter-logo', url: 'https://twitter.com/OKGoSandbox' },
    ],
  })

  for (const lesson of lessons) {
    // Build resource card items for this lesson
    const lessonResources = allResources.filter(r => r.parentSlug === '/' + lesson.slug)
    const resourceItems = lessonResources.map(r => {
      const post = postBySlug.get(r.slug)
      return {
        id: uuidv4(),
        image: lesson.resourceImages[r.slug as keyof typeof lesson.resourceImages] || '',
        'image-alt': r.title,
        title: r.title,
        description: r.description,
        link: `/resources/${r.slug}.html`,
        tags: '',
      }
    })

    const pageBlocks = [
      {
        id: uuidv4(),
        blockId: navbar._id.toString(),
        name: 'Navbar',
        description: navbar.description || '',
        content: navbarContent,
      },
      {
        id: uuidv4(),
        blockId: videoHero._id.toString(),
        name: 'VideoHero',
        description: videoHero.description || '',
        content: buildContent(videoHero, {
          'title': lesson.title,
          'video-url': lesson.videoUrl,
          'image': lesson.posterImage,
          'image-alt': lesson.title + ' music video poster',
          'illustration': '',
          'illustration-alt': '',
          'about-heading': lesson.aboutHeading,
          'about-text': lesson.aboutText,
        }),
      },
      {
        id: uuidv4(),
        blockId: resourceCards._id.toString(),
        name: 'ResourceCards',
        description: resourceCards.description || '',
        content: buildContent(resourceCards, {
          'items': resourceItems,
        }),
      },
      {
        id: uuidv4(),
        blockId: footer._id.toString(),
        name: 'Footer',
        description: footer.description || '',
        content: footerContent,
      },
    ]

    const result = await db.collection('pages').updateOne(
      { _id: new mongoose.Types.ObjectId(lesson.pageId) },
      {
        $set: {
          blocks: pageBlocks,
          slug: lesson.slug,
          updatedAt: new Date(),
        },
      }
    )

    console.log(`Updated "${lesson.title}" (${lesson.pageId}): ${result.modifiedCount} doc, ${resourceItems.length} resources`)
  }

  await mongoose.disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
