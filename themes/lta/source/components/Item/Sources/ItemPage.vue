<template>
  <component
    :is="componentForType"
    class="item-page"
    v-bind="computedProps"
    :title="title || pageTitle"
    :image="image || pageImage"
    :link="link || pageSlug"
  />
</template>

<script>
import ItemMixin from '@/mixins/Item.mixin'
import SourceInstanceMixin from '@/mixins/SourceInstance.mixin'

export default {
  mixins: [ItemMixin, SourceInstanceMixin],
  setup(props) {
    const page = usePage(transform.storyblokToComponentProps(props.source))

    const bannerBlock = computed(() =>
      page.blocks &&
      page.blocks.length &&
      page.blocks[0].component === 'Banner'
        ? page.blocks[0]
        : undefined
    )

    return {
      page,
      pageTitle: bannerBlock.value?.title || page.sys?.name,
      pageImage: page.meta?.og_image
        ? { filename: page.meta.og_image, alt: page.sys?.name }
        : bannerBlock.value?.backgroundImage
        ? bannerBlock.value.backgroundImage
        : undefined,
      pageSlug: page.sys?.full_slug
        ? `/${page.sys.full_slug}`
        : undefined
    }
  }
}
</script>
