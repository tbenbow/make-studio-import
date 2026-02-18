<template>
  <div
    class="author-list"
    :class="
      twoColumns
        ? 'two-column'
        : 'one-column border border-black-200 px-8 py-7 rounded-lg'
    "
  >
    <h5 class="mb-6">
      <template v-if="display === 'short'">Authors</template>
      <template v-else>All Authors</template>
    </h5>
    <ul v-if="authors && authors.length" class="space-y-3">
      <li v-for="(author, index) in authorsLimited" :key="index">
        <span
          v-if="author.full_slug === currentSlug"
          class="author-list-item font-bold"
        >
          <nuxt-img
            v-if="author.content.image && author.content.image.filename"
            class="h-8 w-8 rounded-full"
            :src="author.content.image.filename"
            height="64"
            width="64"
            format="jpg"
            fit="cover"
            loading="lazy"
          />
          <span v-else class="icon-holder">
            <font-awesome-icon :icon="['fal', 'user']" class="icon" />
          </span>
          {{ author.name }}
        </span>
        <LinkComponent
          v-else
          class="author-list-item hover:underline"
          :link="{ name: 'blog-authors-slug', params: { slug: author.slug } }"
        >
          <nuxt-img
            v-if="author.content.image && author.content.image.filename"
            class="h-8 w-8 rounded-full"
            :src="author.content.image.filename"
            height="64"
            width="64"
            format="jpg"
            fit="cover"
            loading="lazy"
          />
          <span v-else class="icon-holder">
            <font-awesome-icon :icon="['fal', 'user']" class="icon" />
          </span>

          {{ author.name }}
        </LinkComponent>
      </li>
    </ul>
    <ButtonComponent
      v-if="display === 'short'"
      class="mt-4"
      name="See All"
      variation="link"
      size="small"
      link="/blog/authors"
    />
  </div>
</template>

<script>
export default {
  props: {
    currentSlug: String,
    display: {
      type: [String, Array],
      default: 'short'
    },
    twoColumns: {
      type: Boolean,
      default: false
    }
  },
  async setup(props) {
    const { data: authors } = await useLazyFetch('/api/stories', {
      server: false,
      query: {
        params: {
          content_type: 'Author',
          sort_by: 'name:asc',
          per_page: 100
        }
      }
    })

    const authorsLimited = computed(() => {
      return props.display === 'short'
        ? authors.value?.slice(0, 5)
        : authors.value
    })

    return {
      authors,
      authorsLimited
    }
  }
}
</script>

<style lang="postcss" scoped>
.author-list {
  &.one-column {
    @apply lg:max-w-sm lg:ml-auto;
  }
  &.two-column ul {
    @screen sm {
      column-count: 2;
    }
  }
  .author-list-item,
  :deep(.author-list-item) {
    @apply flex items-center gap-3 text-xs uppercase tracking-wide;
  }
  .icon-holder {
    @apply rounded-full flex items-center justify-center overflow-hidden w-8 h-8 bg-black-200;
  }
  .icon {
    @apply text-black-400 text-xl mt-2;
  }
}
</style>
