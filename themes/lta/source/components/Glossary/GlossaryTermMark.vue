<template>
  <mark
    v-tooltip="{
      content: fetchDefinition,
      loadingContent: 'Loading definition…'
    }"
    class="glossary-term-mark"
    @click="fetchTerm"
  >
    <slot />
  </mark>
</template>

<script>
import { renderRichText } from '@storyblok/js'

export default {
  props: {
    objectId: String
  },
  data() {
    return {
      hasFetchedTerm: false,
      term: undefined
    }
  },
  methods: {
    async fetchTerm() {
      if (!this.objectId) {
        return
      }

      try {
        const terms = await $fetch('/api/stories', {
          query: {
            params: {
              content_type: 'GlossaryTerm',
              by_uuids: this.objectId
            }
          }
        })

        if (terms && terms.length) {
          return terms[0]
        }
      } catch (err) {}
    },
    async fetchDefinition() {
      if (!this.hasFetchedTerm) {
        this.term = await this.fetchTerm()
        this.hasFetchedTerm = true
      }

      return this.term
        ? renderRichText(this.term.content?.definition, {}, {})
        : 'There was a problem fetching the definition.'
    }
  }
}
</script>

<style lang="postcss">
.glossary-term-mark {
  @apply bg-transparent underline cursor-help;
  text-decoration-color: var(--color-body-4);
  text-decoration-style: dotted;
  text-underline-offset: 0.1875rem;

  &:hover {
    text-decoration-color: inherit;
    text-decoration-style: solid;
  }
}
</style>
