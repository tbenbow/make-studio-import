<template>
  <div class="refine-menu">
    <div class="main">
      <slot />
    </div>
    <footer class="footer">
      <aside class="footer-aside">
        <slot name="footer" />
      </aside>
      <ButtonComponent
        name="close"
        size="small"
        @click.prevent="$emit('close')"
      />
    </footer>
  </div>
</template>

<style lang="postcss" scoped>
.refine-menu {
  @apply bg-white max-w-full border border-black-200 rounded;
}

.main {
  @apply p-6;

  :deep(> .ais-ToggleRefinement) {
    @apply mb-6 last:mb-0;
  }
}

.footer {
  @apply flex items-center px-6 py-3 border-t border-black-100;

  &-aside {
    @apply flex-1;
  }

  :deep(.button) {
    @apply mt-0;
  }
}
</style>
