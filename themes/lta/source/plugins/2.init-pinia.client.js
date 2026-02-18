import { useUserBookmarksStore } from '~/stores/userBookmarks'
import { useUserLikesStore } from '~/stores/userLikes'
import { useUserCompletionsStore } from '~/stores/userCompletions'

export default defineNuxtPlugin(async (nuxtApp) => {
  useUserBookmarksStore(nuxtApp.$pinia).fetch()
  useUserLikesStore(nuxtApp.$pinia).fetch()
  useUserCompletionsStore(nuxtApp.$pinia).fetch()
})
