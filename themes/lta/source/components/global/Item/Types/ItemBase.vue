<template>
  <div
    v-editable="$props"
    v-color="accentColor"
    class="item"
    :class="{
      'has-icon': hasIcon,
      'has-image': hasImage,
      'has-link': hasLink,
      'is-disabled': disabled,
      [`type-${type}`]: type,
      [`orientation-${orientation}`]: orientation,
      [`align-${align}`]: align,
      [`icon-style-${iconStyle}`]: iconStyle,
      [`size-${size}`]: size,
      [`icon-size-${iconSize || defaultIconSize}`]: iconSize || defaultIconSize,
      [`title-size-${titleSize}`]: titleSize,
      [`body-size-${bodySize || defaultBodySize}`]: bodySize || defaultBodySize
    }"
  >
    <ItemLoader v-if="showLoader" :type="type" />
    <Notice
      v-else-if="showLoaderError"
      icon="circle-exclamation"
      title="Error loading source content"
      size="small"
      :panel="true"
    />
    <ItemLoader v-else-if="showPlaceholder" :type="type" :animate="false" />
    <template v-else>
      <component
        :is="hasLink ? 'LinkComponent' : 'figure'"
        v-if="hasIcon || hasImage"
        class="figure"
        :link="hasLink && link"
        :disabled="disabled"
        :aria-label="hasLink ? title : false"
        @click="hasLink && $emit('click:figure')"
      >
        <template v-if="hasIcon">
          <IconBlob
            v-if="iconStyle === 'circle'"
            :icon="icon"
            :size="iconSize || defaultIconSize"
          />
          <IconUnderline
            v-else-if="iconStyle === 'underline'"
            :icon="icon"
            :label="label"
          />
          <font-awesome-icon
            v-else
            class="icon"
            :icon="['fal', icon]"
            :fixed-width="orientation === 'horizontal' ? true : false"
          />
        </template>
        <slot name="before-image" />
        <slot name="image">
          <nuxt-img
            v-if="hasImage"
            class="image"
            :src="image.filename"
            :alt="image.alt"
            loading="lazy"
            v-bind="computedImageOptions"
          />
        </slot>
        <slot name="after-image" />
      </component>
      <div class="main">
        <slot name="before-main" />
        <header
          v-if="label || $slots.label || title || subtitle || $slots.subtitle"
          class="header"
        >
          <slot name="before-header" />
          <div
            v-if="(label || $slots.label) && iconStyle !== 'underline'"
            class="label"
          >
            <slot name="label">{{ label }}</slot>
          </div>
          <component :is="titleTag" v-if="title" class="title">
            <LinkComponent
              v-if="hasLink"
              :link="link"
              :disabled="disabled"
              @click="$emit('click:title')"
              >{{ title }}</LinkComponent
            >
            <template v-else>{{ title }}</template>
          </component>
          <div v-if="subtitle || $slots.subtitle" class="subtitle">
            <slot name="subtitle">{{ subtitle }}</slot>
          </div>
          <slot name="after-header" />
        </header>
        <RichText
          v-if="hasBody"
          class="body"
          :document="body"
          :size="bodySize || defaultBodySize"
        >
          <template #before>
            <slot name="before-body" />
          </template>
          <slot />
          <template #after>
            <slot name="after-body" />
          </template>
        </RichText>
        <footer v-if="$slots.footer" class="footer">
          <slot name="footer" />
        </footer>
        <slot name="after-main" />
      </div>
    </template>
  </div>
</template>

<script>
import ItemMixin from '@/mixins/Item.mixin'

export default {
  mixins: [ItemMixin],
  computed: {
    defaultImageOptions() {
      const options = {
        format: 'webp',
        // quality: 60,
        fit: 'cover',
        modifiers: { gravity: 'subject' }
      }

      switch (this.orientation) {
        case 'horizontal':
          if (this.size === 'small') {
            options.width = 108
            options.height = 108
          } else if (this.size === 'large') {
            options.width = 324
            options.height = 324
          } else {
            options.width = 216
            options.height = 216
          }
          options.sizes = `xs:100vw 2xl:${options.width}px max:${
            options.width * 2
          }px`
          break

        default:
          if (this.size === 'small') {
            options.width = 600
          } else if (this.size === 'large') {
            options.width = 1032
          } else {
            options.width = 816
          }
          options.height = Math.round((9 / 16) * options.width)
          options.sizes = `xs:100vw max:${options.width}px 2x:${
            options.width * 2
          }px`
      }

      return options
    }
  }
}
</script>

<style lang="postcss" scoped>
.item {
  @apply max-w-cols-8;
}

:deep(.item-loader) {
  @apply w-full h-auto;
}

:deep(.figure) {
  @apply relative block max-w-full mb-4;

  > .icon {
    @apply text-accent text-3xl;
  }

  .image {
    @apply w-full rounded-lg;
  }

  &:after {
    @apply invisible absolute inset-0 content-[''];
  }
}

.main {
  > .body,
  > .footer {
    @apply mt-4 first:mt-0;
  }
}

.label {
  @apply mb-2 text-accent text-xs font-bold uppercase tracking-wide;
}

.title {
  @apply text-body;

  :deep(a) {
    @apply text-body hover:text-accent;
    @apply transition-colors duration-200;
  }
}

.subtitle {
  @apply text-body-3 text-xs uppercase tracking-wide;

  .title + & {
    @apply mt-2;
  }
}

/* Has Icon & Image */

.item.has-icon.has-image {
  :deep(.figure) {
    .icon-blob,
    > .icon {
      @apply absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2;
    }

    .icon-underline + .image {
      @apply rounded-t-none;
    }

    > .icon {
      @apply text-white;
    }
  }
}

/* Size */

.item.size {
  &-small {
    @apply max-w-cols-6;

    :deep(.figure) {
      @apply mb-3;
    }
  }

  &-large {
    @apply max-w-cols-10;

    :deep(.figure) {
      @apply mb-6;
    }
  }
}

.item.size,
.item.title-size {
  &-small {
    .label {
      @apply text-2xs;
    }

    .subtitle {
      @apply text-2xs;
    }
  }

  &-large {
    .label {
      @apply text-sm;
    }

    .subtitle {
      @apply text-sm;
    }
  }
}

/* Icon Size */

.item.icon-size {
  &-small {
    :deep(.figure) {
      > .icon {
        @apply text-2xl;
      }
    }
  }

  &-large {
    :deep(.figure) {
      > .icon {
        @apply text-4xl;
      }
    }
  }
}

/* Orientation */

.item.orientation-horizontal {
  @apply max-w-cols-10 sm:flex sm:items-center;

  :deep(.figure) {
    @apply w-[216px] sm:flex-shrink-0 sm:self-start sm:mb-0 sm:mr-6;
  }

  .main {
    @apply flex-1;
  }

  &.size-small {
    @apply max-w-cols-8;

    :deep(.figure) {
      @apply w-[108px] sm:mr-4;
    }
  }

  &.size-large {
    @apply max-w-cols-12;

    :deep(.figure) {
      @apply w-[324px] sm:mr-8;
    }
  }

  &.has-icon:not(.has-image) {
    :deep(.figure) {
      @apply w-auto;
    }
  }

  .layout-grid > .columns > & {
    @apply items-start;
  }
}

/* Align */

.item.align {
  &-left {
    @apply text-left;
  }

  &-center {
    @apply text-center;
  }

  &-right {
    @apply text-right;
  }
}
</style>
