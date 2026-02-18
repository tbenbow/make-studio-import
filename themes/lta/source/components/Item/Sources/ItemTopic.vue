<template>
  <component
    :is="componentForType"
    class="item-topic"
    v-bind="computedProps"
    :title="title || topicTitle"
    :link="link || topicSlug"
    :image="image || topicBannerImage"
    :body="hasBody ? body : topicDescription"
  />
</template>

<script>
import ItemMixin from '@/mixins/Item.mixin'
import SourceInstanceMixin from '@/mixins/SourceInstance.mixin'

export default {
  mixins: [ItemMixin, SourceInstanceMixin],
  setup(props) {
    const topic = useTopic(transform.storyblokToComponentProps(props.source))

    return {
      topic,
      topicTitle: topic.sys?.name,
      topicSlug: topic.sys?.full_slug
        ? `/${topic.sys.full_slug}`
        : undefined,
      topicBannerImage: topic.bannerImage,
      topicDescription: topic.bannerBody
    }
  }
}
</script>

<style lang="postcss" scoped>
.item-topic {
}
</style>
