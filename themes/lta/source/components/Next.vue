<template>
  <div v-editable="$props" class="next">
    <header class="header">
      <img
        src="@/assets/img/next/keep-exploring.svg"
        alt="Keep Exploring"
        width="282"
        height="103"
        loading="lazy"
      />
    </header>
    <div class="next-container">
      <div v-if="links && links.length" class="items">
        <NextItem
          v-for="(item, index) in links"
          :key="index"
          v-bind="item"
          :small="small"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    links: {
      type: Array,
      default: () => []
    },
    _editable: String
  },
  computed: {
    small() {
      return this.links.length > 1
    }
  }
}
</script>

<style lang="postcss" scoped>
.next {
  @apply bleed-container relative pb-12 md:pb-24 text-center bg-top bg-no-repeat bg-cover;
  background-image: url('@/assets/img/next/starburst.png');

  &-container {
    @apply container;
  }
}

.header {
  img {
    @apply h-24 w-auto -ml-4 sm:h-auto sm:ml-0;
  }
}

.items {
  @apply flex flex-wrap gap-12 justify-center lg:flex-nowrap;

  @screen lg {
    :deep(.next-item) {
      flex-basis: theme('width.1/2');
    }
  }
}
</style>
