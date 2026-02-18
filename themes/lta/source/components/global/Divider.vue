<template>
  <div class="divider">
    <hr />
    <span v-if="label" class="label">{{ label }}</span>
  </div>
</template>

<script>
export default {
  props: {
    label: String
  }
}
</script>

<style lang="postcss" scoped>
.divider {
  @apply relative;

  hr {
    @apply border-line;
  }
}

.label {
  @apply absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 text-body text-2xs font-bold uppercase tracking-wide border border-black-200-solid bg-white text-center rounded-full shadow-sm;
}
</style>
