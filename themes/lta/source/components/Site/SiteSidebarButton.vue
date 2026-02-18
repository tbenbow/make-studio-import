<template>
  <button
    class="site-sidebar-button"
    :class="{ 'is-active': active }"
    @click="$emit('update:active', !active)"
  >
    <span class="icon-container">
      <font-awesome-icon
        class="icon"
        :icon="['fal', active ? 'arrow-left-from-line' : 'bars-staggered']"
        :fixed-width="true"
      />
    </span>
    <span v-if="label" class="label">
      <template v-if="active">Close</template>
      {{ label }}
    </span>
  </button>
</template>

<script>
export default {
  props: {
    active: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: 'Collection Menu'
    }
  }
}
</script>

<style lang="postcss" scoped>
.site-sidebar-button {
  @apply flex items-center h-10 text-black-600 hover:text-accent bg-white-700 hover:bg-white rounded-br-sm filter backdrop-blur-sm;
}

.icon-container {
  @apply flex items-center justify-center px-3;
}

.icon {
  @apply md:text-lg;
}

.label {
  @apply pr-4 text-2xs font-bold uppercase tracking-wide whitespace-nowrap;
}
</style>
