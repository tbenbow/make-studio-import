<template>
  <div v-editable="$props" class="organization">
    <Blocks :root="true">
      <Breadcrumbs />
      <Heading label="Organization" :title="sys?.name" title-tag="h1" />
      <div class="main">
        <div class="content">
          <Field v-if="description" label="Description">
            <RichText :document="descriptionAsRichText" />
          </Field>
          <div class="flex flex-wrap gap-8 mt-12 first:mt-0">
            <Field
              v-if="type"
              icon="building"
              label="Type"
              :display-inline="true"
            >
              {{ type }}
            </Field>
            <Field
              v-if="region"
              icon="map"
              label="Region"
              :display-inline="true"
            >
              {{ region }}
            </Field>
          </div>
        </div>
        <aside v-if="websiteUrl" class="sidebar">
          <Aside class="text-center">
            <ButtonComponent :link="websiteUrl" name="Visit website" icon="browser" />
          </Aside>
        </aside>
      </div>
      <Next
        :links="[
          {
            title: 'View the organization directory',
            buttonName: 'Organization Directory',
            link: getSettingLinkUrl('rootOrganization')
          }
        ]"
      />
    </Blocks>
  </div>
</template>

<script setup lang="ts">
import type { OrganizationProps } from '~/composables/content-types/useOrganization'
import { useSettingsStore } from '~/stores/settings'

const props = defineProps<OrganizationProps>()

const { descriptionAsRichText } = useOrganization(props)

const { getSettingLinkUrl } = storeToRefs(useSettingsStore())
</script>

<style lang="postcss" scoped>
.main {
  @apply grid gap-12 grid-cols-1 lg:grid-cols-12 pt-8 border-t border-black-200;

  .content {
    @apply lg:col-span-8;
  }

  .sidebar {
    @apply lg:col-span-4;
  }
}
</style>
