<template>
  <div
    class="asset"
    :style="{ maxWidth: setMaxWidth && width && `${width}px` }"
  >
    <template v-if="filename || $slots.default">
      <div class="asset-container" :class="aspectRatioClass">
        <slot>
          <nuxt-img
            v-if="type === types.IMAGE"
            :src="filename"
            :alt="alt"
            loading="lazy"
            v-bind="computedImageOptions"
            @load="$emit('load', true)"
          />
          <video
            v-else-if="type === types.VIDEO"
            :src="filename"
            v-bind="computedVideoOptions"
            @loadeddata="$emit('load', true)"
          >
            Your browser does not support this file type.
          </video>
        </slot>
      </div>
      <ExploreTheLand
        v-if="hasInfo"
        :title="title"
        :description="name"
        :footnote="copyright"
        :land-trust-id="landTrust && landTrust.id"
      />
    </template>
  </div>
</template>

<script>
export const types = {
  IMAGE: 'image',
  VIDEO: 'video',
  PDF: 'pdf'
}

export function type(filename = '') {
  if (typeof filename !== 'string') {
    return
  }

  return filename.match(/.(jpg|jpeg|gif|png|tiff|bmp)(\?(.*))?$/gim)
    ? types.IMAGE
    : filename.match(/.(mp4|webm)(\?(.*))?$/gim)
    ? types.VIDEO
    : filename.match(/.(pdf)(\?(.*))?$/gim)
    ? types.PDF
    : undefined
}

export const typeIcons = {
  default: 'file-arrow-down',
  [types.IMAGE]: 'file-image',
  [types.PDF]: 'file-pdf',
  [types.VIDEO]: 'file-video'
}

export function typeIcon(filename) {
  const _type = type(filename)

  return _type in typeIcons ? typeIcons[_type] : typeIcons.default
}

export const aspectRatios = ['16:9', '4:3', '1:1', '3:2', '3:1', '3:4']

export function aspectRatioClass(aspectRatio = '') {
  switch (aspectRatio) {
    case '16:9':
      return 'aspect-w-16 aspect-h-9'

    case '4:3':
      return 'aspect-w-4 aspect-h-3'

    case '1:1':
      return 'aspect-w-1 aspect-h-1'

    case '3:2':
      return 'aspect-w-3 aspect-h-2'

    case '3:1':
      return 'aspect-w-3 aspect-h-1'

    case '3:4':
      return 'aspect-w-3 aspect-h-4'

    case '':
    default:
      return ''
  }
}

export default {
  props: {
    id: Number,
    filename: String,
    title: String,
    name: String,
    alt: String,
    copyright: String,
    focus: String,
    landTrust: Object,
    aspectRatio: {
      type: String,
      validator: (value) => ['', ...aspectRatios].includes(value)
    },
    imageOptions: Object,
    videoOptions: Object,
    setMaxWidth: Boolean
  },
  setup() {
    const img = useImage()

    return {
      img
    }
  },
  data() {
    return {
      types,
      landTrustData: undefined,
      aspectRatioClass: aspectRatioClass(this.aspectRatio),
      defaultImageOptions: {
        format: 'webp',
        quality: 60,
        fit: 'cover',
        modifiers: {
          gravity: 'subject'
        },
        width: 1248
      },
      defaultVideoOptions: {
        poster: undefined,
        autoplay: false,
        controls: true,
        loop: false,
        muted: false
      }
    }
  },
  computed: {
    type() {
      return type(this.filename)
    },
    hasAspectRatio() {
      return this.aspectRatio && this.aspectRatio.includes(':')
    },
    width() {
      return (
        this.computedImageOptions?.width || this.computedVideoOptions?.width
      )
    },
    computedImageOptions() {
      const options = lodash.merge(
        {},
        this.defaultImageOptions,
        this.imageOptions
      )

      // Calculate missing dimensions
      if (this.hasAspectRatio && options.width && !options.height) {
        // If aspect ratio, width, & !height, compute height
        const aspectRatio = this.aspectRatio.split(':')
        const height = options.width * (aspectRatio[1] / aspectRatio[0])
        options.height = Math.round(height)
      } else if (this.hasAspectRatio && options.height && !options.width) {
        // If aspect ratio, height, & !width, compute width
        const aspectRatio = this.aspectRatio.split(':')
        const width = options.height * (aspectRatio[0] / aspectRatio[1])
        options.width = Math.round(width)
      }

      if (!options.sizes) {
        options.sizes = [
          'xs:100vw',
          `max:${options.width}px`,
          `2x:${Math.round(options.width * 2)}px`
        ].join(' ')
      }

      return options
    },
    computedVideoOptions() {
      const options = lodash.merge(
        {},
        this.defaultVideoOptions,
        this.videoOptions
      )

      if (options.poster) {
        const { modifiers, sizes, ...imageOptions } = this.computedImageOptions
        options.poster = this.img(options.poster, imageOptions)
      }

      return options
    },
    hasInfo() {
      return this.title || this.name || this.copyright || this.landTrust?.id
    }
  }
}
</script>

<style lang="postcss" scoped>
.asset {
  @apply relative;

  img,
  video {
    @apply w-full object-cover object-center rounded-lg;
  }

  :deep(.explore-the-land) {
    @apply absolute right-0 bottom-0;
  }
}
</style>
