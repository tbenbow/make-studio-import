import { MakeStudioClient } from '../src/api'
import dotenv from 'dotenv'
dotenv.config()

const client = new MakeStudioClient(process.env.MAKE_STUDIO_URL, process.env.MAKE_STUDIO_TOKEN)
const siteId = process.env.MAKE_STUDIO_SITE

async function main() {
  // Find the Index page
  const pages = await client.getPages(siteId)
  const indexPage = pages.find(p => p.name === 'Index')
  if (!indexPage) throw new Error('Index page not found')
  console.log('Setting content on page:', indexPage.name, indexPage._id)

  await client.setPageContent(indexPage._id, {
    Navbar: {
      "Logo Text": "Concierge",
      "Logo Link": "/",
      Links: [
        { label: "How it works", link: "#how" },
        { label: "Pricing", link: "#pricing" },
        { label: "About", link: "#about" },
        { label: "Get started", link: "#contact" }
      ]
    },
    Hero: {
      Kicker: "A website service by Jamey & Tom",
      Headline: "<p>Your website,<br><em>built live.</em><br>Two hours.<br>Five hundred bucks.</p>",
      Subheadline: "We show up, we build together, you leave with a real website. No long timelines. No mystery. Just two people who've been doing this for 25 years, focused entirely on you.",
      "CTA Label": "See how it works",
      "CTA Link": "#pricing",
      Stats: [
        { value: "2 hrs", label: "From nothing to live" },
        { value: "$500", label: "Flat rate, no surprises" },
        { value: "50 yrs", label: "Combined experience" }
      ]
    },
    WhoItsFor: {
      Label: "Who this is for",
      Intro: "<p>Simple websites for people who need to get on with it.</p><p><em>Not everyone needs a $10,000 website.</em> Most people just need something great, up fast, and easy to update.</p>",
      Tags: [
        { label: "Bands" },
        { label: "Photographers" },
        { label: "Coffee shops" },
        { label: "Therapists" },
        { label: "Consultants" },
        { label: "Artists" },
        { label: "Small businesses" },
        { label: "Freelancers" },
        { label: "Restaurants" },
        { label: "Yoga studios" }
      ],
      Body: "<p>If your website has a small scope and you want it done right, Concierge is built for you. You need a professional, good-looking site. You don't have a lot of time or money to throw at it. And you need to be able to update it yourself without calling someone every time.</p><p>We built our own content management system called <strong>Make Studio</strong> specifically for this. It's what lets us move so fast in a session without cutting corners. Clean, flexible, and simple enough that you can manage your site on your own once we hand it off. No subscription traps. No bloated page builders. Just a tight, well-built tool designed for exactly this kind of site.</p><p>This is not a template you fill out yourself. This is a live session with a creative director and a developer, both paying attention to nothing but your site for two hours.</p>"
    },
    HowItWorks: {
      Label: "How it works",
      Steps: [
        {
          number: "01",
          title: "You come prepared",
          description: "Bring the copy you want on the site, any photos you'd like to use, and a list of what you need your site to do. A domain name if you have one. That's the homework. We handle the rest."
        },
        {
          number: "02",
          title: "We build it together",
          description: "Jamey art directs. Tom builds on Make Studio. You're in the room (or on a call), making real-time decisions, watching your site come to life. No waiting a week to see a draft. It happens right in front of you."
        },
        {
          number: "03",
          title: "You leave with a website",
          description: "We walk you through how to update and manage your site. If you need a domain, we'll get that set up and connected before we're done. We work in-person or remote, whatever works best for you. Two hours later, you're live."
        }
      ]
    },
    MakeStudio: {
      Label: "Built on Make Studio",
      Headline: "The reason we can do this in two hours.",
      Body: "<p>Make Studio is our own content management system, built from the ground up for exactly this kind of project. It's what's under the hood of every Concierge site. Because we built it, we know every inch of it, and Tom can move through it incredibly fast without sacrificing quality or flexibility.</p><p>Once your site is live, Make Studio is yours to use. Updating copy, swapping photos, adding a page, it's all straightforward. You don't need to know how to code and you don't need to call us every time something changes. We built it to hand off cleanly.</p>"
    },
    Pricing: {
      Label: "Pricing",
      Plans: [
        {
          tier: "Core offering",
          name: "Concierge Session",
          price: "$500",
          unit: "flat rate / 2 hours",
          description: "Two hours with Jamey and Tom, fully focused on your site. This is where we build the thing. Art direction, development, and Make Studio setup all included. Domain connection included if you need it.",
          note: "The most efficient $500 you'll spend on your business.",
          featured: true
        },
        {
          tier: "If you need more time",
          name: "Extended Session",
          price: "$300",
          unit: "per hour, after the first 2",
          description: "If scope grows or we all know going in it'll take more time, we keep going. Billed in 15-minute increments. We round down for a couple extra minutes because that's who we are.",
          note: "",
          featured: false
        },
        {
          tier: "Ongoing",
          name: "On-Call Support",
          price: "$175",
          unit: "per person / 30 min minimum",
          description: "Your site is live. Now you've got a website team on call whenever you need one. Updates, additions, something new. We bill for combined time across both of us, so if Tom spends 15 minutes and Jamey spends 5, you're billed for 20. We keep it honest and sort the math out between us.",
          note: "",
          featured: false
        }
      ]
    },
    About: {
      Label: "About Jamey & Tom",
      Headline: "<p>We've been at this for <em>a long time.</em></p>",
      Stats: [
        { value: "25+", label: "Years, Jamey" },
        { value: "25+", label: "Years, Tom" }
      ],
      Body: "<p>Between us, we have about 50 years of experience making websites and digital experiences. We've worked in-house at major brands, at agencies, run our own shops, and done every flavor of freelance and contract work you can imagine. We know how to make great things and we know how to move fast.</p><p>We started Concierge because we kept seeing the same problem. Small businesses and independent creatives need real websites, but the standard options are either a DIY template that looks like a DIY template, or a full agency project that costs too much and takes too long.</p><p>We think there's a better way. <strong>Show up, dig in, get it done.</strong> That's Concierge.</p>"
    },
    CTA: {
      Label: "Get started",
      Headline: "Ready to build your site?",
      Subheadline: "Fill out the form below and we'll be in touch to get a session on the books. Takes about two minutes.",
      "CTA Label": "Book a Concierge Session",
      "CTA Link": "#",
      Footnote: "We'll follow up within one business day."
    },
    Footer: {
      "Left Text": "Concierge — A website service by Jamey & Tom",
      "Right Text": "Built on Make Studio"
    }
  })

  console.log('Content set for all 9 blocks')

  // Redeploy preview
  console.log('Deploying preview...')
  const result = await client.deployPreview(siteId)
  console.log('Preview deployed:', result.previewUrl)
}

main().catch(e => console.error(e))
