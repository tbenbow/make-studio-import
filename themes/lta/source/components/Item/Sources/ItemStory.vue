<template>
  <component
    :is="componentForType"
    class="item-story"
    v-bind="computedProps"
    :title="title || storyTitle"
    :link="link || storySlug"
  />
</template>

<script>
import ItemMixin from '@/mixins/Item.mixin'
import SourceInstanceMixin from '@/mixins/SourceInstance.mixin'

export default {
  mixins: [ItemMixin, SourceInstanceMixin],
  setup(props) {
    const story = props.source
      ? useStory(transform.storyblokToComponentProps(props.source))
      : {}
    
    return {
      story,
      storyTitle: story.sys?.name,
      storySlug: story.sys?.full_slug
        ? `/${story.sys.full_slug}`
        : undefined
    }
  }
}
</script>
