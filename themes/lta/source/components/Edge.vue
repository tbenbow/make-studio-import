<template>
  <div class="edge" :class="{ [`type-${type}`]: type }" aria-hidden="true">
    <svg
      v-if="type === 'wavy-top' || type === 'wavy-bottom-inset'"
      width="1440"
      height="8"
      viewBox="0 0 1440 8"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M1440 8H-0.000488281V0C-0.000488281 0 145.5 7 250 7C290.373 7 345.374 5.95516 409.841 4.73048C512.238 2.78527 638.518 0.386346 768 1C884.875 1.55391 969.727 2.97936 1054.32 4.40048C1161.66 6.20372 1268.59 8 1440 8Z"
        fill="currentColor"
      />
    </svg>
    <svg
      v-else-if="type === 'wavy-bottom' || type === 'wavy-top-inset'"
      width="1440"
      height="8"
      viewBox="0 0 1440 8"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M1440 8V0H-0.000488281V2.26467e-06C0.0950328 0.00459724 145.534 7 249.999 7C290.373 7 345.373 5.95516 409.841 4.73048C512.238 2.78527 638.518 0.386346 767.999 1C884.875 1.55391 969.727 2.97936 1054.32 4.40048C1161.66 6.20372 1268.59 8 1440 8Z"
        fill="currentColor"
      />
    </svg>
    <div v-else-if="type === 'shadow-top'" class="edge-wrap">
      <div class="gradient"></div>
    </div>
    <div v-else-if="type === 'treerings-top'" class="edge-wrap">
      <img src="@/assets/img/textures/treerings.png" loading="lazy" />
      <div class="gradient"></div>
    </div>
    <div v-else-if="type === 'topography-top'" class="edge-wrap">
      <img src="@/assets/img/textures/topography.png" loading="lazy" />
      <div class="gradient"></div>
    </div>
    <div v-else-if="type === 'trees-top'" class="edge-wrap">
      <img src="@/assets/img/textures/trees.png" loading="lazy" />
      <div class="gradient"></div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    type: {
      type: String,
      validator: (value) =>
        [
          'wavy-top',
          'wavy-bottom',
          'wavy-top-inset',
          'wavy-bottom-inset',
          'shadow-top',
          'topography-top',
          'treerings-top',
          'trees-top'
        ].includes(value)
    },
    _editable: String
  }
}
</script>

<style lang="postcss" scoped>
.edge {
  @apply absolute left-0 w-full;

  svg {
    @apply h-2 w-full text-background;
  }

  img {
    @apply h-full w-full object-cover;
  }

  .edge-wrap {
    @apply relative h-full;

    .gradient {
      @apply absolute inset-0 bg-gradient-to-b from-transparent to-background;
    }
  }
}

/* Type */

.edge.type {
  &-wavy-top {
    @apply -top-2 h-2 z-10;
  }

  &-wavy-top-inset {
    @apply top-0 h-2;
  }

  &-wavy-bottom {
    @apply -bottom-2 h-2;
  }

  &-wavy-bottom-inset {
    @apply bottom-0 h-2;
  }

  &-shadow-top,
  &-topography-top,
  &-treerings-top {
    @apply top-0 h-40;
  }

  &-trees-top {
    @apply top-0 h-80;
    img {
      @apply object-top;
    }
  }

  &-shadow-top {
    .edge-wrap {
      .gradient {
        @apply from-black-100;
      }
    }
  }
}
</style>
