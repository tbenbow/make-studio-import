<template>
  <div
    class="notice"
    :class="{
      panel: panel,
      [`size-${size}`]: size,
      [`align-${align}`]: align,
      'display-inline': displayInline
    }"
  >
    <div class="notice-main">
      <header class="notice-header">
        <font-awesome-icon
          class="icon"
          :icon="['fal', icon || 'circle-info']"
          :spin="iconSpin"
        />
        <h6 v-if="title || $slots.default" class="title">
          <slot>{{ title }}</slot>
        </h6>
      </header>
      <p v-if="description || $slots.description" class="description">
        <slot name="description">{{ description }}</slot>
      </p>
      <footer v-if="$slots.footer" class="footer">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    icon: String,
    iconSpin: Boolean,
    title: String,
    description: String,
    panel: Boolean,
    size: {
      type: String,
      validator: (value) => ['small', 'large'].includes(value)
    },
    align: {
      type: String,
      validator: (value) =>
        !value || ['left', 'center', 'right'].includes(value)
    },
    displayInline: Boolean
  }
}
</script>

<style lang="postcss" scoped>
.notice {
  @apply text-center leading-none;

  &-main {
    @apply max-w-cols-7 mx-auto;
  }
}

.icon {
  @apply inline-block text-accent text-3xl;
}

.title {
  @apply mt-3 font-sans text-accent;
}

.description {
  @apply mt-2 text-sm text-body-3;
}

.footer {
  @apply mt-4;
}

/* Panel */

.notice.panel {
  @apply px-8 py-12 bg-line rounded-lg;
}

/* Size */

.notice.size {
  &-small {
    .icon {
      @apply text-lg;
    }

    .title {
      @apply mt-2 text-sm;
    }

    .description {
      @apply mt-1 text-xs;
    }

    .footer {
      @apply mt-3;
    }
  }

  &-large {
    .icon {
      @apply text-4xl;
    }

    .title {
      @apply mt-4 text-lg;
    }

    .description {
      @apply mt-3 text-base;
    }

    .footer {
      @apply mt-6;
    }
  }
}

/* Align */

.notice.align {
  &-left {
    @apply text-left;

    .notice-main {
      @apply ml-0;
    }
  }

  &-center {
    @apply text-center;

    .notice-main {
      @apply mx-auto;
    }
  }

  &-right {
    @apply text-right;

    .notice-main {
      @apply mr-0;
    }
  }
}

/* Display Inline */

.notice.display-inline {
  .notice-header {
    @apply inline-flex items-center gap-x-3 align-top;

    .title {
      @apply mt-0 text-left;
    }
  }
}
</style>
