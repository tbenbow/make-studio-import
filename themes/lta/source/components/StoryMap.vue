<template>
  <div class="storymap">
    <ButtonComponent
      :name="popupBtnTxt ? popupBtnTxt : 'View StoryMap'"
      size="small"
      variation="solid"
      @click="showPopover = !showPopover"
    />
    <Popover
      v-show="showPopover"
      :active="showPopover"
      @close="showPopover = false"
    >
      <iframe
        ref="storymap"
        :src="storyMapURL || storyMapIDtoURL"
        width="100%"
        height="100%"
        frameborder="0"
        allowfullscreen
        allow="geolocation"
      ></iframe>
    </Popover>
  </div>
</template>

<script>
export default {
  props: {
    popupBtnTxt: String,
    storyMapURL: String,
    storyMapID: String,
    hideHeader: {
      type: Boolean,
      default: false
    },
    hideCover: {
      type: Boolean,
      default: false
    },
    _editable: String
  },
  data() {
    return {
      showPopover: false
    }
  },
  computed: {
    storyMapIDtoURL() {
      let theURL = 'https://storymaps.com/stories/'
      if (this.storyMapID) {
        theURL += this.storyMapID
      }
      if (this.hideHeader === false || this.hideCover) {
        theURL += '?'
      }
      if (this.hideHeader === false) {
        theURL += 'header'
      }
      if (this.hideHeader === false && this.hideCover) {
        theURL += '&'
      }
      if (this.hideCover) {
        theURL += 'cover=false'
      }
      return theURL
    }
  },
  watch: {
    showPopover(showPopover) {
      if (showPopover) {
        this.$bodyScroll.lock(this.$refs.storymap)
      } else {
        this.$bodyScroll.unlock(this.$refs.storymap)
      }
    }
  },
  methods: {
    handlePopoverLinkClick(_event, defaultHandler) {
      this.showPopover = false
      defaultHandler()
    }
  }
}
</script>
<style lang="postcss" scoped>
.storymap {
  :deep(.popover) {
    @apply h-screen w-screen inset-0 z-50 p-7;

    .close {
      @apply text-lg;
    }
  }
}
</style>
