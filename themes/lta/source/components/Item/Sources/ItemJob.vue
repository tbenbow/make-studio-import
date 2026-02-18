<template>
  <component
    :is="componentForType"
    class="item-job"
    v-bind="computedProps"
    :label="label || (jobInternal && 'Land Trust Alliance') || jobLandTrustName"
    :title="title || jobName"
    :link="link || jobSlug"
    :body="hasBody ? body : jobExcerpt"
    :title-size="titleSize || 'small'"
  >
    <template v-if="jobApplicationDeadline" #subtitle>
      <strong>Deadline:</strong>
      {{ jobApplicationDeadlineFormatted }}
    </template>
    <template #before-body>
      <ul v-if="jobLocation || jobCategory || jobType" class="attributes">
        <li v-if="jobLocation" class="attribute">
          <font-awesome-icon
            class="attribute-icon"
            :icon="['fal', 'location-dot']"
          />
          <span class="attribute-label">{{ jobLocation }}</span>
        </li>
        <li v-if="jobCategory" class="attribute">
          <font-awesome-icon
            class="attribute-icon"
            :icon="['fal', 'folder-tree']"
          />
          <span class="attribute-label">{{ jobCategory }}</span>
        </li>
        <li v-if="jobType" class="attribute">
          <font-awesome-icon
            class="attribute-icon"
            :icon="['fal', 'briefcase']"
          />
          <span class="attribute-label">{{ jobType }}</span>
        </li>
      </ul>
    </template>
  </component>
</template>

<script>
import ItemMixin from '@/mixins/Item.mixin'
import SourceInstanceMixin from '@/mixins/SourceInstance.mixin'

export default {
  mixins: [ItemMixin, SourceInstanceMixin],
  setup(props) {
    const job = useJob(transform.storyblokToComponentProps(props.source))

    return {
      job,
      jobName: job.sys?.name,
      jobSlug: job.sys?.full_slug ? `/${job.sys.full_slug}` : undefined,
      jobLocation: job.locationOrRemote,
      jobCategory: job.category,
      jobType: job.type,
      jobExcerpt: job.excerpt,
      jobInternal: job.internal,
      jobLandTrustName: job.landTrust?.name,
      jobApplicationDeadline: job.applicationDeadline,
      jobApplicationDeadlineIsFuture: job.applicationDeadlineIsFuture,
      jobApplicationDeadlineFormatted: job.applicationDeadlineFormatted
    }
  }
}
</script>

<style lang="postcss" scoped>
.item-job {
}

.attributes {
  @apply flex flex-wrap items-center gap-x-6 gap-y-3 mb-4;
}

.attribute {
  @apply flex items-center text-blue;

  &-icon {
    @apply text-lg mr-2;
  }

  &-label {
    @apply text-sm;
  }
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
}
</style>
