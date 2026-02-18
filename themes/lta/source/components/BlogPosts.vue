<template>
  <div class="blog-posts">
    <div class="main">
      <ItemList
        :show-source-pagination="true"
        :source="['Post']"
        source-sort-by="first_published_at"
        source-sort-direction="desc"
        :source-limit="10"
        :source-slug-starts-with="fullSlugStartsWith"
        :source-item-template="{ orientation: 'horizontal', bodySize: 'small' }"
      />
    </div>
    <aside class="sidebar">
      <CategoryList />
      <AuthorList />
      <TagList :starts-with="fullSlugStartsWith" />
    </aside>
  </div>
</template>

<script>
export default {
  props: {
    fullSlugStartsWith: String
  }
}
</script>

<style lang="postcss" scoped>
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
</style>
