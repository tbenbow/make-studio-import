<template>
  <div class="icon-underline">
    <font-awesome-icon
      v-if="$props.icon"
      class="icon"
      :icon="['fal', $props.icon]"
    />
    <span v-if="$props.label" class="label">{{ $props.label }}</span>
  </div>
</template>

<script>
export default {
  props: ['icon', 'label']
}
</script>

<style lang="postcss" scoped>
.icon-underline {
  @apply flex items-end pb-4 text-accent text-left border-b-2 border-accent;
}

.icon {
  @apply mr-4 text-3xl;
}

.label {
  @apply text-xs font-bold uppercase tracking-wide;
}
</style>
