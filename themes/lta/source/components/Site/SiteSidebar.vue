<template>
  <div class="site-sidebar">
    <Collection v-if="collection" v-bind="collection" />
  </div>
</template>

<script>
export default {
  props: {
    collection: Object
  }
}
</script>

<style lang="postcss" scoped>
.site-sidebar {
  @apply flex flex-col;
}

:deep(.collection) {
  @apply flex-1 h-full;
}
</style>
