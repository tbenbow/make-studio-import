<template>
  <LinkComponent
    class="button"
    :class="{
      [`size-${size}`]: size,
      [`variation-${variation}`]: variation,
      'icon-position-reverse': iconPositionReverse
    }"
    v-bind="$attrs"
    :link="link"
    :name="name"
    :open-in-new-window="openInNewWindow"
  >
    <template #default="{ displayName }">
      <font-awesome-icon
        v-if="iconOrFallback"
        class="icon"
        :icon="
          Array.isArray(iconOrFallback)
            ? iconOrFallback
            : ['fal', iconOrFallback]
        "
        v-bind="iconProps"
      />
      <span v-if="displayName || $slots.default" class="name">
        <slot v-bind="{ displayName }">
          {{ displayName }}
        </slot>
      </span>
    </template>
  </LinkComponent>
</template>

<script>
export default {
  props: {
    link: [Object, String],
    name: String,
    icon: [String, Array],
    iconProps: Object,
    size: {
      type: String,
      validator: (value) => ['small', 'large'].includes(value)
    },
    variation: {
      type: String,
      default: 'solid',
      validator: (value) =>
        ['solid', 'solid-transparent', 'outline', 'link'].includes(value)
    },
    iconPositionReverse: Boolean,
    openInNewWindow: Boolean,
    _editable: String
  },
  computed: {
    iconOrFallback() {
      return this.icon
        ? this.icon
        : this.variation === 'link' &&
          (this.icon === undefined || this.icon === '')
        ? 'chevron-right'
        : undefined
    }
  }
}
</script>

<style lang="postcss">
.button {
  @apply relative
    overflow-hidden
    inline-flex
    gap-4
    align-middle
    items-center
    justify-center
    min-h-10
    px-4
    py-2
    text-black
    rounded-sm
    cursor-pointer;

  &,
  &:before {
    @apply transition-colors duration-200;
  }

  &:before {
    @apply absolute inset-0;
    content: '';
  }

  .name {
    @apply relative top-px px-2 text-xs font-bold text-center uppercase tracking-wide;
  }

  .icon {
    @apply flex-shrink-0 relative text-lg;
    @apply transition-transform duration-200;
  }

  &:hover {
    .icon {
      @apply scale-110 last:first:transform-none;
    }
  }

  &:disabled {
    @apply cursor-not-allowed;

    .icon {
      @apply scale-100;
    }
  }
}

/* Size */

.button.size {
  &-small {
    @apply gap-3 min-h-8 px-3 py-1;

    .icon {
      @apply text-base;
    }

    .name {
      @apply text-2xs px-[0.375rem];
    }
  }

  &-large {
    @apply gap-5 min-h-12 px-5;

    .icon {
      @apply text-xl;
    }

    .name {
      @apply text-sm px-[0.625rem];
    }
  }
}

/* Variation */

.button.variation {
  &-solid {
    @apply bg-accent disabled:opacity-60 disabled:bg-black-600-solid disabled:text-white-700;

    &:hover:not(:disabled):before {
      @apply bg-white-200;
    }
  }

  &-solid-transparent {
    &:hover {
      @apply bg-accent disabled:bg-body-2;
    }
  }

  &-outline {
    @apply text-body border-2 border-accent;
    line-height: 20px;

    &:hover {
      @apply bg-accent;
    }
  }

  &-link {
    @apply overflow-visible gap-2 min-h-6 p-0 text-body rounded-none;

    .name {
      @apply order-1 p-0;
    }

    .icon {
      @apply order-2 text-accent;
    }

    &:hover {
      @apply text-accent;
    }

    &:disabled {
      @apply text-body-4;

      .icon {
        @apply text-body-4;
      }
    }

    &.size-small {
      @apply gap-[0.375rem];
    }

    &.size-large {
      @apply gap-[0.625rem];
    }
  }
}

/* Icon Position Reverse */

.button.icon-position-reverse {
  @apply flex-row-reverse;
}
</style>
