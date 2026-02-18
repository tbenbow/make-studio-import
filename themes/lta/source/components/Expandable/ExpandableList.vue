<template>
  <ul class="expandable-list">
    <slot />
    <template v-if="expandables && expandables.length">
      <Expandable
        v-for="(expandable, index) in expandables"
        :key="index"
        tag="li"
        v-bind="expandable"
      />
    </template>
  </ul>
</template>

<script>
export default {
  props: {
    expandables: Array,
    _editable: String
  }
}
</script>

<style lang="postcss" scoped>
.expandable-list {
  :deep(.expandable) {
    &:not(:last-child) {
      @apply border-b-0;
    }
  }
}
</style>
