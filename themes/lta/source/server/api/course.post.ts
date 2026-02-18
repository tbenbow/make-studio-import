/**
 * Takes a SCORM course base URL, fetches the manifest to determine the course
 * index page, and returns the course URL proxied through our site to avoid CORS
 * issues.
 * 
 * Example:
 * 
 * - input: https://lta-util-production.s3.us-east-2.amazonaws.com/LTA+Courses/Assessing+Your+Organization/
 * - output: /s3/LTA+Courses/Assessing+Your+Organization/index_lms.html
 */

import { JSDOM } from 'jsdom'
import { withoutTrailingSlash } from 'ufo'
import Url from 'url-parse'

export default defineEventHandler(async (event) => {
  // Using POST so "+" characters in course URL are retained
  const { course } = await readBody(event)

  if (!course) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Course URL is required'
    })
  }

  const courseURL = withoutTrailingSlash(course)
  const courseManifestURL = `${courseURL}/imsmanifest.xml`

  const manifestXML = await $fetch<string>(courseManifestURL)
    .catch((err) => {
      throw createError({
        statusCode: 404,
        statusMessage: 'Course manifest not found'
      })
    })

  function getCourseIndex(manifestXML: string) {
    const dom = new JSDOM(manifestXML, { contentType: 'text/xml' })
    const resources = dom.window.document.querySelectorAll('resource')
    const resource = Array.from(resources).find((resource) => resource.getAttribute('type') === 'webcontent')
    return resource?.getAttribute('href')
  }

  const courseIndex = getCourseIndex(manifestXML)

  if (!courseIndex) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Course index not found'
    })
  }

  const courseFullURL = `${courseURL}/${courseIndex}`

  const { amazon } = useRuntimeConfig()

  function proxyS3URL(url: string) {
    const urlParts = url ? new Url(url) : undefined

    return urlParts && urlParts.origin === amazon.s3BaseUrl
      ? `/s3${urlParts.pathname.replace(/\/$/, '')}`
      : undefined
  }

  const courseFullURLProxied = proxyS3URL(courseFullURL)

  return courseFullURLProxied
})
