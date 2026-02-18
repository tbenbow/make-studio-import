<template>
  <div
    class="tag-list"
    :class="
      twoColumns
        ? 'two-column'
        : 'one-column border border-black-200 px-8 py-7 rounded-lg'
    "
  >
    <h5 class="mb-6">
      <template v-if="display === 'popular'">Popular Tags</template>
      <template v-else>All Tags</template>
    </h5>
    <ol v-if="tags && tags.length" class="space-y-3">
      <li v-for="(tag, index) in tagsLimited" :key="index">
        <span v-if="slug(tag) === currentSlug" class="current text-sm">
          {{ tag.name }} ({{ tag.taggings_count }})
        </span>
        <LinkComponent
          v-else
          class="flex items-center gap-3 text-sm"
          :link="{ name: 'blog-tags-slug', params: { slug: slug(tag) } }"
        >
          {{ tag.name }} ({{ tag.taggings_count }})
        </LinkComponent>
      </li>
    </ol>
    <ButtonComponent
      v-if="display === 'popular'"
      class="mt-4"
      name="See All"
      variation="link"
      size="small"
      link="/blog/tags"
    />
  </div>
</template>

<script>
export default {
  props: {
    startsWith: String,
    currentSlug: String,
    display: {
      type: String,
      default: 'popular'
    },
    twoColumns: {
      type: Boolean,
      default: false
    }
  },
  async setup(props) {
    const { data: tags } = await useLazyFetch('/api/tags', {
      server: false,
      query: {
        params: {
          starts_with: props.startsWith
        }
      }
    })

    function sort(arr) {
      return props.display === 'popular'
        ? arr?.sort((a, b) =>
            a.taggings_count > b.taggings_count
              ? -1
              : a.taggings_count < b.taggings_count
              ? 1
              : 0
          )
        : arr
    }

    const tagsLimited = computed(() => {
      return props.display === 'popular'
        ? sort(tags.value)?.slice(0, 5)
        : sort(tags.value)
    })

    return {
      tags,
      tagsLimited
    }
  },
  computed: {
    sliceIf() {
      if (this.display === 'popular') {
        return this.tags.slice(0, 6)
      } else {
        return this.tags
      }
    }
  },
  methods: {
    slug(tag) {
      return changeCase.kebabCase(tag.name)
    }
  }
}
</script>

<style lang="postcss" scoped>
.tag-list {
  &.one-column {
    @apply lg:max-w-sm lg:ml-auto;
  }
  &.two-column ol {
    @screen sm {
      column-count: 2;
      li {
        @apply border-0;
      }
    }
  }
  a {
    @apply hover:underline;
  }
  .current {
    @apply font-bold;
  }
  ol li {
    @apply border-b border-line pb-2;
    counter-increment: taglistcounter;
  }

  ol > li:before {
    @apply float-left text-black-600 text-sm w-8;
    content: counter(taglistcounter);
  }
}
</style>
