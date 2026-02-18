<template>
  <ItemBase
    class="item-card"
    v-bind="$props"
    :body-size="bodySize || defaultBodySize"
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
    defaultBodySize() {
      switch (this.size) {
        case '':
        case undefined:
          return 'small'

        default:
          return this.size
      }
    }
  }
}
</script>

<style lang="postcss" scoped>
.item.item-card {
  @apply relative flex flex-col bg-background rounded-lg shadow-double;

  :deep(.figure) {
    @apply mb-0 !important;

    .image {
      @apply rounded-b-none;
    }
  }

  :deep(.main) {
    @apply flex-1 p-6;
  }
}

/* Has Icon */

.item.item-card.has-icon {
  &:not(.has-image) {
    :deep(.figure) {
      @apply p-6 pb-0;

      .icon-blob {
        @apply -mt-12;
      }
    }

    &.size-small {
      :deep(.figure) {
        @apply p-4 pb-0;
      }
    }

    &.size-large {
      :deep(.figure) {
        @apply md:p-8 md:pb-0;
      }
    }
  }
}

/* Size */

.item.item-card.size {
  &-small {
    :deep(.main) {
      @apply p-4;
    }
  }

  &-large {
    :deep(.main) {
      @apply md:p-8;
    }
  }
}

/* Orientation */

.item.item-card.orientation-horizontal {
  @apply flex-row items-center;

  :deep(.figure) {
    @apply self-stretch mr-0;

    .image {
      @apply h-full w-full object-cover object-center rounded-none rounded-l-lg;
    }
  }

  &.size-small {
    @apply min-h-[108px];
  }

  @screen <sm {
    :deep(.figure) {
      @apply max-w-[108px] max-h-[324px];
    }
  }
}
</style>
