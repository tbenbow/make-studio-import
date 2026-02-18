import { useGlossaryStore } from '~/stores/glossary'
import { useSettingsStore } from '~/stores/settings'
import { useSiteStore } from '~/stores/site'
import { useStoriesStore } from '~/stores/stories'

export default defineNuxtPlugin(async (nuxtApp) => {
  const stores = await $fetch('/api/stores')
  
  await Promise.all([
    useSettingsStore(nuxtApp.$pinia).fetch(stores?.settings),
    useSiteStore(nuxtApp.$pinia).fetch(stores?.site),
    useStoriesStore(nuxtApp.$pinia).fetch(stores?.stories),
    useGlossaryStore(nuxtApp.$pinia).fetch(stores?.glossaries)
  ])
  
  // If user is in Storyblok Visual Editor, set `inStoryblokVisualEditor` flag
  const config = useRuntimeConfig()
  const { query } = useRoute()
  useSiteStore(nuxtApp.$pinia).inStoryblokVisualEditor = storyblok.inVisualEditor(query, config.storyblok?.accessToken)
})
