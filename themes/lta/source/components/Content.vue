<template>
  <div
    v-editable="$props"
    class="content"
    :class="{
      [`align-${align}`]: align,
      [`position-${position}`]: position,
      'sticky-sidebar': stickySidebar,
      'has-sidebar': hasSidebar
    }"
  >
    <RichText v-if="hasBody" class="body" :document="body" :loose="true">
      <slot />
    </RichText>
    <RichText
      v-if="hasSidebar"
      class="sidebar"
      :document="sidebar"
      size="small"
    >
      <slot name="sidebar" />
    </RichText>
  </div>
</template>

<script>
import { documentIsValid } from '@/components/RichText'

export default {
  props: {
    body: [Object, String],
    sidebar: [Object, String],
    align: {
      type: String,
      validator: (value) => ['', 'center', 'right'].includes(value)
    },
    position: {
      type: String,
      validator: (value) => ['', 'left', 'right'].includes(value)
    },
    stickySidebar: Boolean,
    _editable: String
  },
  computed: {
    hasBody() {
      return documentIsValid(this.body) || this.$slots.default
    },
    hasSidebar() {
      return documentIsValid(this.sidebar) || this.$slots.sidebar
    }
  }
}
</script>

<style lang="postcss" scoped>
.content {
  :deep( > .body) {
    @apply mx-auto max-w-cols-8;
  }
}

/* Align */

.content.align {
  &-center {
    @apply text-center;
  }

  &-right {
    @apply text-right;
  }
}

/* Position */

.content.position-left {
  :deep( > .body) {
    @apply ml-0;
  }
}

.content.position-right {
  :deep( > .body) {
    @apply mr-0;
  }
}

/* Has Sidebar */

.content.has-sidebar {
  @apply grid gap-12 grid-cols-1 lg:grid-cols-12;

  :deep( > .body) {
    @apply mx-0 lg:col-span-8 lg:col-start-1;
  }

  :deep( > .sidebar) {
    @apply lg:col-span-4 xl:pl-12;
  }

  &.position-right {
    :deep( > .body) {
      @apply order-2 lg:col-start-5;
    }
    :deep( > .sidebar) {
      @apply order-1 lg:col-start-1 xl:pl-0 xl:pr-12;
    }
  }

  /* Container-bleeding component */

  :deep(.banner),
  :deep(.callout) {
    @apply not-bleed-container;

    &-container {
      @apply px-12;
    }
  }

  :deep(.slider) {
    @apply lg:overflow-hidden;
  }
}

/* No Sidebar */

.content:not(.has-sidebar) {
  /* Container-bleeding component */

  :deep(.slider) {
    @apply lg:relative lg:w-max lg:left-1/2 lg:-translate-x-1/2;
  }
}

/* Sticky Sidebar */

.content.sticky-sidebar {
  :deep( > .sidebar) {
    @apply lg:sticky lg:top-12 lg:self-start;
  }
}
</style>
