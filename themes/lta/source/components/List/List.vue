<template>
  <ul
    v-editable="$props"
    class="list"
    :class="{ [`spacing-${spacing}`]: spacing }"
  >
    <slot>
      <template v-if="items && items.length">
        <ListItem
          v-for="(item, index) in items"
          :key="index"
          :size="size"
          v-bind="item"
        />
      </template>
    </slot>
  </ul>
</template>

<script>
export default {
  props: {
    items: Array,
    size: {
      type: String,
      validator: (value) => ['', 'small', 'large'].includes(value)
    },
    spacing: {
      type: String,
      validator: (value) => ['', 'loose'].includes(value)
    },
    _editable: String
  }
}
</script>

<style lang="postcss" scoped>
.list {
  > :deep(.list-item) {
    @apply py-3 first:pt-0 last:pb-0 border-b last:border-b-0 border-line;
  }
}

/* Spacing */

.list.spacing-loose {
  > :deep(.list-item) {
    @apply py-6;
  }
}
</style>
