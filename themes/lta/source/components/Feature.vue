<template>
  <div
    :id="id"
    v-editable="$props"
    :id-name="idName"
    class="feature"
    :class="{
      [`type-${type}`]: type
    }"
  >
    <div class="main">
      <div class="content">
        <RichText v-if="body || $slots.default" class="body" :document="body">
          <template #before>
            <Label v-if="label" :name="label" />
            <h2 v-if="title" class="title">{{ title }}</h2>
          </template>
          <slot />
        </RichText>
      </div>
      <aside class="aside">
        <Asset
          v-if="hasImage"
          v-bind="image"
          :land-trust="landTrust"
          :image-options="computedImageOptions"
          :aspect-ratio="imageAspectRatio || '4:3'"
        />
        <Gallery
          v-else-if="hasGallery"
          v-bind="gallery[0]"
          :image-options="computedImageOptions"
        />
      </aside>
    </div>
  </div>
</template>

<script>
import { aspectRatios } from '@/components/Asset/Asset.vue'

const types = {
  CARD: 'card'
}

export default {
  props: {
    label: String,
    title: String,
    body: Object,
    image: Object,
    imageAspectRatio: {
      type: String,
      validator: (value) => ['', ...aspectRatios].includes(value)
    },
    imageOptions: Object,
    landTrust: Object,
    gallery: Array,
    type: String,
    _editable: String
  },
  data() {
    return {
      types
    }
  },
  computed: {
    id() {
      return this.idName ? changeCase.kebabCase(this.idName) : undefined
    },
    idName() {
      return this.label || this.title
    },
    hasImage() {
      return !!(typeof this.image === 'object' && this.image.filename)
    },
    hasGallery() {
      return Array.isArray(this.gallery) && this.gallery.length
    },
    defaultImageOptions() {
      const options = {}

      switch (this.type) {
        case 'card':
          options.width = 1000
          options.height = 1000
          break

        default:
          options.width = 816
      }

      return options
    },
    computedImageOptions() {
      return lodash.merge({}, this.defaultImageOptions, this.imageOptions)
    }
  }
}
</script>

<style lang="postcss" scoped>
.feature {
  .main {
    @apply grid gap-12 grid-cols-1 lg:grid-cols-12;
  }

  .content {
    @apply order-2 relative z-1 lg:order-1 lg:col-span-4 lg:pt-12;
  }

  .aside {
    @apply relative order-1 lg:order-2 lg:col-span-8;
  }
}

/* Type */

.feature.type {
  &-card {
    .content {
      @apply lg:col-start-1 lg:col-end-8 lg:row-[1] lg:my-24 lg:pr-container-padding lg:py-12 lg:bg-background lg:rounded-r-lg;
    }

    .aside {
      @apply lg:col-start-5 lg:col-end-13 lg:row-[1] -mr-container;

      :deep(.asset) {
        &,
        .asset-container {
          @apply lg:h-full;
        }

        .asset-container {
          @apply lg:pb-0;
        }

        img {
          @apply rounded-r-none lg:rounded-none;
        }
      }

      :deep(.gallery) {
        &,
        .hooper-container,
        .hooper {
          @apply lg:h-full;
        }
      }
    }
  }
}
</style>
