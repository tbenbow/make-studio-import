<template>
  <Asset
    v-editable="$props"
    class="asset-image"
    v-bind="asset"
    :land-trust="landTrust"
    :aspect-ratio="aspectRatio"
    :image-options="imageOptions"
    :set-max-width="true"
  />
</template>

<script>
import { aspectRatios } from '@/components/Asset/Asset'

export default {
  props: {
    asset: {
      type: Object,
      required: true
    },
    landTrust: Object,
    aspectRatio: {
      type: String,
      validator: (value) => ['', ...aspectRatios].includes(value)
    },
    width: [String, Number],
    height: [String, Number],
    _editable: String
  },
  computed: {
    imageOptions() {
      const options = {
        width: this.width ? parseInt(this.width) : undefined,
        height: this.height ? parseInt(this.height) : undefined
      }

      return options
    }
  }
}
</script>
