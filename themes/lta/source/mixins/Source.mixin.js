/**
 * Source Mixin
 *
 * The source mixin is a group of fields that can be added to a component to
 * dynamically supply stories. These will be useful in component's like Slider,
 * LayoutGrid, Item, and more.
 *
 * @todo This component will eventually need to support additional refinement
 *       via tags, categories, etc.
 *
 * @todo Make pagination work with URL query param, ex. ?item-list-page=2
 *
 * @prop {string} source - The source Storyblok story UUID [Storyblok Single-Option field] or comma-separated UUIDs
 * @prop {string[]} source - An array of component types (Page, Land Trust, Post, etc.) [Storyblok Multi-Options field]
 * @prop {Object} source - A full story object
 * @prop {string} sourceSortBy - The field to sort source stories by
 * @prop {string} sourceSortDirection - The direction to sort
 * @prop {Function} sourceSortFunction - The custom sort function to use
 * @prop {string|number} sourceLimit - Limit the number of source stories
 * @prop {String} sourceSlugStartsWith - The slug starts with
 * @prop {String} sourceTag - The tag(s) associated with the source
 * @prop {Array} sourceCategory - The categor(y/ies) associated with the source
 * @prop {Array} sourceAuthor - The author(s) associated with the source
 * @prop {Array} sourceTopic - The topic(s) associated with the source
 * @prop {Array} sourcePressMentionRegions - The press mention region(s) associated with the source
 * @prop {Array} sourceResourceType - The resource type(s) associated with the source
 * @prop {Boolean} sourceResourceInternal - Display internal resources only
 * @prop {Object|Array} sourceItemTemplate - The item template (defaults) to apply to each source item
 */

import { documentIsValid } from '@/components/RichText.vue'
import { access as accessTypes } from '@/composables/useAccess'

export default {
  props: {
    source: [String, Array, Object],
    sourceFilterQuery: Object,
    sourceSortBy: String,
    sourceSortDirection: {
      type: String,
      validator: (value) => ['', 'asc', 'desc'].includes(value)
    },
    sourceSortFunction: Function,
    sourceLimit: [String, Number],
    sourceSlugStartsWith: String,
    sourceTag: String,
    sourceCategory: Array,
    sourceAuthor: Array,
    sourceTopic: Array,
    sourcePressMentionRegions: Array,
    sourceResourceType: Array,
    sourceResourceInternal: Boolean,
    sourceItemTemplate: [Object, Array],
    sourceAllowRestricted: Boolean
  },
  setup() {
    const { format } = useDateFns()

    return {
      format
    }
  },
  data() {
    return {
      fetchingSourceActive: false,
      fetchingSourceEnded: false,
      fetchingSourceError: false,
      sourceStories: [],
      sourceStoriesPage: 1,
      sourceStoriesTotal: undefined
    }
  },
  watch: {
    async sourceStoriesPage() {
      await this.fetchSource()
    }
  },
  computed: {
    hasSource() {
      return !!(
        (Array.isArray(this.source) && this.source.length) ||
        (!Array.isArray(this.source) && this.source)
      )
    },
    /**
     * @returns {boolean} True if in a fetching state.
     *                    Fetching state is determined by…
     *                      1a. Has a source, but not the source story yet
     *                      1b. OR actively fetching the source
     *                      2. AND the fetching process hasn't officially ended
     */
    fetchingSource() {
      return (
        ((this.hasSource && !this.sourceStory) || this.fetchingSourceActive) &&
        !this.fetchingSourceEnded
      )
    },
    sourceStory() {
      return typeof this.source === 'object' &&
        typeof this.source.content === 'object'
        ? this.source
        : this.sourceStories.length
        ? this.sourceStories[0]
        : undefined
    },
    /**
     * Merge source story content with $attrs. If $attrs value is string,
     * ignore it. It $attrs value is array, replace instead of merge so it
     * overrides the source story value instead.
     */
    sourceStoryProps() {
      return this.sourceStory
        ? lodash.mergeWith(
            {},
            this.sourceStory.content,
            this.$attrs,
            (sourceStoryValue, attrValue) => {
              if (!attrValue) {
                return sourceStoryValue
              }

              if (Array.isArray(attrValue) && attrValue.length) {
                return attrValue
              }
            }
          )
        : undefined
    },
    sourceLimitNumber() {
      const limit = this.sourceLimit ? parseInt(this.sourceLimit) : 10

      return limit > 100 ? 100 : limit < 0 ? undefined : limit
    },
    sourceItemTemplateProps() {
      const props =
        Array.isArray(this.sourceItemTemplate) && this.sourceItemTemplate.length
          ? this.sourceItemTemplate[0]
          : this.sourceItemTemplate

      if (lodash.isPlainObject(props)) {
        delete props._editable
        delete props._uid
        delete props.component

        Object.entries(props).forEach(([key, value]) => {
          const { isValid } = useLinkHelper(value)

          if (
            (key === 'body' && !documentIsValid(value)) ||
            (key === 'image' &&
              lodash.isPlainObject(value) &&
              !value.filename) ||
            (key === 'link' && !isValid.value) ||
            lodash.isEmpty(value)
          ) {
            delete props[key]
          }
        })
      }

      return props || {}
    },
    sourceStoriesPerPage() {
      return this.sourceLimitNumber
    },
    sourceStoriesPages() {
      return Math.ceil(this.sourceStoriesTotal / this.sourceStoriesPerPage)
    }
  },
  methods: {
    /**
     * Fetch the source story.
     */
    async fetchSource() {
      this.fetchingSourceError = false
      this.fetchingSourceEnded = false

      // If source is a string…
      if (typeof this.source === 'string' && this.source) {
        this.fetchingSourceActive = true

        // If source is a string with commas, assume comma-separated UUIDs
        if (this.source.includes(',')) {
          const stories = await this.fetchSourceStoriesByUuids(this.source)

          if (stories.length) {
            this.sourceStories = stories
          }
        }
        // Else assume single UUID
        else {
          const story = await this.fetchSourceStory()

          if (story) {
            this.sourceStories = [story]
          }
        }
      }
      // Else if source is an array of content types
      else if (Array.isArray(this.source) && this.source.length) {
        this.fetchingSourceActive = true
        const stories = await this.fetchSourceStories()

        if (stories.length) {
          this.sourceStories = stories
        }
      }

      this.fetchingSourceActive = false
      this.fetchingSourceEnded = true
    },
    /**
     * Fetches the story for a source UUID.
     * @returns {Promose<object|undefined>} The story object
     */
    async fetchSourceStory() {
      if (typeof this.source !== 'string' || !this.source) {
        return
      }

      const requestFetch = useRequestFetch()

      try {
        const response = await requestFetch('/api/story', { query: {
          path: this.source,
          params: {
            find_by: 'uuid'
          }
        }})

        if (response.data?.story) {
          return response.data.story
        }
      } catch (err) {
        console.error(`[Source] Error fetching source story`, this.source)
        this.fetchingSourceError = true
      }
    },
    /**
     * Fetches the stories for the given content types.
     * @returns {Promise<array|undefined>} Array of stories
     */
    async fetchSourceStories() {
      if (!Array.isArray(this.source)) {
        return
      }

      const stories = this.source.includes('LandTrust')
        ? await this.fetchSourceLandTrust()
        : await this.fetchSourceStoryblok()

      return stories
    },
    /**
     * Fetches the stories for a string of comma-separated UUIDs.
     * @param {string} uuids - Comma-separated UUIDs
     * @returns {Promose<object[]|undefined>} Array of stories
     */
    async fetchSourceStoriesByUuids(uuids) {
      return uuids
        ? await this.fetchSourceStoryblok({
            by_uuids_ordered: uuids
          })
        : undefined
    },
    async fetchSourceLandTrust() {

      try {
        const response = await this.$algolia.client.searchSingleIndex({
          indexName:  this.$algolia.indexName('land_trusts'),
          searchParams: {
            aroundLatLngViaIP: true,
            hitsPerPage: this.sourceLimitNumber,
            page: this.sourceStoriesPage - 1
          }
        })

        const landTrusts = response.hits.map((landTrust) =>
          transform.landTrustAlgoliaToStoryblok(landTrust)
        )

        this.sourceStoriesTotal = response.nbHits

        return landTrusts
      } catch (err) {
        console.error(`[Source] Error fetching source land trust`)
        this.fetchingSourceError = true
      }
    },
    async fetchSourceStoryblok(params = {}) {
      const filterQuery = this.sourceFilterQuery || {}
      const sortBy = this.sourceSortBy
      const sortDirection = this.sourceSortDirection
      const sortByDirection = sortBy
        ? `${sortBy}${sortDirection ? `:${sortDirection}` : ''}`
        : undefined
      const perPage = this.sourceLimitNumber
      const startsWith = this.sourceSlugStartsWith
      const withTag = this.sourceTag

      // Scenarios for specific source content types
      if (Array.isArray(this.source) && this.source.length) {
        filterQuery.component = {
          in: this.source.join(',')
        }

        /**
         * Access
         *
         * For sources with access controls, omit "restricted" stories. This is
         * to avoid situations where a limit is set, but then our Storyblok API
         * wrapper would filter out a restricted story because the user wasn't
         * authorized to view it, resulting in fewer stories than the limit.
         *
         * Caveats:
         * - Restricted stories can't be shown when using this mixin (low impact)
         * - If multiple sources are selected, only sources with access controls
         *   will be displayed due to API limitations regarding usage of OR.
         *   Solution: limit to single source selection in Storyblok even though
         *   the field supports many.
         */
        const sourcesWithAccess = ['Page', 'Resource']
        if (!this.sourceAllowRestricted && this.source.some((source) => sourcesWithAccess.includes(source))) {
          filterQuery.access = {
            not_in: accessTypes.RESTRICTED
          }
        }

        // Source: Job
        if (this.source.includes('Job')) {
          // [Job] If sorting by application deadline…
          if (sortBy?.includes('applicationDeadline')) {
            const { format } = useDateFns()

            // Filter application deadline > today
            filterQuery.applicationDeadline = {
              gt_date: format(new Date(), 'yyyy-MM-dd')
            }
          }
        }

        // Source: Press Mention
        if (this.source.includes('PressMention')) {
          if (
            this.sourcePressMentionRegions &&
            this.sourcePressMentionRegions.length
          ) {
            filterQuery.regions = {
              any_in_array: this.sourcePressMentionRegions.join(',')
            }
          }
        }

        // Source: Resource
        if (this.source.includes('Resource')) {
          // [Resource] Filter by Resource type
          if (this.sourceResourceType && this.sourceResourceType.length) {
            filterQuery.type = { in: this.sourceResourceType.join(',') }
          }

          // [Resource] Filter internal Resources only
          if (this.sourceResourceInternal) {
            filterQuery.internal = { is: true }
          }

          // [Resource] If sorting by startDate…
          if (sortBy?.includes('startDate')) {
            const { format } = useDateFns()

            // Filter start date > today
            filterQuery.startDate = {
              gt_date: format(new Date(), 'yyyy-MM-dd')
            }
          }
        }
      }

      // Filter by Category content type
      if (this.sourceCategory && this.sourceCategory.length) {
        // To filter by Category, the content type must have a single-option
        // field named `category` or a multi-option field named `categories`
        filterQuery.__or = [
          { category: { in: this.sourceCategory.join(',') } },
          { categories: { any_in_array: this.sourceCategory.join(',') } }
        ]
      }

      // Filter by Author content type
      if (this.sourceAuthor && this.sourceAuthor.length) {
        // To filter by Author, the content type must have a single-option
        // field named `author` or a multi-option field named `authors`
        filterQuery.__or = [
          { author: { in: this.sourceAuthor.join(',') } },
          { authors: { any_in_array: this.sourceAuthor.join(',') } }
        ]
      }

      // Filter by Topic content type
      if (this.sourceTopic && this.sourceTopic.length) {
        // To filter by Topic, the content type must have a single-option
        // field named `topic` or a multi-option field named `topics`
        // or in the case of sub-topics, a single-option field named 'parent'
        filterQuery.__or = [
          { topic: { in: this.sourceTopic.join(',') } },
          { topics: { any_in_array: this.sourceTopic.join(',') } },
          { parent: { in: this.sourceTopic.join(',') } }
        ]
      }

      // Fetch source(s) from Storyblok
      const requestFetch = useRequestFetch()
      let stories = []
      try {
        const response = await requestFetch('/api/story', {
          query: {
            params: {
              ...params,
              ...(filterQuery ? { filter_query: filterQuery } : {}),
              ...(sortByDirection ? { sort_by: sortByDirection } : {}),
              ...(perPage ? { per_page: perPage } : {}),
              ...(startsWith ? { starts_with: startsWith } : {}),
              ...(withTag ? { with_tag: withTag } : {}),
              page: this.sourceStoriesPage
            }
          }
        })

        this.sourceStoriesTotal = response.total

        stories = response.data?.stories
      } catch (err) {
        console.error(`[Source] Error fetching source stories`)
        this.fetchingSourceError = true
      }

      // Custom sort function
      if (this.sourceSortFunction) {
        stories = stories.sort(this.sourceSortFunction)
      }
      // Scenarios for specific source content types
      else if (Array.isArray(this.source) && this.source.length) {
        // Gaining Ground: Sort US to front
        if (this.source.includes('GainingGround')) {
          const sortOrder = ['US']

          stories.sort(
            (a, b) =>
              sortOrder.indexOf(b.content.state) -
              sortOrder.indexOf(a.content.state)
          )
        }
      }

      return stories
    }
  }
}
