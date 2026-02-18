/**
 * This is the original method we used to fetch breadcrumbs. It relies on the
 * Storyblok Management API to fetch the story and its breadcrumbs. This method
 * is fine, but the MAPI does have stricter rate limits and requires an OAuth
 * token and space ID. We don't use the MAPI anywhere else, so if we no longer
 * need this, we can remove the OAuth token and space ID from our env vars.
 * We'll keep this method here as a fallback in case problems arise.
 */

import { useStoryblok } from '~/composables/useStoryblok'

export default defineEventHandler(async (event ) => {
  const id = getRouterParam(event, 'id')
  const { getStory } = useStoryblok({
    oauthToken: process.env.STORYBLOK_MANAGEMENT_API_KEY,
    spaceId: process.env.STORYBLOK_SPACE_ID
  })

  try {
    const { data: { story } } = await getStory(id)

    const path = []

    // Build breadcrumbs
    const breadcrumbs = story.breadcrumbs?.map((link) => {
      path.push(link.slug)

      return {
        name: link.name,
        link: `/${path.join('/')}`
      }
    })

    // If story is not a start page…
    if (!story.is_startpage) {
      // Add queried story at end
      breadcrumbs.push({
        name: story.name,
        link: `/${story.full_slug}`
      })
    }

    return breadcrumbs
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching breadcrumbs',
    })
  }
})
