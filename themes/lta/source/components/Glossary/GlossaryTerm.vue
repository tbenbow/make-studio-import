<template>
  <component
    :is="tag"
    v-editable="$props"
    class="glossary-term"
    tabindex="0"
    :class="{
      'is-toggled': isToggled
    }"
    @click="isToggled = !isToggled"
    @keyup.enter="isToggled = !isToggled"
  >
    <h6 class="title-text" aria-hidden="true">{{ term }}</h6>
    <RichText class="definition" :document="definition" size="small" />
    <font-awesome-icon
      class="icon-toggle"
      :icon="['fal', isToggled ? 'angle-down' : 'angle-right']"
    />
  </component>
</template>

<script>
export default {
  props: {
    tag: {
      type: String,
      default: 'div'
    },
    term: String,
    definition: [Object, String],
    icon: String,
    toggled: Boolean,
    _editable: String
  },
  data() {
    return {
      isToggled: false,
      hasToggle: true
    }
  },
  watch: {
    toggled: {
      immediate: true,
      handler(newVal) {
        this.isToggled = newVal
      }
    }
  }
}
</script>
<style lang="postcss" scoped>
.glossary-term {
  @apply border-t border-line transition-colors duration-200 ease-out py-6 inline-flex w-full;
  .title-text {
    @apply w-1/4 flex-none;
  }
  .definition {
    @apply line-clamp-1 max-h-[25px] pr-4 w-3/4;
  }
  .icon-toggle {
    @apply h-6 transition-transform duration-200 ease-out text-body;
  }

  &:hover {
    @apply cursor-pointer;
  }
}

/* Is Toggled */

.glossary-term.is-toggled {
  @apply border-t-blue;
  .title-text {
    @apply text-blue;
  }
  .definition {
    @apply line-clamp-none max-h-full;
  }
}
</style>
