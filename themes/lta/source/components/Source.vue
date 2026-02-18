<template>
  <NoticeLoading v-if="fetchingSource"><slot name="loading" /></NoticeLoading>
  <component
    :is="componentForSource"
    v-else-if="sourceStory"
    v-bind="sourceStoryProps"
  >
    <template v-for="(_, slotName) in $slots" v-slot:[slotName]>
      <slot :name="slotName" />
    </template>
  </component>
</template>

<script>
import SourceMixin from '@/mixins/Source.mixin'

export default {
  mixins: [SourceMixin],
  props: {
    loadingText: String
  },
  computed: {
    componentForSource() {
      return this.sourceStory?.content?.component
    }
  },
  async mounted() {
    await this.fetchSource()
  }
}
</script>
