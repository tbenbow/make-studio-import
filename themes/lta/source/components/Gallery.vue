<template>
  <div class="gallery" :class="{ 'is-loaded': isLoaded }">
    <Asset
      v-if="images.length === 1"
      v-bind="images[0]"
      :aspect-ratio="aspectRatio || '16:9'"
      :image-options="imageOptions"
      @load="onLoaded"
    />
    <template v-else>
      <div class="hooper-container">
        <hooper
          ref="hooper"
          :settings="hooperSettings"
          @loaded="onLoaded"
          @slide="onSlide"
        >
          <hooper-slide v-for="(image, index) in images" :key="index">
            <Asset
              v-bind="image"
              :name="descriptionBelow ? undefined : image.name"
              :aspect-ratio="aspectRatio || '16:9'"
              :image-options="imageOptions"
            />
          </hooper-slide>
          <template #hooper-addons>
            <hooper-navigation>
              <template #hooper-prev>
                <ButtonComponent icon="chevron-left" />
              </template>
              <template #hooper-next>
                <ButtonComponent icon="chevron-right" />
              </template>
            </hooper-navigation>
          </template>
        </hooper>
        <ul class="thumbnails">
          <li v-for="(image, index) in images" :key="index">
            <button
              :class="{
                'is-current': index === currentIndex
              }"
              @click="slideTo(index)"
            >
              <nuxt-img
                :src="image.filename"
                :alt="image.title"
                format="jpg"
                height="128"
                width="128"
                fit="cover"
                loading="lazy"
              />
            </button>
          </li>
        </ul>
      </div>
      <RichText
        v-if="
          descriptionBelow && images[currentIndex] && images[currentIndex].name
        "
        class="description"
        size="small"
      >
        <p>{{ images[currentIndex].name }}</p>
      </RichText>
    </template>
  </div>
</template>

<script>
import { aspectRatios } from '@/components/Asset/Asset'

export default {
  props: {
    images: {
      type: Array,
      required: true
    },
    aspectRatio: {
      type: String,
      validator: (value) => ['', ...aspectRatios].includes(value)
    },
    autoPlay: Boolean,
    playSpeed: String,
    descriptionBelow: Boolean,
    imageOptions: Object
  },
  data() {
    return {
      defaultSettings: {
        itemsToShow: 1,
        wheelControl: false,
        trimWhiteSpace: true
      },
      currentIndex: 0,
      isLoaded: false
    }
  },
  computed: {
    hooperSettings() {
      const settings = {
        autoPlay: this.autoPlay,
        playSpeed: this.playSpeed ? parseInt(this.playSpeed) * 1000 : 5000
      }

      return lodash.merge({}, this.defaultSettings, settings)
    }
  },
  methods: {
    onLoaded() {
      this.isLoaded = true
    },
    onSlide(payload) {
      this.currentIndex = payload.currentSlide
    },
    slideTo(index) {
      this.$refs.hooper.slideTo(index)
    }
  }
}
</script>

<style lang="postcss" scoped>
.gallery {
  @apply invisible;
}

.hooper-container {
  @apply relative;
}

:deep(.hooper) {
  @apply focus:outline-none;

  &-navigation {
    .hooper-prev,
    .hooper-next {
      &.is-disabled {
        @apply opacity-0;
      }
    }

    .hooper-prev {
      @apply pl-0;

      .button {
        @apply rounded-l-none;
      }
    }

    .hooper-next {
      @apply pr-0;

      .button {
        @apply rounded-r-none;
      }
    }
  }
}

.thumbnails {
  @apply mt-4 flex gap-4 md:absolute md:left-0 md:bottom-0 md:overflow-auto md:gap-6 md:mt-0 md:p-6 md:pr-20;

  > * {
    @apply flex-shrink-0;
  }

  button {
    @apply relative block;

    &:after {
      @apply invisible absolute inset-0 opacity-38 bg-accent rounded;
      content: '';
    }
  }

  img {
    @apply relative h-12 w-12 rounded md:shadow-darker md:ring-2 md:ring-white;
  }

  button.is-current {
    &:after {
      @apply visible;
    }

    img {
      @apply ring-3 ring-accent;
    }
  }
}

.description {
  @apply mt-4;

  p {
    @apply text-body-3;
  }
}

/* Is Loaded */

.gallery.is-loaded {
  @apply visible;

  :deep(.hooper) {
    @apply h-full;
  }
}
</style>
