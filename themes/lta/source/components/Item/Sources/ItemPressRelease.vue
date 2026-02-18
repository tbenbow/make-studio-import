<template>
  <component
    :is="componentForType"
    class="item-press-release"
    v-bind="computedProps"
    :label="label || pressReleaseLabel"
    :title="title || pressReleaseTitle"
    :subtitle="subtitle || pressReleaseSubtitle"
    :body="hasBody ? body : pressReleaseExcerpt"
    :link="link || pressReleaseSlug"
  >
    <template #after-body>
      <ButtonComponent
        v-if="link || pressReleaseSlug"
        variation="link"
        :link="link || pressReleaseSlug"
        name="Read press release"
        :size="size"
      />
    </template>
  </component>
</template>

<script>
import ItemMixin from '@/mixins/Item.mixin'
import SourceInstanceMixin from '@/mixins/SourceInstance.mixin'

export default {
  mixins: [ItemMixin, SourceInstanceMixin],
  setup(props) {
    const pressRelease = usePressRelease(transform.storyblokToComponentProps(props.source))

    return {
      pressRelease,
      pressReleaseLabel: pressRelease.publishDateFormatted,
      pressReleaseTitle: pressRelease.sys?.name,
      pressReleaseSubtitle: pressRelease.subtitle,
      pressReleaseSlug: pressRelease.sys?.full_slug
        ? `/${pressRelease.sys.full_slug}`
        : undefined,
      pressReleaseExcerpt: pressRelease.excerpt
    }
  }
}
</script>
