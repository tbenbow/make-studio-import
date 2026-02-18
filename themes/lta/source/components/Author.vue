<template>
  <div v-editable="$props" class="page author" :class="`author-${sys.slug}`">
    <Blocks>
      <Breadcrumbs
        :breadcrumbs="[
          {
            name: 'Blog',
            link: '/blog'
          },
          {
            name: 'Authors',
            link: '/blog/authors'
          },
          {
            name: sys.name,
            link: $route.fullPath
          }
        ]"
      />
      <div class="heading-wrapper">
        <nuxt-img
          v-if="image && image.filename"
          class="h-24 w-24 rounded-full"
          :src="image.filename"
          height="96"
          width="96"
          format="jpg"
          fit="cover"
          loading="lazy"
        />
        <span v-else class="icon-holder">
          <font-awesome-icon
            :icon="['fal', 'user']"
            class="icon text-black-400 text-4xl mt-2"
          />
        </span>
        <Heading :title="sys.name" title-tag="h1" size="large" width="large">
          <template #description>{{ description }}</template>
        </Heading>
      </div>
      <div class="blog-posts">
        <div class="main">
          <ItemList
            :show-source-pagination="true"
            :source="['Post']"
            source-sort-by="first_published_at"
            source-sort-direction="desc"
            :source-author="[sys.uuid]"
            :source-limit="10"
            :source-item-template="{
              orientation: 'horizontal',
              bodySize: 'small'
            }"
          />
        </div>
        <aside class="sidebar">
          <AuthorList :current-slug="sys.full_slug" />
        </aside>
      </div>
    </Blocks>
  </div>
</template>

<script>
export default {
  props: {
    description: [Object, String],
    image: Object,
    sys: Object,
    meta: [Object, String],
    _editable: String
  }
}
</script>
<style lang="postcss" scoped>
.author {
  .heading-wrapper {
    @apply flex items-start flex-col sm:inline-flex sm:flex-row sm:items-center gap-6;
    .icon-holder {
      @apply rounded-full flex items-center justify-center overflow-hidden w-24 h-24 bg-black-200 border-transparent;
      border-width: 16px;
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
