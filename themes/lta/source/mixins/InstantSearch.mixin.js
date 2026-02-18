/*
<template>
  <ais-instant-search
    ref="instantSearch"
    v-editable="$props"
    :index-name="indexName"
    :search-client="$algolia.client"
    :search-function="searchFunction"
    :routing="routing"
  >
    <ais-configure v-bind="configure" />
    …
  </ais-instant-search>
</template>
*/

import { history as historyRouter } from 'instantsearch.js/es/lib/routers'
import { singleIndex } from 'instantsearch.js/es/lib/stateMappings'
import { isEmpty, isEqual } from 'lodash-es'

export default {
  props: {
    disableHistory: Boolean
  },
  data() {
    const { loggedIn, user } = useLtaAuth()

    return {
      indexNameBase: '',
      instantSearchIsAvailable: false,
      initialized: false,
      configure: {
        userToken: loggedIn.value ? user.value?.internalId : undefined
      },
      virtualWidgets: {
        /**
         * Long story short: If you add new widgets above and they're inside
         * something like AisCurrentRefinements, you'll need to add a virtual
         * widget for it here to allow it to be retained when the URL is mapped
         * to state.
         *
         * Most widgets are rendered inside an AisCurrentRefinements widget
         * above. Apparently these aren't available yet when AisInstantSearch
         * is initialized and causes warnings when mapping the route-to-state.
         * Their absense also causes an issue with the AisConfigure widget
         * above — if any of the configure options are changed when mapping
         * the route-to-state, the widget triggers a refresh and any of these
         * "missing" widgets are not retained. As noted in the warning message,
         * an option is to add virtual widgets that are added immediately and
         * allow their state to be retained until the real widgets are
         * rendered.
         */
      },
      searchFunction: (helper) => {
        if (!this.initialized) {
          this.instantSearchIsAvailable = true
          this.initialize()
        }

        helper.search()
      },
      routing: {
        router: this.disableHistory
          ? {
              onUpdate() {},
              read() {},
              write() {},
              createURL() {},
              dispose() {}
            }
          : historyRouter({
              push(url) {
                const { pathname, search } = new URL(url)
                const fullPath = pathname + search

                const router = useRouter()
                router.push(fullPath)
              },
              cleanUrlOnDispose: false
            }),
        stateMapping: {
          stateToRoute: (uiState) =>
            singleIndex(this.indexName).stateToRoute(uiState),
          routeToState: (routeState) =>
            singleIndex(this.indexName).routeToState(routeState)
        }
      },
      future: {
        preserveSharedStateOnUnmount: true
      },
      transformItem: {},
      transformSearchParameter: {}
    }
  },
  computed: {
    indexName() {
      return this.$algolia.indexName(this.indexNameBase)
    },
    instantSearchInstance() {
      return this.instantSearchIsAvailable
        ? this.$refs.instantSearch.instantSearchInstance
        : undefined
    },
    _initialUiState() {
      return this.instantSearchInstance?._initialUiState[this.indexName] || {}
    },
    initialUiState() {
      return undefined
    },
    initialUiStateWidgets() {
      // Stores names of widgets in initial UI state
      return Object.entries(this._initialUiState).flatMap(([_key, value]) =>
        Object.keys(value)
      )
    }
  },
  watch: {
    '$route.query'(newVal, oldVal) {
      // When the route query changes (when clicking links in items that go to
      // an Algolia interface), set the UI state from the route.
      //
      // Only do this when history is enabled because the state is determined
      // by the URL. And only do this when the query values were changed.
      if (!this.disableHistory && !isEqual(newVal, oldVal)) {
        this.instantSearchInstance?.setUiState(
          singleIndex(this.indexName).routeToState(this.routing.router.read())
        )

        this.$refs.instantSearch.$el.scrollIntoView()
      }
    }
  },
  methods: {
    indexNameReplica(replica) {
      return this.$algolia.indexName(`${this.indexNameBase}_${replica}`)
    },
    initialize() {
      const virtualWidgets = Object.entries(this.virtualWidgets).map(
        ([key, value]) => {
          let options = { attribute: key }
          let widget = value

          if (typeof value === 'object') {
            if (value.options) {
              options = { ...value.options }
            }
            widget = value.widget
          }

          return widget(options)
        }
      )

      this.instantSearchInstance?.addWidgets(virtualWidgets)

      // Only explicitly set initial UI state if there's
      // - no initial state (from the route)
      // - an initial state provided in the component
      if (isEmpty(this._initialUiState) && this.initialUiState) {
        this.instantSearchInstance?.setUiState({
          [this.indexName]: this.initialUiState
        })
      }

      this.initialized = true
    },
    currentItemsString(items = []) {
      return items
        .map((item) =>
          Object.keys(this.attributes).includes(item.attribute)
            ? this.attributes[item.attribute].name
            : item.attribute
        )
        .join(', ')
    },
    currentSearchParametersString(searchParameters = {}) {
      return Object.entries(searchParameters)
        .filter(([_param, value]) => value)
        .map(([param, value]) => {
          return Object.keys(this.transformSearchParameter).includes(param)
            ? this.transformSearchParameter[param](value)
            : value
        })
        .join(', ')
    },
    currentRefinementsString(items = []) {
      return items
        .flatMap((item) => item.refinements)
        .map((refinement) => {
          return Object.keys(this.transformItem).includes(refinement.attribute)
            ? this.transformItem[refinement.attribute](refinement).label
            : refinement.label
        })
        .join(', ')
    },
    clearRefinements(items = []) {
      items.forEach((item) =>
        item.refinements.forEach((refinement) => item.refine(refinement))
      )
    }
  }
}
