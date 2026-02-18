<template>
  <Story v-if="author" v-bind="author" />
</template>

<script setup>
const { params } = useRoute()

const author = ref()

const { data: authors } = await useFetch('/api/stories', {
  query: {
    params: {
      content_type: 'Author',
      by_slugs: `*${params.slug}`
    }
  }
})

if (authors.value && authors.value.length) {
  author.value = authors.value[0]
} else {
  showError({ statusCode: 404, message: 'Author not found' })
}

// Set metadata
const { head, seoMeta } = useStory(author.value)
useHead(head)
useSeoMeta(seoMeta)
</script>
