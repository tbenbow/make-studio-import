<template>
  <div
    v-editable="$props"
    v-color="accentColor"
    class="callout"
    :class="{
      [`align-${align}`]: align,
      'no-wavy-top': noWavyTop,
      'no-wavy-bottom': noWavyBottom
    }"
  >
    <div class="callout-container">
      <div class="main">
        <aside v-if="icon || hasImage" class="icon">
          <nuxt-img
            v-if="hasImage"
            loading="lazy"
            v-bind="imageOptions"
            :src="image.filename"
            :alt="image.alt"
            width="576"
          />
          <IconBlob v-else :icon="icon" size="large" />
        </aside>
        <RichText class="content" :document="description">
          <template #before>
            <h3 v-if="title" class="title">{{ title }}</h3>
          </template>
          <slot />
        </RichText>
        <aside v-if="buttonLink && buttonName" class="buttons">
          <ButtonComponent :link="buttonLink" :name="buttonName" />
        </aside>
      </div>
    </div>
    <Edge v-if="!noWavyTop" type="wavy-top-inset" />
    <Edge v-if="!noWavyBottom" type="wavy-bottom-inset" />
  </div>
</template>

<script>
export default {
  props: {
    icon: String,
    image: [Object, String],
    imageOptions: Object,
    title: String,
    description: [Object, String],
    buttonName: String,
    buttonLink: [Object, String],
    accentColor: String,
    align: {
      type: String,
      validator: (value) => ['', 'left', 'center'].includes(value)
    },
    noWavyTop: Boolean,
    noWavyBottom: Boolean,
    _editable: String
  },
  computed: {
    hasImage() {
      return typeof this.image === 'object' && this.image.filename
    }
  }
}
</script>

<style lang="postcss" scoped>
.callout {
  @apply bleed-container relative py-12 items-center bg-black-100 shadow-inset;

  &-container {
    @apply container;
  }

  &:before {
    @apply absolute inset-0 -z-1 opacity-12 bg-center bg-repeat content-[''];
    background-image: url('@/assets/img/textures/grunge@2x.png');
    background-size: 800px;
  }
}

.main {
  @apply grid gap-6 grid-cols-1 lg:grid-cols-12 lg:gap-12 lg:items-center;

  .icon {
    @apply min-w-24 text-center lg:col-span-2;

    img {
      @apply inline-block align-top w-72;
    }
  }

  .content {
    @apply lg:col-span-6;
  }

  .buttons {
    @apply lg:col-span-4;

    &:nth-child(2) {
      @apply col-span-6;
    }
  }
}

.content {
  @apply text-center lg:text-left;
}

.buttons {
  @apply flex justify-center;

  :deep(.button) {
    @apply mt-0;
  }
}

/* Align */

.callout.align-center {
  .icon {
    @apply lg:col-span-3;
  }

  .content {
    @apply text-center;

    &:first-child,
    &:last-child {
      @apply lg:col-start-4;
    }
  }

  .buttons {
    @apply lg:col-span-3;
  }
}
</style>
