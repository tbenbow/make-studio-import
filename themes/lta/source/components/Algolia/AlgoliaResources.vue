<template>
  <ais-instant-search
    ref="instantSearch"
    v-editable="$props"
    class="algolia-resources"
    :index-name="indexName"
    :search-client="$algolia.client"
    :search-function="searchFunction"
    :routing="routing"
    :future="future"
    :insights="true"
  >
    <ais-configure v-bind="configure" />
    <Heading
      v-if="title !== false"
      :title="title || 'Explore Resources'"
      :title-tag="titleTag"
    />
    <div class="search">
      <div class="search-main">
        <ais-search-box
          ref="searchBox"
          :class-names="{
            'ais-SearchBox': 'flex-1 max-w-cols-6',
            'ais-SearchBox-form': 'relative',
            'ais-SearchBox-input': '!h-12 !pr-18 !text-base !rounded-full',
            'ais-SearchBox-submit':
              'absolute top-1/2 right-[1rem] -translate-y-1/2 text-base text-black-600 hover:text-accent',
            'ais-SearchBox-reset':
              'absolute top-1/2 right-[3rem] -translate-y-1/2 text-base text-black-600 hover:text-accent'
          }"
          placeholder="Search resources…"
        >
          <template #submit-icon>
            <font-awesome-icon :icon="['fal', 'magnifying-glass']" />
          </template>
          <template #reset-icon>
            <font-awesome-icon :icon="['fal', 'xmark']" />
          </template>
        </ais-search-box>
        <!-- <span v-tooltip="'Here are some search tips.'" class="search-tooltip">
          <font-awesome-icon
            class="search-tooltip-icon"
            :icon="['fal', 'circle-question']"
          />
          Tips
        </span> -->
      </div>
      <aside class="search-aside">
        <Field
          label="Questions?"
          icon="comment"
          :display-inline="true"
          :tight="true"
        >
          <ButtonComponent
            :link="getSettingLinkUrl('rootForum')"
            name="Ask in the forum"
            icon="arrow-up-right-from-square"
            variation="link"
            size="small"
          />
        </Field>
      </aside>
    </div>
    <div class="main">
      <aside class="sidebar">
        <ButtonComponent
          class="lg:!hidden"
          :name="isShowingFilters ? 'Hide filters' : 'Show filters'"
          icon="sliders"
          :icon-position-reverse="true"
          variation="link"
          size="small"
          @click="isShowingFilters = !isShowingFilters"
        />
        <div v-show="isShowingFilters" class="filters lg:!block">
          <RefineGroup :column="true">
            <!-- Topic -->
            <ais-current-refinements
              v-if="displayFilter('topics')"
              :included-attributes="virtualWidgets.topics.options.attributes"
            >
              <template #default="{ items }">
                <Refine
                  name="Topic"
                  icon="sitemap"
                  :panel="true"
                  :is-on="items.length ? true : false"
                >
                  <ais-hierarchical-menu
                    :attributes="virtualWidgets.topics.options.attributes"
                    :show-more="true"
                    :sort-by="sortBy.topics"
                  >
                    <template
                      #default="{
                        items: itemsTopics,
                        canToggleShowMore,
                        isShowingMore,
                        refine,
                        toggleShowMore,
                        createURL
                      }"
                    >
                      <ais-hierarchical-menu-list
                        :items="itemsTopics"
                        :refine="refine"
                        :create-u-r-l="createURL"
                      />
                      <ButtonComponent
                        v-if="canToggleShowMore"
                        class="mt-4"
                        :name="isShowingMore ? 'Show less' : 'Show more'"
                        size="small"
                        variation="link"
                        :icon="isShowingMore ? 'angle-up' : 'angle-down'"
                        :disabled="!canToggleShowMore"
                        @click="toggleShowMore()"
                      />
                    </template>
                  </ais-hierarchical-menu>
                  <template #footer="{ isOn }">
                    <ButtonComponent
                      v-if="isOn"
                      variation="link"
                      name="Reset"
                      :icon="null"
                      size="small"
                      @click.prevent="clearRefinements(items)"
                    />
                  </template>
                </Refine>
              </template>
            </ais-current-refinements>

            <!-- Type -->
            <ais-current-refinements
              v-if="displayFilter('type')"
              :included-attributes="virtualWidgets.type.options.attributes"
            >
              <template #default="{ items }">
                <Refine
                  name="Type"
                  icon="file"
                  :panel="true"
                  :is-on="items.length ? true : false"
                >
                  <ais-hierarchical-menu
                    :attributes="virtualWidgets.type.options.attributes"
                    :transform-items="transformItemsType"
                  >
                    <template
                      #default="{
                        items: itemsType,
                        canToggleShowMore,
                        isShowingMore,
                        refine,
                        toggleShowMore,
                        createURL
                      }"
                    >
                      <ais-hierarchical-menu-list
                        :items="itemsType"
                        :refine="refine"
                        :create-u-r-l="createURL"
                      />
                      <ButtonComponent
                        v-if="canToggleShowMore"
                        class="mt-6"
                        :name="isShowingMore ? 'Show less' : 'Show more'"
                        size="small"
                        variation="link"
                        :icon="isShowingMore ? 'angle-up' : 'angle-down'"
                        :disabled="!canToggleShowMore"
                        @click="toggleShowMore()"
                      />
                    </template>
                  </ais-hierarchical-menu>
                  <template #footer="{ isOn }">
                    <ButtonComponent
                      v-if="isOn"
                      variation="link"
                      name="Reset"
                      :icon="null"
                      size="small"
                      @click.prevent="clearRefinements(items)"
                    />
                  </template>
                </Refine>
              </template>
            </ais-current-refinements>

            <!-- Expertise -->
            <ais-current-refinements
              v-if="displayFilter('expertise')"
              :included-attributes="['expertise']"
            >
              <template #default="{ items }">
                <Refine
                  name="Expertise"
                  icon="head-side-brain"
                  :panel="true"
                  :is-on="items.length ? true : false"
                >
                  <ais-refinement-list
                    attribute="expertise"
                    :transform-items="transformItemsExpertise"
                  >
                    <template #default="{ items: menuItems, refine }">
                      <ul
                        v-if="menuItems && menuItems.length"
                        class="flex flex-col space-y-2"
                      >
                        <li v-for="item in menuItems" :key="item.value">
                          <FormCheckbox
                            :name="item.label"
                            :value="item.value"
                            :label="item.label"
                            :checked="item.isRefined"
                            @change="refine(item.value)"
                          >
                            <template #label="{ label }"
                              ><span>{{ label }}</span>
                              <Pill>{{
                                item.count.toLocaleString()
                              }}</Pill></template
                            >
                          </FormCheckbox>
                        </li>
                      </ul>
                    </template>
                  </ais-refinement-list>
                  <template #footer="{ isOn }">
                    <ButtonComponent
                      v-if="isOn"
                      variation="link"
                      name="Reset"
                      :icon="null"
                      :panel="true"
                      size="small"
                      @click.prevent="clearRefinements(items)"
                    />
                  </template>
                </Refine>
              </template>
            </ais-current-refinements>

            <!-- Region -->
            <ais-current-refinements
              v-if="displayFilter('regions')"
              :included-attributes="['regions']"
            >
              <template #default="{ items }">
                <Refine
                  name="Region"
                  icon="map"
                  :panel="true"
                  :is-on="items.length ? true : false"
                >
                  <ais-refinement-list attribute="regions">
                    <template #default="{ items: menuItems, refine }">
                      <ul
                        v-if="menuItems && menuItems.length"
                        class="flex flex-col space-y-2"
                      >
                        <li v-for="item in menuItems" :key="item.value">
                          <FormCheckbox
                            :name="item.label"
                            :value="item.value"
                            :label="item.label"
                            :checked="item.isRefined"
                            @change="refine(item.value)"
                          >
                            <template #label="{ label }"
                              ><span>{{ label }}</span>
                              <Pill>{{
                                item.count.toLocaleString()
                              }}</Pill></template
                            >
                          </FormCheckbox>
                        </li>
                      </ul>
                    </template>
                  </ais-refinement-list>
                  <template #footer="{ isOn }">
                    <ButtonComponent
                      v-if="isOn"
                      variation="link"
                      name="Reset"
                      :icon="null"
                      size="small"
                      @click.prevent="clearRefinements(items)"
                    />
                  </template>
                </Refine>
              </template>
            </ais-current-refinements>

            <!-- Demographics -->
            <ais-current-refinements
              v-if="displayFilter('demographics')"
              :included-attributes="['demographics']"
            >
              <template #default="{ items }">
                <Refine
                  name="Demographic"
                  icon="chart-pie"
                  :panel="true"
                  :is-on="items.length ? true : false"
                >
                  <ais-refinement-list attribute="demographics">
                    <template #default="{ items: menuItems, refine }">
                      <ul
                        v-if="menuItems && menuItems.length"
                        class="flex flex-col space-y-2"
                      >
                        <li v-for="item in menuItems" :key="item.value">
                          <FormCheckbox
                            :name="item.label"
                            :value="item.value"
                            :label="item.label"
                            :checked="item.isRefined"
                            @change="refine(item.value)"
                          >
                            <template #label="{ label }"
                              ><span>{{ label }}</span>
                              <Pill>{{
                                item.count.toLocaleString()
                              }}</Pill></template
                            >
                          </FormCheckbox>
                        </li>
                      </ul>
                    </template>
                  </ais-refinement-list>
                  <template #footer="{ isOn }">
                    <ButtonComponent
                      v-if="isOn"
                      variation="link"
                      name="Reset"
                      :icon="null"
                      size="small"
                      @click.prevent="clearRefinements(items)"
                    />
                  </template>
                </Refine>
              </template>
            </ais-current-refinements>

            <!-- Land History Topics -->
            <ais-current-refinements
              v-if="displayFilter('landHistoryTopics')"
              :included-attributes="['landHistoryTopics']"
            >
              <template #default="{ items }">
                <Refine
                  name="Land History Topic"
                  icon="timeline-arrow"
                  :panel="true"
                  :is-on="items.length ? true : false"
                >
                  <ais-refinement-list attribute="landHistoryTopics">
                    <template #default="{ items: menuItems, refine }">
                      <ul
                        v-if="menuItems && menuItems.length"
                        class="flex flex-col space-y-2"
                      >
                        <li v-for="item in menuItems" :key="item.value">
                          <FormCheckbox
                            :name="item.label"
                            :value="item.value"
                            :label="item.label"
                            :checked="item.isRefined"
                            @change="refine(item.value)"
                          >
                            <template #label="{ label }"
                              ><span>{{ label }}</span>
                              <Pill>{{
                                item.count.toLocaleString()
                              }}</Pill></template
                            >
                          </FormCheckbox>
                        </li>
                      </ul>
                    </template>
                  </ais-refinement-list>
                  <template #footer="{ isOn }">
                    <ButtonComponent
                      v-if="isOn"
                      variation="link"
                      name="Reset"
                      :icon="null"
                      size="small"
                      @click.prevent="clearRefinements(items)"
                    />
                  </template>
                </Refine>
              </template>
            </ais-current-refinements>

            <!-- Tag -->
            <ais-current-refinements
              v-if="displayFilter('tags')"
              :included-attributes="['tags']"
            >
              <template #default="{ items }">
                <Refine
                  name="Tag"
                  icon="tag"
                  :panel="true"
                  :is-on="items.length ? true : false"
                >
                  <ais-refinement-list attribute="tags" :searchable="true">
                    <template
                      #default="{ items: menuItems, refine, searchForItems }"
                    >
                      <input
                        class="mb-4"
                        placeholder="Search tags…"
                        @input="searchForItems($event.currentTarget.value)"
                      />
                      <ul
                        v-if="menuItems && menuItems.length"
                        class="flex flex-col space-y-2"
                      >
                        <li v-for="item in menuItems" :key="item.value">
                          <FormCheckbox
                            :name="item.label"
                            :value="item.value"
                            :label="item.label"
                            :checked="item.isRefined"
                            @change="refine(item.value)"
                          >
                            <template #label="{ label }"
                              ><span>{{ label }}</span>
                              <Pill>{{
                                item.count.toLocaleString()
                              }}</Pill></template
                            >
                          </FormCheckbox>
                        </li>
                      </ul>
                    </template>
                  </ais-refinement-list>
                  <template #footer="{ isOn }">
                    <ButtonComponent
                      v-if="isOn"
                      variation="link"
                      name="Reset"
                      :icon="null"
                      size="small"
                      @click.prevent="clearRefinements(items)"
                    />
                  </template>
                </Refine>
              </template>
            </ais-current-refinements>

            <!-- Internal -->
            <ais-toggle-refinement
              v-if="displayFilter('internal')"
              attribute="internal"
              label="Display only content created by Land Trust Alliance"
            >
              <template #default="{ value, refine, canRefine }">
                <FormField
                  class="mt-2 px-4 py-1"
                  label="Display only content created by Land Trust Alliance"
                  label-class="text-body text-xs normal-case tracking-normal"
                  :disabled="!canRefine"
                  inline
                >
                  <template #default="{ disabled, inputId }">
                    <ToggleSwitch
                      :active="value.isRefined"
                      :input-name="value.name"
                      :input-id="inputId"
                      :disabled="disabled"
                      @update:active="refine(value)"
                    />
                  </template>
                </FormField>
              </template>
            </ais-toggle-refinement>

            <!-- priceMemberFree -->
            <ais-toggle-refinement
              v-if="displayFilter('priceMemberFree')"
              attribute="priceMemberFree"
              label="Display only content that is complimentary for members"
            >
              <template #default="{ value, refine, canRefine }">
                <FormField
                  class="px-4 py-1"
                  label="Display only content that is complimentary for members"
                  label-class="text-body text-xs normal-case tracking-normal"
                  :disabled="!canRefine"
                  inline
                >
                  <template #default="{ disabled, inputId }">
                    <ToggleSwitch
                      :active="value.isRefined"
                      :input-name="value.name"
                      :input-id="inputId"
                      :disabled="disabled"
                      @update:active="refine(value)"
                    />
                  </template>
                </FormField>
              </template>
            </ais-toggle-refinement>
          </RefineGroup>
        </div>
      </aside>

      <div class="content">
        <RefineBar ref="refineBar">
          <ais-stats>
            <template #default="{ nbHits }">
              Found {{ nbHits }} resources
            </template>
          </ais-stats>
          <ais-clear-refinements>
            <template #default="{ canRefine, refine }">
              <ButtonComponent
                v-if="canRefine"
                name="Reset All"
                icon="arrow-rotate-left"
                variation="link"
                @click="
                  ($event) => {
                    refine()
                    $refs.searchBox.$el.querySelector('form').reset()
                  }
                "
              />
            </template>
            <template #resetLabel>&nbsp;</template>
          </ais-clear-refinements>
          <template #aside>
            <ais-sort-by
              :items="[
                { label: 'Most Relevant', value: indexName },
                { label: 'Most Recent', value: indexNameReplica('recent') }
              ]"
            >
              <template #default="{ items, currentRefinement, refine }">
                <FormField
                  label="Sort"
                  :inline="true"
                  :inputs="[
                    {
                      component: 'FormSelect',
                      name: 'Sort',
                      value: currentRefinement,
                      options: items,
                      hideEmptyOption: true
                    }
                  ]"
                  @change="refine($event.target.value)"
                />
              </template>
            </ais-sort-by>
            <ais-hits-per-page
              :items="[
                { label: '20 per page', value: 20, default: true },
                { label: '50 per page', value: 50 },
                { label: '100 per page', value: 100 }
              ]"
            />
          </template>
        </RefineBar>

        <NoticeLoading v-if="!initialized" :panel="true" />
        <ais-hits v-else class="grid gap-12 grid-cols-1 mt-8">
          <template #default="{ items, sendEvent }">
            <template v-if="items && items.length">
              <template v-for="item in items" :key="item.objectID">
                <ItemResource
                  type="card-horizontal"
                  :source="transform.resourceAlgoliaToStoryblok(item)"
                  :link-params="{ queryID: item.__queryID }"
                  @algolia-send-event="
                    (eventType, eventName) =>
                      sendEvent(eventType, item, eventName)
                  "
                />
              </template>
            </template>
            <Notice v-else :panel="true">No resources found</Notice>
          </template>
        </ais-hits>

        <ais-pagination class="mt-12">
          <template
            #default="{ currentRefinement: currentPage, nbPages, refine }"
          >
            <Pagination
              :current-page="currentPage + 1"
              :total-pages="nbPages"
              @update:currentPage="
                (toPage) => {
                  refine(toPage - 1)
                  $refs.refineBar.$el.scrollIntoView()
                }
              "
            />
          </template>
        </ais-pagination>
      </div>
    </div>
  </ais-instant-search>
</template>

<script>
import {
  AisClearRefinements,
  AisConfigure,
  AisCurrentRefinements,
  AisHierarchicalMenu,
  AisHits,
  AisHitsPerPage,
  AisInstantSearch,
  AisPagination,
  AisRefinementList,
  AisSearchBox,
  AisSortBy,
  AisStats,
  AisToggleRefinement
} from 'vue-instantsearch/vue3/es'
import {
  connectHierarchicalMenu,
  connectRefinementList,
  connectSearchBox,
  connectToggleRefinement
} from 'instantsearch.js/es/connectors'
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import InstantSearchMixin from '@/mixins/InstantSearch.mixin'
import { expertises, types } from '~/composables/content-types/useResource'

export default {
  components: {
    AisClearRefinements,
    AisConfigure,
    AisCurrentRefinements,
    AisHierarchicalMenu,
    AisHits,
    AisHitsPerPage,
    AisInstantSearch,
    AisPagination,
    AisRefinementList,
    AisSearchBox,
    AisSortBy,
    AisStats,
    AisToggleRefinement
  },
  mixins: [InstantSearchMixin],
  props: {
    title: [String, Boolean],
    titleTag: String,
    topic: [Object, Array, String],
    type: [Array, String],
    expertise: String,
    regions: Array,
    demographics: Array,
    landHistoryTopics: Array,
    tags: String,
    displayFilters: Array,
    _editable: String
  },
  data() {
    return {
      indexNameBase: 'resources',
      configure: {
        filters: undefined
      },
      virtualWidgets: {
        query: connectSearchBox(() => null),
        topics: {
          options: {
            attributes: ['topics.lvl0', 'topics.lvl1']
          },
          widget: connectHierarchicalMenu(() => null)
        },
        type: {
          options: {
            attributes: ['type.lvl0', 'type.lvl1']
          },
          widget: connectHierarchicalMenu(() => null)
        },
        expertise: connectRefinementList(() => null),
        regions: connectRefinementList(() => null),
        demographics: connectRefinementList(() => null),
        landHistoryTopics: connectRefinementList(() => null),
        tags: connectRefinementList(() => null),
        internal: connectToggleRefinement(() => null),
        priceMemberFree: connectToggleRefinement(() => null)
      },
      sortBy: {
        topics: ['isRefined', 'name']
      },
      transformItem: {
        type: (item = {}) => {
          const type = Object.values(types).find(
            (type) => type.key === item.value
          )

          return {
            ...item,
            label: type ? type.label : item.label,
            data: item.data?.length
              ? item.data.map((dataItem) => this.transformItem.type(dataItem))
              : item.data
          }
        },
        expertise: (item = {}) => {
          return {
            ...item,
            label:
              item.value in expertises ? expertises[item.value] : item.label
          }
        }
      },
      isShowingFilters: false
    }
  },
  computed: {
    ...mapState(useSettingsStore, ['getSettingLinkUrl']),
    filters() {
      const filters = []

      if (this.topicComputed && this.topicComputed.length) {
        // topics.lvl1:"Acquisition > Due diligence"
        filters.push(
          `topics.lvl${
            this.topicComputed.length - 1
          }:"${this.topicComputed.join(' > ')}"`
        )
      }

      if (this.typeComputed && this.typeComputed.length) {
        // type.lvl1:"document > legal-opinion"
        filters.push(
          `type.lvl${this.typeComputed.length - 1}:"${this.typeComputed.join(
            ' > '
          )}"`
        )
      }

      if (this.expertise) {
        // expertise:2
        filters.push(`expertise:${this.expertise}`)
      }

      if (this.regions && this.regions.length) {
        // (regions:"Southeast" OR regions:"West")
        filters.push(
          '(' +
            Array.from(this.regions, (region) => `regions:"${region}"`).join(
              ' OR '
            ) +
            ')'
        )
      }

      if (this.demographics && this.demographics.length) {
        // (demographics:"Age" OR demographics:"Disability")
        filters.push(
          '(' +
            Array.from(
              this.demographics,
              (demographic) => `demographics:"${demographic}"`
            ).join(' OR ') +
            ')'
        )
      }

      if (this.landHistoryTopics && this.landHistoryTopics.length) {
        // (landHistoryTopics:"Culture" OR landHistoryTopics:"Impacts")
        filters.push(
          '(' +
            Array.from(
              this.landHistoryTopics,
              (landHistoryTopic) => `landHistoryTopics:"${landHistoryTopic}"`
            ).join(' OR ') +
            ')'
        )
      }

      if (this.tagsComputed && this.tagsComputed.length) {
        // (tags:"example" OR tags:"other example")
        filters.push(
          '(' +
            Array.from(this.tagsComputed, (tag) => `tags:"${tag}"`).join(
              ' OR '
            ) +
            ')'
        )
      }

      return filters.join(' AND ')
    },
    topicComputed() {
      const topic = []

      if (this.topic?.name) {
        if (this.topic.content?.parent) {
          topic.push(this.topic.content.parent.name)
        }
        topic.push(this.topic.name)
      } else if (Array.isArray(this.topic) && this.topic.length) {
        topic.push(...this.topic)
      } else if (typeof this.topic === 'string' && this.topic) {
        topic.push(this.topic)
      }

      return topic.length ? topic : undefined
    },
    typeComputed() {
      const type = []

      if (Array.isArray(this.type) && this.type.length) {
        type.push(...this.type)
      } else if (typeof this.type === 'string' && this.type) {
        type.push(...this.type.split(' > '))
      }

      return type.length ? type : undefined
    },
    tagsComputed() {
      return this.tags
        ? this.tags
            .split(',')
            .filter((tag) => tag)
            .map((tag) => tag.trim())
        : undefined
    }
  },
  created() {
    this.configure.filters = this.filters
  },
  methods: {
    displayFilter(filter) {
      return !!(
        lodash.isEmpty(this.displayFilters) ||
        (Array.isArray(this.displayFilters) &&
          this.displayFilters.includes(filter))
      )
    },
    transformItemsType(items) {
      return items.map((item) => this.transformItem.type(item))
    },
    transformItemsExpertise(items) {
      return items.map((item) => this.transformItem.expertise(item))
    }
  }
}
</script>

<style lang="postcss" scoped>
.algolia-resources {
}

:deep(.heading) {
  @apply mb-6;
}

.search {
  @apply flex items-center gap-6;

  &-main {
    @apply flex-1 flex items-center gap-x-6 gap-y-2;
  }

  &-aside {
    @apply hidden md:block;
  }

  &-tooltip {
    @apply flex-shrink-0 text-xs hover:text-accent cursor-help;

    &-icon {
      @apply mr-1 text-accent;
    }
  }
}

.main {
  @apply grid grid-cols-1 mt-3 lg:grid-cols-12 lg:gap-12 lg:mt-0;

  .sidebar {
    @apply lg:col-span-3;

    .filters {
      @apply py-6 lg:sticky lg:top-breadcrumbs-height lg:overflow-auto;

      @screen lg {
        height: calc(
          theme('height.screen') - theme('height.breadcrumbs-height')
        );
      }
    }
  }

  .content {
    @apply mt-6 lg:col-span-9;
  }
}

:deep(.refine-bar) {
  .ais-HitsPerPage {
    @apply hidden md:block;
  }
}

.ais-HierarchicalMenu {
  @apply text-sm;

  :deep(.ais-HierarchicalMenuList) {
    @apply space-y-3;

    ul {
      @apply mt-2 mb-4 pl-4 space-y-2;
    }

    li {
      @apply leading-tight;

      li {
        @apply text-xs;

        a {
          @apply text-body-2;
        }
      }
    }

    a {
      @apply hover:text-accent cursor-pointer;
    }
  }
}
</style>
