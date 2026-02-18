import { defineStore } from 'pinia'

export const useGlossaryStore = defineStore('glossary', {
  id: 'glossaryStore',
  state: () => {
    return {
      glossaries: []
    }
  },
  getters: {
    getGlossary: (state) => (uuid) => {
      return state.glossaries.find((glossary) => glossary.uuid === uuid)
    },
    getGlossaryTerms(state) {
      let getGlossary = this.getGlossary
      return (uuid) => getGlossary(uuid)?.glossaryTerms
    }
  },
  actions: {
    async fetch(seedData) {
      this.glossaries = seedData || await $fetch('/api/stores/glossaries')
        .catch((err) => console.error(`Error fetching glossaries (${err.message})`))
    }
  }
})
