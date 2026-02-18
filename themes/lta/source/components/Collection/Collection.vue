<template>
  <div v-editable="$props" class="collection">
    <header class="header">
      <div class="label">{{ label || 'Collection' }}</div>
      <h6 class="name">{{ name }}</h6>
    </header>
    <div class="main">
      <CollectionLinks :links="links" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    label: String,
    name: String,
    links: Array,
    _editable: String
  }
}
</script>

<style lang="postcss" scoped>
.collection {
  @apply flex flex-col bg-black-100-solid;
}

.header {
  @apply px-6 py-4 bg-accent;

  .label {
    @apply mb-1 text-white text-xs font-bold uppercase tracking-wide;
  }

  .name {
    @apply text-white;
  }
}

.main {
  @apply flex-1 overflow-scroll;
}

:deep(.collection-links) {
  @apply py-3;
}
</style>
