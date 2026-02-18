export default defineEventHandler(async (event) => {
  const { params } = getQuery<{ params?: any }>(event)
  const { getDatasourceEntries } = event.context.$storyblok

  return await getDatasourceEntries(
    params ? JSON.parse(params) : params
  )
})
