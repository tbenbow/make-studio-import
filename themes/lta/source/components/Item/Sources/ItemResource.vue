<template>
  <component
    :is="componentForType"
    v-color="resourceType.color"
    class="item-resource has-image"
    v-bind="computedProps"
    :icon="icon || resourceType.icon"
    :image="image || resourceImage"
    :image-options="defaultImageOptions"
    :title="title || resourceTitle"
    :link="link || resourceLink"
    :body="hasBody ? body : resourceExcerptAsRichText"
    :icon-style="iconStyle || 'circle'"
    :icon-size="iconSize || 'xsmall'"
    :title-size="titleSize || 'small'"
    :body-size="bodySize || 'small'"
    v-on="listeners($attrs)"
    @click:figure="resourceAlgoliaSendClick('Resource Clicked')"
    @click:title="resourceAlgoliaSendClick('Resource Clicked')"
  >
    <template v-if="!resourceHasImage" #image>
      <div class="image-default">
        <div class="aspect-w-3 aspect-h-4 *:!h-full *:w-12">
          <font-awesome-icon :icon="['fal', resourceType.icon]" />
        </div>
      </div>
    </template>
    <template v-if="resourceTopics && resourceTopics.length" #label>
      <div class="topics">
        <span
          v-for="(topic, index) in resourceTopics"
          :key="index"
          class="topic"
        >
          <NuxtLink
            :to="
              topic.content && topic.content.parent
                ? getSettingLinkUrl('rootResource', {
                    'hierarchicalMenu[topics.lvl0][0]':
                      topic.content.parent.name,
                    'hierarchicalMenu[topics.lvl0][1]': topic.name
                  })
                : getSettingLinkUrl('rootResource', {
                    'hierarchicalMenu[topics.lvl0][0]': topic.name
                  })
            "
            @click="
              topic.content && topic.content.parent
                ? resourceAlgoliaSendClickFilters('Topic Clicked', [
                    `topics.lvl0:${topic.content.parent.name}`,
                    `topics.lvl1:${topic.name}`
                  ])
                : resourceAlgoliaSendClickFilters('Topic Clicked', [
                    `topics.lvl0:${topic.name}`
                  ])
            "
            >{{ topic.name }}</NuxtLink
          >
        </span>
      </div>
    </template>
    <template v-if="resourceHasActions" #before-main>
      <ResourceActions v-bind="resourceProps" size="small" />
    </template>
    <template v-if="resourceFeatured" #before-header>
      <span class="featured">Featured</span>
    </template>
    <template #subtitle>
      <div class="subtitle-attributes">
        <span
          v-if="resourceDisplayPublishDate"
          class="attribute attribute-date"
        >
          <span
            v-if="resourcePublishDate"
            v-tooltip="'Publish Date'"
            class="publish-date"
            >{{ resourcePublishDateFormatted }}</span
          >
          <span
            v-if="resourceReviewDate"
            v-tooltip="resourceReviewDateTooltip"
            class="review-date"
            ><font-awesome-icon :icon="['fal', 'check']" />
            {{ $filters.capitalize(resourceReviewDateLabel || 'reviewed') }}
            {{ resourceReviewDateFormatted }}</span
          >
        </span>
        <span
          v-if="resourceStartDate"
          v-tooltip="'Date'"
          class="attribute attribute-start-end-date"
          >{{ resourceStartToEndDateFormatted }}</span
        >
        <span
          v-if="resourceSource"
          v-tooltip="'Source'"
          class="attribute attribute-source"
          >{{ resourceSource }}</span
        >
        <span
          v-if="resourceLocation"
          v-tooltip="'Location'"
          class="attribute attribute-location"
          >{{ resourceLocation }}</span
        >
        <span
          v-if="resourceInstructor"
          v-tooltip="'Instructor'"
          class="attribute attribute-instructor"
          >{{ resourceInstructor }}</span
        >
      </div>
    </template>
    <template #default>
      <template v-if="resourceExcerptIsHTML">
        <template v-html="resourceExcerpt" v-inline />
      </template>
    </template>
    <template #footer>
      <ul
        v-if="
          resourceExpertise || (resourceRegions && resourceRegions.length)
        "
        class="footer-attributes"
      >
        <li v-if="resourceExpertise" v-tooltip="'Expertise'" class="attribute">
          <font-awesome-icon :icon="['fal', 'head-side-brain']" />
          <NuxtLink
            :to="
              getSettingLinkUrl('rootResource', {
                'refinementList[expertise][0]': resourceExpertise
              })
            "
            @click="
              resourceAlgoliaSendClickFilters('Expertise Clicked', [
                `expertise:${resourceExpertise}`
              ])
            "
            >{{ resourceExpertiseLabel }}</NuxtLink
          >
        </li>
        <li
          v-if="resourceRegions && resourceRegions.length"
          v-tooltip="'Regions'"
          class="attribute"
        >
          <font-awesome-icon :icon="['fal', 'map']" />
          <div>
            <template v-for="(region, index) in resourceRegions" :key="index">
              <NuxtLink
                :to="
                  getSettingLinkUrl('rootResource', {
                    'refinementList[regions][0]': region
                  })
                "
                @click="
                  resourceAlgoliaSendClickFilters('Region Clicked', [
                    `regions:${region}`
                  ])
                "
                >{{ region }}</NuxtLink
              ><template v-if="resourceRegions.length > index + 1"
                >,
              </template>
            </template>
          </div>
        </li>
      </ul>
    </template>
  </component>
</template>

<script>
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import ItemMixin from '@/mixins/Item.mixin'
import SourceInstanceMixin from '@/mixins/SourceInstance.mixin'

export default {
  mixins: [ItemMixin, SourceInstanceMixin],
  props: {
    linkParams: Object
  },
  defineEmits: ['algolia-send-event'],
  setup(props, context) {
    const resourceProps = transform.storyblokToComponentProps(props.source)
    const resource = useResource(resourceProps, context)

    const params = new URLSearchParams(props.linkParams).toString()

    return {
      resource,
      resourceProps,
      resourceTitle: resource.sys?.name,
      resourceLink: params ? `${resource.link.value}?${params}` : resource.link.value,
      resourceType: resource.resourceType,
      resourceHasImage: resource.hasImage,
      resourceImage: resource.hasImage ? resource.image : undefined,
      resourceExcerpt: resource.excerpt,
      resourceExcerptAsRichText: resource.excerptAsRichText,
      resourceExcerptIsHTML: resource.excerptIsHTML,
      resourceTopics: resource.topics,
      resourceRegions: resource.regions,
      resourceExpertise: resource.expertise,
      resourceExpertiseLabel: resource.expertiseLabel,
      resourceHasActions: resource.hasActions,
      resourceFeatured: resource.featured,
      resourceDisplayPublishDate: resource.displayPublishDate,
      resourcePublishDate: resource.publishDate,
      resourcePublishDateFormatted: resource.publishDateFormatted,
      resourceReviewDate: resource.reviewDate,
      resourceReviewDateTooltip: resource.reviewDateTooltip,
      resourceReviewDateLabel: resource.reviewDateLabel,
      resourceReviewDateFormatted: resource.reviewDateFormatted,
      resourceStartDate: resource.startDate,
      resourceStartToEndDateFormatted: resource.startToEndDateFormatted,
      resourceSource: resource.source,
      resourceLocation: resource.location,
      resourceInstructor: resource.instructor,
      resourceAlgoliaSendClick: resource.algoliaSendClick,
      resourceAlgoliaSendClickFilters: resource.algoliaSendClickFilters
    }
  },
  computed: {
    ...mapState(useSettingsStore, ['getSettingLinkUrl']),
    defaultImageOptions() {
      const options = {
        format: 'webp',
        // quality: 60,
        fit: 'cover',
        width: 168,
        height: 224
      }

      options.sizes = `max:${options.width}px 2x:${options.width * 2}px`

      return options
    }
  }
}
</script>

<style lang="postcss" scoped>
.item-resource {
  @apply relative overflow-hidden;

  :deep(.figure) {
    @apply w-[10.5rem];

    .icon-blob {
      .icon {
        @apply text-white;
      }
    }

    .image,
    .image-default {
      @apply rounded-sm;
    }

    .image-default {
      @apply bg-background shadow-inset-hairline;

      svg[data-icon] {
        @apply mx-auto text-line text-4xl;
      }
    }
  }

  :deep(.main) {
    @apply flex flex-col;

    .resource-actions {
      @apply order-last;
    }
  }

  :deep(.body) {
    >,
    > div > {
      *:not(:first-child) {
        @apply hidden;
      }

      *:first-child {
        @apply line-clamp-3;
      }
    }
  }
}

:deep(.resource-actions) {
  @apply flex flex-col gap-2 mt-4 pt-4 border-t border-line;

  .notice {
    @apply text-left;
  }

  .action-group {
    @apply flex flex-col gap-2;
  }

  .action {
    &-description {
      @apply mt-2 text-body-3 text-2xs first:mt-0;

      a:not(.button) {
        @apply underline hover:text-accent;
        text-decoration-color: theme('colors.accent');
      }
    }
  }
}

.featured {
  @apply absolute left-0 top-0 z-[21] inline-block px-3 py-1 text-2xs text-white font-bold leading-none uppercase tracking-wide bg-heading rounded-tl-sm rounded-br-lg;
}

.topics {
  @apply flex flex-wrap items-center;

  .topic {
    a {
      @apply hover:underline;
    }

    &:after {
      @apply mx-2 text-black-400 content-['•'];
    }

    &:last-child:after {
      @apply hidden;
    }
  }
}

.subtitle-attributes {
  @apply flex flex-wrap gap-y-1;

  .attribute {
    &:after {
      @apply mx-2 text-black-400 content-['•'];
    }

    &:last-child:after {
      @apply hidden;
    }
  }
}

.review-date {
  @apply ml-1 text-accent;

  svg[data-icon] {
    @apply relative top-px;
  }
}

.footer-attributes {
  @apply flex flex-wrap gap-6;

  .attribute {
    @apply flex items-center text-2xs text-body-3;

    svg[data-icon] {
      @apply mr-2 text-base text-accent;
    }

    a {
      @apply hover:text-accent;
    }
  }
}

/* Has Icon & Image */

.item.item-resource.has-icon.has-image {
  :deep(.figure) {
    .icon-blob {
      @apply top-3 right-3 left-auto translate-x-0 translate-y-0;
    }
  }
}

/* Orientation */

.item.item-resource.orientation-horizontal {
  @apply items-start max-w-none;

  :deep(.figure) {
    @apply w-[10.5rem];
  }

  @screen xl {
    :deep(.main) {
      @apply block;
    }

    :deep(.resource-actions) {
      @apply float-right mt-0 mb-2 ml-6 pt-0 max-w-cols-3 text-center border-t-0;

      .notice {
        @apply text-center;
      }
    }
  }
}

/* Type: Card */

.item.item-resource.item-card,
.item.item-resource.item-card.orientation-horizontal {
  :deep(.figure) {
    @apply p-3 w-auto;

    .icon-blob {
      @apply z-20;
    }

    .image,
    .image-default {
      @apply relative z-10 w-[10.5rem] rounded-sm;
    }

    &:before {
      @apply absolute left-0 top-0 opacity-38 h-1/2 w-full bg-accent content-[''];
    }
  }
}

.item.item-resource.item-card {
  &.has-icon.has-image {
    :deep(.figure) {
      .icon-blob {
        @apply top-6 right-6;
      }
    }
  }
}

.item.item-resource.item-card.orientation-horizontal {
  @apply items-start;

  @screen <sm {
    @apply flex-col;

    :deep(.figure) {
      @apply max-w-none max-h-none;
    }
  }

  @screen md {
    :deep(.figure) {
      .image {
        @apply h-auto;
      }

      &:before {
        @apply h-full w-1/2;
      }
    }
  }
}
</style>
