<template>
  <section
    :id="id"
    v-editable="$props"
    :id-name="idName"
    class="layout-section"
    :class="{ [`background-color-${backgroundColor}`]: backgroundColor }"
  >
    <Edge v-if="topEdge" class="edge-top" :type="topEdge" />
    <EdgeSide v-if="leftEdge" class="edge-left" :type="leftEdge" />
    <Edge class="edge-bottom" type="wavy-bottom" />
    <Blocks v-if="blocks || $slots.default" :blocks="blocks">
      <slot />
    </Blocks>
  </section>
</template>

<script>
export default {
  props: {
    blocks: Array,
    id: String,
    idName: String,
    backgroundColor: {
      type: String,
      validator: (value) =>
        ['', 'white', 'green-dark', 'stone', 'gray'].includes(value)
    },
    topEdge: String,
    leftEdge: String,
    _editable: String
  }
}
</script>

<style lang="postcss" scoped>
.layout-section {
  @apply bleed-container relative py-24 bg-background;

  :deep(.edge-bottom) {
    @apply z-1;
    > svg {
      @apply mt-[-1px];
    }
  }

  :deep( > .blocks) {
    @apply container relative;

    > {
      &.banner:first-child {
        @apply -mt-24;
      }
    }
  }
}

/* Background Color */

.layout-section.background-color {
  &-green-dark {
    --color-accent: theme('colors.orange.DEFAULT');
    --color-heading: theme('colors.stone');
    --color-body: theme('colors.white.DEFAULT');
    --color-body-2: var(--color-body);
    --color-body-3: theme('colors.white.700');
    --color-body-4: theme('colors.white.300');
    --color-background: theme('colors.green.dark');
    --color-line: theme('colors.white.200');
    --color-line-2: theme('colors.white.300');

    :deep(.edge-top) {
      @apply opacity-20;
    }

    :deep(.banner) {
      .background .overlay {
        @apply bg-transparent bg-gradient-to-b;
        --tw-gradient-stops: rgba(theme('colors.green.dark'), 0.3),
          theme('colors.green.dark');

        .gradient-left,
        .gradient-right-bottom {
          @apply hidden;
        }
      }
    }

    :deep(.item-card) {
      --color-background: theme('colors.black.200');
    }

    :deep(.search-land-trusts),
    :deep(.search-resources) {
      input[type='text'] {
        @apply border-none;
      }
    }
  }

  &-stone {
    --color-background: theme('colors.stone');

    :deep(.banner) {
      .background .overlay {
        @apply bg-transparent bg-gradient-to-b;
        --tw-gradient-stops: rgba(theme('colors.stone'), 0.3),
          theme('colors.stone');
      }
    }

    :deep(.item-card) {
      --color-background: theme('colors.white.300');
    }

    :deep(.search-land-trusts),
    :deep(.search-resources) {
      input[type='text'] {
        @apply border-none;
      }
    }
  }

  &-gray {
    --color-background: theme('colors.black.100-solid');

    :deep(.item-card) {
      --color-background: theme('colors.white.DEFAULT');
    }
  }
}
</style>
