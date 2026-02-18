<template>
  <div v-editable="$props" class="job">
    <Blocks :root="true">
      <Breadcrumbs />
      <Heading
        label="Job Announcement"
        :title="sys?.name"
        title-tag="h1"
        :subtitle="
          (internal && 'Land Trust Alliance') ||
          (landTrustData && landTrustData.name)
        "
      />
      <div class="main">
        <div class="content">
          <RichText :document="description" :loose="true" />
        </div>
        <aside class="sidebar">
          <Aside title="Job Details">
            <address
              v-if="address"
              class="h-card text-sm leading-normal whitespace-pre"
            >
              <span>{{ address }}</span>
            </address>
            <div
              v-if="applicationDeadline"
              class="mt-6 pl-3 py-1 border-l-4 border-accent"
            >
              <span class="text-xs font-bold uppercase tracking-wide"
                >Application Deadline</span
              >
              <div class="mt-1 text-sm">{{ applicationDeadlineFormatted }}</div>
              <ButtonComponent
                v-if="applicationUrl && applicationDeadlineIsFuture"
                class="mt-4"
                :link="applicationUrl"
                icon="arrow-up-right-from-square"
                name="Apply Now"
              />
            </div>
            <template #items>
              <AsideItem
                v-if="locationOrRemote"
                label="Location"
                icon="location-dot"
                >{{ locationOrRemote }}</AsideItem
              >
              <AsideItem
                v-if="category"
                label="Job Category"
                icon="folder-tree"
                >{{ category }}</AsideItem
              >
              <AsideItem v-if="type" label="Job Type" icon="briefcase">{{
                type
              }}</AsideItem>
            </template>
          </Aside>
          <ItemLandTrust
            v-if="hasLandTrust && landTrustData"
            class="mt-8"
            type="card"
            :source="landTrustData"
          />
        </aside>
      </div>
      <Next
        :links="[
          {
            title: 'Find a Career in Land Conservation',
            buttonName: 'Job Board',
            link: getSettingLinkUrl('rootJob')
          }
        ]"
      />
    </Blocks>
  </div>
</template>

<script setup lang="ts">
import type { JobProps } from '~/composables/content-types/useJob'
import { useSettingsStore } from '~/stores/settings'

const { getSettingLinkUrl } = storeToRefs(useSettingsStore())

const props = defineProps<JobProps>()

const {
  locationOrRemote,
  applicationDeadlineIsFuture,
  applicationDeadlineFormatted
} = useJob(props)

const hasLandTrust = computed(() => props.landTrust?.id ? true : false)

const { data: landTrustData, execute: fetchLandTrust } = await useLazyFetch<any>(`/api/land-trusts/${props.landTrust?.id}`, {
  immediate: false,
  server: false
})

onMounted(() => {
  if (hasLandTrust.value) {
    fetchLandTrust()
  }
})
</script>

<style lang="postcss" scoped>
.job {
}

.main {
  @apply grid gap-12 grid-cols-1 lg:grid-cols-12 pt-8 border-t border-black-200;

  .content {
    @apply lg:col-span-8;
  }

  .sidebar {
    @apply lg:col-span-4 lg:-mt-14;
  }
}
</style>
