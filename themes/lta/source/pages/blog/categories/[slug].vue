<template>
  <Story v-if="category" v-bind="category" />
</template>

<script setup>
const { params } = useRoute()

const category = ref()

const { data: categories } = await useFetch('/api/stories', {
  query: {
    params: {
      content_type: 'Category',
      by_slugs: `*${params.slug}`
    }
  }
})

if (categories.value && categories.value.length) {
  category.value = categories.value[0]
} else {
  showError({ statusCode: 404, message: 'Category not found' })
}

// Set metadata
const { head, seoMeta } = useStory(category.value)
useHead(head)
useSeoMeta(seoMeta)
</script>
