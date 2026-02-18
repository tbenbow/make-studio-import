<template>
  <div
    v-editable="$props"
    class="page category"
    :class="`category-${sys.slug}`"
  >
    <Blocks>
      <Breadcrumbs
        :breadcrumbs="[
          {
            name: 'Blog',
            link: '/blog'
          },
          {
            name: 'Categories',
            link: '/blog/categories'
          },
          {
            name: sys.name,
            link: $route.fullPath
          }
        ]"
      />
      <Heading :title="sys.name" title-tag="h1" size="large" width="large">
        <template #label>
          <IconBlob :icon="icon" :accent-color="color" />
        </template>
      </Heading>
      <div class="blog-posts">
        <div class="main">
          <ItemList
            :show-source-pagination="true"
            :source="['Post']"
            source-sort-by="first_published_at"
            source-sort-direction="desc"
            :source-limit="10"
            :source-category="[sys.uuid]"
            source-slug-starts-with="blog/"
            :source-item-template="{
              orientation: 'horizontal',
              bodySize: 'small'
            }"
          />
        </div>
        <aside class="sidebar">
          <CategoryList :current-slug="sys.full_slug" />
        </aside>
      </div>
    </Blocks>
  </div>
</template>

<script>
export default {
  props: {
    category: String,
    color: String,
    icon: String,
    sys: Object,
    meta: [Object, String],
    _editable: String
  }
}
</script>
<style lang="postcss" scoped>
.category {
  :deep(.heading) {
    .header {
      @apply flex items-start flex-col sm:inline-flex sm:flex-row sm:items-center gap-6;
    }
  }

  .blog-posts {
    @apply md:grid md:grid-cols-12 md:gap-12;

    .main {
      @apply col-span-8 mb-10;
    }

    .sidebar {
      @apply col-span-4;
    }
  }

  .post-list {
    @apply space-y-12;
  }

  .sidebar {
    @apply space-y-8;
  }
}
</style>
