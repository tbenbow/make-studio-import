<template>
  <div v-editable="$props" class="post">
    <Blocks :root="true">
      <Breadcrumbs :description="excerpt" />
      <Heading :title="sys.name" title-tag="h1" width="large">
        <template v-if="categories && categories.length" #label>
          <div class="flex flex-wrap items-center gap-12 mb-4">
            <LinkComponent
              v-for="(category, index) in categories"
              :key="index"
              v-color="category.content.color"
              class="label"
              :link="{
                name: 'blog-categories-slug',
                params: { slug: category.slug }
              }"
            >
              <font-awesome-icon
                v-if="category.content.icon"
                :icon="['fal', category.content.icon]"
                class="label-icon"
              />
              <span class="label-text">{{ category.name }}</span>
            </LinkComponent>
          </div>
        </template>
        <template v-if="excerpt" #description>
          <p>{{ excerpt }}</p>
        </template>
        <template v-if="authorsString || publishDate" #footer>
          <div class="flex flex-wrap gap-3">
            <template v-if="authorsString">
              <span>By {{ authorsString }}</span>
              <span v-if="publishDate">•</span>
            </template>
            <span v-if="publishDate">{{ publishDateFormatted }}</span>
          </div>
        </template>
      </Heading>
      <div class="main">
        <aside class="aside">
          <template v-if="authors && authors.length">
            <div v-for="(author, index) in authors" :key="index" class="author">
              <LinkComponent
                :link="{
                  name: 'blog-authors-slug',
                  params: { slug: author.slug }
                }"
              >
                <nuxt-img
                  v-if="author.content.image"
                  class="w-16 h-16 mb-3"
                  :src="author.content.image.filename"
                  :alt="author.content.image.alt"
                  width="128"
                  height="128"
                  fit="cover"
                  format="jpg"
                  loading="lazy"
                />
                <span v-else class="icon-holder">
                  <font-awesome-icon :icon="['fal', 'user']" class="icon" />
                </span>
                <h6 class="text-body mb-2 hover:text-green">
                  {{ author.name }}
                </h6>
              </LinkComponent>
              <p v-if="author.content.description" class="text-2xs">
                {{ author.content.description }}
              </p>
            </div>
          </template>
          <Field
            v-if="sys.tag_list && sys.tag_list.length"
            class="mt-6"
            label="Tags"
            icon="tag"
          >
            <ul class="space-y-1">
              <li
                v-for="(tag, index) in sys.tag_list"
                :key="index"
                class="text-2xs"
              >
                <LinkComponent
                  :link="{
                    name: 'blog-tags-slug',
                    params: { slug: slug(tag) }
                  }"
                  class="text-accent hover:underline"
                  >{{ tag }}</LinkComponent
                >
              </li>
            </ul>
          </Field>
        </aside>
        <div class="content">
          <Asset
            v-if="hasImage"
            class="image"
            v-bind="image as object"
            :image-options="{ width: 1032 }"
          />
          <div class="body">
            <RichText :document="body" :loose="true" />
          </div>
        </div>
      </div>
      <LayoutSection
        v-if="categories && categories.length"
        background-color="white"
        top-edge="shadow-top"
      >
        <!-- TODO: add Subscribe to Posts -->
        <Slider
          v-if="categories && categories.length"
          :title="`More in ${categories[0].name}`"
          :source="['Post']"
          :source-category="[categories[0].uuid]"
          :source-limit="8"
          source-slug-starts-with="blog/"
          :source-item-template="{
            type: 'image',
            bodySize: 'small'
          }"
        />
      </LayoutSection>
    </Blocks>
  </div>
</template>

<script setup lang="ts">
import type { PostProps } from '~/composables/content-types/usePost'

const props = defineProps<PostProps>()

const {
  publishDate,
  publishDateFormatted,
  authorsString,
  hasImage
} = usePost(props)

function slug(tag: string) {
  return changeCase.kebabCase(tag)
}
</script>

<style lang="postcss" scoped>
.post {
}

:deep(.heading) {
  .label {
    @apply flex items-center gap-x-3 text-accent;

    &-icon {
      @apply text-xl;
    }

    &-text {
      @apply text-sm font-bold uppercase tracking-wide;
    }

    &:hover {
      .label-text {
        @apply underline;
      }
    }
  }
}

.author {
  img {
    @apply rounded-full;
  }
}

.main {
  @apply grid gap-12 grid-cols-1 lg:grid-cols-12;

  .content {
    @apply lg:col-span-10;

    .body {
      @apply lg:grid lg:grid-cols-10 lg:gap-12;

      :deep(> .rich-text) {
        @apply lg:col-span-8;
      }
    }
  }

  .aside {
    @apply space-y-8 lg:col-span-2;

    .icon-holder {
      @apply rounded-full flex items-center justify-center overflow-hidden w-16 h-16 bg-black-200 mb-3 border-8 border-transparent;

      > .icon {
        @apply text-black-400 text-3xl mt-2;
      }
    }
  }
}

.content {
  :deep(.image) {
    @apply mb-12 rounded-lg;
  }
}
</style>
