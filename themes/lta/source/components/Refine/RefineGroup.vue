<template>
  <div class="refine-group" :class="{ column }">
    <div class="items">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    column: Boolean
  }
}
</script>
>

<style lang="postcss" scoped>
.refine-group {
  @apply relative;

  :deep(.refine) {
    @apply static md:relative;
  }
}

.items {
  @apply flex flex-wrap gap-x-3 gap-y-2;
}

/* Column */

.refine-group.column {
  .items {
    @apply flex-col;

    :deep(.refine-button) {
      @apply text-left;
    }
  }
}
</style>
