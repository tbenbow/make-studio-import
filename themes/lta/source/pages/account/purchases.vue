<template>
  <Blocks class="account-purchases">
    <Heading title-tag="h4">
      <template #description>
        <p>
          Resources you've purchased from the Land Trust Alliance are shown
          below.<br />Questions? Contact
          <LinkComponent link="mailto:resources@lta.org">resources@lta.org</LinkComponent>.
        </p>
      </template>
    </Heading>
    <ItemList
      v-if="userProductsIds && userProductsIds.length"
      :show-source-pagination="true"
      :source="resourcesSortedByUserPurchaseDateUuids.join(',')"
      :source-limit="10"
      :source-item-template="{ type: 'card-horizontal' }"
      :source-allow-restricted="true"
    >
      <template #before-source-item="{ story }">
        <aside class="details">
          <div v-if="hasProduct(story.content.products[0].salesforceId)">
            Purchased {{ formatUserProductDate(story.content.products[0].salesforceId) }}
          </div>
        </aside>
      </template>
      <template #empty-source>
        <Notice :panel="true"> No purchases found. </Notice>
      </template>
    </ItemList>
    <Notice v-else :panel="true"> You have no purchases. </Notice>
  </Blocks>
</template>

<script setup lang="ts">
const { user } = useLtaAuth()
const { getProduct, hasProduct } = useUser(user.value)
const { formatDate } = useDateFns()

// The user's product IDs (already sorted by date)
const userProductsIds = computed(() => {
  return user.value?.products?.length
    ? [...user.value.products].map((product) => product.id)
    : undefined
})

// Storyblok resources sorted by the user's purchase date
const resourcesSortedByUserPurchaseDate = ref([])

if (userProductsIds.value?.length) {
  const requestFetch = useRequestFetch()
  resourcesSortedByUserPurchaseDate.value = await requestFetch('/api/stories', {
    query: {
      params: {
        per_page: 100,
        content_type: 'Resource',
        filter_query: {
          'products.0.salesforceId': { in: userProductsIds.value?.join(',') }
        },
        excluding_fields: 'access,accessGroups,body,type,featured,excerpt,description,image,reviewDate,reviewDateLabel,topics,regions,expertise,demographics,landHistoryTopics,internal,source,author,location,instructor,length,startDate,startDateAllDay,endDate,endDateAllDay,locationAndDate,sponsors,content,contentAssets,contentLink,webinarPass,registrations,relatedResources,relatedResourcesByTopic,relatedResourcesByType,relatedResourcesByExpertise,relatedResourcesByRegions,relatedResourcesByDemographics,relatedResourcesByTags,meta'
      }
    }
  })

  // Sort Storyblok resources according to the user's product IDs
  resourcesSortedByUserPurchaseDate.value.sort((a: any, b: any) => {
    const indexOfA = userProductsIds.value?.indexOf(a.content?.products?.[0]?.salesforceId) || 0
    const indexOfB = userProductsIds.value?.indexOf(b.content?.products?.[0]?.salesforceId) || 0

    return indexOfA - indexOfB
  })
}

// Extract the UUIDs of the sorted resources
const resourcesSortedByUserPurchaseDateUuids = computed(() => {
  return resourcesSortedByUserPurchaseDate.value.map((resource: any) => resource.uuid)
})

// Format the date of a user's product purchase
function formatUserProductDate(salesforceId?: string) {
  const product = salesforceId
    ? getProduct(salesforceId)
    : undefined
  
  return product?.date
    ? formatDate(product?.date)
    : undefined
}

useHead({
  title: 'Purchases'
})
</script>

<style lang="postcss" scoped>
.account-purchases {
  :deep(.item-list) {
    > .item-list-source-item {
      @apply grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-12;

      .details {
        @apply xl:col-span-3 xl:order-2 pt-3 text-sm border-t border-black-200;
      }

      .item {
        @apply xl:col-span-9;
      }
    }
  }
}
</style>
