export default defineEventHandler(async (event) => {
  console.info('Fetch stories: collections')

  const { getStories, getLinks } = event.context.$storyblok
  const { storyblok: { preview } } = useRuntimeConfig()

  // Get all collections (should only work with start pages)
  const stories = await getStories({
    is_startpage: true,
    excluding_fields: ['access', 'accessGroups', 'blocks', 'meta'].join(','),
    filter_query: {
      collection: { is: 'not_empty_array' }
    }
  })

  const processStories = async () => {
    const processedStories = []

    // Execute sequentially because if one fails, we don't want to cache
    // incomplete collection data
    for (const story of stories) {
      const { content, ...sys } = story
      
      const links: any[] = await getLinks({
        version: preview ? 'draft' : 'published',
        paginated: 1,
        per_page: 1000,
        starts_with: story.full_slug
      })

      processedStories.push({
        ...sys,
        collection: {
          ...content?.collection?.[0],
          links: createLinkTree(links)
        }
      })
    }

    return processedStories
  }

  const collections = await processStories()

  return collections
})
