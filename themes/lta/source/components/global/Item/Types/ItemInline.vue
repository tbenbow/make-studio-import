<template>
  <ItemBase
    class="item-inline"
    v-bind="$props"
    :orientation="undefined"
    :icon="undefined"
    :image="undefined"
    :label="label || ' '"
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
  mixins: [ItemMixin]
}
</script>

<style lang="postcss" scoped>
.item.item-inline {
  @apply max-w-cols-10;

  @screen xl {
    :deep(.main) {
      > .header {
        @apply grid gap-x-12;
        grid-template-columns: theme('width.cols-2') 1fr;

        > .label {
          @apply row-span-2 mb-0 py-2;
        }
      }

      > .body,
      > .footer {
        padding-left: calc(theme('width.cols-2') + theme('gap.12'));
      }
    }
  }
}

/* Size */

.item.item-inline.size {
  &-small {
    @apply max-w-cols-8;

    :deep(.main) {
      > .header {
        > .label {
          @apply py-1;
        }
      }
    }
  }

  &-large {
    @apply max-w-none;
  }
}
</style>
