import { defineStore } from 'pinia'

export const useUserBookmarksStore = defineStore('userBookmarks', () => {
  const { loggedIn } = useLtaAuth()
  
  const bookmarks = ref([])

  function hasBookmark(objectId) {
    return bookmarks.value?.includes(objectId)
  }

  async function fetch() {
    try {
      if (!loggedIn.value) {
        return
      }
      
      bookmarks.value = await $fetch('/api/user/bookmarks')
    } catch (err) {
      console.error(err.message)
    }
  }

  async function toggleBookmark(objectId) {
    try {
      const result = await $fetch(`/api/user/bookmarks/${objectId}`)
      
      // If toggle successful, refresh user bookmarks
      if (result) {
        await fetch()
      }
    } catch (err) {
      useNuxtApp().$toast(`Error: ${err.data?.message}`, { type: 'error' })
    }
  }

  return {
    bookmarks,
    hasBookmark,
    fetch,
    toggleBookmark
  }
})
