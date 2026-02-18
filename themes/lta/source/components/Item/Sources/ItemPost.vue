<template>
  <component
    :is="componentForType"
    class="item-post"
    v-bind="computedProps"
    :title="title || postTitle"
    :image="image || postImage"
    :link="link || postSlug"
  >
    <template #before-image>
      <slot name="before-image" />
    </template>
    <template v-if="postCategories && postCategories.length" #label>
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span
          v-for="(category, index) in postCategories"
          :key="index"
          v-color="type === types.IMAGE ? `white` : category.content.color"
          class="flex items-center text-accent leading-tight"
        >
          <span v-if="category.slug === pageSlug" class="current">
            <font-awesome-icon
              v-if="category.content.icon"
              class="icon mr-2 scale-125"
              :icon="['fal', category.content.icon]"
            />
            {{ category.name }}
          </span>
          <LinkComponent
            v-else
            :link="{
              name: 'blog-categories-slug',
              params: { slug: category.slug }
            }"
            class="hover:underline"
          >
            <font-awesome-icon
              v-if="category.content.icon"
              class="icon mr-2 scale-125"
              :icon="['fal', category.content.icon]"
            />
            {{ category.name }}
          </LinkComponent>
        </span>
      </div>
    </template>
    <template v-if="postAuthorsString || postPublishDate" #subtitle>
      <div class="flex flex-wrap gap-2">
        <template v-if="postAuthorsString">
          <span>By {{ postAuthorsString }}</span>
          <span v-if="postPublishDate">•</span>
        </template>
        <span v-if="postPublishDate">{{ postPublishDateFormatted }}</span>
      </div>
    </template>
    <p v-if="postExcerpt && type !== types.IMAGE">{{ postExcerpt }}</p>
  </component>
</template>

<script>
import ItemMixin, { types } from '@/mixins/Item.mixin'
import SourceInstanceMixin from '@/mixins/SourceInstance.mixin'

export default {
  mixins: [ItemMixin, SourceInstanceMixin],
  setup(props) {
    const post = usePost(transform.storyblokToComponentProps(props.source))

    return {
      post,
      postTitle: post.sys?.name,
      postImage: post.hasImage
        ? post.image
        : post.meta?.og_image
        ? { filename: post.meta.og_image, alt: post.sys?.name }
        : undefined,
      postSlug: post.sys?.full_slug
        ? `/${post.sys.full_slug}`
        : undefined,
      pageSlug: useRoute().params.slug,
      postExcerpt: post.excerpt,
      postPublishDate: post.publishDate,
      postPublishDateFormatted: post.publishDateFormatted,
      postCategories: post.categories,
      postAuthorsString: post.authorsString
    }
  },
  data() {
    return {
      types
    }
  }
}
</script>
