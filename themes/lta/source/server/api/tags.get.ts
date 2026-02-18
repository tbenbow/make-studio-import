export default defineEventHandler(async (event) => {
  const { params } = getQuery<{ params?: string }>(event)
  const { getTags } = event.context.$storyblok
  
  return await getTags(
    params ? JSON.parse(params) : params
  )
})
