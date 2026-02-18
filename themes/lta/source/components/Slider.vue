<template>
  <div :id="id" v-editable="$props" class="slider" :id-name="idName">
    <Heading
      v-if="title"
      v-slot="{ title: headingTitle }"
      :title="title"
      :description="description"
      @id="headingId = $event"
    >
      {{ headingTitle }}
      <nav class="title-navigation">
        <ButtonComponent
          icon="chevron-left"
          size="large"
          variation="link"
          tag="button"
          :disabled="isPrevDisabled"
          aria-label="Previous Slide"
          @click="$refs.hooper?.slidePrev"
        />
        <ButtonComponent
          icon="chevron-right"
          size="large"
          variation="link"
          tag="button"
          :disabled="isNextDisabled"
          aria-label="Next Slide"
          @click="$refs.hooper?.slideNext"
        />
      </nav>
    </Heading>
    <hooper
      v-show="isLoaded"
      ref="hooper"
      :settings="hooperSettings"
      @loaded="onLoaded"
      @beforeSlide="onBeforeSlide"
      @slide="onSlide"
      @afterSlide="onAfterSlide"
      @updated="onUpdated"
    >
      <hooper-slide
        v-for="slide in slidesCombined" :key="slide.key"
        :class="{
          'self-start': slide.type === 'source-story' && ['Resource'].includes(slide.data?.content?.component)
        }"
      >
        <component
          v-if="slide.type === 'default'"
          :is="slide.data?.component"
          v-bind="lodash.merge({}, slide.data, sourceItemTemplateProps)"
          :disabled="isSliding"
        />
        <Item
          v-else-if="slide.type === 'source-loader'"
          v-bind="sourceItemTemplateProps"
          :show-loader="true"
          :show-loader-error="fetchingSourceError"
        />
        <Item
          v-else-if="slide.type === 'source-story'"
          v-bind="sourceItemTemplateProps"
          :source="slide.data"
          :disabled="isSliding"
        />
      </hooper-slide>
      <template #hooper-addons>
        <hooper-navigation>
          <template #hooper-prev>
            <IconBlob  icon="chevron-left" />
          </template>
          <template #hooper-next>
            <IconBlob  icon="chevron-right" />
          </template>
        </hooper-navigation>
        <hooper-progress />
      </template>
    </hooper>
    <footer v-if="footerButtons && footerButtons.length" class="footer">
      <ButtonComponent
        v-for="(button, index) in footerButtons"
        :key="index"
        v-bind="button"
      />
    </footer>
  </div>
</template>

<script>
import SourceMixin from '@/mixins/Source.mixin'

export default {
  mixins: [SourceMixin],
  props: {
    title: String,
    description: [Object, String],
    slides: {
      type: Array,
      default: () => []
    },
    slidesToShow: [Number, String],
    slidesToPeek: {
      type: Number,
      default: 0.0
    },
    footerButtons: Array,
    _editable: String
  },
  data() {
    return {
      defaultSettings: {
        wheelControl: false,
        trimWhiteSpace: true,
        breakpoints: {}
      },
      isLoaded: false,
      isSliding: false,
      currentSlide: undefined,
      slideBounds: undefined,
      headingId: undefined
    }
  },
  computed: {
    id() {
      return this.headingId?.id ? `${this.headingId.id}-slider` : undefined
    },
    idName() {
      return this.headingId?.name
    },
    slidesToShowNumber() {
      return this.slidesToShow ? parseInt(this.slidesToShow) : 3
    },
    hooper() {
      return this.$refs.hooper || {}
    },
    hooperSettings() {
      const settings = lodash.merge(
        {},
        this.defaultSettings
        // this.settings
      )

      /**
       * Insert custom slides-to-show per breakpoint into settings
       */
      const slidesPerBreakpoint = {
        DEFAULT: 1 + this.slidesToPeek
      }
      if (parseInt(this.slidesToShowNumber) > 1) {
        slidesPerBreakpoint.lg = 2 + this.slidesToPeek
      }
      if (parseInt(this.slidesToShowNumber) > 2) {
        slidesPerBreakpoint.xl = 3 + this.slidesToPeek
      }

      Object.entries(slidesPerBreakpoint).forEach(([key, value]) => {
        if (key.toLowerCase() === 'default') {
          settings.itemsToShow = value
        } else {
          if (!settings.breakpoints[key]) {
            settings.breakpoints[key] = {}
          }

          settings.breakpoints[key].itemsToShow = value
        }
      })

      // Transform breakpoints (Tailwind screens) to values
      settings.breakpoints = this.transformBreakpoints(settings.breakpoints)

      return settings
    },
    totalSlides() {
      return (
        (this.slides && this.slides.length) +
        (this.sourceStories && this.sourceStories.length)
      )
    },
    isPrevDisabled() {
      return this.currentSlide <= 0
    },
    isNextDisabled() {
      return this.slideBounds && this.slideBounds.upper >= this.totalSlides - 1
    },
    sourceLimitNumber() {
      return this.sourceLimit ? parseInt(this.sourceLimit) : 12
    },
    slidesCombined() {
      const slides = []

      if (this.slides && this.slides.length) {
        this.slides.forEach((slide, index) => {
          slides.push({
            type: 'default',
            key: `default-${index}`,
            data: slide
          })
        })
      }

      if (this.hasSource) {
        if (this.fetchingSource) {
          const sourceLoaders = Array.from({ length: this.sourceLimitNumber })

          sourceLoaders.forEach((index) => {
            slides.push({
              type: 'source-loader',
              key: `source-loader-${index}`,
              data: index
            })
          })
        } else if (this.sourceStories && this.sourceStories.length) {
          this.sourceStories.forEach((story, index) => {
            slides.push({
              type: 'source-story',
              key: `source-story-${index}`,
              data: story
            })
          })
        }
      }

      return slides
    }
  },
  async mounted() {
    await this.fetchSource()
  },
  methods: {
    transformBreakpoints(breakpoints = {}) {
      Object.entries(breakpoints).forEach(([key, value]) => {
        if (this.$theme.screens[key]) {
          breakpoints[parseInt(this.$theme.screens[key])] = value
          delete breakpoints[key]
        }
      })

      return breakpoints
    },
    onLoaded() {
      this.isLoaded = true

      this.$nextTick(this.$refs.hooper.updateWidth)

      // Add ARIA labels for accessibility
      const buttonPrev = this.$refs.hooper?.$el.querySelector('.hooper-prev')
      const buttonNext = this.$refs.hooper?.$el.querySelector('.hooper-next')

      if (buttonPrev) {
        buttonPrev.setAttribute('aria-label', 'Previous')
      }

      if (buttonNext) {
        buttonNext.setAttribute('aria-label', 'Next')
      }
    },
    onBeforeSlide() {
      if (this.isLoaded) {
        this.isSliding = true
      }
    },
    onSlide(payload) {
      this.currentSlide = payload.currentSlide
      this.slideBounds = this.$refs.hooper.slideBounds
    },
    onAfterSlide() {
      this.isSliding = false
    },
    onUpdated() {
      setTimeout(this.$refs.hooper.updateWidth, 1000)
    }
  }
}
</script>

<style lang="postcss" scoped>
.slider {
  --color-accent: theme('colors.blue');
}

:deep(.heading) {
  @apply mb-6;

  .title {
    @apply flex items-center;

    &-navigation {
      @apply ml-6;
    }
  }
}

:deep(.hooper) {
  @apply h-auto focus:outline-none;

  &-list {
    @apply bleed-container -mt-6 pt-6;
  }

  &-track,
  &-progress {
    @apply container;
  }

  &-track {
    /* required to make afterSlide event fire */
    @apply duration-[0s];
  }

  &-slide {
    @apply h-auto pr-12;

    > * {
      @apply h-full;
    }
  }

  &-prev,
  &-next {
    @apply hidden md:block -mt-4;

    &.is-disabled {
      @apply hidden;
    }
  }

  &-progress {
    @apply relative mt-8 h-[2px] bg-transparent;

    &:before {
      @apply block mb-[-2px] h-[2px] w-full bg-gradient-to-r from-line-2 via-line-2 content-[''];
    }

    &-inner {
      @apply bg-accent;
      min-width: theme('width.24');
    }
  }
}

.footer {
  @apply mt-4;
}
</style>
