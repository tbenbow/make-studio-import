<template>
  <ul v-if="links && links.length" class="collection-links">
    <template v-for="link in links">
      <slot v-bind="{ link, levelsDeep }">
        <CollectionLinkItem
          :key="link.id"
          v-bind="link"
          :completion="storyHasCompletion(link.uuid)"
          :complete="isMounted && hasCompletion(link.uuid)"
          :levels-deep="levelsDeep"
        />
      </slot>
    </template>
  </ul>
</template>

<script>
import { mapState } from 'pinia'
import { useStoriesStore } from '../stores/stories'
import { useUserCompletionsStore } from '../stores/userCompletions'
import { useMounted } from '@vueuse/core'

export default {
  props: {
    links: Array,
    levelsDeep: {
      type: Number,
      default: 1
    }
  },
  setup() {
    const isMounted = useMounted()

    return {
      isMounted
    }
  },
  computed: {
    ...mapState(useStoriesStore, ['storyHasCompletion']),
    ...mapState(useUserCompletionsStore, ['hasCompletion'])
  }
}
</script>
