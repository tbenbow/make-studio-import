<template>
  <div class="user-actions">
    <slot />
  </div>
</template>

<style lang="postcss" scoped>
.user-actions {
  @apply flex flex-wrap gap-y-1;

  :deep(.button) {
    @apply border border-transparent;

    &:not(:disabled) {
      @apply hover:border-accent;
    }

    &.variation-link {
      @apply px-3 py-1 rounded-full;
    }

    .name {
      @apply font-normal tracking-normal normal-case;
    }

    &.is-bookmarked,
    &.is-liked {
      .name {
        @apply text-accent font-bold;
      }
    }
  }
}
</style>
