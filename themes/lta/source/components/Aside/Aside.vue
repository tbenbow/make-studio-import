<template>
  <aside class="aside">
    <div class="main">
      <h5 v-if="title" class="title">{{ title }}</h5>
      <slot />
    </div>
    <slot name="items" />
  </aside>
</template>

<script>
export default {
  props: {
    title: String,
    _editable: String
  }
}
</script>

<style lang="postcss" scoped>
.aside {
  @apply overflow-hidden bg-stone rounded-lg;
}

.main {
  @apply relative px-8 pt-12 pb-6 bg-left-top bg-repeat-x;

  &:before {
    @apply absolute top-0 left-0 w-full h-6 content-[''];
    background-image: url('@/assets/img/textures/topography.png');
    background-size: 400%;
  }
}

.title {
  @apply mb-6 last:mb-0;
}

:deep(.aside-item) {
  .main {
    @apply px-8;
  }
}
</style>
