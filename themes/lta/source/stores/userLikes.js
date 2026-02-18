import { defineStore } from 'pinia'

export const useUserLikesStore = defineStore('userLikes', () => {
  const { loggedIn } = useLtaAuth()
  
  const likes = ref([])

  function hasLike(objectId) {
    return likes.value?.includes(objectId)
  }

  async function fetch() {
    try {
      if (!loggedIn.value) {
        return
      }
      
      likes.value = await $fetch('/api/user/likes')
    } catch (err) {
      console.error(err.message)
    }
  }

  async function toggleLike(objectId) {
    try {
      const result = await $fetch(`/api/user/likes/${objectId}`)
      
      // If toggle successful, refresh user likes
      if (result) {
        await fetch()
      }
    } catch (err) {
      useNuxtApp().$toast(`Error: ${err.data?.message}`, { type: 'error' })
    }
  }

  return {
    likes,
    hasLike,
    fetch,
    toggleLike
  }
})
