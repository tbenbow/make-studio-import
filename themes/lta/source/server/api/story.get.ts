import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const { path, params, keepHiddenStories } = getQuery<{ path?: string, params?: string, keepHiddenStories?: string }>(event)
  const session = await getServerSession(event)
  const { getStory } = event.context.$storyblok

  return await getStory(
    path,
    params ? JSON.parse(params) : params,
    Boolean(keepHiddenStories),
    session?.user
  )
})
