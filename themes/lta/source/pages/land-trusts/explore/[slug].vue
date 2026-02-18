<template>
  <Story v-if="landTrust" v-bind="landTrust">
    <Callout
      title="Land Trust Alliance"
      accent-color="green"
      icon="alliance"
      button-name="Learn More"
      button-link="https://lta.org"
    >
      <p>
        The Land Trust Alliance powers our nearly 1,000 member land trusts to
        permanently protect and conserve the land we need and love, ensuring it
        will be there for today and tomorrow.
      </p>
    </Callout>
    <Next
      :links="[
        {
          title: 'Get outside. Land trusts are closer than you think.',
          buttonName: 'Explore Land Trusts',
          link: getSettingLinkUrl('rootLandTrust')
        }
      ]"
    />
  </Story>
</template>

<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'

const { params: { slug } } = useRoute()

const settingsStore = useSettingsStore()
const { getSettingLinkUrl } = storeToRefs(settingsStore)

const { data: landTrust, error } = await useFetch<any>(`/api/land-trusts/${slug}`)

if (error.value) {
  showError(error.value)
}

const props = transform.storyblokToComponentProps(landTrust.value)
const {
  name,
  imageOrDefaultUrl,
  decode
} = useLandTrust(props)

const img = useImage()

const title = name.value
const description = decode(props.description)
const image = imageOrDefaultUrl.value
  ? img(imageOrDefaultUrl.value, {}, { preset: 'ogImage' })
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
