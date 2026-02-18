<template>
  <component
    :is="componentForSource"
    v-if="hasSource"
    v-bind="computedProps"
    :source="sourceStory"
    :show-loader="showLoader || fetchingSource"
    :show-loader-error="showLoaderError || fetchingSourceError"
    :show-placeholder="showPlaceholder || (fetchingSourceEnded && !sourceStory)"
  >
    <template v-for="(_, slotName) in $slots" v-slot:[slotName]>
      <slot :name="slotName" />
    </template>
  </component>
  <component :is="componentForType" v-else v-bind="computedProps">
    <template v-for="(_, slotName) in $slots" v-slot:[slotName]>
      <slot :name="slotName" />
    </template>
  </component>
</template>

<script>
import ItemMixin from '@/mixins/Item.mixin'
import SourceMixin from '@/mixins/Source.mixin'

// Map of source component to custom Item component (located in './Sources' dir)
function componentForSource(component) {
  switch (component) {
    case 'Affiliate':
    case 'Contact':
    case 'GainingGround':
    case 'Job':
    case 'LandTrust':
    case 'Organization':
    case 'Page':
    case 'Post':
    case 'PressMention':
    case 'PressRelease':
    case 'RegionalProgram':
    case 'Resource':
    case 'Topic':
      return `Item${component}`

    default:
      return 'ItemStory'
  }
}

export default {
  mixins: [ItemMixin, SourceMixin],
  computed: {
    componentForSource() {
      return this.sourceStory && this.sourceStory?.content?.component
        ? resolveAsyncComponent(componentForSource(this.sourceStory.content.component))
        : this.componentForType
    }
  },
  async mounted() {
    await this.fetchSource()
  }
}
</script>
