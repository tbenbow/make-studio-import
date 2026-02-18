<template>
  <ais-instant-search
    ref="instantSearch"
    v-editable="$props"
    class="algolia-jobs"
    :index-name="indexName"
    :search-client="$algolia.client"
    :search-function="searchFunction"
    :routing="routing"
    :future="future"
  >
    <ais-configure v-bind="configure" />
    <Heading title="Explore Jobs" />
    <RefineGroup class="mt-6">
      <!-- Search -->
      <ais-current-refinements :included-attributes="['query']">
        <template #default="{ items }">
          <Refine
            icon="magnifying-glass"
            :name-on="currentRefinementsString(items)"
            :is-on="items.length ? true : false"
          >
            <ais-search-box
              ref="searchBox"
              :class-names="{
                'ais-SearchBox-form': 'relative',
                'ais-SearchBox-input': '!pr-18',
                'ais-SearchBox-submit':
                  'absolute top-1/2 -translate-y-1/2 right-[1rem] text-base text-black-600 hover:text-accent',
                'ais-SearchBox-reset':
                  'absolute top-1/2 -translate-y-1/2 right-[3rem] text-base text-black-600 hover:text-accent'
              }"
              placeholder="Search by name…"
            >
              <template #submit-icon>
                <font-awesome-icon :icon="['fal', 'magnifying-glass']" />
              </template>
              <template #reset-icon>
                <font-awesome-icon :icon="['fal', 'xmark']" />
              </template>
            </ais-search-box>
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

      <!-- Location -->
      <ais-current-refinements
        :included-attributes="['location', 'locationRemote']"
      >
        <template #default="{ items }">
          <Refine
            name="Location"
            :name-on="currentRefinementsString(items)"
            icon="location-dot"
            :is-on="items.length ? true : false"
          >
            <ais-refinement-list
              attribute="location"
              :limit="6"
              :show-more="true"
              :show-more-limit="100"
              :sort-by="sortBy.location"
              :transform-items="transformItemsLocation"
            >
              <template
                #default="{
                  canToggleShowMore,
                  isShowingMore,
                  items: menuItems,
                  toggleShowMore,
                  refine
                }"
              >
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
                        <Pill>{{ item.count.toLocaleString() }}</Pill></template
                      >
                    </FormCheckbox>
                  </li>
                </ul>
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
            </ais-refinement-list>
            <ais-toggle-refinement
              class="mt-4 pt-6 border-t border-t-line"
              attribute="locationRemote"
              label="Remote Only"
            >
              <template #default="{ value, refine, canRefine }">
                <FormField
                  label="Remote"
                  description="Display only jobs with remote"
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

      <!-- Category -->
      <ais-current-refinements :included-attributes="['category']">
        <template #default="{ items }">
          <Refine
            name="Category"
            :name-on="currentRefinementsString(items)"
            icon="folder-tree"
            :is-on="items.length ? true : false"
          >
            <ais-refinement-list
              attribute="category"
              :limit="6"
              :show-more="true"
              :show-more-limit="100"
            >
              <template
                #default="{
                  canToggleShowMore,
                  isShowingMore,
                  items: menuItems,
                  refine,
                  toggleShowMore
                }"
              >
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
                        <Pill>{{ item.count.toLocaleString() }}</Pill></template
                      >
                    </FormCheckbox>
                  </li>
                </ul>
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

      <!-- Type -->
      <ais-current-refinements :included-attributes="['type']">
        <template #default="{ items }">
          <Refine
            name="Type"
            :name-on="currentRefinementsString(items)"
            icon="briefcase"
            :is-on="items.length ? true : false"
          >
            <ais-refinement-list attribute="type">
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
                        <Pill>{{ item.count.toLocaleString() }}</Pill></template
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
    </RefineGroup>

    <RefineBar ref="refineBar" class="mt-6">
      <ais-stats>
        <template #default="{ nbHits }"> Found {{ nbHits }} jobs </template>
      </ais-stats>
      <template #aside>
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
        <ais-sort-by
          :items="[
            { label: 'Newest', value: indexName },
            { label: 'Deadline', value: indexNameReplica('deadline') }
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
      </template>
    </RefineBar>

    <ais-hits>
      <template v-slot="{ items }">
        <Expandable
          v-if="filterInternal(items).length"
          class="mt-4"
          title="Explore Careers at the Land Trust Alliance"
          icon="bullhorn"
          :toggled="filterInternal(items).length === items.length"
        >
          <template #after-title>
            <span class="text-body-3 text-2xs uppercase tracking-wide"
              >Found {{ filterInternal(items).length }} open position{{
                filterInternal(items).length === 1 ? '' : 's'
              }}</span
            >
          </template>
          <div class="grid gap-12 grid-cols-1 lg:grid-cols-2 mt-2">
            <ItemJob
              v-for="item in filterInternal(items)"
              :key="item.objectID"
              type="card"
              :source="transform.jobAlgoliaToStoryblok(item)"
            />
          </div>
        </Expandable>

        <div
          v-if="filterNotInternal(items).length"
          class="grid gap-12 grid-cols-1 lg:grid-cols-2 mt-12"
        >
          <template v-for="(item, index) in filterNotInternal(items)" :key="item.objectID">
            <Callout
              v-if="
                index === 6 &&
                blocks &&
                blocks.length &&
                blocks[0].component === 'Callout'
              "
              :key="`${index}-callout`"
              class="lg:col-span-2"
              v-bind="blocks[0]"
            />
            <ItemJob
              type="card"
              :source="transform.jobAlgoliaToStoryblok(item)"
            />
          </template>
        </div>
      </template>
    </ais-hits>

    <ais-pagination class="mt-12">
      <template #default="{ currentRefinement: currentPage, nbPages, refine }">
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
  </ais-instant-search>
</template>

<script>
import {
  AisClearRefinements,
  AisConfigure,
  AisCurrentRefinements,
  AisHits,
  AisInstantSearch,
  AisPagination,
  AisRefinementList,
  AisSearchBox,
  AisSortBy,
  AisStats,
  AisToggleRefinement
} from 'vue-instantsearch/vue3/es'
import {
  connectRefinementList,
  connectSearchBox,
  connectToggleRefinement
} from 'instantsearch.js/es/connectors'
import states from 'us-state-converter'
import InstantSearchMixin from '@/mixins/InstantSearch.mixin'

export default {
  components: {
    AisClearRefinements,
    AisConfigure,
    AisCurrentRefinements,
    AisHits,
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
    blocks: Array,
    _editable: String
  },
  setup() {
    const { getUnixTime, startOfDay } = useDateFns()

    return {
      getUnixTime,
      startOfDay
    }
  },
  data() {
    return {
      indexNameBase: 'jobs',
      configure: {
        filters: `applicationDeadlineTimestamp >= ${this.getUnixTime(
          this.startOfDay(Date.now())
        )}`
      },
      virtualWidgets: {
        query: connectSearchBox(() => null),
        location: connectRefinementList(() => null),
        locationRefinement: connectToggleRefinement(() => null),
        category: connectRefinementList(() => null),
        type: connectRefinementList(() => null)
      },
      sortBy: {
        location: ['isRefined', 'name:asc']
      },
      transformItem: {
        location: (item = {}) => {
          return {
            ...item,
            label: states.fullName(item.label)
          }
        },
        locationRemote: (item = {}) => {
          return {
            ...item,
            label: item.label === 'true' ? 'Remote' : 'false'
          }
        }
      }
    }
  },
  methods: {
    transformItemsLocation(items) {
      return items.map((item) => this.transformItem.location(item))
    },
    filterInternal(items = []) {
      return items.filter((item) => item.internal === true)
    },
    filterNotInternal(items = []) {
      return items.filter((item) => !item.internal)
    }
  }
}
</script>

<style lang="postcss" scoped>
.algolia-jobs {
  :deep(.expandable) {
    .title {
      @apply flex flex-wrap gap-x-4 items-center;
    }

    .content {
      @apply px-0;
    }
  }
}
</style>
