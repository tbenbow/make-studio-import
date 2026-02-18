<template>
  <div
    v-color="accentColor"
    class="icon-blob"
    :class="{ [`size-${size}`]: size }"
  >
    <div class="background">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 144 144"
        width="144"
        height="144"
      >
        <template v-if="circleStyle === 3">
          <path
            opacity="0.6"
            d="M143.137 97.0219C112.854 164.765 -8.49191 161.5 -2.80665 72.4679C-1.70996 -40.2104 179.529 -13.3516 143.137 97.0219Z"
            fill="currentColor"
          />
          <path
            d="M137.284 98.4265C122.788 121.848 96.9702 147.501 55.2085 143.605C34.2085 143.06 -8.47947 114.973 -1.16754 73.4802C2.69625 39.7294 37.3237 -2.68875 83.9049 0.133753C129.917 2.8492 161.653 58.0659 137.284 98.4265Z"
            fill="currentColor"
          />
        </template>
        <template v-else-if="circleStyle === 2">
          <path
            opacity="0.6"
            d="M143.976 94.9126C105.997 200.87 -67.3726 116.1 18.6699 21.4703C66.0576 -23.5048 170.683 2.74245 143.976 94.9126Z"
            fill="currentColor"
          />
          <path
            d="M139.139 96.8562C102.3 193.866 -52.3917 127.477 20.0847 21.3445C32.0359 -4.64595 83.417 -3.69912 110.403 7.28134C149.193 20.5764 145.097 62.9899 139.139 96.8562Z"
            fill="currentColor"
          />
        </template>
        <template v-else>
          <path
            opacity="0.6"
            d="M139.139 96.8562C102.3 193.866 -52.3917 127.477 20.0847 21.3445C32.0359 -4.64595 83.417 -3.69912 110.403 7.28134C149.193 20.5764 145.097 62.9899 139.139 96.8562Z"
            fill="currentColor"
          />
          <path
            d="M137.284 98.4265C122.788 121.848 96.9702 147.501 55.2085 143.605C34.2085 143.06 -8.47947 114.973 -1.16754 73.4802C2.69625 39.7294 37.3237 -2.68875 83.9049 0.133753C129.917 2.8492 161.653 58.0659 137.284 98.4265Z"
            fill="currentColor"
          />
        </template>
      </svg>
    </div>
    <font-awesome-icon v-if="icon" :icon="['fal', icon]" class="icon" />
  </div>
</template>

<script>
export default {
  props: {
    icon: String,
    accentColor: String,
    size: {
      type: String,
      // `xsmall` is deprecated
      validator: (value) =>
        ['', 'xsmall', 'small', 'default', 'large'].includes(value)
    },
    _editable: String
  },
  computed: {
    circleStyle() {
      const seed = useId() || 1
      const numCircleStyles = 3
      return (seed % numCircleStyles) + 1
    }
  }
}
</script>

<style lang="postcss" scoped>
.icon-blob {
  @apply relative max-w-full w-24 h-24 inline-flex items-center justify-center;

  .icon {
    @apply relative z-1 text-black text-2xl;
  }

  .background {
    @apply absolute inset-0 text-accent;

    svg {
      @apply max-h-full max-w-full overflow-visible;
    }
  }
}

/* Size */

.icon-blob.size {
  &-small,
  &-xsmall {
    @apply w-10 h-10;

    .icon {
      @apply text-base;
    }

    .background {
      path:first-child {
        @apply hidden;
      }
    }
  }

  &-large {
    @apply w-36 h-36;

    .icon {
      @apply text-4xl;
    }
  }
}
</style>
