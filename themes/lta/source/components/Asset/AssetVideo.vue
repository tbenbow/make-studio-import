<template>
  <Embed
    v-if="assetUrl"
    v-editable="props"
    class="asset-video"
    :url="assetUrl"
    :aspect-ratio="aspectRatio"
    :width="width"
    :video-options="videoOptions"
  />
  <Asset
    v-else
    v-editable="$props"
    class="asset-video"
    v-bind="asset"
    :land-trust="landTrust"
    :aspect-ratio="aspectRatio"
    :video-options="videoOptions"
    :set-max-width="true"
  />
</template>

<script>
import { aspectRatios } from '@/components/Asset/Asset'

export default {
  props: {
    asset: Object,
    assetUrl: String,
    landTrust: Object,
    aspectRatio: {
      type: String,
      validator: (value) => ['', ...aspectRatios].includes(value)
    },
    poster: Object,
    width: [String, Number],
    autoplay: Boolean,
    loop: Boolean,
    muted: Boolean,
    _editable: String
  },
  computed: {
    videoOptions() {
      const options = {
        poster: this.poster?.filename,
        width: this.width ? parseInt(this.width) : undefined,
        autoplay: this.autoplay,
        loop: this.loop,
        muted: this.muted
      }

      return options
    }
  }
}
</script>
