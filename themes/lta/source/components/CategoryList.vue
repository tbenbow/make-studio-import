<template>
  <div v-editable="$props" class="category-list">
    <Aside title="Categories">
      <template v-if="categories && categories.length" #items>
        <AsideItem
          v-for="(category, index) in categories"
          :key="index"
          v-color="category.content.color"
          :icon="category.content.icon"
        >
          <span v-if="category.full_slug === currentSlug" class="current">
            {{ category.name }}
          </span>

          <LinkComponent
            v-else
            :link="{
              name: 'blog-categories-slug',
              params: { slug: category.slug }
            }"
          >
            {{ category.name }}
          </LinkComponent>
        </AsideItem>
      </template>
    </Aside>
  </div>
</template>

<script>
export default {
  props: {
    currentSlug: String,
    _editable: String
  },
  async setup() {
    const { data: categories } = await useLazyFetch('/api/stories', {
      server: false,
      query: {
        params: {
          content_type: 'Category',
          sort_by: 'name:asc',
          per_page: 5
        }
      }
    })

    return { categories }
  }
}
</script>

<style lang="postcss" scoped>
.category-list {
  @apply lg:max-w-sm lg:ml-auto;
  a {
    @apply hover:underline;
  }
  .current {
    @apply font-bold;
  }
}
</style>
