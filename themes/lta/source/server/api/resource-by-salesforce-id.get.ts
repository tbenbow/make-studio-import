import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const { id, params } = getQuery<{ id?: string, params?: string }>(event)
  const session = await getServerSession(event)
  const { getResourceBySalesforceId } = event.context.$storyblok
  
  return await getResourceBySalesforceId(
    id,
    params ? JSON.parse(params) : params,
    session?.user
  )
})
