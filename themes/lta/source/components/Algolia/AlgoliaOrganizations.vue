<template>
  <ais-instant-search
    ref="instantSearch"
    v-editable="$props"
    class="algolia-organizations"
    :index-name="indexName"
    :search-client="$algolia.client"
    :search-function="searchFunction"
    :routing="routing"
    :future="future"
  >
    <ais-configure v-bind="configure" />
    <Heading title="Explore Organizations" />
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

      <!-- Type -->
      <ais-current-refinements :included-attributes="['type']">
        <template #default="{ items }">
          <Refine
            name="Type"
            :name-on="currentRefinementsString(items)"
            icon="building"
            :is-on="items.length ? true : false"
          >
            <ais-refinement-list
              attribute="type"
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
      <ais-current-refinements :included-attributes="['region']">
        <template #default="{ items }">
          <Refine
            name="Region"
            :name-on="currentRefinementsString(items)"
            icon="map"
            :is-on="items.length ? true : false"
          >
            <ais-refinement-list
              attribute="region"
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
    </RefineGroup>

    <RefineBar ref="refineBar" class="mt-6">
      <ais-stats>
        <template #default="{ nbHits }">
          Found {{ nbHits }} organizations
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
      <template v-slot="{ items }">
        <template v-for="item in items" :key="item.objectID">
          <ItemOrganization
            type="card"
            :source="transform.organizationAlgoliaToStoryblok(item)"
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
import {
  AisClearRefinements,
  AisConfigure,
  AisCurrentRefinements,
  AisHits,
  AisInstantSearch,
  AisPagination,
  AisRefinementList,
  AisSearchBox,
  AisStats
} from 'vue-instantsearch/vue3/es'
import {
  connectRefinementList,
  connectSearchBox
} from 'instantsearch.js/es/connectors'
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
    AisStats
  },
  mixins: [InstantSearchMixin],
  props: {
    tags: String,
    _editable: String
  },
  data() {
    return {
      indexNameBase: 'organizations',
      configure: {
        filters: undefined
      },
      virtualWidgets: {
        query: connectSearchBox(() => null),
        type: connectRefinementList(() => null),
        region: connectRefinementList(() => null)
      }
    }
  },
  computed: {
    filters() {
      let filters = ''

      if (this.tagsArray && this.tagsArray.length) {
        filters += Array.from(this.tagsArray, (tag) => `tags:"${tag}"`).join(
          ' OR '
        )
      }

      return filters
    },
    tagsArray() {
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
  }
}
</script>
