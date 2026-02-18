<template>
  <div class="edge-side" :class="{ [`type-${type}`]: type }">
    <div v-if="type === 'treerings-side'" class="edge-wrap">
      <img src="@/assets/img/textures/treerings-side.png" loading="lazy" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    type: {
      type: String,
      validator: (value) => ['treerings-side'].includes(value)
    },
    _editable: String
  }
}
</script>

<style lang="postcss" scoped>
.edge-side {
  @apply absolute hidden sm:flex left-0 top-0 items-end bottom-0 w-full z-10  pointer-events-none;

  .edge-wrap {
    @apply relative h-full w-full;
  }
  svg {
    @apply h-2 w-full text-background;
  }

  img {
    @apply h-full w-full object-none object-left;
  }
}

/* Type */

.edge-side.type {
  &-treerings-side {
  }
}
</style>
