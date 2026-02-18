<template>
  <div class="dialog">
    <header class="dialog-header">
      <button class="close-button" aria-label="Close" @click.prevent="close">
        <font-awesome-icon :icon="['fal', 'circle-xmark']" />
      </button>
      <slot name="header" v-bind="{ title }">
        <h4>{{ title }}</h4>
      </slot>
    </header>
    <div class="dialog-main">
      <slot>
        <RichText v-if="content" :document="content" />
      </slot>
    </div>
    <footer v-if="!hideFooter || $slots.footer" class="dialog-footer">
      <slot name="footer">
        <ButtonComponent
          v-if="buttonLinkIsValid"
          class="min-w-36"
          :name="buttonName || 'Learn more'"
          :link="buttonLink"
          icon="arrow-right"
        />
        <ButtonComponent
          v-else
          class="min-w-36"
          :name="buttonName || 'OK'"
          icon="check"
          @click="close"
        />
      </slot>
    </footer>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
    content: [Object, String],
    hideFooter: Boolean,
    buttonName: String,
    buttonLink: [Object, String]
  },
  setup(props) {
    const { isValid } = useLinkHelper(props.buttonLink)

    return {
      buttonLinkIsValid: isValid.value
    }
  },
  methods: {
    close() {
      this.$emit('close')
    }
  }
}
</script>

<style lang="postcss" scoped>
.dialog {
  --color-accent: theme('colors.green.DEFAULT');
  @apply w-cols-6 max-w-full bg-white rounded-lg shadow-dark;

  &-header {
    @apply relative p-6;

    .close-button {
      @apply absolute top-0 right-0 p-2 text-black-400 text-base leading-none cursor-pointer transition-colors hover:text-accent;
    }
  }

  &-main {
    @apply mt-2 mb-8 px-6;
  }

  &-footer {
    @apply flex justify-end p-6 border-t border-line;
  }
}
</style>
