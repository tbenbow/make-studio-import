<template>
  <Blocks class="account-registrations">
    <Heading class="relative" title-tag="h4">
      <template #description>
        <p>
          Access webinars, conferences and other trainings you've registered for
          below.<br />Questions? Contact
          <LinkComponent link="mailto:learn@lta.org">learn@lta.org</LinkComponent>.
        </p>
      </template>
      <template #footer>
        <FormField
          class="[&_label]:!flex-grow-0 xl:absolute xl:right-0 xl:top-0"
          :inline="true"
          label="Sort"
          :inputs="[
            {
              component: 'FormSelect',
              name: 'Sort',
              value: sortValue,
              options: sortOptions,
              hideEmptyOption: true
            }
          ]"
          @change="sortValue = $event.target.value"
        />
      </template>
    </Heading>
    <ItemList
      v-if="userRegistrationsIds && userRegistrationsIds.length"
      v-bind="itemListSortProps"
      :show-source-pagination="true"
      :source-limit="10"
      :source-item-template="{ type: 'card-horizontal' }"
      :source-allow-restricted="true"
    >
      <template #before-source-item="{ story }">
        <aside class="details">
          <div
            v-if="hasRegistration(story.content.registrations[0].salesforceId)"
          >
            Registered {{ formatUserRegistrationDate(story.content.registrations[0].salesforceId) }}
          </div>
        </aside>
      </template>
      <template #empty-source>
        <Notice :panel="true"> No registrations found. </Notice>
      </template>
    </ItemList>
    <Notice v-else :panel="true"> You have no registrations. </Notice>
  </Blocks>
</template>

<script setup lang="ts">
const { user } = useLtaAuth()
const { getRegistration, hasRegistration } = useUser(user.value)
const { formatDate } = useDateFns()

// The user's registration IDs (already sorted by date)
const userRegistrationsIds = computed(() => {
  return user.value?.registrations?.length
    ? [...user.value.registrations].map((registration) => registration.id)
    : undefined
})

// Storyblok resources sorted by the user's registration date
const resourcesSortedByUserRegistrationDate = ref([])

if (userRegistrationsIds.value?.length) {
  const requestFetch = useRequestFetch()
  resourcesSortedByUserRegistrationDate.value = await requestFetch('/api/stories', {
    query: {
      params: {
        per_page: 100,
        content_type: 'Resource',
        filter_query: {
          'registrations.0.salesforceId': { in: userRegistrationsIds.value?.join(',') }
        },
        excluding_fields: 'access,accessGroups,body,type,featured,excerpt,description,image,reviewDate,reviewDateLabel,topics,regions,expertise,demographics,landHistoryTopics,internal,source,author,location,instructor,length,startDate,startDateAllDay,endDate,endDateAllDay,locationAndDate,sponsors,content,contentAssets,contentLink,webinarPass,products,relatedResources,relatedResourcesByTopic,relatedResourcesByType,relatedResourcesByExpertise,relatedResourcesByRegions,relatedResourcesByDemographics,relatedResourcesByTags,meta'
      }
    }
  })

  // Sort Storyblok resources according to the user's registration IDs
  resourcesSortedByUserRegistrationDate.value.sort((a: any, b: any) => {
    const indexOfA = userRegistrationsIds.value?.indexOf(a.content?.registrations?.[0]?.salesforceId) || 0
    const indexOfB = userRegistrationsIds.value?.indexOf(b.content?.registrations?.[0]?.salesforceId) || 0

    return indexOfA - indexOfB
  })
}

// Extract the UUIDs of the sorted resources
const resourcesSortedByUserRegistrationDateUuids = computed(() => {
  return resourcesSortedByUserRegistrationDate.value.map((resource: any) => resource.uuid)
})

// Sort options
const sortOptions = [
  { label: 'Registration Date', value: 'registrationDate' },
  { label: 'Upcoming Events', value: 'upcomingEvents' }
]
const sortValue = ref(sortOptions[0].value)

// Props for ItemList component based on the selected sort option
const itemListSortProps = computed(() => {
  if (sortValue.value === 'upcomingEvents') {
    return {
      source: ['Resource'],
      sourceFilterQuery: {
        'registrations.0.salesforceId': { in: userRegistrationsIds.value?.join(',') }
      },
      sourceSortBy: 'content.startDate'
    }
  }

  // Default: sortValue.value === 'registrationDate'
  return {
    source: resourcesSortedByUserRegistrationDateUuids.value.join(',')
  }
})

// Function to format the registration date for display
function formatUserRegistrationDate(salesforceId?: string) {
  const registration = salesforceId
    ? getRegistration(salesforceId)
    : undefined
  
  return registration?.date
    ? formatDate(registration?.date)
    : undefined
}

useHead({
  title: 'Registrations'
})
</script>

<style lang="postcss" scoped>
.account-registrations {
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
