<template>
  <ais-instant-search
    ref="instantSearch"
    v-editable="$props"
    class="algolia-land-trusts"
    :index-name="indexName"
    :search-client="$algolia.client"
    :search-function="searchFunction"
    :routing="routing"
  >
    <Heading title="Explore Land Trusts" title-tag="h1" />
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

      <ais-configure>
        <template #default="{ refine }">
          <ais-state-results>
            <template
              #default="{
                state: { aroundLatLngViaIP, aroundLatLng, aroundRadius }
              }"
            >
              <Refine
                name="Location"
                :name-on="
                  currentSearchParametersString({
                    aroundLatLngViaIP,
                    aroundLatLng,
                    aroundRadius
                  })
                "
                icon="location-dot"
                :is-on="aroundLatLngViaIP || aroundLatLng ? true : false"
                allow-click-outside-for=".pac-container"
              >
                <template #default="{ isOn }">
                  <FormField label="Show nearby land trusts" inline inline-flip>
                    <template #default="{ inputId }">
                      <ToggleSwitch
                        :active="aroundLatLngViaIP"
                        :input-id="inputId"
                        @update:active="
                          ($event) => {
                            resetLocation()
                            refine({
                              aroundLatLngViaIP: $event,
                              aroundLatLng: undefined,
                              aroundRadius
                            })
                          }
                        "
                      />
                    </template>
                  </FormField>
                  <client-only>
                    <FormField note="Based on land trust service area.">
                      <vue-google-autocomplete
                        v-if="$googleMaps.loaded"
                        id="AlgoliaLandTrustsLocationInput"
                        ref="locationInput"
                        class="mt-3"
                        placeholder="Or enter a location…"
                        types="(regions)"
                        country="us"
                        :disabled="aroundLatLngViaIP"
                        @placechanged="
                          (addressData) => {
                            currentLocationName =
                              (addressData.locality
                                ? `${addressData.locality}, `
                                : '') + addressData.administrative_area_level_1
                            refine({
                              aroundLatLngViaIP: false,
                              aroundLatLng: `${addressData.latitude}, ${addressData.longitude}`,
                              aroundRadius
                            })
                          }
                        "
                        @hook:mounted="
                          $refs.locationInput.update(currentLocationName)
                        "
                      />
                    </FormField>
                  </client-only>
                  <FormField
                    class="mt-6"
                    label="Radius"
                    :disabled="!isOn"
                    :inputs="[
                      {
                        component: 'FormSelect',
                        name: 'Radius',
                        value: `${aroundRadius}`,
                        options: [
                          {
                            value: convertMilesToMeters(25),
                            label: '25 miles'
                          },
                          {
                            value: convertMilesToMeters(50),
                            label: '50 miles'
                          },
                          {
                            value: convertMilesToMeters(100),
                            label: '100 miles'
                          },
                          {
                            value: convertMilesToMeters(250),
                            label: '250 miles'
                          },
                          {
                            value: convertMilesToMeters(500),
                            label: '500 miles'
                          },
                          { value: '', label: 'Infinite' }
                        ],
                        hideEmptyOption: true,
                        disabled: !isOn
                      }
                    ]"
                    note="Measured from the geographic center."
                    width="small"
                    @change="
                      refine({
                        aroundLatLngViaIP,
                        aroundLatLng,
                        aroundRadius: $event.target.value
                      })
                    "
                  />
                </template>
                <template #footer="{ isOn }">
                  <ButtonComponent
                    v-if="isOn"
                    variation="link"
                    name="Reset"
                    :icon="null"
                    size="small"
                    @click.prevent="
                      ($event) => {
                        resetLocation()
                        refine({
                          aroundLatLngViaIP: undefined,
                          aroundLatLng: undefined,
                          aroundRadius: configure.aroundRadius
                        })
                      }
                    "
                  />
                </template>
              </Refine>
            </template>
          </ais-state-results>
        </template>
      </ais-configure>

      <!-- Features -->
      <ais-current-refinements
        :included-attributes="[
          'features.publicAccess',
          'features.trails',
          'features.volunteerOpportunities'
        ]"
      >
        <template #default="{ items }">
          <Refine
            name="Features"
            :name-on="currentItemsString(items)"
            icon="list-check"
            :is-on="items.length ? true : false"
          >
            <ais-toggle-refinement
              v-for="attribute in [
                'features.publicAccess',
                'features.trails',
                'features.volunteerOpportunities'
              ]"
              :key="attribute"
              :attribute="attribute"
              :label="attributes[attribute].name"
            >
              <template #default="{ value, refine, canRefine }">
                <FormField
                  label-class="pt-1 text-sm normal-case tracking-normal"
                  :description="attributes[value.name].description"
                  :disabled="!canRefine"
                  inline-flip
                >
                  <template #label>
                    <font-awesome-icon
                      :class="`text-${attributes[value.name].color} text-lg`"
                      :icon="['fal', attributes[value.name].icon]"
                    />
                    <strong>{{ attributes[value.name].name }}</strong>
                    <Pill v-show="!value.isRefined">{{ value.count }}</Pill>
                  </template>
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

      <!-- Conservation Priorities -->
      <ais-current-refinements
        :included-attributes="[
          'protects.forests',
          'protects.habitat',
          'protects.agLand'
        ]"
      >
        <template #default="{ items }">
          <Refine
            name="Conservation Priorities"
            :name-on="currentItemsString(items)"
            icon="star"
            :is-on="items.length ? true : false"
          >
            <ais-toggle-refinement
              v-for="attribute in [
                'protects.forests',
                'protects.habitat',
                'protects.agLand'
              ]"
              :key="attribute"
              :attribute="attribute"
              :label="attributes[attribute].name"
            >
              <template #default="{ value, refine, canRefine }">
                <FormField
                  label-class="pt-1 text-sm normal-case tracking-normal"
                  :description="attributes[value.name].description"
                  :disabled="!canRefine"
                  inline-flip
                >
                  <template #label>
                    <font-awesome-icon
                      :class="`text-${attributes[value.name].color} text-lg`"
                      :icon="['fal', attributes[value.name].icon]"
                    />
                    <strong>{{ attributes[value.name].name }}</strong>
                    <Pill v-show="!value.isRefined">{{ value.count }}</Pill>
                  </template>
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

      <!-- Acres Protected -->
      <ais-current-refinements :included-attributes="['acresProtected']">
        <template #default="{ items }">
          <Refine
            name="Acres Protected"
            :name-on="currentRefinementsString(items)"
            icon="shield-plus"
            :is-on="items.length ? true : false"
          >
            <ais-range-input class="pb-6" attribute="acresProtected">
              <template
                #default="{ currentRefinement, range, canRefine, refine }"
              >
                <vue-slider
                  :model-value="rangeToValue(currentRefinement, range)"
                  :dot-size="24"
                  :height="8"
                  :silent="true"
                  :contained="true"
                  :min="range.min"
                  :max="range.max"
                  :disabled="!canRefine"
                  :lazy="true"
                  tooltip="none"
                  tooltip-placement="bottom"
                  :tooltip-formatter="
                    (val) => $filters.number(val, '0,0')
                  "
                  :enable-cross="false"
                  :min-range="1000"
                  @change="refine({ min: $event[0], max: $event[1] })"
                >
                  <template #default="{ value }">
                    <div class="vue-slider-value -mx-3">
                      <span class="vue-slider-value-start">{{
                        $filters.number(value[0], '0,0')
                      }}</span>
                      <span class="vue-slider-value-end">{{
                        $filters.number(value[1], '0,0')
                      }}</span>
                    </div>
                  </template>
                </vue-slider>
              </template>
            </ais-range-input>
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

      <!-- Credentials -->
      <ais-current-refinements
        :included-attributes="['accredited', 'terrafirmaInsured', 'nrcs']"
      >
        <template #default="{ items }">
          <Refine
            name="Credentials"
            :name-on="currentItemsString(items)"
            icon="user-check"
            :is-on="items.length ? true : false"
          >
            <ais-toggle-refinement
              v-for="attribute in ['accredited', 'terrafirmaInsured', 'nrcs']"
              :key="attribute"
              :attribute="attribute"
              :label="attributes[attribute].name"
            >
              <template #default="{ value, refine, canRefine }">
                <FormField
                  label-class="pt-1 text-sm normal-case tracking-normal"
                  :description="attributes[attribute].description"
                  :disabled="!canRefine"
                  inline-flip
                >
                  <template #label>
                    <font-awesome-icon
                      class="text-accent text-lg"
                      :icon="['fal', attributes[attribute].icon]"
                    />
                    <strong>{{ attributes[value.name].name }}</strong>
                    <Pill>{{ value.count }}</Pill>
                  </template>
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
      <ais-state-results>
        <template #default="{ state, results }">
          Found {{ results.nbHits }} Land Trust Alliance member land trusts
          <span
            v-if="stateLocation(state)"
            v-tooltip="
              'For location searches, distance is measured from the geographic center of the location. Results are based on land trust service area.'
            "
          >
            <em class="not-italic underline cursor-help">{{
              stateLocationString(state)
            }}</em>
            <font-awesome-icon
              class="ml-px text-accent"
              :icon="['fal', 'circle-info']"
            />
          </span>
        </template>
      </ais-state-results>
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
                  reset()
                }
              "
            />
          </template>
          <template #resetLabel>&nbsp;</template>
        </ais-clear-refinements>
      </template>
    </RefineBar>

    <ais-hits
      class="grid gap-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-12"
    >
      <template #default="{ items }">
        <template v-for="(item, index) in items" :key="item.objectID">
          <Callout
            v-if="
              index === 6 &&
              blocks &&
              blocks.length &&
              blocks[0].component === 'Callout'
            "
            :key="`${index}-callout`"
            class="md:col-span-2 lg:col-span-3"
            v-bind="blocks[0]"
          />
          <ItemLandTrust
            type="card"
            :source="transform.landTrustAlgoliaToStoryblok(item)"
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
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import {
  AisClearRefinements,
  AisConfigure,
  AisCurrentRefinements,
  AisHits,
  AisInstantSearch,
  AisPagination,
  AisRangeInput,
  AisSearchBox,
  AisStateResults,
  AisToggleRefinement
} from 'vue-instantsearch/vue3/es'
import {
  connectRange,
  connectSearchBox,
  connectToggleRefinement
} from 'instantsearch.js/es/connectors'
import VueGoogleAutocomplete from 'vue-google-autocomplete'
import VueSlider from 'vue-3-slider-component'
import InstantSearchMixin from '@/mixins/InstantSearch.mixin'

export default {
  components: {
    AisClearRefinements,
    AisConfigure,
    AisCurrentRefinements,
    AisHits,
    AisInstantSearch,
    AisPagination,
    AisRangeInput,
    AisSearchBox,
    AisStateResults,
    AisToggleRefinement,
    VueSlider,
    VueGoogleAutocomplete
  },
  mixins: [InstantSearchMixin],
  props: {
    blocks: Array,
    _editable: String
  },
  data() {
    return {
      indexNameBase: 'land_trusts',
      configure: {
        aroundLatLngViaIP: true,
        aroundLatLng: undefined,
        aroundRadius: this.convertMilesToMeters(100)
      },
      virtualWidgets: {
        query: connectSearchBox(() => null),
        'features.publicAccess': connectToggleRefinement(() => null),
        'features.trails': connectToggleRefinement(() => null),
        'features.volunteerOpportunities': connectToggleRefinement(() => null),
        'protects.forests': connectToggleRefinement(() => null),
        'protects.habitat': connectToggleRefinement(() => null),
        'protects.agLand': connectToggleRefinement(() => null),
        acresProtected: connectRange(() => null),
        accredited: connectToggleRefinement(() => null),
        terrafirmaInsured: connectToggleRefinement(() => null)
      },
      routing: {
        router: InstantSearchMixin.data().routing.router,
        stateMapping: {
          stateToRoute: (uiState) => {
            const { configure = {}, ...state } = uiState[this.indexName]

            // Use friendlier names for configure settings in the route

            if (
              configure.aroundLatLngViaIP !== this.configure.aroundLatLngViaIP
            ) {
              state.nearby = configure.aroundLatLngViaIP
            }

            if (configure.aroundLatLng !== this.configure.aroundLatLng) {
              state.location = configure.aroundLatLng
            }

            if (configure.aroundRadius !== this.configure.aroundRadius) {
              state.radius = configure.aroundRadius
            }

            // If a location is selected, add the name to the route
            if (this.currentLocationName) {
              state.locationName = this.currentLocationName
            }

            return state
          },
          routeToState: (routeState) => {
            const { nearby, location, radius, locationName, ...state } =
              routeState

            const configure = {
              ...this.configure
            }

            // Translate route friendly names to state settings
            if (nearby) configure.aroundLatLngViaIP = nearby === 'true'
            if (location) configure.aroundLatLng = location
            if (radius) configure.aroundRadius = parseInt(radius)

            state.configure = configure

            // Store location name for reference
            if (location && locationName)
              this.currentLocationName = locationName

            return {
              [this.indexName]: state
            }
          }
        }
      },
      currentLocationName: '',
      transformSearchParameter: {
        aroundLatLngViaIP: (value) => {
          return value === true && 'Nearby'
        },
        aroundLatLng: (_value) => {
          return this.currentLocationName || 'Location'
        },
        aroundRadius: (value) => {
          return `Within ${this.$filters.number(
            this.convertMetersToMiles(value),
            '0,0'
          )} mi.`
        }
      }
    }
  },
  computed: {
    ...mapState(useSettingsStore, ['attributes'])
  },
  methods: {
    resetLocation() {
      this.currentLocationName = ''
      this.$refs.locationInput.clear()
    },
    rangeToValue(value, range) {
      return [
        value.min ? value.min : range.min,
        value.max ? value.max : range.max
      ]
    },
    convertMilesToMeters(miles) {
      return Math.round(miles * 1609.34)
    },
    convertMetersToMiles(meters) {
      return Math.round(meters / 1609.34)
    },
    reset() {
      this.resetLocation()
      this.$refs.searchBox.$el.querySelector('form').reset()
      this.instantSearchInstance.helper
        .setQueryParameter(
          'aroundLatLngViaIP',
          this.configure.aroundLatLngViaIP
        )
        .setQueryParameter('aroundLatLng', this.configure.aroundLatLng)
        .setQueryParameter('aroundRadius', this.configure.aroundRadius)
        .search()
    },
    stateLocation(state) {
      const name = state.aroundLatLng
        ? this.currentLocationName
        : state.aroundLatLngViaIP
        ? 'you'
        : undefined
      const radius = state.aroundRadius
        ? this.convertMetersToMiles(state.aroundRadius)
        : undefined

      return name && radius
        ? {
            name,
            radius
          }
        : undefined
    },
    stateLocationString(state) {
      const location = this.stateLocation(state)

      return location
        ? `within ${location.radius} miles of ${location.name}`
        : ''
    }
  }
}
</script>
