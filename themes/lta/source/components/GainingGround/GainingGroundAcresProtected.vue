<template>
  <div class="acres-protected">
    <State v-if="state" :code="state" />
    <IconBlob icon="shield-plus" accent-color="blue" size="large" />
    <h4 class="number">{{ $filters.number(acres, '0,0') }}</h4>
    <h3 class="number-label">Acres Protected</h3>
    <div class="fact">
      <font-awesome-icon class="fact-icon" :icon="['fal', facts[0].icon]" />
      <p class="fact-text">
        That’s about {{ $filters.number(acres * facts[0].multiplier, '0,0') }}
        {{ facts[0].label }}!
      </p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    acres: {
      type: [Number, String],
      required: true
    },
    state: String
  },
  data() {
    return {
      facts: [
        {
          icon: 'football',
          label: 'football fields',
          multiplier: 1 / 1.32
        }
      ]
    }
  }
}
</script>

<style lang="postcss" scoped>
.acres-protected {
  @apply relative overflow-hidden bleed-container px-container-padding xl:min-h-[836px] pt-24 pb-36 text-center;

  :deep(.state) {
    @apply absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-1 mt-8 text-black-100 text-[480px] sm:text-[600px] md:text-[720px] lg:text-[840px] xl:text-[960px];
  }

  :deep(.icon-blob) {
    @apply mb-3 lg:mb-0;
  }
}

.number {
  @apply text-body leading-[1.15] text-4xl sm:text-[93.63px] md:text-[118.50px] lg:text-[149.97px] xl:text-[189.81px];

  &-label {
    @apply text-black font-bold;
  }
}

.fact {
  @apply mt-12;

  &-icon {
    @apply mb-4 text-3xl text-accent;
  }

  &-text {
    @apply text-lg text-accent font-bold;
  }
}
</style>
