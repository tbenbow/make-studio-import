import { defineStore } from 'pinia'

export const useUserCompletionsStore = defineStore('userCompletions', () => {
  const { loggedIn } = useLtaAuth()

  const completions = ref([])

  function hasCompletion(objectId) {
    return completions.value?.includes(objectId)
  }

  async function fetch() {
    try {
      if (!loggedIn.value) {
        return
      }
      
      completions.value = await $fetch('/api/user/completions')
    } catch (err) {
      console.error('Error fetching completions')
    }

  }

  async function toggleCompletion(objectId) {
    if (!loggedIn.value) {
      return
    }

    try {
      const result = await $fetch(`/api/user/completions/${objectId}`)

      // If toggle successful, refresh user completions
      if (result) {
        await fetch()
      }
    } catch (err) {
      useNuxtApp().$toast(`Error: ${err.data?.message}`, { type: 'error' })
    }
  }
  return {
    completions,
    hasCompletion,
    toggleCompletion,
    fetch
  }
})
