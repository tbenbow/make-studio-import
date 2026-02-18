<template>
  <Story v-if="affiliate" v-bind="affiliate">
    <Breadcrumbs
      :breadcrumbs="[
        {
          name: 'Resources',
          link: '/resources'
        },
        {
          name: 'Connect',
          link: '/resources/connect'
        },
        {
          name: 'Affiliate Member Directory',
          link: getSettingLinkUrl('rootAffiliate')
        },
        {
          name: affiliate.name,
          link: $route.fullPath
        }
      ]"
    />
    <template #after>
      <Next
        :links="[
          {
            title: 'Connect with Industry Professionals',
            link: getSettingLinkUrl('rootAffiliate'),
            buttonName: 'Affiliate Member Directory'
          }
        ]"
      />
    </template>
  </Story>
</template>

<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'

const { params: { slug } } = useRoute()

const settingsStore = useSettingsStore()
const { getSettingLinkUrl } = storeToRefs(settingsStore)

const { data: affiliate, error } = await useFetch<any>('/api/affiliate', { query: { slug } })

if (error.value) {
  showError(error.value)
}

const props = transform.storyblokToComponentProps(affiliate.value)

const img = useImage()

const title = props.sys?.name
const description = props.description
const image = props.imageUrl
  ? img(props.imageUrl, {}, { preset: 'ogImage' })
  : undefined

useHead({
  title
})

useSeoMeta(withoutEmptyValues({
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: image,
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: image
}))
</script>
