<template>
  <component
    :is="tag"
    v-auto-animate
    v-editable="$props"
    class="expandable"
    :class="{ 'is-toggled': isToggled }"
  >
    <header class="header" @click="isToggled = !isToggled">
      <font-awesome-icon v-if="icon" class="icon" :icon="['fal', icon]" />
      <div class="title">
        <h6 class="title-text">{{ title }}</h6>
        <slot name="after-title" />
      </div>
      <font-awesome-icon
        class="icon-toggle"
        :icon="['fal', isToggled ? 'minus' : 'plus']"
      />
    </header>
    <div
      v-if="isToggled"
      :id="lodash.uniqueId('ExpandableContent_')"
      class="content"
    >
      <slot v-bind="{ content }">
        <RichText :document="content" size="small" />
      </slot>
    </div>
  </component>
</template>

<script>
export default {
  props: {
    tag: {
      type: String,
      default: 'div'
    },
    title: String,
    content: [Object, String],
    icon: String,
    toggled: Boolean,
    _editable: String
  },
  data() {
    return {
      isToggled: false
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
.expandable {
  @apply border-t border-b border-line;
  @apply transition-colors duration-200 ease-out;

  .header {
    @apply relative flex items-center gap-3 p-4;

    .icon {
      @apply text-orange text-lg;
    }

    .title {
      @apply flex-1 py-px;

      &-text {
        @apply transition-colors duration-200 ease-out;
      }
    }

    .icon-toggle {
      @apply transition-transform duration-200 ease-out text-body;
    }

    &:hover {
      @apply cursor-pointer;

      .title-text {
        @apply text-body;
      }
    }
  }

  .content {
    @apply px-4 pb-6;
  }
}

/* Is Toggled */

.expandable.is-toggled {
  @apply border-orange;

  .header {
    @apply bg-gradient-to-b from-black-100;

    .title-text {
      @apply text-orange;
    }
  }
}
</style>
