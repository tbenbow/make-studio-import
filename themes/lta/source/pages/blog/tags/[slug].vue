<template>
  <div v-if="tag" class="page tag-page" :class="`tag-${params.slug}`">
    <Blocks>
      <Breadcrumbs
        :breadcrumbs="[
          {
            name: 'Blog',
            link: '/blog'
          },
          {
            name: 'Tags',
            link: '/blog/tags'
          },
          {
            name: tag.name,
            link: params.slug
          }
        ]"
      />
      <Heading
        :title="`Tag: ${tag?.name}`"
        title-tag="h1"
        size="large"
        width="large"
        title-class="h2"
      />
      <div class="blog-posts">
        <div class="main">
          <ItemList
            :show-source-pagination="true"
            :source="['Post']"
            source-sort-by="first_published_at"
            source-sort-direction="desc"
            :source-limit="10"
            :source-tag="tag.name"
            source-slug-starts-with="blog/"
            :source-item-template="{
              orientation: 'horizontal',
              bodySize: 'small'
            }"
          />
        </div>
        <aside class="sidebar">
          <TagList starts-with="blog/" :current-slug="params.slug" />
        </aside>
      </div>
    </Blocks>
  </div>
</template>

<script setup lang="ts">
const { params } = useRoute()

const tag = ref()

const { data: tags } = await useFetch<any[]>('/api/tags')

const _tag = tags.value?.find((t) => changeCase.kebabCase(t.name) === params.slug)

if (_tag) {
  tag.value = _tag
} else {
  showError({ statusCode: 404, message: 'Tag does not exist' })
}

// Set metadata
const { head, seoMeta } = useStory(tag.value)
useHead(head)
useSeoMeta(seoMeta)
</script>

<style lang="postcss" scoped>
.tag-page {
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
