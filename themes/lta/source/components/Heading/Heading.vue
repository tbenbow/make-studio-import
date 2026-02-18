<template>
  <div
    :id="idIsUnique && idComputed"
    v-editable="$props"
    :id-name="idIsUnique && idNameComputed"
    class="heading"
    :class="{ [`align-${align}`]: align, [`width-${width}`]: width }"
  >
    <slot name="before" />
    <header v-if="label || title || $slots.default || subtitle" class="header">
      <slot name="label">
        <Label v-if="label" :name="label" />
      </slot>
      <component
        :is="titleTagComputed"
        v-if="title"
        class="title"
        :class="titleClass"
      >
        <slot v-bind="{ title }">{{ title }}</slot>
      </component>
      <component :is="subtitleTag" v-if="subtitle" class="subtitle">{{
        subtitle
      }}</component>
    </header>
    <div v-if="hasDescription" class="main">
      <RichText
        class="description"
        :document="description"
        :size="descriptionSizeComputed"
        :loose="width === 'large'"
      >
        <template #before>
          <slot name="before-description" />
        </template>
        <slot name="description" />
        <template #after>
          <slot name="after-description" />
        </template>
      </RichText>
    </div>
    <footer v-if="$slots.footer" class="footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script>
import { documentIsValid } from '@/components/RichText'

export default {
  props: {
    label: String,
    title: String,
    titleTag: {
      type: String,
      validator: (value) =>
        ['', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(value)
    },
    titleClass: {
      type: String,
      validator: (value) =>
        ['', 'h0', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(value)
    },
    subtitle: String,
    description: [Object, String],
    descriptionSize: {
      type: String,
      validator: (value) =>
        ['', 'xsmall', 'small', 'default', 'large'].includes(value)
    },
    id: String,
    idName: String,
    align: {
      type: String,
      validator: (value) => ['', 'left', 'center'].includes(value)
    },
    width: {
      type: String,
      validator: (value) => ['', 'small', 'large'].includes(value)
    },
    _editable: String
  },
  data() {
    return {
      idIsUnique: false
    }
  },
  computed: {
    isRootFirstChild() {
      return (
        this.$attrs.root &&
        (this.$attrs.order === 0 || this.$attrs.order === '0')
      )
    },
    idComputed() {
      return this.id || changeCase.kebabCase(this.idNameComputed || '') || undefined
    },
    idNameComputed() {
      return this.idName || this.label || this.title
    },
    titleTagComputed() {
      return this.titleTag ? this.titleTag : this.isRootFirstChild ? 'h1' : 'h2'
    },
    subtitleTag() {
      const titleTagLevel = parseInt(this.titleTagComputed.charAt(1))

      return titleTagLevel < 5 ? `h${titleTagLevel + 2}` : 'p'
    },
    hasDescription() {
      return (
        documentIsValid(this.description) ||
        this.$slots.description ||
        this.$slots['before-description'] ||
        this.$slots['after-description']
      )
    },
    descriptionSizeComputed() {
      if (this.descriptionSize) {
        return this.descriptionSize
      }

      const titleTagLevel = parseInt(this.titleTagComputed.charAt(1))

      switch (titleTagLevel) {
        case 1:
        case 2:
          return 'large'

        case 5:
        case 6:
          return 'small'

        case 3:
        case 4:
        default:
          return undefined
      }
    }
  },
  watch: {
    idComputed: {
      immediate: true,
      handler(value) {
        this.$emit('id', {
          id: value,
          name: this.idNameComputed
        })
      }
    }
  },
  mounted() {
    this.idIsUnique = !document.getElementById(this.idComputed)
  }
}
</script>

<style lang="postcss" scoped>
.heading {
  .header {
    @apply lg:max-w-cols-9;
  }

  .main,
  .footer {
    @apply lg:max-w-cols-7;
  }
}

.header + .main,
.header + .footer {
  @apply mt-4;
}

.title {
  .label + & {
    @apply mt-4;
  }
}

.subtitle {
  @apply mt-2;
}
p.subtitle {
  @apply text-heading;
}

.footer {
  @apply mt-4 text-body-3;
}

/* Align */

.heading.align {
  &-center {
    @apply text-center;

    .header,
    .main,
    .footer {
      @apply mx-auto;
    }
  }
}

/* Width */

.heading.width {
  &-small {
    .header {
      @apply lg:max-w-cols-7;
    }

    .main,
    .footer {
      @apply lg:max-w-cols-6;
    }
  }

  &-large {
    .header {
      @apply lg:max-w-cols-11;
    }

    .main,
    .footer {
      @apply lg:max-w-cols-8;
    }
  }
}
</style>
