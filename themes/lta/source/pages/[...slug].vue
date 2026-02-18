<template>
  <Story v-bind="story" />
</template>

<script setup>
definePageMeta({
  middleware: 'fetch-story-for-path'
})

const route = useRoute()

// Get story from payload (set in middleware)
const key = `story:${storyblok.resolveFullSlug(route.path)}`
const { data: payload } = useNuxtData(key)

const story = ref(payload.value.data)

if (payload.value.error) {
  showError(payload.value.error)
} else if (story.value) {
  // Set metadata
  const { head, seoMeta } = useStory(story.value)
  useHead(head)
  useSeoMeta(seoMeta)
}

onMounted(() => {
  useStoryblokBridge(
    story.value?.id,
    (updatedStory) => {
      story.value = updatedStory
    }
  )
})
</script>
