<template>
  <div v-editable="$props" class="resource">
    <Blocks :root="true">
      <Breadcrumbs />
      <Heading
        id="overview"
        v-color="resourceType.color"
        class="resource-heading"
        id-name="Overview"
        :title="sys?.name"
        title-tag="h1"
      >
        <template #before>
          <UserActions>
            <Like :object-id="sys?.uuid" size="small" />
            <Bookmark :object-id="sys?.uuid" size="small" />
          </UserActions>
        </template>
        <template #label>
          <div class="label">
            <div v-color="resourceType.color" class="type">
              <IconBlob
                class="type-icon"
                :icon="resourceType.icon"
                size="small"
              />
              <span class="type-label"
                ><template v-if="resourceType.key !== rootType.key"
                  >{{ rootType.label }} / </template
                >{{ resourceType.label }}</span
              >
            </div>
            <span v-if="featured" class="featured">Featured</span>
            <span v-if="webinarPass" class="webinar-pass" v-tooltip="`Included with the ${webinarPassLabel}`">{{ webinarPassLabel }}</span>
          </div>
        </template>
        <template v-if="displayPublishDate" #description>
          <span v-if="publishDate" class="publish-date"
            >Posted {{ publishDateFormatted }}</span
          >
          <span
            v-if="reviewDate"
            v-tooltip="
              'Resources are regularly reviewed for accuracy and relevance.'
            "
            class="review-date"
            ><font-awesome-icon :icon="['fal', 'check']" />
            {{ $filters.capitalize(reviewDateLabel || 'reviewed') }}
            {{ reviewDateFormatted }}</span
          >
        </template>
      </Heading>
      <div v-color="resourceType.color" class="resource-details">
        <div class="content">
          <AssetImage
            v-if="isEvent && hasImage"
            class="image-banner"
            :asset="image!"
          />
          <div
            v-if="
              startDate || source || author || instructor || location || length
            "
            class="attributes"
          >
            <Field
              v-if="locationAndDate"
              icon="location-dot"
              label="Location / Date"
              :display-inline="true"
              >{{ locationAndDate }}</Field
            >
            <template v-else>
              <Field
                v-if="startDate"
                icon="calendar"
                :label="`${resourceType.label} Date`"
                :display-inline="true"
                >{{ startToEndDateFormatted }}</Field
              >
              <Field
                v-if="location"
                icon="location-dot"
                label="Location"
                :display-inline="true"
                >{{ location }}</Field
              >
            </template>
            <Field
              v-if="source"
              icon="building"
              label="Source"
              :display-inline="true"
              >{{ source }}</Field
            >
            <Field
              v-if="author"
              icon="user"
              label="Author"
              :display-inline="true"
              >{{ author }}</Field
            >
            <Field
              v-if="instructor"
              icon="person-chalkboard"
              label="Instructor"
              :display-inline="true"
              >{{ instructor }}</Field
            >
            <Field
              v-if="length"
              icon="timer"
              label="Length"
              :display-inline="true"
              >{{ length }}</Field
            >
          </div>
          <div
            v-if="hasImage || hasDescription || excerpt"
            class="image-description"
          >
            <AssetImage
              v-if="!isEvent && hasImage"
              :asset="image!"
              width="168"
              height="224"
            />
            <Field
              v-if="hasDescription || excerpt || copyright"
              :label="`About This ${resourceType.label}`"
            >
              <RichText v-if="hasDescription" :document="description" />
              <template v-else-if="excerpt">
                <RichText v-if="excerptIsHTML">
                  <div v-html="excerpt" />
                </RichText>
                <RichText v-else :document="excerptAsRichText" />
              </template>
              <p v-if="copyright" class="copyright">
                {{ copyright }}
              </p>
            </Field>
          </div>
          <Field
            v-if="sponsors && sponsors.length"
            class="sponsors"
            label="Sponsored By"
          >
            <LogoGrid :logos="sponsors" size="medium" />
          </Field>
        </div>
        <aside class="sidebar">
          <Aside>
            <ResourceActions v-bind="$props">
              <!-- Content assets buttons -->
              <template v-if="contentAssets && contentAssets.length">
                <div
                  v-for="(asset, index) in contentAssets"
                  :key="index"
                  class="action"
                >
                  <ButtonComponent
                    :name="`Download ${asset.title || resourceType.label}`"
                    :link="asset.filename"
                    :icon="assetTypeIcon(asset.filename)"
                    :variation="
                      index === 0 && !hasContent && !hasContentAssetsPDF
                        ? 'solid'
                        : 'outline'
                    "
                    :disabled="!asset.filename"
                    download
                    @click="algoliaSendClick('Asset Downloaded')"
                  />
                  <div v-if="asset.name" class="action-description">
                    {{ asset.name }}
                  </div>
                </div>
              </template>
            </ResourceActions>
            <template #items>
              <AsideItem
                v-if="topics && topics.length"
                class="topics"
                label="Topics"
                icon="sitemap"
              >
                <ul>
                  <li
                    v-for="(topic, index) in topics"
                    :key="index"
                    class="topic"
                  >
                    <template v-if="topic.content && topic.content.parent">
                      <NuxtLink
                        :to="
                          getSettingLinkUrl('rootResource', {
                            'hierarchicalMenu[topics.lvl0][0]':
                              topic.content.parent.name
                          })
                        "
                        @click="
                          algoliaSendClickFilters('Topic Clicked', [
                            `topics.lvl0:${topic.content.parent.name}`
                          ])
                        "
                        >{{ topic.content.parent.name }}</NuxtLink
                      >
                      <div class="topic-child">
                        <font-awesome-icon
                          v-if="topic.content && topic.content.parent"
                          class="topic-child-icon"
                          :icon="['fal', 'arrow-turn-down-right']"
                          :fixed-width="true"
                        />
                        <NuxtLink
                          :to="
                            getSettingLinkUrl('rootResource', {
                              'hierarchicalMenu[topics.lvl0][0]':
                                topic.content.parent.name,
                              'hierarchicalMenu[topics.lvl0][1]': topic.name
                            })
                          "
                          @click="
                            algoliaSendClickFilters('Topic Clicked', [
                              `topics.lvl0:${topic.content.parent.name}`,
                              `topics.lvl1:${topic.name}`
                            ])
                          "
                          >{{ topic.name }}</NuxtLink
                        >
                      </div>
                    </template>
                    <NuxtLink
                      v-else
                      :to="
                        getSettingLinkUrl('rootResource', {
                          'hierarchicalMenu[topics.lvl0][0]': topic.name
                        })
                      "
                      @click="
                        algoliaSendClickFilters('Topic Clicked', [
                          `topics.lvl0:${topic.name}`
                        ])
                      "
                      >{{ topic.name }}</NuxtLink
                    >
                  </li>
                </ul>
              </AsideItem>
              <AsideItem
                v-if="regions && regions.length"
                class="regions"
                label="Regions"
                icon="map"
              >
                <template v-for="(region, index) in regions" :key="index">
                  <NuxtLink
                    class="region"
                    :to="
                      getSettingLinkUrl('rootResource', {
                        'refinementList[regions][0]': region
                      })
                    "
                    @click="
                      algoliaSendClickFilters('Region Clicked', [
                        `regions:${region}`
                      ])
                    "
                    >{{ region }}</NuxtLink
                  ><template v-if="regions.length > index + 1">, </template>
                </template>
              </AsideItem>
              <AsideItem
                v-if="expertise"
                class="expertise"
                label="Expertise"
                icon="head-side-brain"
              >
                <NuxtLink
                  :to="
                    getSettingLinkUrl('rootResource', {
                      'refinementList[expertise][0]': expertise
                    })
                  "
                  @click="
                    algoliaSendClickFilters('Expertise Clicked', [
                      `expertise:${expertise}`
                    ])
                  "
                  >{{ expertiseLabel }}</NuxtLink
                >
              </AsideItem>
              <AsideItem
                v-if="demographics && demographics.length"
                class="demographics"
                label="Demographics"
                icon="chart-pie"
              >
                <template v-for="(demographic, index) in demographics" :key="index">
                  <NuxtLink
                    class="demographic"
                    :to="
                      getSettingLinkUrl('rootResource', {
                        'refinementList[demographics][0]': demographic
                      })
                    "
                    @click="
                      algoliaSendClickFilters('Demographic Clicked', [
                        `demographics:${demographic}`
                      ])
                    "
                    >{{ demographic }}</NuxtLink
                  ><template v-if="demographics.length > index + 1"
                    >,
                  </template>
                </template>
              </AsideItem>
              <AsideItem
                v-if="landHistoryTopics && landHistoryTopics.length"
                class="land-history-topics"
                label="Land History Topics"
                icon="timeline-arrow"
              >
                <template
                  v-for="(landHistoryTopic, index) in landHistoryTopics"
                  :key="index"
                >
                  <NuxtLink
                    class="land-history-topic"
                    :to="
                      getSettingLinkUrl('rootResource', {
                        'refinementList[landHistoryTopics][0]': landHistoryTopic
                      })
                    "
                    @click="
                      algoliaSendClickFilters('Land History Topic Clicked', [
                        `landHistoryTopics:${landHistoryTopic}`
                      ])
                    "
                    >{{ landHistoryTopic }}</NuxtLink
                  ><template v-if="landHistoryTopics.length > index + 1"
                    >,
                  </template>
                </template>
              </AsideItem>
              <AsideItem
                v-if="sys.tag_list && sys?.tag_list.length"
                class="tags"
                label="Tags"
                icon="tag"
              >
                <template v-for="(tag, index) in sys?.tag_list" :key="index">
                  <NuxtLink
                    class="tag"
                    :to="
                      getSettingLinkUrl('rootResource', {
                        'refinementList[tags][0]': tag
                      })
                    "
                    @click="
                      algoliaSendClickFilters('Tag Clicked', [`tags:${tag}`])
                    "
                    >{{ tag }}</NuxtLink
                  ><template v-if="sys?.tag_list.length > index + 1"
                    >,
                  </template>
                </template>
              </AsideItem>
            </template>
          </Aside>
          <div class="mt-6 text-center">
            <div class="inline-block pr-3 text-left">
              <Field
                label="Questions?"
                icon="comment"
                :display-inline="true"
                :tight="true"
              >
                <ButtonComponent
                  :link="getSettingLinkUrl('rootForum')"
                  name="Join the conversation"
                  icon="arrow-up-right-from-square"
                  variation="link"
                  size="small"
                />
              </Field>
            </div>
          </div>
        </aside>
      </div>
      <div
        v-if="
          inStoryblokVisualEditor &&
          (hasRegistrationContent || hasProductContent)
        "
        class="p-4 bg-white border-2 border-black rounded"
      >
        <FormField
          label="Purchased content"
          description="Display registration and product purchased content"
          inline
        >
          <ToggleSwitch
            :active="storyblokVisualEditorUserPurchasedContent"
            @update:active="storyblokVisualEditorUserPurchasedContent = $event"
          />
        </FormField>
      </div>
      <LayoutSection
        v-if="showContentTab || showRelatedResourcesTab"
        id="content-related-resources"
        class="resource-main"
        :id-name="tabs.map((tab) => tab.title).join(' & ')"
        top-edge="shadow-top"
      >
        <Tabs
          :tabs="tabs"
          :active-tab-changes-url="true"
          :alternate-style="true"
        >
          <template #tab="{ id }">
            <!-- Content -->
            <template v-if="id === 'content'">
              <!-- If: User or Storyblok visual editor user purchased registration/product and associated content exists -->
              <template v-if="
                hasUserPurchasedContent ||
                hasStoryblokVisualEditorUserPurchasedContent
              ">
                <!-- Registration content (purchased) -->
                <template
                  v-if="
                    (userPurchasedRegistration ||
                      storyblokVisualEditorUserPurchasedRegistration) &&
                    hasRegistrationContent
                  "
                >
                  <template v-for="(registration, index) in registrations">
                    <Blocks
                      v-if="registration.content && registration.content.length"
                      :key="`registration-${index}`"
                      :blocks="registration.content"
                    />
                  </template>
                </template>
                <!-- Product content (purchased) -->
                <template
                  v-if="
                    (userPurchasedProduct ||
                      storyblokVisualEditorUserPurchasedProduct) &&
                    hasProductContent
                  "
                >
                  <template v-for="(product, index) in products">
                    <Blocks
                      v-if="product.content && product.content.length"
                      :key="`product-${index}`"
                      :blocks="product.content"
                    />
                  </template>
                </template>
              </template>
              <!-- Else: Content and content assets -->
              <template v-else-if="hasContent || hasContentAssetsPDF">
                <Notice
                  v-if="accessIsLimited && !userHasAccess"
                  icon="lock"
                  size="large"
                >
                  Membership Required
                  <template #description
                    >This resource is a Land Trust Alliance member benefit for
                    the staff, board and volunteers of land trust and affiliate
                    member organizations, and Alliance donors at the Protector
                    level.</template
                  >
                  <template #footer>
                    <div class="flex flex-wrap justify-center gap-4">
                      <ButtonComponent
                        v-if="!loggedIn"
                        link="/login"
                        name="Log In"
                        icon="arrow-right"
                        @click.prevent="signIn()"
                      />
                      <ButtonComponent
                        v-if="getSettingLinkUrl('rootMembership')"
                        :link="getSettingLinkUrl('rootMembership')"
                        name="Learn about membership"
                        variation="outline"
                      />
                      <ButtonComponent
                        v-if="getSettingLinkUrl('rootDonate')"
                        :link="getSettingLinkUrl('rootDonate')"
                        name="Become a donor"
                        variation="outline"
                      />
                    </div>
                  </template>
                </Notice>
                <!-- Content -->
                <Blocks v-else-if="hasContent && Array.isArray(content)" :blocks="content" />
                <!-- Content assets -->
                <template v-else-if="hasContentAssetsPDF">
                  <template v-for="(asset, index) in contentAssets">
                    <AssetPDF
                      v-if="assetType(asset.filename) === 'pdf'"
                      :key="index"
                      :asset="asset"
                    />
                  </template>
                </template>
              </template>
            </template>

            <!-- Related resources -->
            <template v-if="id === 'related-resources'">
              <Blocks v-if="hasAnyRelatedResources">
                <div
                  v-if="hasRelatedResources || hasRelatedResourcesFromAlgolia"
                  class="related-resources"
                >
                  <aside class="sidebar">
                    <RichText size="small">
                      <h3>Explore related resources</h3>
                    </RichText>
                  </aside>
                  <div class="content">
                    <ItemList
                      v-if="hasRelatedResources"
                      :show-source-pagination="true"
                      :source="relatedResources!.join(',')"
                      :source-item-template="{ type: 'card-horizontal' }"
                    />
                    <ItemList v-else-if="hasRelatedResourcesFromAlgolia">
                      <ItemResource
                        v-for="resource in relatedResourcesFromAlgolia"
                        :key="resource.objectID"
                        type="card-horizontal"
                        :source="
                          transform.resourceAlgoliaToStoryblok(resource)
                        "
                      />
                    </ItemList>
                  </div>
                </div>
                <AlgoliaResources
                  v-if="hasRelatedResourcesByFilter"
                  title="Explore related resources"
                  title-tag="h3"
                  :topic="relatedResourcesByTopic"
                  :type="relatedResourcesByType"
                  :expertise="relatedResourcesByExpertise"
                  :regions="relatedResourcesByRegions"
                  :demographics="relatedResourcesByDemographics"
                  :tags="relatedResourcesByTags"
                  :display-filters="[
                    'topics',
                    'type',
                    'expertise',
                    'regions',
                    'tags',
                    'internal',
                    'priceMemberFree'
                  ]"
                  :disable-history="true"
                />
              </Blocks>
            </template>
          </template>
        </Tabs>
        <UserActions class="resource-main-footer">
          <Like :object-id="sys?.uuid" />
          <Bookmark :object-id="sys?.uuid" />
        </UserActions>
      </LayoutSection>
    </Blocks>
  </div>
</template>

<script setup lang="ts">
import { type ResourceProps, types } from '~/composables/content-types/useResource'
import { useSettingsStore } from '~/stores/settings'
import { useSiteStore } from '~/stores/site'

const props = withDefaults(defineProps<ResourceProps>(), {
  type: types.DOCUMENT.key
})
const attrs = useAttrs()
const emit = defineEmits(['algolia-send-event'])

const { loggedIn, user, signIn } = useLtaAuth()

const {
  accessIsLimited,
  userHasAccess
} = useAccess({ access: props.access, accessGroups: props.accessGroups }, user.value)

const {
  // Refs
  relatedResourcesFromAlgolia,
  storyblokVisualEditorUserPurchasedContent,

  // Computed
  rootType,
  resourceType,
  isEvent,
  hasImage,
  hasDescription,
  hasContent,
  hasContentAssetsPDF,
  hasRegistrationContent,
  hasProductContent,
  hasRelatedResources,
  hasRelatedResourcesFromAlgolia,
  hasRelatedResourcesByFilter,
  hasAnyRelatedResources,
  userPurchasedRegistration,
  userPurchasedProduct,
  hasUserPurchasedContent,
  storyblokVisualEditorUserPurchasedRegistration,
  storyblokVisualEditorUserPurchasedProduct,
  hasStoryblokVisualEditorUserPurchasedContent,
  publishDate,
  publishDateFormatted,
  displayPublishDate,
  reviewDateFormatted,
  copyright,
  excerptIsHTML,
  excerptAsRichText,
  expertiseLabel,
  startToEndDateFormatted,
  webinarPassLabel,

  // Functions
  assetType,
  assetTypeIcon,
  fetchRelatedResourcesFromAlgolia,
  algoliaSendClick,
  algoliaSendView,
  algoliaSendClickFilters
} = useResource(props, { attrs, emit })

const { getSettingLinkUrl } = storeToRefs(useSettingsStore())

const { inStoryblokVisualEditor } = storeToRefs(useSiteStore())

const showContentTab = computed(() => {
  return (
    hasUserPurchasedContent.value ||
    hasStoryblokVisualEditorUserPurchasedContent.value ||
    hasContent.value ||
    hasContentAssetsPDF.value
  )
})

const showRelatedResourcesTab = computed(() => {
  return hasAnyRelatedResources.value
})

const tabs = computed(() => {
  const tabs = []

  if (showContentTab.value) {
    tabs.push({ id: 'content', title: resourceType.value.label })
  }

  if (showRelatedResourcesTab.value) {
    tabs.push({ id: 'related-resources', title: 'Related Resources' })
  }

  return tabs
})

onMounted(async () => {
  algoliaSendView('Resource Viewed')

  if (!hasRelatedResources.value) {
    await fetchRelatedResourcesFromAlgolia()
  }
})
</script>

<style lang="postcss" scoped>
.resource {
  :deep(&-heading) {
    .user-actions {
      @apply justify-end -mx-3 -mt-6 mb-4 sm:float-right;
    }

    .label {
      @apply flex items-center flex-wrap gap-6;

      .type {
        @apply flex items-center gap-3;

        &-icon {
          @apply -my-2;

          .icon {
            @apply text-white;
          }
        }

        &-label {
          @apply text-accent text-xs font-bold leading-none uppercase tracking-wide;
        }
      }

      .featured,
      .webinar-pass {
        @apply inline-block px-3 py-1 text-2xs text-white font-bold leading-none uppercase tracking-wide bg-heading rounded-full;
      }

      .webinar-pass {
        @apply text-heading bg-black-200-solid;
      }
    }

    .description {
      @apply flex flex-wrap items-center gap-6;

      .publish-date {
        @apply text-body-2;
      }

      .review-date {
        @apply text-accent text-sm;

        svg[data-icon] {
          @apply relative top-px mr-1;
        }
      }
    }
  }

  &-details {
    @apply grid gap-12 grid-cols-1 lg:grid-cols-12 pt-8 border-t border-black-200;

    .content {
      @apply lg:col-span-8;
    }

    .sidebar {
      @apply lg:col-span-4 lg:-mt-14;
    }

    :deep(.image-banner) {
      @apply -mt-8 mb-6;

      img {
        @apply rounded-t-none;
      }
    }

    .attributes {
      @apply flex flex-wrap gap-x-12 gap-y-6;
    }

    .image-description {
      @apply mt-12 first:mt-0 after:clear-both after:invisible after:block;

      :deep(.asset-image) {
        @apply w-24 ml-6 mb-2 float-right sm:w-32 md:w-auto lg:ml-0 lg:mr-6 lg:float-left;

        img {
          @apply shadow-double;
        }
      }

      :deep(.rich-text) {
        ol:not([class]),
        ul:not([class]) {
          @apply lg:overflow-hidden;
        }
      }

      .copyright {
        @apply mt-4 text-body-3 text-xs;
      }
    }

    :deep(.sponsors) {
      @apply mt-12 first:mt-0;

      .logo-grid {
        @apply pt-6 border-t border-line;
      }
    }

    :deep(.resource-actions) {
      @apply flex flex-col gap-4;

      .action-group {
        @apply flex flex-col gap-4 p-4 border border-accent rounded-sm;
      }

      .action {
        @apply text-center;

        .button.variation-solid,
        .button.variation-outline {
          @apply w-full;
        }

        &-description {
          @apply mt-2 px-2 text-body-3 text-xs first:mt-0;

          a:not(.button) {
            @apply underline hover:text-accent;
            text-decoration-color: theme('colors.accent');
          }
        }

        hr {
          @apply my-4 border-line-2;
        }
      }
    }

    .topics,
    .tags,
    .regions,
    .expertise,
    .demographics,
    .land-history-topics {
      @apply text-sm;

      li {
        @apply leading-tight;
      }

      a {
        @apply underline hover:text-accent;
        text-decoration-color: theme('colors.accent');
      }
    }

    .topic {
      @apply mt-2 first:mt-0;

      &-child {
        @apply relative pl-6;

        &-icon {
          @apply absolute left-0 top-[2px] text-body-3 text-xs;
        }
      }
    }
  }

  &-main {
    :deep(.tabs) {
      @apply -mt-24;

      > .tabs-nav {
        @apply -translate-y-1/2;

        .nav {
          @apply mx-auto;
        }
      }

      .tabs-tab-main {
        > .blocks {
          @apply mt-12 pt-12 border-t border-line first:mt-0 first:pt-0 first:border-none;
        }
      }
    }

    &-footer {
      @apply flex justify-center pt-6 border-t border-black-200;
    }
  }

  .related-resources {
    @apply grid gap-12 grid-cols-1 xl:grid-cols-12;

    .sidebar {
      @apply xl:col-span-3;

      :deep(.rich-text) {
        @apply lg:sticky lg:top-12;
      }
    }

    .content {
      @apply xl:col-span-9;
    }
  }
}
</style>
