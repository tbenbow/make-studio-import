export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  const { getLinks } = event.context.$storyblok
  const { storyblok: { preview } } = useRuntimeConfig()

  console.info('Fetch links:', path)

  return await getLinks({
    version: preview ? 'draft' : 'published',
    paginated: 1,
    per_page: 1000,
    starts_with: path
  })
})
