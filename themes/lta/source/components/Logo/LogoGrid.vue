<template>
  <div
    class="logo-grid"
    :class="{
      [`size-${size}`]: size,
      'display-inline': displayInline
    }"
  >
    <Heading
      v-if="title || hasDescription"
      :title="title"
      title-tag="h6"
      :description="description"
      align="center"
    />
    <ul v-if="logos && logos.length" class="logos">
      <li v-for="(logo, index) in logos" :key="index">
        <Logo v-bind="logo" />
      </li>
    </ul>
  </div>
</template>

<script>
import { documentIsValid } from '@/components/RichText.vue'

export default {
  props: {
    title: String,
    description: [Object, String],
    logos: Array,
    size: {
      type: String,
      validator: (value) =>
        ['', 'xsmall', 'small', 'medium', 'large'].includes(value)
    },
    displayInline: Boolean
  },
  computed: {
    hasDescription() {
      return documentIsValid(this.description)
    }
  }
}
</script>

<style lang="postcss" scoped>
.logo-grid {
}

:deep(.heading) {
  @apply mb-12;

  .title {
    @apply font-sans font-bold text-body uppercase tracking-wide;
  }
}

.logos {
  @apply flex flex-wrap  items-center justify-center;

  > * {
    @apply w-full text-center;
  }
}

/* Size */

.logo-grid.size-xsmall {
  .logos {
    @apply gap-y-10;

    > * {
      @apply w-1/3 md:w-1/4 lg:w-1/5 px-[4%] md:px-[2%];
    }
  }
}

.logo-grid.size-small,
.logo-grid, /* default to small */ {
  .logos {
    @apply gap-y-12;

    > * {
      @apply w-1/2 md:w-1/3 lg:w-1/4 px-[6%] md:px-[3%];
    }

    :deep(.logo) {
      @apply min-h-12;
    }
  }
}

.logo-grid.size-medium {
  .logos {
    @apply gap-y-14;

    > * {
      @apply w-full md:w-1/2 lg:w-1/3 px-[15%] md:px-[5%];
    }

    :deep(.logo) {
      @apply sm:min-h-24;
    }
  }
}

.logo-grid.size-large {
  .logos {
    @apply gap-y-16;

    > * {
      @apply w-full lg:w-1/2 px-[10%] lg:px-[6%];
    }

    :deep(.logo) {
      @apply sm:min-h-36;
    }
  }
}

/* Display Inline */

.logo-grid.display-inline {
  @apply md:grid md:gap-12 md:grid-cols-12 md:items-center;

  :deep(.heading) {
    @apply mb-6 md:col-start-2 md:col-span-5 md:mb-0 lg:col-start-2 lg:col-span-6;
  }

  .logos {
    @apply md:col-span-5 lg:col-span-4;

    > * {
      @apply w-full px-[10%] md:px-[6%];
    }
  }
}
</style>
