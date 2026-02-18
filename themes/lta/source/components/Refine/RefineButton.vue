<template>
  <button
    class="refine-button"
    :class="{ 'is-active': isActive, 'is-on': isOn }"
    @click="$emit('update:isActive', !isActive)"
  >
    <font-awesome-icon
      v-if="icon"
      class="icon"
      :icon="['fal', icon]"
      :fixed-width="iconFixedWidth"
    />
    <span v-if="$slots.default || name" class="name">
      <slot>
        {{ name }}
      </slot>
    </span>
  </button>
</template>

<script>
export default {
  props: {
    name: String,
    icon: String,
    iconFixedWidth: Boolean,
    isActive: Boolean,
    isOn: [Boolean, Number]
  }
}
</script>

<style lang="postcss" scoped>
.refine-button {
  @apply inline-flex items-center min-h-10 px-4 text-sm border border-black-200 rounded-full hover:border-black;
  @apply transition-colors ease-in-out duration-200;
}

.icon {
  @apply text-base;
}

.name {
  @apply ml-3 empty:ml-0 pt-[5px] pb-1;
}

.refine-button.is-active {
  @apply border-black;
}

.refine-button.is-on {
  @apply text-white bg-blue border-blue;
}
</style>
