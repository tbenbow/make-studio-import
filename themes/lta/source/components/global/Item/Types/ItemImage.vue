<template>
  <ItemBase
    class="item-image"
    v-bind="$props"
    :orientation="undefined"
    icon-size=""
    icon-style="circle"
    :image-options="computedImageOptions"
    v-on="listeners($attrs)"
  >
    <template v-for="(_, slotName) in $slots" v-slot:[slotName]>
      <slot :name="slotName" />
    </template>
  </ItemBase>
</template>

<script>
import ItemMixin from '@/mixins/Item.mixin'

export default {
  mixins: [ItemMixin],
  computed: {
    defaultImageOptions() {
      const options = {
        format: 'webp',
        // quality: 60,
        fit: 'cover',
        modifiers: { gravity: 'subject' }
      }

      if (this.size === 'small') {
        options.width = 600
        options.height = Math.round(options.width * (3 / 4))
      } else if (this.size === 'large') {
        options.width = 1248
        options.height = Math.round(options.width * (3 / 4))
      } else {
        options.width = 816
        options.height = Math.round(options.width * (3 / 4))
      }

      options.sizes = `xs:100vw max:${options.width}px 2x:${
        options.width * 2
      }px`

      return options
    }
  }
}
</script>

<style lang="postcss" scoped>
.item.item-image {
  --color-heading: theme('colors.white.DEFAULT');
  --color-body: theme('colors.white.DEFAULT');
  --color-body-2: var(--color-body);
  --color-body-3: theme('colors.white.700');
  --color-body-4: theme('colors.white.300');
  @apply relative min-h-[450px] min-w-[276px] flex items-end;

  :deep(.item-loader) {
    @apply absolute h-full w-full;
  }

  :deep(.figure) {
    @apply absolute inset-0 mb-0;

    .icon-blob {
      @apply absolute left-1/2 top-0 z-10 -mt-6 mb-0 -translate-x-1/2;
    }

    .image {
      @apply h-full object-cover object-center;
    }

    &:after {
      @apply visible top-auto h-3/5 bg-gradient-to-t from-black rounded-b-lg;
    }
  }

  :deep(.main) {
    @apply relative flex-1 p-6 sm:p-8;
  }

  :deep(.label) {
    --color-accent: theme('colors.stone');
  }

  :deep(.body) {
    > div {
      > *:not(:first-child) {
        @apply hidden;
      }

      > *:first-child {
        @apply line-clamp-3;
      }
    }
  }
}

/* Has Icon & Image */

.item.item-image.has-icon.has-image {
  :deep(.figure) {
    .icon-blob {
      @apply top-0 translate-y-0;
    }
  }
}

/* Has Link */

.item.item-image.has-link {
  :deep(.main) {
    &,
    :not(a) {
      @apply pointer-events-none;
    }
  }
}

/* Size */

.item.item-image.size {
  &-small {
    @apply min-h-[369px];

    :deep(.main) {
      @apply p-6;
    }
  }

  &-large {
    @apply max-w-cols-12 sm:min-h-[702px];

    :deep(.main) {
      @apply max-w-cols-8 sm:p-12;
    }
  }
}
</style>
