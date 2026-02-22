/**
 * Setup Kylee v2 pages — delete seed pages, set content on Home/About/Writing
 */
import { MakeStudioClient } from '../../src/api.js'

const BASE_URL = 'http://localhost:3001'
const TOKEN = 'mst_0a2cd3c3810e85ec861e35cad11a2052cd894b35e10c64c7cc240279a19911e3'
const SITE_ID = '69980e76869d360ce5b1938b'

const KEEP_PAGES = new Set(['Home', 'About', 'Writing'])

async function main() {
  const client = new MakeStudioClient(BASE_URL, TOKEN)

  // 1. List all pages
  const pages = await client.getPages(SITE_ID)
  console.log(`Found ${pages.length} pages:`)
  for (const p of pages) {
    console.log(`  - ${p.name} (${p._id})`)
  }

  // 2. Delete pages that are NOT Home, About, or Writing
  const toDelete = pages.filter((p: any) => !KEEP_PAGES.has(p.name))
  for (const p of toDelete) {
    console.log(`Deleting page: ${p.name} (${p._id})`)
    await client.deletePage(p._id)
  }
  console.log(`Deleted ${toDelete.length} pages.`)

  // 3. Find the 3 keeper pages
  const remaining = pages.filter((p: any) => KEEP_PAGES.has(p.name))
  const home = remaining.find((p: any) => p.name === 'Home')
  const about = remaining.find((p: any) => p.name === 'About')
  const writing = remaining.find((p: any) => p.name === 'Writing')

  if (!home || !about || !writing) {
    console.error('Missing one of the required pages (Home, About, Writing).')
    process.exit(1)
  }

  // 4. Set content on Home
  console.log(`\nSetting content on Home (${home._id})...`)
  await client.setPageContent(home._id, {
    "Hero": {
      "Headline": "Kylee Leonetti",
      "Subheadline": "Welcome To My Online Writing Sanctuary",
      "Intro": "<p>Have a seat right here next to me, on the chair if the floor is bad for your knees. Let\u2019s talk about everything, plans, ideas and dreams, firm-to-shaky faiths and hard realities; this is the stuff that makes us human, after all. I\u2019ve chewed my cuticles down thinking about my own doubts, so you know yours are safe here with me! Let\u2019s go deep. I\u2019m so glad you\u2019re here.</p>"
    },
    "RecentPosts": {
      "Heading": "Explore My Writing",
      "Posts": [
        {
          "title": "What the Minneapolis Teacher\u2019s Strike Taught Me About Living in Uncertainty",
          "date": "April 16, 2022",
          "excerpt": "It happened last month while I sat surrounded by baskets of unfolded laundry as a warm spring rain poured outside my windows. There was a book open beside me, but also the Netflix tab on my iPad, and a journal on my lap\u2026",
          "category": "Faith, Home Life",
          "url": "/writing",
          "image": ""
        },
        {
          "title": "Pray for Discernment.",
          "date": "February 16, 2022",
          "excerpt": "True to my hibernation inclination, I read four books in January and hardly wrote a word. This month I\u2019ve been back to work, and I will say it feels so good to be serving my clients\u2026",
          "category": "Faith",
          "url": "#",
          "image": ""
        },
        {
          "title": "Write in erasable ink.",
          "date": "January 13, 2022",
          "excerpt": "It\u2019s a new year, but I haven\u2019t felt very ceremonious about it (anyone else?). I\u2019m the same me\u2026and honestly, I\u2019ve been pretty sad\u2026",
          "category": "",
          "url": "#",
          "image": ""
        }
      ],
      "CTA Label": "Read All Posts",
      "CTA Link": "/writing"
    }
  })
  console.log('Home content set.')

  // 5. Set content on About
  console.log(`\nSetting content on About (${about._id})...`)
  await client.setPageContent(about._id, {
    "PageHeader": {
      "Title": "About Me"
    },
    "AboutContent": {
      "Image Alt": "Kylee in her element",
      "Bio": "<p>Hey, I\u2019m Kylee and I write for my fellow seekers, searchers, and skeptics about everyday life through the lens of God\u2019s faithfulness. My style is infused with candid, humorous, and relatable storytelling that invites readers to explore their own life experiences with a fresh perspective.</p><p>Raised as a ministry kid in a midwest megachurch in the nineties, I had to lose my religion to find my way to Jesus. Following the teachings of this guy (deity) who loved beyond labels, included people on the margins, and invited everyone into a new way of being on the basis of belief sparked a newfound faith in me, and that is the place from which I write.</p><p>Writing to those who have lost the faith, those still keeping the faith, and those who aren\u2019t even sure what faith looks like, my work encourages people not to give up and keep growing.</p><p>My passions include creating experiences in words and visuals that provoke deeper thought, provide meaningful connection, and make change possible. I love rallying women, and helping people find a place to belong. I am also a big fan of alliterative prose, but as a Minnesotan I know to use it in moderation, of course.</p><p>Professionally, I stay busy running a film + photo production company with my husband Christian at Kylee and Christian Creative. I am also the founder of GirlCreative, a group for women from all walks of life to connect, create, + collaborate. I am enthusiastic about entrepreneurship and encouraging all people \u2013 especially women \u2013 to follow their creative dreams.</p><p>I live with my family and our three cats near the lakes in Minneapolis, MN, where my teenage daughter Lola is still not embarrassed to be seen with me in public (A GRACE). When I\u2019m not writing you can find me reading, walking, watching movies, or tending to my plants.</p><p>Writing helps me process the world, and I can usually write my way through anything \u2014 right now I\u2019m working on a memoir!</p>"
    }
  })
  console.log('About content set.')

  // 6. Set content on Writing
  console.log(`\nSetting content on Writing (${writing._id})...`)
  await client.setPageContent(writing._id, {
    "PostHeader": {
      "Title": "What the Minneapolis Teacher\u2019s Strike Taught Me About Living in Uncertainty",
      "Category": "Faith, Home Life",
      "Author": "Kylee Leonetti",
      "Date": "April 16, 2022"
    },
    "PostBody": {
      "Body": "<p>It happened last month while I sat surrounded by baskets of unfolded laundry as a warm spring rain poured outside my windows. There was a book open beside me, but also the Netflix tab on my iPad, and a journal on my lap, plus half a dozen little unfinished projects littering my bedroom. It was only Tuesday, but I was completely overwhelmed by the week, and until that moment I could not figure out why. As anxiety bit at my soul, I took it out on my cuticles, producing bleeding little outward signs of the turmoil on my insides.</p><p>I looked at the family calendar hanging empty on the wall. Not only were no meals or activities written in, nothing was, including the concert I had been so geeked about when Christian bought the tickets. In our home, I\u2019m the keeper of the plans: what we do for fun, eat for meals, and spend our money on often comes from a plan I\u2019ve made or instigated, which is something that typically energizes me. But I had no clue how to plan, and my optimism reserves were zapped.</p><p>Those blank calendar squares plus the unfinished to-dos combined with the overwhelming sense that I-can\u2019t-plan-for-anything-because-everything-is-uncertain felt familiar. And for once, instead of asking what the hell is wrong with me, a realization occurred: I\u2019ve been here before.</p><p>I was, yet again, living in uncertainty. And I absolutely hate uncertainty.</p><p>It wasn\u2019t pandemic uncertainty this time, not lost work or school closures due to high rates of illness. It was the Minneapolis Teachers Strike, which kept kids out of classrooms for most of March while educators protested for safer working conditions and better living wages.</p><p>Before I continue I need to say, our family fully supports teachers. We want them to get what they need for their students to succeed. Knowing our stance on the matter didn\u2019t make standing on the shaking ground much easier, though.</p><p>For 21 days in March, everything felt up in the air. And here\u2019s what I learned about myself last month: when uncertainty strikes, I put my entire life on hold.</p><p>I slip back into old routines. I stop washing my face, and start seeing how many days I can go without showering. I abandon the \u201cnighttime devotional\u201d timer that rings on my phone at 9:45 every night and instead, I binge trash tv shows with Lola who abandons her bedtime, all rules flying out the window. I\u2019m tired constantly, and certainly don\u2019t do any writing. I stop keeping up on the activities that fuel my creativity, all of this turning me into a bitter, dirty, exhausted and anxious version of myself I do not recognize.</p><p>This is what uncertainty does to me. When things are out of my control, I just\u2026shut down.</p><p>This is my body\u2019s go-to trauma response, a reactionary leftover from the world shutting down in 2020 when it was what we were all supposed to do for a time. Remember when we thought it would just be for a couple weeks? But now, two years later, I\u2019m finding it hard to not default to shut-down mode whenever I\u2019m confronted by uncertainty.</p><p>I know I\u2019m not alone in that.</p><p>And it\u2019s not our fault.</p><p>Humans as a whole crave control, stability, and predictability. While everyone\u2019s threshold for how much uncertainty is tolerable varies, even the riskiest risk-takers generally like to know what\u2019s going to happen next. We want to be able to plan, to be in the know, so we can anticipate what to expect. When we can\u2019t count on much or when plans start changing, the anxious among us tend to spiral.</p><p>Worrying is how many of us cope with uncertainty.</p><p>But worrying is like sitting in a rocking chair, right? It feels super productive because it keeps us moving, when in reality, we\u2019re not going anywhere. Still I find myself rocking and rocking \u2013 or, scrolling and binging, if you will \u2013 because some kind of activity feels better to my brain than worrying, and waiting, or making plans that might never come to be.</p><p>I feel helpless to make plans in the midst of uncertainty. Feeling helpless triggers a sense of hopelessness in my life, and my pattern is to press pause on the good things God calls me to do so I can have more time to FRET\u2026which is not my fave, nor is it a fruit of the spirit, last time I checked.</p><p>So how do we healthily cope?</p><p>We need hope.</p><p>Hope, in my humble definition, is the belief that things will get better, despite all evidence to the contrary.</p><p>This is not something I\u2019m able to muster on my own; but when I confront my thoughts, considering how God has brought me through worse days and darker nights than these, I can dig deep enough in my soul to access a bit of something that resembles hope.</p><p>Hope brings me to a place where I can say, even when the situation is bleak, I will trust God, because God cares about the details of our lives. I forget that sometimes.</p><p>I remembered God\u2019s particular kind of care when I shared with a friend in my bible study about how, for our family, this strike looked like a minor inconvenience compared to the countless ways others have it worse. I said \u201cit feels so trivial to be concerned with my lack of control when there are actual wars being fought in the world, and lives being lost in my own community to overdoses and diseases\u201d.</p><p>But my friend reminded me that the details of our lives matter deeply to God, so in fact, none of it is trivial. And while I may not be living in a war-torn country or fighting for my life, this has been yet another setback in a two years-long span of living in uncertainty. It\u2019s all valid.</p><p>And it matters to God.</p><p>He\u2019s not only our Father, but our friend.</p><p>Jesus is the only friend who has ever loved us to death.</p><p>It\u2019s not lost on me that I am writing this reflection during Holy Week, specifically what I call Sad Saturday, or the day in between Good Friday and Easter when the world went dark in God\u2019s absence. Talk about living in uncertainty: those thirty-sixish hours in between His death and resurrection were some of the most uncertain in human history. Jesus was dead.</p><p>And unlike His first disciples, we who know the story go into Holy Week knowing the outcome \u2013 Jesus will rise again and make all things new. But without that big-picture vision, the first disciples must have been blindsided by uncertainty, and maybe even feeling a bit ripped off, duped into following a savior who seemingly couldn\u2019t save Himself. Instead, Jesus was murdered before their very eyes. Perhaps they feared they\u2019d be next. How uncertain!</p><p>And yet, they had to trust that the Son of God was who He said He was. It\u2019s hard to fathom how impossible that must have felt.</p><p>We who follow Jesus are His disciples, too. And we are also called to trust, and access the impossible hope that can be found in even the darkest times. As Jesus demonstrated with His very life, death, and resurrection, the God of the Universe holds all our pieces together, even in uncertainty. God cares for us\u2026even/especially when we can\u2019t care for ourselves.</p><p>Our Creator is not exhausted by the details of our lives. And God cares about your details, too.</p><p>In God\u2019s careful hand, there is hope.</p><p>Hope that the worst thing is not the last thing is what the resurrection is all about.</p><p>It\u2019s like the encouragement I once offered a friend when she found out she was pregnant unexpectedly: \u201cyou are being held in the palm of a God-sized hand\u201d. This has got to be true in the midst of my uncertainty, too. That\u2019s my hope, anyway.</p><p>Will I remember, and live like it\u2019s true?</p><p>Will you believe it for yourself, too?</p><p>Throughout every one of those uncertainties, God has sustained me, growing something entirely new in me; and the God I know is faithful to do it again.</p><p>My hope is to remember that.</p><p>In the unknown trials sure to come, I\u2019m praying for a new outlook. Like Holy Saturday begs to question, \u201cWhere is God in this?\u201d I want to ask God earnestly in the face of uncertainty:</p><p>\u201cWhat are You up to, even in this?\u201d</p><p>So on that night last month, in the midst of my overwhelm and in the middle of the Minneapolis teacher\u2019s strike, I stopped chewing my fingers and took a moment in my messy room to breathe and pray.</p><p>Then I decided to take action on what little things I could control: I opened my Bible to where my family\u2019s studying, the words of the prophets and the apostles reminding me how capable God is.</p><p>Next, I folded some \u2013 not all \u2013 of the laundry.</p><p>And after that, I went to bed.</p><p>The next day, I moved ahead on a creative project. I booked a couple meetings, made some moves. Just a few. But enough to feel the progression of things moving forward.</p><p>Overnight, the heavy rains had turned to snow. It didn\u2019t stick, of course \u2013 spring snowfalls rarely do \u2013 but I couldn\u2019t pass up the metaphor that God is making all things new, including this anxious part of me.</p><p>And it is a wild act of hope to keep going when nothing is certain.</p><p>Another night, not too much later, we were all at the dinner table when I surprised myself by saying with a casually confident certainty, \u201cYou know, pretty soon this whole thing will be over\u201d.</p><p>Lola raised her eyebrows. \u201cYou think so?\u201d She asked.</p><p>\u201cI do.\u201d I assured her, believing it was true, feeling my hopes rise like rays of light after the rain.</p><p>Even the smallest amount of light shines bright and clear when everything else is dark and uncertain.</p><p>That\u2019s the beauty of hope.</p><p>Thank goodness \u2014 THANK GOD.</p><p>It took me three weeks of teachers striking and two years of a pandemic for me to finally see the ways I put my life on hold when I\u2019m living in uncertainty, but these sort of realizations rarely happen on my timeline. Still I\u2019m grateful for the ability to reframe my thinking, to point my soul toward hope in the midst of uncertainty.</p><p>If you\u2019re still reading this, here are 5 tangible ways to take care of yourself as you trust God in the midst of uncertainty:</p><ol><li>Make a gratitude list. Write out everything you\u2019re grateful for, and thank God for all of it, every faithful detail.</li><li>BAKE SOMETHING. Truly, even the ready-to-bake dough from the biscuits section works wonders on the soul.</li><li>Stop scrolling. Turn your phone off, if you can. Put it in another room, if you can\u2019t!</li><li>Take a walk to the nearest place where nature can be observed. Watch birds. Listen to the breeze.</li><li>Go to bed as early as possible.</li></ol>",
      "Back Label": "\u2190 Back to Home",
      "Back Link": "/"
    }
  })
  console.log('Writing content set.')

  console.log('\nDone! All 3 pages populated.')
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
