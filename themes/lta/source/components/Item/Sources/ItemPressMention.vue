<template>
  <component
    :is="componentForType"
    class="item-press-mention"
    v-bind="computedProps"
    :label="label || pressMentionLabel"
    :title="title || pressMentionTitle"
    :subtitle="subtitle || pressMentionSubtitle"
    :body="hasBody ? body : pressMentionExcerpt"
    :link="link || pressMentionPublicationUrl || pressMentionSlug"
  >
    <template #after-body>
      <ButtonComponent
        v-if="pressMentionPublicationUrl"
        variation="link"
        :link="pressMentionPublicationUrl"
        name="Read article"
        icon="arrow-up-right-from-square"
        :size="size"
      />
    </template>
    <template #footer>
      <div
        v-if="pressMentionHasMentionedData"
        class="mt-3 border border-line-2 rounded"
      >
        <div v-if="fetchedMentionedData" class="space-y-3 px-4 pt-4 pb-3">
          <Field
            v-if="pressMentionHasLandTrusts"
            class=""
            label="Land Trusts"
            icon="mountain-sun"
            :display-inline="true"
            :tight="true"
          >
            <span
              v-for="(landTrust, index) in pressMentionLandTrustsData"
              :key="index"
              class="text-sm"
            >
              <NuxtLink
                class="text-accent hover:underline"
                :to="`/${landTrust.full_slug}`"
                >{{ landTrust.name }}</NuxtLink
              ><template v-if="pressMentionLandTrustsData.length > index + 1"
                >,
              </template>
            </span>
          </Field>
          <Field
            v-if="pressMentionHasRegions"
            class=""
            label="Regions"
            icon="map"
            :display-inline="true"
            :tight="true"
          >
            <span
              v-for="(region, index) in pressMentionRegionsLinks"
              :key="index"
              class="text-sm"
            >
              <NuxtLink
                class="text-accent hover:underline"
                :to="`${region.full_slug}`"
                >{{ region.name }}</NuxtLink
              ><template v-if="pressMentionRegionsLinks.length > index + 1"
                >,
              </template>
            </span>
          </Field>
          <Field
            v-if="pressMentionHasLocations"
            class=""
            label="Locations"
            icon="location-dot"
            :display-inline="true"
            :tight="true"
          >
            <span
              v-for="(location, index) in pressMentionLocationsFullName"
              :key="index"
              class="text-sm"
            >
              <span>{{ location }}</span
              ><template v-if="pressMentionLocationsFullName.length > index + 1"
                >,
              </template>
            </span>
          </Field>
        </div>
        <div v-else class="flex items-center gap-3 px-3 py-2">
          <div class="flex-1">
            <ButtonComponent
              :icon="fetchingMentionedData ? 'spinner-third' : undefined"
              :icon-props="{ spin: fetchingMentionedData, fixedWidth: true }"
              :icon-position-reverse="true"
              :size="size"
              variation="link"
              @click="fetchMentionedData"
              >View mentioned {{ mentionedDataString }}</ButtonComponent
            >
          </div>
          <font-awesome-icon
            v-if="pressMentionHasLandTrusts"
            class="text-accent"
            :icon="['fal', 'mountain-sun']"
          />
          <font-awesome-icon
            v-if="pressMentionHasRegions"
            class="text-accent"
            :icon="['fal', 'map']"
          />
          <font-awesome-icon
            v-if="pressMentionHasLocations"
            class="text-accent"
            :icon="['fal', 'location-dot']"
          />
        </div>
      </div>
    </template>
  </component>
</template>

<script>
import ItemMixin from '@/mixins/Item.mixin'
import SourceInstanceMixin from '@/mixins/SourceInstance.mixin'

export default {
  mixins: [ItemMixin, SourceInstanceMixin],
  setup(props) {
    const pressMention = usePressMention(transform.storyblokToComponentProps(props.source))

    return {
      pressMention,
      pressMentionLabel: pressMention.publishDateFormatted,
      pressMentionTitle: pressMention.sys?.name,
      pressMentionSubtitle: pressMention.publicationName,
      pressMentionPublicationUrl: pressMention.publicationUrl,
      pressMentionExcerpt: pressMention.excerpt,
      pressMentionHasMentionedData: pressMention.hasMentionedData,
      pressMentionHasLandTrusts: pressMention.hasLandTrusts,
      pressMentionHasRegions: pressMention.hasRegions,
      pressMentionHasLocations: pressMention.hasLocations,
      pressMentionLandTrustsData: pressMention.landTrustsData,
      pressMentionRegionsLinks: pressMention.regionsLinks,
      pressMentionLocationsFullName: pressMention.locationsFullName,
      pressMentionSlug: pressMention.sys?.full_slug
        ? `/${pressMention.sys.full_slug}`
        : undefined
    }
  },
  data() {
    return {
      fetchingMentionedData: false,
      fetchedMentionedData: false
    }
  },
  computed: {
    mentionedDataString() {
      const mentionedData = [
        this.pressMentionHasLandTrusts && 'land trusts',
        this.pressMentionHasRegions && 'regions',
        this.pressMentionHasLocations && 'locations'
      ].filter(Boolean)

      const last = mentionedData.pop()

      return mentionedData.length
        ? `${mentionedData.join(', ')} & ${last}`
        : last
    }
  },
  methods: {
    async fetchMentionedData() {
      this.fetchingMentionedData = true

      await this.pressMention.fetchLandTrustsData()
      await this.pressMention.fetchRegionsLinks()

      this.fetchingMentionedData = false
      this.fetchedMentionedData = true
    }
  }
}
</script>
