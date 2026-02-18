<template>
  <div class="pagination">
    <ButtonComponent
      class="first"
      icon="chevrons-left"
      title="First"
      tag="button"
      :disabled="isFirstPage"
      @click="$emit('update:currentPage', 1)"
    />
    <ButtonComponent
      class="previous"
      icon="chevron-left"
      title="Previous"
      tag="button"
      :disabled="isFirstPage"
      @click="$emit('update:currentPage', currentPage - 1)"
    />
    <span v-if="totalPages > 0" class="text">
      Page {{ currentPage }} of {{ totalPages }}
    </span>
    <ButtonComponent
      class="next"
      icon="chevron-right"
      title="Next"
      tag="button"
      :disabled="isLastPage"
      @click="$emit('update:currentPage', currentPage + 1)"
    />
    <ButtonComponent
      class="last"
      icon="chevrons-right"
      title="Last"
      tag="button"
      :disabled="isLastPage"
      @click="$emit('update:currentPage', totalPages)"
    />
  </div>
</template>

<script>
export default {
  props: {
    currentPage: Number,
    totalPages: Number
  },
  computed: {
    isFirstPage() {
      return this.currentPage <= 1
    },
    isLastPage() {
      return this.currentPage >= this.totalPages
    }
  }
}
</script>

<style lang="postcss" scoped>
.pagination {
  @apply flex items-center justify-center;
}

.text {
  @apply px-3;
}

.text {
  @apply text-xs font-bold uppercase tracking-wide;
}

:deep(.button) {
  @apply bg-transparent;

  &.variation-solid {
    @apply bg-transparent;

    .icon {
      @apply text-blue;
    }

    &:disabled {
      @apply bg-transparent;
    }
  }

  &:hover:not(:disabled) {
    @apply bg-black-100;
  }

  &:disabled {
    .icon {
      @apply text-black-200;
    }
  }
}
</style>
