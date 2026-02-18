<template>
  <div class="refine-bar">
    <div class="main">
      <slot />
    </div>
    <aside v-if="$slots.aside" class="aside">
      <slot name="aside" />
    </aside>
  </div>
</template>

<style lang="postcss" scoped>
.refine-bar {
  @apply pt-4 border-t border-black-200 md:flex md:items-center md:gap-6;

  .main {
    @apply flex-1;
  }
}

.main,
.aside {
  @apply flex items-center gap-x-4 min-h-10;
}

.aside {
  @apply md:justify-end;
}
</style>
