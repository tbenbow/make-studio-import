<template>
  <component :is="componentTag" class="logo" :link="link">
    <nuxt-img
      v-if="hasImage"
      class="image"
      :src="image.filename"
      :alt="image.alt || name"
      width="600"
      sizes="xs:1200px"
      loading="lazy"
    />
    <span v-else class="name">{{ name }}</span>
  </component>
</template>

<script>
export default {
  props: {
    name: String,
    image: Object,
    link: Object
  },
  setup(props) {
    const { isValid } = useLinkHelper(props.link)

    return {
      linkIsValid: isValid.value
    }
  },
  computed: {
    componentTag() {
      return this.linkIsValid ? 'LinkComponent' : 'span'
    },
    hasImage() {
      return typeof this.image === 'object' && this.image.filename
    }
  }
}
</script>

<style lang="postcss" scoped>
.logo {
  @apply block aspect-w-5 aspect-h-1;
}

.image {
  @apply object-contain;
}

.name {
  @apply font-bold;
}
</style>
