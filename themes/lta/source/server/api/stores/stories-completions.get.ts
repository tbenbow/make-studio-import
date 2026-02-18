export default defineEventHandler(async (event) => {
  console.info('Fetch stories: completions')

  const { getStories } = event.context.$storyblok

  // Get all completions
  const stories = await getStories({
    excluding_fields: ['access', 'accessGroups', 'blocks', 'meta'].join(','),
    filter_query: {
      completion: { in: true }
    }
  })

  const completions = stories.map((story: any) => {
    const { content, ...sys } = story

    return {
      ...sys,
      completion: content.completion
    }
  })

  return completions
})
