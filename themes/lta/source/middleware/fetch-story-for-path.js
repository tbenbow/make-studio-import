import { useSiteStore } from '@/stores/site'
import { useStoriesStore } from '@/stores/stories'

export default defineNuxtRouteMiddleware(async (to) => {
  const path = storyblok.resolveFullSlug(to.path)
  const key = `story:${path}`

  const { data: story } = useNuxtData(key)

  if (!story.value) {
    story.value = {
      data: undefined,
      error: undefined
    }
  }

  // Check payload for story data (i.e. from prerendering)
  const payload = await loadPayload(to.path)
  
  if (payload?.data[key]) {
    story.value.data = payload.data[key]
  }
  
  // If no story data, fetch it from Storyblok
  if (!story.value.data && !story.value.error && !import.meta.error && !useError().value) {
    const requestFetch = useRequestFetch()
    await requestFetch('/api/story', { query: { path, keepHiddenStories: true } })
      .then((response) => {
        story.value.data = response?.data?.story
      })
      .catch((error) => {
        story.value.error = {
          statusCode: error.status,
          statusMessage: error.data.data || error.message || 'Failed to receive content'
        }
      })
  }

  // If story data…
  if (story.value.data) {
    // Set current story
    const { content, ...sys } = story.value.data
    const siteStore = useSiteStore()
    const { currentStory } = storeToRefs(siteStore)
    currentStory.value = sys

    // Determine layout
    const layout = ref('default')
    const storiesStore = useStoriesStore()
    const { storyInCollection } = storiesStore
    const { setSidebarForStory } = siteStore
    if (storyInCollection(to.path)) {
      setSidebarForStory(to.path)
      layout.value = 'sidebar'
    }

    // Set layout
    setPageLayout(layout.value)
  }
})
