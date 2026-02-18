<template>
  <ContentLoader
    class="item-loader"
    :animate="animate"
    :width="settings.width"
    :height="settings.height"
    :preserve-aspect-ratio="settings.preserveAspectRatio"
    primary-color="var(--color-line)"
    secondary-color="var(--color-line-2)"
    :unique-key="uniqueKey"
  >
    <rect
      x="0"
      y="0"
      :rx="isCard ? 0 : settings.radius"
      :ry="isCard ? 0 : settings.radius"
      :width="settings.imageWidth"
      :height="settings.imageHeight"
    />
    <template v-if="showContent">
      <rect
        :x="settings.contentX"
        :y="settings.contentY"
        :rx="settings.radius"
        :ry="settings.radius"
        :width="settings.contentWidth - 48"
        :height="settings.titleHeight"
      />
      <rect
        :x="settings.contentX"
        :y="settings.contentY + settings.titleHeight + settings.spacing"
        :rx="settings.radius"
        :ry="settings.radius"
        :width="settings.contentWidth - 144"
        :height="settings.textHeight"
      />
      <rect
        :x="settings.contentX"
        :y="
          settings.contentY +
          settings.titleHeight +
          settings.spacing +
          settings.textHeight +
          settings.spacing
        "
        :rx="settings.radius"
        :ry="settings.radius"
        :width="settings.contentWidth - 96"
        :height="settings.textHeight"
      />
    </template>
  </ContentLoader>
</template>

<script>
import { ContentLoader } from 'vue-content-loader'
import { types } from '@/mixins/Item.mixin'
import { uniq } from 'instantsearch.js/es/lib/utils'

export default {
  components: { ContentLoader },
  props: {
    type: {
      type: String,
      validator: (value) => !value || Object.values(types).includes(value)
    },
    animate: {
      type: Boolean,
      default: true
    }
  },
  setup() {
    const uniqueKey = useId()

    return {
      uniqueKey
    }
  },
  computed: {
    isCard() {
      return [types.CARD, types.CARD_HORIZONTAL].includes(this.type)
    },
    showContent() {
      return this.type !== types.IMAGE
    },
    settings() {
      const settings = {
        padding: 24,
        spacing: 16,
        radius: 0,
        imageWidth: 384,
        imageHeight: 216,
        titleHeight: 32,
        textHeight: 16,
        primaryColor: 'var(--color-line)',
        preserveAspectRatio: undefined
      }

      settings.width = settings.imageWidth
      settings.height =
        settings.imageHeight + settings.padding + this.contentHeight(settings)
      settings.contentX = 0
      settings.contentY = settings.imageHeight + settings.padding
      settings.contentWidth = settings.imageWidth

      switch (this.type) {
        case types.CARD:
          settings.height += settings.padding
          settings.contentX = settings.padding
          settings.contentWidth = settings.width - settings.padding * 2
          break

        case types.HORIZONTAL:
        case types.CARD_HORIZONTAL:
          settings.width = 1032
          settings.height = 216
          settings.imageWidth = settings.height
          settings.imageHeight = settings.height
          settings.contentX = settings.imageWidth + settings.padding
          settings.contentY =
            (settings.imageHeight - this.contentHeight(settings)) / 2
          settings.contentWidth = settings.width - settings.contentX
          break

        case types.IMAGE:
          settings.width = 816
          settings.height = 450
          settings.preserveAspectRatio = 'none'
          settings.imageWidth = settings.width
          settings.imageHeight = settings.height
          break

        case types.INLINE:
          settings.width = 1032
          settings.height = this.contentHeight(settings)
          settings.imageWidth = 108
          settings.imageHeight = 108
          settings.contentX = settings.imageWidth + settings.padding
          settings.contentY = 0
          settings.contentWidth = settings.width - settings.contentX
          break
      }

      return settings
    }
  },
  methods: {
    contentHeight(settings) {
      return (
        settings.titleHeight + settings.textHeight * 2 + settings.spacing * 2
      )
    }
  }
}
</script>
