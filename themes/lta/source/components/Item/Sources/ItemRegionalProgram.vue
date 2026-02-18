<template>
  <component
    :is="componentForType"
    class="item-regional-program"
    v-bind="computedProps"
    :title="title || regionalProgramTitle"
    :link="link || regionalProgramSlug"
    :image="image || regionalProgramBannerImage"
  >
    <template #before-body>
      <Field
        v-if="regionalProgramStates"
        class="states"
        label="States Served"
      >
        {{ regionalProgramStates }}
      </Field>
    </template>
  </component>
</template>

<script>
import ItemMixin from '@/mixins/Item.mixin'
import SourceInstanceMixin from '@/mixins/SourceInstance.mixin'

export default {
  mixins: [ItemMixin, SourceInstanceMixin],
  setup(props) {
    const regionalProgram = useRegionalProgram(transform.storyblokToComponentProps(props.source))

    return {
      regionalProgram,
      regionalProgramTitle: regionalProgram.sys?.name,
      regionalProgramSlug: regionalProgram.sys?.full_slug
        ? `/${regionalProgram.sys.full_slug}`
        : undefined,
      regionalProgramBannerImage: regionalProgram.bannerImage,
      regionalProgramDescription: regionalProgram.descriptionAsRichText,
      regionalProgramStates: regionalProgram.statesString
    }
  }
}
</script>

<style lang="postcss" scoped>
.item-regional-program {
  :deep(.states) {
    @apply mb-3;
  }
}
</style>
