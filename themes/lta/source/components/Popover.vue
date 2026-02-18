<template>
  <div class="popover">
    <div class="close" @click="$emit('close')">
      <font-awesome-icon :icon="['fal', 'xmark']" />
    </div>
    <slot />
  </div>
</template>

<script>
import { onClickOutside } from '@vueuse/core'

export default {
  props: {
    active: Boolean
  },
  watch: {
    active(newValue) {
      if (newValue === true) {
        this.stopOnClickOutside = onClickOutside(this.$el, (e) => {
          this.$emit('close')
        })
      } else if (this.stopOnClickOutside) {
        this.stopOnClickOutside()
      }
    }
  }
}
</script>

<style lang="postcss" scoped>
.popover {
  @apply absolute z-10 w-80 sm:w-96 px-6 py-4 text-sm bg-white border rounded-lg border-black-200 shadow-dark;
}

.close {
  @apply absolute top-0 right-0 flex items-center justify-center h-8 w-8 hover:text-accent cursor-pointer;
}
</style>
