import { withLeadingSlash, withTrailingSlash, withoutTrailingSlash } from 'ufo'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  const hideRoot = true
  const { getStories } = event.context.$storyblok
  const { storyblok: { homeSlug } } = useAppConfig()

  const fullSlug = storyblok.resolveFullSlug(path)
  
  // Generate each path part for the given full slug
  function generateFullSlugs(fullSlug: string = '') {
    const fullSlugParts = fullSlug.split('/')
    const fullSlugs: string[] = []

    // Add each path part and its trailing slash version
    fullSlugParts.forEach((_part, index, arr) => {
      fullSlugs.push(arr.slice(0, index + 1).join('/'))
      fullSlugs.push(withTrailingSlash(arr.slice(0, index + 1).join('/')))
    })

    return fullSlugs
  }

  let stories: any[] | undefined

  try {
    stories = await getStories({
      by_slugs: generateFullSlugs(fullSlug).join(',')
    })
  } catch (error: any) {
    throw createError({
      statusCode: error.status,
      statusMessage: `${error.message}${error.response ? `: ${error.response}` : ''}`
    })
  }

  const breadcrumbs: any[] = [{
    label: 'Home',
    ariaLabel: 'Home',
    to: '/',
    current: false
  }]
  
  // Add each found story as a breadcrumb
  stories?.forEach((story) => {
    breadcrumbs.push({
      name: story.name,
      link: (story.full_slug === homeSlug)
        ? '/'
        : `${withLeadingSlash(withoutTrailingSlash(story.full_slug))}`
    })
  })

  // Remove root breadcrumb if directed to or stories contain home page
  if (hideRoot || stories?.some((story) => story.full_slug === homeSlug)) {
    breadcrumbs.shift()
  }

  // Make sure breadcrumbs are sorted by length of path
  breadcrumbs.sort((a, b) => a.link.length - b.link.length)

  return breadcrumbs
})
