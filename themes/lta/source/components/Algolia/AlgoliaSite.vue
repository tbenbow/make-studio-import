<template>
  <ais-instant-search
    ref="instantSearch"
    v-editable="$props"
    class="algolia-site"
    :index-name="indexName"
    :search-client="$algolia.client"
    :search-function="searchFunction"
    :routing="routing"
    :future="future"
    :insights="true"
  >
    <ais-configure v-bind="configure" />
    <header class="header">
      <ais-search-box
        ref="searchBox"
        :class-names="{
          'ais-SearchBox': 'flex-1',
          'ais-SearchBox-form': 'relative',
          'ais-SearchBox-input': '!h-12 !pr-18 !text-base !rounded-full',
          'ais-SearchBox-submit':
            'absolute top-1/2 right-[1rem] -translate-y-1/2 text-base text-black-600 hover:text-accent',
          'ais-SearchBox-reset':
            'absolute top-1/2 right-[3rem] -translate-y-1/2 text-base text-black-600 hover:text-accent'
        }"
        placeholder="Search Land Trust Alliance…"
      >
        <template #submit-icon>
          <font-awesome-icon :icon="['fal', 'magnifying-glass']" />
        </template>
        <template #reset-icon>
          <font-awesome-icon :icon="['fal', 'xmark']" />
        </template>
      </ais-search-box>
      <slot name="header" />
    </header>
    <ais-state-results class="main">
      <template #default="{ state: { query } }">
        <div v-if="!query" class="px-6 pb-3">
          <Notice v-color="'black-400'" :display-inline="true" size="small"
            >Search pages, resources, land trusts, jobs, and more.</Notice
          >
        </div>
        <Tabs
          v-show="query"
          :tabs="[
            {
              title: 'Resources',
              id: 'resources'
            },
            {
              title: 'Pages',
              id: 'pages'
            },
            {
              title: 'Blog',
              id: 'blog'
            },
            {
              title: 'Jobs',
              id: 'jobs'
            },
            {
              title: 'Land trusts',
              id: 'land-trusts'
            },
            {
              title: 'Affiliate members',
              id: 'affiliate-members'
            }
          ]"
        >
          <template #nav="{ title, id }">
            <!-- Nav: Resources -->
            <template v-if="id === 'resources'">
              <ais-index :index-name="$algolia.indexName('resources')">
                <ais-stats>
                  <template #default="{ nbHits }">
                    {{ title }}
                    <Pill>{{ nbHits }}</Pill>
                  </template>
                </ais-stats>
              </ais-index>
            </template>
            <!-- Nav: Pages -->
            <template v-if="id === 'pages'">
              <ais-stats>
                <template #default="{ nbHits }">
                  {{ title }}
                  <Pill>{{ nbHits }}</Pill>
                </template>
              </ais-stats>
            </template>
            <!-- Nav: Blog -->
            <template v-else-if="id === 'blog'">
              <ais-index :index-name="$algolia.indexName('blog_posts')">
                <ais-stats>
                  <template #default="{ nbHits }">
                    {{ title }}
                    <Pill>{{ nbHits }}</Pill>
                  </template>
                </ais-stats>
              </ais-index>
            </template>
            <!-- Nav: Jobs -->
            <template v-else-if="id === 'jobs'">
              <ais-index :index-name="$algolia.indexName('jobs')">
                <ais-stats>
                  <template #default="{ nbHits }">
                    {{ title }}
                    <Pill>{{ nbHits }}</Pill>
                  </template>
                </ais-stats>
              </ais-index>
            </template>
            <!-- Nav: Land trusts -->
            <template v-else-if="id === 'land-trusts'">
              <ais-index :index-name="$algolia.indexName('land_trusts')">
                <ais-stats>
                  <template #default="{ nbHits }">
                    {{ title }}
                    <Pill>{{ nbHits }}</Pill>
                  </template>
                </ais-stats>
              </ais-index>
            </template>
            <!-- Nav: Affiliate members -->
            <template v-else-if="id === 'affiliate-members'">
              <ais-index :index-name="$algolia.indexName('affiliates')">
                <ais-stats>
                  <template #default="{ nbHits }">
                    {{ title }}
                    <Pill>{{ nbHits }}</Pill>
                  </template>
                </ais-stats>
              </ais-index>
            </template>
          </template>
          <template #tab="{ id }">
            <!-- Tab: Resources -->
            <template v-if="id === 'resources'">
              <ais-index :index-name="$algolia.indexName('resources')">
                <p v-if="getSettingLinkUrl('rootResource')" class="for-more">
                  These resources are designed to help conservation
                  practitioners protect more land. Visit
                  <NuxtLink :to="getSettingLinkUrl('rootResource')"
                    ><strong>Explore Resources</strong></NuxtLink
                  >
                  to refine your search.
                </p>
                <ais-infinite-hits class="space-y-6">
                  <template
                    v-slot="{ items, refineNext, isLastPage, sendEvent }"
                  >
                    <template v-if="items && items.length">
                      <ItemResource
                        v-for="item in items"
                        type="card-horizontal"
                        :source="transform.resourceAlgoliaToStoryblok(item)"
                        :link-params="{ queryID: item.__queryID }"
                        @algolia-send-event="
                          (eventType, eventName) =>
                            sendEvent(eventType, item, eventName)
                        "
                      />
                    </template>
                    <Notice v-else :panel="true">No resources found</Notice>
                    <footer v-if="!isLastPage" class="hits-footer">
                      <ButtonComponent
                        name="Show more results"
                        size="small"
                        @click="refineNext"
                      />
                    </footer>
                  </template>
                </ais-infinite-hits>
              </ais-index>
            </template>
            <!-- Tab: Pages -->
            <template v-if="id === 'pages'">
              <ais-infinite-hits class="space-y-6">
                <template v-slot="{ items, refineNext, isLastPage }">
                  <template v-if="items && items.length">
                    <Item
                      v-for="item in items"
                      type="card-horizontal"
                      title-size="small"
                      v-bind="algoliaGeneralToItem(item)"
                    />
                  </template>
                  <Notice v-else :panel="true">No results found</Notice>
                  <footer v-if="!isLastPage" class="hits-footer">
                    <ButtonComponent
                      name="Show more results"
                      size="small"
                      @click="refineNext"
                    />
                  </footer>
                </template>
              </ais-infinite-hits>
            </template>
            <!-- Tab: Blog -->
            <template v-else-if="id === 'blog'">
              <ais-index :index-name="$algolia.indexName('blog_posts')">
                <p v-if="getSettingLinkUrl('rootPost')" class="for-more">
                  Find a conservation success story on our blog! Visit the
                  <NuxtLink :to="getSettingLinkUrl('rootPost')"
                    ><strong>Blog</strong></NuxtLink
                  >
                  to explore more.
                </p>
                <ais-infinite-hits class="space-y-6">
                  <template v-slot="{ items, refineNext, isLastPage }">
                    <template v-if="items && items.length">
                      <ItemPost
                        v-for="item in items"
                        type="card-horizontal"
                        title-size="small"
                        :source="transform.postAlgoliaToStoryblok(item)"
                      />
                    </template>
                    <Notice v-else :panel="true">No posts found</Notice>
                    <footer v-if="!isLastPage" class="hits-footer">
                      <ButtonComponent
                        name="Show more results"
                        size="small"
                        @click="refineNext"
                      />
                    </footer>
                  </template>
                </ais-infinite-hits>
              </ais-index>
            </template>
            <!-- Tab: Jobs -->
            <template v-else-if="id === 'jobs'">
              <ais-index :index-name="$algolia.indexName('jobs')">
                <p v-if="getSettingLinkUrl('rootJob')" class="for-more">
                  Explore careers at the Land Trust Alliance or pursue
                  opportunities at land trusts across the country. Visit our
                  <NuxtLink :to="getSettingLinkUrl('rootJob')"
                    ><strong>Job Board</strong></NuxtLink
                  >
                  to refine your search.
                </p>
                <ais-infinite-hits class="space-y-6">
                  <template v-slot="{ items, refineNext, isLastPage }">
                    <template v-if="items && items.length">
                      <ItemJob
                        v-for="item in items"
                        type="card-horizontal"
                        :source="transform.jobAlgoliaToStoryblok(item)"
                      />
                    </template>
                    <Notice v-else :panel="true">No jobs found</Notice>
                    <footer v-if="!isLastPage" class="hits-footer">
                      <ButtonComponent
                        name="Show more results"
                        size="small"
                        @click="refineNext"
                      />
                    </footer>
                  </template>
                </ais-infinite-hits>
              </ais-index>
            </template>
            <!-- Tab: Land trusts -->
            <template v-else-if="id === 'land-trusts'">
              <ais-index :index-name="$algolia.indexName('land_trusts')">
                <p v-if="getSettingLinkUrl('rootLandTrust')" class="for-more">
                  Find an Alliance member land trust that conserves the lands we
                  need and love. Visit
                  <NuxtLink :to="getSettingLinkUrl('rootLandTrust')"
                    ><strong>Find a Land Trust</strong></NuxtLink
                  >
                  to refine your search.
                </p>
                <ais-infinite-hits class="space-y-6">
                  <template v-slot="{ items, refineNext, isLastPage }">
                    <template v-if="items && items.length">
                      <ItemLandTrust
                        v-for="item in items"
                        type="card-horizontal"
                        :source="transform.landTrustAlgoliaToStoryblok(item)"
                      />
                    </template>
                    <Notice v-else :panel="true">No land trusts found</Notice>
                    <footer v-if="!isLastPage" class="hits-footer">
                      <ButtonComponent
                        name="Show more results"
                        size="small"
                        @click="refineNext"
                      />
                    </footer>
                  </template>
                </ais-infinite-hits>
              </ais-index>
            </template>
            <!-- Tab: Affiliate members -->
            <template v-else-if="id === 'affiliate-members'">
              <ais-index :index-name="$algolia.indexName('affiliates')">
                <p v-if="getSettingLinkUrl('rootAffiliate')" class="for-more">
                  Alliance affiliate members are organizations that care deeply
                  about land conservation. Visit the
                  <NuxtLink :to="getSettingLinkUrl('rootAffiliate')"
                    ><strong>Affiliate member directory</strong></NuxtLink
                  >
                  to refine your search.
                </p>
                <ais-infinite-hits class="space-y-6">
                  <template v-slot="{ items, refineNext, isLastPage }">
                    <template v-if="items && items.length">
                      <ItemAffiliate
                        v-for="item in items"
                        type="card-horizontal"
                        :source="transform.affiliateAlgoliaToStoryblok(item)"
                      />
                    </template>
                    <Notice v-else :panel="true">No affiliates found</Notice>
                    <footer v-if="!isLastPage" class="hits-footer">
                      <ButtonComponent
                        name="Show more results"
                        size="small"
                        @click="refineNext"
                      />
                    </footer>
                  </template>
                </ais-infinite-hits>
              </ais-index>
            </template>
          </template>
        </Tabs>
      </template>
    </ais-state-results>
  </ais-instant-search>
</template>

<script>
import { startCase } from 'lodash-es'
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

import {
  AisConfigure,
  AisInstantSearch,
  AisInfiniteHits,
  AisIndex,
  AisSearchBox,
  AisStateResults,
  AisStats
} from 'vue-instantsearch/vue3/es'
import InstantSearchMixin from '@/mixins/InstantSearch.mixin'

export default {
  components: {
    AisConfigure,
    AisInstantSearch,
    AisInfiniteHits,
    AisIndex,
    AisSearchBox,
    AisStateResults,
    AisStats
  },
  mixins: [InstantSearchMixin],
  data() {
    return {
      indexNameBase: 'general',
      configure: {
        hitsPerPage: 4
      }
    }
  },
  computed: mapState(useSettingsStore, ['getSettingLinkUrl']),
  methods: {
    algoliaGeneralToItem(item = {}) {
      return {
        image: item.imageUrl ? { filename: item.imageUrl } : undefined,
        label: item.contentType ? startCase(item.contentType) : undefined,
        title: item.name,
        link: item.fullSlug ? `/${item.fullSlug}` : undefined,
        body: item.excerpt ? storyblok.plainTextToRichText(item.excerpt) : undefined
      }
    }
  }
}
</script>

<style lang="postcss" scoped>
.algolia-site {
}

.for-more {
  @apply mb-6 text-sm;

  a {
    @apply underline hover:text-accent;
    text-decoration-color: theme('colors.accent');
  }
}

.hits-footer {
  @apply p-6 text-center bg-line rounded;
}
</style>
