<template>
  <LayoutSection
    v-editable="$props"
    class="blog-banner"
    background-color="green-dark"
  >
    <Banner
      :title="blogTitle"
      :subtitle="blogSubtitle"
      :background-image="backgroundImage"
      heading-width="large"
      size="large"
      align="left"
      :root="true"
      :order="0"
    >
      <template #after>
        <RefineBar>
          <ButtonComponent
            tag="button"
            icon="magnifying-glass"
            name="Search the Blog"
            size="small"
            variation="outline"
            @click="toggleSearchIsActive"
          />
        </RefineBar>
        <LayoutGrid>
          <div>
            <ItemList
              :source="['Post']"
              source-sort-by="first_published_at"
              source-sort-direction="desc"
              :source-limit="3"
              source-slug-starts-with="blog/"
              :source-item-template="{
                type: 'horizontal',
                size: 'small'
              }"
            />
          </div>
          <div v-if="featuredPost">
            <Item
              class="featured-post"
              :source="featuredPost"
              type="image"
              title-size="large"
            >
              <template #before-image>
                <Label class="label-corner" accent-color="green"
                  >Featured Post</Label
                >
              </template>
            </Item>
          </div>
        </LayoutGrid>
      </template>
    </Banner>
  </LayoutSection>
</template>

<script>
import { mapActions } from 'pinia'
import { useSiteStore } from '../stores/site'

export default {
  props: {
    backgroundImage: Object,
    blogTitle: String,
    blogSubtitle: String,
    featuredPost: String,
    _editable: String
  },
  methods: mapActions(useSiteStore, ['toggleSearchIsActive'])
}
</script>

<style lang="postcss" scoped>
.blog-banner {
  :deep(.banner) {
    .main,
    .content {
      @apply pb-0;
    }

    .heading {
      h1 {
        @apply inline-block mr-6;
      }

      .subtitle {
        @apply inline-block font-serif text-yellow text-lg leading-tight;
      }

      &.width-large .main {
        @apply max-w-none;
      }
    }
  }

  :deep(.refine-bar) {
    @apply mt-3 border-white text-white;

    input[type='text'] {
      @apply bg-transparent pl-8 text-base;
    }
    ::placeholder {
      @apply text-white;
    }
  }

  :deep(.layout-grid) {
    @apply mt-12;
  }

  :deep(.item-list) {
    .item {
      .body {
        @apply hidden;
      }
    }
  }

  :deep(.featured-post) {
    .label-corner {
      @apply absolute top-8 left-8;
    }
  }
}
</style>
