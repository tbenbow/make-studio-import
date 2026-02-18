<template>
  <div v-editable="$props" class="press-mention">
    <Blocks :root="true">
      <Breadcrumbs />
      <Heading
        label="Press Mention"
        :title="sys.name"
        title-tag="h1"
        :subtitle="publicationName"
        width="large"
      />
      <div class="main">
        <aside class="aside">
          <div class="date">
            {{ publishDateFormatted }}
          </div>
          <Field v-if="hasRegions" class="mt-6" label="Regions" icon="map">
            <span
              v-for="(region, index) in regionsLinks"
              :key="index"
              class="text-xs"
            >
              <NuxtLink
                class="text-accent hover:underline"
                :to="`/${region.full_slug}`"
                >{{ region.name }}</NuxtLink
              ><template v-if="regionsLinks.length > index + 1">, </template>
            </span>
          </Field>
          <Field
            v-if="hasLocations && locationsFullName"
            class="mt-6"
            label="Locations"
            icon="location-dot"
          >
            <span
              v-for="(location, index) in locationsFullName"
              :key="index"
              class="text-xs"
            >
              <span>{{ location }}</span
              ><template v-if="locationsFullName.length > index + 1"
                >,
              </template>
            </span>
          </Field>
        </aside>
        <div class="content">
          <ItemList v-if="hasLandTrusts">
            <li v-for="(landTrust, index) in landTrustsData" :key="index">
              <ItemLandTrust
                type="card-horizontal"
                size="small"
                :source="landTrust"
                :display-attributes="false"
              />
            </li>
          </ItemList>
          <div class="excerpt">
            <RichText :document="excerpt" :loose="true" />
          </div>
          <ButtonComponent
            v-if="publicationUrl"
            class="mt-6"
            variation="link"
            :link="publicationUrl"
            name="Read article"
            icon="arrow-up-right-from-square"
          />
        </div>
      </div>
    </Blocks>
  </div>
</template>

<script setup lang="ts">
import type { PressMentionProps } from '~/composables/content-types/usePressMention'

const props = defineProps<PressMentionProps>()

const {
  publishDate,
  publishDateUTC,
  publishDateFormatted,
  hasLandTrusts,
  hasRegions,
  hasLocations,
  hasMentionedData,
  locationsFullName,
  landTrustsData,
  regionsLinks,
  fetchLandTrustsData,
  fetchRegionsLinks
} = usePressMention(props)

await fetchLandTrustsData()
await fetchRegionsLinks()
</script>

<style lang="postcss" scoped>
.press-mention {
}

.main {
  @apply grid gap-12 grid-cols-1 lg:grid-cols-12;

  .content {
    @apply lg:col-span-10;

    .excerpt {
      @apply lg:grid lg:grid-cols-10 lg:gap-12;

      :deep(> .rich-text) {
        @apply lg:col-span-8;
      }
    }

    :deep(.item-list) {
      @apply mb-12;
    }
  }

  .aside {
    @apply lg:col-span-2;
  }
}

.date {
  @apply py-2 text-sm font-bold uppercase tracking-wide;
}
</style>
