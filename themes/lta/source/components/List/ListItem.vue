<template>
  <li
    v-editable="$props"
    class="list-item"
    :class="{
      [`size-${size}`]: size,
      'has-aside': hasAside,
      'has-aside-icon-only': icon && !label
    }"
  >
    <aside v-if="hasAside" class="aside">
      <div class="label">
        <font-awesome-icon
          v-if="icon"
          class="icon"
          :icon="['fal', icon]"
          :fixed-width="true"
        />
        <span v-if="label">{{ label }}</span>
      </div>
    </aside>
    <RichText v-if="hasBody" class="body" :document="body" :size="size">
      <slot />
    </RichText>
  </li>
</template>

<script>
import { documentIsValid } from '@/components/RichText.vue'

export default {
  props: {
    icon: String,
    label: String,
    body: [Object, String],
    size: {
      type: String,
      validator: (value) => ['', 'small', 'large'].includes(value)
    },
    _editable: String
  },
  computed: {
    hasAside() {
      return this.icon || this.label
    },
    hasBody() {
      return documentIsValid(this.body) || this.$slots.default
    }
  }
}
</script>

<style lang="postcss" scoped>
.list-item {
  @apply grid gap-6 grid-flow-col auto-cols-fr;
}

.label {
  @apply flex items-center text-body-3 break-words;

  .icon {
    @apply self-start flex-shrink-0 mt-[2px] mr-2 last:mr-0 text-accent text-lg;
  }
}

/* Size */

.list-item.size {
  &-small {
    .label {
      .icon {
        @apply text-base;
      }

      span {
        @apply text-sm;
      }
    }
  }

  &-large {
    .label {
      .icon {
        @apply text-xl;
      }

      span {
        @apply text-lg;
      }
    }
  }
}

/* Has Aside Icon Only */

.list-item.has-aside-icon-only {
  grid-template-columns: minmax(theme('width.12'), max-content);
}
</style>
