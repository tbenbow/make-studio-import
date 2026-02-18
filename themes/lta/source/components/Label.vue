<template>
  <div
    v-color="accentColor"
    class="label"
    :class="{ 'invert-text-color': invertTextColor }"
  >
    <span :class="textColor"
      ><slot>{{ name }}</slot></span
    >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      viewBox="0 0 145 24"
      preserveAspectRatio="none"
    >
      <path
        d="M141.17 19.4325C135.5 23.9673 119.888 23.593 89.9934 23.7807C57.6341 23.9839 12.6676 24.5587 4.80116 22.334C-1.60038 20.5236 -1.60039 6.2696 4.80117 3.81395C17.1069 -0.906523 109.115 -0.635282 136.902 1.35903C147.236 2.10074 146.534 15.1418 141.17 19.4325Z"
        fill="currentColor"
      />
    </svg>
  </div>
</template>

<script>
export default {
  props: {
    name: String,
    accentColor: String,
    textColor: String
  },
  data() {
    return {
      invertTextColor: false
    }
  },
  mounted() {
    /**
     * Automatically invert text color for specific accent colors
     *
     * The accent color isn't always directly set using this component's prop,
     * so we get the computed value of the accent color. If it matches one of
     * the specified accent colors, invert the color.
     */
    const computedAccentColor = this.getComputedAccentColor()
    const accentColorsToInvertTextColorFor = [
      this.$theme.colors.green.DEFAULT,
      this.$theme.colors.orange.DEFAULT
    ]
    this.invertTextColor =
      accentColorsToInvertTextColorFor.includes(computedAccentColor)
  },
  methods: {
    getComputedAccentColor() {
      const style = getComputedStyle(this.$el)
      return style.getPropertyValue('--color-accent').trim()
    }
  }
}
</script>

<style lang="postcss" scoped>
.label {
  @apply relative inline-flex items-center align-top px-3 -mx-2 min-h-6 text-black text-sm font-semibold tracking-wide uppercase;

  span {
    @apply relative py-1 sm:py-0 top-px z-[1];
  }

  svg {
    @apply absolute inset-0 min-h-6 h-full text-accent;
  }
}

/* Invert Text Color */

.label.invert-text-color {
  @apply text-white;
}
</style>
