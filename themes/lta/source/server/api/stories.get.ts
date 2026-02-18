import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const { params, keepHiddenStories } = getQuery<{ params?: any, keepHiddenStories?: string }>(event)
  const session = await getServerSession(event)
  const { getStories } = event.context.$storyblok

  return await getStories(
    params ? JSON.parse(params) : params,
    Boolean(keepHiddenStories),
    session?.user
  )
})
