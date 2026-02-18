<template>
  <span class="pill">
    <slot />
  </span>
</template>

<style lang="postcss">
.pill {
  @apply px-[0.375rem] pt-px text-black-600 text-2xs uppercase tracking-wide bg-black-100 rounded-full;
}
</style>
