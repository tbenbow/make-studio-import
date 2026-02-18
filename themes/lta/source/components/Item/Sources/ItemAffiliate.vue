<template>
  <component
    :is="componentForType"
    class="item-affiliate"
    v-bind="computedProps"
    :label="label || affiliateType"
    :title="title || affiliateName"
    :subtitle="subtitle || affiliateLocation"
    :link="link || affiliateSlug"
    :body="hasBody ? body : affiliateExcerpt"
    :title-size="titleSize || 'small'"
  >
    <template #before-body>
      <ul
        v-if="affiliateExpertise && affiliateExpertise.length"
        class="expertises"
      >
        <li
          v-for="(expertise, index) in affiliateExpertise"
          :key="index"
          v-tooltip="'Expertise'"
          class="expertise"
        >
          {{ expertise }}
        </li>
      </ul>
    </template>
    <template #after-body>
      <ButtonComponent
        class="button-view"
        :link="affiliateSlug"
        size="small"
        variation="link"
        name="View affiliate"
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
    const affiliate = useAffiliate(transform.storyblokToComponentProps(props.source))

    return {
      affiliate,
      affiliateName: affiliate.sys?.name,
      affiliateSlug: affiliate.sys?.full_slug
        ? `/${affiliate.sys.full_slug}`
        : undefined,
      affiliateType: affiliate.type,
      affiliateLocation: affiliate.locationOrRemote,
      affiliateExpertise: affiliate.expertise,
      affiliateExcerpt: affiliate.excerpt
    }
  }
}
</script>

<style lang="postcss" scoped>
.item-affiliate {
}

.expertises {
  @apply flex flex-wrap items-center gap-x-3 gap-y-2 mb-4;
}

.expertise {
  @apply px-3 py-1 text-white text-2xs font-bold bg-blue rounded-full;
}

:deep(.body) {
  > div {
    @apply border-t border-line pt-4;

    > *:not(:first-child) {
      @apply hidden;
    }

    > *:first-child {
      @apply line-clamp-3;
    }
  }

  .button-view {
    @apply mt-3;
  }
}
</style>
