<template>
  <div class="refine" :class="{ panel, 'is-active': isActive, 'is-on': isOn }">
    <RefineButton
      :name="name"
      :icon="icon"
      :icon-fixed-width="panel ? true : false"
      v-model:is-active="isActive"
      :is-on="isOn"
    >
      <slot name="button-name">
        <template v-if="isOn && nameOn">
          {{ nameOn }}
        </template>
      </slot>
    </RefineButton>
    <transition
      :name="panel ? 'none' : 'appear-down'"
      :leave-active-class="panel ? 'none' : 'fade-leave-active'"
      :leave-to-class="panel ? 'none' : 'fade-leave-to'"
    >
      <RefineMenu v-show="isActive" ref="menu" @close="isActive = false">
        <slot v-bind="{ isOn }" />
        <template #footer>
          <slot name="footer" v-bind="{ isOn }" />
        </template>
      </RefineMenu>
    </transition>
  </div>
</template>

<script>
import { onClickOutside } from '@vueuse/core'

export default {
  props: {
    name: String,
    nameOn: String,
    icon: String,
    panel: Boolean,
    isOn: Boolean,
    initialIsActive: Boolean,
    allowClickOutsideFor: String
  },
  data() {
    return {
      isActive: this.initialIsActive || false
    }
  },
  watch: {
    isActive(newValue) {
      if (this.panel) {
        return
      }

      if (newValue === true) {
        this.stopOnClickOutside = onClickOutside(this.$el, (e) => {
          // If a query string is provided for `allowClickOutsideFor`, see if
          // the clicked element is a child of the allowed element(s) before
          // closing. This is to allow clicking an element that may not live
          // inside this Refine component (ex. autocomplete results).
          this.isActive = this.allowClickOutsideFor
            ? this.isChildOfAllowedElement(e.target)
            : false
        })

        this.$nextTick(this.focusOnFirstInputInMenu)
      } else if (this.stopOnClickOutside) {
        this.stopOnClickOutside()
      }
    }
  },
  methods: {
    focusOnFirstInputInMenu() {
      const input = this.$refs.menu.$el.querySelector('input')

      if (input) {
        input.focus()
      }
    },
    /**
     * Check if element is a child of an allowed element.
     * @param {Element} el The element to test for
     * @return {boolean} True if the element is a child of an allowed element
     */
    isChildOfAllowedElement(el) {
      const allowedEls = document.querySelectorAll(this.allowClickOutsideFor)

      return Array.from(allowedEls).reduce(
        (_prevEl, currentEl) => currentEl.contains(el),
        false
      )
    }
  }
}
</script>

<style lang="postcss" scoped>
.refine {
  @apply relative;

  :deep(.refine-button) {
    @apply w-full;
  }

  :deep(.refine-menu) {
    @apply absolute left-0 z-10 min-w-full sm:min-w-96 mt-3 shadow-dark;
  }
}

/* Panel */

.refine.panel {
  @apply overflow-hidden border border-black-200 rounded;
  @apply transition-colors ease-in-out duration-200;

  :deep(.refine-button),
  :deep(.refine-menu) {
    @apply border-0;
  }

  :deep(.refine-button) {
    @apply hover:bg-line rounded-none;
  }

  :deep(.refine-menu) {
    @apply static min-w-0 mt-0 shadow-none;
  }

  &.is-active {
    @apply border-black;
  }

  &.is-on {
    @apply border-blue;

    :deep(.refine-button) {
      @apply hover:bg-blue;
    }
  }
}
</style>
