<template>
  <div class="overlay" :class="{ active: active }">
    <div ref="container" class="overlay-container">
      <transition name="appear-up" leave-to-class="appear-down-leave-to">
        <div v-show="showContent" ref="content" class="overlay-content">
          <slot />
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { onClickOutside } from '@vueuse/core'

export default {
  props: {
    active: Boolean
  },
  data() {
    return {
      showContent: false,
      stopOnClickOutside: undefined
    }
  },
  watch: {
    $route() {
      if (this.active) {
        this.onInactive()
      }
    },
    active(active) {
      if (active === true) {
        this.onActive()
      } else {
        this.onInactive()
      }
    }
  },
  mounted() {
    if (this.active) {
      this.onActive()
    }
  },
  beforeDestroy() {
    this.onInactive()
  },
  methods: {
    close() {
      this.$emit('close')
    },
    pressEscapeKey(event) {
      if (event.key === 'Escape') {
        this.onInactive()
      }
    },
    onActive() {
      this.$bodyScroll.lock(this.$refs.container)
      document.addEventListener('keyup', this.pressEscapeKey)

      this.stopOnClickOutside = onClickOutside(this.$refs.content, () => {
        this.onInactive()
      })

      this.showContent = true
    },
    onInactive() {
      this.$bodyScroll.unlock(this.$refs.container)
      document.removeEventListener('keyup', this.pressEscapeKey)

      if (typeof this.stopOnClickOutside === 'function') {
        this.stopOnClickOutside()
      }

      this.showContent = false

      this.close()
    }
  }
}
</script>

<style lang="postcss" scoped>
.overlay {
  @apply hidden fixed left-0 top-0 z-60 w-full h-screen m-0 p-0 bg-black-200 backdrop-filter backdrop-blur-sm;

  &-container {
    @apply overflow-auto flex h-full p-4 sm:p-12;
  }

  &-content {
    @apply flex max-w-full m-auto;
  }
}

/* Active */

.overlay.active {
  @apply block;
}
</style>
