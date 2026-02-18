<template>
  <ais-instant-search
    ref="instantSearch"
    v-editable="$props"
    class="algolia-affiliates"
    :index-name="indexName"
    :search-client="$algolia.client"
    :search-function="searchFunction"
    :routing="routing"
    :future="future"
  >
    <ais-configure v-bind="configure" />
    <Heading title="Explore Affiliates" />
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

      <!-- Expertise -->
      <ais-current-refinements :included-attributes="['expertise']">
        <template #default="{ items }">
          <Refine
            name="Expertise"
            :name-on="currentRefinementsString(items)"
            icon="star"
            :is-on="items.length ? true : false"
          >
            <ais-refinement-list
              attribute="expertise"
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
            <ais-menu-select
              attribute="location"
              :limit="100"
              :sort-by="sortBy.location"
              :transform-items="transformItemsLocation"
            />
            <ais-toggle-refinement
              class="mt-6"
              attribute="locationRemote"
              label="Remote Only"
            >
              <template #default="{ value, refine, canRefine }">
                <FormField
                  label="Remote"
                  description="Display only affiliates with remote"
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
    </RefineGroup>

    <RefineBar ref="refineBar" class="mt-6">
      <ais-stats>
        <template #default="{ nbHits }">
          Found {{ nbHits }} affiliates
        </template>
      </ais-stats>
      <template #aside>
        <ais-clear-refinements>
          <template #default="{ canRefine, refine }">
            <ButtonComponent
              v-if="canRefine"
              name="Reset All"
              icon="arrow-rotate-left"
              variation="link"
              @click="refine"
            />
          </template>
          <template #resetLabel>&nbsp;</template>
        </ais-clear-refinements>
      </template>
    </RefineBar>

    <ais-hits class="grid gap-12 grid-cols-1 lg:grid-cols-2 mt-12">
      <template #default="{ items }">
        <template v-for="item in items" :key="item.objectID">
          <ItemAffiliate
            type="card"
            :source="transform.affiliateAlgoliaToStoryblok(item)"
          />
        </template>
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
import states from 'us-state-converter'
import {
  AisClearRefinements,
  AisConfigure,
  AisCurrentRefinements,
  AisHits,
  AisInstantSearch,
  AisMenuSelect,
  AisPagination,
  AisRefinementList,
  AisSearchBox,
  AisStats,
  AisToggleRefinement
} from 'vue-instantsearch/vue3/es'
import {
  connectMenu,
  connectRefinementList,
  connectSearchBox,
  connectToggleRefinement
} from 'instantsearch.js/es/connectors'
import InstantSearchMixin from '@/mixins/InstantSearch.mixin'

export default {
  components: {
    AisClearRefinements,
    AisConfigure,
    AisCurrentRefinements,
    AisHits,
    AisInstantSearch,
    AisMenuSelect,
    AisPagination,
    AisRefinementList,
    AisSearchBox,
    AisStats,
    AisToggleRefinement
  },
  mixins: [InstantSearchMixin],
  props: {
    _editable: String
  },
  data() {
    return {
      indexNameBase: 'affiliates',
      virtualWidgets: {
        query: connectSearchBox(() => null),
        expertise: connectRefinementList(() => null),
        location: connectMenu(() => null),
        locationRemote: connectToggleRefinement(() => null)
      },
      sortBy: {
        location: ['name:asc']
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
    }
  }
}
</script>
