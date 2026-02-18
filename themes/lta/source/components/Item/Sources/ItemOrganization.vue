<template>
  <component
    :is="componentForType"
    class="item-organization"
    v-bind="computedProps"
    :label="label || organizationType"
    :title="title || organizationName"
    :subtitle="subtitle || organizationRegion"
    :body="body"
    :title-size="titleSize || 'small'"
  >
    <div>
      <vue-clamp tag="p" :autoresize="true" :max-lines="3">
        {{ organizationDescription }}
        <template #after="{ toggle, clamped, expanded }">
          <button
            v-if="clamped || expanded"
            class="toggle-description"
            @click="toggle"
          >
            {{ expanded ? 'Less' : 'More' }}
          </button>
        </template>
      </vue-clamp>
    </div>
    <template #after-body>
      <ButtonComponent
        v-if="organizationWebsiteUrl"
        :link="organizationWebsiteUrl"
        name="Visit website"
        icon="browser"
        size="small"
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
    const organization = useOrganization(transform.storyblokToComponentProps(props.source))

    return {
      organization,
      organizationName: organization.sys?.name,
      organizationSlug: organization.sys?.full_slug
        ? `/${organization.sys.full_slug}`
        : undefined,
      organizationType: organization.type,
      organizationRegion: organization.region,
      organizationDescription: organization.description,
      organizationWebsiteUrl: organization.websiteUrl
    }
  }
}
</script>

<style lang="postcss" scoped>
.item-organization {
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
  }

  .toggle-description {
    @apply px-2 text-accent text-2xs font-bold uppercase tracking-wide hover:underline;
  }

  .button {
    @apply mt-4;
  }
}
</style>
