import { defineStore } from 'pinia'

export const useStoriesStore = defineStore('stories', {
  id: 'storiesStore',
  state: () => {
    return {
      stories: [],
    }
  },
  getters: {
    getCollections: (state) => {
      return state.stories.filter((story) => story.collection)
    },
    getCollectionForStory(state) {
      let getCollections = this.getCollections
      return function(fullSlug) {
        const fullSlugNormalized = normalizePath(fullSlug)
        return getCollections.find((story) =>
          fullSlugNormalized.startsWith(story.full_slug_normalized)
        )?.collection
      }
    },
    storyInCollection(state) {
      let getCollectionForStory = this.getCollectionForStory
      return (fullSlug) => getCollectionForStory(fullSlug) ? true : false
    },
    getCompletions(state) {
      return state.stories.filter((story) => story.completion)
    },
    storyHasCompletion(state) {
      let getCompletions = this.getCompletions
      return (uuid) => getCompletions.find((story) => story.uuid === uuid) ? true : false
    }
  },
  actions: {
    async fetch(seedData) {
      this.stories = seedData || await $fetch('/api/stores/stories')
        .catch((err) => console.error('Error fetching stories', err))
    }
  }
})
